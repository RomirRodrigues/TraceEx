package com.traceex.util;

import com.traceex.model.Budget;
import com.traceex.model.Goal;
import com.traceex.model.Transaction;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

public class SampleDataGenerator {

    public static List<Transaction> createSampleTransactions() {
        List<Transaction> list = new ArrayList<>();
        LocalDate now = LocalDate.now();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        // Income - current month & previous month
        list.add(new Transaction("Tech Corp Salary", 5200.00, "INCOME", "Salary", 
                now.withDayOfMonth(1).format(dtf), "Bank Transfer", "Monthly direct deposit", true));
        list.add(new Transaction("UI/UX Freelance Project", 1450.00, "INCOME", "Freelance", 
                now.minusDays(4).format(dtf), "Bank Transfer", "Client dashboard redesign project", false));
        list.add(new Transaction("Dividend Payout", 280.00, "INCOME", "Investment", 
                now.minusDays(10).format(dtf), "Bank Transfer", "Index fund quarterly dividends", false));
        list.add(new Transaction("Previous Month Salary", 5200.00, "INCOME", "Salary", 
                now.minusMonths(1).withDayOfMonth(1).format(dtf), "Bank Transfer", "Direct deposit", true));
        list.add(new Transaction("Mobile App Consulting", 1800.00, "INCOME", "Freelance", 
                now.minusMonths(1).withDayOfMonth(15).format(dtf), "Bank Transfer", "Architecture review", false));
        list.add(new Transaction("Earlier Month Salary", 5200.00, "INCOME", "Salary", 
                now.minusMonths(2).withDayOfMonth(1).format(dtf), "Bank Transfer", "Direct deposit", true));

        // Expenses - current month
        list.add(new Transaction("Apartment Rent", 1400.00, "EXPENSE", "Housing & Rent", 
                now.withDayOfMonth(2).format(dtf), "Bank Transfer", "October Rent payment", true));
        list.add(new Transaction("Whole Foods Grocery Run", 164.50, "EXPENSE", "Food & Dining", 
                now.minusDays(1).format(dtf), "Credit Card", "Weekly pantry restock & fresh produce", false));
        list.add(new Transaction("Blue Bottle Artisan Coffee", 14.80, "EXPENSE", "Food & Dining", 
                now.minusDays(2).format(dtf), "UPI", "Morning brew with team", false));
        list.add(new Transaction("Uber Ride to Downtown", 28.50, "EXPENSE", "Transportation", 
                now.minusDays(3).format(dtf), "Credit Card", "Client meeting transport", false));
        list.add(new Transaction("High-Speed Fiber Internet", 79.99, "EXPENSE", "Utilities", 
                now.minusDays(5).format(dtf), "Debit Card", "Gigabit home internet auto-pay", true));
        list.add(new Transaction("Electricity & Power Bill", 112.40, "EXPENSE", "Utilities", 
                now.minusDays(7).format(dtf), "Debit Card", "City electric bill", false));
        list.add(new Transaction("Weekend Gourmet Dinner", 96.20, "EXPENSE", "Food & Dining", 
                now.minusDays(6).format(dtf), "Credit Card", "Dinner celebration with friends", false));
        list.add(new Transaction("Mechanical Keyboard Keycaps", 65.00, "EXPENSE", "Shopping", 
                now.minusDays(8).format(dtf), "Credit Card", "PBT custom keycap set", false));
        list.add(new Transaction("Netflix & Spotify Subscriptions", 27.98, "EXPENSE", "Entertainment", 
                now.minusDays(9).format(dtf), "Credit Card", "Monthly entertainment bundle", true));
        list.add(new Transaction("Subway Transit Card Top-up", 45.00, "EXPENSE", "Transportation", 
                now.minusDays(11).format(dtf), "UPI", "Metro monthly recharge", false));
        list.add(new Transaction("Annual Health Checkup & Vitamins", 140.00, "EXPENSE", "Healthcare", 
                now.minusDays(13).format(dtf), "Credit Card", "Preventative diagnostics & supplements", false));
        list.add(new Transaction("Cloud VPS Server Hosting", 32.00, "EXPENSE", "Utilities", 
                now.minusDays(14).format(dtf), "Credit Card", "Personal dev server", true));

        // Expenses - previous month
        list.add(new Transaction("Apartment Rent", 1400.00, "EXPENSE", "Housing & Rent", 
                now.minusMonths(1).withDayOfMonth(2).format(dtf), "Bank Transfer", "Rent payment", true));
        list.add(new Transaction("Groceries & Farmers Market", 480.00, "EXPENSE", "Food & Dining", 
                now.minusMonths(1).withDayOfMonth(12).format(dtf), "Credit Card", "Monthly groceries", false));
        list.add(new Transaction("Gas & Fuel Station", 125.00, "EXPENSE", "Transportation", 
                now.minusMonths(1).withDayOfMonth(18).format(dtf), "Debit Card", "Full tank refill", false));
        list.add(new Transaction("Concert Tickets", 185.00, "EXPENSE", "Entertainment", 
                now.minusMonths(1).withDayOfMonth(22).format(dtf), "Credit Card", "Live music event", false));
        list.add(new Transaction("New Ergonomic Desk Chair", 350.00, "EXPENSE", "Shopping", 
                now.minusMonths(1).withDayOfMonth(25).format(dtf), "Credit Card", "Lumbar support chair", false));

        // Expenses - 2 months ago
        list.add(new Transaction("Apartment Rent", 1400.00, "EXPENSE", "Housing & Rent", 
                now.minusMonths(2).withDayOfMonth(2).format(dtf), "Bank Transfer", "Rent payment", true));
        list.add(new Transaction("Groceries Restock", 440.00, "EXPENSE", "Food & Dining", 
                now.minusMonths(2).withDayOfMonth(10).format(dtf), "Credit Card", "Supermarket run", false));
        list.add(new Transaction("Flight Tickets to Conference", 420.00, "EXPENSE", "Transportation", 
                now.minusMonths(2).withDayOfMonth(15).format(dtf), "Credit Card", "Tech conference flight", false));

        return list;
    }

    public static List<Budget> createSampleBudgets() {
        List<Budget> list = new ArrayList<>();
        list.add(new Budget("Food & Dining", 650.00, "ALL"));
        list.add(new Budget("Housing & Rent", 1500.00, "ALL"));
        list.add(new Budget("Transportation", 250.00, "ALL"));
        list.add(new Budget("Shopping", 300.00, "ALL"));
        list.add(new Budget("Utilities", 250.00, "ALL"));
        list.add(new Budget("Entertainment", 150.00, "ALL"));
        list.add(new Budget("Healthcare", 200.00, "ALL"));
        return list;
    }

    public static List<Goal> createSampleGoals() {
        List<Goal> list = new ArrayList<>();
        LocalDate now = LocalDate.now();
        list.add(new Goal("Emergency Safety Fund", 10000.00, 7250.00, 
                now.plusMonths(4).toString(), "Safety", "6 months of essential living expenses reserved"));
        list.add(new Goal("Tokyo Autumn Vacation", 3500.00, 2400.00, 
                now.plusMonths(7).toString(), "Travel", "Flights, boutique ryokans, and culinary tour"));
        list.add(new Goal("M3 Max MacBook Pro", 3200.00, 3200.00, 
                now.minusDays(5).toString(), "Technology", "Completed goal for new engineering workstation!"));
        list.add(new Goal("Home Studio Audio Gear", 1200.00, 480.00, 
                now.plusMonths(2).toString(), "Hobbies", "Acoustic treatment and audio monitors"));
        return list;
    }
}
