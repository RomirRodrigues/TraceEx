package com.traceex.model;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

public class Goal {
    private String id;
    private String name;
    private double targetAmount;
    private double currentAmount;
    private String deadline; // YYYY-MM-DD
    private String category;
    private String notes;

    public Goal() {
        this.id = UUID.randomUUID().toString();
        this.category = "Savings";
        this.notes = "";
    }

    public Goal(String name, double targetAmount, double currentAmount, String deadline, String category, String notes) {
        this.id = UUID.randomUUID().toString();
        this.name = name;
        this.targetAmount = targetAmount;
        this.currentAmount = currentAmount;
        this.deadline = deadline;
        this.category = category;
        this.notes = notes;
    }

    public Map<String, Object> toMap() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", id);
        map.put("name", name);
        map.put("targetAmount", targetAmount);
        map.put("currentAmount", currentAmount);
        map.put("deadline", deadline);
        map.put("category", category);
        map.put("notes", notes != null ? notes : "");
        double progress = targetAmount > 0 ? Math.min(100.0, (currentAmount / targetAmount) * 100.0) : 0.0;
        map.put("progressPercent", Math.round(progress * 10.0) / 10.0);
        return map;
    }

    public static Goal fromMap(Map<String, Object> map) {
        Goal g = new Goal();
        if (map.containsKey("id") && map.get("id") != null) {
            g.setId(map.get("id").toString());
        }
        g.setName((String) map.getOrDefault("name", "Goal"));
        Object tgt = map.get("targetAmount");
        if (tgt instanceof Number) {
            g.setTargetAmount(((Number) tgt).doubleValue());
        }
        Object cur = map.get("currentAmount");
        if (cur instanceof Number) {
            g.setCurrentAmount(((Number) cur).doubleValue());
        }
        g.setDeadline((String) map.getOrDefault("deadline", ""));
        g.setCategory((String) map.getOrDefault("category", "Savings"));
        g.setNotes((String) map.getOrDefault("notes", ""));
        return g;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public double getTargetAmount() { return targetAmount; }
    public void setTargetAmount(double targetAmount) { this.targetAmount = targetAmount; }

    public double getCurrentAmount() { return currentAmount; }
    public void setCurrentAmount(double currentAmount) { this.currentAmount = currentAmount; }

    public String getDeadline() { return deadline; }
    public void setDeadline(String deadline) { this.deadline = deadline; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
