const axios = require('axios');
const jwt = require('jsonwebtoken');
const { access_token_key } = require('../API/app/config/utill/helper');
const sessionService = require('../API/app/services/session.service');

const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || access_token_key || 'AURA_ERP_SECRET_TOKEN_2026';

async function runAccountingTests() {
  console.log('========================================================');
  console.log('🚀 TESTING ACCOUNTING & LEDGER BACKEND ENDPOINTS');
  console.log('========================================================\n');

  try {
    const userPayload = { id: 1, username: 'owner', email: 'owner@aurasupply.com', role: 'owner', isAdmin: true };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '1h' });
    await sessionService.registerSession({ userId: 1, token, area: 'admin', userAgent: 'Acc-Test', ipAddress: '127.0.0.1' });
    const headers = { Authorization: `Bearer ${token}`, Cookie: `admin_token=${token}` };

    // 1. Dashboard Metrics
    console.log('[Test 1] GET /api/admin/accounting/dashboard');
    const dashRes = await axios.get(`${BASE_URL}/api/admin/accounting/dashboard`, { headers });
    if (!dashRes.data?.status || !dashRes.data?.data) throw new Error('Dashboard metrics failed');
    const d = dashRes.data.data;
    console.log(`✔ Dashboard Metrics: Rev=$${d.revenue}, Exp=$${d.expenses}, Assets=$${d.assets}, Liabilities=$${d.liabilities}, NetProfit=$${d.netProfit}, CashBank=$${d.cashBankBalance}`);

    // 2. Account Sections & Accounts
    console.log('\n[Test 2] GET /api/admin/accounting/sections & /accounts');
    const secRes = await axios.get(`${BASE_URL}/api/admin/accounting/sections`, { headers });
    console.log(`✔ Fetched ${secRes.data?.data?.length} account sections`);

    const accRes = await axios.get(`${BASE_URL}/api/admin/accounting/accounts?limit=10`, { headers });
    console.log(`✔ Fetched ${accRes.data?.data?.length} accounts (Total in DB: ${accRes.data?.pagination?.total})`);

    // 3. Next Journal Reference
    console.log('\n[Test 3] GET /api/admin/accounting/journals/next-reference');
    const refRes = await axios.get(`${BASE_URL}/api/admin/accounting/journals/next-reference`, { headers });
    console.log(`✔ Next reference: ${refRes.data?.reference_no}`);

    // 4. Test Unbalanced Journal Rejection
    console.log('\n[Test 4] Testing unbalanced journal rejection...');
    let unbalancedBlocked = false;
    try {
      await axios.post(`${BASE_URL}/api/admin/accounting/journals`, {
        reference_no: refRes.data.reference_no,
        date: new Date().toISOString(),
        items: [
          { account_code: 100100, debit: 100, credit: 0 },
          { account_code: 201100, debit: 0, credit: 50 } // 100 != 50
        ]
      }, { headers });
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message?.includes('unbalanced')) {
        unbalancedBlocked = true;
        console.log(`✔ Unbalanced journal rejected properly with 400: "${err.response.data.message}"`);
      }
    }
    if (!unbalancedBlocked) throw new Error('Server failed to reject unbalanced journal entry!');

    // 5. Test Balanced Journal Creation
    console.log('\n[Test 5] POST /api/admin/accounting/journals (Balanced entry)');
    const balancedRes = await axios.post(`${BASE_URL}/api/admin/accounting/journals`, {
      reference_no: refRes.data.reference_no,
      date: new Date().toISOString(),
      note: 'Automated Test Journal Entry',
      items: [
        { account_code: 100102, debit: 250, credit: 0, description: 'Cash deposit on hand' },
        { account_code: 301100, debit: 0, credit: 250, description: 'Owner investment equity' }
      ]
    }, { headers });
    const journalId = balancedRes.data?.data?.journal_id;
    console.log(`✔ Journal created successfully with ID #${journalId}`);

    // 6. Test General Ledger Statement
    console.log('\n[Test 6] GET /api/admin/accounting/ledger?account_code=100102');
    const glRes = await axios.get(`${BASE_URL}/api/admin/accounting/ledger?account_code=100102`, { headers });
    console.log(`✔ GL fetched: Account "${glRes.data?.data?.account?.accountname}", Closing Balance: $${glRes.data?.data?.closing_balance}`);

    // 7. Test Financial Reports
    console.log('\n[Test 7] Financial Reports (Trial Balance, P&L, Balance Sheet)');
    const tbRes = await axios.get(`${BASE_URL}/api/admin/accounting/reports/trial-balance`, { headers });
    console.log(`✔ Trial Balance: Total Debit=$${tbRes.data?.data?.total_debit}, Total Credit=$${tbRes.data?.data?.total_credit}, Balanced=${tbRes.data?.data?.is_balanced}`);

    const plRes = await axios.get(`${BASE_URL}/api/admin/accounting/reports/income-statement`, { headers });
    console.log(`✔ Income Statement: Revenue=$${plRes.data?.data?.revenue?.total}, Expenses=$${plRes.data?.data?.operatingExpenses?.total}, NetProfit=$${plRes.data?.data?.netProfit}`);

    const bsRes = await axios.get(`${BASE_URL}/api/admin/accounting/reports/balance-sheet`, { headers });
    console.log(`✔ Balance Sheet: Total Assets=$${bsRes.data?.data?.assets?.total}, Total Liab & Equity=$${bsRes.data?.data?.totalLiabilitiesAndEquity}`);

    // 8. Clean up test journal
    console.log('\n[Test 8] DELETE /api/admin/accounting/journals/:id');
    await axios.delete(`${BASE_URL}/api/admin/accounting/journals/${journalId}`, { headers });
    console.log(`✔ Test journal #${journalId} cleaned up successfully`);

    console.log('\n========================================================');
    console.log('🎉 ALL ACCOUNTING BACKEND TESTS PASSED SUCCESSFULLY!');
    console.log('========================================================\n');
  } catch (err) {
    console.error('❌ Test failed:', err.message, err.response?.data);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runAccountingTests();
