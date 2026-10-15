package com.traceex.model;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

public class Transaction {
    private String id;
    private String title;
    private double amount;
    private String type; // "EXPENSE" or "INCOME"
    private String category;
    private String date; // YYYY-MM-DD
    private String paymentMethod; // Cash, Credit Card, Debit Card, UPI, Bank Transfer, Crypto
    private String notes;
    private boolean isRecurring;

    public Transaction() {
        this.id = UUID.randomUUID().toString();
        this.date = java.time.LocalDate.now().toString();
        this.type = "EXPENSE";
        this.category = "Other";
        this.paymentMethod = "Cash";
        this.notes = "";
        this.isRecurring = false;
    }

    public Transaction(String title, double amount, String type, String category, 
                       String date, String paymentMethod, String notes, boolean isRecurring) {
        this.id = UUID.randomUUID().toString();
        this.title = title;
        this.amount = amount;
        this.type = (type != null) ? type.toUpperCase() : "EXPENSE";
        this.category = category;
        this.date = date;
        this.paymentMethod = paymentMethod;
        this.notes = notes;
        this.isRecurring = isRecurring;
    }

    public Map<String, Object> toMap() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", id);
        map.put("title", title);
        map.put("amount", amount);
        map.put("type", type);
        map.put("category", category);
        map.put("date", date);
        map.put("paymentMethod", paymentMethod);
        map.put("notes", notes != null ? notes : "");
        map.put("isRecurring", isRecurring);
        return map;
    }

    public static Transaction fromMap(Map<String, Object> map) {
        Transaction t = new Transaction();
        if (map.containsKey("id") && map.get("id") != null) {
            t.setId(map.get("id").toString());
        }
        t.setTitle((String) map.getOrDefault("title", "Untitled"));
        Object amt = map.get("amount");
        if (amt instanceof Number) {
            t.setAmount(((Number) amt).doubleValue());
        }
        t.setType((String) map.getOrDefault("type", "EXPENSE"));
        t.setCategory((String) map.getOrDefault("category", "General"));
        t.setDate((String) map.getOrDefault("date", java.time.LocalDate.now().toString()));
        t.setPaymentMethod((String) map.getOrDefault("paymentMethod", "Cash"));
        t.setNotes((String) map.getOrDefault("notes", ""));
        Object rec = map.get("isRecurring");
        if (rec instanceof Boolean) {
            t.setRecurring((Boolean) rec);
        }
        return t;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }

    public String getType() { return type; }
    public void setType(String type) { this.type = (type != null) ? type.toUpperCase() : "EXPENSE"; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public boolean isRecurring() { return isRecurring; }
    public void setRecurring(boolean recurring) { isRecurring = recurring; }
}
