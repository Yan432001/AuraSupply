const axios = require('axios');
const BASE_URL = 'http://127.0.0.1:3000';

async function testInventory() {
  console.log('===============================================================');
  console.log('🧪 TESTING INVENTORY & VARIANT SYSTEM BACKEND ENDPOINTS');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, extra = '') {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message} ${extra ? `(${extra})` : ''}`);
      failed++;
    }
  }

  // Login as admin first
  let adminToken = null;
  try {
    const loginRes = await axios.post(`${BASE_URL}/api/admin/auth/login`, {
      username: 'admin',
      password: 'admin'
    });
    adminToken = loginRes.data?.token || loginRes.data?.data?.token;
  } catch (e) {
    console.error('Admin login error:', e.message);
  }

  const authHeaders = {
    headers: { Authorization: `Bearer ${adminToken}` }
  };

  // 1. Get Attributes
  console.log('\n--- 1. Testing Reusable Attributes ---');
  try {
    const attrRes = await axios.get(`${BASE_URL}/api/admin/attributes`, authHeaders);
    assert(attrRes.status === 200 && Array.isArray(attrRes.data.data), 'GET /api/admin/attributes returns array of attributes');
    const colorAttr = attrRes.data.data.find(a => a.code === 'color');
    assert(Boolean(colorAttr) && colorAttr.values.length > 0, 'Color attribute exists with seeded values (Red, Blue, etc.)');
  } catch (err) {
    console.error('Attributes error:', err.message);
  }

  // 2. Generate Variant Combinations
  console.log('\n--- 2. Testing Variant Combination Generator ---');
  try {
    const genRes = await axios.post(`${BASE_URL}/api/admin/attributes/generate-combinations`, {
      attributeSelections: [
        { name: 'Color', values: ['Red', 'Blue'] },
        { name: 'Size', values: ['Small', 'Medium'] }
      ],
      baseSku: 'TSHIRT-TEST',
      basePrice: 20,
      baseCost: 8
    }, authHeaders);
    assert(genRes.status === 200 && genRes.data.data.length === 4, 'Cartesian generator creates 4 valid combinations (Red/Small, Red/Medium, Blue/Small, Blue/Medium)');
    assert(genRes.data.data[0].sku === 'TSHIRT-TEST-RED-SMALL', 'Variant SKU automatically derived correctly: ' + genRes.data.data[0].sku);
    assert(genRes.data.data[0].attributes?.Color === 'Red', 'Attributes dictionary preserved correctly: ' + JSON.stringify(genRes.data.data[0].attributes));
  } catch (err) {
    console.error('Generator error:', err.message);
  }

  // 3. Create Product with Multiple Variants
  console.log('\n--- 3. Creating Product with Variants ---');
  const timestamp = Date.now();
  const parentSku = `TSHIRT-${timestamp}`;
  let createdProductId = null;
  let variantId1 = null;
  let variantId2 = null;

  try {
    const createRes = await axios.post(`${BASE_URL}/api/admin/products`, {
      name: `Aura Organic T-Shirt ${timestamp}`,
      code: parentSku,
      category_id: 1,
      unit: 1,
      price: 25.00,
      cost: 10.00,
      alert_quantity: 5,
      warehouse_id: 1,
      variants: [
        {
          name: 'Red / Small',
          sku: `${parentSku}-RED-S`,
          barcode: `${parentSku}-RED-S`,
          price: 25.00,
          cost: 10.00,
          quantity: 20,
          attributes: { Color: 'Red', Size: 'Small' }
        },
        {
          name: 'Blue / Medium',
          sku: `${parentSku}-BLU-M`,
          barcode: `${parentSku}-BLU-M`,
          price: 27.00,
          cost: 11.00,
          quantity: 15,
          attributes: { Color: 'Blue', Size: 'Medium' }
        }
      ]
    }, authHeaders);

    const prodData = createRes.data?.data;
    assert(createRes.status === 201 && prodData?.id, 'Product created successfully with 2 variants');
    createdProductId = prodData?.id;
    assert(prodData?.quantity === 35, `Parent total quantity correctly sums variants: ${prodData?.quantity} (expected 35)`);
    assert(prodData?.variants?.length === 2, 'Response includes populated variants list');
    variantId1 = prodData?.variants[0]?.id;
    variantId2 = prodData?.variants[1]?.id;
  } catch (err) {
    console.error('Create product error:', err.response?.data || err.message);
  }

  // 4. Duplicate SKU & Combination Validation
  console.log('\n--- 4. Validating Duplicate SKU and Combination Rejection ---');
  try {
    const dupRes = await axios.post(`${BASE_URL}/api/admin/products`, {
      name: `Duplicate Attempt ${timestamp}`,
      code: parentSku, // Duplicate parent code!
      price: 15
    }, { ...authHeaders, validateStatus: () => true });
    assert(dupRes.status === 400, 'Rejects duplicate parent SKU');

    const dupComboRes = await axios.post(`${BASE_URL}/api/admin/products`, {
      name: `Duplicate Combo ${timestamp}`,
      code: `COMBO-${timestamp}`,
      price: 15,
      variants: [
        { name: 'Red / S', price: 15, quantity: 5 },
        { name: 'Red / S', price: 15, quantity: 5 } // Duplicate combination!
      ]
    }, { ...authHeaders, validateStatus: () => true });
    assert(dupComboRes.status === 400, 'Rejects duplicate variant combinations under the same product');
  } catch (err) {
    console.error('Validation error:', err.message);
  }

  // 5. Query Products with Filter & Search
  console.log('\n--- 5. Querying Products (Search, Warehouse, Variants) ---');
  try {
    const listRes = await axios.get(`${BASE_URL}/api/admin/products?search=${parentSku}`, authHeaders);
    const products = listRes.data?.data || [];
    assert(listRes.status === 200 && products.length > 0, 'Search finds product by parent SKU');
    const prod = products[0];
    assert(prod && prod.variant_count === 2, `Product reports correct variant count: ${prod?.variant_count}`);
    assert(prod && prod.variants?.length === 2, 'Product payload includes variant details with SKUs and prices');
  } catch (err) {
    console.error('List error:', err.message);
  }

  // 6. Receive Stock into Warehouse for Variant
  console.log('\n--- 6. Receiving Stock for Product Variant ---');
  try {
    const recRes = await axios.post(`${BASE_URL}/api/admin/inventory/receive`, {
      product_id: createdProductId,
      option_id: variantId1,
      warehouse_id: 1,
      quantity: 10,
      unit_cost: 10.00,
      note: 'Supplier delivery batch #99'
    }, authHeaders);
    assert(recRes.status === 201 && recRes.data.data?.received_quantity === 10, 'Stock received for variant (10 units)');

    // Verify updated product and variant quantity
    const updatedProdRes = await axios.get(`${BASE_URL}/api/admin/products/${createdProductId}`, authHeaders);
    const uProd = updatedProdRes.data?.data;
    assert(uProd && uProd.quantity === 45, `Parent total quantity incremented: ${uProd?.quantity} (expected 45)`);
    const updatedVar1 = uProd?.variants?.find(v => v.id === variantId1);
    assert(updatedVar1 && updatedVar1.quantity === 30, `Variant 1 quantity incremented: ${updatedVar1?.quantity} (expected 30)`);
  } catch (err) {
    console.error('Receive stock error:', err.response?.data || err.message);
  }

  // 7. Issue Stock & Prevent Negative Stock
  console.log('\n--- 7. Issuing Stock & Negative Stock Prevention ---');
  try {
    // Attempt to issue 999 units (exceeding stock)
    const overIssueRes = await axios.post(`${BASE_URL}/api/admin/inventory/issue`, {
      product_id: createdProductId,
      option_id: variantId1,
      warehouse_id: 1,
      quantity: 999
    }, { ...authHeaders, validateStatus: () => true });
    assert(overIssueRes.status === 400, 'Prevents negative stock when issuing more than available');

    // Valid issue: 5 units
    const validIssueRes = await axios.post(`${BASE_URL}/api/admin/inventory/issue`, {
      product_id: createdProductId,
      option_id: variantId1,
      warehouse_id: 1,
      quantity: 5,
      reason: 'VIP showroom sample'
    }, authHeaders);
    assert(validIssueRes.status === 200, 'Valid stock issuing succeeds (decremented by 5 units)');
  } catch (err) {
    console.error('Issue stock error:', err.message);
  }

  // 8. Stock Adjustment
  console.log('\n--- 8. Stock Adjustment with Audit Reason ---');
  try {
    const adjRes = await axios.post(`${BASE_URL}/api/admin/inventory/adjust`, {
      product_id: createdProductId,
      option_id: variantId2,
      warehouse_id: 1,
      type: 'subtraction',
      quantity: 2,
      reason: 'Damaged in warehouse storage'
    }, authHeaders);
    assert(adjRes.status === 200 && adjRes.data.data?.delta === -2, 'Stock adjustment subtraction recorded with reason');
  } catch (err) {
    console.error('Adjustment error:', err.message);
  }

  // 9. Stock Transfer Between Warehouses (Warehouse 1 to Warehouse 8)
  console.log('\n--- 9. Transfer Stock Between Warehouses ---');
  try {
    const trRes = await axios.post(`${BASE_URL}/api/admin/inventory/transfer`, {
      from_warehouse_id: 1,
      to_warehouse_id: 8,
      items: [
        { product_id: createdProductId, option_id: variantId1, quantity: 8 }
      ],
      note: 'Replenish Printing Warehouse W2'
    }, authHeaders);
    assert(trRes.status === 201 && trRes.data.data?.transfer_no, 'Inter-warehouse transfer executed with reference number: ' + trRes.data.data?.transfer_no);
  } catch (err) {
    console.error('Transfer error:', err.response?.data || err.message);
  }

  // 10. Warehouse Stock Balances Overview
  console.log('\n--- 10. Warehouse Stock Balances Overview ---');
  try {
    const whRes = await axios.get(`${BASE_URL}/api/admin/inventory/warehouse-stock`, authHeaders);
    assert(whRes.status === 200 && Array.isArray(whRes.data.data), 'Warehouse stock balances overview retrieved');
  } catch (err) {
    console.error('Warehouse stock error:', err.message);
  }

  // 11. Stock Movement Audit History
  console.log('\n--- 11. Stock Movement History & Audit Trail ---');
  try {
    const mvRes = await axios.get(`${BASE_URL}/api/admin/inventory/movements?product_id=${createdProductId}`, authHeaders);
    const moves = mvRes.data?.data || mvRes.data?.data?.movements || [];
    assert(mvRes.status === 200 && moves.length > 0, `Movement audit trail recorded ${moves.length} transactions for this product`);
  } catch (err) {
    console.error('Movement history error:', err.message);
  }

  // 12. Safe Deletion / Archival Protection
  console.log('\n--- 12. Safe Deletion & Archival Protection ---');
  try {
    const delRes = await axios.delete(`${BASE_URL}/api/admin/products/${createdProductId}`, authHeaders);
    assert(delRes.status === 200 && (delRes.data.data?.archived === true || delRes.data?.archived === true), 'Product with existing stock transactions is safely archived (marked inactive) rather than hard deleted');
  } catch (err) {
    console.error('Safe delete error:', err.message);
  }

  console.log('\n===============================================================');
  console.log(`📊 INVENTORY BACKEND SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) process.exit(1);
}

testInventory();
