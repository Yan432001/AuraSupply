const RewardsExchangeModel = require('../../models/admins/rewardsExchange.model');
const { sendSuccess, sendError } = require('../../config/utill/response');

/**
 * REWARDS EXCHANGE MANAGEMENT CONTROLLER
 * Aligned with AURA_v1 Products.php & Products_model.php rewards exchange architecture
 */

/**
 * GET /api/admin/rewards_exchange/meta/options
 * Retrieve warehouses, customers with points, billers, rules, next ref, and statuses
 */
exports.getMetadataOptions = async (req, res) => {
  try {
    const meta = await RewardsExchangeModel.getMetadataOptions();
    return sendSuccess(res, meta, 'Rewards exchange metadata options retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to retrieve rewards exchange metadata options', 500);
  }
};

/**
 * GET /api/admin/rewards_exchange/products
 * Search exchangeable products with live warehouse stock balances
 */
exports.getExchangeableProducts = async (req, res) => {
  try {
    const { warehouse_id = 'all', term = '', limit = 20 } = req.query;
    const products = await RewardsExchangeModel.getExchangeableProducts(warehouse_id, term, limit);
    return sendSuccess(res, products, 'Products retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to search exchangeable products', 500);
  }
};

/**
 * GET /api/admin/rewards_exchange
 * List rewards exchanges with search, filters, metrics, and pagination
 */
exports.listRewardsExchange = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      category = 'all',
      type = 'all',
      status = 'all',
      warehouse_id = 'all',
      customer_id = 'all',
      start_date = '',
      end_date = '',
    } = req.query;

    const filters = {
      search,
      category,
      type,
      status,
      warehouse_id,
      customer_id,
      start_date,
      end_date,
    };

    const result = await RewardsExchangeModel.listRewardsExchange(filters, { page, limit });
    return sendSuccess(res, result, 'Rewards exchange list retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to list rewards exchanges', 500);
  }
};

/**
 * GET /api/admin/rewards_exchange/:id
 * Retrieve a single rewards exchange with full item details
 */
exports.getRewardsExchangeById = async (req, res) => {
  try {
    const { id } = req.params;
    const exchange = await RewardsExchangeModel.getRewardsExchangeById(id);
    if (!exchange) {
      return sendError(res, `Rewards exchange #${id} not found`, 404);
    }
    return sendSuccess(res, exchange, 'Rewards exchange details retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to get rewards exchange details', 500);
  }
};

/**
 * POST /api/admin/rewards_exchange
 * Create a new rewards exchange transaction
 */
exports.createRewardsExchange = async (req, res) => {
  try {
    const user = req.user || { id: 1, username: 'admin' };
    const result = await RewardsExchangeModel.createRewardsExchange(req.body, user);
    return sendSuccess(res, result, 'Rewards exchange created successfully', 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to create rewards exchange', 400);
  }
};

/**
 * PUT /api/admin/rewards_exchange/:id
 * Update an existing rewards exchange transaction
 */
exports.updateRewardsExchange = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user || { id: 1, username: 'admin' };
    const result = await RewardsExchangeModel.updateRewardsExchange(id, req.body, user);
    return sendSuccess(res, result, 'Rewards exchange updated successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to update rewards exchange', 400);
  }
};

/**
 * DELETE /api/admin/rewards_exchange/:id
 * Delete a rewards exchange transaction and restore stock and points
 */
exports.deleteRewardsExchange = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user || { id: 1, username: 'admin' };
    const result = await RewardsExchangeModel.deleteRewardsExchange(id, user);
    return sendSuccess(res, result, 'Rewards exchange deleted successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to delete rewards exchange', 400);
  }
};
