const UnitsModel = require('../../models/admins/units.model');
const { logError } = require('../../config/utill/logErr');
const {
  unitToBaseQty,
  baseToUnitQty,
  convertToBasePrice,
  convertFromBasePrice,
  convertUnitToString
} = require('../../utils/unitConverter');

const VALID_OPERATORS = ['*', '/', '+', '-'];

/**
 * GET /api/admin/units & GET /api/units
 * Retrieve all units with base unit hierarchy and usage counts
 * Replicates System_settings::getUnits()
 */
exports.getUnits = async (req, res) => {
  try {
    const rows = await UnitsModel.getUnits();
    res.json({
      status: true,
      success: true,
      data: rows
    });
  } catch (err) {
    logError('units.controller.getUnits', err, res);
  }
};

/**
 * GET /api/admin/units/base
 * Retrieve only base units (where base_unit IS NULL or 0)
 * Replicates Site::getAllBaseUnits()
 */
exports.getBaseUnits = async (req, res) => {
  try {
    const rows = await UnitsModel.getAllBaseUnits();
    res.json({
      status: true,
      success: true,
      data: rows
    });
  } catch (err) {
    logError('units.controller.getBaseUnits', err, res);
  }
};

/**
 * GET /api/admin/units/by-base/:baseUnitId
 * Retrieve the base unit and all its sub-units ordered by id ASC
 * Replicates Products::getSubUnits($unit_id) -> Site::getUnitsByBUID($unit_id)
 */
exports.getUnitsByBUID = async (req, res) => {
  try {
    const { baseUnitId } = req.params;
    const rows = await UnitsModel.getUnitsByBUID(baseUnitId);
    res.json({
      status: true,
      data: rows
    });
  } catch (err) {
    logError('units.controller.getUnitsByBUID', err, res);
  }
};

/**
 * GET /api/admin/units/sub-units/:baseUnitId
 * Retrieve sub-units linked to a given base unit.
 * By default returns the full unit family (base + sub-units) like AURA_v1 Products::getSubUnits($unit_id),
 * or only child sub-units when ?only_children=1 is passed.
 */
exports.getSubUnits = async (req, res) => {
  try {
    const { baseUnitId } = req.params;
    const onlyChildren = req.query.only_children === '1' || req.query.only_children === 'true';
    const rows = onlyChildren
      ? await UnitsModel.getUnitChildren(baseUnitId)
      : await UnitsModel.getUnitsByBUID(baseUnitId);

    res.json({
      status: true,
      data: rows
    });
  } catch (err) {
    logError('units.controller.getSubUnits', err, res);
  }
};

/**
 * GET /api/admin/units/:id
 * Retrieve a single unit by ID
 * Replicates Site::getUnitByID($id)
 */
exports.getUnitById = async (req, res) => {
  try {
    const { id } = req.params;
    const unit = await UnitsModel.getUnitByID(id);
    if (!unit) {
      return res.status(404).json({ status: false, message: 'Unit not found' });
    }
    res.json({
      status: true,
      data: unit
    });
  } catch (err) {
    logError('units.controller.getUnitById', err, res);
  }
};

/**
 * POST /api/admin/units
 * Create a new unit (either base unit or sub-unit with operator & operation_value)
 * Replicates System_settings::add_unit()
 */
exports.createUnit = async (req, res) => {
  try {
    const { code, name, base_unit, operator, operation_value, unit_value } = req.body;

    if (!code || !String(code).trim() || !name || !String(name).trim()) {
      return res.status(400).json({ status: false, message: 'Unit code and name are required' });
    }

    const existing = await UnitsModel.getUnitByCode(code);
    if (existing) {
      return res.status(400).json({ status: false, message: `Unit code '${String(code).trim()}' already exists` });
    }

    const isSubUnit = base_unit && parseInt(base_unit, 10) > 0;
    if (isSubUnit) {
      if (!operator || !VALID_OPERATORS.includes(operator)) {
        return res.status(400).json({ status: false, message: 'Valid operator (*, /, +, -) is required when Base Unit is selected' });
      }
      if (operation_value === undefined || operation_value === null || String(operation_value).trim() === '') {
        return res.status(400).json({ status: false, message: 'Operation value is required when Base Unit is selected' });
      }
    }

    const created = await UnitsModel.addUnit({
      code,
      name,
      base_unit: isSubUnit ? parseInt(base_unit, 10) : null,
      operator: isSubUnit ? operator : null,
      unit_value: isSubUnit ? (unit_value ?? operation_value) : null,
      operation_value: isSubUnit ? operation_value : null
    });

    res.status(201).json({
      status: true,
      message: 'Unit successfully added',
      data: created
    });
  } catch (err) {
    logError('units.controller.createUnit', err, res);
  }
};

/**
 * PUT /api/admin/units/:id
 * Update an existing unit
 * Replicates System_settings::edit_unit($id)
 */
exports.updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, base_unit, operator, operation_value, unit_value } = req.body;

    const unit = await UnitsModel.getUnitByID(id);
    if (!unit) {
      return res.status(404).json({ status: false, message: 'Unit not found' });
    }

    if (code && String(code).trim() !== unit.code) {
      const duplicate = await UnitsModel.getUnitByCode(code);
      if (duplicate && Number(duplicate.id) !== Number(id)) {
        return res.status(400).json({ status: false, message: `Unit code '${String(code).trim()}' is already used by another unit` });
      }
    }

    const isSubUnit = base_unit && parseInt(base_unit, 10) > 0;
    if (isSubUnit) {
      if (Number(base_unit) === Number(id)) {
        return res.status(400).json({ status: false, message: 'A unit cannot be its own base unit' });
      }
      if (!operator || !VALID_OPERATORS.includes(operator)) {
        return res.status(400).json({ status: false, message: 'Valid operator (*, /, +, -) is required when Base Unit is selected' });
      }
      if (operation_value === undefined || operation_value === null || String(operation_value).trim() === '') {
        return res.status(400).json({ status: false, message: 'Operation value is required when Base Unit is selected' });
      }
    }

    const updated = await UnitsModel.updateUnit(id, {
      code: code || unit.code,
      name: name || unit.name,
      base_unit: isSubUnit ? parseInt(base_unit, 10) : null,
      operator: isSubUnit ? operator : null,
      unit_value: isSubUnit ? (unit_value ?? operation_value) : null,
      operation_value: isSubUnit ? operation_value : null
    });

    res.json({
      status: true,
      message: 'Unit successfully updated',
      data: updated
    });
  } catch (err) {
    logError('units.controller.updateUnit', err, res);
  }
};

/**
 * DELETE /api/admin/units/:id
 * Delete unit with safety dependency checks
 * Replicates System_settings::delete_unit($id):
 *   if ($this->settings_model->getUnitChildren($id)) {
 *       $this->bpas->send_json(['error' => 1, 'msg' => lang('unit_has_subunit')]);
 *   }
 *   if ($this->settings_model->deleteUnit($id)) {
 *       $this->bpas->send_json(['error' => 0, 'msg' => lang('unit_deleted')]);
 *   }
 * Note: Returns HTTP 200 with { error: 1, status: false, msg: ... } like Bpas::send_json()
 * so the browser console does not log a red 400 Bad Request network error.
 */
exports.deleteUnit = async (req, res) => {
  try {
    const { id } = req.params;

    const children = await UnitsModel.getUnitChildren(id);
    if (children.length > 0) {
      return res.status(200).json({
        status: false,
        success: false,
        error: 1,
        msg: 'Unit can not be deleted! Unit has sub-units.',
        message: 'Unit can not be deleted! Unit has sub-units.'
      });
    }

    await UnitsModel.deleteUnit(id);

    res.status(200).json({
      status: true,
      success: true,
      error: 0,
      msg: 'Unit successfully deleted',
      message: 'Unit successfully deleted'
    });
  } catch (err) {
    logError('units.controller.deleteUnit', err, res);
  }
};

/**
 * POST /api/admin/units/actions
 * Bulk unit actions: delete or export_excel
 * Replicates System_settings::unit_actions()
 */
exports.unitActions = async (req, res) => {
  try {
    const { form_action, val = [] } = req.body;
    const ids = Array.isArray(val) ? val : [val].filter(Boolean);

    if (!ids.length) {
      return res.status(200).json({
        status: false,
        success: false,
        error: 1,
        msg: 'No record selected, please select at least one row',
        message: 'No record selected, please select at least one row'
      });
    }

    if (form_action === 'delete') {
      const skipped = [];
      let deletedCount = 0;

      for (const id of ids) {
        const children = await UnitsModel.getUnitChildren(id);
        if (children.length > 0) {
          const u = await UnitsModel.getUnitByID(id);
          skipped.push(`${u?.name || id} (has sub-units)`);
          continue;
        }
        await UnitsModel.deleteUnit(id);
        deletedCount += 1;
      }

      if (deletedCount === 0 && skipped.length > 0) {
        return res.status(200).json({
          status: false,
          success: false,
          error: 1,
          msg: `Unit can not be deleted! Unit has sub-units (${skipped.join(', ')})`,
          message: `Unit can not be deleted! Unit has sub-units (${skipped.join(', ')})`
        });
      }

      return res.status(200).json({
        status: true,
        success: true,
        error: 0,
        deletedCount,
        skipped,
        msg: skipped.length > 0
          ? `${deletedCount} units deleted. Skipped: ${skipped.join(', ')}`
          : 'Units successfully deleted',
        message: skipped.length > 0
          ? `${deletedCount} units deleted. Skipped: ${skipped.join(', ')}`
          : 'Units successfully deleted'
      });
    }

    if (form_action === 'export_excel') {
      const exportRows = [];
      for (const id of ids) {
        const u = await UnitsModel.getUnitByID(id);
        if (u) {
          exportRows.push({
            id: u.id,
            code: u.code,
            name: u.name,
            base_unit: u.base_unit_code || u.base_unit_name || '',
            operator: u.operator || '',
            unit_value: u.unit_value || '',
            operation_value: u.operation_value || ''
          });
        }
      }
      return res.json({
        status: true,
        data: exportRows
      });
    }

    return res.status(400).json({
      status: false,
      message: 'Please select a valid action.'
    });
  } catch (err) {
    logError('units.controller.unitActions', err, res);
  }
};

/**
 * GET /api/admin/units/change-unit-price & GET /api/admin/units/change-unit-price/:groupId
 * Look up unit price by product_id, unit_id, and optional price groupId
 * Replicates System_settings::ChangeUnitToGetNewPrice($group_id)
 */
exports.changeUnitToGetNewPrice = async (req, res) => {
  try {
    const groupId = req.params.groupId || req.query.group_id || null;
    const unitId = req.query.unit_id;
    const productId = req.query.product_id;

    if (!productId || !unitId) {
      return res.status(400).json({ status: false, message: 'product_id and unit_id are required' });
    }

    let rows = await UnitsModel.getPriceByUnit(productId, unitId, groupId);
    if (!rows) {
      rows = await UnitsModel.elseGetPriceByUnit(productId, unitId);
    }

    res.json(rows || { status: false, price: 0 });
  } catch (err) {
    logError('units.controller.changeUnitToGetNewPrice', err, res);
  }
};

/**
 * GET /api/admin/units/product-suggestions
 * Product suggestions with multi-unit options
 * Replicates System_settings::productSuggestionByMultiUnit()
 */
exports.productSuggestionByMultiUnit = async (req, res) => {
  try {
    const term = req.query.term || '';
    if (!term || String(term).length < 1) {
      return res.json([]);
    }

    const rows = await UnitsModel.getProductNamesByMultiunit(term, 10);
    if (!rows.length) {
      return res.json([{ id: 0, label: 'No matching result found', value: term }]);
    }

    const pr = rows.map((row) => ({
      id: `${row.id}_${Date.now()}`,
      item_id: row.id,
      label: `${row.name} (${row.code})`,
      row,
      units: row.units || []
    }));

    res.json(pr);
  } catch (err) {
    logError('units.controller.productSuggestionByMultiUnit', err, res);
  }
};

/**
 * GET /api/admin/units/check-duplicate-code
 * Check if a unit barcode/product_code already exists
 * Replicates AURA_v1 products/add.php check_dupplicate_code
 */
exports.checkDuplicateUnitCode = async (req, res) => {
  try {
    const productCode = req.query.product_code || req.query.code || '';
    const excludeProductId = req.query.exclude_product_id || null;
    const found = await UnitsModel.checkDuplicateUnitCode(productCode, excludeProductId);
    res.json({
      status: true,
      exists: Boolean(found),
      data: found || false
    });
  } catch (err) {
    logError('units.controller.checkDuplicateUnitCode', err, res);
  }
};

/**
 * GET /api/admin/products/:id/units
 * Retrieve multi-unit configuration and price overrides for a product
 */
exports.getProductUnits = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const details = await UnitsModel.getProductUnitsDetails(productId);
    if (!details) {
      return res.status(404).json({ status: false, message: 'Product not found' });
    }

    res.json({
      status: true,
      data: details
    });
  } catch (err) {
    logError('units.controller.getProductUnits', err, res);
  }
};

/**
 * PUT /api/admin/products/:id/units
 * Save multi-unit pricing and packaging barcodes for a product
 */
exports.saveProductUnits = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { unit, sale_unit, purchase_unit, unitPrices = [] } = req.body;

    await UnitsModel.saveProductUnits(productId, {
      unit,
      sale_unit,
      purchase_unit,
      unitPrices
    });

    res.json({
      status: true,
      message: 'Product multi-unit configuration saved successfully'
    });
  } catch (err) {
    logError('units.controller.saveProductUnits', err, res);
  }
};
