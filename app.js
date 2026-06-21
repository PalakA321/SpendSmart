/* ──────────────────────────────────────────
   SMART EXPENSE TRACKER — app.js
   State → localStorage → render() → charts
────────────────────────────────────────── */

// ── STATE ──────────────────────────────────
let transactions = JSON.parse(localStorage.getItem('sst_transactions')) || [];
let budget       = parseFloat(localStorage.getItem('sst_budget')) || 0;
let darkMode     = localStorage.getItem('sst_dark') === 'true';
let currentFilter = 'all';
let currentCat    = 'all';
let searchQuery   = '';

// Chart instances
let pieChart, barChart, lineChart;

// Category icons
const catIcons = {
  Food:          { icon: '🍔', bg: '#fef3c7', color: '#92400e' },
  Transport:     { icon: '🚌', bg: '#dbeafe', color: '#1e40af' },
  Shopping:      { icon: '🛍️', bg: '#fce7f3', color: '#9d174d' },
  Entertainment: { icon: '🎬', bg: '#ede9fe', color: '#5b21b6' },
  Health:        { icon: '💊', bg: '#d1fae5', color: '#065f46' },
  Education:     { icon: '📚', bg: '#e0f2fe', color: '#075985' },
  Salary:        { icon: '💰', bg: '#dcfce7', color: '#14532d' },
  Freelance:     { icon: '💻', bg: '#f0fdf4', color: '#166534' },
  Other:         { icon: '📌', bg: '#f1f5f9', color: '#475569' },
};

// ── INIT ───────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Set today's date as default
  document.getElementById('txDate').valueAsDate = new Date();

  // Apply dark mode if saved
  if (darkMode) document.body.classList.remove('light');

  // Init charts (empty)
  initCharts();

  // Render everything
  render();

  // Budget input
  if (budget > 0) document.getElementById('budgetInput').value = budget;

  // ── EVENT LISTENERS ──
  document.getElementById('addTxBtn').addEventListener('click', addTransaction);
  document.getElementById('txTitle').addEventListener('keypress', e => { if (e.key === 'Enter') addTransaction(); });

  document.getElementById('setBudgetBtn').addEventListener('click', () => {
    const val = parseFloat(document.getElementById('budgetInput').value);
    if (!isNaN(val) && val > 0) {
      budget = val;
      localStorage.setItem('sst_budget', budget);
      render();
    }
  });

  document.getElementById('darkToggle').addEventListener('click', () => {
    darkMode = !darkMode;
    document.body.classList.toggle('light', !darkMode);
    localStorage.setItem('sst_dark', darkMode);
    updateCharts(); // re-render charts with correct colours
  });

  document.getElementById('exportBtn').addEventListener('click', exportCSV);

  document.getElementById('searchInput').addEventListener('input', e => {
    searchQuery = e.target.value.toLowerCase();
    renderList();
  });

  document.getElementById('categoryFilter').addEventListener('change', e => {
    currentCat = e.target.value;
    renderList();
  });

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderList();
    });
  });
});

// ── SAVE ───────────────────────────────────
function save() {
  localStorage.setItem('sst_transactions', JSON.stringify(transactions));
}

// ── ADD TRANSACTION ────────────────────────
function addTransaction() {
  const title    = document.getElementById('txTitle').value.trim();
  const amount   = parseFloat(document.getElementById('txAmount').value);
  const date     = document.getElementById('txDate').value;
  const type     = document.getElementById('txType').value;
  const category = document.getElementById('txCategory').value;
  const note     = document.getElementById('txNote').value.trim();

  if (!title) { shake('txTitle'); return; }
  if (!amount || amount <= 0) { shake('txAmount'); return; }
  if (!date) { shake('txDate'); return; }

  transactions.push({
    id: Date.now(),
    title,
    amount,
    date,
    type,
    category,
    note
  });

  save();
  render();

  // Reset form
  document.getElementById('txTitle').value  = '';
  document.getElementById('txAmount').value = '';
  document.getElementById('txNote').value   = '';
  document.getElementById('txDate').valueAsDate = new Date();
}

// ── DELETE TRANSACTION ─────────────────────
function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  save();
  render();
}

// ── MASTER RENDER ──────────────────────────
function render() {
  updateSummary();
  renderList();
  updateCharts();
  checkBudget();
  renderInsights();
}

// ── SUMMARY CARDS ──────────────────────────
function updateSummary() {
  const income  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  document.getElementById('totalBalance').textContent = fmt(balance);
  document.getElementById('totalIncome').textContent  = fmt(income);
  document.getElementById('totalExpense').textContent = fmt(expense);

  const inCount  = transactions.filter(t => t.type === 'income').length;
  const exCount  = transactions.filter(t => t.type === 'expense').length;
  document.getElementById('incomeCount').textContent  = `${inCount} transaction${inCount !== 1 ? 's' : ''}`;
  document.getElementById('expenseCount').textContent = `${exCount} transaction${exCount !== 1 ? 's' : ''}`;
}

// ── RENDER LIST ────────────────────────────
function renderList() {
  const list  = document.getElementById('txList');
  const empty = document.getElementById('emptyState');

  let filtered = [...transactions];

  // Type filter
  if (currentFilter !== 'all') filtered = filtered.filter(t => t.type === currentFilter);
  // Category filter
  if (currentCat !== 'all') filtered = filtered.filter(t => t.category === currentCat);
  // Search
  if (searchQuery) filtered = filtered.filter(t =>
    t.title.toLowerCase().includes(searchQuery) ||
    t.category.toLowerCase().includes(searchQuery) ||
    (t.note && t.note.toLowerCase().includes(searchQuery))
  );

  // Sort newest first
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  list.innerHTML = '';

  if (filtered.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  filtered.forEach(t => {
    const cat  = catIcons[t.category] || catIcons['Other'];
    const sign = t.type === 'income' ? '+' : '-';
    const li   = document.createElement('li');
    li.className = `tx-item ${t.type}-item`;
    li.innerHTML = `
      <div class="tx-cat-icon" style="background:${cat.bg}; color:${cat.color}">${cat.icon}</div>
      <div class="tx-info">
        <div class="tx-title">${escHtml(t.title)}</div>
        <div class="tx-meta">${t.category} · ${formatDate(t.date)}${t.note ? ' · ' + escHtml(t.note) : ''}</div>
      </div>
      <div class="tx-right">
        <div class="tx-amount ${t.type}-amt">${sign}${fmt(t.amount)}</div>
      </div>
      <button class="tx-del" onclick="deleteTransaction(${t.id})" title="Delete">&#10005;</button>
    `;
    list.appendChild(li);
  });
}

// ── BUDGET CHECK ───────────────────────────
function checkBudget() {
  const alert = document.getElementById('budgetAlert');
  const barWrap = document.getElementById('budgetBarWrap');

  if (budget <= 0) {
    alert.classList.remove('show');
    barWrap.style.display = 'none';
    return;
  }

  const thisMonth = new Date().toISOString().slice(0, 7);
  const spent = transactions
    .filter(t => t.type === 'expense' && t.date.startsWith(thisMonth))
    .reduce((s, t) => s + t.amount, 0);

  const pct = Math.min((spent / budget) * 100, 100);

  barWrap.style.display = 'flex';
  const fill  = document.getElementById('budgetBarFill');
  const label = document.getElementById('budgetBarLabel');
  fill.style.width = pct.toFixed(1) + '%';
  fill.style.background = pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#10b981';
  label.textContent = `${fmt(spent)} / ${fmt(budget)} (${Math.round(pct)}%)`;

  if (spent >= budget) {
    document.getElementById('budgetAlertText').textContent =
      `⚠ Budget exceeded! You spent ${fmt(spent)} of your ${fmt(budget)} monthly budget.`;
    alert.classList.add('show');
  } else if (pct >= 80) {
    document.getElementById('budgetAlertText').textContent =
      `Heads up! You've used ${Math.round(pct)}% of your ${fmt(budget)} monthly budget.`;
    alert.style.display = 'flex';
    alert.style.background = '#fffbeb';
    alert.style.borderColor = '#fde68a';
    alert.style.color = '#92400e';
    alert.classList.add('show');
  } else {
    alert.classList.remove('show');
  }
}

// ── MONTHLY INSIGHTS ───────────────────────
function renderInsights() {
  const container = document.getElementById('insightsList');
  if (transactions.length === 0) {
    container.innerHTML = '<p class="no-insights">Add transactions to see insights.</p>';
    return;
  }

  const thisMonth = new Date().toISOString().slice(0, 7);
  const lastMonth = getPrevMonth();

  const thisExpenses = transactions.filter(t => t.type === 'expense' && t.date.startsWith(thisMonth));
  const lastExpenses = transactions.filter(t => t.type === 'expense' && t.date.startsWith(lastMonth));

  const thisTotal = thisExpenses.reduce((s, t) => s + t.amount, 0);
  const lastTotal = lastExpenses.reduce((s, t) => s + t.amount, 0);

  // Top category this month
  const catTotals = {};
  thisExpenses.forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + t.amount; });
  const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];

  const insights = [];

  if (thisTotal > 0) {
    insights.push({ icon: '📊', text: `You spent <strong>${fmt(thisTotal)}</strong> this month.` });
  }

  if (topCat) {
    const pct = Math.round((topCat[1] / thisTotal) * 100);
    insights.push({ icon: catIcons[topCat[0]]?.icon || '📌', text: `<strong>${topCat[0]}</strong> is your biggest expense — ${fmt(topCat[1])} (${pct}% of spending).` });
  }

  if (lastTotal > 0 && thisTotal > 0) {
    const diff = thisTotal - lastTotal;
    const diffPct = Math.abs(Math.round((diff / lastTotal) * 100));
    if (diff > 0) {
      insights.push({ icon: '📈', text: `Spending is <strong>${diffPct}% higher</strong> than last month (${fmt(lastTotal)}).` });
    } else {
      insights.push({ icon: '📉', text: `Great! Spending is <strong>${diffPct}% lower</strong> than last month (${fmt(lastTotal)}).` });
    }
  }

  if (budget > 0) {
    const thisMonth2 = new Date().toISOString().slice(0, 7);
    const spent = transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(thisMonth2))
      .reduce((s, t) => s + t.amount, 0);
    const rem = budget - spent;
    if (rem > 0) {
      insights.push({ icon: '💡', text: `You have <strong>${fmt(rem)}</strong> left in your budget this month.` });
    }
  }

  // Avg daily spend this month
  const daysInMonth = new Date().getDate();
  if (thisTotal > 0) {
    const avg = thisTotal / daysInMonth;
    insights.push({ icon: '🗓️', text: `Daily average spend this month: <strong>${fmt(avg)}</strong>.` });
  }

  container.innerHTML = insights.map(i =>
    `<div class="insight-item"><span class="insight-icon">${i.icon}</span><span>${i.text}</span></div>`
  ).join('');
}

// ── CHARTS ─────────────────────────────────
function initCharts() {
  const isDark = !document.body.classList.contains('light');
  const gridColor  = isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)';
  const labelColor = isDark ? '#9ca3af' : '#6b7280';

  Chart.defaults.font.family = "'Outfit', sans-serif";
  Chart.defaults.color = labelColor;

  // Pie
  pieChart = new Chart(document.getElementById('pieChart'), {
    type: 'doughnut',
    data: { labels: [], datasets: [{ data: [], backgroundColor: [], borderWidth: 2, borderColor: isDark ? '#07090f' : '#f0f2f8' }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'right', labels: { boxWidth: 12, padding: 14, font: { size: 12 } } } },
      cutout: '65%'
    }
  });

  // Bar
  barChart = new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: {
      labels: [],
      datasets: [
        { label: 'Income',  data: [], backgroundColor: 'rgba(16,185,129,.75)', borderRadius: 5 },
        { label: 'Expense', data: [], backgroundColor: 'rgba(239,68,68,.75)',  borderRadius: 5 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: labelColor } },
        y: { grid: { color: gridColor }, ticks: { color: labelColor, callback: v => '₹' + v.toLocaleString() } }
      },
      plugins: { legend: { labels: { boxWidth: 12, padding: 14, font: { size: 12 } } } }
    }
  });

  // Line
  lineChart = new Chart(document.getElementById('lineChart'), {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Balance',
        data: [],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,.1)',
        tension: .4,
        fill: true,
        pointBackgroundColor: '#6366f1',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: labelColor } },
        y: { grid: { color: gridColor }, ticks: { color: labelColor, callback: v => '₹' + v.toLocaleString() } }
      },
      plugins: { legend: { labels: { boxWidth: 12, padding: 14, font: { size: 12 } } } }
    }
  });
}

function updateCharts() {
  const isDark     = !document.body.classList.contains('light');
  const gridColor  = isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)';
  const labelColor = isDark ? '#9ca3af' : '#6b7280';

  // ── Pie: spending by category ──
  const catTotals = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
  });
  const catColors = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#ec4899','#14b8a6','#f97316','#8b5cf6'];
  pieChart.data.labels   = Object.keys(catTotals);
  pieChart.data.datasets[0].data = Object.values(catTotals);
  pieChart.data.datasets[0].backgroundColor = Object.keys(catTotals).map((_, i) => catColors[i % catColors.length]);
  pieChart.data.datasets[0].borderColor = isDark ? '#1a1d27' : '#fff';
  pieChart.options.plugins.legend.labels.color = labelColor;
  pieChart.update();

  // ── Bar: monthly income vs expense ──
  const months = getMonthlyData();
  barChart.data.labels = months.labels;
  barChart.data.datasets[0].data = months.income;
  barChart.data.datasets[1].data = months.expense;
  barChart.options.scales.x.grid.color = gridColor;
  barChart.options.scales.y.grid.color = gridColor;
  barChart.options.scales.x.ticks.color = labelColor;
  barChart.options.scales.y.ticks.color = labelColor;
  barChart.update();

  // ── Line: running balance ──
  lineChart.data.labels = months.labels;
  lineChart.data.datasets[0].data = months.balance;
  lineChart.options.scales.x.grid.color = gridColor;
  lineChart.options.scales.y.grid.color = gridColor;
  lineChart.options.scales.x.ticks.color = labelColor;
  lineChart.options.scales.y.ticks.color = labelColor;
  lineChart.update();
}

// Build monthly aggregated data
function getMonthlyData() {
  if (transactions.length === 0) return { labels: [], income: [], expense: [], balance: [] };

  const map = {};
  transactions.forEach(t => {
    const key = t.date.slice(0, 7); // YYYY-MM
    if (!map[key]) map[key] = { income: 0, expense: 0 };
    if (t.type === 'income')  map[key].income  += t.amount;
    if (t.type === 'expense') map[key].expense += t.amount;
  });

  const sorted = Object.keys(map).sort();
  const labels  = sorted.map(k => { const [y, m] = k.split('-'); return new Date(y, m - 1).toLocaleString('default', { month: 'short', year: '2-digit' }); });
  const income  = sorted.map(k => Math.round(map[k].income));
  const expense = sorted.map(k => Math.round(map[k].expense));

  // Running balance
  let running = 0;
  const balance = sorted.map(k => {
    running += map[k].income - map[k].expense;
    return Math.round(running);
  });

  return { labels, income, expense, balance };
}

// ── EXPORT CSV ─────────────────────────────
function exportCSV() {
  if (transactions.length === 0) { alert('No transactions to export.'); return; }

  const header = 'Title,Amount,Type,Category,Date,Note';
  const rows   = transactions.map(t =>
    `"${t.title}",${t.amount},${t.type},${t.category},${t.date},"${t.note || ''}"`
  );
  const csv  = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `expenses_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── HELPERS ────────────────────────────────
function fmt(n) {
  return '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getPrevMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function shake(id) {
  const el = document.getElementById(id);
  el.style.borderColor = '#ef4444';
  el.style.animation = 'none';
  setTimeout(() => {
    el.style.animation = '';
    el.style.borderColor = '';
  }, 600);
  el.focus();
}