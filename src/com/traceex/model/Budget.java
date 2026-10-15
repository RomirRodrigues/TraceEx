package com.traceex.model;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

public class Budget {
    private String id;
    private String category;
    private double limitAmount;
    private String month; // e.g. "2026-10" or "ALL"

    public Budget() {
        this.id = UUID.randomUUID().toString();
        this.month = "ALL";
    }

    public Budget(String category, double limitAmount, String month) {
        this.id = UUID.randomUUID().toString();
        this.category = category;
        this.limitAmount = limitAmount;
        this.month = (month != null && !month.trim().isEmpty()) ? month : "ALL";
    }

    public Map<String, Object> toMap() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", id);
        map.put("category", category);
        map.put("limitAmount", limitAmount);
        map.put("month", month);
        return map;
    }

    public static Budget fromMap(Map<String, Object> map) {
        Budget b = new Budget();
        if (map.containsKey("id") && map.get("id") != null) {
            b.setId(map.get("id").toString());
        }
        b.setCategory((String) map.getOrDefault("category", "General"));
        Object lim = map.get("limitAmount");
        if (lim instanceof Number) {
            b.setLimitAmount(((Number) lim).doubleValue());
        }
        b.setMonth((String) map.getOrDefault("month", "ALL"));
        return b;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public double getLimitAmount() { return limitAmount; }
    public void setLimitAmount(double limitAmount) { this.limitAmount = limitAmount; }

    public String getMonth() { return month; }
    public void setMonth(String month) { this.month = month; }
}
