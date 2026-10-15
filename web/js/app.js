/**
 * TraceEx Main Application Controller
 */
const App = {
  state: {
    activeTab: 'dashboard',
    currentMonth: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    currency: '₹',
    currencyCode: 'INR',
    theme: 'dark',
    summary: null,
    transactions: [],
    editingTxId: null,
    editingGoalId: null
  },

  async init() {
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    await this.refreshData();
  },

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('[data-tab-target]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab-target');
        this.switchTab(tab);
      });
    });

    // Month Selector
    const monthSelect = document.getElementById('month-selector');
    if (monthSelect) {
      // populate with current and past 6 months
      this.populateMonthSelector(monthSelect);
      monthSelect.addEventListener('change', (e) => {
        this.state.currentMonth = e.target.value;
        this.refreshData();
      });
    }

    // Currency Selector
    const curSelect = document.getElementById('currency-selector');
    if (curSelect) {
      curSelect.addEventListener('change', async (e) => {
        const val = e.target.value;
        this.state.currency = val;
        await API.updateSettings({ currency: val });
        this.showToast('Currency updated to ' + val);
        this.refreshData();
      });
    }

    // Theme Toggle
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => this.toggleTheme());
    }

    // Add Transaction Modal Triggers
    const openAddBtn = document.getElementById('btn-add-tx');
    if (openAddBtn) {
      openAddBtn.addEventListener('click', () => this.openTransactionModal());
    }

    // Transaction Form Submission
    const txForm = document.getElementById('tx-form');
    if (txForm) {
      txForm.addEventListener('submit', (e) => this.handleTransactionSubmit(e));
    }

    // Budget Form Submission
    const budgetForm = document.getElementById('budget-form');
    if (budgetForm) {
      budgetForm.addEventListener('submit', (e) => this.handleBudgetSubmit(e));
    }

    // Goal Form Submission
    const goalForm = document.getElementById('goal-form');
    if (goalForm) {
      goalForm.addEventListener('submit', (e) => this.handleGoalSubmit(e));
    }

    // Transaction Filters
    const filterInputs = ['filter-search', 'filter-type', 'filter-category', 'filter-payment'];
    filterInputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.applyTransactionFilters());
        el.addEventListener('change', () => this.applyTransactionFilters());
      }
    });

    // Reset Filter Button
    const resetFiltersBtn = document.getElementById('btn-reset-filters');
    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', () => {
        document.getElementById('filter-search').value = '';
        document.getElementById('filter-type').value = 'ALL';
        document.getElementById('filter-category').value = 'ALL';
        document.getElementById('filter-payment').value = 'ALL';
        this.applyTransactionFilters();
      });
    }

    // Demo Data & Clear Data buttons
    const btnReloadDemo = document.getElementById('btn-reload-demo');
    if (btnReloadDemo) {
      btnReloadDemo.addEventListener('click', () => this.reloadDemoData());
    }

    const btnClearAll = document.getElementById('btn-clear-data');
    if (btnClearAll) {
      btnClearAll.addEventListener('click', () => this.clearAllData());
    }

    // Print Report Button
    const btnPrint = document.getElementById('btn-print-report');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => window.print());
    }
  },

  setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Ctrl+K or 'N' (when not inside inputs) opens Add Transaction
      if ((e.ctrlKey && e.key === 'k') || (e.key === 'n' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName))) {
        e.preventDefault();
        this.openTransactionModal();
      }
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
  },

  populateMonthSelector(selectEl) {
    selectEl.innerHTML = '';
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = label;
      if (val === this.state.currentMonth) opt.selected = true;
      selectEl.appendChild(opt);
    }
  },

  switchTab(tabId) {
    this.state.activeTab = tabId;
    document.querySelectorAll('[data-tab-target]').forEach(btn => {
      const isActive = btn.getAttribute('data-tab-target') === tabId;
      btn.classList.toggle('bg-zinc-800', isActive);
      btn.classList.toggle('text-white', isActive);
      btn.classList.toggle('shadow-sm', isActive);
      btn.classList.toggle('border-zinc-700/60', isActive);
      btn.classList.toggle('text-zinc-400', !isActive);
      btn.classList.toggle('hover:text-zinc-200', !isActive);
    });

    document.querySelectorAll('[data-tab-content]').forEach(view => {
      const isTarget = view.getAttribute('data-tab-content') === tabId;
      view.classList.toggle('hidden', !isTarget);
      if (isTarget) {
        view.classList.remove('motion-tab-pane');
        void view.offsetWidth; // trigger reflow for smooth motion animation
        view.classList.add('motion-tab-pane');
      }
    });

    if (tabId === 'transactions') {
      this.loadTransactionsTable();
    } else if (tabId === 'analytics') {
      this.renderAnalyticsTab();
    }
  },

  toggleTheme() {
    const isDark = !document.body.classList.contains('light-theme');
    if (isDark) {
      document.body.classList.add('light-theme');
      this.state.theme = 'light';
    } else {
      document.body.classList.remove('light-theme');
      this.state.theme = 'dark';
    }
    const icon = document.getElementById('theme-icon');
    if (icon) {
      icon.innerHTML = this.state.theme === 'light' ? '🌙' : '☀️';
    }
    API.updateSettings({ theme: this.state.theme });
    if (this.state.summary) {
      this.updateCharts(this.state.summary);
    }
  },

  async refreshData() {
    try {
      let summary = await API.getSummary(this.state.currentMonth);
      if (summary && summary.monthlyIncome === 0 && summary.monthlyExpense === 0 && !API.isBackendAvailable) {
        await API.resetToSample();
        summary = await API.getSummary(this.state.currentMonth);
      }
      this.state.summary = summary;

      if (summary.settings && summary.settings.currency) {
        this.state.currency = summary.settings.currency;
        const curSelect = document.getElementById('currency-selector');
        if (curSelect) curSelect.value = this.state.currency;
      }

      this.updateDashboardMetrics(summary);
      this.updateCharts(summary);
      this.updateBudgetWidget(summary);
      this.updateRecentTransactions(summary);
      this.renderBudgetsAndGoals(summary);

      if (this.state.activeTab === 'transactions') {
        this.loadTransactionsTable();
      } else if (this.state.activeTab === 'analytics') {
        this.renderAnalyticsTab();
      }

    } catch (err) {
      console.error(err);
      this.showToast('Error syncing with TraceEx backend: ' + err.message, 'error');
    }
  },

  updateDashboardMetrics(summary) {
    const cur = this.state.currency;

    // Total Net Balance
    const balanceEl = document.getElementById('metric-balance');
    if (balanceEl) {
      balanceEl.textContent = `${cur}${summary.monthlyBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      balanceEl.className = 'text-3xl font-extrabold font-mono-num ' + (summary.monthlyBalance >= 0 ? 'text-emerald-400' : 'text-rose-400');
    }

    // Monthly Income
    const incomeEl = document.getElementById('metric-income');
    if (incomeEl) {
      incomeEl.textContent = `+${cur}${summary.monthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    }

    // Monthly Expenses
    const expenseEl = document.getElementById('metric-expenses');
    if (expenseEl) {
      expenseEl.textContent = `-${cur}${summary.monthlyExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    }

    // Savings Rate
    const savingsEl = document.getElementById('metric-savings-rate');
    const savingsBar = document.getElementById('metric-savings-bar');
    if (savingsEl) {
      savingsEl.textContent = `${summary.savingsRate}%`;
    }
    if (savingsBar) {
      savingsBar.style.width = `${Math.min(100, summary.savingsRate)}%`;
      savingsBar.className = 'h-full transition-all duration-500 ' + 
        (summary.savingsRate >= 30 ? 'bg-emerald-500' : (summary.savingsRate >= 15 ? 'bg-amber-500' : 'bg-rose-500'));
    }

    // Net worth / all-time stats
    const netWorthEl = document.getElementById('metric-networth');
    if (netWorthEl) {
      netWorthEl.textContent = `${cur}${summary.totalNetWorth.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    }
  },

  updateCharts(summary) {
    const cur = this.state.currency;
    if (summary.trends) {
      ChartManager.renderCashFlow('cashflow-chart', summary.trends, cur);
    }
    if (summary.categoryBreakdown) {
      ChartManager.renderCategoryDoughnut('category-donut-chart', summary.categoryBreakdown, cur);
    }
  },

  updateBudgetWidget(summary) {
    const container = document.getElementById('budget-alerts-container');
    if (!container) return;

    const reports = summary.budgetReports || [];
    if (reports.length === 0) {
      container.innerHTML = `<div class="text-xs font-mono text-zinc-500 text-center py-4">No active ceiling caps configured.</div>`;
      return;
    }

    let html = '';
    reports.slice(0, 4).forEach(b => {
      let colorClass = 'bg-emerald-500';
      let badgeClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      if (b.status === 'WARNING') {
        colorClass = 'bg-amber-500';
        badgeClass = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      } else if (b.status === 'EXCEEDED') {
        colorClass = 'bg-rose-500';
        badgeClass = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      }

      html += `
        <div class="space-y-1.5 pb-2 border-b border-white/[0.04] last:border-0 font-mono text-xs">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 text-zinc-300">
              ${this.getCategoryDot(b.category)}
              <span class="font-medium text-xs">${this.escapeHtml(b.category)}</span>
            </div>
            <span class="text-[10px] px-1.5 py-0.2 rounded border font-mono ${badgeClass}">
              ${b.percent}%
            </span>
          </div>
          <div class="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
            <div class="${colorClass} h-full transition-all duration-300" style="width: ${Math.min(100, b.percent)}%"></div>
          </div>
          <div class="flex justify-between text-[10px] text-zinc-500">
            <span>Spent: ${this.state.currency}${b.spent.toLocaleString()}</span>
            <span>Cap: ${this.state.currency}${b.limitAmount.toLocaleString()}</span>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  },

  updateRecentTransactions(summary) {
    const list = document.getElementById('recent-tx-list');
    if (!list) return;

    const txs = summary.recentTransactions || [];
    if (txs.length === 0) {
      list.innerHTML = `<div class="text-sm text-slate-400 text-center py-6">No recent transactions recorded.</div>`;
      return;
    }

    let html = '';
    txs.forEach(t => {
      const isIncome = t.type === 'INCOME';
      const sign = isIncome ? '+' : '-';
      const color = isIncome ? 'text-emerald-400' : 'text-zinc-200';

      html += `
        <div class="flex items-center justify-between p-2.5 rounded-lg hover:bg-zinc-800/40 transition border border-transparent hover:border-zinc-800">
          <div class="flex items-center gap-3">
            <div class="w-7 h-7 rounded-md flex items-center justify-center ${isIncome ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/60'}">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                ${isIncome 
                  ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 17l9.2-9.2M17 17V8H8" />' 
                  : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 7l-9.2 9.2M7 7v9h9" />'}
              </svg>
            </div>
            <div>
              <div class="font-medium text-zinc-100 text-xs sm:text-sm tracking-tight">${this.escapeHtml(t.title)}</div>
              <div class="text-[11px] text-zinc-500 font-mono flex items-center gap-1.5 mt-0.5">
                <span>${t.date}</span>
                <span>/</span>
                <span class="text-zinc-400">${this.escapeHtml(t.category)}</span>
                <span>/</span>
                <span class="text-zinc-500">${this.escapeHtml(t.paymentMethod)}</span>
              </div>
            </div>
          </div>
          <div class="text-right">
            <div class="font-mono-num font-semibold text-xs sm:text-sm ${color}">${sign}${this.state.currency}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <button onclick="App.viewReceipt('${t.id}')" class="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 underline">receipt</button>
          </div>
        </div>
      `;
    });
    list.innerHTML = html;
  },

  async loadTransactionsTable() {
    const tbody = document.getElementById('tx-table-body');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-slate-400">Loading transactions...</td></tr>`;

    try {
      const filters = {
        search: document.getElementById('filter-search')?.value || '',
        type: document.getElementById('filter-type')?.value || 'ALL',
        category: document.getElementById('filter-category')?.value || 'ALL',
        payment: document.getElementById('filter-payment')?.value || 'ALL'
      };

      const list = await API.getTransactions(filters);
      this.state.transactions = list;

      const countEl = document.getElementById('tx-count-badge');
      if (countEl) countEl.textContent = `${list.length} Records`;

      if (list.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center py-12 text-slate-400">
              <div class="text-3xl mb-2">🔍</div>
              <div>No transactions found matching your criteria.</div>
            </td>
          </tr>
        `;
        return;
      }

      let html = '';
      list.forEach(t => {
        const isIncome = t.type === 'INCOME';
        const sign = isIncome ? '+' : '-';
        const amtColor = isIncome ? 'text-emerald-400' : 'text-slate-100';
        const catClass = this.getCategoryClass(t.category);

        html += `
          <tr class="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition text-xs">
            <td class="py-3 px-4 text-zinc-400 whitespace-nowrap font-mono text-[11px]">${t.date}</td>
            <td class="py-3 px-4 font-medium text-zinc-100">
              <div class="flex items-center gap-2">
                <span>${this.escapeHtml(t.title)}</span>
                ${t.isRecurring ? '<span class="text-[9px] font-mono px-1.5 py-0.2 rounded border border-zinc-700 bg-zinc-800 text-zinc-400">REC</span>' : ''}
              </div>
              ${t.notes ? `<div class="text-[11px] text-zinc-500 font-normal mt-0.5 truncate max-w-xs">${this.escapeHtml(t.notes)}</div>` : ''}
            </td>
            <td class="py-3 px-4">
              <span class="badge-cat">
                ${this.getCategoryDot(t.category)}
                <span>${this.escapeHtml(t.category)}</span>
              </span>
            </td>
            <td class="py-3 px-4 text-zinc-400 text-xs">
              <span class="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-800/60 border border-zinc-700/40 text-zinc-300">${this.escapeHtml(t.paymentMethod)}</span>
            </td>
            <td class="py-3 px-4 text-right font-mono-num font-semibold ${amtColor} whitespace-nowrap">
              ${sign}${this.state.currency}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </td>
            <td class="py-3 px-4 text-right whitespace-nowrap">
              <div class="flex items-center justify-end gap-1">
                <button onclick="App.viewReceipt('${t.id}')" title="Receipt" class="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </button>
                <button onclick="App.openTransactionModal('${t.id}')" title="Edit" class="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                </button>
                <button onclick="App.deleteTransaction('${t.id}')" title="Delete" class="p-1 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </td>
          </tr>
        `;
      });
      tbody.innerHTML = html;

    } catch (e) {
      console.error(e);
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-rose-400">Failed to load transactions: ${e.message}</td></tr>`;
    }
  },

  applyTransactionFilters() {
    this.loadTransactionsTable();
  },

  // ================= MODALS & ACTIONS =================

  openTransactionModal(editId = null) {
    this.state.editingTxId = editId;
    const modal = document.getElementById('tx-modal');
    const titleEl = document.getElementById('tx-modal-title');
    const form = document.getElementById('tx-form');

    form.reset();
    document.getElementById('tx-date').value = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

    if (editId) {
      titleEl.textContent = 'Edit Transaction';
      const tx = this.state.transactions.find(x => x.id === editId);
      if (tx) {
        document.getElementById('tx-title').value = tx.title;
        document.getElementById('tx-amount').value = tx.amount;
        document.getElementById('tx-type').value = tx.type;
        document.getElementById('tx-category').value = tx.category;
        document.getElementById('tx-date').value = tx.date;
        document.getElementById('tx-payment').value = tx.paymentMethod;
        document.getElementById('tx-recurring').checked = !!tx.isRecurring;
        document.getElementById('tx-notes').value = tx.notes || '';
      }
    } else {
      titleEl.textContent = 'Add New Transaction';
    }

    modal.classList.remove('hidden');
    document.getElementById('tx-title').focus();
  },

  closeTransactionModal() {
    document.getElementById('tx-modal').classList.add('hidden');
    this.state.editingTxId = null;
  },

  async handleTransactionSubmit(e) {
    e.preventDefault();
    const payload = {
      title: document.getElementById('tx-title').value.trim(),
      amount: parseFloat(document.getElementById('tx-amount').value),
      type: document.getElementById('tx-type').value,
      category: document.getElementById('tx-category').value,
      date: document.getElementById('tx-date').value,
      paymentMethod: document.getElementById('tx-payment').value,
      isRecurring: document.getElementById('tx-recurring').checked,
      notes: document.getElementById('tx-notes').value.trim()
    };

    if (!payload.title || isNaN(payload.amount) || payload.amount <= 0) {
      this.showToast('Please enter a valid title and positive amount', 'error');
      return;
    }

    try {
      if (this.state.editingTxId) {
        await API.updateTransaction(this.state.editingTxId, payload);
        this.showToast('Transaction updated successfully!');
      } else {
        await API.addTransaction(payload);
        this.showToast('Transaction created successfully!');
      }

      this.closeTransactionModal();
      await this.refreshData();
    } catch (err) {
      this.showToast('Failed to save: ' + err.message, 'error');
    }
  },

  async deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await API.deleteTransaction(id);
      this.showToast('Transaction removed');
      await this.refreshData();
    } catch (err) {
      this.showToast('Failed to delete: ' + err.message, 'error');
    }
  },

  // View Digital Receipt
  viewReceipt(id) {
    const tx = (this.state.transactions.find(x => x.id === id)) || 
               (this.state.summary?.recentTransactions?.find(x => x.id === id));
    if (!tx) return;

    const modal = document.getElementById('receipt-modal');
    document.getElementById('receipt-id').textContent = tx.id.slice(0, 13);
    document.getElementById('receipt-date').textContent = tx.date;
    document.getElementById('receipt-title').textContent = tx.title;
    document.getElementById('receipt-category').textContent = tx.category;
    document.getElementById('receipt-payment').textContent = tx.paymentMethod;
    document.getElementById('receipt-amount').textContent = `${this.state.currency}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    document.getElementById('receipt-notes').textContent = tx.notes || 'No extra notes recorded.';

    modal.classList.remove('hidden');
  },

  closeReceiptModal() {
    document.getElementById('receipt-modal').classList.add('hidden');
  },

  // Budgets & Goals
  renderBudgetsAndGoals(summary) {
    // Render Budget cards
    const bContainer = document.getElementById('budgets-grid');
    if (bContainer) {
      const reports = summary.budgetReports || [];
      if (reports.length === 0) {
        bContainer.innerHTML = `<div class="col-span-full py-8 text-center text-slate-400">No monthly budgets defined yet. Click "+ Set Budget" above!</div>`;
      } else {
        let bHtml = '';
        reports.forEach(b => {
          let barColor = 'bg-emerald-500';
          let textColor = 'text-emerald-400';
          if (b.status === 'WARNING') {
            barColor = 'bg-amber-500';
            textColor = 'text-amber-400';
          } else if (b.status === 'EXCEEDED') {
            barColor = 'bg-rose-500';
            textColor = 'text-rose-400';
          }

          bHtml += `
            <div class="bento-card p-4 relative overflow-hidden">
              <div class="flex items-center justify-between mb-2.5">
                <div class="flex items-center gap-2">
                  ${this.getCategoryDot(b.category)}
                  <span class="font-medium text-xs text-zinc-200">${this.escapeHtml(b.category)}</span>
                </div>
                <button onclick="App.deleteBudget('${b.id}')" title="Delete budget" class="text-zinc-500 hover:text-zinc-300 p-0.5 rounded transition">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              <div class="flex items-baseline justify-between mb-2">
                <span class="text-xl font-bold font-mono-num ${textColor}">${this.state.currency}${b.spent.toLocaleString()}</span>
                <span class="text-[11px] font-mono text-zinc-500">CAP: ${this.state.currency}${b.limitAmount.toLocaleString()}</span>
              </div>

              <div class="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden mb-2">
                <div class="${barColor} h-full transition-all duration-300" style="width: ${Math.min(100, b.percent)}%"></div>
              </div>

              <div class="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                <span>${b.percent}% utilized</span>
                <span>${b.remaining >= 0 ? `${this.state.currency}${b.remaining.toLocaleString()} left` : `Exceeded by ${this.state.currency}${Math.abs(b.remaining).toLocaleString()}`}</span>
              </div>
            </div>
          `;
        });
        bContainer.innerHTML = bHtml;
      }
    }

    // Render Goals cards
    const gContainer = document.getElementById('goals-grid');
    if (gContainer) {
      const goals = summary.goals || [];
      if (goals.length === 0) {
        gContainer.innerHTML = `<div class="col-span-full py-8 text-center text-zinc-500 font-mono text-xs">No active targets defined.</div>`;
      } else {
        let gHtml = '';
        goals.forEach(g => {
          const isComplete = g.currentAmount >= g.targetAmount;
          gHtml += `
            <div class="bento-card p-4 relative">
              <div class="flex items-start justify-between mb-2">
                <div>
                  <div class="font-medium text-zinc-100 text-xs sm:text-sm flex items-center gap-1.5">
                    <span>${this.escapeHtml(g.name)}</span>
                    ${isComplete ? '<span class="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded">FULFILLED</span>' : ''}
                  </div>
                  <p class="text-[11px] text-zinc-500 font-mono mt-0.5">${this.escapeHtml(g.notes || g.category)}</p>
                </div>
                <button onclick="App.deleteGoal('${g.id}')" title="Delete target" class="text-zinc-500 hover:text-zinc-300 p-0.5 rounded transition">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              <div class="flex items-baseline justify-between mb-2">
                <div>
                  <span class="text-lg font-bold font-mono-num text-zinc-100">${this.state.currency}${g.currentAmount.toLocaleString()}</span>
                  <span class="text-xs font-mono text-zinc-500"> / ${this.state.currency}${g.targetAmount.toLocaleString()}</span>
                </div>
                <span class="text-xs font-mono font-medium text-zinc-400">${g.progressPercent}%</span>
              </div>

              <div class="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden mb-2.5">
                <div class="bg-indigo-500 h-full transition-all duration-300" style="width: ${Math.min(100, g.progressPercent)}%"></div>
              </div>

              <div class="flex items-center justify-between text-[11px] pt-1">
                <span class="text-zinc-500 font-mono">${g.deadline ? 'Due ' + g.deadline : 'No date'}</span>
                <button onclick="App.openAddFundsModal('${g.id}', '${this.escapeHtml(g.name)}')" class="px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-mono transition">
                  + Add Funds
                </button>
              </div>
            </div>
          `;
        });
        gContainer.innerHTML = gHtml;
      }
    }
  },

  openBudgetModal() {
    document.getElementById('budget-modal').classList.remove('hidden');
  },

  closeBudgetModal() {
    document.getElementById('budget-modal').classList.add('hidden');
  },

  async handleBudgetSubmit(e) {
    e.preventDefault();
    const payload = {
      category: document.getElementById('budget-category').value,
      limitAmount: parseFloat(document.getElementById('budget-limit').value),
      month: 'ALL'
    };
    if (isNaN(payload.limitAmount) || payload.limitAmount <= 0) {
      this.showToast('Please enter a positive budget limit', 'error');
      return;
    }
    try {
      await API.setBudget(payload);
      this.showToast('Budget configured for ' + payload.category);
      this.closeBudgetModal();
      await this.refreshData();
    } catch (err) {
      this.showToast('Error saving budget: ' + err.message, 'error');
    }
  },

  async deleteBudget(id) {
    if (!confirm('Delete this budget limit?')) return;
    try {
      await API.deleteBudget(id);
      this.showToast('Budget deleted');
      await this.refreshData();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  openGoalModal() {
    document.getElementById('goal-modal').classList.remove('hidden');
  },

  closeGoalModal() {
    document.getElementById('goal-modal').classList.add('hidden');
  },

  async handleGoalSubmit(e) {
    e.preventDefault();
    const payload = {
      name: document.getElementById('goal-name').value.trim(),
      targetAmount: parseFloat(document.getElementById('goal-target').value),
      currentAmount: parseFloat(document.getElementById('goal-current').value || 0),
      deadline: document.getElementById('goal-deadline').value,
      category: document.getElementById('goal-category').value,
      notes: document.getElementById('goal-notes').value.trim()
    };
    if (!payload.name || isNaN(payload.targetAmount) || payload.targetAmount <= 0) {
      this.showToast('Please enter a goal title and target amount', 'error');
      return;
    }
    try {
      await API.addGoal(payload);
      this.showToast('Savings Goal created!');
      this.closeGoalModal();
      await this.refreshData();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  async deleteGoal(id) {
    if (!confirm('Delete this savings goal?')) return;
    try {
      await API.deleteGoal(id);
      this.showToast('Goal removed');
      await this.refreshData();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  openAddFundsModal(goalId, goalName) {
    this.state.editingGoalId = goalId;
    document.getElementById('funds-goal-name').textContent = goalName;
    document.getElementById('funds-modal').classList.remove('hidden');
    document.getElementById('funds-amount').focus();
  },

  closeFundsModal() {
    document.getElementById('funds-modal').classList.add('hidden');
    this.state.editingGoalId = null;
  },

  async handleAddFundsSubmit(e) {
    e.preventDefault();
    const addAmt = parseFloat(document.getElementById('funds-amount').value);
    if (isNaN(addAmt) || addAmt <= 0) {
      this.showToast('Please enter a valid amount', 'error');
      return;
    }
    const goal = this.state.summary?.goals?.find(g => g.id === this.state.editingGoalId);
    if (!goal) return;

    goal.currentAmount = (goal.currentAmount || 0) + addAmt;
    try {
      await API.updateGoal(goal.id, goal);
      this.showToast(`Added ${this.state.currency}${addAmt} to ${goal.name}!`);
      this.closeFundsModal();
      await this.refreshData();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  // Analytics tab
  renderAnalyticsTab() {
    const summary = this.state.summary;
    if (!summary) return;
    const cur = this.state.currency;

    if (summary.dailyExpenses) {
      ChartManager.renderDailyExpenses('daily-expenses-chart', summary.dailyExpenses, cur);
    }
    if (summary.paymentMethods) {
      ChartManager.renderPaymentMethods('payment-methods-chart', summary.paymentMethods, cur);
    }

    // Leaderboard of top 5 expenses
    const topEl = document.getElementById('top-expenses-list');
    if (topEl) {
      const topTxs = summary.topExpenses || [];
      if (topTxs.length === 0) {
        topEl.innerHTML = `<div class="text-zinc-500 font-mono text-xs">No debits logged for this cycle.</div>`;
      } else {
        let html = '';
        topTxs.forEach((t, idx) => {
          html += `
            <div class="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0 font-mono text-xs">
              <div class="flex items-center gap-2.5">
                <span class="w-5 h-5 rounded bg-zinc-900 border border-white/[0.08] text-[10px] text-zinc-400 flex items-center justify-center font-mono">0${idx + 1}</span>
                <div>
                  <div class="font-medium text-zinc-200 text-xs">${this.escapeHtml(t.title)}</div>
                  <div class="text-[10px] text-zinc-500">${t.date} / ${this.escapeHtml(t.category)}</div>
                </div>
              </div>
              <div class="font-mono-num font-semibold text-rose-400">-${cur}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
          `;
        });
        topEl.innerHTML = html;
      }
    }
  },

  // Demo & Reset
  async reloadDemoData() {
    if (!confirm('Reset TraceEx database to clean sample financial records?')) return;
    try {
      await API.resetToSample();
      this.showToast('Sample dataset restored!');
      await this.refreshData();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  async clearAllData() {
    if (!confirm('Are you sure you want to clear ALL transactions, budgets, and goals? This action cannot be undone!')) return;
    try {
      await API.clearAll();
      this.showToast('All records cleared successfully.');
      await this.refreshData();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  closeAllModals() {
    this.closeTransactionModal();
    this.closeBudgetModal();
    this.closeGoalModal();
    this.closeFundsModal();
    this.closeReceiptModal();
  },

  // Helpers
  getCategoryDot(cat) {
    const color = ChartManager.getCategoryColor(cat);
    return `<span class="badge-cat-dot" style="background-color: ${color}"></span>`;
  },

  getCategoryClass(cat) {
    const map = {
      'Food & Dining': 'cat-food',
      'Housing & Rent': 'cat-housing',
      'Transportation': 'cat-transport',
      'Shopping': 'cat-shopping',
      'Utilities': 'cat-utilities',
      'Entertainment': 'cat-entertainment',
      'Healthcare': 'cat-healthcare',
      'Salary': 'cat-salary',
      'Freelance': 'cat-freelance',
      'Investment': 'cat-investment'
    };
    return map[cat] || 'cat-other';
  },

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },

  // ================= MOBILE PAYMENT SYNC & LIVE SMS PARSER =================

  openMobileSyncModal() {
    const modal = document.getElementById('mobile-sync-modal');
    if (modal) modal.classList.remove('hidden');
    const input = document.getElementById('sms-input-text');
    if (input) input.focus();
  },

  closeMobileSyncModal() {
    const modal = document.getElementById('mobile-sync-modal');
    if (modal) modal.classList.add('hidden');
  },

  loadSampleSms(type) {
    const samples = {
      swiggy: "Dear Customer, your A/c ending in 4210 is debited by Rs 340.00 on 15-Oct-26 to VPA swiggy@icici via UPI (Ref 4291847192).",
      starbucks: "Paid Rs. 280.00 to Starbucks Coffee using Google Pay. UPI Ref: 9812401827. Bal: Rs 14,230.",
      shell: "Chase: Card ending 7712 charged $45.20 at Shell Oil Gas on Oct 15 at 08:32 PM.",
      salary: "Your A/c 9021 is CREDITED with INR 65,000.00 on 01-Oct-26 by Tech Global Services Payroll.",
      netflix: "Apple Pay: $22.99 spent at Netflix Subscription on your Master Card."
    };

    const text = samples[type] || samples.swiggy;
    const input = document.getElementById('sms-input-text');
    if (input) {
      input.value = text;
      this.parseSmsLive();
    }
  },

  async parseSmsLive() {
    const input = document.getElementById('sms-input-text');
    const resultCard = document.getElementById('parsed-result-card');
    if (!input || !resultCard) return;

    const text = input.value.trim();
    if (!text) {
      resultCard.classList.add('hidden');
      return;
    }

    try {
      const parsed = await API.parseNotificationText(text);
      this.state.parsedTx = parsed;

      resultCard.classList.remove('hidden');
      const isIncome = parsed.type === 'INCOME';
      const sign = isIncome ? '+' : '-';
      const color = isIncome ? 'text-emerald-400' : 'text-rose-400';

      document.getElementById('parsed-title').textContent = parsed.title;
      document.getElementById('parsed-amount').textContent = `${sign}${this.state.currency}${parsed.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      document.getElementById('parsed-amount').className = `text-xl font-bold font-mono-num ${color}`;
      document.getElementById('parsed-category').textContent = `${this.getCategoryIcon(parsed.category)} ${parsed.category}`;
      document.getElementById('parsed-payment').textContent = parsed.paymentMethod;
      document.getElementById('parsed-type').textContent = parsed.type;
      document.getElementById('parsed-notes').textContent = parsed.notes;

    } catch (err) {
      resultCard.classList.add('hidden');
      this.showToast('Could not detect amount or merchant from text', 'error');
    }
  },

  async confirmParsedTx() {
    if (!this.state.parsedTx) return;
    try {
      await API.addTransaction(this.state.parsedTx);
      this.showToast(`Auto-recorded: ${this.state.parsedTx.title} (${this.state.currency}${this.state.parsedTx.amount})!`);
      const input = document.getElementById('sms-input-text');
      if (input) input.value = '';
      const resultCard = document.getElementById('parsed-result-card');
      if (resultCard) resultCard.classList.add('hidden');
      this.state.parsedTx = null;
      await this.refreshData();
    } catch (err) {
      this.showToast('Failed to add transaction: ' + err.message, 'error');
    }
  },

  copyWebhookUrl() {
    const url = window.location.origin + '/api/webhook/payment';
    navigator.clipboard.writeText(url).then(() => {
      this.showToast('Webhook URL copied to clipboard: ' + url);
    }).catch(() => {
      prompt('Copy your Live Webhook URL:', url);
    });
  },

  showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    const dotColor = type === 'error' ? 'bg-rose-400' : 'bg-emerald-400';
    toast.className = 'fixed bottom-4 right-4 z-50 px-3.5 py-2 rounded-md bg-zinc-950 border border-white/[0.12] shadow-2xl flex items-center gap-2.5 text-xs font-mono text-zinc-200 motion-spring-in';
    toast.innerHTML = `<span class="w-1.5 h-1.5 rounded-full ${dotColor}"></span><span>${this.escapeHtml(msg)}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(4px)';
      toast.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    }, 2400);
  }
};

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());
