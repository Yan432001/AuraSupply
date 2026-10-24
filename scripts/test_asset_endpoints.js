const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    }).on('error', reject);
  });
}

async function test() {
  console.log('Testing Asset API Endpoints:');

  const dash = await get('/api/admin/assets/dashboard');
  console.log('1. Dashboard:', dash.status, dash.body.status, 'Total assets:', dash.body.data?.summary?.total_assets);

  const code = await get('/api/admin/assets/next-code');
  console.log('2. Next Code:', code.status, code.body.data?.asset_code);

  const list = await get('/api/admin/assets');
  console.log('3. Asset List:', list.status, list.body.data?.length, 'records');

  const cats = await get('/api/admin/assets/categories');
  console.log('4. Categories:', cats.status, cats.body.data?.length, 'categories');

  const assigns = await get('/api/admin/assets/assignments');
  console.log('5. Assignments:', assigns.status, assigns.body.data?.length, 'assignments');

  const trans = await get('/api/admin/assets/transfers');
  console.log('6. Transfers:', trans.status, trans.body.data?.length, 'transfers');

  const maint = await get('/api/admin/assets/maintenances');
  console.log('7. Maintenances:', maint.status, maint.body.data?.length, 'maintenances');

  const depr = await get('/api/admin/assets/depreciation');
  console.log('8. Depreciation:', depr.status, 'Total book value:', depr.body.data?.totals?.total_net_book_value);

  const rep = await get('/api/admin/assets/reports?type=by_category');
  console.log('9. Reports (by_category):', rep.status, rep.body.data?.data?.length, 'rows');
}

test().catch(console.error);
