package com.traceex.repository;

import com.traceex.model.Budget;
import com.traceex.model.Goal;
import com.traceex.model.Transaction;
import com.traceex.server.JsonUtils;
import com.traceex.util.SampleDataGenerator;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.locks.ReentrantReadWriteLock;

public class DataStore {
    private static final String DATA_FILE = "data/traceex_data.json";
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();

    private final List<Transaction> transactions = new ArrayList<>();
    private final List<Budget> budgets = new ArrayList<>();
    private final List<Goal> goals = new ArrayList<>();
    private final Map<String, Object> settings = new LinkedHashMap<>();

    private static DataStore instance;

    public static synchronized DataStore getInstance() {
        if (instance == null) {
            instance = new DataStore();
            instance.load();
        }
        return instance;
    }

    private DataStore() {
        // Defaults
        settings.put("currency", "$");
        settings.put("currencyCode", "USD");
        settings.put("userName", "Alex Rivera");
        settings.put("theme", "dark");
    }

    // ================= PERSISTENCE =================

    public void load() {
        lock.writeLock().lock();
        try {
            File file = new File(DATA_FILE);
            if (!file.exists()) {
                System.out.println("[TraceEx] Initializing with fresh sample data...");
                resetToSampleData();
                save();
                return;
            }

            String content = new String(Files.readAllBytes(file.toPath()), StandardCharsets.UTF_8);
            Map<String, Object> root = JsonUtils.parseObject(content);

            transactions.clear();
            budgets.clear();
            goals.clear();

            Object txList = root.get("transactions");
            if (txList instanceof List) {
                for (Object item : (List<?>) txList) {
                    if (item instanceof Map) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> m = (Map<String, Object>) item;
                        transactions.add(Transaction.fromMap(m));
                    }
                }
            }

            Object bgList = root.get("budgets");
            if (bgList instanceof List) {
                for (Object item : (List<?>) bgList) {
                    if (item instanceof Map) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> m = (Map<String, Object>) item;
                        budgets.add(Budget.fromMap(m));
                    }
                }
            }

            Object gList = root.get("goals");
            if (gList instanceof List) {
                for (Object item : (List<?>) gList) {
                    if (item instanceof Map) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> m = (Map<String, Object>) item;
                        goals.add(Goal.fromMap(m));
                    }
                }
            }

            Object stMap = root.get("settings");
            if (stMap instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> m = (Map<String, Object>) stMap;
                settings.putAll(m);
            }

            System.out.println("[TraceEx] Successfully loaded " + transactions.size() + " transactions, " 
                    + budgets.size() + " budgets, " + goals.size() + " goals from storage.");

        } catch (Exception e) {
            System.err.println("[TraceEx] Failed to load data file, falling back to sample data: " + e.getMessage());
            resetToSampleData();
        } finally {
            lock.writeLock().unlock();
        }
    }

    public void save() {
        lock.readLock().lock();
        try {
            Map<String, Object> root = new LinkedHashMap<>();

            List<Map<String, Object>> txMaps = new ArrayList<>();
            for (Transaction t : transactions) {
                txMaps.add(t.toMap());
            }
            root.put("transactions", txMaps);

            List<Map<String, Object>> bgMaps = new ArrayList<>();
            for (Budget b : budgets) {
                bgMaps.add(b.toMap());
            }
            root.put("budgets", bgMaps);

            List<Map<String, Object>> gMaps = new ArrayList<>();
            for (Goal g : goals) {
                gMaps.add(g.toMap());
            }
            root.put("goals", gMaps);

            root.put("settings", settings);

            String json = JsonUtils.toJson(root);

            Path parent = Paths.get("data");
            if (!Files.exists(parent)) {
                Files.createDirectories(parent);
            }

            Files.write(Paths.get(DATA_FILE), json.getBytes(StandardCharsets.UTF_8));
        } catch (IOException e) {
            System.err.println("[TraceEx] Error writing data to disk: " + e.getMessage());
        } finally {
            lock.readLock().unlock();
        }
    }

    public void resetToSampleData() {
        transactions.clear();
        budgets.clear();
        goals.clear();

        transactions.addAll(SampleDataGenerator.createSampleTransactions());
        budgets.addAll(SampleDataGenerator.createSampleBudgets());
        goals.addAll(SampleDataGenerator.createSampleGoals());
        settings.put("currency", "$");
        settings.put("currencyCode", "USD");
        settings.put("userName", "Alex Rivera");
        settings.put("theme", "dark");
    }

    // ================= TRANSACTIONS CRUD =================

    public List<Transaction> getAllTransactions() {
        lock.readLock().lock();
        try {
            return new ArrayList<>(transactions);
        } finally {
            lock.readLock().unlock();
        }
    }

    public Optional<Transaction> getTransactionById(String id) {
        lock.readLock().lock();
        try {
            return transactions.stream().filter(t -> t.getId().equals(id)).findFirst();
        } finally {
            lock.readLock().unlock();
        }
    }

    public void addTransaction(Transaction t) {
        lock.writeLock().lock();
        try {
            transactions.add(0, t); // add newest at top
            save();
        } finally {
            lock.writeLock().unlock();
        }
    }

    public boolean updateTransaction(Transaction updated) {
        lock.writeLock().lock();
        try {
            for (int i = 0; i < transactions.size(); i++) {
                if (transactions.get(i).getId().equals(updated.getId())) {
                    transactions.set(i, updated);
                    save();
                    return true;
                }
            }
            return false;
        } finally {
            lock.writeLock().unlock();
        }
    }

    public boolean deleteTransaction(String id) {
        lock.writeLock().lock();
        try {
            boolean removed = transactions.removeIf(t -> t.getId().equals(id));
            if (removed) {
                save();
            }
            return removed;
        } finally {
            lock.writeLock().unlock();
        }
    }

    // ================= BUDGETS CRUD =================

    public List<Budget> getAllBudgets() {
        lock.readLock().lock();
        try {
            return new ArrayList<>(budgets);
        } finally {
            lock.readLock().unlock();
        }
    }

    public void setBudget(Budget budget) {
        lock.writeLock().lock();
        try {
            // Check if budget for this category and month exists, update it or add
            boolean found = false;
            for (int i = 0; i < budgets.size(); i++) {
                Budget b = budgets.get(i);
                if (b.getCategory().equalsIgnoreCase(budget.getCategory()) && 
                    b.getMonth().equalsIgnoreCase(budget.getMonth())) {
                    budget.setId(b.getId());
                    budgets.set(i, budget);
                    found = true;
                    break;
                }
            }
            if (!found) {
                budgets.add(budget);
            }
            save();
        } finally {
            lock.writeLock().unlock();
        }
    }

    public boolean deleteBudget(String id) {
        lock.writeLock().lock();
        try {
            boolean removed = budgets.removeIf(b -> b.getId().equals(id));
            if (removed) {
                save();
            }
            return removed;
        } finally {
            lock.writeLock().unlock();
        }
    }

    // ================= GOALS CRUD =================

    public List<Goal> getAllGoals() {
        lock.readLock().lock();
        try {
            return new ArrayList<>(goals);
        } finally {
            lock.readLock().unlock();
        }
    }

    public void addGoal(Goal g) {
        lock.writeLock().lock();
        try {
            goals.add(g);
            save();
        } finally {
            lock.writeLock().unlock();
        }
    }

    public boolean updateGoal(Goal updated) {
        lock.writeLock().lock();
        try {
            for (int i = 0; i < goals.size(); i++) {
                if (goals.get(i).getId().equals(updated.getId())) {
                    goals.set(i, updated);
                    save();
                    return true;
                }
            }
            return false;
        } finally {
            lock.writeLock().unlock();
        }
    }

    public boolean deleteGoal(String id) {
        lock.writeLock().lock();
        try {
            boolean removed = goals.removeIf(g -> g.getId().equals(id));
            if (removed) {
                save();
            }
            return removed;
        } finally {
            lock.writeLock().unlock();
        }
    }

    // ================= SETTINGS =================

    public Map<String, Object> getSettings() {
        lock.readLock().lock();
        try {
            return new LinkedHashMap<>(settings);
        } finally {
            lock.readLock().unlock();
        }
    }

    public void updateSettings(Map<String, Object> newSettings) {
        lock.writeLock().lock();
        try {
            settings.putAll(newSettings);
            save();
        } finally {
            lock.writeLock().unlock();
        }
    }

    public void clearAll() {
        lock.writeLock().lock();
        try {
            transactions.clear();
            budgets.clear();
            goals.clear();
            save();
        } finally {
            lock.writeLock().unlock();
        }
    }
}
