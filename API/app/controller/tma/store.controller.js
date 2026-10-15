const EMenuModel = require('../../models/emenu.model');
const rawSimpleData = require('../../../../data/simpleData');
const simpleData = rawSimpleData.default || rawSimpleData;

const StoreController = {
  /**
   * Get all stores for the Store Selection screen:
   * Displays store name, store image/logo, location, address, open/closed status, available products count
   */
  async getStores(req, res) {
    try {
      const storesWithCounts = simpleData.stores.map((store) => {
        const storeProducts = simpleData.products.filter((p) => Number(p.biller_id) === Number(store.id));
        const storeCategoryIds = new Set(storeProducts.map((p) => p.category_id));
        const storeCategories = simpleData.categories.filter((c) => storeCategoryIds.has(c.id));

        return {
          ...store,
          productsCount: storeProducts.length,
          categoriesCount: storeCategories.length,
          categoriesSample: storeCategories.map((c) => c.name).slice(0, 3)
        };
      });

      return res.status(200).json({
        status: true,
        data: storesWithCounts,
        stores: storesWithCounts
      });
    } catch (err) {
      return res.status(500).json({ status: false, error: err.message });
    }
  },

  async getStore(req, res) {
    try {
      const { slug } = req.params;
      const store =
        (await EMenuModel.getStoreBySlug(slug)) ||
        (await EMenuModel.getStoreByIdentifier(slug)) ||
        simpleData.stores.find((s) => s.slug === slug || String(s.id) === String(slug));

      if (!store) return res.status(404).json({ status: false, message: 'Store not found' });

      // Multi-Store Data Isolation: strictly products and categories for this store!
      const storeProducts = simpleData.products.filter(
        (p) => Number(p.biller_id) === Number(store.id)
      );

      const storeCategoryIds = new Set(storeProducts.map((p) => p.category_id));
      const storeCategories = simpleData.categories.filter((c) => storeCategoryIds.has(c.id));

      res.json({
        status: true,
        data: store,
        store: {
          ...store,
          logoUrl: store.logo
        },
        products: storeProducts,
        categories: storeCategories
      });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  },

  async resolveBiller(req, res) {
    try {
      const { id } = req.params;
      const store =
        (await EMenuModel.getStoreByBillerId(id)) ||
        simpleData.stores.find((s) => Number(s.id) === Number(id));

      if (!store || !store.slug) return res.status(404).json({ status: false, message: 'Biller or store mapping not found' });
      res.json({ status: true, slug: store.slug });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  },

  async getCategories(req, res) {
    try {
      const { slug } = req.params;
      const store =
        (await EMenuModel.getStoreBySlug(slug)) ||
        simpleData.stores.find((s) => s.slug === slug || String(s.id) === String(slug));

      if (!store) return res.status(404).json({ status: false, message: 'Store not found' });

      const storeProducts = simpleData.products.filter((p) => Number(p.biller_id) === Number(store.id));
      const storeCategoryIds = new Set(storeProducts.map((p) => p.category_id));
      const storeCategories = simpleData.categories.filter((c) => storeCategoryIds.has(c.id));

      res.json({ status: true, data: storeCategories });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  },

  async getProducts(req, res) {
    try {
      const { slug } = req.params;
      const store =
        (await EMenuModel.getStoreBySlug(slug)) ||
        simpleData.stores.find((s) => s.slug === slug || String(s.id) === String(slug));

      if (!store) return res.status(404).json({ status: false, message: 'Store not found' });

      const categoryId = req.query.category ? Number(req.query.category) : null;
      const query = (req.query.q || '').toLowerCase();

      // Multi-Store Isolation: Only products belonging to this store
      let filtered = simpleData.products.filter((p) => Number(p.biller_id) === Number(store.id));

      if (categoryId) {
        filtered = filtered.filter((p) => Number(p.category_id) === categoryId);
      }

      if (query) {
        filtered = filtered.filter(
          (p) =>
            (p.name || '').toLowerCase().includes(query) ||
            (p.details || '').toLowerCase().includes(query) ||
            (p.code || '').toLowerCase().includes(query)
        );
      }

      res.json({
        status: true,
        data: filtered,
        products: filtered,
        meta: {
          total: filtered.length
        }
      });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  }
};

module.exports = StoreController;
