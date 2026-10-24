const AssetModel = require('../../models/admins/asset.model');
const { logError } = require('../../config/utill/logErr');

/**
 * Asset Management Controller
 * Replicated from AURA_v1 (Assets.php & Assets_model.php)
 */

// 1. Dashboard Metrics
exports.getDashboardMetrics = async (req, res) => {
  try {
    const data = await AssetModel.getDashboardMetrics();
    return res.json({ status: true, data });
  } catch (err) {
    logError('asset.controller.getDashboardMetrics', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

// 2. Asset Register
exports.getNextAssetCode = async (req, res) => {
  try {
    const code = await AssetModel.getNextAssetCode();
    return res.json({ status: true, data: { asset_code: code } });
  } catch (err) {
    logError('asset.controller.getNextAssetCode', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.getAssets = async (req, res) => {
  try {
    const { search, category_id, status, condition, location, department, sortBy, sortOrder, page = 1, limit = 50 } = req.query;
    const result = await AssetModel.getAssets({
      search,
      category_id,
      status,
      condition,
      location,
      department,
      sortBy,
      sortOrder,
      page,
      limit
    });
    return res.json({ status: true, data: result.records, pagination: result.pagination });
  } catch (err) {
    logError('asset.controller.getAssets', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.getAssetById = async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await AssetModel.getAssetById(id);
    if (!asset) {
      return res.status(404).json({ status: false, message: 'Asset not found' });
    }
    return res.json({ status: true, data: asset });
  } catch (err) {
    logError('asset.controller.getAssetById', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.createAsset = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ status: false, message: 'Asset name is required' });
    }
    const result = await AssetModel.createAsset(req.body);
    return res.status(201).json({ status: true, message: 'Asset created successfully', data: result });
  } catch (err) {
    logError('asset.controller.createAsset', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AssetModel.updateAsset(id, req.body);
    return res.json({ status: true, message: 'Asset updated successfully', data: result });
  } catch (err) {
    logError('asset.controller.updateAsset', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const force = req.query.force === 'true';
    const result = await AssetModel.deleteAsset(id, force);
    return res.json({ status: true, message: 'Asset deleted or archived successfully', data: result });
  } catch (err) {
    logError('asset.controller.deleteAsset', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

// 3. Asset Categories
exports.getCategories = async (req, res) => {
  try {
    const { search, status } = req.query;
    const categories = await AssetModel.getCategories({ search, status });
    return res.json({ status: true, data: categories });
  } catch (err) {
    logError('asset.controller.getCategories', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await AssetModel.getCategoryById(id);
    if (!category) {
      return res.status(404).json({ status: false, message: 'Category not found' });
    }
    return res.json({ status: true, data: category });
  } catch (err) {
    logError('asset.controller.getCategoryById', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ status: false, message: 'Category name is required' });
    }
    const result = await AssetModel.createCategory(req.body);
    return res.status(201).json({ status: true, message: 'Category created successfully', data: result });
  } catch (err) {
    logError('asset.controller.createCategory', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AssetModel.updateCategory(id, req.body);
    return res.json({ status: true, message: 'Category updated successfully', data: result });
  } catch (err) {
    logError('asset.controller.updateCategory', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AssetModel.deleteCategory(id);
    return res.json({ status: true, message: 'Category deleted successfully', data: result });
  } catch (err) {
    logError('asset.controller.deleteCategory', err.message);
    return res.status(400).json({ status: false, message: err.message });
  }
};

// 4. Assignments & Returns
exports.getAssignments = async (req, res) => {
  try {
    const { asset_id, employee_id, status, page = 1, limit = 50 } = req.query;
    const result = await AssetModel.getAssignments({ asset_id, employee_id, status, page, limit });
    return res.json({ status: true, data: result.records, pagination: result.pagination });
  } catch (err) {
    logError('asset.controller.getAssignments', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.assignAsset = async (req, res) => {
  try {
    const { asset_id, employee_name } = req.body;
    if (!asset_id || !employee_name) {
      return res.status(400).json({ status: false, message: 'Asset ID and employee name are required' });
    }
    const result = await AssetModel.assignAsset(req.body);
    return res.status(201).json({ status: true, message: 'Asset assigned successfully', data: result });
  } catch (err) {
    logError('asset.controller.assignAsset', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.returnAsset = async (req, res) => {
  try {
    const { assignment_id } = req.body;
    if (!assignment_id) {
      return res.status(400).json({ status: false, message: 'assignment_id is required' });
    }
    const result = await AssetModel.returnAsset(req.body);
    return res.json({ status: true, message: 'Asset returned successfully', data: result });
  } catch (err) {
    logError('asset.controller.returnAsset', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

// 5. Transfers
exports.getTransfers = async (req, res) => {
  try {
    const { asset_id, page = 1, limit = 50 } = req.query;
    const result = await AssetModel.getTransfers({ asset_id, page, limit });
    return res.json({ status: true, data: result.records, pagination: result.pagination });
  } catch (err) {
    logError('asset.controller.getTransfers', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.createTransfer = async (req, res) => {
  try {
    const { asset_id, to_location } = req.body;
    if (!asset_id || !to_location) {
      return res.status(400).json({ status: false, message: 'Asset ID and destination location are required' });
    }
    const result = await AssetModel.createTransfer(req.body);
    return res.status(201).json({ status: true, message: 'Asset transfer logged successfully', data: result });
  } catch (err) {
    logError('asset.controller.createTransfer', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

// 6. Maintenance
exports.getMaintenances = async (req, res) => {
  try {
    const { asset_id, status, priority, maintenance_type, page = 1, limit = 50 } = req.query;
    const result = await AssetModel.getMaintenances({ asset_id, status, priority, maintenance_type, page, limit });
    return res.json({ status: true, data: result.records, pagination: result.pagination });
  } catch (err) {
    logError('asset.controller.getMaintenances', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.createMaintenance = async (req, res) => {
  try {
    const { asset_id, title } = req.body;
    if (!asset_id || !title) {
      return res.status(400).json({ status: false, message: 'Asset ID and maintenance title are required' });
    }
    const result = await AssetModel.createMaintenance(req.body);
    return res.status(201).json({ status: true, message: 'Maintenance record created', data: result });
  } catch (err) {
    logError('asset.controller.createMaintenance', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.updateMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AssetModel.updateMaintenance(id, req.body);
    return res.json({ status: true, message: 'Maintenance record updated', data: result });
  } catch (err) {
    logError('asset.controller.updateMaintenance', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

// 7. Depreciation
exports.getDepreciationSchedule = async (req, res) => {
  try {
    const { category_id, search, target_date } = req.query;
    const data = await AssetModel.getDepreciationSchedule({ category_id, search, target_date });
    return res.json({ status: true, data });
  } catch (err) {
    logError('asset.controller.getDepreciationSchedule', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.runDepreciation = async (req, res) => {
  try {
    const { target_date } = req.body;
    const result = await AssetModel.runDepreciation({ target_date });
    return res.json({ status: true, message: 'Depreciation calculation committed successfully', data: result });
  } catch (err) {
    logError('asset.controller.runDepreciation', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

// 8. Disposal
exports.getDisposals = async (req, res) => {
  try {
    const { asset_id, page = 1, limit = 50 } = req.query;
    const result = await AssetModel.getDisposals({ asset_id, page, limit });
    return res.json({ status: true, data: result.records, pagination: result.pagination });
  } catch (err) {
    logError('asset.controller.getDisposals', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.createDisposal = async (req, res) => {
  try {
    const { asset_id, disposal_method } = req.body;
    if (!asset_id || !disposal_method) {
      return res.status(400).json({ status: false, message: 'Asset ID and disposal method are required' });
    }
    const result = await AssetModel.createDisposal(req.body);
    return res.status(201).json({ status: true, message: 'Asset retired / disposed successfully', data: result });
  } catch (err) {
    logError('asset.controller.createDisposal', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

// 9. Reports
exports.getAssetReports = async (req, res) => {
  try {
    const { type, category_id, start_date, end_date } = req.query;
    const result = await AssetModel.getAssetReports({ type, category_id, start_date, end_date });
    return res.json({ status: true, data: result });
  } catch (err) {
    logError('asset.controller.getAssetReports', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};
