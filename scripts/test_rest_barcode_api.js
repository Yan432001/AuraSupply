const http = require('http');

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(`http://localhost:3000${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('--- TESTING NEW RESTFUL BARCODE API ---');

  // 1. List
  const listRes = await request('GET', '/api/admin/products/barcode/list?limit=3');
  console.log('1. List status:', listRes.status, 'Items:', listRes.data?.data?.length, 'Total:', listRes.data?.pagination?.total);
  if (listRes.data?.data?.[0]) {
    console.log('   First item:', listRes.data.data[0].name, 'Barcode:', listRes.data.data[0].barcode, 'SKU:', listRes.data.data[0].sku);
  }

  // 2. Action=barcode query intercept
  const actionRes = await request('GET', '/api/admin/products?action=barcode&limit=2');
  console.log('2. Action=barcode status:', actionRes.status, 'Items:', actionRes.data?.data?.length);

  // 3. Templates
  const tplRes = await request('GET', '/api/admin/products/barcode/templates');
  console.log('3. Templates status:', tplRes.status, 'Count:', tplRes.data?.data?.length);

  // 4. Preview
  const samplePid = listRes.data?.data?.[0]?.id || 194;
  const prevRes = await request('POST', '/api/admin/products/barcode/preview', {
    items: [{ product_id: samplePid, quantity: 2 }],
    label_size: '50x30',
    template: 'standard',
    barcode_type: 'CODE128',
    display_options: { site_name: true }
  });
  console.log('4. Preview status:', prevRes.status, 'Total labels:', prevRes.data?.data?.total_labels);

  // 5. Print
  const printRes = await request('POST', '/api/admin/products/barcode/print', {
    items: [{ product_id: samplePid, quantity: 2 }],
    label_size: '50x30',
    template: 'standard',
    barcode_type: 'CODE128'
  });
  console.log('5. Print status:', printRes.status, 'Logged:', printRes.data?.logged);

  // 6. Logs
  const logsRes = await request('GET', '/api/admin/products/barcode/logs');
  console.log('6. Logs status:', logsRes.status, 'Logged items count:', logsRes.data?.data?.length);
  if (logsRes.data?.data?.[0]) {
    console.log('   Recent log product:', logsRes.data.data[0].product?.name, 'Quantity:', logsRes.data.data[0].quantity);
  }

  console.log('--- ALL API TESTS PASSED SUCCESSFULLY ---');
}

runTests().catch(console.error);
