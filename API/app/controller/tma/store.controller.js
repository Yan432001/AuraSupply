const { db } = require('../../config/utill/helper');
const rawSimpleData = require('../../../../data/simpleData');
const simpleData = rawSimpleData.default || rawSimpleData;

const StoreController = {
  /**
   * Get all stores for the Store Selection screen:
   * Queries real aura_companies and counts aura_products
   */
  async getStores(req, res) {
    try {
      const [rows] = await db.query(`
        SELECT 
          c.id, c.code, c.name, c.company, c.slug, c.store_slug, c.address,
          c.phone, c.email, c.city, c.country, c.logo, c.banner, c.theme_color,
          c.currency_code, c.currency_symbol, c.tagline, c.rating, c.reviews_count,
          c.operating_hours,
          COUNT(DISTINCT p.id) AS productsCount
        FROM aura_companies c
        LEFT JOIN aura_products p ON p.biller_id = c.id AND p.status = 1
        WHERE c.group_name IN ('biller', 'supplier')
        GROUP BY c.id
        ORDER BY c.id ASC
      `);

      if (rows && rows.length > 0) {
        const stores = rows.map((s) => ({
          id: s.id,
          storeId: s.id,
          biller_id: s.id,
          slug: s.slug || s.store_slug || `store-${s.id}`,
          name: s.name,
          company: s.company || s.name,
          tagline: s.tagline || 'Artisan Store & Direct Supplier',
          summary: s.tagline || 'Artisan Store & Direct Supplier',
          address: s.address || 'Phnom Penh, Cambodia',
          city: s.city || 'Phnom Penh',
          phone: s.phone || '',
          email: s.email || '',
          logo: s.logo || null,
          banner: s.banner || null,
          theme_color: s.theme_color || '#2F6FED',
          currency_code: s.currency_code || 'USD',
          currency_symbol: s.currency_symbol || '$',
          rating: parseFloat(s.rating) || 4.90,
          reviews: parseInt(s.reviews_count) || 120,
          reviewsCount: parseInt(s.reviews_count) || 120,
          productsCount: parseInt(s.productsCount) || 0,
          categoriesCount: 4,
          is_active: 1,
          is_open: true
        }));
        return res.status(200).json({ status: true, data: stores, stores });
      }

      return res.status(200).json({ status: true, data: simpleData.stores, stores: simpleData.stores });
    } catch (err) {
      console.warn('DB getStores fallback:', err.message);
      return res.status(200).json({ status: true, data: simpleData.stores, stores: simpleData.stores });
    }
  },

  async getStore(req, res) {
    try {
      const { slug } = req.params;
      const isNumeric = /^\d+$/.test(slug);

      const [storeRows] = await db.query(`
        SELECT 
          c.id, c.code, c.name, c.company, c.slug, c.store_slug, c.address,
          c.phone, c.email, c.city, c.country, c.logo, c.banner, c.theme_color,
          c.currency_code, c.currency_symbol, c.tagline, c.rating, c.reviews_count,
          c.operating_hours
        FROM aura_companies c
        WHERE ${isNumeric ? 'c.id = ? OR c.slug = ? OR c.store_slug = ?' : 'c.slug = ? OR c.store_slug = ? OR c.id = ?'}
        LIMIT 1
      `, [slug, slug, slug]);

      if (storeRows.length > 0) {
        const s = storeRows[0];
        const store = {
          id: s.id,
          storeId: s.id,
          biller_id: s.id,
          slug: s.slug || s.store_slug || `store-${s.id}`,
          name: s.name,
          company: s.company || s.name,
          tagline: s.tagline || 'Artisan Store & Direct Supplier',
          summary: s.tagline || 'Artisan Store & Direct Supplier',
          address: s.address || 'Phnom Penh, Cambodia',
          city: s.city || 'Phnom Penh',
          phone: s.phone || '',
          email: s.email || '',
          logo: s.logo || null,
          logoUrl: s.logo || null,
          banner: s.banner || null,
          theme_color: s.theme_color || '#2F6FED',
          rating: parseFloat(s.rating) || 4.90,
          reviews: parseInt(s.reviews_count) || 120,
          operating_hours: s.operating_hours || '8:00 AM - 9:00 PM',
          is_active: 1,
          is_open: true
        };

        // Query real products for this store
        const [prodRows] = await db.query(`
          SELECT 
            p.id, p.code, p.name, p.slug, p.price, p.image, p.details, p.category_id,
            p.brand, p.moq, p.rating, p.reviews_count, p.featured,
            c.name AS category, c.code AS category_code
          FROM aura_products p
          LEFT JOIN aura_categories c ON p.category_id = c.id
          WHERE p.biller_id = ? AND p.status = 1
          ORDER BY p.id ASC
        `, [s.id]);

        const products = prodRows.map((p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          slug: p.slug,
          price: Number(p.price || 0),
          image: p.image?.startsWith('http') || p.image?.startsWith('/') ? p.image : (p.image ? `/assets/uploads/${p.image}` : null),
          details: p.details,
          description: p.details,
          category_id: p.category_id,
          category: p.category || 'Specialty',
          biller_id: s.id,
          rating: parseFloat(p.rating) || 4.9,
          reviews: parseInt(p.reviews_count) || 24,
          inStock: true
        }));

        // Categories
        const [catRows] = await db.query(`
          SELECT DISTINCT c.id, c.code, c.name, c.slug, c.image
          FROM aura_categories c
          JOIN aura_products p ON p.category_id = c.id
          WHERE p.biller_id = ? AND p.status = 1
        `, [s.id]);

        return res.json({
          status: true,
          data: store,
          store,
          products,
          categories: catRows
        });
      }

      // Local fallback
      const foundStore = (simpleData.stores || []).find((s) => s.slug === slug || String(s.id) === String(slug));
      if (!foundStore) return res.status(404).json({ status: false, message: 'Store not found' });
      const storeProducts = simpleData.products.filter((p) => Number(p.biller_id) === Number(foundStore.id));
      const catIds = new Set(storeProducts.map((p) => p.category_id));
      const storeCats = simpleData.categories.filter((c) => catIds.has(c.id));

      return res.json({
        status: true,
        data: foundStore,
        store: foundStore,
        products: storeProducts,
        categories: storeCats
      });
    } catch (err) {
      console.error('[StoreController.getStore]', err);
      return res.status(500).json({ status: false, error: err.message });
    }
  },

  async resolveBiller(req, res) {
    try {
      const { id } = req.params;
      const [rows] = await db.query('SELECT slug, store_slug FROM aura_companies WHERE id = ? LIMIT 1', [id]);
      if (rows.length > 0) {
        return res.json({ status: true, slug: rows[0].slug || rows[0].store_slug || `store-${id}` });
      }
      const store = (simpleData.stores || []).find((s) => Number(s.id) === Number(id));
      if (store) return res.json({ status: true, slug: store.slug });
      return res.status(404).json({ status: false, message: 'Biller not found' });
    } catch (err) {
      return res.status(500).json({ status: false, error: err.message });
    }
  },

  async getCategories(req, res) {
    try {
      const { slug } = req.params;
      const [catRows] = await db.query(`
        SELECT DISTINCT c.id, c.code, c.name, c.slug, c.image
        FROM aura_categories c
        JOIN aura_products p ON p.category_id = c.id
        JOIN aura_companies co ON p.biller_id = co.id
        WHERE (co.slug = ? OR co.store_slug = ? OR co.id = ?) AND p.status = 1
      `, [slug, slug, slug]);
      return res.json({ status: true, data: catRows });
    } catch (err) {
      return res.status(500).json({ status: false, error: err.message });
    }
  },

  async getProducts(req, res) {
    try {
      const { slug } = req.params;
      const { category, q } = req.query;
      let sql = `
        SELECT 
          p.id, p.code, p.name, p.slug, p.price, p.image, p.details, p.category_id,
          p.brand, p.moq, p.rating, p.reviews_count, p.featured,
          c.name AS category
        FROM aura_products p
        LEFT JOIN aura_categories c ON p.category_id = c.id
        JOIN aura_companies co ON p.biller_id = co.id
        WHERE (co.slug = ? OR co.store_slug = ? OR co.id = ?) AND p.status = 1
      `;
      const params = [slug, slug, slug];

      if (category) {
        sql += ' AND p.category_id = ?';
        params.push(category);
      }
      if (q) {
        sql += ' AND (p.name LIKE ? OR p.details LIKE ? OR p.code LIKE ?)';
        params.push(`%${q}%`, `%${q}%`, `%${q}%`);
      }

      sql += ' ORDER BY p.id ASC';
      const [rows] = await db.query(sql, params);

      const products = rows.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        slug: p.slug,
        price: Number(p.price || 0),
        image: p.image?.startsWith('http') || p.image?.startsWith('/') ? p.image : (p.image ? `/assets/uploads/${p.image}` : null),
        details: p.details,
        category_id: p.category_id,
        category: p.category,
        inStock: true
      }));

      return res.json({
        status: true,
        data: products,
        products,
        meta: { total: products.length }
      });
    } catch (err) {
      return res.status(500).json({ status: false, error: err.message });
    }
  }
};

module.exports = StoreController;
