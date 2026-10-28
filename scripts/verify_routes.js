const axios = require('axios');

async function testAll() {
  const tests = [
    { name: 'API Meta Options', url: 'http://127.0.0.1:3000/api/admin/stock_received/meta/options' },
    { name: 'API Products Stock Received', url: 'http://127.0.0.1:3000/api/admin/products/stock_received' },
    { name: 'API Stock Received Hyphen', url: 'http://127.0.0.1:3000/api/admin/products/stock-received' },
    { name: 'Web Admins Tab URL', url: 'http://127.0.0.1:3000/admins/products?tab=stock-received' },
    { name: 'Web Admin Stock Received URL', url: 'http://127.0.0.1:3000/admin/products/stock_received' },
    { name: 'Web Admin Add URL', url: 'http://127.0.0.1:3000/admin/products/stock_received/add' },
  ];

  for (const t of tests) {
    try {
      const res = await axios.get(t.url, { maxRedirects: 5 });
      console.log('[PASS] ' + t.name + ': Status ' + res.status);
    } catch (e) {
      console.error('[FAIL] ' + t.name + ':', e.response?.status || e.message);
    }
  }
}
testAll();
