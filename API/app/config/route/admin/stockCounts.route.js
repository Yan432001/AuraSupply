const {
  listStockCounts,
  getMetadataOptions,
  createStockCount,
  getStockCountById,
  updateStockCountItems,
  scanBarcodeItem,
  finalizeStockCount,
  convertCountToAdjustment,
  deleteStockCount,
  exportStockCountCSV,
  importStockCountCSV,
  getProductSuggestions
} = require('../../../controller/admin/stockCounts.controller');

module.exports = (app) => {
  // Stock Counts API (BPAS / AURA_v1 Concept)
  app.get('/api/admin/products/stock-counts/meta/options', getMetadataOptions);
  app.get('/api/admin/products/stock-counts', listStockCounts);
  app.post('/api/admin/products/stock-counts', createStockCount);
  app.get('/api/admin/products/stock-counts/:id', getStockCountById);
  app.put('/api/admin/products/stock-counts/:id/items', updateStockCountItems);
  app.post('/api/admin/products/stock-counts/:id/scan', scanBarcodeItem);
  app.post('/api/admin/products/stock-counts/:id/finalize', finalizeStockCount);
  app.post('/api/admin/products/stock-counts/:id/create-adjustment', convertCountToAdjustment);
  app.delete('/api/admin/products/stock-counts/:id', deleteStockCount);

  // CSV Import/Export & Suggestions (Matching AURA_v1 initial_file, finalize_count CSV, and product_count_suggestions)
  app.get('/api/admin/products/stock-counts/:id/export-csv', exportStockCountCSV);
  app.post('/api/admin/products/stock-counts/:id/import-csv', importStockCountCSV);
  app.get('/api/admin/products/stock-counts/:id/suggestions', getProductSuggestions);

  console.log('[Route] Mounted admin/stockCounts.route');
};
