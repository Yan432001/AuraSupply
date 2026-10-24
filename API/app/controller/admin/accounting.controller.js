const AccountingModel = require('../../models/admins/accounting.model');
const { logError } = require('../../config/utill/logErr');

/**
 * Accounting & General Ledger Controller
 * Replicated from AURA_v1 (Account.php and Accounts_model.php)
 */

// 1. Dashboard Metrics
exports.getDashboardMetrics = async (req, res) => {
  try {
    const { biller_id, start_date, end_date } = req.query;
    const metrics = await AccountingModel.getDashboardMetrics({
      biller_id: biller_id ? parseInt(biller_id, 10) : null,
      start_date,
      end_date
    });
    return res.json({ status: true, data: metrics });
  } catch (err) {
    logError('accounting.controller.getDashboardMetrics', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

// 2. Chart of Accounts
exports.getAccountSections = async (req, res) => {
  try {
    const sections = await AccountingModel.getAccountSections();
    return res.json({ status: true, data: sections });
  } catch (err) {
    logError('accounting.controller.getAccountSections', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.getAccounts = async (req, res) => {
  try {
    const { search, section_id, account_type, bank, inactive, sortBy, sortOrder, page = 1, limit = 500 } = req.query;
    const result = await AccountingModel.getAccounts({
      search,
      section_id: section_id ? parseInt(section_id, 10) : null,
      account_type,
      bank,
      inactive,
      sortBy,
      sortOrder,
      page,
      limit
    });
    return res.json({ status: true, data: result.records, pagination: result.pagination });
  } catch (err) {
    logError('accounting.controller.getAccounts', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.getAccountById = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await AccountingModel.getAccountById(id);
    if (!account) {
      return res.status(404).json({ status: false, message: 'Account not found.' });
    }
    return res.json({ status: true, data: account });
  } catch (err) {
    logError('accounting.controller.getAccountById', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.createAccount = async (req, res) => {
  try {
    const { accountcode, accountname, parent_acc, sectionid, bank, type, inactive } = req.body;
    if (!accountcode || !accountname || !sectionid) {
      return res.status(400).json({ status: false, message: 'Account Code, Account Name, and Section are required.' });
    }

    const created = await AccountingModel.createAccount({
      accountcode,
      accountname,
      parent_acc,
      sectionid,
      bank,
      type,
      inactive
    });

    return res.status(201).json({
      status: true,
      message: 'Account created successfully',
      data: created
    });
  } catch (err) {
    logError('accounting.controller.createAccount', err.message);
    return res.status(400).json({ status: false, message: err.message });
  }
};

exports.updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await AccountingModel.updateAccount(id, req.body);
    return res.json({
      status: true,
      message: 'Account updated successfully',
      data: updated
    });
  } catch (err) {
    logError('accounting.controller.updateAccount', err.message);
    return res.status(400).json({ status: false, message: err.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AccountingModel.deleteAccount(id);
    return res.json({
      status: true,
      message: `Account #${result.deletedCode} deleted successfully`
    });
  } catch (err) {
    logError('accounting.controller.deleteAccount', err.message);
    return res.status(400).json({ status: false, message: err.message });
  }
};

// 3. Journal Entries
exports.getNextJournalReference = async (req, res) => {
  try {
    const { biller_id } = req.query;
    const ref = await AccountingModel.getNextJournalReference(biller_id);
    return res.json({ status: true, reference_no: ref });
  } catch (err) {
    logError('accounting.controller.getNextJournalReference', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.getJournals = async (req, res) => {
  try {
    const { search, biller_id, start_date, end_date, jn_type, page = 1, limit = 20 } = req.query;
    const result = await AccountingModel.getJournals({
      search,
      biller_id: biller_id ? parseInt(biller_id, 10) : null,
      start_date,
      end_date,
      jn_type,
      page,
      limit
    });
    return res.json({ status: true, data: result.records, pagination: result.pagination });
  } catch (err) {
    logError('accounting.controller.getJournals', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.getJournalById = async (req, res) => {
  try {
    const { id } = req.params;
    const journal = await AccountingModel.getJournalById(id);
    if (!journal) {
      return res.status(404).json({ status: false, message: 'Journal entry not found.' });
    }
    return res.json({ status: true, data: journal });
  } catch (err) {
    logError('accounting.controller.getJournalById', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.createJournal = async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const result = await AccountingModel.createJournal(req.body, userId);
    return res.status(201).json({
      status: true,
      message: 'Journal entry posted successfully',
      data: result
    });
  } catch (err) {
    logError('accounting.controller.createJournal', err.message);
    return res.status(400).json({ status: false, message: err.message });
  }
};

exports.updateJournal = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 1;
    const result = await AccountingModel.updateJournal(id, req.body, userId);
    return res.json({
      status: true,
      message: 'Journal entry updated successfully',
      data: result
    });
  } catch (err) {
    logError('accounting.controller.updateJournal', err.message);
    return res.status(400).json({ status: false, message: err.message });
  }
};

exports.deleteJournal = async (req, res) => {
  try {
    const { id } = req.params;
    await AccountingModel.deleteJournal(id);
    return res.json({ status: true, message: 'Journal entry cancelled and reversed successfully' });
  } catch (err) {
    logError('accounting.controller.deleteJournal', err.message);
    return res.status(400).json({ status: false, message: err.message });
  }
};

// 4. General Ledger
exports.getGeneralLedger = async (req, res) => {
  try {
    const { account_code, start_date, end_date, biller_id, tran_type, page = 1, limit = 50 } = req.query;
    if (!account_code) {
      return res.status(400).json({ status: false, message: 'account_code is required' });
    }
    const result = await AccountingModel.getGeneralLedger({
      account_code,
      start_date,
      end_date,
      biller_id: biller_id ? parseInt(biller_id, 10) : null,
      tran_type,
      page,
      limit
    });
    return res.json({ status: true, data: result });
  } catch (err) {
    logError('accounting.controller.getGeneralLedger', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

// 5. Cash & Bank
exports.getCashAccounts = async (req, res) => {
  try {
    const accounts = await AccountingModel.getCashAccounts();
    return res.json({ status: true, data: accounts });
  } catch (err) {
    logError('accounting.controller.getCashAccounts', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.createCashTransfer = async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const result = await AccountingModel.createCashTransfer(req.body, userId);
    return res.status(201).json({
      status: true,
      message: 'Cash / Bank transfer completed successfully',
      data: result
    });
  } catch (err) {
    logError('accounting.controller.createCashTransfer', err.message);
    return res.status(400).json({ status: false, message: err.message });
  }
};

// 6. AR & AP
exports.getAccountsReceivable = async (req, res) => {
  try {
    const { customer_id, biller_id, overdue_only, search, page = 1, limit = 20 } = req.query;
    const result = await AccountingModel.getAccountsReceivable({
      customer_id: customer_id ? parseInt(customer_id, 10) : null,
      biller_id: biller_id ? parseInt(biller_id, 10) : null,
      overdue_only: overdue_only === 'true' || overdue_only === '1',
      search,
      page,
      limit
    });
    return res.json({ status: true, data: result.records, pagination: result.pagination });
  } catch (err) {
    logError('accounting.controller.getAccountsReceivable', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.getAccountsPayable = async (req, res) => {
  try {
    const { supplier_id, biller_id, overdue_only, search, page = 1, limit = 20 } = req.query;
    const result = await AccountingModel.getAccountsPayable({
      supplier_id: supplier_id ? parseInt(supplier_id, 10) : null,
      biller_id: biller_id ? parseInt(biller_id, 10) : null,
      overdue_only: overdue_only === 'true' || overdue_only === '1',
      search,
      page,
      limit
    });
    return res.json({ status: true, data: result.records, pagination: result.pagination });
  } catch (err) {
    logError('accounting.controller.getAccountsPayable', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

// 7. Financial Reports
exports.getTrialBalance = async (req, res) => {
  try {
    const { biller_id, as_of_date } = req.query;
    const result = await AccountingModel.getTrialBalance({
      biller_id: biller_id ? parseInt(biller_id, 10) : null,
      as_of_date
    });
    return res.json({ status: true, data: result });
  } catch (err) {
    logError('accounting.controller.getTrialBalance', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.getIncomeStatement = async (req, res) => {
  try {
    const { biller_id, start_date, end_date } = req.query;
    const result = await AccountingModel.getIncomeStatement({
      biller_id: biller_id ? parseInt(biller_id, 10) : null,
      start_date,
      end_date
    });
    return res.json({ status: true, data: result });
  } catch (err) {
    logError('accounting.controller.getIncomeStatement', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.getBalanceSheet = async (req, res) => {
  try {
    const { biller_id, as_of_date } = req.query;
    const result = await AccountingModel.getBalanceSheet({
      biller_id: biller_id ? parseInt(biller_id, 10) : null,
      as_of_date
    });
    return res.json({ status: true, data: result });
  } catch (err) {
    logError('accounting.controller.getBalanceSheet', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};
