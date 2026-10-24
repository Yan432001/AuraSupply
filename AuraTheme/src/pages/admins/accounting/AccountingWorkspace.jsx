import React, { useState, useEffect } from 'react';
import { Card, Tabs, Typography, Badge } from 'antd';
import {
  DashboardOutlined,
  BookOutlined,
  FileTextOutlined,
  PlusCircleOutlined,
  AuditOutlined,
  BankOutlined,
  DollarOutlined,
  ScheduleOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../contexts/LanguageContext';

// Sub-components
import AccountingDashboard from './AccountingDashboard';
import ChartOfAccountsPage from './ChartOfAccountsPage';
import JournalEntriesPage from './JournalEntriesPage';
import AddJournalEntryPage from './AddJournalEntryPage';
import GeneralLedgerPage from './GeneralLedgerPage';
import CashBankPage from './CashBankPage';
import AccountsReceivablePage from './AccountsReceivablePage';
import AccountsPayablePage from './AccountsPayablePage';
import FinancialReportsPage from './FinancialReportsPage';

const { Title, Text } = Typography;

const AccountingWorkspace = ({ initialTab = 'dashboard' }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const menuKey = searchParams.get('menu');
  const tabParam = searchParams.get('tab');

  // Map sidebar menuKey to activeTab
  const resolveTab = () => {
    if (tabParam) return tabParam;
    if (menuKey === 'chart-of-accounts') return 'accounts';
    if (menuKey === 'journal-entries') return 'journals';
    if (menuKey === 'cash-book' || menuKey === 'bank-reconcile') return 'cash-bank';
    if (menuKey === 'balance-sheet' || menuKey === 'profit-loss' || menuKey === 'trial-balance') return 'reports';
    if (menuKey === 'ar-ap-aging') return 'ar';
    return initialTab || 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(resolveTab());
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState(null);

  useEffect(() => {
    setActiveTab(resolveTab());
  }, [location.search]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    const params = new URLSearchParams(location.search);
    params.set('tab', key);
    navigate({ search: params.toString() }, { replace: true });
  };

  const handleSelectAccountForLedger = (accountCode) => {
    setSelectedLedgerAccount(accountCode);
    handleTabChange('ledger');
  };

  const tabItems = [
    {
      key: 'dashboard',
      label: (
        <span>
          <DashboardOutlined /> {t('accounting_dashboard', 'Dashboard')}
        </span>
      ),
      children: <AccountingDashboard onNavigateTab={handleTabChange} />
    },
    {
      key: 'accounts',
      label: (
        <span>
          <BookOutlined /> {t('chart_of_accounts', 'Chart of Accounts')}
        </span>
      ),
      children: <ChartOfAccountsPage onSelectAccountForLedger={handleSelectAccountForLedger} />
    },
    {
      key: 'journals',
      label: (
        <span>
          <FileTextOutlined /> {t('journal_entries', 'Journal Entries')}
        </span>
      ),
      children: <JournalEntriesPage onAddNewJournal={() => handleTabChange('add-journal')} />
    },
    {
      key: 'add-journal',
      label: (
        <span>
          <PlusCircleOutlined style={{ color: '#16a34a' }} /> {t('add_journal', 'New Voucher')}
        </span>
      ),
      children: (
        <AddJournalEntryPage
          onCancel={() => handleTabChange('journals')}
          onSuccess={() => handleTabChange('journals')}
        />
      )
    },
    {
      key: 'ledger',
      label: (
        <span>
          <AuditOutlined /> {t('general_ledger', 'General Ledger')}
        </span>
      ),
      children: <GeneralLedgerPage defaultAccountCode={selectedLedgerAccount} />
    },
    {
      key: 'cash-bank',
      label: (
        <span>
          <BankOutlined /> {t('cash_and_bank', 'Cash & Bank')}
        </span>
      ),
      children: <CashBankPage />
    },
    {
      key: 'ar',
      label: (
        <span>
          <DollarOutlined /> {t('accounts_receivable', 'Receivables (AR)')}
        </span>
      ),
      children: <AccountsReceivablePage />
    },
    {
      key: 'ap',
      label: (
        <span>
          <ScheduleOutlined /> {t('accounts_payable', 'Payables (AP)')}
        </span>
      ),
      children: <AccountsPayablePage />
    },
    {
      key: 'reports',
      label: (
        <span>
          <FileTextOutlined /> {t('financial_reports', 'Financial Reports')}
        </span>
      ),
      children: <FinancialReportsPage />
    }
  ];

  return (
    <div style={{ padding: '0 8px' }}>
      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
        }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          type="line"
          size="large"
          tabBarStyle={{ marginBottom: 20 }}
        />
      </Card>
    </div>
  );
};

export default AccountingWorkspace;
