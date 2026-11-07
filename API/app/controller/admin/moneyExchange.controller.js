const MoneyExchangeModel = require('../../models/admins/moneyExchange.model');
const { logError } = require('../../config/utill/logErr');

/**
 * Money Exchange Management Controller
 * Replicated from AURA_v1 (bpas/controllers/admin/Money.php & Money_model.php)
 */

exports.getMetadata = async (req, res) => {
  try {
    const meta = await MoneyExchangeModel.getMetadata();
    res.json({
      success: true,
      status: true,
      data: meta
    });
  } catch (err) {
    logError('moneyExchange.controller.getMetadata', err, res);
  }
};

exports.getSuggestions = async (req, res) => {
  try {
    const { term = '', warehouse_id = 1, service_only = 'true', limit = 20 } = req.query;
    const suggestions = await MoneyExchangeModel.getSuggestions({
      term,
      warehouseId: warehouse_id,
      serviceOnly: service_only !== 'false',
      limit
    });
    res.json({
      success: true,
      status: true,
      data: suggestions
    });
  } catch (err) {
    logError('moneyExchange.controller.getSuggestions', err, res);
  }
};

exports.listExchanges = async (req, res) => {
  try {
    const result = await MoneyExchangeModel.listExchanges(req.query || {});
    res.json({
      success: true,
      status: true,
      data: result.records,
      pagination: result.pagination,
      filteredTotals: result.filteredTotals,
      metrics: result.metrics
    });
  } catch (err) {
    logError('moneyExchange.controller.listExchanges', err, res);
  }
};

exports.getExchangeById = async (req, res) => {
  try {
    const exchange = await MoneyExchangeModel.getExchangeById(req.params.id);
    if (!exchange) {
      return res.status(404).json({
        success: false,
        status: false,
        message: `Money Exchange #${req.params.id} not found`
      });
    }
    res.json({
      success: true,
      status: true,
      data: exchange
    });
  } catch (err) {
    logError('moneyExchange.controller.getExchangeById', err, res);
  }
};

exports.createExchange = async (req, res) => {
  try {
    const { items = [], payments = null, payment = null, ...exchangeData } = req.body || {};
    const paymentPayload = payments || payment || null;
    const created = await MoneyExchangeModel.createExchange(exchangeData, items, paymentPayload, req.user || {});
    res.status(201).json({
      success: true,
      status: true,
      message: 'Money exchange created successfully',
      data: created
    });
  } catch (err) {
    if (err.message && err.message.includes('required')) {
      return res.status(400).json({ success: false, status: false, message: err.message });
    }
    logError('moneyExchange.controller.createExchange', err, res);
  }
};

exports.updateExchange = async (req, res) => {
  try {
    const { id } = req.params;
    const { items = [], payments = null, payment = null, ...exchangeData } = req.body || {};
    const paymentPayload = payments || (payment ? [payment] : null);
    const updated = await MoneyExchangeModel.updateExchange(id, exchangeData, items, paymentPayload, req.user || {});
    res.json({
      success: true,
      status: true,
      message: 'Money exchange updated successfully',
      data: updated
    });
  } catch (err) {
    if (err.message && err.message.includes('not found')) {
      return res.status(404).json({ success: false, status: false, message: err.message });
    }
    logError('moneyExchange.controller.updateExchange', err, res);
  }
};

exports.deleteExchange = async (req, res) => {
  try {
    const ok = await MoneyExchangeModel.deleteExchange(req.params.id);
    if (!ok) {
      return res.status(404).json({
        success: false,
        status: false,
        message: 'Money exchange record not found'
      });
    }
    res.json({
      success: true,
      status: true,
      message: 'Money exchange deleted successfully'
    });
  } catch (err) {
    logError('moneyExchange.controller.deleteExchange', err, res);
  }
};

exports.bulkDeleteExchanges = async (req, res) => {
  try {
    const ids = req.body?.ids || [];
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        status: false,
        message: 'No exchange IDs provided for deletion'
      });
    }
    const deletedCount = await MoneyExchangeModel.bulkDeleteExchanges(ids);
    res.json({
      success: true,
      status: true,
      message: `${deletedCount} money exchange record(s) deleted`,
      deletedCount
    });
  } catch (err) {
    logError('moneyExchange.controller.bulkDeleteExchanges', err, res);
  }
};

// Payments
exports.getPayments = async (req, res) => {
  try {
    const payments = await MoneyExchangeModel.getPayments(req.params.id);
    res.json({
      success: true,
      status: true,
      data: payments
    });
  } catch (err) {
    logError('moneyExchange.controller.getPayments', err, res);
  }
};

exports.addPayment = async (req, res) => {
  try {
    const amount = parseFloat(req.body?.amount || 0);
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        status: false,
        message: 'Payment amount must be greater than 0'
      });
    }
    const updated = await MoneyExchangeModel.addPayment(req.params.id, req.body, req.user || {});
    res.status(201).json({
      success: true,
      status: true,
      message: 'Payment recorded successfully',
      data: updated
    });
  } catch (err) {
    logError('moneyExchange.controller.addPayment', err, res);
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const updated = await MoneyExchangeModel.deletePayment(req.params.id, req.params.paymentId);
    res.json({
      success: true,
      status: true,
      message: 'Payment deleted and balance updated',
      data: updated
    });
  } catch (err) {
    logError('moneyExchange.controller.deletePayment', err, res);
  }
};

// Exchange Rates Matrix & Pair Lookup
exports.getExchangeRates = async (req, res) => {
  try {
    const [rates, currencies] = await Promise.all([
      MoneyExchangeModel.getExchangeRates(),
      MoneyExchangeModel.listCurrencies()
    ]);
    res.json({
      success: true,
      status: true,
      data: rates,
      currencies
    });
  } catch (err) {
    logError('moneyExchange.controller.getExchangeRates', err, res);
  }
};

exports.saveExchangeRates = async (req, res) => {
  try {
    const rates = Array.isArray(req.body?.rates) ? req.body.rates : Array.isArray(req.body) ? req.body : [];
    const saved = await MoneyExchangeModel.saveExchangeRates(rates, req.user?.id || 1);
    res.json({
      success: true,
      status: true,
      message: 'Exchange rates updated successfully',
      data: saved
    });
  } catch (err) {
    logError('moneyExchange.controller.saveExchangeRates', err, res);
  }
};

exports.lookupExchangeRate = async (req, res) => {
  try {
    const { from_currency, to_currency } = req.query;
    const rateInfo = await MoneyExchangeModel.lookupExchangeRate(from_currency, to_currency);
    res.json({
      success: true,
      status: true,
      data: rateInfo
    });
  } catch (err) {
    logError('moneyExchange.controller.lookupExchangeRate', err, res);
  }
};

// Base Currencies (aura_currencies)
exports.listCurrencies = async (req, res) => {
  try {
    const currencies = await MoneyExchangeModel.listCurrencies(req.query?.term || '');
    res.json({
      success: true,
      status: true,
      data: currencies
    });
  } catch (err) {
    logError('moneyExchange.controller.listCurrencies', err, res);
  }
};

exports.createCurrency = async (req, res) => {
  try {
    const created = await MoneyExchangeModel.createCurrency(req.body || {});
    res.status(201).json({
      success: true,
      status: true,
      message: 'Currency added successfully',
      data: created
    });
  } catch (err) {
    if (err.message) {
      return res.status(400).json({ success: false, status: false, message: err.message });
    }
    logError('moneyExchange.controller.createCurrency', err, res);
  }
};

exports.updateCurrency = async (req, res) => {
  try {
    const updated = await MoneyExchangeModel.updateCurrency(req.params.currencyId, req.body || {});
    res.json({
      success: true,
      status: true,
      message: 'Currency updated successfully',
      data: updated
    });
  } catch (err) {
    if (err.message) {
      return res.status(400).json({ success: false, status: false, message: err.message });
    }
    logError('moneyExchange.controller.updateCurrency', err, res);
  }
};

exports.deleteCurrency = async (req, res) => {
  try {
    const ok = await MoneyExchangeModel.deleteCurrency(req.params.currencyId);
    res.json({
      success: ok,
      status: ok,
      message: ok ? 'Currency deleted successfully' : 'Currency not found'
    });
  } catch (err) {
    if (err.message) {
      return res.status(400).json({ success: false, status: false, message: err.message });
    }
    logError('moneyExchange.controller.deleteCurrency', err, res);
  }
};

// Transfer Companies & Transfer Ranges
exports.listTransferCompanies = async (req, res) => {
  try {
    const companies = await MoneyExchangeModel.listTransferCompanies(req.query?.search || '');
    res.json({
      success: true,
      status: true,
      data: companies
    });
  } catch (err) {
    logError('moneyExchange.controller.listTransferCompanies', err, res);
  }
};

exports.getTransferCompanyById = async (req, res) => {
  try {
    const company = await MoneyExchangeModel.getTransferCompanyById(req.params.companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        status: false,
        message: 'Transfer company not found'
      });
    }
    res.json({
      success: true,
      status: true,
      data: company
    });
  } catch (err) {
    logError('moneyExchange.controller.getTransferCompanyById', err, res);
  }
};

exports.createTransferCompany = async (req, res) => {
  try {
    const company = await MoneyExchangeModel.createTransferCompany(req.body || {});
    res.status(201).json({
      success: true,
      status: true,
      message: 'Transfer company added successfully',
      data: company
    });
  } catch (err) {
    if (err.message) {
      return res.status(400).json({ success: false, status: false, message: err.message });
    }
    logError('moneyExchange.controller.createTransferCompany', err, res);
  }
};

exports.updateTransferCompany = async (req, res) => {
  try {
    const company = await MoneyExchangeModel.updateTransferCompany(req.params.companyId, req.body || {});
    res.json({
      success: true,
      status: true,
      message: 'Transfer company updated successfully',
      data: company
    });
  } catch (err) {
    if (err.message) {
      return res.status(400).json({ success: false, status: false, message: err.message });
    }
    logError('moneyExchange.controller.updateTransferCompany', err, res);
  }
};

exports.deleteTransferCompany = async (req, res) => {
  try {
    const ok = await MoneyExchangeModel.deleteTransferCompany(req.params.companyId);
    if (!ok) {
      return res.status(404).json({
        success: false,
        status: false,
        message: 'Transfer company not found'
      });
    }
    res.json({
      success: true,
      status: true,
      message: 'Transfer company deleted successfully'
    });
  } catch (err) {
    logError('moneyExchange.controller.deleteTransferCompany', err, res);
  }
};

exports.getTransferRanges = async (req, res) => {
  try {
    const company = await MoneyExchangeModel.getTransferCompanyById(req.params.companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        status: false,
        message: 'Transfer company not found'
      });
    }
    res.json({
      success: true,
      status: true,
      data: company.ranges,
      company
    });
  } catch (err) {
    logError('moneyExchange.controller.getTransferRanges', err, res);
  }
};

exports.saveTransferRanges = async (req, res) => {
  try {
    const ranges = Array.isArray(req.body?.ranges) ? req.body.ranges : Array.isArray(req.body) ? req.body : [];
    const updatedCompany = await MoneyExchangeModel.saveTransferRanges(
      req.params.companyId,
      ranges,
      req.user?.id || 1
    );
    res.json({
      success: true,
      status: true,
      message: 'Transfer ranges updated successfully',
      data: updatedCompany.ranges,
      company: updatedCompany
    });
  } catch (err) {
    if (err.message) {
      return res.status(400).json({ success: false, status: false, message: err.message });
    }
    logError('moneyExchange.controller.saveTransferRanges', err, res);
  }
};

exports.lookupTransferRange = async (req, res) => {
  try {
    const { company_id, amount } = req.query;
    const match = await MoneyExchangeModel.lookupTransferRange(company_id, amount);
    res.json({
      success: true,
      status: true,
      data: match
    });
  } catch (err) {
    logError('moneyExchange.controller.lookupTransferRange', err, res);
  }
};
