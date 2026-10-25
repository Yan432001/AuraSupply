const { db } = require('../../config/utill/helper');
const { logError } = require('../../config/utill/logErr');

/**
 * AURA Inventory & Variant Domain Model
 * Ported from and aligned with AURA_v1 (bpas/models/admin/Products_model.php & Transfers_model.php)
 */
class InventoryModel {
  /**
   * List products with search, category, warehouse, stockStatus filters, pagination, and sorting
   */
  static async getProducts({
    search = '',
    category_id = null,
    brand_id = null,
    warehouse_id = null,
    stock_status = 'all', // 'all', 'in_stock', 'low_stock', 'out_of_stock'
    status = 'all', // 'all', 'active', 'inactive'
    type = 'all',
    page = 1,
    limit = 50,
    sort_by = 'p.id',
    sort_order = 'DESC'
  } = {}) {
    try {
      const offset = (Math.max(1, parseInt(page)) - 1) * Math.max(1, parseInt(limit));
      const params = [];
      let whereClauses = ['1=1'];

      if (search && search.trim() !== '') {
        const term = `%${search.trim()}%`;
        whereClauses.push(`(
          p.name LIKE ? OR 
          p.code LIKE ? OR 
          p.barcode LIKE ? OR 
          p.sku LIKE ? OR 
          p.item_code LIKE ? OR 
          p.second_name LIKE ? OR 
          p.barcode_symbology LIKE ? OR 
          p.details LIKE ? OR
          EXISTS (
            SELECT 1 FROM aura_product_variants pv 
            WHERE pv.product_id = p.id AND (pv.name LIKE ? OR pv.sku LIKE ? OR pv.barcode LIKE ?)
          )
        )`);
        params.push(term, term, term, term, term, term, term, term, term, term, term);
      }

      if (category_id && category_id !== 'all') {
        whereClauses.push('p.category_id = ?');
        params.push(parseInt(category_id));
      }

      if (brand_id && brand_id !== 'all') {
        whereClauses.push('(p.brand_id = ? OR p.brand = ?)');
        params.push(parseInt(brand_id), parseInt(brand_id));
      }

      if (warehouse_id && warehouse_id !== 'all') {
        whereClauses.push(`EXISTS (
          SELECT 1 FROM aura_warehouses_products wp 
          WHERE wp.product_id = p.id AND wp.warehouse_id = ?
        )`);
        params.push(parseInt(warehouse_id));
      }

      if (status === 'active') {
        whereClauses.push('(p.status = 1 OR p.status IS NULL)');
      } else if (status === 'inactive') {
        whereClauses.push('p.status = 0');
      }

      if (type && type !== 'all') {
        whereClauses.push('p.type = ?');
        params.push(type);
      }

      if (stock_status === 'low_stock') {
        whereClauses.push('p.quantity > 0 AND p.quantity <= COALESCE(p.alert_quantity, 10)');
      } else if (stock_status === 'out_of_stock') {
        whereClauses.push('p.quantity <= 0');
      } else if (stock_status === 'in_stock') {
        whereClauses.push('p.quantity > COALESCE(p.alert_quantity, 10)');
      }

      const whereSql = whereClauses.join(' AND ');

      // Total count
      const [countResult] = await db.query(`SELECT COUNT(*) as total FROM aura_products p WHERE ${whereSql}`, params);
      const total = countResult[0]?.total || 0;

      // Safe sorting column
      const safeSortCols = {
        'id': 'p.id',
        'code': 'p.code',
        'name': 'p.name',
        'price': 'p.price',
        'cost': 'p.cost',
        'quantity': 'p.quantity',
        'category': 'category_name'
      };
      const orderCol = safeSortCols[sort_by] || 'p.id';
      const orderDir = String(sort_order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const selectSql = `
        SELECT 
          p.*,
          c.name AS category_name,
          c.code AS category_code,
          b.name AS brand_name,
          u.name AS unit_name,
          u.code AS unit_code,
          comp.name AS biller_name,
          comp.company AS biller_company,
          (SELECT COUNT(*) FROM aura_product_variants pv WHERE pv.product_id = p.id) AS variant_count,
          (SELECT GROUP_CONCAT(CONCAT(w.name, ': ', wp.quantity) SEPARATOR ', ')
           FROM aura_warehouses_products wp
           JOIN aura_warehouses w ON w.id = wp.warehouse_id
           WHERE wp.product_id = p.id) AS warehouse_stocks_summary
        FROM aura_products p
        LEFT JOIN aura_categories c ON p.category_id = c.id
        LEFT JOIN aura_brands b ON b.id = COALESCE(p.brand_id, p.brand)
        LEFT JOIN aura_units u ON p.unit = u.id
        LEFT JOIN aura_companies comp ON p.biller_id = comp.id
        WHERE ${whereSql}
        ORDER BY ${orderCol} ${orderDir}
        LIMIT ? OFFSET ?
      `;

      const [products] = await db.query(selectSql, [...params, parseInt(limit), parseInt(offset)]);

      // Fetch variants for all loaded products
      const productIds = products.map(p => p.id);
      let variantsByProductId = {};
      let warehousesByProductId = {};

      if (productIds.length > 0) {
        const placeholders = productIds.map(() => '?').join(',');
        
        // 1. Fetch variants
        const [variants] = await db.query(`
          SELECT pv.*,
                 (SELECT GROUP_CONCAT(CONCAT(w.name, ': ', wpv.quantity) SEPARATOR ', ')
                  FROM aura_warehouses_products_variants wpv
                  JOIN aura_warehouses w ON w.id = wpv.warehouse_id
                  WHERE wpv.option_id = pv.id) AS warehouse_stocks_summary
          FROM aura_product_variants pv
          WHERE pv.product_id IN (${placeholders})
          ORDER BY pv.id ASC
        `, productIds);

        variants.forEach(v => {
          let parsedAttrs = null;
          try {
            parsedAttrs = v.attributes ? (typeof v.attributes === 'string' ? JSON.parse(v.attributes) : v.attributes) : null;
          } catch (_) {}

          if (!variantsByProductId[v.product_id]) variantsByProductId[v.product_id] = [];
          variantsByProductId[v.product_id].push({
            ...v,
            price: parseFloat(v.price) || 0,
            cost: parseFloat(v.cost) || 0,
            quantity: parseFloat(v.quantity) || 0,
            attributes: parsedAttrs,
            status: v.status !== 0 ? 'active' : 'inactive'
          });
        });

        // 2. Fetch warehouse stock balances
        const [whStocks] = await db.query(`
          SELECT wp.product_id, wp.warehouse_id, wp.quantity, wp.rack, w.name as warehouse_name, w.code as warehouse_code
          FROM aura_warehouses_products wp
          JOIN aura_warehouses w ON w.id = wp.warehouse_id
          WHERE wp.product_id IN (${placeholders})
        `, productIds);

        whStocks.forEach(ws => {
          if (!warehousesByProductId[ws.product_id]) warehousesByProductId[ws.product_id] = [];
          warehousesByProductId[ws.product_id].push({
            warehouse_id: ws.warehouse_id,
            warehouse_name: ws.warehouse_name,
            warehouse_code: ws.warehouse_code,
            quantity: parseFloat(ws.quantity) || 0,
            rack: ws.rack || ''
          });
        });
      }

      const formattedProducts = products.map(p => {
        const price = parseFloat(p.price) || 0;
        const cost = parseFloat(p.cost) || 0;
        const quantity = parseFloat(p.quantity) || 0;
        const alertQuantity = parseFloat(p.alert_quantity) || 10;
        const pVariants = variantsByProductId[p.id] || [];
        const pWarehouses = warehousesByProductId[p.id] || [];

        let imageUrl = p.image || '/placeholder.png';
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
          imageUrl = `/assets/uploads/${imageUrl}`;
        }

        let stockStatusTag = 'in_stock';
        if (quantity <= 0) {
          stockStatusTag = 'out_of_stock';
        } else if (quantity <= alertQuantity) {
          stockStatusTag = 'low_stock';
        }

        return {
          id: p.id,
          key: p.id,
          code: p.code || '',
          name: p.name || '',
          item_code: p.item_code || '',
          barcode_symbology: p.barcode_symbology || 'Code128',
          category_id: p.category_id,
          category: p.category_name || 'Uncategorized',
          unit_id: p.unit,
          unit: p.unit_name || 'Pcs',
          price,
          cost,
          quantity,
          stockCount: quantity,
          alertQuantity,
          stock_status: stockStatusTag,
          inStock: quantity > 0,
          image: imageUrl,
          type: p.type || 'standard',
          status: p.status === 0 ? 'inactive' : 'active',
          featured: Boolean(p.featured),
          brand: p.brand || '',
          biller_id: p.biller_id || 1,
          billerName: p.biller_name || p.biller_company || 'Main Store',
          details: p.details || p.product_details || '',
          variants: pVariants,
          variant_count: pVariants.length,
          warehouses: pWarehouses,
          warehouse_stocks_summary: p.warehouse_stocks_summary || ''
        };
      });

      return {
        products: formattedProducts,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit) || 1
      };
    } catch (err) {
      logError('InventoryModel.getProducts', err, null);
      throw err;
    }
  }

  /**
   * Get single product with full variants, warehouse balances, photos, and multi-units
   */
  static async getProductById(id) {
    try {
      const [rows] = await db.query(`
        SELECT 
          p.*,
          c.name AS category_name,
          b.name AS brand_name,
          u.name AS unit_name,
          u.code AS unit_code,
          comp.name AS biller_name,
          comp.company AS biller_company,
          sup1.name AS supplier1_name,
          sup2.name AS supplier2_name,
          sup3.name AS supplier3_name
        FROM aura_products p
        LEFT JOIN aura_categories c ON p.category_id = c.id
        LEFT JOIN aura_brands b ON b.id = COALESCE(p.brand_id, p.brand)
        LEFT JOIN aura_units u ON p.unit = u.id
        LEFT JOIN aura_companies comp ON p.biller_id = comp.id
        LEFT JOIN aura_companies sup1 ON p.supplier1 = sup1.id
        LEFT JOIN aura_companies sup2 ON p.supplier2 = sup2.id
        LEFT JOIN aura_companies sup3 ON p.supplier3 = sup3.id
        WHERE p.id = ?
        LIMIT 1
      `, [id]);

      if (!rows || rows.length === 0) return null;
      const p = rows[0];

      // Variants with warehouse quantities
      const [variants] = await db.query(`
        SELECT pv.*,
               wpv.warehouse_id,
               wpv.quantity AS warehouse_quantity,
               w.name AS warehouse_name
        FROM aura_product_variants pv
        LEFT JOIN aura_warehouses_products_variants wpv ON wpv.option_id = pv.id
        LEFT JOIN aura_warehouses w ON w.id = wpv.warehouse_id
        WHERE pv.product_id = ?
        ORDER BY pv.id ASC
      `, [id]);

      // Group variants with warehouse distribution
      const variantMap = new Map();
      variants.forEach(v => {
        if (!variantMap.has(v.id)) {
          let parsedAttrs = null;
          try {
            parsedAttrs = v.attributes ? (typeof v.attributes === 'string' ? JSON.parse(v.attributes) : v.attributes) : null;
          } catch (_) {}

          variantMap.set(v.id, {
            id: v.id,
            product_id: v.product_id,
            name: v.name,
            sku: v.sku || '',
            barcode: v.barcode || '',
            image: v.image || '',
            attributes: parsedAttrs,
            price: parseFloat(v.price) || parseFloat(p.price) || 0,
            cost: parseFloat(v.cost) || parseFloat(p.cost) || 0,
            quantity: parseFloat(v.quantity) || 0,
            status: v.status !== 0 ? 'active' : 'inactive',
            warehouses: []
          });
        }

        if (v.warehouse_id) {
          variantMap.get(v.id).warehouses.push({
            warehouse_id: v.warehouse_id,
            warehouse_name: v.warehouse_name,
            quantity: parseFloat(v.warehouse_quantity) || 0
          });
        }
      });

      // Warehouse stock balances for the parent product
      const [whStocks] = await db.query(`
        SELECT wp.warehouse_id, wp.quantity, wp.rack, wp.avg_cost, w.name AS warehouse_name, w.code AS warehouse_code
        FROM aura_warehouses_products wp
        JOIN aura_warehouses w ON w.id = wp.warehouse_id
        WHERE wp.product_id = ?
      `, [id]);

      // Gallery photos
      const [photos] = await db.query('SELECT photo FROM aura_product_photos WHERE product_id = ?', [id]);

      let imageUrl = p.image || '/placeholder.png';
      if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
        imageUrl = `/assets/uploads/${imageUrl}`;
      }

      return {
        ...p,
        price: parseFloat(p.price) || 0,
        cost: parseFloat(p.cost) || 0,
        quantity: parseFloat(p.quantity) || 0,
        alertQuantity: parseFloat(p.alert_quantity) || 10,
        category: p.category_name || 'Uncategorized',
        unit: p.unit_name || 'Pcs',
        image: imageUrl,
        variants: Array.from(variantMap.values()),
        warehouse_stocks: whStocks || [],
        gallery: (photos || []).map(ph => ph.photo)
      };
    } catch (err) {
      logError('InventoryModel.getProductById', err, null);
      throw err;
    }
  }

  /**
   * Create product with multiple variants, warehouse stock, and audit trail in an atomic transaction
   */
  static async createProduct(productData) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const {
        name,
        second_name = '',
        code,
        barcode,
        sku,
        type = 'standard',
        category_id = 1,
        subcategory_id = null,
        unit = 1,
        purchase_unit = 1,
        sale_unit = 1,
        currency = 'USD',
        price = 0,
        sale_price = null,
        cost = 0,
        biller_id = 1,
        project_id = null,
        image = '',
        gallery = [],
        barcode_symbology = 'Code128',
        barcode_type = 'CODE128',
        brand = null,
        brand_id = null,
        tax_rate = null,
        tax_method = 'exclusive',
        alert_quantity = 10,
        weight = null,
        p_length = null,
        p_width = null,
        p_height = null,
        cf1 = '',
        cf2 = '',
        cf3 = '',
        cf4 = '',
        cf5 = '',
        cf6 = '',
        supplier1 = null,
        supplier1price = null,
        supplier1_part_no = '',
        supplier2 = null,
        supplier2price = null,
        supplier2_part_no = '',
        supplier3 = null,
        supplier3price = null,
        supplier3_part_no = '',
        promotion = 0,
        promo_price = null,
        start_date = null,
        end_date = null,
        details = '',
        product_details = '',
        variants = [],
        warehouse_id = 1,
        initial_quantity = 0,
        warehouse_allocations = []
      } = productData;

      if (!name || name.trim() === '') {
        throw new Error('Product name is required.');
      }

      const safeCode = (code || barcode || '').trim() || `PRD-${Date.now().toString().slice(-6)}`;

      // Check code uniqueness across aura_products
      const [existingCode] = await conn.query('SELECT id FROM aura_products WHERE code = ? LIMIT 1', [safeCode]);
      if (existingCode && existingCode.length > 0) {
        throw new Error(`Product SKU/Code '${safeCode}' already exists. Please choose a unique SKU.`);
      }

      // Check variant SKUs and combinations uniqueness within payload
      if (Array.isArray(variants) && variants.length > 0) {
        const seenCombinations = new Set();
        const seenSkus = new Set([safeCode.toLowerCase()]);

        for (const v of variants) {
          const vName = (v.name || '').trim().toLowerCase();
          if (!vName) throw new Error('Every variant must have a valid name or attribute combination.');
          if (seenCombinations.has(vName)) {
            throw new Error(`Duplicate variant combination '${v.name}' detected for this product.`);
          }
          seenCombinations.add(vName);

          if (v.sku && v.sku.trim()) {
            const vSku = v.sku.trim().toLowerCase();
            if (seenSkus.has(vSku)) {
              throw new Error(`Duplicate SKU '${v.sku}' detected among variants.`);
            }
            seenSkus.add(vSku);

            // Check against existing database products & variants
            const [existingProdSku] = await conn.query('SELECT id FROM aura_products WHERE LOWER(code) = ? LIMIT 1', [vSku]);
            if (existingProdSku.length > 0) {
              throw new Error(`Variant SKU '${v.sku}' is already in use by another product.`);
            }
            const [existingVarSku] = await conn.query('SELECT id FROM aura_product_variants WHERE LOWER(sku) = ? LIMIT 1', [vSku]);
            if (existingVarSku.length > 0) {
              throw new Error(`Variant SKU '${v.sku}' is already in use by another variant.`);
            }
          }
        }
      }

      // Calculate total initial stock: if variants exist, sum variants; else use initial_quantity
      let totalStock = parseFloat(initial_quantity) || 0;
      if (Array.isArray(variants) && variants.length > 0) {
        totalStock = variants.reduce((acc, v) => acc + (parseFloat(v.quantity) || 0), 0);
      }

      const safePrice = Math.max(0, parseFloat(price) || 0);
      const safeCost = Math.max(0, parseFloat(cost) || 0);
      const safeSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

      const safeBarcode = (barcode || safeCode).trim();
      const safeSku = (sku || safeCode).trim();
      const safeBrand = brand_id || brand || null;

      // 1. Insert parent product
      const [result] = await conn.query(`
        INSERT INTO aura_products (
          code, barcode, sku, name, second_name, type, category_id, subcategory_id,
          unit, purchase_unit, sale_unit, currency, price, sale_price, cost,
          biller_id, project_id, image, slug, barcode_symbology, barcode_type,
          brand, brand_id, tax_rate, tax_method, alert_quantity, details, product_details,
          weight, p_length, p_width, p_height, cf1, cf2, cf3, cf4, cf5, cf6,
          supplier1, supplier1price, supplier1_part_no,
          supplier2, supplier2price, supplier2_part_no,
          supplier3, supplier3price, supplier3_part_no,
          promotion, promo_price, start_date, end_date,
          quantity, status
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?,
          ?, 1
        )
      `, [
        safeCode,
        safeBarcode,
        safeSku,
        name.trim(),
        second_name ? second_name.trim() : null,
        type,
        parseInt(category_id) || 1,
        subcategory_id ? parseInt(subcategory_id) : null,
        unit,
        purchase_unit,
        sale_unit,
        currency,
        safePrice,
        sale_price ? parseFloat(sale_price) : (promo_price ? parseFloat(promo_price) : null),
        safeCost,
        parseInt(biller_id) || 1,
        project_id ? parseInt(project_id) : null,
        image || '',
        safeSlug,
        barcode_symbology || 'Code128',
        barcode_type || 'CODE128',
        safeBrand,
        safeBrand,
        tax_rate || null,
        tax_method || 'exclusive',
        parseFloat(alert_quantity) || 10,
        details || '',
        product_details || details || '',
        weight ? parseFloat(weight) : null,
        p_length ? parseFloat(p_length) : null,
        p_width ? parseFloat(p_width) : null,
        p_height ? parseFloat(p_height) : null,
        cf1 || null,
        cf2 || null,
        cf3 || null,
        cf4 || null,
        cf5 || null,
        cf6 || null,
        supplier1 ? parseInt(supplier1) : null,
        supplier1price ? parseFloat(supplier1price) : null,
        supplier1_part_no || null,
        supplier2 ? parseInt(supplier2) : null,
        supplier2price ? parseFloat(supplier2price) : null,
        supplier2_part_no || null,
        supplier3 ? parseInt(supplier3) : null,
        supplier3price ? parseFloat(supplier3price) : null,
        supplier3_part_no || null,
        promotion ? 1 : 0,
        promo_price ? parseFloat(promo_price) : null,
        start_date || null,
        end_date || null,
        totalStock
      ]);

      const newProductId = result.insertId;

      // 2. Insert warehouse stock balance
      if (Array.isArray(warehouse_allocations) && warehouse_allocations.length > 0) {
        for (const alloc of warehouse_allocations) {
          const wId = alloc.warehouse_id || alloc.id;
          const wQty = parseFloat(alloc.quantity) || 0;
          if (wId) {
            await conn.query(`
              INSERT INTO aura_warehouses_products (product_id, warehouse_id, quantity, avg_cost, qty_alert)
              VALUES (?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), avg_cost = VALUES(avg_cost)
            `, [newProductId, wId, wQty, safeCost, alert_quantity]);
          }
        }
      } else {
        await conn.query(`
          INSERT INTO aura_warehouses_products (product_id, warehouse_id, quantity, avg_cost, qty_alert)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), avg_cost = VALUES(avg_cost)
        `, [newProductId, warehouse_id || 1, totalStock, safeCost, alert_quantity]);
      }

      // 3. Process variants if provided
      if (Array.isArray(variants) && variants.length > 0) {
        for (const v of variants) {
          const vName = v.name.trim();
          const vSku = (v.sku || `${safeCode}-${vName.replace(/[^a-zA-Z0-9]+/g, '-').toUpperCase()}`).trim();
          const vBarcode = (v.barcode || vSku).trim();
          const vPrice = v.price !== undefined ? Math.max(0, parseFloat(v.price)) : safePrice;
          const vCost = v.cost !== undefined ? Math.max(0, parseFloat(v.cost)) : safeCost;
          const vQty = Math.max(0, parseFloat(v.quantity) || 0);
          const vAttrs = v.attributes ? (typeof v.attributes === 'object' ? JSON.stringify(v.attributes) : v.attributes) : null;
          const vStatus = v.status === 0 || v.status === 'inactive' ? 0 : 1;
          const vWarehouseId = v.warehouse_id || warehouse_id || 1;

          const [varResult] = await conn.query(`
            INSERT INTO aura_product_variants (
              product_id, name, sku, barcode, image, attributes, cost, price, quantity, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            newProductId,
            vName,
            vSku,
            vBarcode,
            v.image || null,
            vAttrs,
            vCost,
            vPrice,
            vQty,
            vStatus
          ]);

          const variantId = varResult.insertId;

          // Insert into aura_warehouses_products_variants
          await conn.query(`
            INSERT INTO aura_warehouses_products_variants (
              option_id, product_id, warehouse_id, quantity
            ) VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)
          `, [variantId, newProductId, vWarehouseId, vQty]);

          // Link normalized attributes in aura_product_variant_values if attributes object is provided
          if (v.attributes && typeof v.attributes === 'object') {
            for (const [attrName, attrVal] of Object.entries(v.attributes)) {
              if (attrName && attrVal) {
                // Find or insert attribute
                const attrCode = attrName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
                let attrId;
                const [attrRows] = await conn.query('SELECT id FROM aura_attributes WHERE code = ? LIMIT 1', [attrCode]);
                if (attrRows.length > 0) {
                  attrId = attrRows[0].id;
                } else {
                  const [newAttr] = await conn.query('INSERT INTO aura_attributes (name, code) VALUES (?, ?)', [attrName, attrCode]);
                  attrId = newAttr.insertId;
                }

                // Find or insert attribute value
                let valId;
                const [valRows] = await conn.query('SELECT id FROM aura_attribute_values WHERE attribute_id = ? AND value = ? LIMIT 1', [attrId, String(attrVal)]);
                if (valRows.length > 0) {
                  valId = valRows[0].id;
                } else {
                  const [newVal] = await conn.query('INSERT INTO aura_attribute_values (attribute_id, value) VALUES (?, ?)', [attrId, String(attrVal)]);
                  valId = newVal.insertId;
                }

                await conn.query(`
                  INSERT INTO aura_product_variant_values (product_id, variant_id, attribute_id, attribute_value_id)
                  VALUES (?, ?, ?, ?)
                  ON DUPLICATE KEY UPDATE attribute_value_id = VALUES(attribute_value_id)
                `, [newProductId, variantId, attrId, valId]);
              }
            }
          }

          // Record initial stock movement for variant
          if (vQty > 0) {
            await conn.query(`
              INSERT INTO aura_stock_movement (
                date, reference_no, transaction, transaction_id, warehouse_id, product_id,
                product_type, product_code, product_name, real_unit_cost, quantity, unit_quantity, option_id, actual_date
              ) VALUES (
                NOW(), ?, 'initial_stock', ?, ?, ?,
                'standard', ?, ?, ?, ?, 1, ?, NOW()
              )
            `, [
              `INIT-${newProductId}-${variantId}`,
              newProductId,
              vWarehouseId,
              newProductId,
              vSku,
              `${name} (${vName})`,
              vCost,
              vQty,
              variantId
            ]);
          }
        }
      } else if (totalStock > 0) {
        // Record initial stock movement for non-variant parent product
        await conn.query(`
          INSERT INTO aura_stock_movement (
            date, reference_no, transaction, transaction_id, warehouse_id, product_id,
            product_type, product_code, product_name, real_unit_cost, quantity, unit_quantity, actual_date
          ) VALUES (
            NOW(), ?, 'initial_stock', ?, ?, ?,
            'standard', ?, ?, ?, ?, 1, NOW()
          )
        `, [
          `INIT-${newProductId}`,
          newProductId,
          warehouse_id || 1,
          newProductId,
          safeCode,
          name,
          safeCost,
          totalStock
        ]);
      }

      // 4. Save Gallery photos
      if (Array.isArray(gallery) && gallery.length > 0) {
        for (const photoUrl of gallery) {
          if (photoUrl && String(photoUrl).trim()) {
            await conn.query('INSERT INTO aura_product_photos (product_id, photo) VALUES (?, ?)', [newProductId, String(photoUrl).trim()]);
          }
        }
      }

      await conn.commit();
      return this.getProductById(newProductId);
    } catch (err) {
      await conn.rollback();
      logError('InventoryModel.createProduct', err, null);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Update product and its variants with transaction safety
   */
  static async updateProduct(id, productData) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const {
        name,
        code,
        price,
        cost,
        quantity,
        alert_quantity,
        category_id,
        biller_id,
        project_id,
        unit,
        purchase_unit,
        sale_unit,
        currency,
        image,
        barcode_symbology,
        brand,
        tax_rate,
        tax_method,
        details,
        product_details,
        status,
        featured,
        variants = null,
        warehouse_id = 1
      } = productData;

      // Check product existence
      const [existing] = await conn.query('SELECT * FROM aura_products WHERE id = ? LIMIT 1', [id]);
      if (!existing || existing.length === 0) {
        throw new Error(`Product #${id} not found.`);
      }

      // If code changed, check uniqueness
      if (code && code.trim() !== '' && code.trim() !== existing[0].code) {
        const [codeCheck] = await conn.query('SELECT id FROM aura_products WHERE code = ? AND id != ? LIMIT 1', [code.trim(), id]);
        if (codeCheck.length > 0) {
          throw new Error(`SKU/Code '${code}' is already used by another product.`);
        }
      }

      const fields = [];
      const values = [];

      if (name !== undefined) {
        fields.push('name = ?');
        values.push(name.trim());
        fields.push('slug = ?');
        values.push(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
      }
      if (code !== undefined) {
        fields.push('code = ?');
        values.push(code.trim());
      }
      if (price !== undefined) {
        fields.push('price = ?');
        values.push(Math.max(0, parseFloat(price) || 0));
      }
      if (cost !== undefined) {
        fields.push('cost = ?');
        values.push(Math.max(0, parseFloat(cost) || 0));
      }
      if (alert_quantity !== undefined) {
        fields.push('alert_quantity = ?');
        values.push(Math.max(0, parseFloat(alert_quantity) || 10));
      }
      if (category_id !== undefined) {
        fields.push('category_id = ?');
        values.push(parseInt(category_id) || 1);
      }
      if (biller_id !== undefined) {
        fields.push('biller_id = ?');
        values.push(parseInt(biller_id) || 1);
      }
      if (project_id !== undefined) {
        fields.push('project_id = ?');
        values.push(project_id ? parseInt(project_id) : null);
      }
      if (unit !== undefined) {
        fields.push('unit = ?');
        values.push(unit);
      }
      if (purchase_unit !== undefined) {
        fields.push('purchase_unit = ?');
        values.push(purchase_unit);
      }
      if (sale_unit !== undefined) {
        fields.push('sale_unit = ?');
        values.push(sale_unit);
      }
      if (currency !== undefined) {
        fields.push('currency = ?');
        values.push(currency);
      }
      if (image !== undefined && image !== '') {
        fields.push('image = ?');
        values.push(image);
      }
      if (barcode_symbology !== undefined) {
        fields.push('barcode_symbology = ?');
        values.push(barcode_symbology);
      }
      if (productData.second_name !== undefined) {
        fields.push('second_name = ?');
        values.push(productData.second_name || null);
      }
      if (productData.barcode !== undefined) {
        fields.push('barcode = ?');
        values.push(productData.barcode || null);
      }
      if (productData.sku !== undefined) {
        fields.push('sku = ?');
        values.push(productData.sku || null);
      }
      if (productData.barcode_type !== undefined) {
        fields.push('barcode_type = ?');
        values.push(productData.barcode_type);
      }
      if (productData.brand_id !== undefined || brand !== undefined) {
        const bVal = productData.brand_id || brand || null;
        fields.push('brand = ?', 'brand_id = ?');
        values.push(bVal, bVal);
      }
      if (productData.subcategory_id !== undefined) {
        fields.push('subcategory_id = ?');
        values.push(productData.subcategory_id ? parseInt(productData.subcategory_id) : null);
      }
      if (productData.weight !== undefined) {
        fields.push('weight = ?');
        values.push(productData.weight ? parseFloat(productData.weight) : null);
      }
      if (productData.p_length !== undefined) {
        fields.push('p_length = ?');
        values.push(productData.p_length ? parseFloat(productData.p_length) : null);
      }
      if (productData.p_width !== undefined) {
        fields.push('p_width = ?');
        values.push(productData.p_width ? parseFloat(productData.p_width) : null);
      }
      if (productData.p_height !== undefined) {
        fields.push('p_height = ?');
        values.push(productData.p_height ? parseFloat(productData.p_height) : null);
      }
      if (productData.cf1 !== undefined) { fields.push('cf1 = ?'); values.push(productData.cf1 || null); }
      if (productData.cf2 !== undefined) { fields.push('cf2 = ?'); values.push(productData.cf2 || null); }
      if (productData.cf3 !== undefined) { fields.push('cf3 = ?'); values.push(productData.cf3 || null); }
      if (productData.cf4 !== undefined) { fields.push('cf4 = ?'); values.push(productData.cf4 || null); }
      if (productData.cf5 !== undefined) { fields.push('cf5 = ?'); values.push(productData.cf5 || null); }
      if (productData.cf6 !== undefined) { fields.push('cf6 = ?'); values.push(productData.cf6 || null); }
      if (productData.supplier1 !== undefined) { fields.push('supplier1 = ?'); values.push(productData.supplier1 ? parseInt(productData.supplier1) : null); }
      if (productData.supplier1price !== undefined) { fields.push('supplier1price = ?'); values.push(productData.supplier1price ? parseFloat(productData.supplier1price) : null); }
      if (productData.supplier1_part_no !== undefined) { fields.push('supplier1_part_no = ?'); values.push(productData.supplier1_part_no || null); }
      if (productData.supplier2 !== undefined) { fields.push('supplier2 = ?'); values.push(productData.supplier2 ? parseInt(productData.supplier2) : null); }
      if (productData.supplier2price !== undefined) { fields.push('supplier2price = ?'); values.push(productData.supplier2price ? parseFloat(productData.supplier2price) : null); }
      if (productData.supplier2_part_no !== undefined) { fields.push('supplier2_part_no = ?'); values.push(productData.supplier2_part_no || null); }
      if (productData.supplier3 !== undefined) { fields.push('supplier3 = ?'); values.push(productData.supplier3 ? parseInt(productData.supplier3) : null); }
      if (productData.supplier3price !== undefined) { fields.push('supplier3price = ?'); values.push(productData.supplier3price ? parseFloat(productData.supplier3price) : null); }
      if (productData.supplier3_part_no !== undefined) { fields.push('supplier3_part_no = ?'); values.push(productData.supplier3_part_no || null); }
      if (productData.promotion !== undefined) { fields.push('promotion = ?'); values.push(productData.promotion ? 1 : 0); }
      if (productData.promo_price !== undefined) { fields.push('promo_price = ?'); values.push(productData.promo_price ? parseFloat(productData.promo_price) : null); }
      if (productData.sale_price !== undefined) { fields.push('sale_price = ?'); values.push(productData.sale_price ? parseFloat(productData.sale_price) : null); }
      if (productData.start_date !== undefined) { fields.push('start_date = ?'); values.push(productData.start_date || null); }
      if (productData.end_date !== undefined) { fields.push('end_date = ?'); values.push(productData.end_date || null); }
      if (tax_rate !== undefined) {
        fields.push('tax_rate = ?');
        values.push(tax_rate);
      }
      if (tax_method !== undefined) {
        fields.push('tax_method = ?');
        values.push(tax_method);
      }
      if (details !== undefined) {
        fields.push('details = ?');
        values.push(details);
      }
      if (product_details !== undefined) {
        fields.push('product_details = ?');
        values.push(product_details);
      }
      if (status !== undefined) {
        fields.push('status = ?');
        values.push(status === 'active' || status === 1 || status === true ? 1 : 0);
      }
      if (featured !== undefined) {
        fields.push('featured = ?');
        values.push(featured ? 1 : 0);
      }

      // Update parent fields if changed
      if (fields.length > 0) {
        values.push(id);
        await conn.query(`UPDATE aura_products SET ${fields.join(', ')} WHERE id = ?`, values);
      }

      // If variants are supplied, sync variants
      if (Array.isArray(variants)) {
        const seenCombinations = new Set();
        const incomingVariantIds = [];

        for (const v of variants) {
          const vName = (v.name || '').trim();
          if (!vName) continue;

          const vKey = vName.toLowerCase();
          if (seenCombinations.has(vKey)) {
            throw new Error(`Duplicate variant combination '${v.name}' detected.`);
          }
          seenCombinations.add(vKey);

          const vPrice = v.price !== undefined ? Math.max(0, parseFloat(v.price)) : parseFloat(price) || existing[0].price;
          const vCost = v.cost !== undefined ? Math.max(0, parseFloat(v.cost)) : parseFloat(cost) || existing[0].cost;
          const vQty = Math.max(0, parseFloat(v.quantity) || 0);
          const vSku = (v.sku || `${existing[0].code}-${vName.replace(/[^a-zA-Z0-9]+/g, '-').toUpperCase()}`).trim();
          const vBarcode = (v.barcode || vSku).trim();
          const vAttrs = v.attributes ? (typeof v.attributes === 'object' ? JSON.stringify(v.attributes) : v.attributes) : null;
          const vStatus = v.status === 0 || v.status === 'inactive' ? 0 : 1;
          const vWhId = v.warehouse_id || warehouse_id || 1;

          if (v.id) {
            // Update existing variant
            incomingVariantIds.push(v.id);
            await conn.query(`
              UPDATE aura_product_variants
              SET name = ?, sku = ?, barcode = ?, image = COALESCE(?, image),
                  attributes = COALESCE(?, attributes), cost = ?, price = ?, quantity = ?, status = ?
              WHERE id = ? AND product_id = ?
            `, [vName, vSku, vBarcode, v.image || null, vAttrs, vCost, vPrice, vQty, vStatus, v.id, id]);

            // Update warehouse stock for variant
            await conn.query(`
              INSERT INTO aura_warehouses_products_variants (option_id, product_id, warehouse_id, quantity)
              VALUES (?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)
            `, [v.id, id, vWhId, vQty]);
          } else {
            // Insert new variant
            const [newV] = await conn.query(`
              INSERT INTO aura_product_variants (
                product_id, name, sku, barcode, image, attributes, cost, price, quantity, status
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [id, vName, vSku, vBarcode, v.image || null, vAttrs, vCost, vPrice, vQty, vStatus]);

            const newVarId = newV.insertId;
            incomingVariantIds.push(newVarId);

            await conn.query(`
              INSERT INTO aura_warehouses_products_variants (option_id, product_id, warehouse_id, quantity)
              VALUES (?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)
            `, [newVarId, id, vWhId, vQty]);
          }
        }

        // Handle variants that were omitted (safe deletion or deactivation)
        const [existingVariants] = await conn.query('SELECT id FROM aura_product_variants WHERE product_id = ?', [id]);
        for (const ev of existingVariants) {
          if (!incomingVariantIds.includes(ev.id)) {
            // Check if variant is referenced in transactions
            const [txs] = await conn.query(`
              SELECT 1 FROM aura_stock_movement WHERE option_id = ? LIMIT 1
              UNION
              SELECT 1 FROM aura_transfer_items WHERE option_id = ? LIMIT 1
              UNION
              SELECT 1 FROM aura_adjustment_items WHERE option_id = ? LIMIT 1
            `, [ev.id, ev.id, ev.id]);

            if (txs.length > 0) {
              // Archive variant instead of deleting
              await conn.query('UPDATE aura_product_variants SET status = 0 WHERE id = ?', [ev.id]);
            } else {
              await conn.query('DELETE FROM aura_product_variant_values WHERE variant_id = ?', [ev.id]);
              await conn.query('DELETE FROM aura_warehouses_products_variants WHERE option_id = ?', [ev.id]);
              await conn.query('DELETE FROM aura_product_variants WHERE id = ?', [ev.id]);
            }
          }
        }

        // Recalculate parent stock from variant sum
        const [sumRow] = await conn.query(`
          SELECT COALESCE(SUM(quantity), 0) AS total_var_stock
          FROM aura_product_variants
          WHERE product_id = ? AND (status = 1 OR status IS NULL)
        `, [id]);

        const newTotalStock = parseFloat(sumRow[0]?.total_var_stock) || 0;
        await conn.query('UPDATE aura_products SET quantity = ? WHERE id = ?', [newTotalStock, id]);
        await conn.query(`
          INSERT INTO aura_warehouses_products (product_id, warehouse_id, quantity, avg_cost)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)
        `, [id, warehouse_id || 1, newTotalStock, parseFloat(cost) || existing[0].cost]);
      } else if (quantity !== undefined) {
        // Direct quantity update for non-variant product
        const qVal = Math.max(0, parseFloat(quantity) || 0);
        await conn.query('UPDATE aura_products SET quantity = ? WHERE id = ?', [qVal, id]);
        await conn.query(`
          INSERT INTO aura_warehouses_products (product_id, warehouse_id, quantity, avg_cost)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)
        `, [id, warehouse_id || 1, qVal, parseFloat(cost) || existing[0].cost]);
      }

      await conn.commit();
      return this.getProductById(id);
    } catch (err) {
      await conn.rollback();
      logError('InventoryModel.updateProduct', err, null);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Safe Delete / Archive Product
   * Checks if referenced in sales, purchases, adjustments, transfers, or stock movements
   */
  static async deleteProduct(id) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [pRows] = await conn.query('SELECT id, name, code FROM aura_products WHERE id = ? LIMIT 1', [id]);
      if (!pRows || pRows.length === 0) {
        throw new Error('Product not found.');
      }
      const prod = pRows[0];

      // Check transaction references
      const [sales] = await conn.query('SELECT id FROM aura_sale_items WHERE product_id = ? LIMIT 1', [id]).catch(() => [[]]);
      const [purchases] = await conn.query('SELECT id FROM aura_purchase_items WHERE product_id = ? LIMIT 1', [id]).catch(() => [[]]);
      const [adjustments] = await conn.query('SELECT id FROM aura_adjustment_items WHERE product_id = ? LIMIT 1', [id]).catch(() => [[]]);
      const [transfers] = await conn.query('SELECT id FROM aura_transfer_items WHERE product_id = ? LIMIT 1', [id]).catch(() => [[]]);
      const [movements] = await conn.query('SELECT id FROM aura_stock_movement WHERE product_id = ? LIMIT 1', [id]).catch(() => [[]]);

      const hasTransactions = (sales.length > 0) || (purchases.length > 0) || (adjustments.length > 0) || (transfers.length > 0) || (movements.length > 0);

      if (hasTransactions) {
        // Safe archival (mark inactive)
        await conn.query('UPDATE aura_products SET status = 0 WHERE id = ?', [id]);
        await conn.query('UPDATE aura_product_variants SET status = 0 WHERE product_id = ?', [id]);
        await conn.commit();
        return {
          deleted: false,
          archived: true,
          message: `Product '${prod.name}' (#${id}) is linked to historical transactions and has been safely archived (marked inactive) instead of deleted.`
        };
      }

      // Hard delete if completely unreferenced
      await conn.query('DELETE FROM aura_product_variant_values WHERE product_id = ?', [id]);
      await conn.query('DELETE FROM aura_warehouses_products_variants WHERE product_id = ?', [id]);
      await conn.query('DELETE FROM aura_product_variants WHERE product_id = ?', [id]);
      await conn.query('DELETE FROM aura_warehouses_products WHERE product_id = ?', [id]);
      await conn.query('DELETE FROM aura_product_photos WHERE product_id = ?', [id]);
      await conn.query('DELETE FROM aura_products WHERE id = ?', [id]);

      await conn.commit();
      return {
        deleted: true,
        archived: false,
        message: `Product '${prod.name}' (#${id}) and its variants were deleted successfully.`
      };
    } catch (err) {
      await conn.rollback();
      logError('InventoryModel.deleteProduct', err, null);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Receive stock into a warehouse (Product or specific Variant)
   */
  static async receiveStock({
    product_id,
    option_id = null,
    warehouse_id = 1,
    quantity,
    unit_cost = 0,
    reference_no = null,
    note = '',
    user_id = null
  }) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const qty = parseFloat(quantity);
      if (!qty || qty <= 0) throw new Error('Quantity must be greater than 0.');

      const [pRows] = await conn.query('SELECT id, name, code, cost FROM aura_products WHERE id = ? LIMIT 1', [product_id]);
      if (!pRows.length) throw new Error('Product not found.');
      const prod = pRows[0];
      const cost = parseFloat(unit_cost) || parseFloat(prod.cost) || 0;
      const refNo = reference_no || `REC-${Date.now().toString().slice(-6)}`;

      let variantName = '';
      let variantSku = prod.code;

      if (option_id) {
        const [vRows] = await conn.query('SELECT id, name, sku FROM aura_product_variants WHERE id = ? AND product_id = ? LIMIT 1', [option_id, product_id]);
        if (!vRows.length) throw new Error('Variant not found.');
        variantName = vRows[0].name;
        variantSku = vRows[0].sku || `${prod.code}-${variantName}`;

        // Increment variant warehouse stock
        await conn.query(`
          INSERT INTO aura_warehouses_products_variants (option_id, product_id, warehouse_id, quantity)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
        `, [option_id, product_id, warehouse_id, qty]);

        // Increment variant overall quantity
        await conn.query('UPDATE aura_product_variants SET quantity = quantity + ? WHERE id = ?', [qty, option_id]);
      }

      // Increment parent warehouse stock
      await conn.query(`
        INSERT INTO aura_warehouses_products (product_id, warehouse_id, quantity, avg_cost)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity), avg_cost = VALUES(avg_cost)
      `, [product_id, warehouse_id, qty, cost]);

      // Increment parent total product stock
      await conn.query('UPDATE aura_products SET quantity = quantity + ? WHERE id = ?', [qty, product_id]);

      // Record stock movement
      await conn.query(`
        INSERT INTO aura_stock_movement (
          date, reference_no, transaction, transaction_id, warehouse_id, product_id,
          product_type, product_code, product_name, real_unit_cost, quantity, unit_quantity,
          option_id, user_id, actual_date
        ) VALUES (
          NOW(), ?, 'stock_received', 0, ?, ?,
          'standard', ?, ?, ?, ?, 1,
          ?, ?, NOW()
        )
      `, [
        refNo,
        warehouse_id,
        product_id,
        variantSku,
        variantName ? `${prod.name} (${variantName})` : prod.name,
        cost,
        qty,
        option_id || null,
        user_id || null
      ]);

      await conn.commit();
      return { success: true, reference_no: refNo, received_quantity: qty };
    } catch (err) {
      await conn.rollback();
      logError('InventoryModel.receiveStock', err, null);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Issue / use stock out of warehouse (Prevents negative stock)
   */
  static async issueStock({
    product_id,
    option_id = null,
    warehouse_id = 1,
    quantity,
    reason = 'store_consumption',
    reference_no = null,
    user_id = null
  }) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const qty = parseFloat(quantity);
      if (!qty || qty <= 0) throw new Error('Quantity must be greater than 0.');

      const [pRows] = await conn.query('SELECT id, name, code, cost, quantity FROM aura_products WHERE id = ? LIMIT 1', [product_id]);
      if (!pRows.length) throw new Error('Product not found.');
      const prod = pRows[0];
      const refNo = reference_no || `ISS-${Date.now().toString().slice(-6)}`;

      let variantName = '';
      let variantSku = prod.code;

      if (option_id) {
        const [vRows] = await conn.query('SELECT id, name, sku, quantity FROM aura_product_variants WHERE id = ? AND product_id = ? LIMIT 1', [option_id, product_id]);
        if (!vRows.length) throw new Error('Variant not found.');
        variantName = vRows[0].name;
        variantSku = vRows[0].sku || `${prod.code}-${variantName}`;

        // Check variant warehouse stock
        const [whv] = await conn.query('SELECT quantity FROM aura_warehouses_products_variants WHERE option_id = ? AND warehouse_id = ? LIMIT 1', [option_id, warehouse_id]);
        const availableWhv = parseFloat(whv[0]?.quantity) || 0;
        if (availableWhv < qty) {
          throw new Error(`Insufficient variant stock in warehouse (${availableWhv} available, ${qty} requested). Negative stock prevented.`);
        }

        // Decrement variant stock
        await conn.query('UPDATE aura_warehouses_products_variants SET quantity = quantity - ? WHERE option_id = ? AND warehouse_id = ?', [qty, option_id, warehouse_id]);
        await conn.query('UPDATE aura_product_variants SET quantity = quantity - ? WHERE id = ?', [qty, option_id]);
      } else {
        // Check parent warehouse stock
        const [whp] = await conn.query('SELECT quantity FROM aura_warehouses_products WHERE product_id = ? AND warehouse_id = ? LIMIT 1', [product_id, warehouse_id]);
        const availableWhp = parseFloat(whp[0]?.quantity) || 0;
        if (availableWhp < qty) {
          throw new Error(`Insufficient product stock in warehouse (${availableWhp} available, ${qty} requested). Negative stock prevented.`);
        }
      }

      // Decrement parent warehouse stock and total stock
      await conn.query('UPDATE aura_warehouses_products SET quantity = GREATEST(0, quantity - ?) WHERE product_id = ? AND warehouse_id = ?', [qty, product_id, warehouse_id]);
      await conn.query('UPDATE aura_products SET quantity = GREATEST(0, quantity - ?) WHERE id = ?', [qty, product_id]);

      // Record movement
      await conn.query(`
        INSERT INTO aura_stock_movement (
          date, reference_no, transaction, transaction_id, warehouse_id, product_id,
          product_type, product_code, product_name, real_unit_cost, quantity, unit_quantity,
          option_id, user_id, actual_date
        ) VALUES (
          NOW(), ?, 'stock_issued', 0, ?, ?,
          'standard', ?, ?, ?, ?, 1,
          ?, ?, NOW()
        )
      `, [
        refNo,
        warehouse_id,
        product_id,
        variantSku,
        variantName ? `${prod.name} (${variantName})` : prod.name,
        parseFloat(prod.cost) || 0,
        -qty,
        option_id || null,
        user_id || null
      ]);

      await conn.commit();
      return { success: true, reference_no: refNo, issued_quantity: qty };
    } catch (err) {
      await conn.rollback();
      logError('InventoryModel.issueStock', err, null);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Adjust inventory with audit history and reason
   */
  static async adjustStock({
    product_id,
    option_id = null,
    warehouse_id = 1,
    type = 'addition', // 'addition' | 'subtraction'
    quantity,
    reason = 'Inventory audit count',
    reference_no = null,
    user_id = null
  }) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const qty = parseFloat(quantity);
      if (!qty || qty <= 0) throw new Error('Adjustment quantity must be greater than 0.');

      const isSub = (type === 'subtraction');
      const delta = isSub ? -qty : qty;
      const refNo = reference_no || `ADJ-${Date.now().toString().slice(-6)}`;

      const [pRows] = await conn.query('SELECT id, name, code, cost, quantity FROM aura_products WHERE id = ? LIMIT 1', [product_id]);
      if (!pRows.length) throw new Error('Product not found.');
      const prod = pRows[0];

      let variantName = '';
      let variantSku = prod.code;

      if (option_id) {
        const [vRows] = await conn.query('SELECT id, name, sku, quantity FROM aura_product_variants WHERE id = ? AND product_id = ? LIMIT 1', [option_id, product_id]);
        if (!vRows.length) throw new Error('Variant not found.');
        variantName = vRows[0].name;
        variantSku = vRows[0].sku || `${prod.code}-${variantName}`;

        if (isSub) {
          const [whv] = await conn.query('SELECT quantity FROM aura_warehouses_products_variants WHERE option_id = ? AND warehouse_id = ? LIMIT 1', [option_id, warehouse_id]);
          const currentVarQty = parseFloat(whv[0]?.quantity) || 0;
          if (currentVarQty < qty) {
            throw new Error(`Cannot subtract ${qty}. Only ${currentVarQty} units available in this warehouse.`);
          }
        }

        // Update variant warehouse stock
        await conn.query(`
          INSERT INTO aura_warehouses_products_variants (option_id, product_id, warehouse_id, quantity)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE quantity = GREATEST(0, quantity + VALUES(quantity))
        `, [option_id, product_id, warehouse_id, delta]);

        await conn.query('UPDATE aura_product_variants SET quantity = GREATEST(0, quantity + ?) WHERE id = ?', [delta, option_id]);
      } else if (isSub) {
        const [whp] = await conn.query('SELECT quantity FROM aura_warehouses_products WHERE product_id = ? AND warehouse_id = ? LIMIT 1', [product_id, warehouse_id]);
        const currentProdQty = parseFloat(whp[0]?.quantity) || 0;
        if (currentProdQty < qty) {
          throw new Error(`Cannot subtract ${qty}. Only ${currentProdQty} units available in this warehouse.`);
        }
      }

      // Update parent warehouse stock and total stock
      await conn.query(`
        INSERT INTO aura_warehouses_products (product_id, warehouse_id, quantity, avg_cost)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE quantity = GREATEST(0, quantity + VALUES(quantity))
      `, [product_id, warehouse_id, delta, parseFloat(prod.cost) || 0]);

      await conn.query('UPDATE aura_products SET quantity = GREATEST(0, quantity + ?) WHERE id = ?', [delta, product_id]);

      // Insert adjustment record
      const [adjRes] = await conn.query(`
        INSERT INTO aura_adjustments (date, reference_no, warehouse_id, note, created_by)
        VALUES (NOW(), ?, ?, ?, ?)
      `, [refNo, warehouse_id, reason, user_id || 1]);
      const adjustmentId = adjRes.insertId;

      await conn.query(`
        INSERT INTO aura_adjustment_items (adjustment_id, product_id, option_id, quantity, warehouse_id, type)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [adjustmentId, product_id, option_id || 0, qty, warehouse_id, type]);

      // Record stock movement
      await conn.query(`
        INSERT INTO aura_stock_movement (
          date, reference_no, transaction, transaction_id, warehouse_id, product_id,
          product_type, product_code, product_name, real_unit_cost, quantity, unit_quantity,
          option_id, user_id, actual_date
        ) VALUES (
          NOW(), ?, ?, ?, ?, ?,
          'standard', ?, ?, ?, ?, 1,
          ?, ?, NOW()
        )
      `, [
        refNo,
        isSub ? 'adjustment_sub' : 'adjustment_add',
        adjustmentId,
        warehouse_id,
        product_id,
        variantSku,
        variantName ? `${prod.name} (${variantName})` : prod.name,
        parseFloat(prod.cost) || 0,
        delta,
        option_id || null,
        user_id || null
      ]);

      await conn.commit();
      return { success: true, reference_no: refNo, adjustment_id: adjustmentId, delta };
    } catch (err) {
      await conn.rollback();
      logError('InventoryModel.adjustStock', err, null);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Transfer stock between warehouses (with negative stock prevention and dual audit moves)
   */
  static async transferStock({
    from_warehouse_id,
    to_warehouse_id,
    items = [], // [{ product_id, option_id, quantity }]
    note = '',
    user_id = null
  }) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      if (from_warehouse_id === to_warehouse_id) {
        throw new Error('Source warehouse and destination warehouse must be different.');
      }
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('At least one item must be included in the transfer.');
      }

      const [fromWh] = await conn.query('SELECT name, code FROM aura_warehouses WHERE id = ? LIMIT 1', [from_warehouse_id]);
      const [toWh] = await conn.query('SELECT name, code FROM aura_warehouses WHERE id = ? LIMIT 1', [to_warehouse_id]);
      if (!fromWh.length || !toWh.length) throw new Error('Invalid warehouse selected.');

      const transferNo = `TR-${Date.now().toString().slice(-6)}`;

      // Insert master transfer
      const [trRes] = await conn.query(`
        INSERT INTO aura_transfers (
          transfer_no, date, from_warehouse_id, from_warehouse_code, from_warehouse_name,
          to_warehouse_id, to_warehouse_code, to_warehouse_name, note, created_by, status
        ) VALUES (
          ?, NOW(), ?, ?, ?,
          ?, ?, ?, ?, ?, 'completed'
        )
      `, [
        transferNo,
        from_warehouse_id,
        fromWh[0].code,
        fromWh[0].name,
        to_warehouse_id,
        toWh[0].code,
        toWh[0].name,
        note,
        user_id || 1
      ]);
      const transferId = trRes.insertId;

      for (const item of items) {
        const pId = item.product_id;
        const oId = item.option_id || null;
        const qty = parseFloat(item.quantity);
        if (!qty || qty <= 0) continue;

        const [pRows] = await conn.query('SELECT id, name, code, cost FROM aura_products WHERE id = ? LIMIT 1', [pId]);
        if (!pRows.length) throw new Error(`Product #${pId} not found.`);
        const prod = pRows[0];

        let variantName = '';
        let variantSku = prod.code;

        if (oId) {
          const [vRows] = await conn.query('SELECT id, name, sku FROM aura_product_variants WHERE id = ? AND product_id = ? LIMIT 1', [oId, pId]);
          if (!vRows.length) throw new Error(`Variant #${oId} not found.`);
          variantName = vRows[0].name;
          variantSku = vRows[0].sku || `${prod.code}-${variantName}`;

          // Check source warehouse variant stock
          const [whv] = await conn.query('SELECT quantity FROM aura_warehouses_products_variants WHERE option_id = ? AND warehouse_id = ? LIMIT 1', [oId, from_warehouse_id]);
          const availWhv = parseFloat(whv[0]?.quantity) || 0;
          if (availWhv < qty) {
            throw new Error(`Insufficient variant stock in ${fromWh[0].name} (${availWhv} available, ${qty} requested). Negative stock prevented.`);
          }

          // Decrement from source
          await conn.query('UPDATE aura_warehouses_products_variants SET quantity = quantity - ? WHERE option_id = ? AND warehouse_id = ?', [qty, oId, from_warehouse_id]);
          // Increment in destination
          await conn.query(`
            INSERT INTO aura_warehouses_products_variants (option_id, product_id, warehouse_id, quantity)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
          `, [oId, pId, to_warehouse_id, qty]);
        } else {
          // Check source warehouse parent stock
          const [whp] = await conn.query('SELECT quantity FROM aura_warehouses_products WHERE product_id = ? AND warehouse_id = ? LIMIT 1', [pId, from_warehouse_id]);
          const availWhp = parseFloat(whp[0]?.quantity) || 0;
          if (availWhp < qty) {
            throw new Error(`Insufficient stock for '${prod.name}' in ${fromWh[0].name} (${availWhp} available, ${qty} requested). Negative stock prevented.`);
          }
        }

        // Decrement source warehouse parent stock
        await conn.query('UPDATE aura_warehouses_products SET quantity = quantity - ? WHERE product_id = ? AND warehouse_id = ?', [qty, pId, from_warehouse_id]);

        // Increment destination warehouse parent stock
        await conn.query(`
          INSERT INTO aura_warehouses_products (product_id, warehouse_id, quantity, avg_cost)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
        `, [pId, to_warehouse_id, qty, parseFloat(prod.cost) || 0]);

        // Insert transfer item
        await conn.query(`
          INSERT INTO aura_transfer_items (
            transfer_id, product_id, product_code, product_name, option_id, quantity, unit_cost, date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
          transferId,
          pId,
          variantSku,
          variantName ? `${prod.name} (${variantName})` : prod.name,
          oId || 0,
          qty,
          parseFloat(prod.cost) || 0
        ]);

        // Record dual movement: transfer_out from source
        await conn.query(`
          INSERT INTO aura_stock_movement (
            date, reference_no, transaction, transaction_id, warehouse_id, product_id,
            product_type, product_code, product_name, real_unit_cost, quantity, unit_quantity,
            option_id, user_id, actual_date
          ) VALUES (
            NOW(), ?, 'transfer_out', ?, ?, ?,
            'standard', ?, ?, ?, ?, 1,
            ?, ?, NOW()
          )
        `, [
          transferNo,
          transferId,
          from_warehouse_id,
          pId,
          variantSku,
          variantName ? `${prod.name} (${variantName})` : prod.name,
          parseFloat(prod.cost) || 0,
          -qty,
          oId || null,
          user_id || null
        ]);

        // Record dual movement: transfer_in to destination
        await conn.query(`
          INSERT INTO aura_stock_movement (
            date, reference_no, transaction, transaction_id, warehouse_id, product_id,
            product_type, product_code, product_name, real_unit_cost, quantity, unit_quantity,
            option_id, user_id, actual_date
          ) VALUES (
            NOW(), ?, 'transfer_in', ?, ?, ?,
            'standard', ?, ?, ?, ?, 1,
            ?, ?, NOW()
          )
        `, [
          transferNo,
          transferId,
          to_warehouse_id,
          pId,
          variantSku,
          variantName ? `${prod.name} (${variantName})` : prod.name,
          parseFloat(prod.cost) || 0,
          qty,
          oId || null,
          user_id || null
        ]);
      }

      await conn.commit();
      return { success: true, transfer_id: transferId, transfer_no: transferNo, items_count: items.length };
    } catch (err) {
      await conn.rollback();
      logError('InventoryModel.transferStock', err, null);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Warehouse stock overview: grouped by warehouse, product, and variants
   */
  static async getWarehouseStockOverview(warehouse_id = null) {
    try {
      let whFilter = '';
      const params = [];
      if (warehouse_id && warehouse_id !== 'all') {
        whFilter = 'WHERE w.id = ?';
        params.push(parseInt(warehouse_id));
      }

      const [rows] = await db.query(`
        SELECT 
          wp.id AS wp_id,
          w.id AS warehouse_id,
          w.name AS warehouse_name,
          w.code AS warehouse_code,
          p.id AS product_id,
          p.name AS product_name,
          p.code AS product_code,
          p.alert_quantity,
          wp.quantity AS product_warehouse_quantity,
          COALESCE(wp.avg_cost, p.cost, 0) AS avg_cost,
          COALESCE(p.cost, 0) AS product_cost,
          wp.rack AS product_rack,
          pv.id AS variant_id,
          pv.id AS option_id,
          pv.name AS variant_name,
          pv.sku AS variant_sku,
          wpv.quantity AS variant_warehouse_quantity,
          CONCAT(w.id, '_', p.id, '_', COALESCE(pv.id, 0), '_', wp.id) AS unique_row_key
        FROM aura_warehouses w
        JOIN aura_warehouses_products wp ON wp.warehouse_id = w.id
        JOIN aura_products p ON p.id = wp.product_id
        LEFT JOIN aura_product_variants pv ON pv.product_id = p.id
        LEFT JOIN aura_warehouses_products_variants wpv ON wpv.option_id = pv.id AND wpv.warehouse_id = w.id
        ${whFilter}
        ORDER BY w.id ASC, p.name ASC, pv.name ASC
      `, params);

      return rows;
    } catch (err) {
      logError('InventoryModel.getWarehouseStockOverview', err, null);
      throw err;
    }
  }

  /**
   * Get Stock Movements Audit Trail
   */
  static async getStockMovements({
    product_id = null,
    warehouse_id = null,
    transaction = null,
    page = 1,
    limit = 50
  } = {}) {
    try {
      const offset = (Math.max(1, parseInt(page)) - 1) * Math.max(1, parseInt(limit));
      const params = [];
      const whereClauses = ['1=1'];

      if (product_id) {
        whereClauses.push('sm.product_id = ?');
        params.push(parseInt(product_id));
      }
      if (warehouse_id && warehouse_id !== 'all') {
        whereClauses.push('sm.warehouse_id = ?');
        params.push(parseInt(warehouse_id));
      }
      if (transaction && transaction !== 'all') {
        whereClauses.push('sm.transaction = ?');
        params.push(transaction);
      }

      const whereSql = whereClauses.join(' AND ');

      const [countRows] = await db.query(`SELECT COUNT(*) AS total FROM aura_stock_movement sm WHERE ${whereSql}`, params);
      const total = countRows[0]?.total || 0;

      const [rows] = await db.query(`
        SELECT sm.*,
               w.name AS warehouse_name,
               w.code AS warehouse_code,
               u.username AS created_by_username
        FROM aura_stock_movement sm
        LEFT JOIN aura_warehouses w ON w.id = sm.warehouse_id
        LEFT JOIN aura_users u ON u.id = sm.user_id
        WHERE ${whereSql}
        ORDER BY sm.id DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), parseInt(offset)]);

      return {
        movements: rows,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      };
    } catch (err) {
      logError('InventoryModel.getStockMovements', err, null);
      throw err;
    }
  }
  /**
   * Get complete product metadata (categories, units, brands, warehouses, suppliers, tax rates, attributes)
   */
  static async getProductMetadata() {
    try {
      const [categories] = await db.query('SELECT id, name, code, parent_id FROM aura_categories ORDER BY name ASC');
      const [units] = await db.query('SELECT id, code, name, base_unit, operator, operation_value FROM aura_units ORDER BY name ASC');
      const [brands] = await db.query('SELECT id, name, code FROM aura_brands ORDER BY name ASC');
      const [warehouses] = await db.query('SELECT id, code, name, address FROM aura_warehouses ORDER BY name ASC');
      const [suppliers] = await db.query("SELECT id, name, company, email, phone FROM aura_companies WHERE group_name = 'supplier' ORDER BY name ASC");
      const [taxRates] = await db.query('SELECT id, name, rate, type FROM aura_tax_rates ORDER BY id ASC');
      
      let attributes = [];
      try {
        const [attrs] = await db.query('SELECT id, name, code FROM aura_product_attributes ORDER BY sort_order ASC, name ASC');
        attributes = attrs || [];
        for (const attr of attributes) {
          const [vals] = await db.query('SELECT id, attribute_id, value, color_code FROM aura_product_attribute_values WHERE attribute_id = ? ORDER BY sort_order ASC', [attr.id]);
          attr.values = vals || [];
        }
      } catch (e) {
        console.warn('Attributes fetch note in metadata:', e.message);
      }

      let accounts = [];
      try {
        const [accs] = await db.query('SELECT id, account_code, account_name, type FROM aura_gl_accounts ORDER BY account_code ASC');
        accounts = accs || [];
      } catch (e) {
        // Fallback to aura_accounts
        try {
          const [accs2] = await db.query('SELECT accountcode AS account_code, accountname AS account_name FROM aura_accounts ORDER BY accountcode ASC');
          accounts = accs2.map((a, idx) => ({ id: idx + 1, ...a }));
        } catch (_) {}
      }

      return {
        categories: categories || [],
        units: units || [],
        brands: brands || [],
        warehouses: warehouses || [],
        suppliers: suppliers || [],
        tax_rates: taxRates || [],
        attributes,
        accounts,
        product_types: ['standard', 'combo', 'digital', 'service'],
        barcode_symbologies: ['Code128', 'EAN13', 'UPC', 'Code39', 'QR']
      };
    } catch (err) {
      logError('InventoryModel.getProductMetadata', err, null);
      throw err;
    }
  }
}

module.exports = InventoryModel;
