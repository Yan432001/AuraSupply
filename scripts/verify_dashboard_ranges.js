const axios = require('axios');
const jwt = require('jsonwebtoken');
const { access_token_key } = require('../API/app/config/utill/helper');

const JWT_SECRET = process.env.JWT_SECRET || access_token_key || 'AURA_ERP_SECRET_TOKEN_2026';

async function verifyRanges() {
  const token = jwt.sign({ id: 1, username: 'admin', role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
  const ranges = ['today', '7d', 'week', 'month', '30d'];

  for (const r of ranges) {
    try {
      const res = await axios.get(`http://localhost:3000/api/admin/dashboard?range=${r}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`Range '${r}': HTTP ${res.status}, Revenue: $${res.data?.data?.kpis?.revenue?.value}, Orders: ${res.data?.data?.kpis?.orders?.value}`);
    } catch (err) {
      console.error(`Range '${r}' failed:`, err.response?.status, err.response?.data?.message || err.message);
    }
  }
}

verifyRanges();
