const { db } = require('../../config/utill/helper');
const { sendSuccess, sendError } = require('../../config/utill/response');

// Helper to format an image URL cleanly
function formatImageUrl(img) {
  if (!img) return null;
  if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('/')) {
    return img;
  }
  return `/assets/uploads/${img}`;
}

const ThemePublicController = {
  /**
   * GET /api/products
   * Public wholesale & retail product catalog with rich multi-facet filtering
   */
  async getProducts(req, res) {
    try {
      const {
        category,
        category_id,
        brand,
        shop_id,
        biller_id,
        search,
        q,
        featured,
        stock,
        moq,
        min_price,
        max_price,
        sort_by = 'featured',
        page = 1,
        limit = 50
      } = req.query;

      const searchTerm = (search || q || '').trim();
      const numLimit = Math.min(Math.max(parseInt(limit) || 24, 1), 200);
      const numPage = Math.max(parseInt(page) || 1, 1);
      const offset = (numPage - 1) * numLimit;

      const whereConditions = ['p.status = 1'];
      const params = [];

      // Check hide0 setting from aura_shop_settings
      try {
        const [settingsRows] = await db.query('SELECT hide0 FROM aura_shop_settings LIMIT 1');
        if (settingsRows && settingsRows[0] && Number(settingsRows[0].hide0) === 1) {
          if (stock !== 'all' && stock !== 'out_of_stock' && stock !== '0') {
            whereConditions.push('p.quantity > 0');
          }
        }
      } catch (_) {}

      // Category filter (by id, slug, or name)
      if (category_id && category_id !== 'all') {
        whereConditions.push('p.category_id = ?');
        params.push(category_id);
      } else if (category && category !== 'all') {
        whereConditions.push('(c.slug = ? OR c.name = ? OR c.code = ?)');
        params.push(category, category, category);
      }

      // Brand filter
      if (brand && brand !== 'all') {
        whereConditions.push('(p.brand = ? OR b.slug = ? OR b.name = ?)');
        params.push(brand, brand, brand);
      }

      // Shop / Biller filter (strictly by companies.id or store slug)
      const effectiveShop = shop_id || biller_id;
      if (effectiveShop && effectiveShop !== 'all') {
        const isNumeric = /^\d+$/.test(String(effectiveShop));
        if (isNumeric) {
          whereConditions.push('p.biller_id = ?');
          params.push(parseInt(effectiveShop));
        } else {
          whereConditions.push('(comp.slug = ? OR comp.store_slug = ?)');
          params.push(effectiveShop, effectiveShop);
        }
        whereConditions.push("comp.group_name = 'biller'");
        whereConditions.push("(comp.group_id IS NULL OR comp.group_id = 0)");
      }

      // Text search
      if (searchTerm) {
        whereConditions.push('(p.name LIKE ? OR p.code LIKE ? OR p.details LIKE ? OR p.slug LIKE ?)');
        const likeStr = `%${searchTerm}%`;
        params.push(likeStr, likeStr, likeStr, likeStr);
      }

      // Featured filter
      if (featured === '1' || featured === 'true') {
        whereConditions.push('p.featured = 1');
      }

      // Stock status
      if (stock === 'in_stock' || stock === '1') {
        whereConditions.push('p.quantity > 0');
      }

      // MOQ filter
      if (moq === 'low') {
        whereConditions.push('p.moq <= 5');
      } else if (moq === 'bulk') {
        whereConditions.push('p.moq > 5');
      }

      // Price range
      if (min_price !== undefined && min_price !== '') {
        whereConditions.push('p.price >= ?');
        params.push(parseFloat(min_price) || 0);
      }
      if (max_price !== undefined && max_price !== '') {
        whereConditions.push('p.price <= ?');
        params.push(parseFloat(max_price) || 1000000);
      }

      const whereSql = whereConditions.join(' AND ');

      // Total count query
      const countSql = `
        SELECT COUNT(DISTINCT p.id) AS total
        FROM aura_products p
        LEFT JOIN aura_categories c ON p.category_id = c.id
        LEFT JOIN aura_brands b ON (p.brand = b.id OR p.brand = b.name)
        LEFT JOIN aura_companies comp ON p.biller_id = comp.id
        WHERE ${whereSql}
      `;
      const [countResult] = await db.query(countSql, params);
      const total = countResult[0]?.total || 0;

      // Order By clause
      let orderBySql = 'p.featured DESC, p.id DESC';
      if (sort_by === 'price_asc' || sort_by === 'price-low') {
        orderBySql = 'p.price ASC, p.id DESC';
      } else if (sort_by === 'price_desc' || sort_by === 'price-high') {
        orderBySql = 'p.price DESC, p.id DESC';
      } else if (sort_by === 'rating') {
        orderBySql = 'p.rating DESC, p.reviews_count DESC';
      } else if (sort_by === 'newest') {
        orderBySql = 'p.id DESC';
      } else if (sort_by === 'name') {
        orderBySql = 'p.name ASC';
      }

      // Fetch products list (strictly omitting costs and ERP internals)
      const dataSql = `
        SELECT 
          p.id,
          p.code,
          p.name,
          p.slug,
          p.price,
          p.currency,
          p.image,
          p.category_id,
          p.biller_id,
          p.project_id,
          p.unit,
          p.details,
          p.product_details,
          p.featured,
          p.rating,
          p.reviews_count,
          p.moq,
          p.type,
          p.brand,
          c.name AS category_name,
          c.slug AS category_slug,
          comp.name AS store_name,
          comp.name AS biller_name,
          comp.slug AS store_slug,
          comp.logo AS store_logo,
          proj.project_name,
          COALESCE(SUM(wp.quantity), p.quantity, 0) AS in_stock
        FROM aura_products p
        LEFT JOIN aura_categories c ON p.category_id = c.id
        LEFT JOIN aura_brands b ON (p.brand = b.id OR p.brand = b.name)
        LEFT JOIN aura_companies comp ON p.biller_id = comp.id
        LEFT JOIN aura_projects proj ON p.project_id = proj.project_id
        LEFT JOIN aura_warehouses_products wp ON wp.product_id = p.id
        WHERE ${whereSql}
        GROUP BY p.id
        ORDER BY ${orderBySql}
        LIMIT ? OFFSET ?
      `;

      const [rows] = await db.query(dataSql, [...params, numLimit, offset]);

      const formatted = rows.map((p) => {
        const price = parseFloat(p.price) || 0;
        const stockQty = parseFloat(p.in_stock) || 0;
        return {
          id: p.id,
          key: p.id,
          code: p.code || '',
          name: p.name || 'Untitled Product',
          slug: p.slug || `prod-${p.id}`,
          price: price,
          originalPrice: Number((price * 1.25).toFixed(2)),
          currency: p.currency || 'USD',
          image: formatImageUrl(p.image),
          category_id: p.category_id,
          category: p.category_name || 'General',
          categorySlug: p.category_slug || 'general',
          brand: p.brand || p.store_name || 'Aura Partner',
          biller_id: p.biller_id,
          storeId: p.biller_id,
          shop_id: p.biller_id,
          shopId: p.biller_id,
          billerName: p.biller_name || p.store_name || `Store #${p.biller_id}`,
          shopName: p.store_name || p.biller_name || `Store #${p.biller_id}`,
          storeName: p.store_name || p.biller_name || `Store #${p.biller_id}`,
          store_name: p.store_name || p.biller_name || `Store #${p.biller_id}`,
          storeSlug: p.store_slug || `store-${p.biller_id}`,
          project_id: p.project_id || null,
          projectName: p.project_name || '',
          seller: p.store_name || 'Aura Partner',
          sellerSlug: p.store_slug || 'sbc-store',
          sellerLogo: p.store_logo || null,
          details: p.details || p.product_details || '',
          description: p.details || p.product_details || '',
          featured: Boolean(p.featured),
          rating: parseFloat(p.rating) || 5.0,
          reviews: parseInt(p.reviews_count) || 0,
          reviewsCount: parseInt(p.reviews_count) || 0,
          moq: parseInt(p.moq) || 1,
          inStock: stockQty > 0,
          stock: stockQty,
          stockCount: stockQty,
          unit: p.unit || 'unit'
        };
      });

      return res.status(200).json({
        success: true,
        status: true,
        data: formatted,
        products: formatted,
        pagination: {
          page: numPage,
          limit: numLimit,
          total,
          totalPages: Math.ceil(total / numLimit)
        }
      });
    } catch (err) {
      console.error('[ThemePublicController.getProducts]', err);
      return sendError(res, err.message, 500);
    }
  },

  /**
   * GET /api/products/:slug
   * Single product lookup by slug, id, or code
   */
  async getProductBySlug(req, res) {
    try {
      const { slug } = req.params;
      const isNumeric = /^\d+$/.test(slug);

      let query = `
        SELECT 
          p.id, p.code, p.name, p.slug, p.price, p.currency, p.image,
          p.category_id, p.biller_id, p.unit, p.details, p.product_details,
          p.featured, p.rating, p.reviews_count, p.moq, p.type, p.brand,
          c.name AS category_name, c.slug AS category_slug,
          comp.id AS company_id, comp.name AS store_name, comp.company AS store_company,
          comp.slug AS store_slug, comp.logo AS store_logo, comp.banner AS store_banner,
          comp.tagline AS store_tagline, comp.address AS store_address, comp.rating AS store_rating,
          COALESCE(SUM(wp.quantity), p.quantity, 0) AS in_stock
        FROM aura_products p
        LEFT JOIN aura_categories c ON p.category_id = c.id
        LEFT JOIN aura_companies comp ON p.biller_id = comp.id
        LEFT JOIN aura_warehouses_products wp ON wp.product_id = p.id
        WHERE ${isNumeric ? 'p.id = ? OR p.slug = ? OR p.code = ?' : 'p.slug = ? OR p.code = ? OR p.id = ?'}
        GROUP BY p.id
        LIMIT 1
      `;

      const [rows] = await db.query(query, [slug, slug, slug]);
      if (rows.length === 0) {
        return sendError(res, 'Product not found', 404);
      }

      const p = rows[0];
      const price = parseFloat(p.price) || 0;
      const stockQty = parseFloat(p.in_stock) || 0;

      // Fetch photos from aura_product_photos if available
      const [photos] = await db.query('SELECT photo FROM aura_product_photos WHERE product_id = ?', [p.id]);
      const photoUrls = photos.map(ph => formatImageUrl(ph.photo));
      if (photoUrls.length === 0) {
        photoUrls.push(formatImageUrl(p.image));
      }

      // Fetch units from aura_product_units
      const [units] = await db.query(`
        SELECT u.id, u.name, pu.unit_price, pu.unit_qty
        FROM aura_product_units pu
        LEFT JOIN aura_units u ON pu.unit_id = u.id
        WHERE pu.product_id = ?
      `, [p.id]);

      const formatted = {
        id: p.id,
        key: p.id,
        code: p.code || '',
        name: p.name,
        slug: p.slug || `prod-${p.id}`,
        price: price,
        originalPrice: Number((price * 1.25).toFixed(2)),
        currency: p.currency || 'USD',
        image: formatImageUrl(p.image),
        photos: photoUrls,
        category_id: p.category_id,
        category: p.category_name || 'General',
        categorySlug: p.category_slug || 'general',
        brand: p.brand || p.store_name || 'Aura Partner',
        biller_id: p.biller_id,
        details: p.details || p.product_details || '',
        description: p.details || p.product_details || '',
        featured: Boolean(p.featured),
        rating: parseFloat(p.rating) || 5.0,
        reviews: parseInt(p.reviews_count) || 0,
        reviewsCount: parseInt(p.reviews_count) || 0,
        moq: parseInt(p.moq) || 1,
        inStock: stockQty > 0,
        stock: stockQty,
        stockCount: stockQty,
        units: units,
        shop: {
          id: p.store_slug || p.company_id,
          storeId: p.company_id,
          slug: p.store_slug || 'sbc-store',
          name: p.store_name || 'Aura Partner',
          company: p.store_company || p.store_name,
          tagline: p.store_tagline || 'Artisan B2B Partner Store',
          address: p.store_address || 'Phnom Penh, Cambodia',
          logo: p.store_logo || null,
          banner: p.store_banner || null,
          rating: parseFloat(p.store_rating) || 4.90
        }
      };

      return res.status(200).json({
        success: true,
        status: true,
        data: formatted,
        product: formatted
      });
    } catch (err) {
      console.error('[ThemePublicController.getProductBySlug]', err);
      return sendError(res, err.message, 500);
    }
  },

  /**
   * GET /api/categories
   * List categories with real product counts
   */
  async getCategories(req, res) {
    try {
      const [rows] = await db.query(`
        SELECT 
          c.id, c.code, c.name, c.slug, c.image, c.description, c.order_number,
          COUNT(DISTINCT p.id) AS products_count
        FROM aura_categories c
        LEFT JOIN aura_products p ON p.category_id = c.id AND p.status = 1
        WHERE c.status = 'show'
        GROUP BY c.id
        ORDER BY c.order_number ASC, c.name ASC
      `);

      const data = rows.map(c => ({
        id: c.id,
        code: c.code || '',
        name: c.name,
        slug: c.slug || c.code || `cat-${c.id}`,
        image: c.image ? formatImageUrl(c.image) : null,
        description: c.description || '',
        order: c.order_number || 0,
        productsCount: parseInt(c.products_count) || 0,
        count: parseInt(c.products_count) || 0
      }));

      return res.status(200).json({
        success: true,
        status: true,
        data,
        categories: data
      });
    } catch (err) {
      console.error('[ThemePublicController.getCategories]', err);
      return sendError(res, err.message, 500);
    }
  },

  /**
   * GET /api/brands
   * Master verified brands
   */
  async getBrands(req, res) {
    try {
      const [rows] = await db.query(`
        SELECT id, code, name, image, slug, description
        FROM aura_brands
        ORDER BY name ASC
      `);

      const data = rows.map(b => ({
        id: b.id,
        code: b.code || '',
        name: b.name,
        slug: b.slug || b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        image: b.image ? formatImageUrl(b.image) : null,
        description: b.description || ''
      }));

      return res.status(200).json({
        success: true,
        status: true,
        data,
        brands: data
      });
    } catch (err) {
      console.error('[ThemePublicController.getBrands]', err);
      return sendError(res, err.message, 500);
    }
  },

  /**
   * GET /api/shops and GET /api/stores
   * Directory of partner stores and verified suppliers
   */
  async getShops(req, res) {
    try {
      const { search, branch } = req.query;

      // Strictly stores from companies table where group_name = 'biller' and group_id IS NULL
      let whereConditions = [
        "c.group_name = 'biller'",
        "c.group_id IS NULL"
      ];
      const params = [];

      if (search && search.trim() !== '') {
        whereConditions.push('(c.name LIKE ? OR c.company LIKE ? OR c.slug LIKE ? OR c.tagline LIKE ?)');
        const like = `%${search.trim()}%`;
        params.push(like, like, like, like);
      }

      if (branch && branch !== 'all') {
        whereConditions.push('(c.city LIKE ? OR c.address LIKE ?)');
        params.push(`%${branch}%`, `%${branch}%`);
      }

      const whereSql = whereConditions.join(' AND ');

      const [rows] = await db.query(`
        SELECT 
          c.id, c.code, c.name, c.company, c.slug, c.store_slug, c.address,
          c.phone, c.email, c.city, c.country, c.logo, c.banner, c.theme_color,
          c.currency_code, c.currency_symbol, c.tagline, c.rating, c.reviews_count,
          c.operating_hours, c.group_name,
          COUNT(DISTINCT p.id) AS products_count
        FROM aura_companies c
        LEFT JOIN aura_products p ON p.biller_id = c.id AND p.status = 1
        WHERE ${whereSql}
        GROUP BY c.id
        ORDER BY c.id ASC
      `, params);

      const data = rows.map(s => ({
        id: s.id, // Strictly companies.id
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
        heroImage: s.banner || s.logo || null,
        theme_color: s.theme_color || '#2F6FED',
        currency_code: s.currency_code || 'USD',
        currency_symbol: s.currency_symbol || '$',
        rating: parseFloat(s.rating) || 4.90,
        reviews: parseInt(s.reviews_count) || 120,
        reviewsCount: parseInt(s.reviews_count) || 120,
        productsCount: parseInt(s.products_count) || 0,
        operating_hours: s.operating_hours || '8:00 AM - 9:00 PM',
        role: 'Direct Biller Store',
        is_active: 1,
        is_open: true
      }));

      return res.status(200).json({
        success: true,
        status: true,
        data,
        stores: data,
        shops: data
      });
    } catch (err) {
      console.error('[ThemePublicController.getShops]', err);
      return sendError(res, err.message, 500);
    }
  },

  /**
   * GET /api/shops/:id
   * Single store profile (strictly aura_companies where group_name = 'biller' and group_id IS NULL)
   */
  async getShopById(req, res) {
    try {
      const { id } = req.params;
      const isNumeric = /^\d+$/.test(id);

      const [rows] = await db.query(`
        SELECT 
          c.id, c.code, c.name, c.company, c.slug, c.store_slug, c.address,
          c.phone, c.email, c.city, c.country, c.logo, c.banner, c.theme_color,
          c.currency_code, c.currency_symbol, c.tagline, c.rating, c.reviews_count,
          c.operating_hours, c.group_name,
          COUNT(DISTINCT p.id) AS products_count
        FROM aura_companies c
        LEFT JOIN aura_products p ON p.biller_id = c.id AND p.status = 1
        WHERE c.group_name = 'biller' AND c.group_id IS NULL
          AND (${isNumeric ? 'c.id = ? OR c.slug = ? OR c.store_slug = ?' : 'c.slug = ? OR c.store_slug = ? OR c.id = ?'})
        GROUP BY c.id
        LIMIT 1
      `, [id, id, id]);

      if (rows.length === 0) {
        return sendError(res, 'Store not found', 404);
      }

      const s = rows[0];
      const data = {
        id: s.id, // Strictly companies.id
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
        heroImage: s.banner || s.logo || null,
        theme_color: s.theme_color || '#2F6FED',
        currency_code: s.currency_code || 'USD',
        currency_symbol: s.currency_symbol || '$',
        rating: parseFloat(s.rating) || 4.90,
        reviews: parseInt(s.reviews_count) || 120,
        reviewsCount: parseInt(s.reviews_count) || 120,
        productsCount: parseInt(s.products_count) || 0,
        operating_hours: s.operating_hours || '8:00 AM - 9:00 PM',
        specialties: ['Direct Store', 'Live Kitchen Dispatch', 'Instant Checkout'],
        role: 'Direct Biller Store',
        is_active: 1,
        is_open: true
      };

      return res.status(200).json({
        success: true,
        status: true,
        data,
        shop: data,
        store: data
      });
    } catch (err) {
      console.error('[ThemePublicController.getShopById]', err);
      return sendError(res, err.message, 500);
    }
  },

  /**
   * GET /api/banners
   * Active promotional posters & hero sliders
   */
  async getBanners(req, res) {
    try {
      const [rows] = await db.query(`
        SELECT 
          b.*,
          comp.name AS store_name,
          comp.slug AS store_slug
        FROM aura_theme_banners b
        LEFT JOIN aura_companies comp ON b.biller_id = comp.id
        WHERE b.status = 1
        ORDER BY b.sort_order ASC, b.id ASC
      `);

      const data = rows.map(b => ({
        id: `promo-${b.id}`,
        bannerId: b.id,
        storeName: b.store_name || 'Aura Partner',
        storeSlug: b.store_slug || 'sbc-store',
        title: b.title,
        subtitle: b.subtitle || '',
        image: b.image,
        linkUrl: b.link_url || `/shop/${b.store_slug || 'sbc-store'}`,
        buttonText: b.button_text || 'Claim Deal',
        badge: b.badge || 'SPECIAL OFFER',
        badgeColor: b.badge_color || '#ef4444',
        badgeBg: b.badge_bg || 'rgba(239, 68, 68, 0.95)',
        couponCode: b.coupon_code || '',
        originalPrice: b.original_price ? `$${parseFloat(b.original_price).toFixed(2)}` : null,
        promoPrice: b.promo_price ? `$${parseFloat(b.promo_price).toFixed(2)}` : null,
        savings: b.savings || '',
        validUntil: b.valid_until || 'Limited Time Offer',
        accentColor: b.accent_color || '#2F6FED',
        overlayGradient: b.overlay_gradient || 'linear-gradient(180deg, rgba(15,23,42,0.3) 0%, rgba(15,23,42,0.96) 100%)'
      }));

      return res.status(200).json({
        success: true,
        status: true,
        data,
        banners: data
      });
    } catch (err) {
      console.error('[ThemePublicController.getBanners]', err);
      return sendError(res, err.message, 500);
    }
  },

  /**
   * GET /api/shop-settings
   * Shop info, contact details, social links, and theme branding
   */
  async getShopSettings(req, res) {
    try {
      const [shopSettings] = await db.query('SELECT * FROM aura_shop_settings LIMIT 1');
      const [themeRows] = await db.query('SELECT setting_key, setting_value FROM aura_theme_settings WHERE biller_id = 1');

      const themeMap = {};
      themeRows.forEach(r => {
        themeMap[r.setting_key] = r.setting_value;
      });

      const shop = shopSettings[0] || {};

      const data = {
        shopName: themeMap.site_name || shop.shop_name || 'Aura Supply',
        tagline: themeMap.site_tagline || shop.description || 'B2B Wholesale Procurement Platform',
        description: shop.description || '',
        phone: themeMap.contact_phone || shop.phone || '+855 12 345 678',
        email: themeMap.contact_email || shop.email || 'procurement@auraglobal.com',
        address: themeMap.contact_address || 'No. 128 Norodom Blvd, Daun Penh, Phnom Penh',
        logo: shop.logo || '/logos/aura-logo.svg',
        facebook: shop.facebook || 'https://facebook.com/aurasupply',
        twitter: shop.twitter || 'https://twitter.com/aurasupply',
        instagram: shop.instagram || 'https://instagram.com/aurasupply',
        primaryColor: themeMap.theme_primary_color || '#2F6FED',
        accentColor: themeMap.theme_accent_color || '#FF7A3D',
        currency: themeMap.currency_default || 'USD',
        cookieMessage: shop.cookie_message || 'We use cookies to ensure optimal procurement experience.'
      };

      return res.status(200).json({
        success: true,
        status: true,
        data,
        settings: data
      });
    } catch (err) {
      console.error('[ThemePublicController.getShopSettings]', err);
      return sendError(res, err.message, 500);
    }
  },

  /**
   * GET /api/pages/:slug
   * Dynamic CMS page content
   */
  async getPage(req, res) {
    try {
      const { slug } = req.params;
      const [rows] = await db.query('SELECT * FROM aura_pages WHERE slug = ? AND active = 1 LIMIT 1', [slug]);
      if (rows.length === 0) {
        return sendError(res, 'Page not found', 404);
      }
      return res.status(200).json({
        success: true,
        status: true,
        data: rows[0],
        page: rows[0]
      });
    } catch (err) {
      console.error('[ThemePublicController.getPage]', err);
      return sendError(res, err.message, 500);
    }
  },

  /**
   * GET /api/menu
   * Dynamic navigation menu
   */
  async getMenu(req, res) {
    try {
      const [rows] = await db.query(`
        SELECT id, parent_id, name, slug, icon, image, order_number 
        FROM aura_menu 
        WHERE status = 1 
        ORDER BY order_number ASC, id ASC
      `);

      return res.status(200).json({
        success: true,
        status: true,
        data: rows,
        menu: rows
      });
    } catch (err) {
      console.error('[ThemePublicController.getMenu]', err);
      return sendError(res, err.message, 500);
    }
  },

  /**
   * GET /api/posts
   * Knowledge base, academy tracks, and blog posts
   */
  async getPosts(req, res) {
    try {
      const [rows] = await db.query(`
        SELECT id, biller_id, title, slug, category, author, excerpt, body, image, views, badge, duration, published_at
        FROM aura_theme_posts
        WHERE status = 'published'
        ORDER BY id ASC
      `);

      return res.status(200).json({
        success: true,
        status: true,
        data: rows,
        posts: rows
      });
    } catch (err) {
      console.error('[ThemePublicController.getPosts]', err);
      return sendError(res, err.message, 500);
    }
  },

  /**
   * GET /api/reviews
   * Product reviews
   */
  async getReviews(req, res) {
    try {
      const { product_id } = req.query;
      let query = 'SELECT * FROM aura_theme_reviews WHERE status = 1';
      const params = [];
      if (product_id) {
        query += ' AND product_id = ?';
        params.push(product_id);
      }
      query += ' ORDER BY id DESC LIMIT 50';

      const [rows] = await db.query(query, params);
      return res.status(200).json({
        success: true,
        status: true,
        data: rows,
        reviews: rows
      });
    } catch (err) {
      console.error('[ThemePublicController.getReviews]', err);
      return sendError(res, err.message, 500);
    }
  },

  /**
   * POST /api/reviews
   * Submit product review
   */
  async submitReview(req, res) {
    try {
      const { product_id, rating = 5.0, name, title = '', comment } = req.body;
      if (!product_id || !name || !comment) {
        return sendError(res, 'Product ID, reviewer name, and review comment are required', 400);
      }

      const numRating = Math.max(1, Math.min(5, parseFloat(rating) || 5.0));

      const [result] = await db.query(`
        INSERT INTO aura_theme_reviews (product_id, customer_id, name, rating, title, comment, status)
        VALUES (?, 1, ?, ?, ?, ?, 1)
      `, [product_id, name.trim(), numRating, title ? title.trim() : '', comment.trim()]);

      // Update product rating and reviews count
      await db.query(`
        UPDATE aura_products p
        SET 
          rating = (SELECT AVG(rating) FROM aura_theme_reviews WHERE product_id = p.id AND status = 1),
          reviews_count = (SELECT COUNT(*) FROM aura_theme_reviews WHERE product_id = p.id AND status = 1)
        WHERE id = ?
      `, [product_id]);

      return res.status(201).json({
        success: true,
        status: true,
        message: 'Review submitted successfully',
        data: { id: result.insertId }
      });
    } catch (err) {
      console.error('[ThemePublicController.submitReview]', err);
      return sendError(res, err.message, 500);
    }
  },

  /**
   * POST /api/newsletter
   * Corporate email RFQ / Newsletter subscription
   */
  async submitNewsletter(req, res) {
    try {
      const { email } = req.body;
      if (!email || !email.includes('@') || email.length < 5) {
        return sendError(res, 'Valid corporate email is required', 400);
      }

      const cleanEmail = email.trim().toLowerCase();
      await db.query(`
        INSERT INTO aura_theme_newsletter (email, status)
        VALUES (?, 1)
        ON DUPLICATE KEY UPDATE status = 1
      `, [cleanEmail]);

      return res.status(200).json({
        success: true,
        status: true,
        message: 'Thank you! Your business inquiry has been routed to our B2B procurement desk.'
      });
    } catch (err) {
      console.error('[ThemePublicController.submitNewsletter]', err);
      return sendError(res, err.message, 500);
    }
  },

  /**
   * POST /api/contact
   * Submit inquiry or contact message
   */
  async submitContact(req, res) {
    try {
      const { name, email, phone, subject, message } = req.body;
      if (!name || !email || !message) {
        return sendError(res, 'Name, email, and message are required', 400);
      }

      const [result] = await db.query(`
        INSERT INTO aura_theme_contact_messages (name, email, phone, subject, message, is_read)
        VALUES (?, ?, ?, ?, ?, 0)
      `, [name.trim(), email.trim(), phone ? phone.trim() : null, subject ? subject.trim() : 'General Inquiry', message.trim()]);

      return res.status(201).json({
        success: true,
        status: true,
        message: 'Your inquiry has been received. Our team will contact you shortly.',
        data: { id: result.insertId }
      });
    } catch (err) {
      console.error('[ThemePublicController.submitContact]', err);
      return sendError(res, err.message, 500);
    }
  },

  /**
   * POST /api/orders
   * Place commercial procurement order into aura_sales_order & aura_sales
   */
  async submitOrder(req, res) {
    try {
      const {
        customer = {},
        items = [],
        deliveryMethod = 'standard',
        paymentMethod = 'khqr',
        notes = '',
        poNumber = ''
      } = req.body;

      if (!items || items.length === 0) {
        return sendError(res, 'Cannot place order: Cart is empty', 400);
      }

      const orderRef = `AUR-${Math.floor(100000 + Math.random() * 900000)}`;
      const customerName = customer.name || customer.company || 'Direct Procurement Client';
      const customerPhone = customer.phone || '012 345 678';
      const customerEmail = customer.email || 'client@auraglobal.com';
      const customerAddress = customer.address || 'Phnom Penh';

      // Calculate totals
      let subtotal = 0;
      for (const item of items) {
        const itemQty = parseFloat(item.quantity) || 1;
        const itemPrice = parseFloat(item.price) || 0;
        subtotal += itemQty * itemPrice;
      }

      // Volume bulk discount
      const bulkDiscount = subtotal >= 500 ? Number((subtotal * 0.10).toFixed(2)) : subtotal >= 200 ? Number((subtotal * 0.05).toFixed(2)) : 0;
      const taxable = Math.max(0, subtotal - bulkDiscount);
      const tax = Number((taxable * 0.1).toFixed(2));
      const shipping = deliveryMethod === 'pickup' ? 0 : deliveryMethod === 'express' ? 15 : subtotal >= 100 ? 0 : 10;
      const grandTotal = Number((taxable + tax + shipping).toFixed(2));

      // 1. Insert into aura_sales_order
      const [soResult] = await db.query(`
        INSERT INTO aura_sales_order (
          reference_no, date, customer_id, customer, biller_id, biller, warehouse_id,
          total, product_discount, total_discount, order_tax, total_tax, shipping,
          grand_total, sale_status, order_status, payment_status, total_items,
          created_by, note, payment_method, updated_at
        ) VALUES (?, NOW(), 2, ?, 3, 'Aura Specialty Coffee', 1, ?, 0, ?, ?, ?, ?, ?, 'completed', 'completed', 'paid', ?, 1, ?, ?, NOW())
      `, [
        orderRef, customerName, subtotal, bulkDiscount, tax, tax, shipping, grandTotal,
        items.length, notes || customer.notes || '', paymentMethod
      ]);

      const salesOrderId = soResult.insertId;

      // 2. Insert items into aura_sale_order_items
      for (const item of items) {
        const itemQty = parseFloat(item.quantity) || 1;
        const itemPrice = parseFloat(item.price) || 0;
        const itemSubtotal = itemQty * itemPrice;

        await db.query(`
          INSERT INTO aura_sale_order_items (
            sale_order_id, product_id, product_code, product_name, product_type,
            unit_price, net_unit_price, real_unit_price, quantity, unit_quantity,
            warehouse_id, subtotal
          ) VALUES (?, ?, ?, ?, 'standard', ?, ?, ?, ?, ?, 1, ?)
        `, [
          salesOrderId, item.id || 1, item.code || `PRD-${item.id}`, item.name || 'Product',
          itemPrice, itemPrice, itemPrice, itemQty, itemQty, itemSubtotal
        ]);
      }

      // 3. Also insert into aura_sales & aura_sale_items for ERP visibility
      const [saleResult] = await db.query(`
        INSERT INTO aura_sales (
          so_id, reference_no, po_number, date, customer_id, customer, biller_id, biller,
          warehouse_id, total, product_discount, total_discount, total_tax, shipping,
          grand_total, sale_status, payment_status, total_items, created_by, note,
          payment_method, paid
        ) VALUES (?, ?, ?, NOW(), 2, ?, 3, 'Aura Specialty Coffee', 1, ?, 0, ?, ?, ?, ?, 'completed', 'paid', ?, 1, ?, ?, ?)
      `, [
        salesOrderId, orderRef, poNumber || customer.poNumber || `PO-${Date.now()}`,
        customerName, subtotal, bulkDiscount, tax, shipping, grandTotal,
        items.length, notes || '', paymentMethod, grandTotal
      ]);

      const saleId = saleResult.insertId;

      for (const item of items) {
        const itemQty = parseFloat(item.quantity) || 1;
        const itemPrice = parseFloat(item.price) || 0;
        const itemSubtotal = itemQty * itemPrice;

        await db.query(`
          INSERT INTO aura_sale_items (
            sale_id, product_id, product_code, product_name, product_type,
            unit_price, net_unit_price, real_unit_price, quantity, unit_quantity,
            warehouse_id, subtotal
          ) VALUES (?, ?, ?, ?, 'standard', ?, ?, ?, ?, ?, 1, ?)
        `, [
          saleId, item.id || 1, item.code || `PRD-${item.id}`, item.name || 'Product',
          itemPrice, itemPrice, itemPrice, itemQty, itemQty, itemSubtotal
        ]);
      }

      const orderData = {
        orderId: orderRef,
        reference_no: orderRef,
        salesOrderId,
        saleId,
        createdAt: new Date().toISOString(),
        customer: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          address: customerAddress,
          company: customer.company || '',
          taxId: customer.taxId || '',
          poNumber: poNumber || customer.poNumber || ''
        },
        deliveryMethod,
        paymentMethod,
        items,
        subtotal,
        bulkDiscount,
        shipping,
        tax,
        total: grandTotal
      };

      return res.status(201).json({
        success: true,
        status: true,
        message: `Commercial Order ${orderRef} placed successfully!`,
        data: orderData,
        order: orderData
      });
    } catch (err) {
      console.error('[ThemePublicController.submitOrder]', err);
      return sendError(res, err.message, 500);
    }
  },

  /**
   * GET /api/orders
   * Retrieve list of confirmed commercial orders
   */
  async getOrders(req, res) {
    try {
      const [rows] = await db.query(`
        SELECT 
          s.id, s.reference_no, s.po_number, s.date, s.customer, s.biller,
          s.total, s.shipping, s.total_tax, s.grand_total, s.sale_status,
          s.payment_status, s.payment_method, s.note, s.total_items
        FROM aura_sales s
        ORDER BY s.id DESC
        LIMIT 50
      `);

      const formatted = rows.map(r => ({
        id: r.id,
        orderId: r.reference_no,
        reference_no: r.reference_no,
        poNumber: r.po_number || '',
        createdAt: r.date,
        customer: {
          name: r.customer,
          phone: '',
          email: '',
          address: ''
        },
        biller: r.biller,
        subtotal: parseFloat(r.total) || 0,
        shipping: parseFloat(r.shipping) || 0,
        tax: parseFloat(r.total_tax) || 0,
        total: parseFloat(r.grand_total) || 0,
        status: r.sale_status || 'completed',
        paymentStatus: r.payment_status || 'paid',
        paymentMethod: r.payment_method || 'khqr',
        totalItems: r.total_items || 1,
        items: []
      }));

      return res.status(200).json({
        success: true,
        status: true,
        data: formatted,
        orders: formatted
      });
    } catch (err) {
      console.error('[ThemePublicController.getOrders]', err);
      return sendError(res, err.message, 500);
    }
  },

  /**
   * GET /api/currencies
   */
  async getCurrencies(req, res) {
    try {
      const [rows] = await db.query('SELECT id, code, name, rate, symbol FROM aura_currencies ORDER BY id ASC');
      return res.status(200).json({
        success: true,
        status: true,
        data: rows,
        currencies: rows
      });
    } catch (err) {
      console.error('[ThemePublicController.getCurrencies]', err);
      return sendError(res, err.message, 500);
    }
  },

  /**
   * GET /api/branches
   */
  async getBranches(req, res) {
    try {
      const [rows] = await db.query(`
        SELECT id, code, name, address, phone, email
        FROM aura_warehouses
        ORDER BY id ASC
      `);

      const branches = rows.length > 0 ? rows : [
        { id: 1, name: 'Phnom Penh Flagship Hub', address: 'No. 128 Norodom Blvd, Daun Penh', city: 'Phnom Penh' },
        { id: 2, name: 'Bangkok Fulfillment Center', address: 'Sathorn Industrial Logistics Park', city: 'Bangkok' },
        { id: 3, name: 'Rayong Cross-Border Yard', address: 'Eastern Seaboard Freight Terminal', city: 'Rayong' }
      ];

      return res.status(200).json({
        success: true,
        status: true,
        data: branches,
        branches: branches
      });
    } catch (err) {
      console.error('[ThemePublicController.getBranches]', err);
      return sendError(res, err.message, 500);
    }
  },

  /**
   * POST /api/register
   * Public customer account registration for the storefront
   */
  async registerCustomer(req, res) {
    try {
      const { fullName, email, phone, password, memberType } = req.body;
      if (!email || !fullName) {
        return sendError(res, 'Full name and email are required.', 400);
      }

      // Check if email already registered in aura_users
      const [existingUsers] = await db.query('SELECT id FROM aura_users WHERE email = ? LIMIT 1', [email]);
      if (existingUsers.length > 0) {
        return sendError(res, 'An account with this email address already exists.', 409);
      }

      let hashedPassword = password || '123456';
      try {
        const bcrypt = require('bcryptjs');
        hashedPassword = await bcrypt.hash(password || '123456', 10);
      } catch (_) {}

      const username = email.split('@')[0] + '_' + Math.floor(100 + Math.random() * 900);
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || fullName;
      const lastName = nameParts.slice(1).join(' ') || '';

      // Always assign 'customer' role (group_id = 4) by default for storefront website registration
      const [groups] = await db.query(
        "SELECT id, name FROM aura_groups WHERE LOWER(name) = 'customer' LIMIT 1"
      );
      const customerGroupId = groups && groups.length > 0 ? Number(groups[0].id) : 4;

      // Insert customer user in aura_users with group_id = customerGroupId (customer role)
      const [userResult] = await db.query(`
        INSERT INTO aura_users (
          username, password, password_algo, email, first_name, last_name,
          phone, group_id, active, status, register_source, created_on, created_at
        ) VALUES (?, ?, 'bcrypt', ?, ?, ?, ?, ?, 1, 'active', 'website', UNIX_TIMESTAMP(), NOW())
      `, [username, hashedPassword, email, firstName, lastName, phone || '', customerGroupId]);

      const newUserId = userResult.insertId;

      // Also create a customer entry in aura_companies
      try {
        await db.query(`
          INSERT INTO aura_companies (group_id, group_name, customer_group_id, customer_group_name, name, company, email, phone)
          VALUES (?, 'customer', 1, 'General', ?, ?, ?, ?)
        `, [customerGroupId, fullName, fullName, email, phone || '']);
      } catch (_) {}

      // Sync to RBAC users and user_group_mappings table if present
      try {
        const crypto = require('crypto');
        const userUuid = crypto.randomUUID ? crypto.randomUUID() : `usr-${Date.now()}-${Math.floor(Math.random()*1000)}`;
        const [uRes] = await db.query(`
          INSERT INTO users (uuid, username, email, password_hash, first_name, last_name, phone, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
        `, [userUuid, username, email, hashedPassword, firstName, lastName, phone || '']);

        const [ugRows] = await db.query("SELECT id FROM user_groups WHERE code = 'CUSTOMER' LIMIT 1");
        if (ugRows && ugRows.length > 0) {
          await db.query(`
            INSERT INTO user_group_mappings (user_id, group_id, assigned_by)
            VALUES (?, ?, ?)
          `, [uRes.insertId, ugRows[0].id, uRes.insertId]);
        }
      } catch (_) {}

      let token = `aura_jwt_${newUserId}_${Date.now()}`;
      try {
        const jwt = require('jsonwebtoken');
        const { access_token_key } = require('../../config/utill/helper');
        token = jwt.sign(
          { id: newUserId, username, email, group_id: customerGroupId, role: 'customer', area: 'website' },
          access_token_key || 'secret',
          { expiresIn: '7d' }
        );
      } catch (_) {}

      const userProfile = {
        id: newUserId,
        name: fullName,
        username,
        email,
        phone: phone || '',
        role: 'customer',
        group_id: customerGroupId,
        token
      };

      return res.status(201).json({
        success: true,
        status: true,
        message: 'Account successfully registered with customer role!',
        data: userProfile,
        user: userProfile,
        token
      });
    } catch (err) {
      console.error('[ThemePublicController.registerCustomer]', err);
      return sendError(res, err.message, 500);
    }
  },

  /**
   * GET /api/billers (Stores & Corporate Billers)
   * Strictly aura_companies where group_name = 'biller' and (group_id IS NULL or group_id = 0)
   */
  async getBillers(req, res) {
    try {
      let filterSql = "WHERE c.group_name = 'biller'";
      const params = [];

      // Check scoping for standard biller user
      const isSuperAdmin = req.user && (Number(req.user.group_id) === 1 || Number(req.user.group_id) === 2 || req.user.role === 'owner' || req.user.role === 'admin');
      if (req.user && !isSuperAdmin && req.user.biller_id) {
        filterSql += " AND c.id = ?";
        params.push(req.user.biller_id);
      }

      const [billers] = await db.query(`
        SELECT 
          c.id, c.code, c.name, c.company, c.name_kh, c.company_kh, c.slug, c.address, c.address_kh,
          c.warehouse_id, w.name AS warehouse_name, w.code AS warehouse_code,
          c.phone, c.email, c.city, c.country, c.logo, c.logo_url, c.banner,
          c.vat_no, c.theme_color,
          c.currency_code, c.currency_symbol, c.rating, c.reviews_count,
          c.operating_hours,
          COUNT(DISTINCT pr.project_id) AS projects_count,
          COUNT(DISTINCT p.id) AS products_count
        FROM aura_companies c
        LEFT JOIN aura_warehouses w ON w.id = c.warehouse_id
        LEFT JOIN aura_projects pr ON pr.biller_id = c.id
        LEFT JOIN aura_products p ON p.biller_id = c.id
        ${filterSql}
        GROUP BY c.id, c.warehouse_id, w.name, w.code
        ORDER BY c.id ASC
      `, params);

      return sendSuccess(res, billers, 'Billers fetched successfully');
    } catch (err) {
      console.error('[ThemePublicController.getBillers]', err);
      return sendError(res, 'Failed to fetch billers: ' + err.message, 500);
    }
  },

  /**
   * GET /api/projects
   * Projects by biller_id (aura_projects where biller_id = companies.id)
   */
  async getProjects(req, res) {
    try {
      const { biller_id, status } = req.query;
      let sql = `
        SELECT 
          p.project_id, p.project_name, p.project_code, p.biller_id,
          c.name AS biller_name, c.company AS biller_company,
          p.start_date, p.end_date, p.target, p.description, p.status, p.approve_status
        FROM aura_projects p
        LEFT JOIN aura_companies c ON c.id = p.biller_id
        WHERE 1=1
      `;
      const params = [];

      if (biller_id && biller_id !== 'all') {
        sql += ' AND p.biller_id = ?';
        params.push(biller_id);
      }

      if (status && status !== 'all') {
        sql += ' AND p.status = ?';
        params.push(status);
      }

      sql += ' ORDER BY p.project_id ASC';

      const [projects] = await db.query(sql, params);
      return sendSuccess(res, projects, 'Projects fetched successfully');
    } catch (err) {
      console.error('[ThemePublicController.getProjects]', err);
      return sendError(res, 'Failed to fetch projects: ' + err.message, 500);
    }
  },

  /**
   * GET /api/units
   */
  async getUnits(req, res) {
    try {
      const [units] = await db.query(`SELECT id, code, name FROM aura_units ORDER BY id ASC`);
      return sendSuccess(res, units, 'Units fetched successfully');
    } catch (err) {
      return sendSuccess(res, [
        { id: 1, code: 'pc', name: 'Piece (pc)' },
        { id: 2, code: 'box', name: 'Box' },
        { id: 3, code: 'kg', name: 'Kilogram (kg)' },
        { id: 4, code: 'pack', name: 'Pack' },
        { id: 5, code: 'case', name: 'Case / Carton' }
      ], 'Units fallback');
    }
  },

  /**
   * GET /api/warehouses
   */
  async getWarehouses(req, res) {
    try {
      const [wh] = await db.query(`SELECT id, code, name, address FROM aura_warehouses ORDER BY id ASC`);
      return sendSuccess(res, wh, 'Warehouses fetched successfully');
    } catch (err) {
      return sendSuccess(res, [
        { id: 1, code: 'HQ', name: 'Central Warehouse Phnom Penh' },
        { id: 2, code: 'W2', name: 'Showroom Store' }
      ], 'Warehouses fallback');
    }
  },

  /**
   * POST /api/products (Create Product with all multi-tab fields)
   */
  async createProduct(req, res) {
    try {
      const {
        name,
        code,
        barcode,
        type = 'standard',
        category_id,
        unit = 1,
        purchase_unit = 1,
        sale_unit = 1,
        currency = 'DOLLAR',
        price = 0,
        cost = 0,
        biller_id,
        project_id,
        image,
        gallery = [],
        item_code,
        serial_no,
        max_serial,
        batch_numer,
        second_name,
        weight,
        barcode_symbology = 'Code128',
        brand,
        tax_rate,
        tax_method = 'exclusive',
        alert_quantity = 10,
        expiry_alert_days,
        stock_type,
        details,
        product_details,
        supplier1,
        supplier1price,
        supplier1_part_no,
        promotion,
        promo_price,
        start_date,
        end_date,
        variants = [],
        quantity = 50,
        warehouse_id = 1
      } = req.body;

      if (!name) {
        return sendError(res, 'Product name is required', 400);
      }

      const generatedCode = code || barcode || `PRD-${Date.now().toString().slice(-6)}`;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

      const [insertResult] = await db.query(`
        INSERT INTO aura_products (
          code, name, type, category_id, unit, purchase_unit, sale_unit, currency,
          price, cost, biller_id, project_id, image, slug, item_code, serial_no,
          max_serial, batch_numer, second_name, weight, barcode_symbology, brand,
          tax_rate, tax_method, alert_quantity, expiry_alert_days, stock_type,
          details, product_details, supplier1, supplier1price, supplier1_part_no,
          promotion, promo_price, start_date, end_date, status
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, 1
        )
      `, [
        generatedCode, name, type, category_id || 1, unit, purchase_unit, sale_unit, currency,
        price, cost, biller_id || 3, project_id || null, image || '', slug, item_code || '', serial_no || '',
        max_serial || '', batch_numer || '', second_name || '', weight || '', barcode_symbology, brand || null,
        tax_rate || null, tax_method, alert_quantity, expiry_alert_days || null, stock_type || null,
        details || '', product_details || '', supplier1 || '', supplier1price || 0, supplier1_part_no || '',
        promotion ? 1 : 0, promo_price || null, start_date || null, end_date || null
      ]);

      const newProductId = insertResult.insertId;

      // Warehouse Stock
      await db.query(`
        INSERT INTO aura_warehouses_products (product_id, warehouse_id, quantity, avg_cost)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), avg_cost = VALUES(avg_cost)
      `, [newProductId, warehouse_id, quantity, cost]);

      // Gallery Photos
      if (Array.isArray(gallery) && gallery.length > 0) {
        for (const photoUrl of gallery) {
          if (photoUrl && String(photoUrl).trim()) {
            await db.query(`INSERT INTO aura_product_photos (product_id, photo) VALUES (?, ?)`, [newProductId, String(photoUrl).trim()]);
          }
        }
      }

      // Variants
      if (Array.isArray(variants) && variants.length > 0) {
        for (const v of variants) {
          if (v && v.name) {
            await db.query(`
              INSERT INTO aura_product_variants (product_id, name, cost, price, quantity)
              VALUES (?, ?, ?, ?, ?)
            `, [newProductId, v.name, cost, v.price || price, v.quantity || 10]);
          }
        }
      }

      return sendSuccess(res, {
        id: newProductId,
        code: generatedCode,
        name,
        slug,
        price,
        biller_id,
        project_id
      }, 'Product created successfully', null, 201);
    } catch (err) {
      console.error('[ThemePublicController.createProduct]', err);
      return sendError(res, 'Failed to create product: ' + err.message, 500);
    }
  },

  /**
   * PUT /api/products/:id (Update Product)
   */
  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;

      const [existing] = await db.query('SELECT id FROM aura_products WHERE id = ?', [id]);
      if (!existing || existing.length === 0) {
        return sendError(res, 'Product not found', 404);
      }

      const updates = [];
      const params = [];

      const allowedFields = [
        'name', 'code', 'type', 'category_id', 'unit', 'purchase_unit', 'sale_unit',
        'currency', 'price', 'cost', 'biller_id', 'project_id', 'image', 'item_code',
        'serial_no', 'max_serial', 'batch_numer', 'second_name', 'weight', 'barcode_symbology',
        'brand', 'tax_rate', 'tax_method', 'alert_quantity', 'expiry_alert_days', 'stock_type',
        'details', 'product_details', 'supplier1', 'supplier1price', 'supplier1_part_no',
        'promotion', 'promo_price', 'start_date', 'end_date', 'featured', 'status'
      ];

      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          updates.push(`${field} = ?`);
          params.push(data[field]);
        }
      }

      if (updates.length > 0) {
        params.push(id);
        await db.query(`UPDATE aura_products SET ${updates.join(', ')} WHERE id = ?`, params);
      }

      // Update gallery if supplied
      if (Array.isArray(data.gallery)) {
        await db.query('DELETE FROM aura_product_photos WHERE product_id = ?', [id]);
        for (const p of data.gallery) {
          if (p && String(p).trim()) {
            await db.query('INSERT INTO aura_product_photos (product_id, photo) VALUES (?, ?)', [id, String(p).trim()]);
          }
        }
      }

      // Update stock if supplied
      if (data.quantity !== undefined) {
        await db.query(`
          INSERT INTO aura_warehouses_products (product_id, warehouse_id, quantity, avg_cost)
          VALUES (?, 1, ?, ?)
          ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)
        `, [id, data.quantity, data.cost || 0]);
      }

      return sendSuccess(res, 'Product updated successfully', { id, ...data });
    } catch (err) {
      console.error('[ThemePublicController.updateProduct]', err);
      return sendError(res, 'Failed to update product: ' + err.message, 500);
    }
  }
};

module.exports = ThemePublicController;
