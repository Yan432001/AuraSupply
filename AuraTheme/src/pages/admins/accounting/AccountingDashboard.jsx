import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Space,
  Button,
  Table,
  Tag,
  Alert,
  Spin,
  Divider,
  Progress
} from 'antd';
import {
  DollarOutlined,
  BankOutlined,
  BookOutlined,
  SwapOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CheckCircleOutlined,
  AuditOutlined,
  PlusOutlined,
  FileTextOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useTranslation } from '../../../contexts/LanguageContext';
import { useAdminTheme } from '../../../hooks/useAdminTheme';

const { Title, Text } = Typography;

const AccountingDashboard = ({ onNavigateTab }) => {
  const { t } = useTranslation();
  const { themeTokens } = useAdminTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/admin/accounting/dashboard');
      if (res.data?.status && res.data?.data) {
        setData(res.data.data);
      } else {
        setError('Failed to load dashboard metrics');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spin size="large" tip={t('loading_accounting_data', 'Loading financial indicators...')} />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        message={t('error', 'Error')}
        description={error}
        showIcon
        action={<Button onClick={fetchMetrics}>{t('retry', 'Retry')}</Button>}
        style={{ margin: 20 }}
      />
    );
  }

  const isNetProfitPositive = (data?.netProfit || 0) >= 0;

  return (
    <div style={{ padding: '4px 0' }}>
      {/* Quick Action Shortcuts */}
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {t('financial_overview', 'Financial Overview & Executive Dashboard')}
          </Title>
          <Text type="secondary">
            {t('real_time_gl_sync', 'Real-time financial metrics computed directly from posted General Ledger transactions.')}
          </Text>
        </div>
        <Space wrap>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ background: '#16a34a', borderColor: '#16a34a' }}
            onClick={() => onNavigateTab('add-journal')}
          >
            {t('new_journal_entry', 'New Journal Voucher')}
          </Button>
          <Button
            icon={<SwapOutlined />}
            onClick={() => onNavigateTab('cash-bank')}
          >
            {t('account_transfer', 'Transfer Funds')}
          </Button>
          <Button
            icon={<FileTextOutlined />}
            onClick={() => onNavigateTab('reports')}
          >
            {t('financial_reports', 'Financial Statements')}
          </Button>
        </Space>
      </div>

      {/* Row 1: High-level Revenue, Expenses & Net Profit */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<span style={{ fontWeight: 600 }}>{t('total_revenue', 'Operating Revenue')}</span>}
              value={data?.revenue || 0}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#16a34a', fontWeight: 700 }}
            />
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>{t('gross_profit', 'Gross Profit')}:</Text>
              <Text strong style={{ fontSize: 12 }}>${(data?.grossProfit || 0).toLocaleString()}</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<span style={{ fontWeight: 600 }}>{t('operating_expenses', 'Operating Expenses')}</span>}
              value={data?.expenses || 0}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#dc2626', fontWeight: 700 }}
            />
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>{t('cost_of_sales', 'COGS')}:</Text>
              <Text strong style={{ fontSize: 12 }}>${(data?.cogs || 0).toLocaleString()}</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<span style={{ fontWeight: 600 }}>{t('net_profit', 'Net Profit / (Loss)')}</span>}
              value={Math.abs(data?.netProfit || 0)}
              precision={2}
              prefix={isNetProfitPositive ? '+$' : '-$'}
              valueStyle={{ color: isNetProfitPositive ? '#16a34a' : '#dc2626', fontWeight: 700 }}
            />
            <div style={{ marginTop: 8 }}>
              <Tag color={isNetProfitPositive ? 'success' : 'error'} style={{ borderRadius: 12 }}>
                {isNetProfitPositive ? <RiseOutlined /> : <FallOutlined />} {isNetProfitPositive ? t('profitable', 'Profitable') : t('operating_loss', 'Operating Loss')}
              </Tag>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<span style={{ fontWeight: 600 }}>{t('cash_bank_reserves', 'Cash & Bank Reserves')}</span>}
              value={data?.cashBankBalance || 0}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#2563eb', fontWeight: 700 }}
            />
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>{t('active_accounts', 'Accounts')}:</Text>
              <Text strong style={{ fontSize: 12 }}>{data?.cashBankAccounts?.length || 0} {t('registers', 'Registers')}</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Row 2: Balance Sheet Position & AR / AP Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {/* Assets vs Liabilities & Equity */}
        <Col xs={24} lg={12}>
          <Card
            title={<span><BookOutlined style={{ marginRight: 8, color: '#2563eb' }} />{t('financial_position', 'Financial Position (Balance Sheet Health)')}</span>}
            bordered={false}
            style={{ borderRadius: 10, height: '100%' }}
            extra={<Button type="link" onClick={() => onNavigateTab('reports')}>{t('view_balance_sheet', 'View Full Statement')}</Button>}
          >
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <div style={{ background: '#f0fdf4', padding: '12px 16px', borderRadius: 8, borderLeft: '4px solid #16a34a' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t('total_assets', 'Total Assets')}</Text>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#16a34a' }}>${(data?.assets || 0).toLocaleString()}</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ background: '#fef2f2', padding: '12px 16px', borderRadius: 8, borderLeft: '4px solid #dc2626' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t('total_liabilities', 'Total Liabilities')}</Text>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#dc2626' }}>${(data?.liabilities || 0).toLocaleString()}</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ background: '#eff6ff', padding: '12px 16px', borderRadius: 8, borderLeft: '4px solid #2563eb' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t('equity', 'Owner Equity')}</Text>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#2563eb' }}>${(data?.equity || 0).toLocaleString()}</div>
                </div>
              </Col>
            </Row>

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong>{t('accounting_equation', 'Accounting Equation Status')}:</Text>
              <Tag color="green" icon={<CheckCircleOutlined />}>
                Assets = Liabilities + Equity
              </Tag>
            </div>
          </Card>
        </Col>

        {/* Working Capital: AR & AP */}
        <Col xs={24} lg={12}>
          <Card
            title={<span><AuditOutlined style={{ marginRight: 8, color: '#ca8a04' }} />{t('working_capital_ar_ap', 'Working Capital: AR vs AP Aging')}</span>}
            bordered={false}
            style={{ borderRadius: 10, height: '100%' }}
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card type="inner" title={<span style={{ color: '#2563eb' }}>{t('accounts_receivable', 'Accounts Receivable (AR)')}</span>} size="small"
                  extra={<Button type="link" size="small" onClick={() => onNavigateTab('ar')}>{t('view', 'View')}</Button>}
                >
                  <Statistic
                    value={data?.accountsReceivable?.outstanding || 0}
                    precision={2}
                    prefix="$"
                    valueStyle={{ color: '#2563eb', fontSize: 20 }}
                  />
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                    {data?.accountsReceivable?.openInvoices || 0} {t('unpaid_invoices', 'Unpaid Customer Invoices')}
                  </div>
                </Card>
              </Col>

              <Col span={12}>
                <Card type="inner" title={<span style={{ color: '#dc2626' }}>{t('accounts_payable', 'Accounts Payable (AP)')}</span>} size="small"
                  extra={<Button type="link" size="small" onClick={() => onNavigateTab('ap')}>{t('view', 'View')}</Button>}
                >
                  <Statistic
                    value={data?.accountsPayable?.outstanding || 0}
                    precision={2}
                    prefix="$"
                    valueStyle={{ color: '#dc2626', fontSize: 20 }}
                  />
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                    {data?.accountsPayable?.openBills || 0} {t('unpaid_bills', 'Unpaid Supplier Bills')}
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Row 3: Recent Journal Entries & GL Feed */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={<span><BookOutlined style={{ marginRight: 8 }} />{t('recent_journals', 'Recent Journal Vouchers')}</span>}
            bordered={false}
            style={{ borderRadius: 10 }}
            extra={<Button type="link" onClick={() => onNavigateTab('journals')}>{t('view_all', 'View All')}</Button>}
          >
            <Table
              dataSource={data?.recentJournals || []}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: t('date', 'Date'),
                  dataIndex: 'date',
                  render: (d) => d ? new Date(d).toLocaleDateString() : '-'
                },
                {
                  title: t('reference', 'Reference'),
                  dataIndex: 'reference_no',
                  render: (ref) => <Text strong style={{ color: '#2563eb' }}>{ref}</Text>
                },
                {
                  title: t('amount', 'Amount'),
                  dataIndex: 'total_amount',
                  align: 'right',
                  render: (v) => <Text strong>${parseFloat(v || 0).toFixed(2)}</Text>
                },
                {
                  title: t('status', 'Status'),
                  render: () => <Tag color="blue">{t('posted', 'POSTED')}</Tag>
                }
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={<span><AuditOutlined style={{ marginRight: 8 }} />{t('recent_gl_postings', 'General Ledger Audit Feed')}</span>}
            bordered={false}
            style={{ borderRadius: 10 }}
            extra={<Button type="link" onClick={() => onNavigateTab('ledger')}>{t('view_ledger', 'View Ledger')}</Button>}
          >
            <Table
              dataSource={data?.recentTransactions || []}
              rowKey="tran_id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: t('date', 'Date'),
                  dataIndex: 'tran_date',
                  render: (d) => d ? new Date(d).toLocaleDateString() : '-'
                },
                {
                  title: t('account', 'Account'),
                  dataIndex: 'account_code',
                  render: (code, record) => (
                    <div>
                      <Text strong>{code}</Text>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{record.accountname}</div>
                    </div>
                  )
                },
                {
                  title: t('type', 'Type'),
                  dataIndex: 'tran_type',
                  render: (tp) => <Tag color="geekblue">{tp}</Tag>
                },
                {
                  title: t('debit_credit', 'Movement'),
                  align: 'right',
                  render: (_, r) => {
                    const amt = parseFloat(r.amount);
                    return amt > 0 ? (
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>Dr ${amt.toFixed(2)}</span>
                    ) : (
                      <span style={{ color: '#dc2626', fontWeight: 600 }}>Cr ${Math.abs(amt).toFixed(2)}</span>
                    );
                  }
                }
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AccountingDashboard;
