const {
  getDashboardMetrics,
  getAccountSections,
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getNextJournalReference,
  getJournals,
  getJournalById,
  createJournal,
  updateJournal,
  deleteJournal,
  getGeneralLedger,
  getCashAccounts,
  createCashTransfer,
  getAccountsReceivable,
  getAccountsPayable,
  getTrialBalance,
  getIncomeStatement,
  getBalanceSheet
} = require("../../../controller/admin/accounting.controller");

module.exports = (app) => {
  // 1. Dashboard Metrics
  app.get("/api/admin/accounting/dashboard", getDashboardMetrics);

  // 2. Chart of Accounts
  app.get("/api/admin/accounting/sections", getAccountSections);
  app.get("/api/admin/accounting/accounts", getAccounts);
  app.get("/api/admin/accounting/accounts/:id", getAccountById);
  app.post("/api/admin/accounting/accounts", createAccount);
  app.put("/api/admin/accounting/accounts/:id", updateAccount);
  app.delete("/api/admin/accounting/accounts/:id", deleteAccount);

  // 3. Journal Entries
  app.get("/api/admin/accounting/journals/next-reference", getNextJournalReference);
  app.get("/api/admin/accounting/journals", getJournals);
  app.get("/api/admin/accounting/journals/:id", getJournalById);
  app.post("/api/admin/accounting/journals", createJournal);
  app.put("/api/admin/accounting/journals/:id", updateJournal);
  app.delete("/api/admin/accounting/journals/:id", deleteJournal);

  // 4. General Ledger
  app.get("/api/admin/accounting/ledger", getGeneralLedger);

  // 5. Cash & Bank Management
  app.get("/api/admin/accounting/cash-accounts", getCashAccounts);
  app.post("/api/admin/accounting/transfers", createCashTransfer);

  // 6. Accounts Receivable & Accounts Payable
  app.get("/api/admin/accounting/ar", getAccountsReceivable);
  app.get("/api/admin/accounting/ap", getAccountsPayable);

  // 7. Financial Reports
  app.get("/api/admin/accounting/reports/trial-balance", getTrialBalance);
  app.get("/api/admin/accounting/reports/income-statement", getIncomeStatement);
  app.get("/api/admin/accounting/reports/balance-sheet", getBalanceSheet);
};
