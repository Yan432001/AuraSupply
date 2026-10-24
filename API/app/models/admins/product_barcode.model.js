const pool = require('../../config/dbPool');
const BarcodeService = require('../../services/barcode.service');

class ProductBarcodeModel {
  /**
   * Cast raw database record to standardized Product entity
   */
  static castProduct(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      sku: row.sku || row.item_code || row.code || '',
      barcode: row.barcode || row.code || '',
      barcode_type: (row.barcode_type || row.barcode_symbology || 'CODE128').toUpperCase(),
      price: parseFloat(row.price) || 0,
      sale_price: row.sale_price !== null && row.sale_price !== undefined ? parseFloat(row.sale_price) : (row.promo_price ? parseFloat(row.promo_price) : null),
      formatted_price: BarcodeService.formatPrice(row.price, row.currency || 'USD'),
      formatted_sale_price: row.sale_price ? BarcodeService.formatPrice(row.sale_price, row.currency || 'USD') : null,
      unit: row.unit_name || row.unit || 'PCS',
      unit_id: row.unit,
      category_id: row.category_id,
      category_name: row.category_name || '',
      brand_id: row.brand_id || row.brand,
      brand_name: row.brand_name || '',
      status: parseInt(row.status) === 1 ? 1 : 0,
      image: row.image || 'no_image.png',
      weight: parseFloat(row.weight) || 0,
      currency: row.currency || 'USD',
      created_at: row.created_at || row.created_date,
      updated_at: row.updated_at,
      variants: row.variants || []
    };
  }

  /**
   * List products with search, filters, pagination, and variant expansion
   */
  static async listProducts({
    search = '',
    category_id = null,
    brand_id = null,
    status = 'all',
    only_missing_barcode = false,
    sort_by = 'p.id',
    sort_order = 'DESC',
    page = 1,
    limit = 20
  }) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(200, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    const conditions = ['1=1'];
    const params = [];

    // Search scope (name, second_name, sku, barcode, or code)
    if (search && search.trim() !== '') {
      conditions.push('(p.name LIKE ? OR p.second_name LIKE ? OR p.code LIKE ? OR p.barcode LIKE ? OR p.sku LIKE ? OR p.item_code LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term, term);
    }

    // Category filter
    if (category_id && category_id !== 'all') {
      conditions.push('p.category_id = ?');
      params.push(category_id);
    }

    // Brand filter
    if (brand_id && brand_id !== 'all') {
      conditions.push('(p.brand_id = ? OR p.brand = ?)');
      params.push(brand_id, brand_id);
    }

    // Status filter
    if (status !== 'all' && status !== undefined && status !== null && status !== '') {
      conditions.push('p.status = ?');
      params.push(parseInt(status) === 1 ? 1 : 0);
    }

    // Missing barcode scope
    if (only_missing_barcode === true || only_missing_barcode === '1' || only_missing_barcode === 'true') {
      conditions.push('(p.barcode IS NULL OR p.barcode = "" OR p.code IS NULL OR p.code = "")');
    }

    // Allowed sort columns
    const allowedSortCols = {
      'id': 'p.id',
      'name': 'p.name',
      'barcode': 'p.barcode',
      'sku': 'p.sku',
      'price': 'p.price',
      'status': 'p.status',
      'created_at': 'p.created_at'
    };
    const sortCol = allowedSortCols[sort_by] || 'p.id';
    const orderDirection = (sort_order || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const whereClause = conditions.join(' AND ');

    // Count query
    const countSql = `
      SELECT COUNT(DISTINCT p.id) AS total
      FROM aura_products p
      WHERE ${whereClause}
    `;
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0] ? countRows[0].total : 0;

    // Data query with category and brand joins (avoids N+1)
    const dataSql = `
      SELECT 
        p.id, p.name, p.code, p.barcode, p.barcode_symbology, p.barcode_type,
        p.item_code, p.sku, p.price, p.promo_price, p.sale_price, p.promotion,
        p.unit, u.name AS unit_name,
        p.category_id, c.name AS category_name,
        p.brand, p.brand_id, b.name AS brand_name,
        p.status, p.image, p.weight, p.currency,
        p.created_date, p.created_at, p.updated_at
      FROM aura_products p
      LEFT JOIN aura_categories c ON c.id = p.category_id
      LEFT JOIN aura_brands b ON b.id = COALESCE(p.brand_id, p.brand)
      LEFT JOIN aura_units u ON u.id = p.unit
      WHERE ${whereClause}
      ORDER BY ${sortCol} ${orderDirection}
      LIMIT ? OFFSET ?
    `;

    const queryParams = [...params, limitNum, offset];
    const [rows] = await pool.query(dataSql, queryParams);

    // Batch fetch variants to prevent N+1 queries
    const productIds = rows.map(r => r.id);
    let variantsByProduct = {};
    if (productIds.length > 0) {
      const [varRows] = await pool.query(`
        SELECT 
          pv.id, pv.product_id, pv.name, pv.sku, pv.barcode, pv.cost, pv.price
        FROM aura_product_variants pv
        WHERE pv.product_id IN (?)
        ORDER BY pv.id ASC
      `, [productIds]);

      for (const v of varRows) {
        if (!variantsByProduct[v.product_id]) {
          variantsByProduct[v.product_id] = [];
        }
        variantsByProduct[v.product_id].push(v);
      }
    }

    // Format products
    const products = rows.map(r => {
      const p = this.castProduct(r);
      p.variants = variantsByProduct[r.id] || [];
      return p;
    });

    return {
      products,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    };
  }

  /**
   * Find product by ID with category, brand, and variants
   */
  static async findById(id) {
    const [rows] = await pool.query(`
      SELECT 
        p.*, 
        c.name AS category_name,
        b.name AS brand_name,
        u.name AS unit_name
      FROM aura_products p
      LEFT JOIN aura_categories c ON c.id = p.category_id
      LEFT JOIN aura_brands b ON b.id = COALESCE(p.brand_id, p.brand)
      LEFT JOIN aura_units u ON u.id = p.unit
      WHERE p.id = ?
      LIMIT 1
    `, [id]);

    if (!rows || rows.length === 0) return null;

    const [variants] = await pool.query(`
      SELECT id, product_id, name, sku, barcode, cost, price
      FROM aura_product_variants
      WHERE product_id = ?
    `, [id]);

    const product = this.castProduct(rows[0]);
    product.variants = variants;
    return product;
  }

  /**
   * Auto-generate and assign unique barcode to product
   */
  static async generateAndAssignBarcode(productId, barcodeType = 'CODE128', prefix = 'AUR') {
    const product = await this.findById(productId);
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    let uniqueBarcode = null;
    let attempts = 0;
    const maxAttempts = 15;

    while (!uniqueBarcode && attempts < maxAttempts) {
      attempts++;
      const candidate = BarcodeService.generateBarcodeValue(barcodeType, prefix || product.sku || 'AUR');

      // Check collision
      const [existing] = await pool.query(
        'SELECT id FROM aura_products WHERE (barcode = ? OR code = ?) AND id != ? LIMIT 1',
        [candidate, candidate, productId]
      );

      if (!existing || existing.length === 0) {
        uniqueBarcode = candidate;
      }
    }

    if (!uniqueBarcode) {
      throw new Error(`Failed to generate unique barcode after ${maxAttempts} attempts`);
    }

    // Update product
    await pool.query(`
      UPDATE aura_products 
      SET barcode = ?, code = ?, barcode_type = ?, barcode_symbology = LOWER(?)
      WHERE id = ?
    `, [uniqueBarcode, uniqueBarcode, barcodeType.toUpperCase(), barcodeType.toLowerCase(), productId]);

    return {
      product_id: productId,
      barcode: uniqueBarcode,
      barcode_type: barcodeType.toUpperCase()
    };
  }

  /**
   * Batch generate barcodes for missing products
   */
  static async batchGenerateBarcodes(productIds, barcodeType = 'CODE128', prefix = 'AUR') {
    const results = [];
    const ids = Array.isArray(productIds) ? productIds : [productIds];

    for (const id of ids) {
      try {
        const gen = await this.generateAndAssignBarcode(id, barcodeType, prefix);
        results.push({ id, success: true, ...gen });
      } catch (err) {
        results.push({ id, success: false, error: err.message });
      }
    }
    return results;
  }
}

module.exports = ProductBarcodeModel;
