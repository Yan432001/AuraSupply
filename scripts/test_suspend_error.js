const axios = require('axios');

async function testSuspend() {
  try {
    const res = await axios.post('http://localhost:3000/api/admin/pos/suspend', {
      customer_id: 2,
      customer: 'General Customer',
      table_id: 1,
      table_name: 'Table 1',
      sub_bill_name: 'Group A',
      suspend_note: 'Table 1 (Group A)',
      items: [
        {
          id: 227,
          code: 'PRD-CLO-04',
          name: '13.5oz Japanese Selvedge Raw Denim Jeans',
          quantity: 2,
          unit_price: 25,
          price: 25,
          unit_code: 'pcs'
        }
      ],
      total: 50,
      biller_id: 1,
      warehouse_id: 1,
      user_id: 1,
    });
    console.log('Response:', res.data);
  } catch (err) {
    console.error('Status:', err.response?.status);
    console.error('Error data:', err.response?.data);
  }
}

testSuspend();
