const SalesModel = require('../../models/admins/sales.model');
const { logError } = require('../../config/utill/logErr');

/**
 * Sales & Order Management Controller
 * Replicated from AURA_v1 (Sales.php and Pos.php)
 */

/**
 * GET /api/admin/sales
 * Paginated sales list with filters and overall metrics
 */
exports.getSales = async (req, res) => {
  try {
    const {
      search,
      sale_status,
      payment_status,
      customer_id,
      biller_id,
      warehouse_id,
      pos_type,
      start_date,
      end_date,
      sortBy,
      sortOrder,
      page = 1,
      limit = 20
    } = req.query;

    const result = await SalesModel.getSales({
      search,
      sale_status,
      payment_status,
      customer_id,
      biller_id,
      warehouse_id,
      pos_type,
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
    logError('sales.controller.getSales', err, res);
  }
};

/**
 * GET /api/admin/sales/meta/options
 * Returns customer, biller, warehouse, unit lists and next reference number
 */
exports.getMetadata = async (req, res) => {
  try {
    const meta = await SalesModel.getMetadata();
    res.json({
      status: true,
      data: meta
    });
  } catch (err) {
    logError('sales.controller.getMetadata', err, res);
  }
};

/**
 * GET /api/admin/sales/:id
 * Retrieve full sale details including items with variants, payments, and stock movements
 */
exports.getSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await SalesModel.getSaleById(id);

    if (!sale) {
      return res.status(404).json({
        status: false,
        message: `Sale #${id} not found`
      });
    }

    res.json({
      status: true,
      data: sale
    });
  } catch (err) {
    logError('sales.controller.getSaleById', err, res);
  }
};

/**
 * POST /api/admin/sales
 * Create a new sale with item variants, multi-unit calculation, stock deduction, and optional payment
 */
exports.createSale = async (req, res) => {
  try {
    const { items = [], payment = null, ...saleData } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'A sale invoice must contain at least one product item.'
      });
    }

    const newSale = await SalesModel.createSale(saleData, items, payment, req.user || {});

    res.status(201).json({
      status: true,
      message: 'Sale created successfully',
      data: newSale
    });
  } catch (err) {
    logError('sales.controller.createSale', err, res);
  }
};

/**
 * PUT /api/admin/sales/:id
 * Update an existing sale (disallows destructive rewriting on cancelled sales)
 */
exports.updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { items = [], ...saleData } = req.body;

    const updatedSale = await SalesModel.updateSale(id, saleData, items, req.user || {});

    res.json({
      status: true,
      message: 'Sale updated successfully',
      data: updatedSale
    });
  } catch (err) {
    logError('sales.controller.updateSale', err, res);
  }
};

/**
 * PUT /api/admin/sales/:id/status
 * Transition sale status (pending -> completed -> cancelled) with stock ledger updates
 */
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const status = req.body.status || req.body.sale_status;

    if (!status) {
      return res.status(400).json({
        status: false,
        message: 'Status parameter is required.'
      });
    }

    const updated = await SalesModel.updateStatus(id, status, req.user || {});

    res.json({
      status: true,
      message: `Sale status transitioned to ${status}`,
      data: updated
    });
  } catch (err) {
    logError('sales.controller.updateStatus', err, res);
  }
};

/**
 * POST /api/admin/sales/:id/payments
 * Record customer payment for a sale
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

    const updated = await SalesModel.addPayment(id, paymentData, req.user || {});

    res.status(201).json({
      status: true,
      message: 'Payment recorded successfully',
      data: updated
    });
  } catch (err) {
    logError('sales.controller.addPayment', err, res);
  }
};

/**
 * DELETE /api/admin/sales/:id/payments/:paymentId
 * Remove payment record and adjust sale paid balance
 */
exports.deletePayment = async (req, res) => {
  try {
    const { id, paymentId } = req.params;
    const updated = await SalesModel.deletePayment(id, paymentId);

    res.json({
      status: true,
      message: 'Payment deleted and balance adjusted successfully',
      data: updated
    });
  } catch (err) {
    logError('sales.controller.deletePayment', err, res);
  }
};

/**
 * DELETE /api/admin/sales/:id
 * Safe delete sale (prevents deletion if payments exist or stock has already been deducted)
 */
exports.deleteSale = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await SalesModel.deleteSale(id);

    res.json({
      status: true,
      message: result.message
    });
  } catch (err) {
    logError('sales.controller.deleteSale', err, res);
  }
};
