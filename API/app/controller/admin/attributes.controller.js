const AttributesModel = require('../../models/admins/attributes.model');
const { sendSuccess, sendError } = require('../../config/utill/response');

/**
 * GET /api/admin/attributes
 */
exports.listAttributes = async (req, res) => {
  try {
    const list = await AttributesModel.getAllAttributesWithValues();
    return sendSuccess(res, list, 'Attributes fetched successfully');
  } catch (err) {
    return sendError(res, 'Failed to fetch attributes', 500, err.message);
  }
};

/**
 * POST /api/admin/attributes
 */
exports.createAttribute = async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name) return sendError(res, 'Attribute name is required', 400);
    const result = await AttributesModel.createAttribute({ name, code });
    return sendSuccess(res, result, 'Attribute created successfully', null, 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to create attribute', 400);
  }
};

/**
 * PUT /api/admin/attributes/:id
 */
exports.updateAttribute = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;
    await AttributesModel.updateAttribute(id, { name, code });
    return sendSuccess(res, null, 'Attribute updated successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to update attribute', 400);
  }
};

/**
 * DELETE /api/admin/attributes/:id
 */
exports.deleteAttribute = async (req, res) => {
  try {
    const { id } = req.params;
    await AttributesModel.deleteAttribute(id);
    return sendSuccess(res, null, 'Attribute deleted successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to delete attribute', 400);
  }
};

/**
 * GET /api/admin/attributes/:id/values
 */
exports.getAttributeValues = async (req, res) => {
  try {
    const { id } = req.params;
    const values = await AttributesModel.getAttributeValues(id);
    return sendSuccess(res, values, 'Attribute values fetched successfully');
  } catch (err) {
    return sendError(res, 'Failed to fetch attribute values', 500, err.message);
  }
};

/**
 * POST /api/admin/attributes/:id/values
 */
exports.addAttributeValue = async (req, res) => {
  try {
    const { id } = req.params;
    const { value, color_code, sort_order } = req.body;
    if (!value) return sendError(res, 'Value is required', 400);
    const result = await AttributesModel.addValue({ attribute_id: id, value, color_code, sort_order });
    return sendSuccess(res, result, 'Attribute value added successfully', null, 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to add attribute value', 400);
  }
};

/**
 * DELETE /api/admin/attributes/values/:valueId
 */
exports.deleteAttributeValue = async (req, res) => {
  try {
    const { valueId } = req.params;
    await AttributesModel.deleteValue(valueId);
    return sendSuccess(res, null, 'Attribute value removed successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to remove attribute value', 400);
  }
};

/**
 * POST /api/admin/attributes/generate-combinations
 * Takes { attributeSelections: [{ name: "Color", values: ["Red","Blue"] }], baseSku: "SHIRT", basePrice: 25, baseCost: 10 }
 */
exports.generateVariantCombinations = async (req, res) => {
  try {
    const { attributeSelections, baseSku = 'PRD', basePrice = 0, baseCost = 0 } = req.body;
    const combinations = AttributesModel.generateCombinations(attributeSelections, baseSku, basePrice, baseCost);
    return sendSuccess(res, combinations, `Generated ${combinations.length} variant combinations`);
  } catch (err) {
    return sendError(res, 'Failed to generate variant combinations', 400, err.message);
  }
};
