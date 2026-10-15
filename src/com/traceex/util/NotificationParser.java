package com.traceex.util;

import com.traceex.model.Transaction;

import java.time.LocalDate;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Intelligent SMS & Payment Notification Parser for Indian & Global Mobile Payment Apps
 * (Google Pay, PhonePe, Paytm, BHIM, Apple Pay, Chase, HDFC, SBI, ICICI, etc.)
 */
public class NotificationParser {

    private static final Pattern AMOUNT_PATTERN = Pattern.compile(
            "(?:(?:Rs\\.?|INR|₹|\\$|USD|EUR|€|GBP|£)\\s*([0-9,]+(?:\\.[0-9]{1,2})?))|" +
            "(?:([0-9,]+(?:\\.[0-9]{1,2})?)\\s*(?:Rs\\.?|INR|₹|USD|EUR))",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern MERCHANT_PATTERN = Pattern.compile(
            "(?:(?:to|at|vpa|paid to|spent at|transferred to|towards)\\s+([A-Za-z0-9&\\.\\-\\s]{2,30}?)(?:\\s+(?:on|using|via|ref|upi|avl|bal|a/c|card)|[\\.,]|$))",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern CREDIT_PATTERN = Pattern.compile(
            "(?:credited|received|deposited|refunded|cashback|bonus|salary)",
            Pattern.CASE_INSENSITIVE
    );

    public static Transaction parseNotification(String text) {
        if (text == null || text.trim().isEmpty()) {
            return null;
        }

        Transaction tx = new Transaction();
        tx.setDate(LocalDate.now().toString());

        // 1. Detect Type: Income vs Expense
        boolean isCredit = CREDIT_PATTERN.matcher(text).find();
        tx.setType(isCredit ? "INCOME" : "EXPENSE");

        // 2. Extract Amount
        Matcher amtMatcher = AMOUNT_PATTERN.matcher(text);
        if (amtMatcher.find()) {
            String rawAmt = amtMatcher.group(1) != null ? amtMatcher.group(1) : amtMatcher.group(2);
            if (rawAmt != null) {
                rawAmt = rawAmt.replace(",", "").trim();
                try {
                    tx.setAmount(Double.parseDouble(rawAmt));
                } catch (NumberFormatException ignored) {}
            }
        }

        // 3. Extract Merchant / Payee
        String merchant = "Mobile Payment";
        Matcher merMatcher = MERCHANT_PATTERN.matcher(text);
        if (merMatcher.find()) {
            String found = merMatcher.group(1).trim();
            // remove trailing words like "on", "using", "from"
            found = found.replaceAll("(?i)\\b(on|using|from|via|ref|for|by)\\b.*$", "").trim();
            if (found.length() >= 2) {
                merchant = found;
            }
        }
        tx.setTitle(cleanTitle(merchant));

        // 4. Payment Method Detection
        String lower = text.toLowerCase();
        if (lower.contains("google pay") || lower.contains("gpay")) {
            tx.setPaymentMethod("UPI");
            tx.setNotes("Google Pay Notification");
        } else if (lower.contains("phonepe")) {
            tx.setPaymentMethod("UPI");
            tx.setNotes("PhonePe Notification");
        } else if (lower.contains("paytm")) {
            tx.setPaymentMethod("UPI");
            tx.setNotes("Paytm Notification");
        } else if (lower.contains("apple pay")) {
            tx.setPaymentMethod("Credit Card");
            tx.setNotes("Apple Pay Alert");
        } else if (lower.contains("upi")) {
            tx.setPaymentMethod("UPI");
            tx.setNotes("UPI Live Sync");
        } else if (lower.contains("credit card") || lower.contains("ending") || lower.contains("card")) {
            tx.setPaymentMethod("Credit Card");
            tx.setNotes("Card Notification");
        } else if (lower.contains("debit card")) {
            tx.setPaymentMethod("Debit Card");
            tx.setNotes("Debit Card Notification");
        } else if (lower.contains("a/c") || lower.contains("account") || lower.contains("bank") || lower.contains("neft") || lower.contains("imps")) {
            tx.setPaymentMethod("Bank Transfer");
            tx.setNotes("Bank Alert Sync");
        } else {
            tx.setPaymentMethod("UPI");
            tx.setNotes("Mobile Payment Sync");
        }

        // 5. Intelligent Category Assignment
        tx.setCategory(detectCategory(tx.getTitle(), lower, isCredit));

        return tx;
    }

    private static String detectCategory(String merchant, String lowerText, boolean isCredit) {
        if (isCredit) {
            if (lowerText.contains("salary") || lowerText.contains("payroll")) return "Salary";
            if (lowerText.contains("dividend") || lowerText.contains("interest") || lowerText.contains("stock") || lowerText.contains("mf")) return "Investment";
            return "Freelance";
        }

        String search = (merchant + " " + lowerText).toLowerCase();

        if (containsAny(search, "swiggy", "zomato", "starbucks", "mcdonald", "burger", "cafe", "coffee", "restaurant", "bistro", "food", "grocery", "groceries", "supermarket", "whole foods", "subway", "pizza", "dining")) {
            return "Food & Dining";
        }
        if (containsAny(search, "uber", "ola", "rapido", "lyft", "metro", "irctc", "railway", "airline", "flight", "fuel", "petrol", "diesel", "gas station", "shell", "toll", "parking")) {
            return "Transportation";
        }
        if (containsAny(search, "amazon", "flipkart", "myntra", "zara", "h&m", "retail", "mart", "store", "mall", "shopping", "electronics", "apple", "clothing", "wear", "nike", "adidas")) {
            return "Shopping";
        }
        if (containsAny(search, "netflix", "spotify", "prime", "disney", "hotstar", "youtube", "cinema", "movie", "theater", "bookmyshow", "game", "steam", "playstation")) {
            return "Entertainment";
        }
        if (containsAny(search, "electric", "power", "bescom", "water", "wifi", "broadband", "airtel", "jio", "vi", "telecom", "utility", "bill", "recharge")) {
            return "Utilities";
        }
        if (containsAny(search, "hospital", "pharmacy", "medical", "clinic", "doctor", "apollo", "1mg", "pharmeasy", "meds", "diagnostics", "healthcare")) {
            return "Healthcare";
        }
        if (containsAny(search, "rent", "lease", "landlord", "maintenance", "society", "flat", "apartment")) {
            return "Housing & Rent";
        }

        return "Other";
    }

    private static boolean containsAny(String haystack, String... needles) {
        for (String n : needles) {
            if (haystack.contains(n)) return true;
        }
        return false;
    }

    private static String cleanTitle(String raw) {
        if (raw == null) return "Mobile Payment";
        String s = raw.replaceAll("[^a-zA-Z0-9&\\s\\.]", " ").replaceAll("\\s+", " ").trim();
        if (s.isEmpty()) return "Mobile Payment";
        // Title case
        String[] words = s.split(" ");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            if (w.isEmpty()) continue;
            sb.append(Character.toUpperCase(w.charAt(0)));
            if (w.length() > 1) {
                sb.append(w.substring(1));
            }
            sb.append(" ");
        }
        return sb.toString().trim();
    }
}
