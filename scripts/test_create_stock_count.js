const axios = require('axios');

async function testCreate() {
  try {
    const payload = {
      warehouse_id: 1,
      date: new Date().toISOString(),
      reference_no: '',
      type: 'full',
      categories: [],
      brands: [],
      note: 'Test stock count'
    };
    const res = await axios.post('http://localhost:3000/api/admin/products/stock-counts', payload);
    console.log('Success:', res.data);
  } catch (err) {
    console.error('Error Status:', err.response?.status);
    console.error('Error Data:', err.response?.data);
    console.error('Error Message:', err.message);
  }
  process.exit(0);
}

testCreate();
