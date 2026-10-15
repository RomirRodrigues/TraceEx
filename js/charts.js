/**
 * TraceEx Charts Module
 * Renders high-performance, responsive Chart.js visualizations.
 */
const ChartManager = {
  cashFlowChart: null,
  categoryChart: null,
  dailyChart: null,
  paymentChart: null,

  categoryColors: {
    'Food & Dining': '#f59e0b',
    'Housing & Rent': '#3b82f6',
    'Transportation': '#0ea5e9',
    'Shopping': '#ec4899',
    'Utilities': '#8b5cf6',
    'Entertainment': '#d946ef',
    'Healthcare': '#ef4444',
    'Salary': '#10b981',
    'Freelance': '#14b8a6',
    'Investment': '#6366f1',
    'Other': '#94a3b8'
  },

  getCategoryColor(category) {
    return this.categoryColors[category] || '#64748b';
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
      return d.toLocaleString('default', { month: 'short', year: '2-digit' });
    });

    const incomeData = trends.map(t => t.income);
    const expenseData = trends.map(t => t.expense);

    // Gradient fills
    const incGradient = ctx.createLinearGradient(0, 0, 0, 300);
    incGradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
    incGradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

    const expGradient = ctx.createLinearGradient(0, 0, 0, 300);
    expGradient.addColorStop(0, 'rgba(244, 63, 94, 0.35)');
    expGradient.addColorStop(1, 'rgba(244, 63, 94, 0.0)');

    this.cashFlowChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Income',
            data: incomeData,
            borderColor: '#10b981',
            backgroundColor: incGradient,
            borderWidth: 2.5,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#10b981',
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Expenses',
            data: expenseData,
            borderColor: '#f43f5e',
            backgroundColor: expGradient,
            borderWidth: 2.5,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#f43f5e',
            pointRadius: 4,
            pointHoverRadius: 6
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
            labels: {
              boxWidth: 12,
              font: { family: "'Plus Jakarta Sans', sans-serif", weight: '600' },
              color: '#94a3b8'
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${currency}${ctx.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8' }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            ticks: {
              color: '#94a3b8',
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
          labels: ['No Expenses Recorded'],
          datasets: [{ data: [1], backgroundColor: ['#334155'], borderWidth: 0 }]
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
          borderColor: 'rgba(15, 23, 42, 0.8)',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '500' },
              color: '#94a3b8',
              padding: 10
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const item = categoryBreakdown[ctx.dataIndex];
                return `${item.category}: ${currency}${item.amount.toLocaleString()} (${item.percent}%)`;
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

    const labels = Object.keys(dailyExpenses).map(dateStr => {
      const p = dateStr.split('-');
      return `${p[2]}`; // day number
    });
    const values = Object.values(dailyExpenses);

    this.dailyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Daily Spend',
          data: values,
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
          hoverBackgroundColor: '#818cf8',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => `Day ${items[0].label}`,
              label: (ctx) => `Spent: ${currency}${ctx.parsed.y.toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8' }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            ticks: {
              color: '#94a3b8',
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
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#0ea5e9', '#ec4899', '#8b5cf6'];

    this.paymentChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Total Spent',
          data: values,
          backgroundColor: colors.slice(0, labels.length),
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: ${currency}${ctx.parsed.x.toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            ticks: { color: '#94a3b8', callback: (val) => `${currency}${val}` }
          },
          y: {
            grid: { display: false },
            ticks: { color: '#94a3b8' }
          }
        }
      }
    });
  }
};
