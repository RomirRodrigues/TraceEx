package com.traceex.server;

import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.concurrent.Executors;

public class TraceExServer {
    private HttpServer server;
    private int port;
    private final String webDir;

    public TraceExServer(int preferredPort, String webDir) {
        this.port = preferredPort;
        this.webDir = webDir;
    }

    public int start() throws IOException {
        int attemptPort = this.port;
        int maxAttempts = 10;
        IOException lastEx = null;

        for (int i = 0; i < maxAttempts; i++) {
            try {
                server = HttpServer.create(new InetSocketAddress("127.0.0.1", attemptPort), 0);
                this.port = attemptPort;
                break;
            } catch (IOException e) {
                lastEx = e;
                attemptPort++;
            }
        }

        if (server == null) {
            throw (lastEx != null) ? lastEx : new IOException("Could not bind to any available port");
        }

        // Register handlers
        server.createContext("/api", new ApiHandler());
        server.createContext("/", new StaticFileHandler(this.webDir));

        server.setExecutor(Executors.newFixedThreadPool(16));
        server.start();

        return this.port;
    }

    public void stop() {
        if (server != null) {
            server.stop(1);
        }
    }

    public int getPort() {
        return port;
    }
}
