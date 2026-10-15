package com.traceex.server;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.traceex.model.Budget;
import com.traceex.model.Goal;
import com.traceex.model.Transaction;
import com.traceex.repository.DataStore;
import com.traceex.service.ExpenseService;
import com.traceex.util.NotificationParser;

import java.io.*;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class ApiHandler implements HttpHandler {
    private final DataStore dataStore = DataStore.getInstance();
    private final ExpenseService service = new ExpenseService();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        // Set CORS headers
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");

        String method = exchange.getRequestMethod().toUpperCase();
        if ("OPTIONS".equals(method)) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        URI uri = exchange.getRequestURI();
        String path = uri.getPath();
        Map<String, String> queryParams = parseQueryParams(uri.getRawQuery());

        try {
            if (path.startsWith("/api/transactions")) {
                handleTransactions(exchange, method, path, queryParams);
            } else if (path.startsWith("/api/budgets")) {
                handleBudgets(exchange, method, path);
            } else if (path.startsWith("/api/goals")) {
                handleGoals(exchange, method, path);
            } else if (path.equals("/api/webhook/payment")) {
                handlePaymentWebhook(exchange, method);
            } else if (path.equals("/api/parse-sms")) {
                handleParseSms(exchange, method);
            } else if (path.equals("/api/summary")) {
                handleSummary(exchange, method, queryParams);
            } else if (path.equals("/api/settings")) {
                handleSettings(exchange, method);
            } else if (path.equals("/api/export/csv")) {
                handleCsvExport(exchange);
            } else if (path.equals("/api/reset")) {
                handleReset(exchange, method);
            } else if (path.equals("/api/clear")) {
                handleClear(exchange, method);
            } else if (path.equals("/api/health")) {
                sendJsonResponse(exchange, 200, Map.of("status", "UP", "app", "TraceEx", "version", "2.0.0"));
            } else {
                sendJsonResponse(exchange, 404, Map.of("error", "Endpoint not found: " + path));
            }
        } catch (Exception e) {
            e.printStackTrace();
            sendJsonResponse(exchange, 500, Map.of("error", "Internal server error: " + e.getMessage()));
        }
    }

    private void handleSummary(HttpExchange exchange, String method, Map<String, String> query) throws IOException {
        if (!"GET".equals(method)) {
            sendJsonResponse(exchange, 405, Map.of("error", "Method not allowed"));
            return;
        }
        String month = query.get("month");
        Map<String, Object> summary = service.getFinancialSummary(month);
        sendJsonResponse(exchange, 200, summary);
    }

    private void handleTransactions(HttpExchange exchange, String method, String path, Map<String, String> query) throws IOException {
        String[] parts = path.split("/");
        // path is /api/transactions or /api/transactions/{id}
        String id = parts.length > 3 ? parts[3] : null;

        if (id == null || id.isEmpty()) {
            if ("GET".equals(method)) {
                String type = query.get("type");
                String category = query.get("category");
                String search = query.get("search");
                String start = query.get("start");
                String end = query.get("end");
                String payment = query.get("payment");

                List<Transaction> list = service.getFilteredTransactions(type, category, search, start, end, payment);
                List<Map<String, Object>> res = new ArrayList<>();
                for (Transaction t : list) res.add(t.toMap());
                sendJsonResponse(exchange, 200, res);

            } else if ("POST".equals(method)) {
                String body = readRequestBody(exchange);
                Map<String, Object> map = JsonUtils.parseObject(body);
                Transaction t = Transaction.fromMap(map);
                dataStore.addTransaction(t);
                sendJsonResponse(exchange, 201, t.toMap());

            } else {
                sendJsonResponse(exchange, 405, Map.of("error", "Method not allowed"));
            }
        } else {
            // Transaction by ID
            if ("GET".equals(method)) {
                Optional<Transaction> opt = dataStore.getTransactionById(id);
                if (opt.isPresent()) {
                    sendJsonResponse(exchange, 200, opt.get().toMap());
                } else {
                    sendJsonResponse(exchange, 404, Map.of("error", "Transaction not found"));
                }
            } else if ("PUT".equals(method)) {
                String body = readRequestBody(exchange);
                Map<String, Object> map = JsonUtils.parseObject(body);
                Transaction t = Transaction.fromMap(map);
                t.setId(id);
                boolean updated = dataStore.updateTransaction(t);
                if (updated) {
                    sendJsonResponse(exchange, 200, t.toMap());
                } else {
                    sendJsonResponse(exchange, 404, Map.of("error", "Transaction not found"));
                }
            } else if ("DELETE".equals(method)) {
                boolean deleted = dataStore.deleteTransaction(id);
                if (deleted) {
                    sendJsonResponse(exchange, 200, Map.of("success", true, "id", id));
                } else {
                    sendJsonResponse(exchange, 404, Map.of("error", "Transaction not found"));
                }
            } else {
                sendJsonResponse(exchange, 405, Map.of("error", "Method not allowed"));
            }
        }
    }

    private void handleBudgets(HttpExchange exchange, String method, String path) throws IOException {
        String[] parts = path.split("/");
        String id = parts.length > 3 ? parts[3] : null;

        if (id == null || id.isEmpty()) {
            if ("GET".equals(method)) {
                List<Budget> budgets = dataStore.getAllBudgets();
                List<Map<String, Object>> res = new ArrayList<>();
                for (Budget b : budgets) res.add(b.toMap());
                sendJsonResponse(exchange, 200, res);

            } else if ("POST".equals(method)) {
                String body = readRequestBody(exchange);
                Map<String, Object> map = JsonUtils.parseObject(body);
                Budget b = Budget.fromMap(map);
                dataStore.setBudget(b);
                sendJsonResponse(exchange, 201, b.toMap());

            } else {
                sendJsonResponse(exchange, 405, Map.of("error", "Method not allowed"));
            }
        } else {
            if ("DELETE".equals(method)) {
                boolean deleted = dataStore.deleteBudget(id);
                if (deleted) {
                    sendJsonResponse(exchange, 200, Map.of("success", true, "id", id));
                } else {
                    sendJsonResponse(exchange, 404, Map.of("error", "Budget not found"));
                }
            } else {
                sendJsonResponse(exchange, 405, Map.of("error", "Method not allowed"));
            }
        }
    }

    private void handleGoals(HttpExchange exchange, String method, String path) throws IOException {
        String[] parts = path.split("/");
        String id = parts.length > 3 ? parts[3] : null;

        if (id == null || id.isEmpty()) {
            if ("GET".equals(method)) {
                List<Goal> goals = dataStore.getAllGoals();
                List<Map<String, Object>> res = new ArrayList<>();
                for (Goal g : goals) res.add(g.toMap());
                sendJsonResponse(exchange, 200, res);

            } else if ("POST".equals(method)) {
                String body = readRequestBody(exchange);
                Map<String, Object> map = JsonUtils.parseObject(body);
                Goal g = Goal.fromMap(map);
                dataStore.addGoal(g);
                sendJsonResponse(exchange, 201, g.toMap());

            } else {
                sendJsonResponse(exchange, 405, Map.of("error", "Method not allowed"));
            }
        } else {
            if ("PUT".equals(method)) {
                String body = readRequestBody(exchange);
                Map<String, Object> map = JsonUtils.parseObject(body);
                Goal g = Goal.fromMap(map);
                g.setId(id);
                boolean updated = dataStore.updateGoal(g);
                if (updated) {
                    sendJsonResponse(exchange, 200, g.toMap());
                } else {
                    sendJsonResponse(exchange, 404, Map.of("error", "Goal not found"));
                }
            } else if ("DELETE".equals(method)) {
                boolean deleted = dataStore.deleteGoal(id);
                if (deleted) {
                    sendJsonResponse(exchange, 200, Map.of("success", true, "id", id));
                } else {
                    sendJsonResponse(exchange, 404, Map.of("error", "Goal not found"));
                }
            } else {
                sendJsonResponse(exchange, 405, Map.of("error", "Method not allowed"));
            }
        }
    }

    private void handleSettings(HttpExchange exchange, String method) throws IOException {
        if ("GET".equals(method)) {
            sendJsonResponse(exchange, 200, dataStore.getSettings());
        } else if ("POST".equals(method)) {
            String body = readRequestBody(exchange);
            Map<String, Object> map = JsonUtils.parseObject(body);
            dataStore.updateSettings(map);
            sendJsonResponse(exchange, 200, dataStore.getSettings());
        } else {
            sendJsonResponse(exchange, 405, Map.of("error", "Method not allowed"));
        }
    }

    private void handleCsvExport(HttpExchange exchange) throws IOException {
        String csv = service.exportCsv();
        byte[] bytes = csv.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "text/csv; charset=UTF-8");
        exchange.getResponseHeaders().set("Content-Disposition", "attachment; filename=\"traceex_transactions.csv\"");
        exchange.sendResponseHeaders(200, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private void handleReset(HttpExchange exchange, String method) throws IOException {
        if (!"POST".equals(method)) {
            sendJsonResponse(exchange, 405, Map.of("error", "Method not allowed"));
            return;
        }
        dataStore.resetToSampleData();
        dataStore.save();
        sendJsonResponse(exchange, 200, Map.of("success", true, "message", "Reset to sample data successfully"));
    }

    private void handleClear(HttpExchange exchange, String method) throws IOException {
        if (!"POST".equals(method)) {
            sendJsonResponse(exchange, 405, Map.of("error", "Method not allowed"));
            return;
        }
        dataStore.clearAll();
        sendJsonResponse(exchange, 200, Map.of("success", true, "message", "All data cleared successfully"));
    }

    private void sendJsonResponse(HttpExchange exchange, int statusCode, Object data) throws IOException {
        String json = JsonUtils.toJson(data);
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private void handlePaymentWebhook(HttpExchange exchange, String method) throws IOException {
        if (!"POST".equalsIgnoreCase(method)) {
            sendJsonResponse(exchange, 405, Map.of("error", "Method not allowed. Use POST"));
            return;
        }

        String body = readRequestBody(exchange);
        Map<String, Object> map = JsonUtils.parseObject(body);

        Transaction tx;
        String rawText = JsonUtils.getString(map, "text", null);
        if (rawText != null && !rawText.trim().isEmpty()) {
            tx = NotificationParser.parseNotification(rawText);
        } else {
            tx = Transaction.fromMap(map);
        }

        if (tx == null || tx.getAmount() <= 0) {
            sendJsonResponse(exchange, 400, Map.of("error", "Could not parse a valid transaction from the request"));
            return;
        }

        dataStore.addTransaction(tx);
        System.out.println("[TraceEx Live Webhook] Auto-recorded payment: " + tx.getTitle() + " (" + tx.getAmount() + ")");
        sendJsonResponse(exchange, 201, Map.of(
                "status", "SUCCESS",
                "message", "Payment auto-recorded to TraceEx",
                "transaction", tx.toMap()
        ));
    }

    private void handleParseSms(HttpExchange exchange, String method) throws IOException {
        if (!"POST".equalsIgnoreCase(method)) {
            sendJsonResponse(exchange, 405, Map.of("error", "Method not allowed. Use POST"));
            return;
        }

        String body = readRequestBody(exchange);
        Map<String, Object> map = JsonUtils.parseObject(body);
        String rawText = JsonUtils.getString(map, "text", "");

        Transaction parsed = NotificationParser.parseNotification(rawText);
        if (parsed == null || parsed.getAmount() <= 0) {
            sendJsonResponse(exchange, 400, Map.of("error", "Could not detect transaction amount or details from this text"));
            return;
        }

        sendJsonResponse(exchange, 200, parsed.toMap());
    }

    private String readRequestBody(HttpExchange exchange) throws IOException {
        InputStream is = exchange.getRequestBody();
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        byte[] data = new byte[1024];
        int nRead;
        while ((nRead = is.read(data, 0, data.length)) != -1) {
            buffer.write(data, 0, nRead);
        }
        return buffer.toString(StandardCharsets.UTF_8.name());
    }

    private Map<String, String> parseQueryParams(String query) {
        Map<String, String> map = new HashMap<>();
        if (query == null || query.isEmpty()) return map;
        String[] pairs = query.split("&");
        for (String pair : pairs) {
            int idx = pair.indexOf("=");
            try {
                if (idx > 0) {
                    String key = URLDecoder.decode(pair.substring(0, idx), StandardCharsets.UTF_8.name());
                    String value = URLDecoder.decode(pair.substring(idx + 1), StandardCharsets.UTF_8.name());
                    map.put(key, value);
                } else if (idx < 0) {
                    map.put(URLDecoder.decode(pair, StandardCharsets.UTF_8.name()), "");
                }
            } catch (Exception ignored) {}
        }
        return map;
    }
}
