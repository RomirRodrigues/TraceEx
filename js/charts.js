/**
 * TraceEx Modern Chart.js Module
 * 21st.dev Developer Edition
 */
const ChartManager = {
  cashFlowChart: null,
  categoryChart: null,
  dailyChart: null,
  paymentChart: null,

  categoryColors: {
    'Food & Dining': '#f59e0b',
    'Housing & Rent': '#6366f1',
    'Transportation': '#38bdf8',
    'Shopping': '#ec4899',
    'Utilities': '#a855f7',
    'Entertainment': '#e879f9',
    'Healthcare': '#f43f5e',
    'Salary': '#10b981',
    'Freelance': '#14b8a6',
    'Investment': '#818cf8',
    'Other': '#71717a'
  },

  getCategoryColor(category) {
    return this.categoryColors[category] || '#71717a';
  },

  renderCashFlow(canvasId, trends, currency) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (this.cashFlowChart) {
      this.cashFlowChart.destroy();
    }

    const labels = trends.map(t => {
      const parts = t.month.split('-');
      const d = new Date(parts[0], parseInt(parts[1], 10) - 1, 1);
      return d.toLocaleString('default', { month: 'short' }).toUpperCase();
    });

    const incomeData = trends.map(t => t.income);
    const expenseData = trends.map(t => t.expense);

    // Subtle modern developer gradients
    let incGradient = 'rgba(16, 185, 129, 0.15)';
    let expGradient = 'rgba(244, 63, 94, 0.12)';
    try {
      const g1 = ctx.createLinearGradient(0, 0, 0, 260);
      g1.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
      g1.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
      incGradient = g1;

      const g2 = ctx.createLinearGradient(0, 0, 0, 260);
      g2.addColorStop(0, 'rgba(244, 63, 94, 0.2)');
      g2.addColorStop(1, 'rgba(244, 63, 94, 0.0)');
      expGradient = g2;
    } catch (e) {}

    this.cashFlowChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'INFLOW',
            data: incomeData,
            borderColor: '#10b981',
            backgroundColor: incGradient,
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointBackgroundColor: '#09090b',
            pointBorderColor: '#10b981',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5
          },
          {
            label: 'OUTFLOW',
            data: expenseData,
            borderColor: '#f43f5e',
            backgroundColor: expGradient,
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointBackgroundColor: '#09090b',
            pointBorderColor: '#f43f5e',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 8,
              boxHeight: 8,
              usePointStyle: true,
              pointStyle: 'circle',
              font: { family: "'Geist Mono', monospace", size: 10, weight: '500' },
              color: '#71717a',
              padding: 16
            }
          },
          tooltip: {
            backgroundColor: '#18181b',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            titleFont: { family: "'Geist Mono', monospace", size: 11 },
            bodyFont: { family: "'Geist Mono', monospace", size: 11 },
            padding: 10,
            cornerRadius: 6,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${currency}${ctx.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { 
              font: { family: "'Geist Mono', monospace", size: 10 },
              color: '#71717a' 
            }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            border: { dash: [4, 4] },
            ticks: {
              font: { family: "'Geist Mono', monospace", size: 10 },
              color: '#71717a',
              callback: (val) => `${currency}${val}`
            }
          }
        }
      }
    });
  },

  renderCategoryDoughnut(canvasId, categoryBreakdown, currency) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (this.categoryChart) {
      this.categoryChart.destroy();
    }

    if (!categoryBreakdown || categoryBreakdown.length === 0) {
      this.categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['No Activity'],
          datasets: [{ data: [1], backgroundColor: ['#27272a'], borderWidth: 0 }]
        },
        options: {
          maintainAspectRatio: false,
          plugins: { tooltip: { enabled: false }, legend: { display: false } }
        }
      });
      return;
    }

    const labels = categoryBreakdown.map(c => c.category);
    const data = categoryBreakdown.map(c => c.amount);
    const bgColors = categoryBreakdown.map(c => this.getCategoryColor(c.category));

    this.categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: bgColors,
          borderWidth: 2,
          borderColor: '#09090b',
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '74%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 8,
              boxHeight: 8,
              usePointStyle: true,
              pointStyle: 'circle',
              font: { family: "'Geist Mono', monospace", size: 10, weight: '500' },
              color: '#a1a1aa',
              padding: 8
            }
          },
          tooltip: {
            backgroundColor: '#18181b',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            titleFont: { family: "'Geist Mono', monospace", size: 11 },
            bodyFont: { family: "'Geist Mono', monospace", size: 11 },
            padding: 8,
            cornerRadius: 6,
            callbacks: {
              label: (ctx) => {
                const item = categoryBreakdown[ctx.dataIndex];
                return ` ${item.category}: ${currency}${item.amount.toLocaleString()} (${item.percent}%)`;
              }
            }
          }
        }
      }
    });
  },

  renderDailyExpenses(canvasId, dailyExpenses, currency) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (this.dailyChart) {
      this.dailyChart.destroy();
    }

    const labels = Object.keys(dailyExpenses).map(dateStr => dateStr.split('-')[2]);
    const values = Object.values(dailyExpenses);

    this.dailyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Outflow',
          data: values,
          backgroundColor: '#3b82f6',
          borderRadius: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#18181b',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            titleFont: { family: "'Geist Mono', monospace", size: 11 },
            bodyFont: { family: "'Geist Mono', monospace", size: 11 },
            cornerRadius: 6,
            callbacks: {
              title: (items) => `Day ${items[0].label}`,
              label: (ctx) => ` Spent: ${currency}${ctx.parsed.y.toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: "'Geist Mono', monospace", size: 10 }, color: '#71717a' }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            border: { dash: [4, 4] },
            ticks: {
              font: { family: "'Geist Mono', monospace", size: 10 },
              color: '#71717a',
              callback: (val) => `${currency}${val}`
            }
          }
        }
      }
    });
  },

  renderPaymentMethods(canvasId, paymentMethods, currency) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (this.paymentChart) {
      this.paymentChart.destroy();
    }

    const labels = Object.keys(paymentMethods);
    const values = Object.values(paymentMethods);
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#38bdf8', '#ec4899', '#a855f7'];

    this.paymentChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Channel Volume',
          data: values,
          backgroundColor: colors.slice(0, labels.length),
          borderRadius: 3
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#18181b',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            titleFont: { family: "'Geist Mono', monospace", size: 11 },
            bodyFont: { family: "'Geist Mono', monospace", size: 11 },
            cornerRadius: 6,
            callbacks: {
              label: (ctx) => ` Volume: ${currency}${ctx.parsed.x.toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            border: { dash: [4, 4] },
            ticks: { font: { family: "'Geist Mono', monospace", size: 10 }, color: '#71717a', callback: (val) => `${currency}${val}` }
          },
          y: {
            grid: { display: false },
            ticks: { font: { family: "'Geist Mono', monospace", size: 10 }, color: '#a1a1aa' }
          }
        }
      }
    });
  }
};
