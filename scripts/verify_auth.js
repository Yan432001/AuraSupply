const http = require('http');

function post(port, path, body) {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: '127.0.0.1',
      port: port,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(buf) });
        } catch (_) {
          resolve({ status: res.statusCode, raw: buf.slice(0, 100) });
        }
      });
    });
    req.on('error', err => resolve({ error: err.message }));
    req.write(data);
    req.end();
  });
}

async function verifyAll() {
  console.log('=== VERIFYING AUTHENTICATION ON PORT 3000 (DIRECT BACKEND) ===');
  
  const tests = [
    { name: 'Admin Login: heanyan1@gmail.com / Sbc@12345', path: '/api/admin/auth/login', body: { username: 'heanyan1@gmail.com', password: 'Sbc@12345' } },
    { name: 'Admin Login: sbcsolutions / Sbc@12345', path: '/api/admin/auth/login', body: { username: 'sbcsolutions', password: 'Sbc@12345' } },
    { name: 'Admin Login: admin / admin', path: '/api/admin/auth/login', body: { username: 'admin', password: 'admin' } },
    { name: 'Web Login: heanyan1@gmail.com / Sbc@12345', path: '/api/web/auth/login', body: { login: 'heanyan1@gmail.com', password: 'Sbc@12345' } },
    { name: 'Web Login: sbcsolutions / Sbc@12345', path: '/api/web/auth/login', body: { login: 'sbcsolutions', password: 'Sbc@12345' } },
    { name: 'Web Login: admin / admin', path: '/api/web/auth/login', body: { login: 'admin', password: 'admin' } },
  ];

  for (const t of tests) {
    const r = await post(3000, t.path, t.body);
    const ok = r.status === 200 && (r.body?.success || r.body?.status);
    console.log(`[Port 3000] ${t.name}: Status ${r.status} -> ${ok ? '✓ PASS' : '✗ FAIL'} (${r.body?.message || r.error})`);
    if (r.body?.data?.redirectTo) {
      console.log(`   -> Redirect Target: ${r.body.data.redirectTo}`);
    }
  }

  console.log('\n=== VERIFYING AUTHENTICATION ON PORT 5173 (VITE PROXY) ===');
  for (const t of tests) {
    const r = await post(5173, t.path, t.body);
    const ok = r.status === 200 && (r.body?.success || r.body?.status);
    console.log(`[Port 5173] ${t.name}: Status ${r.status} -> ${ok ? '✓ PASS' : '✗ FAIL'} (${r.body?.message || r.error})`);
  }
}

verifyAll();
