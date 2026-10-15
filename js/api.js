/**
 * TraceEx Hybrid API & Storage Engine
 * Auto-detects whether the Java REST API backend is available.
 * If running on a static live host (like GitHub Pages, Vercel, Netlify) or offline,
 * it seamlessly runs a complete in-browser database (localStorage) with identical
 * financial calculations, analytics, and persistence!
 */
const API = {
  baseUrl: '/api',
  isBackendAvailable: null,

  async checkBackend() {
    if (this.isBackendAvailable !== null) return this.isBackendAvailable;
    
    // If hosted on GitHub Pages or custom domain with no Java server
    if (window.location.hostname.includes('github.io') || window.location.protocol === 'file:') {
      this.isBackendAvailable = false;
      this.notifyMode();
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(`${this.baseUrl}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      this.isBackendAvailable = res.ok;
    } catch (e) {
      this.isBackendAvailable = false;
    }

    this.notifyMode();
    return this.isBackendAvailable;
  },

  notifyMode() {
    setTimeout(() => {
      const badge = document.getElementById('engine-mode-badge');
      if (badge) {
        if (this.isBackendAvailable) {
          badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> <span>Java Server Live</span>`;
          badge.className = "hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
        } else {
          badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-indigo-400"></span> <span>Live Web Storage</span>`;
          badge.className = "hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
        }
      }
    }, 500);
  },

  async parseNotificationText(text) {
    if (await this.checkBackend()) {
      const res = await fetch(`${this.baseUrl}/parse-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (!res.ok) throw new Error('Could not extract transaction');
      return await res.json();
    }
    return LocalDatabase.parseNotification(text);
  },

  async sendWebhookPayment(payload) {
    if (await this.checkBackend()) {
      const res = await fetch(`${this.baseUrl}/webhook/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Webhook processing failed');
      return await res.json();
    }
    const tx = typeof payload === 'string' 
      ? LocalDatabase.parseNotification(payload) 
      : (payload.text ? LocalDatabase.parseNotification(payload.text) : payload);
    return LocalDatabase.addTransaction(tx);
  },

  async getSummary(month) {
    if (await this.checkBackend()) {
      const url = month ? `${this.baseUrl}/summary?month=${encodeURIComponent(month)}` : `${this.baseUrl}/summary`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load summary');
      return await res.json();
    }
    return LocalDatabase.getSummary(month);
  },

  async getTransactions(filters = {}) {
    if (await this.checkBackend()) {
      const params = new URLSearchParams();
      if (filters.type && filters.type !== 'ALL') params.append('type', filters.type);
      if (filters.category && filters.category !== 'ALL') params.append('category', filters.category);
      if (filters.payment && filters.payment !== 'ALL') params.append('payment', filters.payment);
      if (filters.search) params.append('search', filters.search);
      if (filters.start) params.append('start', filters.start);
      if (filters.end) params.append('end', filters.end);

      const qs = params.toString();
      const url = qs ? `${this.baseUrl}/transactions?${qs}` : `${this.baseUrl}/transactions`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch transactions');
      return await res.json();
    }
    return LocalDatabase.getFilteredTransactions(filters);
  },

  async addTransaction(tx) {
    if (await this.checkBackend()) {
      const res = await fetch(`${this.baseUrl}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx)
      });
      if (!res.ok) throw new Error('Failed to save transaction');
      return await res.json();
    }
    return LocalDatabase.addTransaction(tx);
  },

  async updateTransaction(id, tx) {
    if (await this.checkBackend()) {
      const res = await fetch(`${this.baseUrl}/transactions/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx)
      });
      if (!res.ok) throw new Error('Failed to update transaction');
      return await res.json();
    }
    return LocalDatabase.updateTransaction(id, tx);
  },

  async deleteTransaction(id) {
    if (await this.checkBackend()) {
      const res = await fetch(`${this.baseUrl}/transactions/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete transaction');
      return await res.json();
    }
    return LocalDatabase.deleteTransaction(id);
  },

  async setBudget(budget) {
    if (await this.checkBackend()) {
      const res = await fetch(`${this.baseUrl}/budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(budget)
      });
      if (!res.ok) throw new Error('Failed to set budget');
      return await res.json();
    }
    return LocalDatabase.setBudget(budget);
  },

  async deleteBudget(id) {
    if (await this.checkBackend()) {
      const res = await fetch(`${this.baseUrl}/budgets/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete budget');
      return await res.json();
    }
    return LocalDatabase.deleteBudget(id);
  },

  async addGoal(goal) {
    if (await this.checkBackend()) {
      const res = await fetch(`${this.baseUrl}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goal)
      });
      if (!res.ok) throw new Error('Failed to add goal');
      return await res.json();
    }
    return LocalDatabase.addGoal(goal);
  },

  async updateGoal(id, goal) {
    if (await this.checkBackend()) {
      const res = await fetch(`${this.baseUrl}/goals/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goal)
      });
      if (!res.ok) throw new Error('Failed to update goal');
      return await res.json();
    }
    return LocalDatabase.updateGoal(id, goal);
  },

  async deleteGoal(id) {
    if (await this.checkBackend()) {
      const res = await fetch(`${this.baseUrl}/goals/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete goal');
      return await res.json();
    }
    return LocalDatabase.deleteGoal(id);
  },

  async updateSettings(settings) {
    if (await this.checkBackend()) {
      const res = await fetch(`${this.baseUrl}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (!res.ok) throw new Error('Failed to update settings');
      return await res.json();
    }
    return LocalDatabase.updateSettings(settings);
  },

  async resetToSample() {
    if (await this.checkBackend()) {
      const res = await fetch(`${this.baseUrl}/reset`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to reset demo data');
      return await res.json();
    }
    return LocalDatabase.resetToSample();
  },

  async clearAll() {
    if (await this.checkBackend()) {
      const res = await fetch(`${this.baseUrl}/clear`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to clear database');
      return await res.json();
    }
    return LocalDatabase.clearAll();
  },

  triggerCsvDownload() {
    if (this.isBackendAvailable) {
      window.location.href = '/api/export/csv';
    } else {
      LocalDatabase.downloadCsv();
    }
  }
};

/**
 * In-browser resilient database for static deployments (GitHub Pages).
 */
const LocalDatabase = {
  KEY: 'traceex_database_v3',

  getData() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.transactions) && parsed.transactions.length > 0) {
          const now = new Date();
          const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          const hasCurrentMonth = parsed.transactions.some(t => t.date && t.date.startsWith(curMonth));
          if (hasCurrentMonth) {
            return parsed;
          }
        }
      }
    } catch (e) {}
    const initial = this.generateInitialData();
    this.saveData(initial);
    return initial;
  },

  saveData(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  },

  generateInitialData() {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth(); // 0 to 11

    // Robust local calendar date generator (guaranteed YYYY-MM-DD in local time)
    const dateOn = (monthOffset, day) => {
      const d = new Date(curYear, curMonth - monthOffset, day);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    };

    return {
      settings: {
        currency: '₹',
        currencyCode: 'INR',
        userName: 'Alex Rivera',
        theme: 'dark'
      },
      transactions: [
        // ================= CURRENT MONTH =================
        { id: 'tx-1', title: 'Tech Corp Senior Engineer Salary', amount: 85000.00, type: 'INCOME', category: 'Salary', date: dateOn(0, 1), paymentMethod: 'Bank Transfer', notes: 'Monthly payroll direct credit', isRecurring: true },
        { id: 'tx-2', title: 'Fullstack Freelance Milestone', amount: 24500.00, type: 'INCOME', category: 'Freelance', date: dateOn(0, 8), paymentMethod: 'Bank Transfer', notes: 'API architecture consulting', isRecurring: false },
        { id: 'tx-3', title: 'Nifty Index Fund Dividends', amount: 4800.00, type: 'INCOME', category: 'Investment', date: dateOn(0, 12), paymentMethod: 'Bank Transfer', notes: 'Quarterly ETF payout', isRecurring: false },
        { id: 'tx-4', title: 'Luxury Apartment Rent & Maintenance', amount: 26000.00, type: 'EXPENSE', category: 'Housing & Rent', date: dateOn(0, 2), paymentMethod: 'Bank Transfer', notes: 'Monthly flat lease', isRecurring: true },
        { id: 'tx-5', title: 'Nature Basket Organic Groceries', amount: 4250.00, type: 'EXPENSE', category: 'Food & Dining', date: dateOn(0, 5), paymentMethod: 'Credit Card', notes: 'Pantry and organic produce', isRecurring: false },
        { id: 'tx-6', title: 'Blue Tokai Roasters Coffee', amount: 480.00, type: 'EXPENSE', category: 'Food & Dining', date: dateOn(0, 7), paymentMethod: 'UPI', notes: 'Cold brew and artisanal roast', isRecurring: false },
        { id: 'tx-7', title: 'Uber Premier Office Transit', amount: 620.00, type: 'EXPENSE', category: 'Transportation', date: dateOn(0, 9), paymentMethod: 'UPI', notes: 'Client meeting transit', isRecurring: false },
        { id: 'tx-8', title: 'Airtel Gigabit Fiber Internet', amount: 1499.00, type: 'EXPENSE', category: 'Utilities', date: dateOn(0, 6), paymentMethod: 'Debit Card', notes: 'High-speed 1Gbps connection', isRecurring: true },
        { id: 'tx-9', title: 'State Power & Electricity Bill', amount: 2840.00, type: 'EXPENSE', category: 'Utilities', date: dateOn(0, 11), paymentMethod: 'Debit Card', notes: 'Home studio power consumption', isRecurring: false },
        { id: 'tx-10', title: 'Weekend Rooftop Bistro Dinner', amount: 3200.00, type: 'EXPENSE', category: 'Food & Dining', date: dateOn(0, 13), paymentMethod: 'Credit Card', notes: 'Dinner with colleagues', isRecurring: false },
        { id: 'tx-11', title: 'Keychron Mechanical Keyboard', amount: 6499.00, type: 'EXPENSE', category: 'Shopping', date: dateOn(0, 14), paymentMethod: 'Credit Card', notes: 'Wireless tactile custom keyboard', isRecurring: false },
        { id: 'tx-12', title: 'Netflix & Spotify Family Premium', amount: 849.00, type: 'EXPENSE', category: 'Entertainment', date: dateOn(0, 3), paymentMethod: 'Credit Card', notes: 'Monthly streaming memberships', isRecurring: true },
        { id: 'tx-13', title: 'Metro Transit Card Smart Recharge', amount: 1000.00, type: 'EXPENSE', category: 'Transportation', date: dateOn(0, 10), paymentMethod: 'UPI', notes: 'Monthly metro pass', isRecurring: false },
        { id: 'tx-14', title: 'Apollo Pharmacy & Wellness Pack', amount: 1850.00, type: 'EXPENSE', category: 'Healthcare', date: dateOn(0, 4), paymentMethod: 'Debit Card', notes: 'Multivitamins and diagnostics', isRecurring: false },

        // ================= MONTH - 1 =================
        { id: 'tx-15', title: 'Tech Corp Salary', amount: 85000.00, type: 'INCOME', category: 'Salary', date: dateOn(1, 1), paymentMethod: 'Bank Transfer', notes: 'Payroll direct deposit', isRecurring: true },
        { id: 'tx-16', title: 'Consulting Honorarium', amount: 18000.00, type: 'INCOME', category: 'Freelance', date: dateOn(1, 15), paymentMethod: 'Bank Transfer', notes: 'Technical review', isRecurring: false },
        { id: 'tx-17', title: 'Apartment Rent', amount: 26000.00, type: 'EXPENSE', category: 'Housing & Rent', date: dateOn(1, 2), paymentMethod: 'Bank Transfer', notes: 'Monthly rent', isRecurring: true },
        { id: 'tx-18', title: 'Supermarket Groceries', amount: 8400.00, type: 'EXPENSE', category: 'Food & Dining', date: dateOn(1, 8), paymentMethod: 'Credit Card', notes: 'Restocking staples', isRecurring: false },
        { id: 'tx-19', title: 'Rock Concert Live Event', amount: 4500.00, type: 'EXPENSE', category: 'Entertainment', date: dateOn(1, 20), paymentMethod: 'UPI', notes: 'VIP tickets', isRecurring: false },
        { id: 'tx-20', title: 'Fuel & Car Maintenance', amount: 3800.00, type: 'EXPENSE', category: 'Transportation', date: dateOn(1, 12), paymentMethod: 'Credit Card', notes: 'Service and refill', isRecurring: false },

        // ================= MONTH - 2 =================
        { id: 'tx-21', title: 'Tech Corp Salary', amount: 85000.00, type: 'INCOME', category: 'Salary', date: dateOn(2, 1), paymentMethod: 'Bank Transfer', notes: 'Payroll', isRecurring: true },
        { id: 'tx-22', title: 'Apartment Rent', amount: 26000.00, type: 'EXPENSE', category: 'Housing & Rent', date: dateOn(2, 2), paymentMethod: 'Bank Transfer', notes: 'Monthly rent', isRecurring: true },
        { id: 'tx-23', title: 'Weekend Flight Tickets', amount: 9200.00, type: 'EXPENSE', category: 'Transportation', date: dateOn(2, 16), paymentMethod: 'Credit Card', notes: 'Tech conference flight', isRecurring: false },
        { id: 'tx-24', title: 'Dining & Restaurants', amount: 6100.00, type: 'EXPENSE', category: 'Food & Dining', date: dateOn(2, 22), paymentMethod: 'Credit Card', notes: 'Conference dinners', isRecurring: false },

        // ================= MONTH - 3 =================
        { id: 'tx-25', title: 'Tech Corp Salary', amount: 80000.00, type: 'INCOME', category: 'Salary', date: dateOn(3, 1), paymentMethod: 'Bank Transfer', notes: 'Payroll', isRecurring: true },
        { id: 'tx-26', title: 'App UI Design Project', amount: 32000.00, type: 'INCOME', category: 'Freelance', date: dateOn(3, 10), paymentMethod: 'Bank Transfer', notes: 'Design sprint payout', isRecurring: false },
        { id: 'tx-27', title: 'Apartment Rent', amount: 26000.00, type: 'EXPENSE', category: 'Housing & Rent', date: dateOn(3, 2), paymentMethod: 'Bank Transfer', notes: 'Monthly rent', isRecurring: true },
        { id: 'tx-28', title: 'Smart Home Gadgets', amount: 7800.00, type: 'EXPENSE', category: 'Shopping', date: dateOn(3, 18), paymentMethod: 'Credit Card', notes: 'IoT lighting', isRecurring: false },

        // ================= MONTH - 4 =================
        { id: 'tx-29', title: 'Tech Corp Salary', amount: 80000.00, type: 'INCOME', category: 'Salary', date: dateOn(4, 1), paymentMethod: 'Bank Transfer', notes: 'Payroll', isRecurring: true },
        { id: 'tx-30', title: 'Apartment Rent', amount: 26000.00, type: 'EXPENSE', category: 'Housing & Rent', date: dateOn(4, 2), paymentMethod: 'Bank Transfer', notes: 'Monthly rent', isRecurring: true },
        { id: 'tx-31', title: 'Groceries & Provisions', amount: 7600.00, type: 'EXPENSE', category: 'Food & Dining', date: dateOn(4, 14), paymentMethod: 'Credit Card', notes: 'Home essentials', isRecurring: false },

        // ================= MONTH - 5 =================
        { id: 'tx-32', title: 'Tech Corp Salary', amount: 80000.00, type: 'INCOME', category: 'Salary', date: dateOn(5, 1), paymentMethod: 'Bank Transfer', notes: 'Payroll', isRecurring: true },
        { id: 'tx-33', title: 'Apartment Rent', amount: 26000.00, type: 'EXPENSE', category: 'Housing & Rent', date: dateOn(5, 2), paymentMethod: 'Bank Transfer', notes: 'Monthly rent', isRecurring: true },
        { id: 'tx-34', title: 'Comprehensive Health Check', amount: 5500.00, type: 'EXPENSE', category: 'Healthcare', date: dateOn(5, 19), paymentMethod: 'Debit Card', notes: 'Preventative care', isRecurring: false }
      ],
      budgets: [
        { id: 'bg-1', category: 'Food & Dining', limitAmount: 14000.00, month: 'ALL' },
        { id: 'bg-2', category: 'Housing & Rent', limitAmount: 28000.00, month: 'ALL' },
        { id: 'bg-3', category: 'Transportation', limitAmount: 5000.00, month: 'ALL' },
        { id: 'bg-4', category: 'Shopping', limitAmount: 10000.00, month: 'ALL' },
        { id: 'bg-5', category: 'Utilities', limitAmount: 6000.00, month: 'ALL' },
        { id: 'bg-6', category: 'Entertainment', limitAmount: 4000.00, month: 'ALL' },
        { id: 'bg-7', category: 'Healthcare', limitAmount: 5000.00, month: 'ALL' }
      ],
      goals: [
        { id: 'g-1', name: 'Emergency Safety Reserve', targetAmount: 300000.00, currentAmount: 215000.00, deadline: dateOn(-4, 1), category: 'Safety', notes: '6 months essential fixed costs', progressPercent: 71.7 },
        { id: 'g-2', name: 'Tokyo Autumn Flight & Stay', targetAmount: 150000.00, currentAmount: 105000.00, deadline: dateOn(-7, 1), category: 'Travel', notes: 'Direct flights & boutique hotel', progressPercent: 70.0 },
        { id: 'g-3', name: 'M3 Max MacBook Pro', targetAmount: 199900.00, currentAmount: 199900.00, deadline: dateOn(0, 1), category: 'Technology', notes: 'Target fulfilled - Workstation upgraded', progressPercent: 100.0 },
        { id: 'g-4', name: 'Home Studio Audio Setup', targetAmount: 50000.00, currentAmount: 22000.00, deadline: dateOn(-2, 1), category: 'Hobbies', notes: 'Genelec monitors & acoustic panels', progressPercent: 44.0 }
      ]
    };
  },

  getSummary(targetMonth) {
    const data = this.getData();
    const all = data.transactions;
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonthIdx = now.getMonth();
    const defaultMonth = `${curYear}-${String(curMonthIdx + 1).padStart(2, '0')}`;
    const currentMonth = (targetMonth && targetMonth.match(/^\d{4}-\d{2}$/)) ? targetMonth : defaultMonth;

    const monthTx = all.filter(t => t.date && t.date.startsWith(currentMonth));
    let monthIncome = 0;
    let monthExpense = 0;
    const catExpenseMap = {};
    const catIncomeMap = {};
    const payMap = {};
    const dailyMap = {};

    monthTx.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'INCOME') {
        monthIncome += amt;
        catIncomeMap[t.category] = (catIncomeMap[t.category] || 0) + amt;
      } else {
        monthExpense += amt;
        catExpenseMap[t.category] = (catExpenseMap[t.category] || 0) + amt;
        payMap[t.paymentMethod] = (payMap[t.paymentMethod] || 0) + amt;
        dailyMap[t.date] = (dailyMap[t.date] || 0) + amt;
      }
    });

    const monthBalance = monthIncome - monthExpense;
    const savingsRate = monthIncome > 0 ? Math.max(0, (monthBalance / monthIncome) * 100) : 0;

    let totalIncome = 0;
    let totalExpense = 0;
    all.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'INCOME') totalIncome += amt;
      else totalExpense += amt;
    });

    // 6 Month Trends (Guaranteed local year-month)
    const trends = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(curYear, curMonthIdx - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      let inc = 0;
      let exp = 0;
      all.forEach(t => {
        if (t.date && t.date.startsWith(mStr)) {
          const amt = Number(t.amount) || 0;
          if (t.type === 'INCOME') inc += amt;
          else exp += amt;
        }
      });
      trends.push({
        month: mStr,
        income: Math.round(inc * 100) / 100,
        expense: Math.round(exp * 100) / 100,
        net: Math.round((inc - exp) * 100) / 100
      });
    }

    // Budget reports
    const budgetReports = data.budgets.map(b => {
      const spent = catExpenseMap[b.category] || 0;
      const limit = Number(b.limitAmount) || 0;
      const pct = limit > 0 ? (spent / limit) * 100 : 0;
      const status = pct > 100 ? 'EXCEEDED' : (pct >= 80 ? 'WARNING' : 'NORMAL');
      return {
        ...b,
        spent: Math.round(spent * 100) / 100,
        remaining: Math.round((limit - spent) * 100) / 100,
        percent: Math.round(pct * 10) / 10,
        status
      };
    });

    // Category breakdown
    const categoryBreakdown = Object.entries(catExpenseMap).map(([category, amount]) => {
      const pct = monthExpense > 0 ? (amount / monthExpense) * 100 : 0;
      return {
        category,
        amount: Math.round(amount * 100) / 100,
        percent: Math.round(pct * 10) / 10
      };
    }).sort((a, b) => b.amount - a.amount);

    // Top 5 Expenses
    const topExpenses = [...monthTx]
      .filter(t => t.type === 'EXPENSE')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Recent 6 transactions
    const recentTransactions = [...all]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6);

    return {
      selectedMonth: currentMonth,
      monthlyIncome: Math.round(monthIncome * 100) / 100,
      monthlyExpense: Math.round(monthExpense * 100) / 100,
      monthlyBalance: Math.round(monthBalance * 100) / 100,
      savingsRate: Math.round(savingsRate * 10) / 10,
      totalNetWorth: Math.round((totalIncome - totalExpense) * 100) / 100,
      totalIncomeAllTime: Math.round(totalIncome * 100) / 100,
      totalExpenseAllTime: Math.round(totalExpense * 100) / 100,
      trends,
      categoryBreakdown,
      paymentMethods: payMap,
      dailyExpenses: dailyMap,
      budgetReports,
      goals: data.goals,
      topExpenses,
      recentTransactions,
      settings: data.settings
    };
  },

  getFilteredTransactions(filters) {
    const data = this.getData();
    let list = [...data.transactions];

    if (filters.type && filters.type !== 'ALL') {
      list = list.filter(t => t.type === filters.type);
    }
    if (filters.category && filters.category !== 'ALL') {
      list = list.filter(t => t.category === filters.category);
    }
    if (filters.payment && filters.payment !== 'ALL') {
      list = list.filter(t => t.paymentMethod === filters.payment);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(t => 
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.notes && t.notes.toLowerCase().includes(q)) ||
        (t.paymentMethod && t.paymentMethod.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  },

  addTransaction(tx) {
    const data = this.getData();
    tx.id = 'tx-' + Date.now();
    data.transactions.unshift(tx);
    this.saveData(data);
    return tx;
  },

  updateTransaction(id, tx) {
    const data = this.getData();
    const idx = data.transactions.findIndex(t => t.id === id);
    if (idx !== -1) {
      tx.id = id;
      data.transactions[idx] = tx;
      this.saveData(data);
      return tx;
    }
    throw new Error('Transaction not found');
  },

  deleteTransaction(id) {
    const data = this.getData();
    data.transactions = data.transactions.filter(t => t.id !== id);
    this.saveData(data);
    return { success: true, id };
  },

  setBudget(budget) {
    const data = this.getData();
    const idx = data.budgets.findIndex(b => b.category.toLowerCase() === budget.category.toLowerCase());
    if (idx !== -1) {
      budget.id = data.budgets[idx].id;
      data.budgets[idx] = budget;
    } else {
      budget.id = 'bg-' + Date.now();
      data.budgets.push(budget);
    }
    this.saveData(data);
    return budget;
  },

  deleteBudget(id) {
    const data = this.getData();
    data.budgets = data.budgets.filter(b => b.id !== id);
    this.saveData(data);
    return { success: true, id };
  },

  addGoal(goal) {
    const data = this.getData();
    goal.id = 'g-' + Date.now();
    const tgt = Number(goal.targetAmount) || 1;
    const cur = Number(goal.currentAmount) || 0;
    goal.progressPercent = Math.round(Math.min(100, (cur / tgt) * 100) * 10) / 10;
    data.goals.push(goal);
    this.saveData(data);
    return goal;
  },

  updateGoal(id, goal) {
    const data = this.getData();
    const idx = data.goals.findIndex(g => g.id === id);
    if (idx !== -1) {
      goal.id = id;
      const tgt = Number(goal.targetAmount) || 1;
      const cur = Number(goal.currentAmount) || 0;
      goal.progressPercent = Math.round(Math.min(100, (cur / tgt) * 100) * 10) / 10;
      data.goals[idx] = goal;
      this.saveData(data);
      return goal;
    }
    throw new Error('Goal not found');
  },

  deleteGoal(id) {
    const data = this.getData();
    data.goals = data.goals.filter(g => g.id !== id);
    this.saveData(data);
    return { success: true, id };
  },

  updateSettings(settings) {
    const data = this.getData();
    data.settings = { ...data.settings, ...settings };
    this.saveData(data);
    return data.settings;
  },

  resetToSample() {
    const initial = this.generateInitialData();
    this.saveData(initial);
    return { success: true };
  },

  clearAll() {
    const data = this.getData();
    data.transactions = [];
    data.budgets = [];
    data.goals = [];
    this.saveData(data);
    return { success: true };
  },

  parseNotification(text) {
    if (!text || !text.trim()) throw new Error('Empty notification text');

    // 1. Detect Type
    const isCredit = /(?:credited|received|deposited|refunded|cashback|bonus|salary)/i.test(text);
    const type = isCredit ? 'INCOME' : 'EXPENSE';

    // 2. Extract Amount
    let amount = 0;
    const amtRegex = /(?:(?:Rs\.?|INR|₹|\$|USD|EUR|€|GBP|£)\s*([0-9,]+(?:\.[0-9]{1,2})?))|(?:([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:Rs\.?|INR|₹|USD|EUR))/i;
    const amtMatch = text.match(amtRegex);
    if (amtMatch) {
      const raw = (amtMatch[1] || amtMatch[2] || '').replace(/,/g, '');
      amount = parseFloat(raw) || 0;
    }

    // 3. Extract Merchant
    let title = 'Mobile Payment';
    const merRegex = /(?:(?:to|at|vpa|paid to|spent at|transferred to|towards)\s+([A-Za-z0-9&\.\-\s]{2,30}?)(?:\s+(?:on|using|via|ref|upi|avl|bal|a\/c|card)|[\.,]|$))/i;
    const merMatch = text.match(merRegex);
    if (merMatch && merMatch[1]) {
      let cleaned = merMatch[1].replace(/\b(on|using|from|via|ref|for|by)\b.*$/i, '').trim();
      cleaned = cleaned.replace(/[^a-zA-Z0-9&\s\.]/g, ' ').replace(/\s+/g, ' ').trim();
      if (cleaned.length >= 2) {
        title = cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }
    }

    // 4. Payment Method
    let paymentMethod = 'UPI';
    let notes = 'Mobile Sync';
    const lower = text.toLowerCase();
    if (lower.includes('google pay') || lower.includes('gpay')) {
      paymentMethod = 'UPI';
      notes = 'Google Pay Notification';
    } else if (lower.includes('phonepe')) {
      paymentMethod = 'UPI';
      notes = 'PhonePe Notification';
    } else if (lower.includes('paytm')) {
      paymentMethod = 'UPI';
      notes = 'Paytm Notification';
    } else if (lower.includes('apple pay')) {
      paymentMethod = 'Credit Card';
      notes = 'Apple Pay Alert';
    } else if (lower.includes('credit card') || lower.includes('ending') || lower.includes('card')) {
      paymentMethod = 'Credit Card';
      notes = 'Card Notification';
    } else if (lower.includes('debit card')) {
      paymentMethod = 'Debit Card';
      notes = 'Debit Card Notification';
    } else if (lower.includes('a/c') || lower.includes('bank') || lower.includes('neft') || lower.includes('imps')) {
      paymentMethod = 'Bank Transfer';
      notes = 'Bank Alert Sync';
    }

    // 5. Category
    let category = 'Other';
    if (isCredit) {
      if (lower.includes('salary') || lower.includes('payroll')) category = 'Salary';
      else if (lower.includes('dividend') || lower.includes('interest')) category = 'Investment';
      else category = 'Freelance';
    } else {
      const search = (title + ' ' + lower);
      if (/(swiggy|zomato|starbucks|mcdonald|burger|cafe|coffee|restaurant|bistro|food|grocery|groceries|supermarket|whole foods|subway|pizza|dining)/i.test(search)) {
        category = 'Food & Dining';
      } else if (/(uber|ola|rapido|lyft|metro|irctc|railway|airline|flight|fuel|petrol|diesel|gas station|shell|toll|parking)/i.test(search)) {
        category = 'Transportation';
      } else if (/(amazon|flipkart|myntra|zara|h&m|retail|mart|store|mall|shopping|electronics|apple|clothing|wear|nike|adidas)/i.test(search)) {
        category = 'Shopping';
      } else if (/(netflix|spotify|prime|disney|hotstar|youtube|cinema|movie|theater|bookmyshow|game|steam|playstation)/i.test(search)) {
        category = 'Entertainment';
      } else if (/(electric|power|bescom|water|wifi|broadband|airtel|jio|vi|telecom|utility|bill|recharge)/i.test(search)) {
        category = 'Utilities';
      } else if (/(hospital|pharmacy|medical|clinic|doctor|apollo|1mg|pharmeasy|meds|diagnostics|healthcare)/i.test(search)) {
        category = 'Healthcare';
      } else if (/(rent|lease|landlord|maintenance|society|flat|apartment)/i.test(search)) {
        category = 'Housing & Rent';
      }
    }

    return {
      id: 'tx-' + Date.now(),
      title,
      amount,
      type,
      category,
      date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`,
      paymentMethod,
      notes: notes + ' • Auto-parsed',
      isRecurring: false
    };
  },

  downloadCsv() {
    const data = this.getData();
    let csv = "ID,Date,Title,Type,Category,Amount,Payment Method,Recurring,Notes\n";
    data.transactions.forEach(t => {
      const row = [
        t.id,
        t.date,
        `"${(t.title || '').replace(/"/g, '""')}"`,
        t.type,
        `"${(t.category || '').replace(/"/g, '""')}"`,
        Number(t.amount).toFixed(2),
        `"${(t.paymentMethod || '').replace(/"/g, '""')}"`,
        t.isRecurring ? 'Yes' : 'No',
        `"${(t.notes || '').replace(/"/g, '""')}"`
      ];
      csv += row.join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'traceex_transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
