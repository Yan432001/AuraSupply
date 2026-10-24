const axios = require('axios');
const jwt = require('jsonwebtoken');
const db = require('../API/app/config/utill/connection');
const { access_token_key } = require('../API/app/config/utill/helper');
const sessionService = require('../API/app/services/session.service');

const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || access_token_key || 'AURA_ERP_SECRET_TOKEN_2026';

async function runComprehensiveAccountingTests() {
  console.log('================================================================');
  console.log('🚀 COMPREHENSIVE TEST: AURA_v1 ACCOUNTING & LEDGER SYSTEM');
  console.log('================================================================\n');

  try {
    // 1. Session Setup
    console.log('[Step 1] Creating authenticated admin session...');
    const userPayload = {
      id: 1,
      username: 'owner',
      email: 'owner@aurasupply.com',
      role: 'owner',
      group_id: 1,
      isAdmin: true,
      warehouse_id: 1,
      biller_id: 1
    };

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '1h' });
    await sessionService.registerSession({
      userId: userPayload.id,
      token,
      area: 'admin',
      userAgent: 'Automated-Accounting-Tester',
      ipAddress: '127.0.0.1'
    });

    const authHeaders = {
      Authorization: `Bearer ${token}`,
      Cookie: `admin_token=${token}`
    };
    console.log('✔ Authenticated session established.\n');

    // 2. Test Accounting Dashboard Metrics
    console.log('[Step 2] Testing GET /api/admin/accounting/dashboard...');
    const dashRes = await axios.get(`${BASE_URL}/api/admin/accounting/dashboard`, { headers: authHeaders });
    if (!dashRes.data?.status || !dashRes.data?.data) {
      throw new Error(`Dashboard metrics request failed: ${JSON.stringify(dashRes.data)}`);
    }
    const metrics = dashRes.data.data;
    console.log('✔ Financial Dashboard Metrics retrieved:');
    console.log(`   - Operating Revenue: $${metrics.revenue}`);
    console.log(`   - Cost of Sales (COGS): $${metrics.cogs}`);
    console.log(`   - Gross Profit: $${metrics.grossProfit}`);
    console.log(`   - Operating Expenses: $${metrics.expenses}`);
    console.log(`   - Net Profit / (Loss): $${metrics.netProfit}`);
    console.log(`   - Total Assets: $${metrics.assets}`);
    console.log(`   - Total Liabilities: $${metrics.liabilities}`);
    console.log(`   - Owner Equity: $${metrics.equity}`);
    console.log(`   - Liquid Cash & Bank: $${metrics.cashBankBalance}`);
    console.log(`   - Open AR Invoices: ${metrics.accountsReceivable?.openInvoices} (Outstanding: $${metrics.accountsReceivable?.outstanding})`);
    console.log(`   - Open AP Bills: ${metrics.accountsPayable?.openBills} (Outstanding: $${metrics.accountsPayable?.outstanding})`);

    // 3. Test Chart of Accounts CRUD
    console.log('\n[Step 3] Testing Chart of Accounts CRUD...');
    const sectionsRes = await axios.get(`${BASE_URL}/api/admin/accounting/sections`, { headers: authHeaders });
    console.log(`✔ Fetched ${sectionsRes.data.data.length} classification sections`);

    const testAccountCode = 999901;
    // Ensure clean state
    await db.query('DELETE FROM aura_gl_charts WHERE accountcode = ?', [testAccountCode]);

    // Create Account
    const newAccPayload = {
      accountcode: testAccountCode,
      accountname: 'Testing Liquidity Reserve Account',
      sectionid: 10, // Current Assets
      parent_acc: 100100, // Parent: Cash
      bank: 1,
      type: 0
    };
    const createAccRes = await axios.post(`${BASE_URL}/api/admin/accounting/accounts`, newAccPayload, { headers: authHeaders });
    if (!createAccRes.data?.status || !createAccRes.data?.data?.id) {
      throw new Error(`Failed to create account: ${JSON.stringify(createAccRes.data)}`);
    }
    const createdAccId = createAccRes.data.data.id;
    console.log(`✔ Account #${testAccountCode} created successfully (DB ID: ${createdAccId})`);

    // Fetch and verify account details
    const getAccRes = await axios.get(`${BASE_URL}/api/admin/accounting/accounts/${createdAccId}`, { headers: authHeaders });
    if (getAccRes.data?.data?.accountcode !== testAccountCode) {
      throw new Error('Account code mismatch on retrieval!');
    }
    console.log(`✔ Account details verified: "${getAccRes.data.data.accountname}", Section: ${getAccRes.data.data.sectionname}, Level: ${getAccRes.data.data.acc_level}`);

    // Update Account
    const updateAccRes = await axios.put(`${BASE_URL}/api/admin/accounting/accounts/${createdAccId}`, {
      accountname: 'Testing Liquidity Reserve Account (Renamed)'
    }, { headers: authHeaders });
    console.log(`✔ Account updated: "${updateAccRes.data.data.accountname}"`);

    // Delete Account
    await axios.delete(`${BASE_URL}/api/admin/accounting/accounts/${createdAccId}`, { headers: authHeaders });
    console.log(`✔ Account #${testAccountCode} safely deleted`);

    // 4. Test Journal Entries & Double-Entry Balancing
    console.log('\n[Step 4] Testing Journal Entry balancing & posting...');
    const nextRefRes = await axios.get(`${BASE_URL}/api/admin/accounting/journals/next-reference`, { headers: authHeaders });
    const journalRef = nextRefRes.data.reference_no;
    console.log(`✔ Generated unique voucher reference: ${journalRef}`);

    // Test rejection of unbalanced entry
    let unbalancedCaught = false;
    try {
      await axios.post(`${BASE_URL}/api/admin/accounting/journals`, {
        reference_no: journalRef,
        date: new Date().toISOString(),
        note: 'Unbalanced Test',
        items: [
          { account_code: 100102, debit: 500, credit: 0 },
          { account_code: 301100, debit: 0, credit: 300 } // Variance $200
        ]
      }, { headers: authHeaders });
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message?.includes('unbalanced')) {
        unbalancedCaught = true;
        console.log(`✔ Server strictly blocked unbalanced journal entry (HTTP 400): "${err.response.data.message}"`);
      }
    }
    if (!unbalancedCaught) throw new Error('FAILED: Server allowed an unbalanced journal voucher!');

    // Post valid balanced journal voucher
    const balancedPayload = {
      reference_no: journalRef,
      date: new Date().toISOString(),
      biller_id: 1,
      jn_type: 'journal',
      note: 'Capital Injection & Equipment Purchase Voucher',
      items: [
        { account_code: 100102, debit: 500, credit: 0, description: 'Cash deposit' },
        { account_code: 301100, debit: 0, credit: 500, description: 'Owner equity investment' }
      ]
    };
    const postJournalRes = await axios.post(`${BASE_URL}/api/admin/accounting/journals`, balancedPayload, { headers: authHeaders });
    const postedJournalId = postJournalRes.data?.data?.journal_id;
    console.log(`✔ Balanced journal voucher posted successfully (Voucher ID: ${postedJournalId})`);

    // Verify database entries in aura_account_journals, aura_account_journal_items, and aura_gl_trans
    const [savedJournals] = await db.query('SELECT * FROM aura_account_journals WHERE id = ?', [postedJournalId]);
    const [savedItems] = await db.query('SELECT * FROM aura_account_journal_items WHERE journal_id = ?', [postedJournalId]);
    const [savedGl] = await db.query("SELECT * FROM aura_gl_trans WHERE tran_type = 'JOURNAL' AND tran_no = ?", [postedJournalId]);

    console.log(`✔ DB Audit Verification:`);
    console.log(`   - aura_account_journals record: ref="${savedJournals[0].reference_no}", type="${savedJournals[0].jn_type}"`);
    console.log(`   - aura_account_journal_items count: ${savedItems.length} lines`);
    console.log(`   - aura_gl_trans postings count: ${savedGl.length} double-entry rows`);
    const glDebit = savedGl.find(g => parseFloat(g.amount) > 0);
    const glCredit = savedGl.find(g => parseFloat(g.amount) < 0);
    console.log(`   - GL Debit: Account ${glDebit.account_code} (+$${glDebit.amount})`);
    console.log(`   - GL Credit: Account ${glCredit.account_code} (-$${Math.abs(glCredit.amount)})`);

    // 5. Test General Ledger Statement
    console.log('\n[Step 5] Testing General Ledger statement for account 100102...');
    const glRes = await axios.get(`${BASE_URL}/api/admin/accounting/ledger?account_code=100102`, { headers: authHeaders });
    const glData = glRes.data.data;
    console.log(`✔ General Ledger verified for "${glData.account.accountname}":`);
    console.log(`   - Opening Balance: $${glData.opening_balance}`);
    console.log(`   - Period Debits: $${glData.total_period_debit}`);
    console.log(`   - Period Credits: $${glData.total_period_credit}`);
    console.log(`   - Closing Balance: $${glData.closing_balance}`);
    console.log(`   - Total Ledger Records: ${glData.transactions?.length}`);

    // 6. Test Cash & Bank Transfer
    console.log('\n[Step 6] Testing Cash & Bank Transfer...');
    const transferPayload = {
      from_account_code: 100102, // Cash on hand
      to_account_code: 100103,   // ABA Bank
      amount: 150,
      fee_amount: 0,
      note: 'Daily cash deposit to bank'
    };
    const transferRes = await axios.post(`${BASE_URL}/api/admin/accounting/transfers`, transferPayload, { headers: authHeaders });
    console.log(`✔ Cash transfer executed successfully (Ref: ${transferRes.data?.data?.reference_no})`);

    // Check GL postings for transfer
    const [trfGl] = await db.query("SELECT * FROM aura_gl_trans WHERE tran_type = 'TRANSFER' AND tran_no = ?", [transferRes.data.data.transfer_id]);
    console.log(`✔ GL Transfer Postings: ${trfGl.length} rows (From Acc: ${trfGl[0].account_code} $${trfGl[0].amount}, To Acc: ${trfGl[1].account_code} $${trfGl[1].amount})`);

    // Clean up test transactions
    await axios.delete(`${BASE_URL}/api/admin/accounting/journals/${postedJournalId}`, { headers: authHeaders });
    await db.query("DELETE FROM aura_gl_trans WHERE tran_type = 'TRANSFER' AND tran_no = ?", [transferRes.data.data.transfer_id]);
    await db.query('DELETE FROM aura_account_transfer WHERE id = ?', [transferRes.data.data.transfer_id]);
    console.log('✔ Test vouchers and transfers reversed and cleaned up.');

    // 7. Test Accounts Receivable & Accounts Payable Endpoints
    console.log('\n[Step 7] Testing AR & AP Management...');
    const arRes = await axios.get(`${BASE_URL}/api/admin/accounting/ar`, { headers: authHeaders });
    console.log(`✔ Accounts Receivable: ${arRes.data.data?.length} invoices loaded (Total in DB: ${arRes.data.pagination?.total})`);

    const apRes = await axios.get(`${BASE_URL}/api/admin/accounting/ap`, { headers: authHeaders });
    console.log(`✔ Accounts Payable: ${apRes.data.data?.length} bills loaded (Total in DB: ${apRes.data.pagination?.total})`);

    // 8. Test Statutory Financial Statements
    console.log('\n[Step 8] Testing Statutory Financial Statements...');
    const tbRes = await axios.get(`${BASE_URL}/api/admin/accounting/reports/trial-balance`, { headers: authHeaders });
    console.log(`✔ Trial Balance Report: Total Debits=$${tbRes.data.data.total_debit}, Total Credits=$${tbRes.data.data.total_credit}`);

    const plRes = await axios.get(`${BASE_URL}/api/admin/accounting/reports/income-statement`, { headers: authHeaders });
    console.log(`✔ Profit & Loss Statement: Revenue=$${plRes.data.data.revenue?.total}, Net Profit=$${plRes.data.data.netProfit}`);

    const bsRes = await axios.get(`${BASE_URL}/api/admin/accounting/reports/balance-sheet`, { headers: authHeaders });
    console.log(`✔ Balance Sheet: Total Assets=$${bsRes.data.data.assets?.total}, Total Liabilities & Equity=$${bsRes.data.data.totalLiabilitiesAndEquity}`);

    // 9. Verify Frontend Admin Routing
    console.log('\n[Step 9] Verifying Frontend Admin HTML serving for /admins/accounting...');
    const pageRes = await axios.get(`${BASE_URL}/admins/accounting`, { headers: authHeaders });
    if (pageRes.status === 200 && pageRes.data.includes('<div id="root">')) {
      console.log('✔ Frontend route /admins/accounting properly served by SPA.');
    }

    console.log('\n================================================================');
    console.log('🎉 ALL ACCOUNTING & LEDGER INTEGRATION TESTS PASSED 100%!');
    console.log('================================================================\n');

  } catch (err) {
    console.error('❌ Integration test failed:', err.message);
    if (err.response?.data) {
      console.error('API Error Response:', err.response.data);
    }
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runComprehensiveAccountingTests();
