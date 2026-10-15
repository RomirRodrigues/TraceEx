package com.traceex.service;

import com.traceex.model.Budget;
import com.traceex.model.Goal;
import com.traceex.model.Transaction;
import com.traceex.repository.DataStore;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

public class ExpenseService {
    private final DataStore dataStore;

    public ExpenseService() {
        this.dataStore = DataStore.getInstance();
    }

    public List<Transaction> getFilteredTransactions(String type, String category, String search,
                                                     String startDate, String endDate, String paymentMethod) {
        List<Transaction> list = dataStore.getAllTransactions();

        return list.stream().filter(t -> {
            if (type != null && !type.trim().isEmpty() && !type.equalsIgnoreCase("ALL")) {
                if (!t.getType().equalsIgnoreCase(type.trim())) return false;
            }
            if (category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("ALL")) {
                if (!t.getCategory().equalsIgnoreCase(category.trim())) return false;
            }
            if (paymentMethod != null && !paymentMethod.trim().isEmpty() && !paymentMethod.equalsIgnoreCase("ALL")) {
                if (!t.getPaymentMethod().equalsIgnoreCase(paymentMethod.trim())) return false;
            }
            if (startDate != null && !startDate.trim().isEmpty()) {
                if (t.getDate().compareTo(startDate.trim()) < 0) return false;
            }
            if (endDate != null && !endDate.trim().isEmpty()) {
                if (t.getDate().compareTo(endDate.trim()) > 0) return false;
            }
            if (search != null && !search.trim().isEmpty()) {
                String q = search.trim().toLowerCase();
                boolean matchesTitle = t.getTitle().toLowerCase().contains(q);
                boolean matchesCategory = t.getCategory().toLowerCase().contains(q);
                boolean matchesNotes = t.getNotes() != null && t.getNotes().toLowerCase().contains(q);
                boolean matchesPay = t.getPaymentMethod().toLowerCase().contains(q);
                if (!matchesTitle && !matchesCategory && !matchesNotes && !matchesPay) return false;
            }
            return true;
        }).sorted((a, b) -> b.getDate().compareTo(a.getDate()))
          .collect(Collectors.toList());
    }

    public Map<String, Object> getFinancialSummary(String targetMonth) {
        List<Transaction> all = dataStore.getAllTransactions();
        List<Budget> budgets = dataStore.getAllBudgets();
        List<Goal> goals = dataStore.getAllGoals();

        String currentMonth = (targetMonth != null && targetMonth.matches("\\d{4}-\\d{2}")) 
                ? targetMonth 
                : LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));

        // Monthly transactions
        List<Transaction> monthTx = all.stream()
                .filter(t -> t.getDate() != null && t.getDate().startsWith(currentMonth))
                .collect(Collectors.toList());

        double monthIncome = 0.0;
        double monthExpense = 0.0;
        Map<String, Double> categoryExpenseMap = new LinkedHashMap<>();
        Map<String, Double> categoryIncomeMap = new LinkedHashMap<>();
        Map<String, Double> paymentMethodMap = new LinkedHashMap<>();
        Map<String, Double> dailyExpenseMap = new TreeMap<>();

        for (Transaction t : monthTx) {
            double amt = t.getAmount();
            if ("INCOME".equalsIgnoreCase(t.getType())) {
                monthIncome += amt;
                categoryIncomeMap.put(t.getCategory(), categoryIncomeMap.getOrDefault(t.getCategory(), 0.0) + amt);
            } else {
                monthExpense += amt;
                categoryExpenseMap.put(t.getCategory(), categoryExpenseMap.getOrDefault(t.getCategory(), 0.0) + amt);
                paymentMethodMap.put(t.getPaymentMethod(), paymentMethodMap.getOrDefault(t.getPaymentMethod(), 0.0) + amt);

                String date = t.getDate();
                dailyExpenseMap.put(date, dailyExpenseMap.getOrDefault(date, 0.0) + amt);
            }
        }

        double monthBalance = monthIncome - monthExpense;
        double savingsRate = monthIncome > 0 ? Math.max(0.0, (monthBalance / monthIncome) * 100.0) : 0.0;

        // All-time totals
        double totalIncome = 0.0;
        double totalExpense = 0.0;
        for (Transaction t : all) {
            if ("INCOME".equalsIgnoreCase(t.getType())) {
                totalIncome += t.getAmount();
            } else {
                totalExpense += t.getAmount();
            }
        }
        double totalNetWorth = totalIncome - totalExpense;

        // Last 6 months trend
        List<Map<String, Object>> trends = new ArrayList<>();
        LocalDate cursor = LocalDate.now();
        for (int i = 5; i >= 0; i--) {
            String mStr = cursor.minusMonths(i).format(DateTimeFormatter.ofPattern("yyyy-MM"));
            double inc = 0.0;
            double exp = 0.0;
            for (Transaction t : all) {
                if (t.getDate() != null && t.getDate().startsWith(mStr)) {
                    if ("INCOME".equalsIgnoreCase(t.getType())) {
                        inc += t.getAmount();
                    } else {
                        exp += t.getAmount();
                    }
                }
            }
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("month", mStr);
            point.put("income", Math.round(inc * 100.0) / 100.0);
            point.put("expense", Math.round(exp * 100.0) / 100.0);
            point.put("net", Math.round((inc - exp) * 100.0) / 100.0);
            trends.add(point);
        }

        // Budget evaluation
        List<Map<String, Object>> budgetReports = new ArrayList<>();
        for (Budget b : budgets) {
            String bMonth = b.getMonth();
            if ("ALL".equalsIgnoreCase(bMonth) || currentMonth.equalsIgnoreCase(bMonth)) {
                double spent = categoryExpenseMap.getOrDefault(b.getCategory(), 0.0);
                double limit = b.getLimitAmount();
                double percent = limit > 0 ? (spent / limit) * 100.0 : 0.0;
                String status = percent > 100.0 ? "EXCEEDED" : (percent >= 80.0 ? "WARNING" : "NORMAL");

                Map<String, Object> br = new LinkedHashMap<>(b.toMap());
                br.put("spent", Math.round(spent * 100.0) / 100.0);
                br.put("remaining", Math.round((limit - spent) * 100.0) / 100.0);
                br.put("percent", Math.round(percent * 10.0) / 10.0);
                br.put("status", status);
                budgetReports.add(br);
            }
        }

        // Top 5 biggest expenses this month
        List<Map<String, Object>> topExpenses = monthTx.stream()
                .filter(t -> "EXPENSE".equalsIgnoreCase(t.getType()))
                .sorted((a, b) -> Double.compare(b.getAmount(), a.getAmount()))
                .limit(5)
                .map(Transaction::toMap)
                .collect(Collectors.toList());

        // Recent 5 transactions
        List<Map<String, Object>> recentTx = all.stream()
                .sorted((a, b) -> b.getDate().compareTo(a.getDate()))
                .limit(6)
                .map(Transaction::toMap)
                .collect(Collectors.toList());

        // Format Category Expense Breakdown with percentages
        List<Map<String, Object>> categoryBreakdown = new ArrayList<>();
        for (Map.Entry<String, Double> entry : categoryExpenseMap.entrySet()) {
            Map<String, Object> catMap = new LinkedHashMap<>();
            catMap.put("category", entry.getKey());
            catMap.put("amount", Math.round(entry.getValue() * 100.0) / 100.0);
            double pct = monthExpense > 0 ? (entry.getValue() / monthExpense) * 100.0 : 0.0;
            catMap.put("percent", Math.round(pct * 10.0) / 10.0);
            categoryBreakdown.add(catMap);
        }
        categoryBreakdown.sort((a, b) -> Double.compare((Double) b.get("amount"), (Double) a.get("amount")));

        // Assemble Summary Object
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("selectedMonth", currentMonth);
        summary.put("monthlyIncome", Math.round(monthIncome * 100.0) / 100.0);
        summary.put("monthlyExpense", Math.round(monthExpense * 100.0) / 100.0);
        summary.put("monthlyBalance", Math.round(monthBalance * 100.0) / 100.0);
        summary.put("savingsRate", Math.round(savingsRate * 10.0) / 10.0);

        summary.put("totalNetWorth", Math.round(totalNetWorth * 100.0) / 100.0);
        summary.put("totalIncomeAllTime", Math.round(totalIncome * 100.0) / 100.0);
        summary.put("totalExpenseAllTime", Math.round(totalExpense * 100.0) / 100.0);
        summary.put("transactionCount", all.size());

        summary.put("trends", trends);
        summary.put("categoryBreakdown", categoryBreakdown);
        summary.put("paymentMethods", paymentMethodMap);
        summary.put("dailyExpenses", dailyExpenseMap);
        summary.put("budgetReports", budgetReports);
        summary.put("goals", goals.stream().map(Goal::toMap).collect(Collectors.toList()));
        summary.put("topExpenses", topExpenses);
        summary.put("recentTransactions", recentTx);
        summary.put("settings", dataStore.getSettings());

        return summary;
    }

    public String exportCsv() {
        List<Transaction> list = dataStore.getAllTransactions();
        StringBuilder sb = new StringBuilder();
        sb.append("ID,Date,Title,Type,Category,Amount,Payment Method,Recurring,Notes\n");
        for (Transaction t : list) {
            sb.append(escapeCsv(t.getId())).append(",")
              .append(escapeCsv(t.getDate())).append(",")
              .append(escapeCsv(t.getTitle())).append(",")
              .append(escapeCsv(t.getType())).append(",")
              .append(escapeCsv(t.getCategory())).append(",")
              .append(String.format(Locale.US, "%.2f", t.getAmount())).append(",")
              .append(escapeCsv(t.getPaymentMethod())).append(",")
              .append(t.isRecurring() ? "Yes" : "No").append(",")
              .append(escapeCsv(t.getNotes()))
              .append("\n");
        }
        return sb.toString();
    }

    private String escapeCsv(String val) {
        if (val == null) return "\"\"";
        String s = val.replace("\"", "\"\"");
        return "\"" + s + "\"";
    }
}
