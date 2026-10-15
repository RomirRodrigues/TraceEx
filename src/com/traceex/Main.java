package com.traceex;

import com.traceex.repository.DataStore;
import com.traceex.server.TraceExServer;

import java.awt.Desktop;
import java.net.URI;

public class Main {
    private static final int DEFAULT_PORT = 8080;
    private static final String WEB_DIR = "web";

    public static void main(String[] args) {
        printBanner();

        int port = DEFAULT_PORT;
        if (args.length > 0) {
            try {
                port = Integer.parseInt(args[0]);
            } catch (NumberFormatException ignored) {}
        }

        try {
            // Pre-load data store
            DataStore.getInstance();

            TraceExServer server = new TraceExServer(port, WEB_DIR);
            int activePort = server.start();
            String appUrl = "http://localhost:" + activePort;

            System.out.println("==================================================================");
            System.out.println("  TraceEx Server is RUNNING at:");
            System.out.println("  --> " + appUrl);
            System.out.println("  --> http://127.0.0.1:" + activePort);
            System.out.println("==================================================================");
            System.out.println("  Press Ctrl+C in this console to stop the server.");
            System.out.println();

            // Try to open the default browser automatically
            openBrowser(appUrl);

            // Add shutdown hook
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                System.out.println("\n[TraceEx] Shutting down server and saving latest state...");
                DataStore.getInstance().save();
                server.stop();
                System.out.println("[TraceEx] Goodbye!");
            }));

        } catch (Exception e) {
            System.err.println("[TraceEx] Fatal error starting server: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static void openBrowser(String url) {
        try {
            if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
                Desktop.getDesktop().browse(new URI(url));
                System.out.println("[TraceEx] Opened " + url + " in your default web browser.");
                return;
            }
        } catch (Exception ignored) {}

        // Fallback for Windows
        try {
            String os = System.getProperty("os.name").toLowerCase();
            if (os.contains("win")) {
                new ProcessBuilder("cmd.exe", "/c", "start", url).start();
                System.out.println("[TraceEx] Launched browser via Windows command: " + url);
            }
        } catch (Exception ignored) {}
    }

    private static void printBanner() {
        System.out.println("\n" +
                "  +-------------------------------------------------------------+\n" +
                "  |   _______                 ______                            |\n" +
                "  |  |__   __|               |  ____|                           |\n" +
                "  |     | |_ __ __ _  ___ ___| |__  __  __                      |\n" +
                "  |     | | '__/ _` |/ __/ _ \\  __| \\ \\/ /                      |\n" +
                "  |     | | | | (_| | (_|  __/ |____ >  <                       |\n" +
                "  |     |_|_|  \\__,_|\\___\\___|______/_/\\_\\                      |\n" +
                "  |                                                             |\n" +
                "  |           TRACE-EX: THE ULTIMATE EXPENSE TRACKER            |\n" +
                "  +-------------------------------------------------------------+\n");
    }
}
