const BarcodeModel = require('../../models/admins/barcode.model');
const ProductBarcodeModel = require('../../models/admins/product_barcode.model');
const BarcodePrintLogModel = require('../../models/admins/barcode_print_log.model');
const BarcodeTemplateModel = require('../../models/admins/barcode_template.model');
const BarcodeService = require('../../services/barcode.service');
const { logError } = require('../../config/utill/logErr');

/**
 * Barcode Print & Label Generator Controller
 * Fully integrated and upgraded for modern ERP operation.
 */

// 1. List products for barcode management (supports search, category, brand, missing barcode toggle, pagination)
exports.listBarcodeProducts = async (req, res) => {
  try {
    const {
      search = '',
      category_id,
      brand_id,
      status,
      only_missing_barcode,
      sort_by = 'p.id',
      sort_order = 'DESC',
      page = 1,
      limit = 20
    } = req.query;

    const result = await ProductBarcodeModel.listProducts({
      search,
      category_id,
      brand_id,
      status,
      only_missing_barcode: only_missing_barcode === 'true' || only_missing_barcode === '1',
      sort_by,
      sort_order,
      page,
      limit
    });

    return res.json({
      status: true,
      success: true,
      data: result.products,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    });
  } catch (err) {
    logError('barcode.controller.listBarcodeProducts', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

// 2. Generate missing barcodes for selected products
exports.generateBarcodes = async (req, res) => {
  try {
    const { product_ids, barcode_type = 'CODE128', prefix = 'AUR' } = req.body;

    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'Validation failed: product_ids must be a non-empty array of product IDs'
      });
    }

    const validTypes = ['CODE128', 'EAN13', 'UPC', 'QR'];
    const selectedType = barcode_type.toUpperCase();
    if (!validTypes.includes(selectedType)) {
      return res.status(400).json({
        status: false,
        message: `Validation failed: invalid barcode_type. Allowed types: ${validTypes.join(', ')}`
      });
    }

    const results = await ProductBarcodeModel.batchGenerateBarcodes(product_ids, selectedType, prefix);
    const successful = results.filter(r => r.success).length;

    return res.json({
      status: true,
      success: true,
      message: `Generated barcodes for ${successful} of ${product_ids.length} products`,
      data: results
    });
  } catch (err) {
    logError('barcode.controller.generateBarcodes', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

// 3. Return label preview data
exports.previewLabels = async (req, res) => {
  try {
    const { items = [], label_size = '50x30', template = 'standard', barcode_type = 'CODE128', display_options = {} } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'Validation failed: items must be a non-empty array'
      });
    }

    const settings = await BarcodeModel.getBarcodeSettings();
    const siteName = display_options.site_name !== false ? settings.site_name : null;
    const currencies = settings.currencies || [];

    const previewList = [];

    for (const item of items) {
      const productId = item.product_id || item.id;
      const product = await ProductBarcodeModel.findById(productId);
      if (!product) continue;

      const qty = Math.max(1, parseInt(item.quantity) || 1);
      const bType = item.barcode_type || product.barcode_type || barcode_type || 'CODE128';
      const bCode = item.barcode || product.barcode || product.code;

      // Currency conversions
      const currencyConversions = currencies.map(c => ({
        code: c.code,
        symbol: c.symbol,
        formatted: BarcodeService.formatPrice(product.price * parseFloat(c.rate || 1), c.code)
      }));

      // Generate preview unit
      const previewUnit = {
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        barcode: bCode,
        barcode_type: bType,
        price: product.price,
        formatted_price: product.formatted_price,
        currencies: currencyConversions,
        unit: product.unit,
        category: product.category_name,
        image: product.image,
        weight: product.weight,
        quantity: qty,
        label_size,
        template
      };

      previewList.push(previewUnit);
    }

    return res.json({
      status: true,
      success: true,
      data: {
        site_name: siteName,
        total_labels: previewList.reduce((acc, curr) => acc + curr.quantity, 0),
        items: previewList
      }
    });
  } catch (err) {
    logError('barcode.controller.previewLabels', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

// 4. Print labels and record in print history logs
exports.printLabels = async (req, res) => {
  try {
    const { items = [], label_size = '50x30', template = 'standard', barcode_type = 'CODE128' } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'Validation failed: items must be a non-empty array with product_id and quantity'
      });
    }

    const adminId = (req.user && req.user.id) ? req.user.id : 1;

    // Log the print action
    const logResult = await BarcodePrintLogModel.batchCreateLogs(items, {
      label_size,
      template,
      barcode_type,
      printed_by: adminId
    });

    return res.json({
      status: true,
      success: true,
      message: `Successfully logged print operation for ${items.length} product(s)`,
      logged: logResult.inserted,
      printed_at: new Date().toISOString()
    });
  } catch (err) {
    logError('barcode.controller.printLabels', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

// 5. Get print history logs
exports.getPrintLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', date_from, date_to } = req.query;

    const result = await BarcodePrintLogModel.getLogs({
      page,
      limit,
      search,
      date_from,
      date_to
    });

    return res.json({
      status: true,
      success: true,
      data: result.logs,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    });
  } catch (err) {
    logError('barcode.controller.getPrintLogs', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

// 6. Label Templates CRUD
exports.getTemplates = async (req, res) => {
  try {
    const templates = await BarcodeTemplateModel.getTemplates();
    return res.json({ status: true, success: true, data: templates });
  } catch (err) {
    logError('barcode.controller.getTemplates', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const { name, width_mm, height_mm, columns, show_name, show_price, show_sku, show_barcode_text, is_default } = req.body;
    if (!name || !width_mm || !height_mm) {
      return res.status(400).json({ status: false, message: 'name, width_mm, and height_mm are required' });
    }
    const created = await BarcodeTemplateModel.createTemplate(req.body);
    return res.status(201).json({ status: true, success: true, data: created });
  } catch (err) {
    logError('barcode.controller.createTemplate', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await BarcodeTemplateModel.updateTemplate(id, req.body);
    return res.json({ status: true, success: true, data: updated });
  } catch (err) {
    logError('barcode.controller.updateTemplate', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await BarcodeTemplateModel.deleteTemplate(id);
    return res.json({ status: true, success, message: success ? 'Template deleted' : 'Template not found' });
  } catch (err) {
    logError('barcode.controller.deleteTemplate', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

// 7. Existing AURA_v1 Compatibility Handlers
exports.getBarcodeSettings = async (req, res) => {
  try {
    const settings = await BarcodeModel.getBarcodeSettings();
    return res.json({ status: true, success: true, data: settings });
  } catch (err) {
    logError('barcode.controller.getBarcodeSettings', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.searchProducts = async (req, res) => {
  try {
    const { term = '', limit = 30 } = req.query;
    const products = await BarcodeModel.searchProducts(term, limit);
    return res.json({ status: true, success: true, data: products });
  } catch (err) {
    logError('barcode.controller.searchProducts', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.getProductForBarcode = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await BarcodeModel.getProductForBarcode(id);
    if (!product) {
      return res.status(404).json({ status: false, message: 'Product not found' });
    }
    return res.json({ status: true, success: true, data: product });
  } catch (err) {
    logError('barcode.controller.getProductForBarcode', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.getPurchaseBarcodeItems = async (req, res) => {
  try {
    const { id } = req.params;
    const items = await BarcodeModel.getProductsFromPurchase(id);
    return res.json({ status: true, success: true, data: items });
  } catch (err) {
    logError('barcode.controller.getPurchaseBarcodeItems', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.getTransferBarcodeItems = async (req, res) => {
  try {
    const { id } = req.params;
    const items = await BarcodeModel.getProductsFromTransfer(id);
    return res.json({ status: true, success: true, data: items });
  } catch (err) {
    logError('barcode.controller.getTransferBarcodeItems', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};
