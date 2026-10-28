const axios = require('axios');

async function testConsignmentsRoutes() {
  const tests = [
    { name: 'API Consignments Meta', url: 'http://127.0.0.1:3000/api/admin/consignments/meta/options' },
    { name: 'API Products Consignments List', url: 'http://127.0.0.1:3000/api/admin/products/consignments' },
    { name: 'Web Tab URL (?tab=consignments)', url: 'http://127.0.0.1:3000/admins/products?tab=consignments' },
    { name: 'Web Direct URL (/admin/products/consignments)', url: 'http://127.0.0.1:3000/admin/products/consignments' },
    { name: 'Web Add URL (/admin/products/consignments/add)', url: 'http://127.0.0.1:3000/admin/products/consignments/add' },
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

testConsignmentsRoutes();
