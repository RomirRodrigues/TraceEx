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
  KEY: 'traceex_database_v2',

  getData() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) return JSON.parse(raw);
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
    const dStr = (offsetDays = 0, offsetMonths = 0) => {
      const d = new Date(now.getFullYear(), now.getMonth() - offsetMonths, now.getDate() - offsetDays);
      return d.toISOString().slice(0, 10);
    };

    return {
      settings: {
        currency: '$',
        currencyCode: 'USD',
        userName: 'Alex Rivera',
        theme: 'dark'
      },
      transactions: [
        { id: 'tx-1', title: 'Tech Corp Salary', amount: 5200.00, type: 'INCOME', category: 'Salary', date: dStr(14, 0), paymentMethod: 'Bank Transfer', notes: 'Monthly salary payout', isRecurring: true },
        { id: 'tx-2', title: 'UI/UX Freelance Project', amount: 1450.00, type: 'INCOME', category: 'Freelance', date: dStr(4, 0), paymentMethod: 'Bank Transfer', notes: 'Client dashboard redesign', isRecurring: false },
        { id: 'tx-3', title: 'Index Fund Dividend', amount: 280.00, type: 'INCOME', category: 'Investment', date: dStr(10, 0), paymentMethod: 'Bank Transfer', notes: 'Quarterly dividends', isRecurring: false },
        { id: 'tx-4', title: 'Apartment Rent', amount: 1400.00, type: 'EXPENSE', category: 'Housing & Rent', date: dStr(13, 0), paymentMethod: 'Bank Transfer', notes: 'Monthly rent auto-transfer', isRecurring: true },
        { id: 'tx-5', title: 'Whole Foods Grocery Run', amount: 164.50, type: 'EXPENSE', category: 'Food & Dining', date: dStr(1, 0), paymentMethod: 'Credit Card', notes: 'Weekly organic groceries', isRecurring: false },
        { id: 'tx-6', title: 'Blue Bottle Artisan Coffee', amount: 14.80, type: 'EXPENSE', category: 'Food & Dining', date: dStr(2, 0), paymentMethod: 'UPI', notes: 'Morning roast with colleague', isRecurring: false },
        { id: 'tx-7', title: 'Uber Ride to Downtown', amount: 28.50, type: 'EXPENSE', category: 'Transportation', date: dStr(3, 0), paymentMethod: 'Credit Card', notes: 'Client office transit', isRecurring: false },
        { id: 'tx-8', title: 'High-Speed Fiber Internet', amount: 79.99, type: 'EXPENSE', category: 'Utilities', date: dStr(5, 0), paymentMethod: 'Debit Card', notes: 'Gigabit fiber optic', isRecurring: true },
        { id: 'tx-9', title: 'Electricity & Power Bill', amount: 112.40, type: 'EXPENSE', category: 'Utilities', date: dStr(7, 0), paymentMethod: 'Debit Card', notes: 'Power utility bill', isRecurring: false },
        { id: 'tx-10', title: 'Weekend Gourmet Dinner', amount: 96.20, type: 'EXPENSE', category: 'Food & Dining', date: dStr(6, 0), paymentMethod: 'Credit Card', notes: 'Weekend bistro dinner', isRecurring: false },
        { id: 'tx-11', title: 'Mechanical Keyboard Keycaps', amount: 65.00, type: 'EXPENSE', category: 'Shopping', date: dStr(8, 0), paymentMethod: 'Credit Card', notes: 'Custom PBT keycaps', isRecurring: false },
        { id: 'tx-12', title: 'Netflix & Spotify Subscriptions', amount: 27.98, type: 'EXPENSE', category: 'Entertainment', date: dStr(9, 0), paymentMethod: 'Credit Card', notes: 'Entertainment services', isRecurring: true },
        { id: 'tx-13', title: 'Subway Transit Card Top-up', amount: 45.00, type: 'EXPENSE', category: 'Transportation', date: dStr(11, 0), paymentMethod: 'UPI', notes: 'Metro reload', isRecurring: false },
        { id: 'tx-14', title: 'Annual Health Checkup & Vitamins', amount: 140.00, type: 'EXPENSE', category: 'Healthcare', date: dStr(12, 0), paymentMethod: 'Credit Card', notes: 'Preventative diagnostics', isRecurring: false },
        // Month -1
        { id: 'tx-15', title: 'Previous Month Salary', amount: 5200.00, type: 'INCOME', category: 'Salary', date: dStr(14, 1), paymentMethod: 'Bank Transfer', notes: 'Direct deposit', isRecurring: true },
        { id: 'tx-16', title: 'Apartment Rent', amount: 1400.00, type: 'EXPENSE', category: 'Housing & Rent', date: dStr(13, 1), paymentMethod: 'Bank Transfer', notes: 'Rent', isRecurring: true },
        { id: 'tx-17', title: 'Groceries Restock', amount: 480.00, type: 'EXPENSE', category: 'Food & Dining', date: dStr(10, 1), paymentMethod: 'Credit Card', notes: 'Pantry supplies', isRecurring: false },
        { id: 'tx-18', title: 'Concert Tickets', amount: 185.00, type: 'EXPENSE', category: 'Entertainment', date: dStr(5, 1), paymentMethod: 'Credit Card', notes: 'Live concert', isRecurring: false },
        // Month -2
        { id: 'tx-19', title: 'Earlier Month Salary', amount: 5200.00, type: 'INCOME', category: 'Salary', date: dStr(14, 2), paymentMethod: 'Bank Transfer', notes: 'Salary', isRecurring: true },
        { id: 'tx-20', title: 'Apartment Rent', amount: 1400.00, type: 'EXPENSE', category: 'Housing & Rent', date: dStr(13, 2), paymentMethod: 'Bank Transfer', notes: 'Rent', isRecurring: true },
        { id: 'tx-21', title: 'Flight Tickets', amount: 420.00, type: 'EXPENSE', category: 'Transportation', date: dStr(15, 2), paymentMethod: 'Credit Card', notes: 'Conference flight', isRecurring: false }
      ],
      budgets: [
        { id: 'bg-1', category: 'Food & Dining', limitAmount: 650.00, month: 'ALL' },
        { id: 'bg-2', category: 'Housing & Rent', limitAmount: 1500.00, month: 'ALL' },
        { id: 'bg-3', category: 'Transportation', limitAmount: 250.00, month: 'ALL' },
        { id: 'bg-4', category: 'Shopping', limitAmount: 300.00, month: 'ALL' },
        { id: 'bg-5', category: 'Utilities', limitAmount: 250.00, month: 'ALL' },
        { id: 'bg-6', category: 'Entertainment', limitAmount: 150.00, month: 'ALL' },
        { id: 'bg-7', category: 'Healthcare', limitAmount: 200.00, month: 'ALL' }
      ],
      goals: [
        { id: 'g-1', name: 'Emergency Safety Fund', targetAmount: 10000.00, currentAmount: 7250.00, deadline: dStr(-120, 0), category: 'Safety', notes: '6 months essential living expenses', progressPercent: 72.5 },
        { id: 'g-2', name: 'Tokyo Autumn Vacation', targetAmount: 3500.00, currentAmount: 2400.00, deadline: dStr(-210, 0), category: 'Travel', notes: 'Flights & culinary tour', progressPercent: 68.6 },
        { id: 'g-3', name: 'M3 Max MacBook Pro', targetAmount: 3200.00, currentAmount: 3200.00, deadline: dStr(5, 0), category: 'Technology', notes: 'Completed engineering laptop', progressPercent: 100.0 },
        { id: 'g-4', name: 'Home Studio Audio Gear', targetAmount: 1200.00, currentAmount: 480.00, deadline: dStr(-60, 0), category: 'Hobbies', notes: 'Acoustic treatment & speakers', progressPercent: 40.0 }
      ]
    };
  },

  getSummary(targetMonth) {
    const data = this.getData();
    const all = data.transactions;
    const currentMonth = (targetMonth && targetMonth.match(/^\d{4}-\d{2}$/)) ? targetMonth : new Date().toISOString().slice(0, 7);

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

    // 6 Month Trends
    const trends = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = d.toISOString().slice(0, 7);
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
      date: new Date().toISOString().slice(0, 10),
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
