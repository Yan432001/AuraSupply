const PurchasesModel = require('../../models/admins/purchases.model');
const { logError } = require('../../config/utill/logErr');

/**
 * Purchases & Procurement Controller
 * High-performance, strictly transactional, full AURA_v1 alignment
 */

/**
 * GET /api/admin/purchases
 * Filterable, sortable, paginated purchases list + overall metrics
 */
exports.getPurchases = async (req, res) => {
  try {
    const {
      search,
      status,
      payment_status,
      supplier_id,
      warehouse_id,
      start_date,
      end_date,
      sortBy,
      sortOrder,
      page = 1,
      limit = 50
    } = req.query;

    const result = await PurchasesModel.getPurchases({
      search,
      status,
      payment_status,
      supplier_id,
      warehouse_id,
      start_date,
      end_date,
      sortBy,
      sortOrder,
      page,
      limit
    });

    res.json({
      status: true,
      data: result.records,
      pagination: result.pagination,
      metrics: result.metrics
    });
  } catch (err) {
    logError('purchases.controller.getPurchases', err, res);
  }
};

/**
 * GET /api/admin/purchases/meta/options
 * Returns suppliers, warehouses, units, and next generated reference number
 */
exports.getMetadata = async (req, res) => {
  try {
    const meta = await PurchasesModel.getMetadata();
    res.json({
      status: true,
      data: meta
    });
  } catch (err) {
    logError('purchases.controller.getMetadata', err, res);
  }
};

/**
 * GET /api/admin/purchases/:id
 * Retrieve full purchase order details, item lines with variants, payments, and receipt history
 */
exports.getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const purchase = await PurchasesModel.getPurchaseById(id);

    if (!purchase) {
      return res.status(404).json({
        status: false,
        message: `Purchase #${id} not found`
      });
    }

    res.json({
      status: true,
      data: purchase
    });
  } catch (err) {
    logError('purchases.controller.getPurchaseById', err, res);
  }
};

/**
 * POST /api/admin/purchases
 * Create a new purchase order with multi-unit conversion, variant support, and optional immediate receipt
 */
exports.createPurchase = async (req, res) => {
  try {
    const { items = [], ...purchaseData } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'A purchase order must contain at least one product item.'
      });
    }

    const newPurchase = await PurchasesModel.createPurchase(purchaseData, items, req.user || {});

    res.status(201).json({
      status: true,
      message: 'Purchase created successfully',
      data: newPurchase
    });
  } catch (err) {
    logError('purchases.controller.createPurchase', err, res);
  }
};

/**
 * PUT /api/admin/purchases/:id
 * Update an existing purchase order (with safety protection for received orders)
 */
exports.updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const { items = [], ...purchaseData } = req.body;

    const updatedPurchase = await PurchasesModel.updatePurchase(id, purchaseData, items, req.user || {});

    res.json({
      status: true,
      message: 'Purchase updated successfully',
      data: updatedPurchase
    });
  } catch (err) {
    logError('purchases.controller.updatePurchase', err, res);
  }
};

/**
 * PUT /api/admin/purchases/:id/status
 * Transition purchase workflow status (draft -> pending -> ordered -> cancelled)
 */
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        status: false,
        message: 'Status parameter is required.'
      });
    }

    const updated = await PurchasesModel.updateStatus(id, status, req.user || {});

    res.json({
      status: true,
      message: `Purchase status transitioned to ${status}`,
      data: updated
    });
  } catch (err) {
    logError('purchases.controller.updateStatus', err, res);
  }
};

/**
 * POST /api/admin/purchases/:id/receive
 * Goods Receiving Workflow: Record full or partial receipt, update warehouse stock, and log stock movements
 */
exports.receiveGoods = async (req, res) => {
  try {
    const { id } = req.params;
    const { items = [] } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'Please provide items and quantities to receive.'
      });
    }

    const updated = await PurchasesModel.receiveGoods(id, items, req.user || {});

    res.json({
      status: true,
      message: 'Goods receipt processed and warehouse stock updated successfully',
      data: updated
    });
  } catch (err) {
    logError('purchases.controller.receiveGoods', err, res);
  }
};

/**
 * POST /api/admin/purchases/:id/payments
 * Record payment to supplier against purchase
 */
exports.addPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const paymentData = req.body;

    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      return res.status(400).json({
        status: false,
        message: 'Payment amount must be greater than 0.'
      });
    }

    const updated = await PurchasesModel.addPayment(id, paymentData, req.user || {});

    res.status(201).json({
      status: true,
      message: 'Payment recorded successfully',
      data: updated
    });
  } catch (err) {
    logError('purchases.controller.addPayment', err, res);
  }
};

/**
 * DELETE /api/admin/purchases/:id/payments/:paymentId
 * Remove payment record and adjust purchase paid balance
 */
exports.deletePayment = async (req, res) => {
  try {
    const { id, paymentId } = req.params;
    const updated = await PurchasesModel.deletePayment(id, paymentId);

    res.json({
      status: true,
      message: 'Payment deleted and balance adjusted successfully',
      data: updated
    });
  } catch (err) {
    logError('purchases.controller.deletePayment', err, res);
  }
};

/**
 * DELETE /api/admin/purchases/:id
 * Safe purchase deletion (prohibits deletion if payments exist or stock has been received)
 */
exports.deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await PurchasesModel.deletePurchase(id);

    res.json({
      status: true,
      message: result.message
    });
  } catch (err) {
    logError('purchases.controller.deletePurchase', err, res);
  }
};
