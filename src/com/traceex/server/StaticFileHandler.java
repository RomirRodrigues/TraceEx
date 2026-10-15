package com.traceex.server;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.*;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

public class StaticFileHandler implements HttpHandler {
    private final String baseDir;
    private static final Map<String, String> MIME_TYPES = new HashMap<>();

    static {
        MIME_TYPES.put("html", "text/html; charset=UTF-8");
        MIME_TYPES.put("htm", "text/html; charset=UTF-8");
        MIME_TYPES.put("css", "text/css; charset=UTF-8");
        MIME_TYPES.put("js", "application/javascript; charset=UTF-8");
        MIME_TYPES.put("json", "application/json; charset=UTF-8");
        MIME_TYPES.put("png", "image/png");
        MIME_TYPES.put("jpg", "image/jpeg");
        MIME_TYPES.put("jpeg", "image/jpeg");
        MIME_TYPES.put("gif", "image/gif");
        MIME_TYPES.put("svg", "image/svg+xml");
        MIME_TYPES.put("ico", "image/x-icon");
        MIME_TYPES.put("woff2", "font/woff2");
        MIME_TYPES.put("woff", "font/woff");
        MIME_TYPES.put("ttf", "font/ttf");
    }

    public StaticFileHandler(String baseDir) {
        this.baseDir = baseDir;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        if (!"GET".equalsIgnoreCase(method) && !"HEAD".equalsIgnoreCase(method)) {
            sendResponse(exchange, 405, "Method Not Allowed".getBytes(), "text/plain");
            return;
        }

        URI uri = exchange.getRequestURI();
        String path = uri.getPath();

        if (path == null || path.equals("/") || path.trim().isEmpty()) {
            path = "/index.html";
        }

        // Security check against directory traversal
        Path basePath = Paths.get(baseDir).toRealPath();
        Path targetPath = basePath.resolve(path.startsWith("/") ? path.substring(1) : path).normalize();

        if (!targetPath.toAbsolutePath().startsWith(basePath)) {
            sendResponse(exchange, 403, "Access Denied".getBytes(), "text/plain");
            return;
        }

        File file = targetPath.toFile();
        if (!file.exists() || file.isDirectory()) {
            // Fallback to index.html for Single Page Application navigation
            File indexFile = basePath.resolve("index.html").toFile();
            if (indexFile.exists()) {
                byte[] content = Files.readAllBytes(indexFile.toPath());
                sendResponse(exchange, 200, content, "text/html; charset=UTF-8");
                return;
            }
            sendResponse(exchange, 404, "404 Not Found".getBytes(), "text/plain");
            return;
        }

        String extension = getFileExtension(file.getName());
        String contentType = MIME_TYPES.getOrDefault(extension, "application/octet-stream");

        byte[] content = Files.readAllBytes(file.toPath());
        sendResponse(exchange, 200, content, contentType);
    }

    private void sendResponse(HttpExchange exchange, int statusCode, byte[] bytes, String contentType) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.getResponseHeaders().set("Cache-Control", "no-cache, no-store, must-revalidate");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private String getFileExtension(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot > 0 ? filename.substring(dot + 1).toLowerCase() : "";
    }
}
