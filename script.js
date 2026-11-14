/* =========================================================
   ALDRICH VAULT
   Personal Financial Command Center
   Vanilla JavaScript + LocalStorage + Chart.js
   ========================================================= */

"use strict";

/* =========================================================
   1. CONFIGURATION & STORAGE
   ========================================================= */

const STORAGE_KEYS = {
  transactions: "fintrack_transactions",
  templates: "fintrack_templates",
  budget: "fintrack_budget",
  goals: "fintrack_goals",
  theme: "fintrack_theme",
  accounts: "fintrack_accounts",
  privacy: "aldrich_vault_privacy_mode",
  pin: "aldrich_vault_pin_hash"
};

const ACCOUNT_NAMES = {
  cash: "Tunai",
  bank: "Rekening Bank",
  ewallet: "E-Wallet"
};

const ACCOUNT_ICONS = {
  cash: "▣",
  bank: "▤",
  ewallet: "▥"
};

const CATEGORIES = [
  "Makan & Minum",
  "Transportasi",
  "Tagihan",
  "Belanja",
  "Gaji",
  "Pendidikan",
  "Hiburan",
  "Kesehatan",
  "Lainnya"
];

const EXCHANGE_RATES = {
  USD: 15800,
  JPY: 105,
  SGD: 11800,
  EUR: 17100
};

const $ = (id) => document.getElementById(id);

const elements = {
  greetingText: $("greetingText"),
  currentYear: $("currentYear"),

  totalBalance: $("totalBalance"),
  totalIncome: $("totalIncome"),
  totalExpense: $("totalExpense"),

  privacyToggle: $("privacyToggle"),
  privacyIcon: $("privacyIcon"),

  safeToSpend: $("safeToSpend"),
  safeToSpendNote: $("safeToSpendNote"),

  smartInsightValue: $("smartInsightValue"),
  smartInsightText: $("smartInsightText"),

  walletGrid: $("walletGrid"),

  transactionForm: $("transactionForm"),
  type: $("type"),
  description: $("description"),
  category: $("category"),
  amount: $("amount"),
  account: $("account"),
  destinationAccount: $("destinationAccount"),
  destinationGroup: $("destinationGroup"),
  descriptionGroup: $("descriptionGroup"),
  categoryGroup: $("categoryGroup"),
  date: $("date"),
  notes: $("notes"),

  editNotice: $("editNotice"),
  cancelEditButton: $("cancelEditButton"),
  submitButton: $("submitButton"),
  submitIcon: $("submitIcon"),
  submitText: $("submitText"),

  transactionList: $("transactionList"),
  transactionCount: $("transactionCount"),

  searchInput: $("searchInput"),
  clearSearchButton: $("clearSearchButton"),
  monthFilter: $("monthFilter"),

  budgetForm: $("budgetForm"),
  budgetLimit: $("budgetLimit"),
  budgetSpent: $("budgetSpent"),
  budgetLimitDisplay: $("budgetLimitDisplay"),
  budgetProgress: $("budgetProgress"),
  budgetProgressTrack: $("budgetProgressTrack"),
  budgetPercentage: $("budgetPercentage"),
  budgetRemaining: $("budgetRemaining"),

  expenseChart: $("expenseChart"),
  chartCaption: $("chartCaption"),
  chartLegend: $("chartLegend"),

  goalList: $("goalList"),
  createGoalButton: $("createGoalButton"),
  goalDialog: $("goalDialog"),
  goalForm: $("goalForm"),
  goalDialogTitle: $("goalDialogTitle"),
  goalName: $("goalName"),
  goalTarget: $("goalTarget"),
  goalInitial: $("goalInitial"),

  contributeDialog: $("contributeDialog"),
  contributeForm: $("contributeForm"),
  contributeGoalId: $("contributeGoalId"),
  contributeAmount: $("contributeAmount"),
  contributeAccount: $("contributeAccount"),
  contributeDate: $("contributeDate"),

  exportButton: $("exportButton"),
  backupButton: $("backupButton"),
  restoreButton: $("restoreButton"),
  restoreFile: $("restoreFile"),
  clearAllButton: $("clearAllButton"),

  themeToggle: $("themeToggle"),
  themeIcon: $("themeIcon"),
  themeText: $("themeText"),

  utilityLaunchButton: $("utilityLaunchButton"),
  utilityDialog: $("utilityDialog"),

  splitTotal: $("splitTotal"),
  splitPeople: $("splitPeople"),
  splitExtra: $("splitExtra"),
  splitResult: $("splitResult"),
  splitRecordButton: $("splitRecordButton"),

  currencyAmount: $("currencyAmount"),
  currencyCode: $("currencyCode"),
  currencyResult: $("currencyResult"),
  currencyRecordButton: $("currencyRecordButton"),

  impulseItem: $("impulseItem"),
  impulsePrice: $("impulsePrice"),
  impulseStatus: $("impulseStatus"),
  impulseExplanation: $("impulseExplanation"),

  pinSetupButton: $("pinSetupButton"),
  pinDialog: $("pinDialog"),
  pinForm: $("pinForm"),
  pinInput: $("pinInput"),
  pinConfirm: $("pinConfirm"),
  pinDialogTitle: $("pinDialogTitle"),
  removePinButton: $("removePinButton"),

  pinLockScreen: $("pinLockScreen"),
  unlockForm: $("unlockForm"),
  unlockPin: $("unlockPin"),
  pinError: $("pinError"),

  spendingHeatmap: $("spendingHeatmap"),
  heatmapRangeLabel: $("heatmapRangeLabel"),

  rankScore: $("rankScore"),
  rankName: $("rankName"),
  rankProgress: $("rankProgress"),
  rankProgressTrack: $("rankProgressTrack"),
  savingRatio: $("savingRatio"),
  rankMonthExpense: $("rankMonthExpense"),
  rankDescription: $("rankDescription"),
  copySummaryButton: $("copySummaryButton"),

  appToast: $("appToast"),

  quickTemplateList: $("quickTemplateList"),
  createTemplateButton: $("createTemplateButton")
};

/* =========================================================
   2. APPLICATION STATE
   ========================================================= */

let transactions = [];
let templates = [];
let goals = [];

let accounts = {
  cash: 0,
  bank: 0,
  ewallet: 0
};

let monthlyBudget = 0;

let currentFilter = "all";
let currentSearch = "";
let currentMonthFilter = "all";

let editingTransactionId = null;
let editingGoalId = null;

let expenseChartInstance = null;
let undoTimeout = null;
let toastTimeout = null;

let deletedTransactionSnapshot = null;

let privacyMode = false;
let currentTheme = "light";

/* =========================================================
   3. GENERAL HELPERS
   ========================================================= */

function safeJSONParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function readStorage(key, fallback) {
  const value = localStorage.getItem(key);

  if (value === null) {
    return fallback;
  }

  return safeJSONParse(value, fallback);
}

function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Gagal menyimpan data:", error);
    showToast("Penyimpanan gagal. Periksa kapasitas browser.", "error");
    return false;
  }
}

function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return entities[character];
  });
}

function parseAmount(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  }

  const cleaned = String(value ?? "").replace(/[^\d]/g, "");
  const result = Number(cleaned);

  return Number.isFinite(result) ? Math.max(0, result) : 0;
}

function formatNumber(value) {
  return new Intl.NumberFormat("id-ID").format(
    Math.round(Number(value) || 0)
  );
}

function formatCurrency(value) {
  if (privacyMode) {
    return "Rp •••••••";
  }

  return `Rp${formatNumber(value)}`;
}

function todayISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function monthKey(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function currentMonthKey() {
  return monthKey(todayISO());
}

function previousMonthKey() {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - 1);

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "-";
  }

  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function isValidAccount(accountId) {
  return Object.prototype.hasOwnProperty.call(
    ACCOUNT_NAMES,
    accountId
  );
}

function getMonthTransactions(key) {
  return transactions.filter(
    (transaction) => monthKey(transaction.date) === key
  );
}

function getMonthExpenses(key) {
  return getMonthTransactions(key)
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);
}

function getMonthIncome(key) {
  return getMonthTransactions(key)
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);
}

/* =========================================================
   4. DATA NORMALIZATION & INITIALIZATION
   ========================================================= */

function normalizeTransaction(transaction) {
  if (!transaction || typeof transaction !== "object") {
    return null;
  }

  const amount = parseAmount(transaction.amount);

  const type = [
    "income",
    "expense",
    "transfer",
    "saving"
  ].includes(transaction.type)
    ? transaction.type
    : "expense";

  const accountId = isValidAccount(
    transaction.accountId ?? transaction.account
  )
    ? transaction.accountId ?? transaction.account
    : "cash";

  const destinationAccountId = isValidAccount(
    transaction.destinationAccountId
  )
    ? transaction.destinationAccountId
    : null;

  return {
    id: String(transaction.id ?? createId()),
    description: cleanText(transaction.description) || "Transaksi",
    amount,
    type,
    category: cleanText(transaction.category) || "Lainnya",
    accountId,
    destinationAccountId,
    goalId: transaction.goalId ?? null,
    date: /^\d{4}-\d{2}-\d{2}$/.test(transaction.date ?? "")
      ? transaction.date
      : todayISO(),
    notes: cleanText(transaction.notes),
    createdAt: transaction.createdAt ?? new Date().toISOString()
  };
}

function normalizeGoal(goal) {
  if (!goal || typeof goal !== "object") {
    return null;
  }

  return {
    id: String(goal.id ?? createId()),
    name: cleanText(goal.name) || "Target Tabungan",
    target: parseAmount(goal.target),
    initialAmount: parseAmount(
      goal.initialAmount ?? goal.currentAmount ?? 0
    ),
    createdAt: goal.createdAt ?? new Date().toISOString()
  };
}

function loadData() {
  const savedTransactions = readStorage(
    STORAGE_KEYS.transactions,
    []
  );

  const savedTemplates = readStorage(
    STORAGE_KEYS.templates,
    []
  );

  const savedGoals = readStorage(
    STORAGE_KEYS.goals,
    []
  );

  const savedAccounts = readStorage(
    STORAGE_KEYS.accounts,
    null
  );

  transactions = Array.isArray(savedTransactions)
    ? savedTransactions
        .map(normalizeTransaction)
        .filter(Boolean)
    : [];

  templates = Array.isArray(savedTemplates)
    ? savedTemplates
    : [];

  goals = Array.isArray(savedGoals)
    ? savedGoals.map(normalizeGoal).filter(Boolean)
    : [];

  if (typeof savedAccounts === "number") {
    accounts = {
      cash: savedAccounts,
      bank: 0,
      ewallet: 0
    };
  } else if (
    savedAccounts &&
    typeof savedAccounts === "object"
  ) {
    accounts = {
      cash: parseAmount(savedAccounts.cash),
      bank: parseAmount(savedAccounts.bank),
      ewallet: parseAmount(savedAccounts.ewallet)
    };
  }

  const savedBudget = readStorage(
    STORAGE_KEYS.budget,
    0
  );

  monthlyBudget = parseAmount(
    typeof savedBudget === "object"
      ? savedBudget?.amount
      : savedBudget
  );

  privacyMode =
    localStorage.getItem(STORAGE_KEYS.privacy) === "true";

  currentTheme =
    localStorage.getItem(STORAGE_KEYS.theme) || "light";

  if (!["light", "dark"].includes(currentTheme)) {
    currentTheme = "light";
  }

  saveAllData();
}

function saveAllData() {
  saveStorage(STORAGE_KEYS.transactions, transactions);
  saveStorage(STORAGE_KEYS.templates, templates);
  saveStorage(STORAGE_KEYS.goals, goals);
  saveStorage(STORAGE_KEYS.accounts, accounts);
  saveStorage(STORAGE_KEYS.budget, monthlyBudget);
}

/* =========================================================
   5. WALLET BALANCE CALCULATION
   ========================================================= */

function calculateWalletBalances() {
  const balances = {
    cash: 0,
    bank: 0,
    ewallet: 0
  };

  transactions.forEach((transaction) => {
    const amount = transaction.amount;
    const source = transaction.accountId;

    if (!isValidAccount(source)) {
      return;
    }

    if (transaction.type === "income") {
      balances[source] += amount;
    }

    if (
      transaction.type === "expense" ||
      transaction.type === "saving"
    ) {
      balances[source] -= amount;
    }

    if (transaction.type === "transfer") {
      balances[source] -= amount;

      const destination = transaction.destinationAccountId;

      if (isValidAccount(destination)) {
        balances[destination] += amount;
      }
    }
  });

  accounts = {
    cash: balances.cash,
    bank: balances.bank,
    ewallet: balances.ewallet
  };

  return balances;
}

function calculateTotals() {
  const balances = calculateWalletBalances();

  const totalBalance =
    balances.cash +
    balances.bank +
    balances.ewallet;

  const totalIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const totalExpense = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const totalSaving = transactions
    .filter((transaction) => transaction.type === "saving")
    .reduce((total, transaction) => total + transaction.amount, 0);

  return {
    balances,
    totalBalance,
    totalIncome,
    totalExpense,
    totalSaving
  };
}

/* =========================================================
   6. SAFE-TO-SPEND
   ========================================================= */

function getInitialGoalAllocations() {
  return goals.reduce((total, goal) => {
    return total + goal.initialAmount;
  }, 0);
}

function getGoalContributionTotal(goalId) {
  return transactions
    .filter(
      (transaction) =>
        transaction.type === "saving" &&
        transaction.goalId === goalId
    )
    .reduce((total, transaction) => total + transaction.amount, 0);
}

function getGoalCurrentAmount(goal) {
  return goal.initialAmount + getGoalContributionTotal(goal.id);
}

function calculateSafeToSpend() {
  const totals = calculateTotals();
  const goalAllocations = getInitialGoalAllocations();

  const contributedSavings = transactions
    .filter((transaction) => transaction.type === "saving")
    .reduce((total, transaction) => total + transaction.amount, 0);

  return Math.max(
    0,
    totals.totalBalance - goalAllocations
  );
}

/* =========================================================
   7. DASHBOARD RENDERING
   ========================================================= */

function renderDashboard() {
  const totals = calculateTotals();

  if (elements.totalBalance) {
    elements.totalBalance.textContent = formatCurrency(
      totals.totalBalance
    );
  }

  if (elements.totalIncome) {
    elements.totalIncome.textContent = formatCurrency(
      totals.totalIncome
    );
  }

  if (elements.totalExpense) {
    elements.totalExpense.textContent = formatCurrency(
      totals.totalExpense
    );
  }

  renderWallets();
  renderSafeToSpend();
  renderSmartInsights();
  renderBudget();
}

function renderWallets() {
  if (!elements.walletGrid) {
    return;
  }

  const balances = calculateWalletBalances();

  elements.walletGrid.innerHTML = Object.keys(ACCOUNT_NAMES)
    .map((accountId) => {
      const balance = balances[accountId];

      return `
        <article class="wallet-card">
          <div class="wallet-card-top">
            <span class="wallet-icon">${ACCOUNT_ICONS[accountId]}</span>
            <span class="wallet-name">${ACCOUNT_NAMES[accountId]}</span>
          </div>
          <strong class="wallet-balance">
            ${formatCurrency(balance)}
          </strong>
        </article>
      `;
    })
    .join("");
}

function renderSafeToSpend() {
  if (!elements.safeToSpend) {
    return;
  }

  const safeAmount = calculateSafeToSpend();

  elements.safeToSpend.textContent = formatCurrency(safeAmount);

  if (elements.safeToSpendNote) {
    elements.safeToSpendNote.textContent =
      "Estimasi saldo tersedia setelah alokasi awal target tabungan.";
  }
}

function renderSmartInsights() {
  if (!elements.smartInsightValue) {
    return;
  }

  const currentExpense = getMonthExpenses(currentMonthKey());
  const lastExpense = getMonthExpenses(previousMonthKey());

  if (lastExpense === 0 && currentExpense === 0) {
    elements.smartInsightValue.textContent =
      "Belum ada perbandingan";

    elements.smartInsightText.textContent =
      "Catat pengeluaran untuk melihat analisis bulanan.";

    return;
  }

  if (lastExpense === 0) {
    elements.smartInsightValue.textContent =
      "Data bulan lalu belum tersedia";

    elements.smartInsightText.textContent =
      `Pengeluaran bulan ini ${formatCurrency(currentExpense)}.`;

    return;
  }

  const difference = currentExpense - lastExpense;
  const percentage = Math.abs(
    (difference / lastExpense) * 100
  ).toFixed(1);

  if (difference > 0) {
    elements.smartInsightValue.textContent =
      `Naik ${percentage}%`;

    elements.smartInsightText.textContent =
      `Pengeluaran lebih tinggi ${formatCurrency(difference)} dibanding bulan lalu.`;
  } else if (difference < 0) {
    elements.smartInsightValue.textContent =
      `Turun ${percentage}%`;

    elements.smartInsightText.textContent =
      `Pengeluaran lebih rendah ${formatCurrency(Math.abs(difference))} dibanding bulan lalu.`;
  } else {
    elements.smartInsightValue.textContent =
      "Tetap stabil";

    elements.smartInsightText.textContent =
      "Pengeluaran sama dengan bulan lalu.";
  }
}

/* =========================================================
   8. BUDGET MANAGEMENT
   ========================================================= */

function renderBudget() {
  const spent = getMonthExpenses(currentMonthKey());
  const limit = monthlyBudget;

  if (elements.budgetSpent) {
    elements.budgetSpent.textContent = formatCurrency(spent);
  }

  if (elements.budgetLimitDisplay) {
    elements.budgetLimitDisplay.textContent =
      limit > 0 ? formatCurrency(limit) : "Belum diatur";
  }

  if (elements.budgetLimit && document.activeElement !== elements.budgetLimit) {
    elements.budgetLimit.value =
      limit > 0 ? formatNumber(limit) : "";
  }

  let percentage = 0;
  let remaining = 0;

  if (limit > 0) {
    percentage = Math.min((spent / limit) * 100, 100);
    remaining = limit - spent;
  }

  if (elements.budgetProgress) {
    elements.budgetProgress.style.width = `${percentage}%`;
  }

  if (elements.budgetProgressTrack) {
    elements.budgetProgressTrack.setAttribute(
      "aria-valuenow",
      String(Math.round(percentage))
    );
  }

  if (elements.budgetPercentage) {
    elements.budgetPercentage.textContent =
      limit > 0
        ? `${((spent / limit) * 100).toFixed(1)}% terpakai`
        : "0% terpakai";
  }

  if (elements.budgetRemaining) {
    if (limit <= 0) {
      elements.budgetRemaining.textContent =
        "Atur anggaran untuk memulai";
    } else if (remaining >= 0) {
      elements.budgetRemaining.textContent =
        `${formatCurrency(remaining)} tersisa`;
    } else {
      elements.budgetRemaining.textContent =
        `Melebihi batas ${formatCurrency(Math.abs(remaining))}`;
    }
  }

  if (elements.budgetProgress) {
    elements.budgetProgress.classList.toggle(
      "over-budget",
      limit > 0 && spent > limit
    );
  }
}

function handleBudgetSubmit(event) {
  event.preventDefault();

  const amount = parseAmount(elements.budgetLimit.value);

  if (amount <= 0) {
    showToast("Masukkan batas anggaran yang valid.", "error");
    return;
  }

  monthlyBudget = amount;

  saveStorage(STORAGE_KEYS.budget, monthlyBudget);

  renderBudget();
  renderImpulseChecker();

  showToast("Anggaran bulanan berhasil disimpan.", "success");
}

/* =========================================================
   9. TRANSACTION FORM
   ========================================================= */

function updateTransactionFormMode() {
  const type = elements.type.value;
  const isTransfer = type === "transfer";

  if (elements.destinationGroup) {
    elements.destinationGroup.hidden = !isTransfer;
  }

  if (elements.descriptionGroup) {
    elements.descriptionGroup.hidden = false;
  }

  if (elements.categoryGroup) {
    elements.categoryGroup.hidden = isTransfer;
  }

  if (elements.category) {
    elements.category.disabled = isTransfer;
  }

  if (elements.description) {
    elements.description.placeholder = isTransfer
      ? "Contoh: Pindah dana ke rekening"
      : "Contoh: Makan siang";
  }

  if (
    isTransfer &&
    elements.destinationAccount.value === elements.account.value
  ) {
    const available = Object.keys(ACCOUNT_NAMES).find(
      (accountId) => accountId !== elements.account.value
    );

    if (available) {
      elements.destinationAccount.value = available;
    }
  }
}

function resetTransactionForm() {
  elements.transactionForm.reset();

  elements.type.value = "expense";
  elements.account.value = "cash";
  elements.category.value = "Makan & Minum";
  elements.date.value = todayISO();

  editingTransactionId = null;

  if (elements.editNotice) {
    elements.editNotice.hidden = true;
  }

  if (elements.submitText) {
    elements.submitText.textContent = "Simpan Transaksi";
  }

  if (elements.submitIcon) {
    elements.submitIcon.textContent = "＋";
  }

  if (elements.submitButton) {
    elements.submitButton.classList.remove("editing");
  }

  updateTransactionFormMode();
}

function handleTransactionSubmit(event) {
  event.preventDefault();

  const type = elements.type.value;
  const description = cleanText(elements.description.value);
  const amount = parseAmount(elements.amount.value);
  const category = elements.category.value;
  const accountId = elements.account.value;
  const destinationAccountId = elements.destinationAccount.value;
  const date = elements.date.value;
  const notes = cleanText(elements.notes.value);

  if (!description) {
    showToast("Keterangan transaksi wajib diisi.", "error");
    elements.description.focus();
    return;
  }

  if (amount <= 0) {
    showToast("Nominal transaksi harus lebih dari nol.", "error");
    elements.amount.focus();
    return;
  }

  if (!date) {
    showToast("Pilih tanggal transaksi.", "error");
    elements.date.focus();
    return;
  }

  if (!isValidAccount(accountId)) {
    showToast("Sumber dana tidak valid.", "error");
    return;
  }

  if (
    type === "transfer" &&
    (
      !isValidAccount(destinationAccountId) ||
      destinationAccountId === accountId
    )
  ) {
    showToast("Pilih dompet tujuan yang berbeda.", "error");
    return;
  }

  const transactionData = {
    id: editingTransactionId || createId(),
    description,
    amount,
    type,
    category: type === "transfer" ? "Transfer" : category,
    accountId,
    destinationAccountId:
      type === "transfer" ? destinationAccountId : null,
    goalId: null,
    date,
    notes,
    createdAt: new Date().toISOString()
  };

  if (editingTransactionId) {
    const index = transactions.findIndex(
      (transaction) => transaction.id === editingTransactionId
    );

    if (index !== -1) {
      const previous = transactions[index];

      transactionData.createdAt = previous.createdAt;
      transactionData.goalId = previous.goalId;

      transactions[index] = transactionData;
    }

    showToast("Transaksi berhasil diperbarui.", "success");
  } else {
    transactions.push(transactionData);
    showToast("Transaksi berhasil disimpan.", "success");
  }

  saveAllData();
  resetTransactionForm();
  refreshAllViews();
}

function editTransaction(id) {
  const transaction = transactions.find(
    (item) => item.id === id
  );

  if (!transaction) {
    return;
  }

  editingTransactionId = id;

  elements.type.value = transaction.type;
  elements.description.value = transaction.description;
  elements.category.value = transaction.category;
  elements.amount.value = formatNumber(transaction.amount);
  elements.account.value = transaction.accountId;
  elements.destinationAccount.value =
    transaction.destinationAccountId || "bank";
  elements.date.value = transaction.date;
  elements.notes.value = transaction.notes || "";

  updateTransactionFormMode();

  if (elements.editNotice) {
    elements.editNotice.hidden = false;
  }

  if (elements.submitText) {
    elements.submitText.textContent = "Simpan Perubahan";
  }

  if (elements.submitIcon) {
    elements.submitIcon.textContent = "✓";
  }

  if (elements.submitButton) {
    elements.submitButton.classList.add("editing");
  }

  elements.transactionForm.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  elements.description.focus();
}

function cancelEdit() {
  resetTransactionForm();
  showToast("Mode edit dibatalkan.", "info");
}

/* =========================================================
   10. DELETE TRANSACTION & UNDO
   ========================================================= */

function deleteTransaction(id) {
  const transaction = transactions.find(
    (item) => item.id === id
  );

  if (!transaction) {
    return;
  }

  const confirmed = window.confirm(
    `Hapus transaksi "${transaction.description}"?`
  );

  if (!confirmed) {
    return;
  }

  deletedTransactionSnapshot = {
    ...transaction
  };

  transactions = transactions.filter(
    (item) => item.id !== id
  );

  saveAllData();
  refreshAllViews();

  showUndoToast(transaction);
}

function undoDeleteTransaction() {
  if (!deletedTransactionSnapshot) {
    return;
  }

  const alreadyExists = transactions.some(
    (transaction) =>
      transaction.id === deletedTransactionSnapshot.id
  );

  if (alreadyExists) {
    deletedTransactionSnapshot = null;
    return;
  }

  transactions.push({
    ...deletedTransactionSnapshot
  });

  transactions.sort((a, b) => {
    return (
      new Date(b.date).getTime() -
      new Date(a.date).getTime()
    );
  });

  deletedTransactionSnapshot = null;

  clearTimeout(undoTimeout);

  saveAllData();
  refreshAllViews();

  showToast("Transaksi berhasil dipulihkan.", "success");
}

function showUndoToast(transaction) {
  if (!elements.appToast) {
    return;
  }

  clearTimeout(toastTimeout);
  clearTimeout(undoTimeout);

  elements.appToast.className = "app-toast show";

  elements.appToast.innerHTML = `
    <span>Transaksi "${escapeHTML(transaction.description)}" dihapus.</span>
    <button type="button" class="toast-undo-button" id="undoDeleteButton">
      Undo
    </button>
  `;

  $("undoDeleteButton")?.addEventListener(
    "click",
    undoDeleteTransaction
  );

  undoTimeout = setTimeout(() => {
    deletedTransactionSnapshot = null;
    elements.appToast.classList.remove("show");
  }, 5000);
}

/* =========================================================
   11. TRANSACTION HISTORY
   ========================================================= */

function getFilteredTransactions() {
  return transactions.filter((transaction) => {
    const matchesType =
      currentFilter === "all" ||
      transaction.type === currentFilter;

    const matchesMonth =
      currentMonthFilter === "all" ||
      monthKey(transaction.date) === currentMonthFilter;

    const searchable = [
      transaction.description,
      transaction.category,
      transaction.notes,
      transaction.type
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchable.includes(
      currentSearch.toLowerCase()
    );

    return matchesType && matchesMonth && matchesSearch;
  });
}

function renderTransactions() {
  if (!elements.transactionList) {
    return;
  }

  const filtered = getFilteredTransactions();

  filtered.sort((a, b) => {
    const dateDifference =
      new Date(b.date).getTime() -
      new Date(a.date).getTime();

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return String(b.createdAt).localeCompare(
      String(a.createdAt)
    );
  });

  if (elements.transactionCount) {
    elements.transactionCount.textContent =
      `${filtered.length} aktivitas`;
  }

  if (filtered.length === 0) {
    elements.transactionList.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">⌕</span>
        <h3>Belum ada aktivitas</h3>
        <p>Transaksi yang sesuai dengan pencarian atau filter belum ditemukan.</p>
      </div>
    `;

    return;
  }

  elements.transactionList.innerHTML = filtered
    .map((transaction) => {
      const isIncome = transaction.type === "income";
      const isTransfer = transaction.type === "transfer";
      const isSaving = transaction.type === "saving";

      let typeLabel = "Pengeluaran";
      let sign = "-";
      let amountClass = "expense-text";

      if (isIncome) {
        typeLabel = "Pemasukan";
        sign = "+";
        amountClass = "income-text";
      } else if (isTransfer) {
        typeLabel = "Transfer";
        sign = "↔";
        amountClass = "";
      } else if (isSaving) {
        typeLabel = "Tabungan";
        sign = "-";
        amountClass = "";
      }

      const destination = transaction.destinationAccountId
        ? ` → ${ACCOUNT_NAMES[transaction.destinationAccountId]}`
        : "";

      return `
        <article class="transaction-item">
          <div class="transaction-main">
            <div class="transaction-icon ${transaction.type}">
              ${isIncome ? "↗" : isTransfer ? "⇄" : isSaving ? "◎" : "↘"}
            </div>

            <div class="transaction-details">
              <strong>${escapeHTML(transaction.description)}</strong>
              <span>
                ${escapeHTML(transaction.category)}
                · ${formatDate(transaction.date)}
              </span>
              <small>
                ${ACCOUNT_NAMES[transaction.accountId] || "Dompet"}
                ${escapeHTML(destination)}
              </small>
            </div>
          </div>

          <div class="transaction-side">
            <strong class="transaction-amount ${amountClass}">
              ${sign} ${formatCurrency(transaction.amount)}
            </strong>

            <div class="transaction-actions">
              <button
                type="button"
                class="transaction-edit-button"
                data-edit-id="${escapeHTML(transaction.id)}"
                aria-label="Edit transaksi"
                title="Edit"
              >✎</button>

              <button
                type="button"
                class="transaction-delete-button"
                data-delete-id="${escapeHTML(transaction.id)}"
                aria-label="Hapus transaksi"
                title="Hapus"
              >×</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  elements.transactionList
    .querySelectorAll("[data-edit-id]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        editTransaction(button.dataset.editId);
      });
    });

  elements.transactionList
    .querySelectorAll("[data-delete-id]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        deleteTransaction(button.dataset.deleteId);
      });
    });
}

function updateMonthFilterOptions() {
  if (!elements.monthFilter) {
    return;
  }

  const months = [
    ...new Set(
      transactions.map((transaction) => monthKey(transaction.date))
    )
  ]
    .filter(Boolean)
    .sort()
    .reverse();

  const previousValue = currentMonthFilter;

  elements.monthFilter.innerHTML = `
    <option value="all">Semua Waktu</option>
    ${months.map((month) => {
      const [year, monthNumber] = month.split("-");
      const date = new Date(
        Number(year),
        Number(monthNumber) - 1,
        1
      );

      const label = new Intl.DateTimeFormat("id-ID", {
        month: "long",
        year: "numeric"
      }).format(date);

      return `
        <option value="${month}">${label}</option>
      `;
    }).join("")}
  `;

  if (
    previousValue === "all" ||
    months.includes(previousValue)
  ) {
    elements.monthFilter.value = previousValue;
  } else {
    currentMonthFilter = "all";
    elements.monthFilter.value = "all";
  }
}

function handleSearch() {
  currentSearch = elements.searchInput.value.trim();

  if (elements.clearSearchButton) {
    elements.clearSearchButton.hidden = currentSearch.length === 0;
  }

  renderTransactions();
}

function clearSearch() {
  elements.searchInput.value = "";
  currentSearch = "";

  if (elements.clearSearchButton) {
    elements.clearSearchButton.hidden = true;
  }

  renderTransactions();
}

/* =========================================================
   12. SAVINGS GOALS
   ========================================================= */

function renderGoals() {
  if (!elements.goalList) {
    return;
  }

  if (goals.length === 0) {
    elements.goalList.innerHTML = `
      <div class="empty-state goal-empty-state">
        <span class="empty-state-icon">◎</span>
        <h3>Belum ada target tabungan</h3>
        <p>Buat target pertama untuk mulai merencanakan keuanganmu.</p>
      </div>
    `;

    return;
  }

  elements.goalList.innerHTML = goals
    .map((goal) => {
      const currentAmount = getGoalCurrentAmount(goal);

      const percentage =
        goal.target > 0
          ? Math.min(
              (currentAmount / goal.target) * 100,
              100
            )
          : 0;

      const remaining = Math.max(
        0,
        goal.target - currentAmount
      );

      return `
        <article class="goal-card">
          <div class="goal-card-header">
            <div>
              <span class="goal-kicker">SAVINGS GOAL</span>
              <h3>${escapeHTML(goal.name)}</h3>
            </div>

            <button
              type="button"
              class="goal-delete-button"
              data-delete-goal="${escapeHTML(goal.id)}"
              aria-label="Hapus target"
            >×</button>
          </div>

          <div class="goal-amount-row">
            <strong>${formatCurrency(currentAmount)}</strong>
            <span>${percentage.toFixed(1)}%</span>
          </div>

          <div class="progress-track goal-progress-track">
            <div
              class="progress-fill goal-progress"
              style="width:${percentage}%"
            ></div>
          </div>

          <div class="goal-footer">
            <span>Target ${formatCurrency(goal.target)}</span>
            <span>
              ${remaining > 0
                ? `Kurang ${formatCurrency(remaining)}`
                : "Target tercapai"}
            </span>
          </div>

          <div class="goal-actions">
            <button
              type="button"
              class="primary-button goal-contribute-button"
              data-contribute-goal="${escapeHTML(goal.id)}"
            >+ Sisihkan Dana</button>

            <button
              type="button"
              class="small-outline-button"
              data-edit-goal="${escapeHTML(goal.id)}"
            >Edit</button>
          </div>
        </article>
      `;
    })
    .join("");

  elements.goalList
    .querySelectorAll("[data-contribute-goal]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        openContributeDialog(button.dataset.contributeGoal);
      });
    });

  elements.goalList
    .querySelectorAll("[data-delete-goal]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        deleteGoal(button.dataset.deleteGoal);
      });
    });

  elements.goalList
    .querySelectorAll("[data-edit-goal]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        editGoal(button.dataset.editGoal);
      });
    });
}

function openGoalDialog() {
  editingGoalId = null;

  elements.goalForm.reset();
  elements.goalDialogTitle.textContent = "Buat Target Tabungan";

  elements.goalInitial.value = "0";

  elements.goalDialog.showModal();
}

function handleGoalSubmit(event) {
  event.preventDefault();

  const name = cleanText(elements.goalName.value);
  const target = parseAmount(elements.goalTarget.value);
  const initialAmount = parseAmount(elements.goalInitial.value);

  if (!name) {
    showToast("Masukkan nama target tabungan.", "error");
    return;
  }

  if (target <= 0) {
    showToast("Target nominal harus lebih dari nol.", "error");
    return;
  }

  if (initialAmount > target) {
    showToast("Saldo awal tidak boleh melebihi target.", "error");
    return;
  }

  if (editingGoalId) {
    const goal = goals.find(
      (item) => item.id === editingGoalId
    );

    if (goal) {
      goal.name = name;
      goal.target = target;
      goal.initialAmount = initialAmount;
    }

    showToast("Target berhasil diperbarui.", "success");
  } else {
    goals.push({
      id: createId(),
      name,
      target,
      initialAmount,
      createdAt: new Date().toISOString()
    });

    showToast("Target tabungan berhasil dibuat.", "success");
  }

  saveAllData();
  elements.goalDialog.close();
  renderGoals();
  renderDashboard();
  renderShinobiRank();
}

function editGoal(id) {
  const goal = goals.find((item) => item.id === id);

  if (!goal) {
    return;
  }

  editingGoalId = id;

  elements.goalName.value = goal.name;
  elements.goalTarget.value = formatNumber(goal.target);
  elements.goalInitial.value = formatNumber(goal.initialAmount);

  elements.goalDialogTitle.textContent = "Edit Target Tabungan";

  elements.goalDialog.showModal();
}

function deleteGoal(id) {
  const goal = goals.find((item) => item.id === id);

  if (!goal) {
    return;
  }

  const hasContributions = transactions.some(
    (transaction) =>
      transaction.type === "saving" &&
      transaction.goalId === id
  );

  const message = hasContributions
    ? "Target ini memiliki riwayat setoran. Hapus target dan lepaskan hubungan setoran dari target?"
    : `Hapus target "${goal.name}"?`;

  if (!window.confirm(message)) {
    return;
  }

  goals = goals.filter((item) => item.id !== id);

  transactions = transactions.map((transaction) => {
    if (transaction.goalId === id) {
      return {
        ...transaction,
        goalId: null
      };
    }

    return transaction;
  });

  saveAllData();
  refreshAllViews();

  showToast("Target tabungan berhasil dihapus.", "success");
}

function openContributeDialog(goalId) {
  const goal = goals.find((item) => item.id === goalId);

  if (!goal) {
    return;
  }

  elements.contributeForm.reset();

  elements.contributeGoalId.value = goalId;
  elements.contributeDate.value = todayISO();
  elements.contributeAccount.value = "cash";

  $("contributeDialogTitle").textContent =
    `Sisihkan Dana: ${goal.name}`;

  elements.contributeDialog.showModal();
}

function handleContributeSubmit(event) {
  event.preventDefault();

  const goalId = elements.contributeGoalId.value;
  const goal = goals.find((item) => item.id === goalId);

  const amount = parseAmount(elements.contributeAmount.value);
  const accountId = elements.contributeAccount.value;
  const date = elements.contributeDate.value;

  if (!goal) {
    showToast("Target tabungan tidak ditemukan.", "error");
    return;
  }

  if (amount <= 0) {
    showToast("Masukkan nominal tabungan.", "error");
    return;
  }

  if (!isValidAccount(accountId)) {
    showToast("Dompet sumber tidak valid.", "error");
    return;
  }

  if (!date) {
    showToast("Pilih tanggal menabung.", "error");
    return;
  }

  const walletBalances = calculateWalletBalances();

  if (walletBalances[accountId] < amount) {
    showToast("Saldo dompet tidak mencukupi.", "error");
    return;
  }

  transactions.push({
    id: createId(),
    description: `Tabungan: ${goal.name}`,
    amount,
    type: "saving",
    category: "Tabungan",
    accountId,
    destinationAccountId: null,
    goalId,
    date,
    notes: "Setoran ke target tabungan.",
    createdAt: new Date().toISOString()
  });

  saveAllData();

  elements.contributeDialog.close();

  refreshAllViews();

  showToast("Setoran tabungan berhasil dicatat.", "success");
}

/* =========================================================
   13. CHART.JS DONUT CHART
   ========================================================= */

function getChartThemeColors() {
  const isDark = currentTheme === "dark";

  return {
    text: isDark ? "#E8E5F0" : "#34312D",
    muted: isDark ? "#A5A1B2" : "#817A70",
    grid: isDark ? "#2A2637" : "#E9E1D7",
    palette: isDark
      ? [
          "#8B5CF6",
          "#38BDF8",
          "#A78BFA",
          "#6366F1",
          "#C084FC",
          "#0EA5E9",
          "#7C3AED",
          "#94A3B8",
          "#64748B"
        ]
      : [
          "#FF6B00",
          "#F59E0B",
          "#E7A23B",
          "#D97706",
          "#FDBA74",
          "#F97316",
          "#C77D37",
          "#A16207",
          "#B45309"
        ]
  };
}

function getExpenseCategoryData() {
  const totals = {};

  getMonthTransactions(currentMonthKey())
    .filter((transaction) => transaction.type === "expense")
    .forEach((transaction) => {
      const category = transaction.category || "Lainnya";

      totals[category] =
        (totals[category] || 0) + transaction.amount;
    });

  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1]);
}

function renderChart() {
  if (!elements.expenseChart || typeof Chart === "undefined") {
    return;
  }

  const categoryData = getExpenseCategoryData();
  const theme = getChartThemeColors();

  const labels = categoryData.map((item) => item[0]);
  const values = categoryData.map((item) => item[1]);

  if (elements.chartCaption) {
    elements.chartCaption.textContent =
      `Komposisi pengeluaran bulan ${new Intl.DateTimeFormat("id-ID", {
        month: "long",
        year: "numeric"
      }).format(new Date())}.`;
  }

  if (elements.chartLegend) {
    if (categoryData.length === 0) {
      elements.chartLegend.innerHTML = `
        <p class="chart-empty">Belum ada pengeluaran bulan ini.</p>
      `;
    } else {
      elements.chartLegend.innerHTML = categoryData
        .map(([label, value], index) => {
          const color =
            theme.palette[index % theme.palette.length];

          return `
            <div class="chart-legend-item">
              <span
                class="chart-legend-dot"
                style="background:${color}"
              ></span>
              <span>${escapeHTML(label)}</span>
              <strong>${formatCurrency(value)}</strong>
            </div>
          `;
        })
        .join("");
    }
  }

  if (expenseChartInstance) {
    expenseChartInstance.destroy();
    expenseChartInstance = null;
  }

  expenseChartInstance = new Chart(
    elements.expenseChart.getContext("2d"),
    {
      type: "doughnut",
      data: {
        labels: labels.length ? labels : ["Belum ada data"],
        datasets: [
          {
            data: values.length ? values : [1],
            backgroundColor: values.length
              ? labels.map(
                  (_, index) =>
                    theme.palette[index % theme.palette.length]
                )
              : [theme.grid],
            borderColor: currentTheme === "dark"
              ? "#12141D"
              : "#FFFFFF",
            borderWidth: 4,
            hoverOffset: 8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: values.length > 0,
            callbacks: {
              label(context) {
                return `${context.label}: ${formatCurrency(
                  context.raw
                )}`;
              }
            }
          }
        }
      }
    }
  );
}

/* =========================================================
   14. SPENDING HEATMAP — LAST 30 DAYS
   ========================================================= */

function renderSpendingHeatmap() {
  if (!elements.spendingHeatmap) {
    return;
  }

  const dailyTotals = {};
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const days = [];

  for (let index = 29; index >= 0; index--) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);

    const key = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");

    days.push({
      date,
      key
    });

    dailyTotals[key] = 0;
  }

  transactions
    .filter((transaction) => transaction.type === "expense")
    .forEach((transaction) => {
      if (Object.prototype.hasOwnProperty.call(
        dailyTotals,
        transaction.date
      )) {
        dailyTotals[transaction.date] += transaction.amount;
      }
    });

  const maximum = Math.max(
    0,
    ...Object.values(dailyTotals)
  );

  const monthFormatter = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short"
  });

  elements.spendingHeatmap.innerHTML = days
    .map(({ date, key }) => {
      const amount = dailyTotals[key];

      let level = 0;

      if (amount > 0 && maximum > 0) {
        const ratio = amount / maximum;

        if (ratio <= 0.25) {
          level = 1;
        } else if (ratio <= 0.5) {
          level = 2;
        } else if (ratio <= 0.75) {
          level = 3;
        } else {
          level = 4;
        }
      }

      const dateLabel = monthFormatter.format(date);

      return `
        <div
          class="heatmap-cell level-${level}"
          title="${dateLabel}: ${formatCurrency(amount)}"
          aria-label="${dateLabel}, pengeluaran ${formatCurrency(amount)}"
          data-date="${key}"
        ></div>
      `;
    })
    .join("");

  if (elements.heatmapRangeLabel) {
    const first = days[0].date;
    const last = days[days.length - 1].date;

    elements.heatmapRangeLabel.textContent =
      `${monthFormatter.format(first)} – ${monthFormatter.format(last)}`;
  }
}

/* =========================================================
   15. SHINOBI RANK SCORE
   ========================================================= */

function calculateShinobiRank() {
  const income = getMonthIncome(currentMonthKey());
  const expense = getMonthExpenses(currentMonthKey());

  const savingAmount = Math.max(0, income - expense);

  const savingRatio = income > 0
    ? Math.min((savingAmount / income) * 100, 100)
    : 0;

  let budgetDiscipline = 0;

  if (monthlyBudget > 0) {
    if (expense <= monthlyBudget) {
      budgetDiscipline =
        30 * (1 - expense / monthlyBudget);
    } else {
      budgetDiscipline = 0;
    }
  } else if (income > 0 && expense <= income) {
    budgetDiscipline = 15;
  }

  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(savingRatio * 0.7 + budgetDiscipline)
    )
  );

  let rank = "Genin";
  let description =
    "Mulai catat pemasukan dan pengeluaran untuk membangun kebiasaan finansial.";

  if (score >= 75) {
    rank = "Kage";
    description =
      "Pengelolaan keuanganmu menunjukkan disiplin dan konsistensi yang kuat.";
  } else if (score >= 50) {
    rank = "Jonin";
    description =
      "Kamu sudah membangun kebiasaan finansial yang baik. Pertahankan konsistensinya.";
  } else if (score >= 25) {
    rank = "Chunin";
    description =
      "Fondasi pengelolaan keuangan mulai terbentuk. Terus tingkatkan rasio tabungan.";
  }

  return {
    score,
    rank,
    savingRatio,
    expense,
    income,
    description
  };
}

function renderShinobiRank() {
  if (!elements.rankScore) {
    return;
  }

  const result = calculateShinobiRank();

  elements.rankScore.textContent = `${result.score}%`;
  elements.rankName.textContent = result.rank;

  elements.savingRatio.textContent =
    `${result.savingRatio.toFixed(1)}%`;

  elements.rankMonthExpense.textContent =
    formatCurrency(result.expense);

  elements.rankDescription.textContent =
    result.description;

  elements.rankProgress.style.width =
    `${result.score}%`;

  elements.rankProgressTrack.setAttribute(
    "aria-valuenow",
    String(result.score)
  );
}

/* =========================================================
   16. FINANCIAL SUMMARY
   ========================================================= */

function createFinancialSummary() {
  const totals = calculateTotals();
  const month = currentMonthKey();

  const income = getMonthIncome(month);
  const expense = getMonthExpenses(month);

  const saving = Math.max(0, income - expense);

  const ratio = income > 0
    ? ((saving / income) * 100).toFixed(1)
    : "0.0";

  const rank = calculateShinobiRank();

  return [
    "ALDRICH VAULT — RINGKASAN KEUANGAN",
    "===================================",
    `Tanggal: ${formatDate(todayISO())}`,
    "",
    "SALDO KESELURUHAN",
    `Total saldo: ${formatCurrency(totals.totalBalance)}`,
    `Tunai: ${formatCurrency(totals.balances.cash)}`,
    `Bank: ${formatCurrency(totals.balances.bank)}`,
    `E-Wallet: ${formatCurrency(totals.balances.ewallet)}`,
    "",
    "RINGKASAN BULAN INI",
    `Pemasukan: ${formatCurrency(income)}`,
    `Pengeluaran: ${formatCurrency(expense)}`,
    `Selisih: ${formatCurrency(saving)}`,
    `Saving Ratio: ${ratio}%`,
    "",
    "SHINOBI RANK",
    `Rank: ${rank.rank}`,
    `Score: ${rank.score}%`,
    "",
    "Generated by ALDRICH VAULT"
  ].join("\n");
}

async function copyFinancialSummary() {
  const summary = createFinancialSummary();

  try {
    await navigator.clipboard.writeText(summary);

    showToast("Ringkasan berhasil disalin.", "success");
  } catch (error) {
    const textarea = document.createElement("textarea");

    textarea.value = summary;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.select();

    const success = document.execCommand("copy");

    textarea.remove();

    showToast(
      success
        ? "Ringkasan berhasil disalin."
        : "Gagal menyalin ringkasan.",
      success ? "success" : "error"
    );
  }
}

/* =========================================================
   17. UTILITY CENTER — TABS
   ========================================================= */

function openUtilityTab(tabName) {
  document.querySelectorAll("[data-utility-tab]")
    .forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.utilityTab === tabName
      );
    });

  const panes = {
    split: $("utilitySplitPane"),
    currency: $("utilityCurrencyPane"),
    impulse: $("utilityImpulsePane")
  };

  Object.entries(panes).forEach(([name, pane]) => {
    if (!pane) {
      return;
    }

    const active = name === tabName;

    pane.classList.toggle("active", active);
    pane.hidden = !active;
  });
}

/* =========================================================
   18. SPLIT BILL CALCULATOR
   ========================================================= */

function calculateSplitBill() {
  const total = Math.max(
    0,
    Number(elements.splitTotal.value) || 0
  );

  const people = Math.max(
    1,
    Math.min(100, Number(elements.splitPeople.value) || 1)
  );

  const extra = Math.max(
    0,
    Math.min(100, Number(elements.splitExtra.value) || 0)
  );

  const finalTotal = total * (1 + extra / 100);
  const perPerson = Math.ceil(finalTotal / people);

  elements.splitResult.textContent =
    formatCurrency(perPerson);

  return {
    total,
    people,
    extra,
    finalTotal,
    perPerson
  };
}

function recordSplitBill() {
  const result = calculateSplitBill();

  if (result.total <= 0) {
    showToast("Masukkan total tagihan terlebih dahulu.", "error");
    return;
  }

  elements.utilityDialog.close();

  elements.type.value = "expense";
  elements.description.value =
    `Patungan tagihan (${result.people} orang)`;

  elements.category.value = "Makan & Minum";
  elements.amount.value = formatNumber(result.perPerson);
  elements.account.value = "cash";
  elements.date.value = todayISO();

  updateTransactionFormMode();

  elements.transactionForm.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  elements.description.focus();

  showToast("Nominal patungan dimasukkan ke form.", "success");
}

/* =========================================================
   19. CURRENCY CONVERTER
   ========================================================= */

function calculateCurrency() {
  const amount = Math.max(
    0,
    Number(elements.currencyAmount.value) || 0
  );

  const code = elements.currencyCode.value;
  const rate = EXCHANGE_RATES[code] || 0;

  const result = amount * rate;

  elements.currencyResult.textContent =
    formatCurrency(result);

  return {
    amount,
    code,
    rate,
    result
  };
}

function recordCurrency() {
  const conversion = calculateCurrency();

  if (conversion.amount <= 0 || conversion.result <= 0) {
    showToast("Masukkan nominal mata uang yang valid.", "error");
    return;
  }

  elements.utilityDialog.close();

  elements.type.value = "expense";
  elements.description.value =
    `Konversi ${conversion.amount} ${conversion.code}`;

  elements.category.value = "Lainnya";
  elements.amount.value = formatNumber(
    Math.round(conversion.result)
  );

  elements.account.value = "cash";
  elements.date.value = todayISO();

  updateTransactionFormMode();

  elements.transactionForm.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  elements.description.focus();

  showToast("Estimasi nominal dimasukkan ke form.", "success");
}

/* =========================================================
   20. IMPULSE BUYING CHECKER
   ========================================================= */

function renderImpulseChecker() {
  if (!elements.impulsePrice || !elements.impulseStatus) {
    return;
  }

  const price = parseAmount(elements.impulsePrice.value);
  const safeAmount = calculateSafeToSpend();

  const monthlyExpense = getMonthExpenses(currentMonthKey());

  const monthlyRemaining = monthlyBudget > 0
    ? monthlyBudget - monthlyExpense
    : null;

  if (price <= 0) {
    elements.impulseStatus.textContent =
      "Masukkan harga barang";

    elements.impulseExplanation.textContent =
      "Harga barang akan dibandingkan dengan Safe-to-Spend dan sisa anggaran bulanan.";

    return;
  }

  const hasEnoughSafeFunds = price <= safeAmount;

  const hasEnoughBudget =
    monthlyRemaining === null ||
    price <= monthlyRemaining;

  if (hasEnoughSafeFunds && hasEnoughBudget) {
    elements.impulseStatus.textContent = "Aman";

    elements.impulseExplanation.textContent =
      `Harga barang masih berada dalam Safe-to-Spend ${formatCurrency(safeAmount)}.`;
  } else if (
    price <= safeAmount * 1.2 &&
    (monthlyRemaining === null || price <= monthlyRemaining * 1.2)
  ) {
    elements.impulseStatus.textContent = "Pikirkan Lagi";

    elements.impulseExplanation.textContent =
      "Pembelian mendekati batas dana tersedia. Pertimbangkan kembali prioritas dan kebutuhanmu.";
  } else {
    elements.impulseStatus.textContent = "Bahaya";

    elements.impulseExplanation.textContent =
      "Harga barang melampaui dana aman atau sisa anggaran bulanan.";
  }
}

function recordImpulsePurchase() {
  const item = cleanText(elements.impulseItem.value);
  const price = parseAmount(elements.impulsePrice.value);

  if (!item || price <= 0) {
    showToast("Lengkapi nama barang dan harganya.", "error");
    return;
  }

  const status = elements.impulseStatus.textContent;

  if (status === "Bahaya") {
    const confirmed = window.confirm(
      "Pembelian ini melampaui batas dana aman. Tetap masukkan ke form transaksi?"
    );

    if (!confirmed) {
      return;
    }
  }

  elements.utilityDialog.close();

  elements.type.value = "expense";
  elements.description.value = item;
  elements.category.value = "Belanja";
  elements.amount.value = formatNumber(price);
  elements.account.value = "cash";
  elements.date.value = todayISO();

  updateTransactionFormMode();

  elements.transactionForm.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  elements.description.focus();

  showToast("Barang dimasukkan ke form transaksi.", "success");
}

/* =========================================================
   21. PRIVACY MODE
   ========================================================= */

function updatePrivacyMode() {
  privacyMode = !privacyMode;

  localStorage.setItem(
    STORAGE_KEYS.privacy,
    String(privacyMode)
  );

  if (elements.privacyIcon) {
    elements.privacyIcon.textContent =
      privacyMode ? "◌" : "◉";
  }

  if (elements.privacyToggle) {
    elements.privacyToggle.setAttribute(
      "aria-pressed",
      String(privacyMode)
    );

    elements.privacyToggle.setAttribute(
      "aria-label",
      privacyMode
        ? "Tampilkan nominal saldo"
        : "Sembunyikan nominal saldo"
    );
  }

  refreshAllViews();
}

/* =========================================================
   22. THEME SYSTEM — NARUTO / SASUKE
   ========================================================= */

function applyTheme(theme) {
  currentTheme = theme === "dark" ? "dark" : "light";

  document.body.classList.toggle(
    "dark-mode",
    currentTheme === "dark"
  );

  document.documentElement.dataset.theme = currentTheme;

  localStorage.setItem(
    STORAGE_KEYS.theme,
    currentTheme
  );

  if (elements.themeIcon) {
    elements.themeIcon.textContent =
      currentTheme === "dark" ? "☀" : "☾";
  }

  if (elements.themeText) {
    elements.themeText.textContent =
      currentTheme === "dark"
        ? "Light Mode"
        : "Dark Mode";
  }

  renderChart();
}

function toggleTheme() {
  applyTheme(
    currentTheme === "dark" ? "light" : "dark"
  );
}

/* =========================================================
   23. DYNAMIC GREETING
   ========================================================= */

function renderGreeting() {
  if (!elements.greetingText) {
    return;
  }

  const hour = new Date().getHours();

  let greeting = "Selamat datang";

  if (hour >= 4 && hour < 11) {
    greeting = "Selamat pagi";
  } else if (hour >= 11 && hour < 15) {
    greeting = "Selamat siang";
  } else if (hour >= 15 && hour < 18) {
    greeting = "Selamat sore";
  } else {
    greeting = "Selamat malam";
  }

  elements.greetingText.textContent =
    `${greeting}, Aldrich.`;
}

/* =========================================================
   24. PIN LOCK — LOCAL DISPLAY LOCK
   ========================================================= */

async function hashPin(pin) {
  if (
    typeof crypto !== "undefined" &&
    crypto.subtle &&
    typeof TextEncoder !== "undefined"
  ) {
    const data = new TextEncoder().encode(pin);
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      data
    );

    return Array.from(new Uint8Array(hashBuffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  // Fallback sederhana untuk browser tanpa Web Crypto.
  // Ini bukan pengganti mekanisme keamanan tingkat tinggi.
  let hash = 0;

  for (let index = 0; index < pin.length; index++) {
    hash = (hash << 5) - hash + pin.charCodeAt(index);
    hash |= 0;
  }

  return `fallback-${Math.abs(hash)}`;
}

async function setupPin() {
  const savedPin = localStorage.getItem(STORAGE_KEYS.pin);

  elements.pinForm.reset();

  elements.pinDialogTitle.textContent =
    savedPin ? "Ubah PIN Lock" : "Atur PIN Lock";

  elements.removePinButton.hidden = !savedPin;

  elements.pinDialog.showModal();
}

async function handlePinSubmit(event) {
  event.preventDefault();

  const pin = elements.pinInput.value;
  const confirmation = elements.pinConfirm.value;

  if (!/^\d{4}$/.test(pin)) {
    showToast("PIN harus terdiri dari 4 angka.", "error");
    elements.pinInput.focus();
    return;
  }

  if (pin !== confirmation) {
    showToast("Konfirmasi PIN tidak cocok.", "error");
    elements.pinConfirm.focus();
    return;
  }

  const hashedPin = await hashPin(pin);

  localStorage.setItem(
    STORAGE_KEYS.pin,
    hashedPin
  );

  elements.pinDialog.close();

  elements.pinForm.reset();

  showToast("PIN Lock berhasil diatur.", "success");
}

function removePin() {
  const savedPin = localStorage.getItem(STORAGE_KEYS.pin);

  if (!savedPin) {
    elements.pinDialog.close();
    return;
  }

  const confirmed = window.confirm(
    "Nonaktifkan PIN Lock pada perangkat ini?"
  );

  if (!confirmed) {
    return;
  }

  localStorage.removeItem(STORAGE_KEYS.pin);

  elements.pinDialog.close();

  showToast("PIN Lock dinonaktifkan.", "success");
}

async function handleUnlockSubmit(event) {
  event.preventDefault();

  const enteredPin = elements.unlockPin.value;

  if (!/^\d{4}$/.test(enteredPin)) {
    elements.pinError.textContent =
      "Masukkan PIN 4 digit.";

    return;
  }

  const savedHash = localStorage.getItem(
    STORAGE_KEYS.pin
  );

  const enteredHash = await hashPin(enteredPin);

  if (enteredHash !== savedHash) {
    elements.pinError.textContent =
      "PIN tidak sesuai. Coba kembali.";

    elements.unlockPin.value = "";
    elements.unlockPin.focus();

    return;
  }

  elements.pinLockScreen.hidden = true;
  elements.unlockPin.value = "";
  elements.pinError.textContent = "";

  document.body.classList.remove("vault-locked");
}

function initializePinLock() {
  const savedPin = localStorage.getItem(STORAGE_KEYS.pin);

  if (!savedPin || !elements.pinLockScreen) {
    return;
  }

  elements.pinLockScreen.hidden = false;

  document.body.classList.add("vault-locked");

  setTimeout(() => {
    elements.unlockPin?.focus();
  }, 100);
}

/* =========================================================
   25. QUICK ADD TEMPLATES
   ========================================================= */

function renderQuickTemplates() {
  if (!elements.quickTemplateList) {
    return;
  }

  if (templates.length === 0) {
    elements.quickTemplateList.innerHTML = `
      <p class="quick-template-empty">
        Belum ada template. Buat template untuk transaksi yang sering dilakukan.
      </p>
    `;

    return;
  }

  elements.quickTemplateList.innerHTML = templates
    .map((template) => `
      <button
        type="button"
        class="quick-template-button"
        data-template-id="${escapeHTML(template.id)}"
      >
        ${escapeHTML(template.name || template.description || "Template")}
      </button>
    `)
    .join("");

  elements.quickTemplateList
    .querySelectorAll("[data-template-id]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        applyQuickTemplate(button.dataset.templateId);
      });
    });
}

function applyQuickTemplate(id) {
  const template = templates.find(
    (item) => String(item.id) === String(id)
  );

  if (!template) {
    return;
  }

  elements.type.value = template.type || "expense";
  elements.description.value = template.description || "";
  elements.category.value = template.category || "Lainnya";
  elements.amount.value = template.amount
    ? formatNumber(template.amount)
    : "";

  elements.account.value = isValidAccount(template.accountId)
    ? template.accountId
    : "cash";

  elements.notes.value = template.notes || "";

  updateTransactionFormMode();

  elements.description.focus();

  showToast("Template berhasil diterapkan.", "success");
}

function createQuickTemplate() {
  const name = window.prompt(
    "Masukkan nama template transaksi:"
  );

  if (!name || !name.trim()) {
    return;
  }

  const description = cleanText(
    elements.description.value
  );

  const template = {
    id: createId(),
    name: name.trim(),
    type: elements.type.value,
    description,
    category: elements.category.value,
    amount: parseAmount(elements.amount.value),
    accountId: elements.account.value,
    notes: cleanText(elements.notes.value)
  };

  templates.push(template);

  saveStorage(STORAGE_KEYS.templates, templates);

  renderQuickTemplates();

  showToast("Template berhasil dibuat.", "success");
}

/* =========================================================
   26. EXPORT CSV
   ========================================================= */

function exportCSV() {
  const filtered = getFilteredTransactions();

  if (filtered.length === 0) {
    showToast("Tidak ada data untuk diekspor.", "error");
    return;
  }

  const headers = [
    "ID",
    "Tanggal",
    "Keterangan",
    "Jenis",
    "Kategori",
    "Nominal",
    "Dompet",
    "Dompet Tujuan",
    "Catatan"
  ];

  const rows = filtered.map((transaction) => [
    transaction.id,
    transaction.date,
    transaction.description,
    transaction.type,
    transaction.category,
    transaction.amount,
    ACCOUNT_NAMES[transaction.accountId] || "",
    ACCOUNT_NAMES[transaction.destinationAccountId] || "",
    transaction.notes
  ]);

  const escapeCSV = (value) => {
    const text = String(value ?? "");

    return `"${text.replace(/"/g, '""')}"`;
  };

  const csv = [
    headers,
    ...rows
  ]
    .map((row) => row.map(escapeCSV).join(","))
    .join("\r\n");

  downloadFile(
    "\uFEFF" + csv,
    `aldrich-vault-transactions-${todayISO()}.csv`,
    "text/csv;charset=utf-8;"
  );

  showToast("File CSV berhasil dibuat.", "success");
}

/* =========================================================
   27. BACKUP JSON
   ========================================================= */

function buildBackupData() {
  return {
    app: "FinTrack",
    exportedAt: new Date().toISOString(),
    version: 2,
    transactions,
    templates,
    goals,
    accounts,
    budget: monthlyBudget,
    theme: currentTheme,
    privacyMode
  };
}

function backupJSON() {
  const backup = buildBackupData();

  downloadFile(
    JSON.stringify(backup, null, 2),
    `aldrich-vault-backup-${todayISO()}.json`,
    "application/json"
  );

  showToast("Backup JSON berhasil dibuat.", "success");
}

function validateBackup(data) {
  if (!data || typeof data !== "object") {
    return false;
  }

  const hasTransactions = Array.isArray(data.transactions);
  const hasGoals = Array.isArray(data.goals);
  const hasTemplates = Array.isArray(data.templates);

  return (
    hasTransactions &&
    hasGoals &&
    hasTemplates
  );
}

function restoreJSON() {
  elements.restoreFile.click();
}

async function handleRestoreFile(event) {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  try {
    const content = await file.text();
    const backup = JSON.parse(content);

    if (!validateBackup(backup)) {
      throw new Error("Format backup tidak valid.");
    }

    const confirmed = window.confirm(
      "Restore akan mengganti data transaksi, target, dan template saat ini. Lanjutkan?"
    );

    if (!confirmed) {
      elements.restoreFile.value = "";
      return;
    }

    transactions = backup.transactions
      .map(normalizeTransaction)
      .filter(Boolean);

    goals = backup.goals
      .map(normalizeGoal)
      .filter(Boolean);

    templates = backup.templates;

    accounts = {
      cash: parseAmount(backup.accounts?.cash),
      bank: parseAmount(backup.accounts?.bank),
      ewallet: parseAmount(backup.accounts?.ewallet)
    };

    monthlyBudget = parseAmount(backup.budget);

    if (["light", "dark"].includes(backup.theme)) {
      currentTheme = backup.theme;
      applyTheme(currentTheme);
    }

    saveAllData();

    refreshAllViews();

    showToast("Data berhasil dipulihkan.", "success");
  } catch (error) {
    console.error(error);

    showToast(
      error.message || "File backup tidak dapat diproses.",
      "error"
    );
  } finally {
    elements.restoreFile.value = "";
  }
}

/* =========================================================
   28. CLEAR ALL DATA
   ========================================================= */

function clearAllData() {
  const confirmed = window.confirm(
    "Hapus seluruh transaksi, target, template, dan anggaran? Tindakan ini tidak dapat dibatalkan."
  );

  if (!confirmed) {
    return;
  }

  const secondConfirmation = window.confirm(
    "Konfirmasi sekali lagi: seluruh data ALDRICH VAULT akan dihapus."
  );

  if (!secondConfirmation) {
    return;
  }

  transactions = [];
  templates = [];
  goals = [];

  accounts = {
    cash: 0,
    bank: 0,
    ewallet: 0
  };

  monthlyBudget = 0;

  editingTransactionId = null;
  editingGoalId = null;

  deletedTransactionSnapshot = null;

  saveAllData();

  resetTransactionForm();

  refreshAllViews();

  showToast("Seluruh data berhasil dihapus.", "success");
}

/* =========================================================
   29. DOWNLOAD HELPER
   ========================================================= */

function downloadFile(content, filename, mimeType) {
  const blob = new Blob(
    [content],
    { type: mimeType }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);

  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

/* =========================================================
   30. TOAST NOTIFICATION
   ========================================================= */

function showToast(message, type = "info") {
  if (!elements.appToast) {
    return;
  }

  clearTimeout(toastTimeout);

  elements.appToast.textContent = message;
  elements.appToast.className = `app-toast show ${type}`;

  toastTimeout = setTimeout(() => {
    elements.appToast.classList.remove("show");
  }, 3500);
}

/* =========================================================
   31. KEYBOARD SHORTCUTS
   ========================================================= */

function handleKeyboardShortcuts(event) {
  const target = event.target;

  const isTyping =
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target?.isContentEditable;

  if (isTyping || event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  const key = event.key.toLowerCase();

  if (key === "n") {
    event.preventDefault();

    elements.description.focus();

    elements.transactionForm.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  if (key === "t") {
    event.preventDefault();
    toggleTheme();
  }

  if (key === "escape") {
    document.querySelectorAll("dialog[open]").forEach((dialog) => {
      dialog.close();
    });
  }
}

/* =========================================================
   32. DIALOG MANAGEMENT
   ========================================================= */

function setupDialogClosing() {
  document.querySelectorAll("[data-close-dialog]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const dialogId = button.dataset.closeDialog;
        const dialog = $(dialogId);

        if (dialog?.open) {
          dialog.close();
        }
      });
    });

  document.querySelectorAll("dialog")
    .forEach((dialog) => {
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) {
          dialog.close();
        }
      });
    });
}

/* =========================================================
   33. EVENT REGISTRATION
   ========================================================= */

function registerEvents() {
  elements.transactionForm?.addEventListener(
    "submit",
    handleTransactionSubmit
  );

  elements.type?.addEventListener(
    "change",
    updateTransactionFormMode
  );

  elements.account?.addEventListener(
    "change",
    updateTransactionFormMode
  );

  elements.cancelEditButton?.addEventListener(
    "click",
    cancelEdit
  );

  elements.budgetForm?.addEventListener(
    "submit",
    handleBudgetSubmit
  );

  elements.searchInput?.addEventListener(
    "input",
    handleSearch
  );

  elements.clearSearchButton?.addEventListener(
    "click",
    clearSearch
  );

  elements.monthFilter?.addEventListener(
    "change",
    () => {
      currentMonthFilter = elements.monthFilter.value;
      renderTransactions();
    }
  );

  document.querySelectorAll("[data-filter]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;

        document.querySelectorAll("[data-filter]")
          .forEach((item) => {
            item.classList.toggle(
              "active",
              item === button
            );
          });

        renderTransactions();
      });
    });

  elements.createGoalButton?.addEventListener(
    "click",
    openGoalDialog
  );

  elements.goalForm?.addEventListener(
    "submit",
    handleGoalSubmit
  );

  elements.contributeForm?.addEventListener(
    "submit",
    handleContributeSubmit
  );

  elements.exportButton?.addEventListener(
    "click",
    exportCSV
  );

  elements.backupButton?.addEventListener(
    "click",
    backupJSON
  );

  elements.restoreButton?.addEventListener(
    "click",
    restoreJSON
  );

  elements.restoreFile?.addEventListener(
    "change",
    handleRestoreFile
  );

  elements.clearAllButton?.addEventListener(
    "click",
    clearAllData
  );

  elements.themeToggle?.addEventListener(
    "click",
    toggleTheme
  );

  elements.privacyToggle?.addEventListener(
    "click",
    updatePrivacyMode
  );

  elements.utilityLaunchButton?.addEventListener(
    "click",
    () => {
      elements.utilityDialog.showModal();
      openUtilityTab("split");
    }
  );

  document.querySelectorAll("[data-utility-tab]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        openUtilityTab(button.dataset.utilityTab);
      });
    });

  [
    elements.splitTotal,
    elements.splitPeople,
    elements.splitExtra
  ].forEach((input) => {
    input?.addEventListener("input", calculateSplitBill);
  });

  elements.splitRecordButton?.addEventListener(
    "click",
    recordSplitBill
  );

  [
    elements.currencyAmount,
    elements.currencyCode
  ].forEach((input) => {
    input?.addEventListener("input", calculateCurrency);
    input?.addEventListener("change", calculateCurrency);
  });

  elements.currencyRecordButton?.addEventListener(
    "click",
    recordCurrency
  );

  elements.impulsePrice?.addEventListener(
    "input",
    renderImpulseChecker
  );

  elements.impulseItem?.addEventListener(
    "input",
    renderImpulseChecker
  );

  elements.pinSetupButton?.addEventListener(
    "click",
    setupPin
  );

  elements.pinForm?.addEventListener(
    "submit",
    handlePinSubmit
  );

  elements.removePinButton?.addEventListener(
    "click",
    removePin
  );

  elements.unlockForm?.addEventListener(
    "submit",
    handleUnlockSubmit
  );

  elements.copySummaryButton?.addEventListener(
    "click",
    copyFinancialSummary
  );

  elements.createTemplateButton?.addEventListener(
    "click",
    createQuickTemplate
  );

  document.addEventListener(
    "keydown",
    handleKeyboardShortcuts
  );

  elements.amount?.addEventListener("input", () => {
    const cursorPosition = elements.amount.selectionStart;
    const oldLength = elements.amount.value.length;

    elements.amount.value = formatNumber(
      parseAmount(elements.amount.value)
    );

    const newLength = elements.amount.value.length;

    const nextPosition = Math.max(
      0,
      cursorPosition + (newLength - oldLength)
    );

    elements.amount.setSelectionRange(
      nextPosition,
      nextPosition
    );
  });

  elements.budgetLimit?.addEventListener("input", () => {
    const input = elements.budgetLimit;
    const cursorPosition = input.selectionStart;
    const oldLength = input.value.length;

    input.value = formatNumber(parseAmount(input.value));

    const newLength = input.value.length;

    input.setSelectionRange(
      Math.max(0, cursorPosition + newLength - oldLength),
      Math.max(0, cursorPosition + newLength - oldLength)
    );
  });

  elements.goalTarget?.addEventListener("input", () => {
    elements.goalTarget.value = formatNumber(
      parseAmount(elements.goalTarget.value)
    );
  });

  elements.goalInitial?.addEventListener("input", () => {
    elements.goalInitial.value = formatNumber(
      parseAmount(elements.goalInitial.value)
    );
  });

  elements.contributeAmount?.addEventListener("input", () => {
    elements.contributeAmount.value = formatNumber(
      parseAmount(elements.contributeAmount.value)
    );
  });

  setupDialogClosing();
}

/* =========================================================
   34. REFRESH ALL VIEWS
   ========================================================= */

function refreshAllViews() {
  calculateWalletBalances();

  renderDashboard();
  renderTransactions();
  renderGoals();
  renderChart();
  renderSpendingHeatmap();
  renderShinobiRank();
  renderQuickTemplates();
  renderImpulseChecker();

  updateMonthFilterOptions();

  // Render kembali setelah opsi bulan diperbarui.
  renderTransactions();
}

/* =========================================================
   35. INITIALIZE APPLICATION
   ========================================================= */

function initializeApp() {
  loadData();

  if (elements.currentYear) {
    elements.currentYear.textContent =
      new Date().getFullYear();
  }

  if (elements.date) {
    elements.date.value = todayISO();
  }

  if (elements.contributeDate) {
    elements.contributeDate.value = todayISO();
  }

  applyTheme(currentTheme);

  if (elements.privacyIcon) {
    elements.privacyIcon.textContent =
      privacyMode ? "◌" : "◉";
  }

  if (elements.privacyToggle) {
    elements.privacyToggle.setAttribute(
      "aria-pressed",
      String(privacyMode)
    );

    elements.privacyToggle.setAttribute(
      "aria-label",
      privacyMode
        ? "Tampilkan nominal saldo"
        : "Sembunyikan nominal saldo"
    );
  }

  renderGreeting();

  registerEvents();

  updateTransactionFormMode();

  calculateSplitBill();
  calculateCurrency();

  openUtilityTab("split");

  refreshAllViews();

  initializePinLock();
}

/* =========================================================
   36. START APPLICATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  initializeApp
);