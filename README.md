# TraceEx — The Ultimate Expense Tracker

> **Live Website**: **[https://romirrodrigues.github.io/TraceEx/](https://romirrodrigues.github.io/TraceEx/)**  
> **TraceEx** is a modern, full-featured financial management web application powered by a lightweight, zero-external-dependency **pure Java backend** (`jdk.httpserver`). It provides a sleek fintech dashboard, interactive analytics, monthly category budgeting, savings goal tracking, digital receipts, and multi-currency support.

---

## ✨ Features

- **📊 Comprehensive Financial Dashboard**:
  - Live Net Cash Flow, Monthly Inflow, Monthly Expenses, and Savings Rate efficiency indicators.
  - Interactive 6-Month Cash Flow line chart (powered by Chart.js).
  - Spending breakdown doughnut chart with percentages.
  - Real-time Category Budget Health monitor with color-coded warning pills.
  - Recent transactions ticker with instant receipt viewer.

- **💳 Full Transaction Ledger**:
  - Multi-criteria real-time search & filter (by keyword, type, category, and payment channel).
  - Income and Expense categorization (Food & Dining, Housing, Transportation, Shopping, Utilities, Salary, Freelance, etc.).
  - Payment modes: Credit Card, Debit Card, UPI, Bank Transfer, Cash, Crypto.
  - Recurring bill flag indicator.
  - Instant CSV export formatted for Excel & Google Sheets.

- **🎯 Monthly Budgets & Savings Goals**:
  - Category spending caps with dynamic status warnings (`NORMAL`, `WARNING` > 80%, `EXCEEDED` > 100%).
  - Savings Goals tracker with target amounts, target dates, and one-click `+ Add Funds` contributions.

- **📈 Analytics & Reports**:
  - Daily spending velocity bar chart.
  - Spending distribution across payment channels.
  - Top 5 biggest expenses leaderboard.
  - Print-ready clean financial statement export to PDF.

- **🌍 Multi-Currency & Theming**:
  - Global currency switcher: `$` (USD), `₹` (INR), `€` (EUR), `£` (GBP), `¥` (JPY), `C$` (CAD), `A$` (AUD).
  - Dark / Light mode toggle.
  - Keyboard shortcuts (`Ctrl+K` or `N` to quickly record an expense, `Esc` to close modals).

- **⚡ Zero External Maven/Gradle Dependency Friction**:
  - Built strictly using pure Java standard library (`com.sun.net.httpserver`, `java.time`, `java.util.concurrent`).
  - Self-contained custom JSON serialization & parsing engine (`JsonUtils`).
  - Thread-safe persistent file-backed storage (`data/traceex_data.json`).
  - Starts in under 1 second.

---

## 🚀 Quick Start

### Option 1: Double-Click (Windows)
Double-click `run.bat` in the project root folder. It will automatically compile the Java sources, boot the server, and open `http://localhost:8080` in your default web browser.

### Option 2: PowerShell
```powershell
.\run.ps1
```

### Option 3: Manual Compilation & Execution
Using your installed JDK (e.g., Corretto 11+ or OpenJDK):
```bash
# 1. Compile Java files
javac -encoding UTF-8 -d bin src/com/traceex/*.java src/com/traceex/*/*.java

# 2. Run the application
java -cp bin com.traceex.Main 8080
```
Open **[http://localhost:8080](http://localhost:8080)** in your browser.

---

## 📁 Project Structure

```
java project dsy/
├── src/
│   └── com/
│       └── traceex/
│           ├── Main.java                   # Application entry point & banner
│           ├── model/
│           │   ├── Transaction.java        # Transaction data model
│           │   ├── Budget.java             # Category budget model
│           │   └── Goal.java               # Savings goal model
│           ├── repository/
│           │   └── DataStore.java          # Thread-safe persistent JSON store
│           ├── service/
│           │   └── ExpenseService.java     # Financial analytics & calculations
│           ├── server/
│           │   ├── TraceExServer.java      # Multi-threaded HTTP server
│           │   ├── ApiHandler.java         # REST API controller & routing
│           │   ├── StaticFileHandler.java  # Static web file server (MIME, SPA)
│           │   └── JsonUtils.java          # Zero-dependency JSON parser/serializer
│           └── util/
│               └── SampleDataGenerator.java# Realistic default financial records
├── web/
│   ├── index.html                          # Single Page Web App layout
│   ├── css/
│   │   └── style.css                       # Glassmorphic styles & themes
│   └── js/
│       ├── api.js                          # REST API client
│       ├── charts.js                       # Chart.js visualization engine
│       └── app.js                          # UI state controller & interactions
├── data/
│   └── traceex_data.json                   # Auto-created persistent database
├── run.bat                                 # 1-click Windows runner
├── run.ps1                                 # PowerShell runner
└── README.md                               # Documentation
```

---

## 🔌 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Healthcheck and version info |
| `GET` | `/api/summary?month=YYYY-MM` | Complete financial analytics & breakdown |
| `GET` | `/api/transactions` | Search & filter transactions |
| `POST` | `/api/transactions` | Create a new transaction |
| `PUT` | `/api/transactions/{id}` | Update an existing transaction |
| `DELETE` | `/api/transactions/{id}` | Delete a transaction |
| `GET` | `/api/budgets` | List all category budgets |
| `POST` | `/api/budgets` | Set or update a budget limit |
| `DELETE` | `/api/budgets/{id}` | Delete a budget limit |
| `GET` | `/api/goals` | List all savings goals |
| `POST` | `/api/goals` | Create a new goal |
| `PUT` | `/api/goals/{id}` | Update goal / add contributions |
| `DELETE` | `/api/goals/{id}` | Delete a savings goal |
| `GET` | `/api/export/csv` | Download complete transaction ledger as CSV |
| `POST` | `/api/reset` | Restore demo data |
| `POST` | `/api/clear` | Wipe all records |
| `POST` | `/api/settings` | Save currency, theme, and profile settings |
