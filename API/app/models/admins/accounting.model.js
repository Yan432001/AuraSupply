const pool = require('../../config/utill/connection');

class AccountingModel {
  /**
   * Helper to format decimal numbers to 4 decimal places
   */
  static formatDecimal(val) {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : parseFloat(num.toFixed(4));
  }

  // =========================================================================
  // 1. ACCOUNTING DASHBOARD & OVERVIEW METRICS
  // =========================================================================

  static async getDashboardMetrics({ biller_id, start_date, end_date }) {
    let whereGl = '1=1';
    const paramsGl = [];

    if (biller_id) {
      whereGl += ' AND gt.biller_id = ?';
      paramsGl.push(biller_id);
    }

    if (start_date && end_date) {
      whereGl += ' AND DATE(gt.tran_date) BETWEEN ? AND ?';
      paramsGl.push(start_date, end_date);
    } else if (end_date) {
      whereGl += ' AND DATE(gt.tran_date) <= ?';
      paramsGl.push(end_date);
    }

    // 1. Calculate Revenue, COGS, Expenses, Assets, Liabilities, Equity from aura_gl_trans
    const [glSummary] = await pool.query(
      `SELECT 
        SUM(CASE WHEN s.AccountType = 'RE' OR s.sectionid = 40 THEN -gt.amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN s.AccountType = 'CO' OR s.sectionid = 50 THEN gt.amount ELSE 0 END) as total_cogs,
        SUM(CASE WHEN s.AccountType = 'EX' OR s.sectionid = 60 THEN gt.amount ELSE 0 END) as total_expenses,
        SUM(CASE WHEN s.AccountType = 'OI' OR s.sectionid = 70 THEN -gt.amount ELSE 0 END) as total_other_income,
        SUM(CASE WHEN s.AccountType = 'OX' OR s.sectionid = 80 THEN gt.amount ELSE 0 END) as total_other_expense,
        SUM(CASE WHEN s.AccountType = 'AS' OR s.sectionid IN (10, 11) THEN gt.amount ELSE 0 END) as total_assets,
        SUM(CASE WHEN s.AccountType = 'LI' OR s.sectionid IN (20, 21) THEN -gt.amount ELSE 0 END) as total_liabilities,
        SUM(CASE WHEN s.AccountType = 'EQ' OR s.sectionid = 30 THEN -gt.amount ELSE 0 END) as total_equity
       FROM aura_gl_trans gt
       JOIN aura_gl_charts c ON c.accountcode = gt.account_code
       JOIN aura_gl_sections s ON s.sectionid = c.sectionid
       WHERE ${whereGl}`,
      paramsGl
    );

    const rev = parseFloat(glSummary[0]?.total_revenue || 0);
    const cogs = parseFloat(glSummary[0]?.total_cogs || 0);
    const exp = parseFloat(glSummary[0]?.total_expenses || 0);
    const otherInc = parseFloat(glSummary[0]?.total_other_income || 0);
    const otherExp = parseFloat(glSummary[0]?.total_other_expense || 0);
    const grossProfit = rev - cogs;
    const netProfit = grossProfit - exp + otherInc - otherExp;

    const assets = parseFloat(glSummary[0]?.total_assets || 0);
    const liabilities = parseFloat(glSummary[0]?.total_liabilities || 0);
    const equity = parseFloat(glSummary[0]?.total_equity || 0);

    // 2. Cash and Bank Balances
    const [cashBankRows] = await pool.query(
      `SELECT c.accountcode, c.accountname, COALESCE(SUM(gt.amount), 0) as balance
       FROM aura_gl_charts c
       LEFT JOIN aura_gl_trans gt ON gt.account_code = c.accountcode
       WHERE c.bank = 1 AND (c.inactive IS NULL OR c.inactive = 0)
       GROUP BY c.accountcode, c.accountname
       ORDER BY c.accountcode ASC`
    );
    const totalCashBank = cashBankRows.reduce((acc, row) => acc + parseFloat(row.balance || 0), 0);

    // 3. Accounts Receivable (AR) from aura_sales
    let arQuery = `SELECT 
      COUNT(*) as open_invoices,
      COALESCE(SUM(grand_total), 0) as total_receivable,
      COALESCE(SUM(paid), 0) as total_received,
      COALESCE(SUM(grand_total - paid), 0) as outstanding_ar
     FROM aura_sales 
     WHERE payment_status != 'paid' AND (sale_status IS NULL OR sale_status != 'returned')`;
    const arParams = [];
    if (biller_id) {
      arQuery += ' AND biller_id = ?';
      arParams.push(biller_id);
    }
    const [arRows] = await pool.query(arQuery, arParams);

    // 4. Accounts Payable (AP) from aura_purchases
    let apQuery = `SELECT 
      COUNT(*) as open_bills,
      COALESCE(SUM(grand_total), 0) as total_payable,
      COALESCE(SUM(paid), 0) as total_paid,
      COALESCE(SUM(grand_total - paid), 0) as outstanding_ap
     FROM aura_purchases 
     WHERE payment_status != 'paid' AND status != 'returned'`;
    const apParams = [];
    if (biller_id) {
      apQuery += ' AND biller_id = ?';
      apParams.push(biller_id);
    }
    const [apRows] = await pool.query(apQuery, apParams);

    // 5. Recent Journal Entries
    const [recentJournals] = await pool.query(
      `SELECT j.id, j.date, j.reference_no, j.jn_type, j.note, b.name as biller_name,
              COUNT(ji.id) as item_count,
              SUM(CASE WHEN ji.amount > 0 THEN ji.amount ELSE 0 END) as total_amount
       FROM aura_account_journals j
       LEFT JOIN aura_companies b ON b.id = j.biller_id
       LEFT JOIN aura_account_journal_items ji ON ji.journal_id = j.id
       GROUP BY j.id
       ORDER BY j.date DESC, j.id DESC
       LIMIT 6`
    );

    // 6. Recent General Ledger Transactions
    const [recentTrans] = await pool.query(
      `SELECT gt.tran_id, gt.tran_date, gt.reference_no, gt.tran_type, gt.account_code,
              c.accountname, gt.amount, gt.narrative, gt.description
       FROM aura_gl_trans gt
       LEFT JOIN aura_gl_charts c ON c.accountcode = gt.account_code
       ORDER BY gt.tran_date DESC, gt.tran_id DESC
       LIMIT 8`
    );

    return {
      revenue: this.formatDecimal(rev),
      cogs: this.formatDecimal(cogs),
      grossProfit: this.formatDecimal(grossProfit),
      expenses: this.formatDecimal(exp),
      netProfit: this.formatDecimal(netProfit),
      assets: this.formatDecimal(assets),
      liabilities: this.formatDecimal(liabilities),
      equity: this.formatDecimal(equity),
      cashBankBalance: this.formatDecimal(totalCashBank),
      cashBankAccounts: cashBankRows.map(r => ({ ...r, balance: this.formatDecimal(r.balance) })),
      accountsReceivable: {
        openInvoices: parseInt(arRows[0]?.open_invoices || 0, 10),
        total: this.formatDecimal(arRows[0]?.total_receivable || 0),
        received: this.formatDecimal(arRows[0]?.total_received || 0),
        outstanding: this.formatDecimal(arRows[0]?.outstanding_ar || 0)
      },
      accountsPayable: {
        openBills: parseInt(apRows[0]?.open_bills || 0, 10),
        total: this.formatDecimal(apRows[0]?.total_payable || 0),
        paid: this.formatDecimal(apRows[0]?.total_paid || 0),
        outstanding: this.formatDecimal(apRows[0]?.outstanding_ap || 0)
      },
      recentJournals,
      recentTransactions: recentTrans
    };
  }

  // =========================================================================
  // 2. CHART OF ACCOUNTS
  // =========================================================================

  static async getAccountSections() {
    const [sections] = await pool.query(
      `SELECT sectionid, code, sectionname, sectionname_kh, AccountType, description, nature 
       FROM aura_gl_sections 
       ORDER BY sectionid ASC`
    );
    return sections;
  }

  static async getAccounts({ search, section_id, account_type, bank, inactive, sortBy = 'c.accountcode', sortOrder = 'ASC', page = 1, limit = 500 }) {
    let where = '1=1';
    const params = [];

    if (search && search.trim()) {
      where += ' AND (c.accountcode LIKE ? OR c.accountname LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    if (section_id) {
      where += ' AND c.sectionid = ?';
      params.push(section_id);
    }

    if (account_type) {
      where += ' AND s.AccountType = ?';
      params.push(account_type);
    }

    if (bank !== undefined && bank !== null && bank !== '') {
      where += ' AND c.bank = ?';
      params.push(parseInt(bank, 10));
    }

    if (inactive !== undefined && inactive !== null && inactive !== '') {
      where += ' AND (c.inactive = ? OR (c.inactive IS NULL AND ? = 0))';
      params.push(parseInt(inactive, 10), parseInt(inactive, 10));
    }

    // Count
    const [countRows] = await pool.query(
      `SELECT COUNT(DISTINCT c.id) as total 
       FROM aura_gl_charts c
       LEFT JOIN aura_gl_sections s ON s.sectionid = c.sectionid
       WHERE ${where}`,
      params
    );
    const totalRecords = countRows[0]?.total || 0;

    // Accounts with current balance from aura_gl_trans
    const safeSort = ['c.accountcode', 'c.accountname', 'c.sectionid', 'balance'].includes(sortBy) ? sortBy : 'c.accountcode';
    const safeOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const [accounts] = await pool.query(
      `SELECT 
        c.id,
        c.accountcode,
        c.accountname,
        c.parent_acc,
        c.sectionid,
        s.sectionname,
        s.AccountType,
        s.nature as section_nature,
        c.bank,
        c.type,
        c.inactive,
        c.acc_level,
        c.lineage,
        COALESCE(SUM(gt.amount), 0) as raw_balance,
        CASE 
          WHEN s.nature = -1 THEN -COALESCE(SUM(gt.amount), 0)
          ELSE COALESCE(SUM(gt.amount), 0)
        END as current_balance,
        parent.accountname as parent_account_name
       FROM aura_gl_charts c
       LEFT JOIN aura_gl_sections s ON s.sectionid = c.sectionid
       LEFT JOIN aura_gl_charts parent ON parent.accountcode = c.parent_acc
       LEFT JOIN aura_gl_trans gt ON gt.account_code = c.accountcode
       WHERE ${where}
       GROUP BY c.id, c.accountcode, c.accountname, c.parent_acc, c.sectionid, s.sectionname, s.AccountType, s.nature, c.bank, c.type, c.inactive, c.acc_level, c.lineage, parent.accountname
       ORDER BY ${safeSort} ${safeOrder}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), offset]
    );

    return {
      records: accounts.map(a => ({
        ...a,
        current_balance: this.formatDecimal(a.current_balance),
        raw_balance: this.formatDecimal(a.raw_balance)
      })),
      pagination: {
        total: totalRecords,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(totalRecords / parseInt(limit, 10))
      }
    };
  }

  static async getAccountById(id) {
    const [rows] = await pool.query(
      `SELECT 
        c.*,
        s.sectionname,
        s.AccountType,
        s.nature as section_nature,
        parent.accountname as parent_account_name,
        COALESCE(SUM(gt.amount), 0) as raw_balance,
        CASE 
          WHEN s.nature = -1 THEN -COALESCE(SUM(gt.amount), 0)
          ELSE COALESCE(SUM(gt.amount), 0)
        END as current_balance
       FROM aura_gl_charts c
       LEFT JOIN aura_gl_sections s ON s.sectionid = c.sectionid
       LEFT JOIN aura_gl_charts parent ON parent.accountcode = c.parent_acc
       LEFT JOIN aura_gl_trans gt ON gt.account_code = c.accountcode
       WHERE c.id = ? OR c.accountcode = ?
       GROUP BY c.id`,
      [id, id]
    );

    if (rows.length === 0) return null;
    const acc = rows[0];
    acc.current_balance = this.formatDecimal(acc.current_balance);
    acc.raw_balance = this.formatDecimal(acc.raw_balance);

    // Fetch recent 10 transactions for this account
    const [trans] = await pool.query(
      `SELECT tran_id, tran_date, reference_no, tran_type, amount, narrative, description
       FROM aura_gl_trans
       WHERE account_code = ?
       ORDER BY tran_date DESC, tran_id DESC
       LIMIT 15`,
      [acc.accountcode]
    );
    acc.recent_transactions = trans.map(t => ({
      ...t,
      debit: parseFloat(t.amount) > 0 ? this.formatDecimal(t.amount) : 0,
      credit: parseFloat(t.amount) < 0 ? this.formatDecimal(Math.abs(t.amount)) : 0
    }));

    return acc;
  }

  static async createAccount(data) {
    const { accountcode, accountname, parent_acc = 0, sectionid, bank = 0, type = 0, inactive = 0 } = data;

    // 1. Check duplicate account code
    const [existing] = await pool.query('SELECT id FROM aura_gl_charts WHERE accountcode = ?', [accountcode]);
    if (existing.length > 0) {
      throw new Error(`Account code "${accountcode}" already exists.`);
    }

    // 2. Resolve level & lineage from parent
    let acc_level = 1;
    let lineage = `${accountcode}`;
    if (parent_acc && parseInt(parent_acc, 10) > 0) {
      const [parentRows] = await pool.query('SELECT acc_level, lineage FROM aura_gl_charts WHERE accountcode = ?', [parent_acc]);
      if (parentRows.length > 0) {
        acc_level = (parseInt(parentRows[0].acc_level, 10) || 1) + 1;
        lineage = `${parentRows[0].lineage || parent_acc}/${accountcode}`;
      }
    }

    const [result] = await pool.query(
      `INSERT INTO aura_gl_charts 
       (accountcode, accountname, parent_acc, sectionid, bank, type, inactive, acc_level, lineage)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [accountcode, accountname.trim(), parent_acc || 0, sectionid, bank ? 1 : 0, type || 0, inactive ? 1 : 0, acc_level, lineage]
    );

    return { id: result.insertId, accountcode, accountname };
  }

  static async updateAccount(id, data) {
    const { accountname, parent_acc, sectionid, bank, type, inactive } = data;

    const [current] = await pool.query('SELECT * FROM aura_gl_charts WHERE id = ?', [id]);
    if (current.length === 0) throw new Error('Account not found.');

    const updates = [];
    const params = [];

    if (accountname !== undefined) {
      updates.push('accountname = ?');
      params.push(accountname.trim());
    }
    if (parent_acc !== undefined) {
      updates.push('parent_acc = ?');
      params.push(parent_acc || 0);
    }
    if (sectionid !== undefined) {
      updates.push('sectionid = ?');
      params.push(sectionid);
    }
    if (bank !== undefined) {
      updates.push('bank = ?');
      params.push(bank ? 1 : 0);
    }
    if (type !== undefined) {
      updates.push('type = ?');
      params.push(type);
    }
    if (inactive !== undefined) {
      updates.push('inactive = ?');
      params.push(inactive ? 1 : 0);
    }

    if (updates.length > 0) {
      params.push(id);
      await pool.query(`UPDATE aura_gl_charts SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    return await this.getAccountById(id);
  }

  static async deleteAccount(id) {
    const [accRows] = await pool.query('SELECT accountcode, accountname FROM aura_gl_charts WHERE id = ?', [id]);
    if (accRows.length === 0) throw new Error('Account not found.');
    const code = accRows[0].accountcode;

    // Check if posted transactions exist in aura_gl_trans
    const [trans] = await pool.query('SELECT tran_id FROM aura_gl_trans WHERE account_code = ? LIMIT 1', [code]);
    if (trans.length > 0) {
      throw new Error(`Cannot delete account "${code} - ${accRows[0].accountname}" because posted transactions reference this account. Deactivate it instead.`);
    }

    // Check if child accounts exist
    const [children] = await pool.query('SELECT id FROM aura_gl_charts WHERE parent_acc = ? LIMIT 1', [code]);
    if (children.length > 0) {
      throw new Error(`Cannot delete account "${code}" because it has child sub-accounts.`);
    }

    await pool.query('DELETE FROM aura_gl_charts WHERE id = ?', [id]);
    return { success: true, deletedCode: code };
  }

  // =========================================================================
  // 3. JOURNAL ENTRIES MANAGEMENT
  // =========================================================================

  static async getNextJournalReference(biller_id) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as count FROM aura_account_journals WHERE reference_no LIKE ?`,
      [`JN-${dateStr}-%`]
    );
    const nextSeq = String((countRows[0]?.count || 0) + 1).padStart(4, '0');
    return `JN-${dateStr}-${nextSeq}`;
  }

  static async getJournals({ search, biller_id, start_date, end_date, jn_type, page = 1, limit = 20 }) {
    let where = '1=1';
    const params = [];

    if (search && search.trim()) {
      where += ' AND (j.reference_no LIKE ? OR j.note LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    if (biller_id) {
      where += ' AND j.biller_id = ?';
      params.push(biller_id);
    }

    if (jn_type) {
      where += ' AND j.jn_type = ?';
      params.push(jn_type);
    }

    if (start_date && end_date) {
      where += ' AND DATE(j.date) BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    const [countRows] = await pool.query(
      `SELECT COUNT(DISTINCT j.id) as total FROM aura_account_journals j WHERE ${where}`,
      params
    );
    const totalRecords = countRows[0]?.total || 0;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const [journals] = await pool.query(
      `SELECT 
        j.id,
        j.date,
        j.reference_no,
        j.jn_type,
        j.note,
        j.attachment,
        j.type,
        j.biller_id,
        b.name as biller_name,
        b.company as biller_company,
        CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, u.username)) as created_by_name,
        COUNT(ji.id) as item_count,
        COALESCE(SUM(CASE WHEN ji.amount > 0 THEN ji.amount ELSE 0 END), 0) as total_debit,
        COALESCE(SUM(CASE WHEN ji.amount < 0 THEN ABS(ji.amount) ELSE 0 END), 0) as total_credit
       FROM aura_account_journals j
       LEFT JOIN aura_companies b ON b.id = j.biller_id
       LEFT JOIN aura_users u ON u.id = j.created_by
       LEFT JOIN aura_account_journal_items ji ON ji.journal_id = j.id
       WHERE ${where}
       GROUP BY j.id, j.date, j.reference_no, j.jn_type, j.note, j.attachment, j.type, j.biller_id, b.name, b.company, u.first_name, u.last_name, u.username
       ORDER BY j.date DESC, j.id DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), offset]
    );

    return {
      records: journals.map(j => ({
        ...j,
        total_debit: this.formatDecimal(j.total_debit),
        total_credit: this.formatDecimal(j.total_credit),
        is_balanced: Math.abs(parseFloat(j.total_debit) - parseFloat(j.total_credit)) < 0.001
      })),
      pagination: {
        total: totalRecords,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(totalRecords / parseInt(limit, 10))
      }
    };
  }

  static async getJournalById(id) {
    const [journals] = await pool.query(
      `SELECT 
        j.*,
        b.name as biller_name,
        b.company as biller_company,
        c.name as customer_name,
        s.name as supplier_name,
        CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, u.username)) as created_by_name
       FROM aura_account_journals j
       LEFT JOIN aura_companies b ON b.id = j.biller_id
       LEFT JOIN aura_companies c ON c.id = j.customer_id
       LEFT JOIN aura_companies s ON s.id = j.supplier_id
       LEFT JOIN aura_users u ON u.id = j.created_by
       WHERE j.id = ?`,
      [id]
    );

    if (journals.length === 0) return null;
    const journal = journals[0];

    const [items] = await pool.query(
      `SELECT 
        ji.id,
        ji.journal_id,
        ji.account_id,
        ji.account_code,
        COALESCE(c.accountname, ji.account_name) as account_name,
        ji.amount,
        ji.description,
        CASE WHEN ji.amount > 0 THEN ji.amount ELSE 0 END as debit,
        CASE WHEN ji.amount < 0 THEN ABS(ji.amount) ELSE 0 END as credit
       FROM aura_account_journal_items ji
       LEFT JOIN aura_gl_charts c ON c.accountcode = ji.account_code
       WHERE ji.journal_id = ?
       ORDER BY ji.id ASC`,
      [id]
    );

    journal.items = items.map(it => ({
      ...it,
      debit: this.formatDecimal(it.debit),
      credit: this.formatDecimal(it.credit),
      amount: this.formatDecimal(it.amount)
    }));

    journal.total_debit = this.formatDecimal(items.reduce((acc, it) => acc + (parseFloat(it.amount) > 0 ? parseFloat(it.amount) : 0), 0));
    journal.total_credit = this.formatDecimal(items.reduce((acc, it) => acc + (parseFloat(it.amount) < 0 ? Math.abs(parseFloat(it.amount)) : 0), 0));
    journal.is_balanced = Math.abs(journal.total_debit - journal.total_credit) < 0.001;

    return journal;
  }

  static async createJournal({ date, reference_no, biller_id, jn_type = 'journal', type = 'general', customer_id = null, supplier_id = null, note = '', items = [] }, userId) {
    if (!Array.isArray(items) || items.length < 2) {
      throw new Error('A journal entry must contain at least two transaction lines (one debit and one credit).');
    }

    // Validate debit/credit balancing
    let totalDebit = 0;
    let totalCredit = 0;

    const validatedItems = [];
    for (const line of items) {
      const code = line.account_code;
      if (!code) throw new Error('Account code is required on every journal line.');

      const d = parseFloat(line.debit) || 0;
      const c = parseFloat(line.credit) || 0;

      if (d === 0 && c === 0) {
        throw new Error(`Line for account ${code} must have either a debit or credit amount.`);
      }
      if (d > 0 && c > 0) {
        throw new Error(`Line for account ${code} cannot have both debit and credit amounts.`);
      }

      totalDebit += d;
      totalCredit += c;

      const lineAmount = d > 0 ? d : -c;
      validatedItems.push({
        account_code: code,
        account_name: line.account_name || '',
        account_id: line.account_id || null,
        amount: lineAmount,
        description: line.description || note || ''
      });
    }

    const variance = Math.abs(totalDebit - totalCredit);
    if (variance >= 0.001) {
      throw new Error(`Journal entry is unbalanced! Total Debits ($${totalDebit.toFixed(2)}) must equal Total Credits ($${totalCredit.toFixed(2)}). Variance: $${variance.toFixed(2)}.`);
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const journalDate = date ? new Date(date) : new Date();
      const refNo = reference_no && reference_no.trim() ? reference_no.trim() : await this.getNextJournalReference(biller_id);

      // 1. Insert into aura_account_journals
      const [journalRes] = await connection.query(
        `INSERT INTO aura_account_journals 
         (date, jn_type, reference_no, biller_id, note, created_by, type, customer_id, supplier_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [journalDate, jn_type, refNo, biller_id || 1, note, userId || 1, type, customer_id, supplier_id]
      );
      const journalId = journalRes.insertId;

      // 2. Insert items and post to General Ledger (aura_gl_trans)
      for (const it of validatedItems) {
        // Resolve account details
        const [accRows] = await connection.query(
          `SELECT id, accountcode, accountname, sectionid, bank FROM aura_gl_charts WHERE accountcode = ?`,
          [it.account_code]
        );
        const accInfo = accRows[0] || {};
        const accId = accInfo.id || it.account_id;
        const accName = accInfo.accountname || it.account_name;
        const sectionId = accInfo.sectionid || null;

        // Insert into aura_account_journal_items
        await connection.query(
          `INSERT INTO aura_account_journal_items 
           (journal_id, account_id, account_code, account_name, amount, description)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [journalId, accId, it.account_code, accName, it.amount, it.description]
        );

        // Insert into aura_gl_trans (Double entry general ledger)
        await connection.query(
          `INSERT INTO aura_gl_trans 
           (tran_type, tran_no, tran_date, sectionid, account_code, narrative, amount, reference_no, description, biller_id, created_by, customer_id, supplier_id)
           VALUES ('JOURNAL', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            journalId,
            journalDate,
            sectionId,
            it.account_code,
            accName,
            it.amount,
            refNo,
            it.description,
            biller_id || 1,
            userId || 1,
            customer_id,
            supplier_id
          ]
        );
      }

      await connection.commit();
      return { success: true, journal_id: journalId, reference_no: refNo };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async updateJournal(id, { date, note, items = [], biller_id }, userId) {
    if (!Array.isArray(items) || items.length < 2) {
      throw new Error('A journal entry must contain at least two transaction lines (one debit and one credit).');
    }

    let totalDebit = 0;
    let totalCredit = 0;
    const validatedItems = [];
    for (const line of items) {
      const d = parseFloat(line.debit) || 0;
      const c = parseFloat(line.credit) || 0;
      if (d === 0 && c === 0) throw new Error('Each line must have either debit or credit.');
      totalDebit += d;
      totalCredit += c;
      validatedItems.push({
        account_code: line.account_code,
        amount: d > 0 ? d : -c,
        description: line.description || note || ''
      });
    }

    if (Math.abs(totalDebit - totalCredit) >= 0.001) {
      throw new Error(`Unbalanced entry! Debits ($${totalDebit.toFixed(2)}) != Credits ($${totalCredit.toFixed(2)}).`);
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [existing] = await connection.query('SELECT reference_no FROM aura_account_journals WHERE id = ?', [id]);
      if (existing.length === 0) throw new Error('Journal entry not found.');
      const refNo = existing[0].reference_no;

      // Update journal header
      await connection.query(
        `UPDATE aura_account_journals 
         SET date = COALESCE(?, date), note = COALESCE(?, note), updated_by = ?, updated_at = NOW()
         WHERE id = ?`,
        [date ? new Date(date) : null, note, userId || 1, id]
      );

      // Clean old items and GL postings for this journal
      await connection.query('DELETE FROM aura_account_journal_items WHERE journal_id = ?', [id]);
      await connection.query("DELETE FROM aura_gl_trans WHERE tran_type = 'JOURNAL' AND tran_no = ?", [id]);

      // Re-insert lines
      for (const it of validatedItems) {
        const [accRows] = await connection.query('SELECT id, accountname, sectionid FROM aura_gl_charts WHERE accountcode = ?', [it.account_code]);
        const accInfo = accRows[0] || {};
        await connection.query(
          `INSERT INTO aura_account_journal_items 
           (journal_id, account_id, account_code, account_name, amount, description)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, accInfo.id || null, it.account_code, accInfo.accountname || '', it.amount, it.description]
        );

        await connection.query(
          `INSERT INTO aura_gl_trans 
           (tran_type, tran_no, tran_date, sectionid, account_code, narrative, amount, reference_no, description, biller_id, created_by)
           VALUES ('JOURNAL', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, date ? new Date(date) : new Date(), accInfo.sectionid || null, it.account_code, accInfo.accountname || '', it.amount, refNo, it.description, biller_id || 1, userId || 1]
        );
      }

      await connection.commit();
      return { success: true, id };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async deleteJournal(id) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [journal] = await connection.query('SELECT id, reference_no FROM aura_account_journals WHERE id = ?', [id]);
      if (journal.length === 0) throw new Error('Journal not found.');

      await connection.query('DELETE FROM aura_account_journal_items WHERE journal_id = ?', [id]);
      await connection.query("DELETE FROM aura_gl_trans WHERE tran_type = 'JOURNAL' AND tran_no = ?", [id]);
      await connection.query('DELETE FROM aura_account_journals WHERE id = ?', [id]);

      await connection.commit();
      return { success: true, id };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  // =========================================================================
  // 4. GENERAL LEDGER
  // =========================================================================

  static async getGeneralLedger({ account_code, start_date, end_date, biller_id, tran_type, page = 1, limit = 50 }) {
    if (!account_code) {
      throw new Error('account_code parameter is required for General Ledger statement.');
    }

    const [accRows] = await pool.query(
      `SELECT c.*, s.sectionname, s.AccountType, s.nature as section_nature 
       FROM aura_gl_charts c
       LEFT JOIN aura_gl_sections s ON s.sectionid = c.sectionid
       WHERE c.accountcode = ?`,
      [account_code]
    );
    if (accRows.length === 0) throw new Error(`Account code "${account_code}" not found.`);
    const account = accRows[0];
    const isCreditNature = account.section_nature === -1 || account.AccountType === 'LI' || account.AccountType === 'EQ' || account.AccountType === 'RE';

    // 1. Calculate Opening Balance before start_date
    let openingBal = 0;
    if (start_date) {
      let openWhere = 'account_code = ? AND DATE(tran_date) < ?';
      const openParams = [account_code, start_date];
      if (biller_id) {
        openWhere += ' AND biller_id = ?';
        openParams.push(biller_id);
      }
      const [openRows] = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) as net_amount FROM aura_gl_trans WHERE ${openWhere}`,
        openParams
      );
      openingBal = parseFloat(openRows[0]?.net_amount || 0);
    }

    // 2. Fetch period transactions
    let where = 'gt.account_code = ?';
    const params = [account_code];

    if (start_date && end_date) {
      where += ' AND DATE(gt.tran_date) BETWEEN ? AND ?';
      params.push(start_date, end_date);
    } else if (start_date) {
      where += ' AND DATE(gt.tran_date) >= ?';
      params.push(start_date);
    } else if (end_date) {
      where += ' AND DATE(gt.tran_date) <= ?';
      params.push(end_date);
    }

    if (biller_id) {
      where += ' AND gt.biller_id = ?';
      params.push(biller_id);
    }

    if (tran_type) {
      where += ' AND gt.tran_type = ?';
      params.push(tran_type);
    }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM aura_gl_trans gt WHERE ${where}`,
      params
    );
    const totalRecords = countRows[0]?.total || 0;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const [trans] = await pool.query(
      `SELECT 
        gt.tran_id,
        gt.tran_date,
        gt.reference_no,
        gt.tran_type,
        gt.tran_no,
        gt.amount,
        gt.narrative,
        gt.description,
        gt.biller_id,
        gt.sale_id,
        gt.customer_id,
        gt.supplier_id,
        b.name as biller_name
       FROM aura_gl_trans gt
       LEFT JOIN aura_companies b ON b.id = gt.biller_id
       WHERE ${where}
       ORDER BY gt.tran_date ASC, gt.tran_id ASC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), offset]
    );

    let runningRaw = openingBal;
    let periodDebit = 0;
    let periodCredit = 0;

    const transactionsWithRunning = trans.map(t => {
      const amt = parseFloat(t.amount);
      const debit = amt > 0 ? amt : 0;
      const credit = amt < 0 ? Math.abs(amt) : 0;
      periodDebit += debit;
      periodCredit += credit;
      runningRaw += amt;

      const runningDisplay = isCreditNature ? -runningRaw : runningRaw;

      return {
        ...t,
        debit: this.formatDecimal(debit),
        credit: this.formatDecimal(credit),
        running_balance: this.formatDecimal(runningDisplay)
      };
    });

    const displayOpening = isCreditNature ? -openingBal : openingBal;
    const displayClosing = isCreditNature ? -runningRaw : runningRaw;

    return {
      account: {
        accountcode: account.accountcode,
        accountname: account.accountname,
        sectionname: account.sectionname,
        AccountType: account.AccountType,
        isCreditNature
      },
      opening_balance: this.formatDecimal(displayOpening),
      closing_balance: this.formatDecimal(displayClosing),
      total_period_debit: this.formatDecimal(periodDebit),
      total_period_credit: this.formatDecimal(periodCredit),
      transactions: transactionsWithRunning,
      pagination: {
        total: totalRecords,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(totalRecords / parseInt(limit, 10))
      }
    };
  }

  // =========================================================================
  // 5. CASH AND BANK MANAGEMENT
  // =========================================================================

  static async getCashAccounts() {
    const [rows] = await pool.query(
      `SELECT 
        ca.id,
        ca.code,
        ca.name,
        ca.account_code,
        ca.type,
        c.accountname,
        COALESCE(SUM(gt.amount), 0) as current_balance
       FROM aura_cash_accounts ca
       LEFT JOIN aura_gl_charts c ON c.accountcode = ca.account_code
       LEFT JOIN aura_gl_trans gt ON gt.account_code = ca.account_code
       GROUP BY ca.id, ca.code, ca.name, ca.account_code, ca.type, c.accountname
       ORDER BY ca.id ASC`
    );

    return rows.map(r => ({
      ...r,
      current_balance: this.formatDecimal(r.current_balance)
    }));
  }

  static async createCashTransfer({ from_account_code, to_account_code, amount, fee_amount = 0, fee_account_code = null, date, reference_no, note, biller_id = 1 }, userId) {
    const amt = parseFloat(amount);
    const fee = parseFloat(fee_amount) || 0;
    if (isNaN(amt) || amt <= 0) {
      throw new Error('Transfer amount must be greater than zero.');
    }
    if (from_account_code === to_account_code) {
      throw new Error('Source account and destination account cannot be the same.');
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const transDate = date ? new Date(date) : new Date();
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const refNo = reference_no && reference_no.trim() ? reference_no.trim() : `TRF-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. Insert into aura_account_transfer
      const [trfRes] = await connection.query(
        `INSERT INTO aura_account_transfer 
         (date, reference_no, charge_account, charge_amount, transfer_account, transfer_amount, created_by, note, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [transDate, refNo, fee_account_code || 0, fee, to_account_code, amt, userId || 1, note || 'Account to Account Transfer']
      );
      const trfId = trfRes.insertId;

      // 2. Post to General Ledger (aura_gl_trans)
      // Line A: Credit From Account (Disbursement / outflow)
      await connection.query(
        `INSERT INTO aura_gl_trans 
         (tran_type, tran_no, tran_date, account_code, narrative, amount, reference_no, description, biller_id, created_by)
         VALUES ('TRANSFER', ?, ?, ?, 'Transfer Out', ?, ?, ?, ?, ?)`,
        [trfId, transDate, from_account_code, -(amt + fee), refNo, note || 'Account Transfer Out', biller_id, userId || 1]
      );

      // Line B: Debit To Account (Receipt / inflow)
      await connection.query(
        `INSERT INTO aura_gl_trans 
         (tran_type, tran_no, tran_date, account_code, narrative, amount, reference_no, description, biller_id, created_by)
         VALUES ('TRANSFER', ?, ?, ?, 'Transfer In', ?, ?, ?, ?, ?)`,
        [trfId, transDate, to_account_code, amt, refNo, note || 'Account Transfer In', biller_id, userId || 1]
      );

      // Line C: If bank charge fee exists, debit fee expense account
      if (fee > 0 && fee_account_code) {
        await connection.query(
          `INSERT INTO aura_gl_trans 
           (tran_type, tran_no, tran_date, account_code, narrative, amount, reference_no, description, biller_id, created_by)
           VALUES ('TRANSFER', ?, ?, ?, 'Bank Transfer Fee', ?, ?, ?, ?, ?)`,
          [trfId, transDate, fee_account_code, fee, refNo, 'Bank Charge / Transfer Fee', biller_id, userId || 1]
        );
      }

      await connection.commit();
      return { success: true, transfer_id: trfId, reference_no: refNo };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  // =========================================================================
  // 6. ACCOUNTS RECEIVABLE & PAYABLE (AR / AP)
  // =========================================================================

  static async getAccountsReceivable({ customer_id, biller_id, overdue_only, search, page = 1, limit = 20 }) {
    let where = "s.payment_status != 'paid' AND (s.sale_status IS NULL OR s.sale_status != 'returned')";
    const params = [];

    if (customer_id) {
      where += ' AND s.customer_id = ?';
      params.push(customer_id);
    }
    if (biller_id) {
      where += ' AND s.biller_id = ?';
      params.push(biller_id);
    }
    if (search && search.trim()) {
      where += ' AND (s.reference_no LIKE ? OR c.name LIKE ? OR c.company LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }
    if (overdue_only) {
      where += ' AND (s.due_date IS NOT NULL AND DATE(s.due_date) < CURDATE())';
    }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total 
       FROM aura_sales s
       LEFT JOIN aura_companies c ON c.id = s.customer_id
       WHERE ${where}`,
      params
    );
    const totalRecords = countRows[0]?.total || 0;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const [invoices] = await pool.query(
      `SELECT 
        s.id,
        s.date,
        s.due_date,
        s.reference_no,
        s.customer_id,
        COALESCE(c.name, s.customer) as customer_name,
        c.company as customer_company,
        c.phone as customer_phone,
        s.grand_total,
        s.paid,
        (s.grand_total - s.paid) as balance_due,
        s.payment_status,
        DATEDIFF(CURDATE(), COALESCE(s.due_date, s.date)) as days_outstanding,
        CASE 
          WHEN DATEDIFF(CURDATE(), COALESCE(s.due_date, s.date)) <= 30 THEN '0_30'
          WHEN DATEDIFF(CURDATE(), COALESCE(s.due_date, s.date)) <= 60 THEN '31_60'
          WHEN DATEDIFF(CURDATE(), COALESCE(s.due_date, s.date)) <= 90 THEN '61_90'
          ELSE 'over_90'
        END as aging_bucket
       FROM aura_sales s
       LEFT JOIN aura_companies c ON c.id = s.customer_id
       WHERE ${where}
       ORDER BY s.date DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), offset]
    );

    return {
      records: invoices.map(i => ({
        ...i,
        grand_total: this.formatDecimal(i.grand_total),
        paid: this.formatDecimal(i.paid),
        balance_due: this.formatDecimal(i.balance_due)
      })),
      pagination: {
        total: totalRecords,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(totalRecords / parseInt(limit, 10))
      }
    };
  }

  static async getAccountsPayable({ supplier_id, biller_id, overdue_only, search, page = 1, limit = 20 }) {
    let where = "p.payment_status != 'paid' AND (p.status IS NULL OR p.status != 'returned')";
    const params = [];

    if (supplier_id) {
      where += ' AND p.supplier_id = ?';
      params.push(supplier_id);
    }
    if (biller_id) {
      where += ' AND p.biller_id = ?';
      params.push(biller_id);
    }
    if (search && search.trim()) {
      where += ' AND (p.reference_no LIKE ? OR c.name LIKE ? OR c.company LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }
    if (overdue_only) {
      where += ' AND (p.due_date IS NOT NULL AND DATE(p.due_date) < CURDATE())';
    }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total 
       FROM aura_purchases p
       LEFT JOIN aura_companies c ON c.id = p.supplier_id
       WHERE ${where}`,
      params
    );
    const totalRecords = countRows[0]?.total || 0;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const [bills] = await pool.query(
      `SELECT 
        p.id,
        p.date,
        p.due_date,
        p.reference_no,
        p.supplier_id,
        COALESCE(c.name, p.supplier) as supplier_name,
        c.company as supplier_company,
        c.phone as supplier_phone,
        p.grand_total,
        p.paid,
        (p.grand_total - p.paid) as balance_due,
        p.payment_status,
        DATEDIFF(CURDATE(), COALESCE(p.due_date, p.date)) as days_outstanding,
        CASE 
          WHEN DATEDIFF(CURDATE(), COALESCE(p.due_date, p.date)) <= 30 THEN '0_30'
          WHEN DATEDIFF(CURDATE(), COALESCE(p.due_date, p.date)) <= 60 THEN '31_60'
          WHEN DATEDIFF(CURDATE(), COALESCE(p.due_date, p.date)) <= 90 THEN '61_90'
          ELSE 'over_90'
        END as aging_bucket
       FROM aura_purchases p
       LEFT JOIN aura_companies c ON c.id = p.supplier_id
       WHERE ${where}
       ORDER BY p.date DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), offset]
    );

    return {
      records: bills.map(b => ({
        ...b,
        grand_total: this.formatDecimal(b.grand_total),
        paid: this.formatDecimal(b.paid),
        balance_due: this.formatDecimal(b.balance_due)
      })),
      pagination: {
        total: totalRecords,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(totalRecords / parseInt(limit, 10))
      }
    };
  }

  // =========================================================================
  // 7. FINANCIAL REPORTS: TRIAL BALANCE, BALANCE SHEET, INCOME STATEMENT
  // =========================================================================

  static async getTrialBalance({ biller_id, as_of_date }) {
    let where = '1=1';
    const params = [];

    if (biller_id) {
      where += ' AND gt.biller_id = ?';
      params.push(biller_id);
    }
    if (as_of_date) {
      where += ' AND DATE(gt.tran_date) <= ?';
      params.push(as_of_date);
    }

    const [rows] = await pool.query(
      `SELECT 
        c.accountcode,
        c.accountname,
        s.sectionid,
        s.sectionname,
        s.AccountType,
        s.nature as section_nature,
        COALESCE(SUM(gt.amount), 0) as net_amount
       FROM aura_gl_charts c
       LEFT JOIN aura_gl_sections s ON s.sectionid = c.sectionid
       LEFT JOIN aura_gl_trans gt ON gt.account_code = c.accountcode AND ${where}
       GROUP BY c.accountcode, c.accountname, s.sectionid, s.sectionname, s.AccountType, s.nature
       HAVING net_amount != 0
       ORDER BY c.accountcode ASC`,
      params
    );

    let totalDebit = 0;
    let totalCredit = 0;

    const accounts = rows.map(r => {
      const net = parseFloat(r.net_amount);
      const debit = net > 0 ? net : 0;
      const credit = net < 0 ? Math.abs(net) : 0;
      totalDebit += debit;
      totalCredit += credit;

      return {
        accountcode: r.accountcode,
        accountname: r.accountname,
        sectionname: r.sectionname,
        AccountType: r.AccountType,
        debit: this.formatDecimal(debit),
        credit: this.formatDecimal(credit)
      };
    });

    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001;

    return {
      as_of_date: as_of_date || new Date().toISOString().slice(0, 10),
      total_debit: this.formatDecimal(totalDebit),
      total_credit: this.formatDecimal(totalCredit),
      variance: this.formatDecimal(Math.abs(totalDebit - totalCredit)),
      is_balanced: isBalanced,
      accounts
    };
  }

  static async getIncomeStatement({ biller_id, start_date, end_date }) {
    let where = "s.AccountType IN ('RE', 'CO', 'EX', 'OI', 'OX')";
    const params = [];

    if (biller_id) {
      where += ' AND gt.biller_id = ?';
      params.push(biller_id);
    }
    if (start_date && end_date) {
      where += ' AND DATE(gt.tran_date) BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    const [rows] = await pool.query(
      `SELECT 
        s.AccountType,
        s.sectionname,
        c.accountcode,
        c.accountname,
        COALESCE(SUM(gt.amount), 0) as net_amount
       FROM aura_gl_charts c
       JOIN aura_gl_sections s ON s.sectionid = c.sectionid
       LEFT JOIN aura_gl_trans gt ON gt.account_code = c.accountcode
       WHERE ${where}
       GROUP BY s.AccountType, s.sectionname, c.accountcode, c.accountname
       HAVING net_amount != 0
       ORDER BY s.AccountType ASC, c.accountcode ASC`,
      params
    );

    const revenue = [];
    const cogs = [];
    const expenses = [];
    const otherIncome = [];
    const otherExpense = [];

    let totalRevenue = 0;
    let totalCogs = 0;
    let totalExpenses = 0;
    let totalOtherIncome = 0;
    let totalOtherExpense = 0;

    for (const r of rows) {
      const net = parseFloat(r.net_amount);
      if (r.AccountType === 'RE') {
        const val = -net; // Credit normal
        totalRevenue += val;
        revenue.push({ ...r, amount: this.formatDecimal(val) });
      } else if (r.AccountType === 'CO') {
        const val = net; // Debit normal
        totalCogs += val;
        cogs.push({ ...r, amount: this.formatDecimal(val) });
      } else if (r.AccountType === 'EX') {
        const val = net;
        totalExpenses += val;
        expenses.push({ ...r, amount: this.formatDecimal(val) });
      } else if (r.AccountType === 'OI') {
        const val = -net;
        totalOtherIncome += val;
        otherIncome.push({ ...r, amount: this.formatDecimal(val) });
      } else if (r.AccountType === 'OX') {
        const val = net;
        totalOtherExpense += val;
        otherExpense.push({ ...r, amount: this.formatDecimal(val) });
      }
    }

    const grossProfit = totalRevenue - totalCogs;
    const operatingIncome = grossProfit - totalExpenses;
    const netProfit = operatingIncome + totalOtherIncome - totalOtherExpense;

    return {
      period: {
        start_date: start_date || 'Beginning of time',
        end_date: end_date || new Date().toISOString().slice(0, 10)
      },
      revenue: { items: revenue, total: this.formatDecimal(totalRevenue) },
      cogs: { items: cogs, total: this.formatDecimal(totalCogs) },
      grossProfit: this.formatDecimal(grossProfit),
      operatingExpenses: { items: expenses, total: this.formatDecimal(totalExpenses) },
      operatingIncome: this.formatDecimal(operatingIncome),
      otherIncome: { items: otherIncome, total: this.formatDecimal(totalOtherIncome) },
      otherExpense: { items: otherExpense, total: this.formatDecimal(totalOtherExpense) },
      netProfit: this.formatDecimal(netProfit)
    };
  }

  static async getBalanceSheet({ biller_id, as_of_date }) {
    let where = "s.AccountType IN ('AS', 'LI', 'EQ')";
    const params = [];

    if (biller_id) {
      where += ' AND gt.biller_id = ?';
      params.push(biller_id);
    }
    if (as_of_date) {
      where += ' AND DATE(gt.tran_date) <= ?';
      params.push(as_of_date);
    }

    const [rows] = await pool.query(
      `SELECT 
        s.AccountType,
        s.sectionid,
        s.sectionname,
        c.accountcode,
        c.accountname,
        COALESCE(SUM(gt.amount), 0) as net_amount
       FROM aura_gl_charts c
       JOIN aura_gl_sections s ON s.sectionid = c.sectionid
       LEFT JOIN aura_gl_trans gt ON gt.account_code = c.accountcode
       WHERE ${where}
       GROUP BY s.AccountType, s.sectionid, s.sectionname, c.accountcode, c.accountname
       HAVING net_amount != 0
       ORDER BY s.sectionid ASC, c.accountcode ASC`,
      params
    );

    // Calculate current period retained earnings / net profit
    const incomeStmt = await this.getIncomeStatement({ biller_id, end_date: as_of_date });
    const currentNetProfit = incomeStmt.netProfit;

    const currentAssets = [];
    const fixedAssets = [];
    const currentLiabilities = [];
    const longTermLiabilities = [];
    const equity = [];

    let totalCurrentAssets = 0;
    let totalFixedAssets = 0;
    let totalCurrentLiabilities = 0;
    let totalLongTermLiabilities = 0;
    let totalEquity = 0;

    for (const r of rows) {
      const net = parseFloat(r.net_amount);
      if (r.sectionid === 10) {
        // Current assets
        totalCurrentAssets += net;
        currentAssets.push({ ...r, amount: this.formatDecimal(net) });
      } else if (r.sectionid === 11) {
        // Fixed assets
        totalFixedAssets += net;
        fixedAssets.push({ ...r, amount: this.formatDecimal(net) });
      } else if (r.sectionid === 20) {
        // Current liabilities
        const val = -net;
        totalCurrentLiabilities += val;
        currentLiabilities.push({ ...r, amount: this.formatDecimal(val) });
      } else if (r.sectionid === 21) {
        // Non-current liabilities
        const val = -net;
        totalLongTermLiabilities += val;
        longTermLiabilities.push({ ...r, amount: this.formatDecimal(val) });
      } else if (r.AccountType === 'EQ') {
        const val = -net;
        totalEquity += val;
        equity.push({ ...r, amount: this.formatDecimal(val) });
      }
    }

    const totalAssets = totalCurrentAssets + totalFixedAssets;
    const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;
    const totalEquityWithEarnings = totalEquity + currentNetProfit;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquityWithEarnings;

    return {
      as_of_date: as_of_date || new Date().toISOString().slice(0, 10),
      assets: {
        currentAssets: { items: currentAssets, total: this.formatDecimal(totalCurrentAssets) },
        fixedAssets: { items: fixedAssets, total: this.formatDecimal(totalFixedAssets) },
        total: this.formatDecimal(totalAssets)
      },
      liabilities: {
        currentLiabilities: { items: currentLiabilities, total: this.formatDecimal(totalCurrentLiabilities) },
        longTermLiabilities: { items: longTermLiabilities, total: this.formatDecimal(totalLongTermLiabilities) },
        total: this.formatDecimal(totalLiabilities)
      },
      equity: {
        items: equity,
        currentYearEarnings: this.formatDecimal(currentNetProfit),
        total: this.formatDecimal(totalEquityWithEarnings)
      },
      totalLiabilitiesAndEquity: this.formatDecimal(totalLiabilitiesAndEquity),
      is_balanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.001
    };
  }
}

module.exports = AccountingModel;
