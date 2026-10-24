const pool = require('../../config/utill/connection');

class BarcodeModel {
  /**
   * Helper to format money numbers
   */
  static formatMoney(val) {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : parseFloat(num.toFixed(2));
  }

  /**
   * Get system settings and currencies for barcode printing
   */
  static async getBarcodeSettings() {
    let siteName = 'AURA';
    let defaultCurrency = 'USD';
    let barcodeSeparator = '_';

    try {
      const [settings] = await pool.query(
        'SELECT site_name, default_currency, barcode_separator FROM aura_settings LIMIT 1'
      );
      if (settings && settings.length > 0) {
        siteName = settings[0].site_name || siteName;
        defaultCurrency = settings[0].default_currency || defaultCurrency;
        barcodeSeparator = settings[0].barcode_separator || barcodeSeparator;
      }
    } catch (e) {
      console.warn('Error reading aura_settings for barcode:', e.message);
    }

    let currencies = [];
    try {
      const [currRows] = await pool.query('SELECT id, code, name, rate, symbol FROM aura_currencies ORDER BY id ASC');
      currencies = currRows || [];
    } catch (e) {
      currencies = [
        { id: 1, code: 'USD', name: 'DOLLAR', rate: '1.00', symbol: '$' },
        { id: 2, code: 'KHR', name: 'RIEL', rate: '4100.00', symbol: '៛' },
        { id: 3, code: 'BAHT', name: 'BAHT', rate: '33.00', symbol: '฿' }
      ];
    }

    const paperStyles = [
      { key: '24', name: '24 per sheet (70mm x 37mm, A4 3x8)', cols: 3, rows: 8, sheetType: 'a4', widthMm: 70, heightMm: 37 },
      { key: '40', name: '40 per sheet (48.5mm x 25.4mm, A4 4x10)', cols: 4, rows: 10, sheetType: 'a4', widthMm: 48.5, heightMm: 25.4 },
      { key: '30', name: '30 per sheet (70mm x 29.7mm, A4 3x10)', cols: 3, rows: 10, sheetType: 'a4', widthMm: 70, heightMm: 29.7 },
      { key: '20', name: '20 per sheet (101.6mm x 25.4mm, A4 2x10)', cols: 2, rows: 10, sheetType: 'a4', widthMm: 101.6, heightMm: 25.4 },
      { key: '18', name: '18 per sheet (70mm x 48.5mm, A4 3x6)', cols: 3, rows: 6, sheetType: 'a4', widthMm: 70, heightMm: 48.5 },
      { key: '14', name: '14 per sheet (101.6mm x 38.1mm, A4 2x7)', cols: 2, rows: 7, sheetType: 'a4', widthMm: 101.6, heightMm: 38.1 },
      { key: '12', name: '12 per sheet (101.6mm x 48mm, A4 2x6)', cols: 2, rows: 6, sheetType: 'a4', widthMm: 101.6, heightMm: 48 },
      { key: '10', name: '10 per sheet (101.6mm x 50.8mm, A4 2x5)', cols: 2, rows: 5, sheetType: 'a4', widthMm: 101.6, heightMm: 50.8 },
      { key: '84', name: '84 per sheet (16mm x 21mm, A4 7x12 - Mini)', cols: 7, rows: 12, sheetType: 'a4', widthMm: 16, heightMm: 21 },
      { key: '2', name: '2 per sheet (A4 half sheet)', cols: 1, rows: 2, sheetType: 'a4', widthMm: 190, heightMm: 130 },
      { key: '1', name: '1 per sheet (50mm x 30mm - Standard Thermal Roll)', cols: 1, rows: 1, sheetType: 'roll', widthMm: 50, heightMm: 30 },
      { key: '4025', name: '1 per sheet (40mm x 25mm - Compact Thermal Roll)', cols: 1, rows: 1, sheetType: 'roll', widthMm: 40, heightMm: 25 },
      { key: 'jewellery', name: 'Jewellery Label (Dual Tail Tag with Weight)', cols: 1, rows: 1, sheetType: 'roll', widthMm: 80, heightMm: 25 },
      { key: 'shelf', name: 'Shelf Edge Tag (Retail Price & Unit Barcode)', cols: 2, rows: 7, sheetType: 'shelf', widthMm: 95, heightMm: 38 },
      { key: '50', name: 'Continuous Feed (Custom Width x Height)', cols: 1, rows: 1, sheetType: 'custom' }
    ];

    let categories = [];
    try {
      const [catRows] = await pool.query('SELECT id, name, code FROM aura_categories ORDER BY name ASC');
      categories = catRows || [];
    } catch (e) {
      console.warn('Error reading aura_categories for barcode:', e.message);
    }

    let brands = [];
    try {
      const [brandRows] = await pool.query('SELECT id, name FROM aura_brands ORDER BY name ASC');
      brands = brandRows || [];
    } catch (e) {
      console.warn('Error reading aura_brands for barcode:', e.message);
    }

    let missingBarcodesCount = 0;
    try {
      const [missRows] = await pool.query('SELECT COUNT(*) as count FROM aura_products WHERE barcode IS NULL OR barcode = "" OR code IS NULL OR code = ""');
      missingBarcodesCount = missRows[0] ? missRows[0].count : 0;
    } catch (e) {
      console.warn('Error counting missing barcodes:', e.message);
    }

    return {
      site_name: siteName,
      default_currency: defaultCurrency,
      barcode_separator: barcodeSeparator,
      currencies,
      paper_styles: paperStyles,
      categories,
      brands,
      missing_barcodes_count: missingBarcodesCount
    };
  }

  /**
   * Search products by name, code, or barcode for barcode printing list
   */
  static async searchProducts(term = '', limit = 30) {
    let whereClause = '1=1';
    const params = [];

    if (term && term.trim()) {
      whereClause += ` AND (p.name LIKE ? OR p.code LIKE ? OR p.barcode LIKE ? OR p.sku LIKE ?)`;
      const s = `%${term.trim()}%`;
      params.push(s, s, s, s);
    }

    params.push(parseInt(limit, 10) || 30);

    const [products] = await pool.query(
      `SELECT 
        p.id,
        p.code,
        p.name,
        p.price,
        p.cost,
        p.promo_price,
        p.promotion,
        p.weight,
        p.image,
        p.barcode_symbology,
        c.name as category_name,
        u.name as unit_name,
        u.code as unit_code
       FROM aura_products p
       LEFT JOIN aura_categories c ON c.id = p.category_id
       LEFT JOIN aura_units u ON u.id = p.unit
       WHERE ${whereClause}
       ORDER BY p.name ASC
       LIMIT ?`,
      params
    );

    // Fetch variants for each product
    const productIds = products.map((p) => p.id);
    let variantsByProduct = {};

    if (productIds.length > 0) {
      const [variants] = await pool.query(
        `SELECT id, product_id, name, sku, barcode, price, cost 
         FROM aura_product_variants 
         WHERE product_id IN (${productIds.map(() => '?').join(',')})`,
        productIds
      );

      for (const v of variants) {
        if (!variantsByProduct[v.product_id]) {
          variantsByProduct[v.product_id] = [];
        }
        variantsByProduct[v.product_id].push({
          id: v.id,
          name: v.name,
          sku: v.sku,
          barcode: v.barcode,
          price: parseFloat(v.price) || 0,
          cost: parseFloat(v.cost) || 0
        });
      }
    }

    return products.map((p) => {
      const variants = variantsByProduct[p.id] || [];
      const selectedVariants = {};
      variants.forEach((v) => {
        selectedVariants[v.id] = true;
      });

      return {
        id: p.id,
        code: p.code,
        name: p.name,
        price: parseFloat(p.price) || 0,
        cost: parseFloat(p.cost) || 0,
        promo_price: p.promo_price ? parseFloat(p.promo_price) : null,
        promotion: Boolean(p.promotion),
        weight: p.weight ? parseFloat(p.weight) : null,
        image: p.image || null,
        barcode_symbology: p.barcode_symbology || 'code128',
        category_name: p.category_name || 'General',
        unit_name: p.unit_name || p.unit_code || 'pcs',
        quantity: 1,
        variants,
        selected_variants: selectedVariants
      };
    });
  }

  /**
   * Get single product with full barcode formatting
   */
  static async getProductForBarcode(id) {
    const products = await this.searchProducts('', 1);
    const [rows] = await pool.query(
      `SELECT 
        p.id,
        p.code,
        p.name,
        p.price,
        p.cost,
        p.promo_price,
        p.promotion,
        p.weight,
        p.image,
        p.barcode_symbology,
        c.name as category_name,
        u.name as unit_name,
        u.code as unit_code
       FROM aura_products p
       LEFT JOIN aura_categories c ON c.id = p.category_id
       LEFT JOIN aura_units u ON u.id = p.unit
       WHERE p.id = ?
       LIMIT 1`,
      [id]
    );

    if (rows.length === 0) return null;
    const p = rows[0];

    const [variants] = await pool.query(
      `SELECT id, product_id, name, sku, barcode, price, cost 
       FROM aura_product_variants 
       WHERE product_id = ?`,
      [p.id]
    );

    const selectedVariants = {};
    variants.forEach((v) => {
      selectedVariants[v.id] = true;
    });

    return {
      id: p.id,
      code: p.code,
      name: p.name,
      price: parseFloat(p.price) || 0,
      cost: parseFloat(p.cost) || 0,
      promo_price: p.promo_price ? parseFloat(p.promo_price) : null,
      promotion: Boolean(p.promotion),
      weight: p.weight ? parseFloat(p.weight) : null,
      image: p.image || null,
      barcode_symbology: p.barcode_symbology || 'code128',
      category_name: p.category_name || 'General',
      unit_name: p.unit_name || p.unit_code || 'pcs',
      quantity: 1,
      variants,
      selected_variants: selectedVariants
    };
  }

  /**
   * Import products from a Purchase Order into barcode printing list
   */
  static async getProductsFromPurchase(purchaseId) {
    const [items] = await pool.query(
      `SELECT 
        pi.product_id,
        pi.option_id,
        pi.quantity,
        p.code,
        p.name,
        p.price,
        p.cost,
        p.promo_price,
        p.promotion,
        p.weight,
        p.image,
        p.barcode_symbology,
        c.name as category_name,
        u.name as unit_name,
        u.code as unit_code
       FROM aura_purchase_items pi
       JOIN aura_products p ON p.id = pi.product_id
       LEFT JOIN aura_categories c ON c.id = p.category_id
       LEFT JOIN aura_units u ON u.id = p.unit
       WHERE pi.purchase_id = ?`,
      [purchaseId]
    );

    const result = [];
    for (const item of items) {
      const [variants] = await pool.query(
        `SELECT id, product_id, name, sku, barcode, price, cost 
         FROM aura_product_variants 
         WHERE product_id = ?`,
        [item.product_id]
      );

      const selectedVariants = {};
      variants.forEach((v) => {
        // If specific option_id was in the purchase item, only select that option
        if (item.option_id) {
          selectedVariants[v.id] = String(v.id) === String(item.option_id);
        } else {
          selectedVariants[v.id] = true;
        }
      });

      result.push({
        id: item.product_id,
        code: item.code,
        name: item.name,
        price: parseFloat(item.price) || 0,
        cost: parseFloat(item.cost) || 0,
        promo_price: item.promo_price ? parseFloat(item.promo_price) : null,
        promotion: Boolean(item.promotion),
        weight: item.weight ? parseFloat(item.weight) : null,
        image: item.image || null,
        barcode_symbology: item.barcode_symbology || 'code128',
        category_name: item.category_name || 'General',
        unit_name: item.unit_name || item.unit_code || 'pcs',
        quantity: Math.max(1, Math.round(Math.abs(parseFloat(item.quantity) || 1))),
        variants,
        selected_variants: selectedVariants
      });
    }

    return result;
  }

  /**
   * Import products from an Inventory Transfer into barcode printing list
   */
  static async getProductsFromTransfer(transferId) {
    const [items] = await pool.query(
      `SELECT 
        ti.product_id,
        ti.option_id,
        ti.quantity,
        p.code,
        p.name,
        p.price,
        p.cost,
        p.promo_price,
        p.promotion,
        p.weight,
        p.image,
        p.barcode_symbology,
        c.name as category_name,
        u.name as unit_name,
        u.code as unit_code
       FROM aura_transfer_items ti
       JOIN aura_products p ON p.id = ti.product_id
       LEFT JOIN aura_categories c ON c.id = p.category_id
       LEFT JOIN aura_units u ON u.id = p.unit
       WHERE ti.transfer_id = ?`,
      [transferId]
    );

    const result = [];
    for (const item of items) {
      const [variants] = await pool.query(
        `SELECT id, product_id, name, sku, barcode, price, cost 
         FROM aura_product_variants 
         WHERE product_id = ?`,
        [item.product_id]
      );

      const selectedVariants = {};
      variants.forEach((v) => {
        if (item.option_id) {
          selectedVariants[v.id] = String(v.id) === String(item.option_id);
        } else {
          selectedVariants[v.id] = true;
        }
      });

      result.push({
        id: item.product_id,
        code: item.code,
        name: item.name,
        price: parseFloat(item.price) || 0,
        cost: parseFloat(item.cost) || 0,
        promo_price: item.promo_price ? parseFloat(item.promo_price) : null,
        promotion: Boolean(item.promotion),
        weight: item.weight ? parseFloat(item.weight) : null,
        image: item.image || null,
        barcode_symbology: item.barcode_symbology || 'code128',
        category_name: item.category_name || 'General',
        unit_name: item.unit_name || item.unit_code || 'pcs',
        quantity: Math.max(1, Math.round(Math.abs(parseFloat(item.quantity) || 1))),
        variants,
        selected_variants: selectedVariants
      });
    }

    return result;
  }
}

module.exports = BarcodeModel;
