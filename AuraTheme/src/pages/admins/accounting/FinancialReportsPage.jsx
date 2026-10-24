import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  DatePicker,
  Button,
  Table,
  Row,
  Col,
  Statistic,
  Tag,
  Typography,
  Space,
  Alert,
  Divider,
  Spin,
  message
} from 'antd';
import {
  PrinterOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BookOutlined,
  FileTextOutlined,
  DollarOutlined,
  AuditOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';
import { useTranslation } from '../../../contexts/LanguageContext';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const FinancialReportsPage = () => {
  const { t } = useTranslation();
  const [activeReport, setActiveReport] = useState('trial-balance');
  const [asOfDate, setAsOfDate] = useState(dayjs());
  const [dateRange, setDateRange] = useState([dayjs().startOf('year'), dayjs()]);
  const [loading, setLoading] = useState(false);

  // Reports data state
  const [trialBalanceData, setTrialBalanceData] = useState(null);
  const [balanceSheetData, setBalanceSheetData] = useState(null);
  const [incomeStatementData, setIncomeStatementData] = useState(null);

  // Fetch Trial Balance
  const fetchTrialBalance = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/accounting/reports/trial-balance', {
        params: { as_of_date: asOfDate.format('YYYY-MM-DD') }
      });
      if (res.data?.status) setTrialBalanceData(res.data.data);
    } catch (err) {
      message.error('Failed to load Trial Balance');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Balance Sheet
  const fetchBalanceSheet = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/accounting/reports/balance-sheet', {
        params: { as_of_date: asOfDate.format('YYYY-MM-DD') }
      });
      if (res.data?.status) setBalanceSheetData(res.data.data);
    } catch (err) {
      message.error('Failed to load Balance Sheet');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Income Statement
  const fetchIncomeStatement = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/accounting/reports/income-statement', {
        params: {
          start_date: dateRange[0]?.format('YYYY-MM-DD'),
          end_date: dateRange[1]?.format('YYYY-MM-DD')
        }
      });
      if (res.data?.status) setIncomeStatementData(res.data.data);
    } catch (err) {
      message.error('Failed to load Income Statement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeReport === 'trial-balance') fetchTrialBalance();
    if (activeReport === 'balance-sheet') fetchBalanceSheet();
    if (activeReport === 'income-statement') fetchIncomeStatement();
  }, [activeReport, asOfDate, dateRange]);

  return (
    <div>
      {/* Report Switcher Header */}
      <Card bordered={false} style={{ borderRadius: 10, marginBottom: 16 }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Title level={4} style={{ margin: 0 }}>
              {t('statutory_financial_reports', 'Financial Reports & Accounting Statements')}
            </Title>
            <Text type="secondary">
              {t('audit_ready_reports', 'Certified double-entry financial statements generated from aura_gl_trans.')}
            </Text>
          </Col>

          <Col xs={24} md={12} style={{ textAlign: 'right' }}>
            <Space wrap>
              {activeReport === 'income-statement' ? (
                <RangePicker value={dateRange} onChange={setDateRange} allowClear={false} />
              ) : (
                <DatePicker value={asOfDate} onChange={setAsOfDate} allowClear={false} />
              )}
              <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
                {t('print_export', 'Print / PDF')}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card bordered={false} style={{ borderRadius: 10 }}>
        <Tabs
          activeKey={activeReport}
          onChange={setActiveReport}
          items={[
            {
              key: 'trial-balance',
              label: (
                <span>
                  <AuditOutlined /> {t('trial_balance', 'Trial Balance')}
                </span>
              ),
              children: (
                <div>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ fontSize: 16 }}>
                      {t('trial_balance_as_of', 'Trial Balance as of')} {asOfDate.format('MMMM DD, YYYY')}
                    </Text>
                    {trialBalanceData && (
                      <Tag
                        color={trialBalanceData.is_balanced ? 'success' : 'error'}
                        style={{ fontSize: 13, padding: '4px 12px' }}
                      >
                        {trialBalanceData.is_balanced ? <CheckCircleOutlined /> : <CloseCircleOutlined />} {trialBalanceData.is_balanced ? t('balanced_ledger', 'DEBITS EQUAL CREDITS') : t('unbalanced', 'UNBALANCED')}
                      </Tag>
                    )}
                  </div>

                  <Table
                    dataSource={trialBalanceData?.accounts || []}
                    rowKey="accountcode"
                    loading={loading}
                    pagination={false}
                    size="small"
                    columns={[
                      {
                        title: t('account_code', 'Code'),
                        dataIndex: 'accountcode',
                        width: 140,
                        render: (c) => <Text code>{c}</Text>
                      },
                      {
                        title: t('account_name', 'Account Title'),
                        dataIndex: 'accountname',
                        render: (name) => <span style={{ fontWeight: 600 }}>{name}</span>
                      },
                      {
                        title: t('classification', 'Classification'),
                        dataIndex: 'sectionname',
                        width: 220,
                        render: (sec, r) => (
                          <span><Tag>{r.AccountType}</Tag> {sec}</span>
                        )
                      },
                      {
                        title: t('debit', 'Debit ($)'),
                        dataIndex: 'debit',
                        align: 'right',
                        width: 150,
                        render: (v) => v > 0 ? (
                          <span style={{ color: '#16a34a', fontWeight: 600 }}>${parseFloat(v).toFixed(2)}</span>
                        ) : '-'
                      },
                      {
                        title: t('credit', 'Credit ($)'),
                        dataIndex: 'credit',
                        align: 'right',
                        width: 150,
                        render: (v) => v > 0 ? (
                          <span style={{ color: '#dc2626', fontWeight: 600 }}>${parseFloat(v).toFixed(2)}</span>
                        ) : '-'
                      }
                    ]}
                    summary={() => (
                      <Table.Summary fixed>
                        <Table.Summary.Row style={{ background: '#f8fafc', fontWeight: 700 }}>
                          <Table.Summary.Cell index={0} colSpan={3} align="right">
                            {t('total_trial_balance', 'Total Debit & Credit')}:
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={1} align="right" style={{ color: '#16a34a', fontSize: 15 }}>
                            ${trialBalanceData?.total_debit?.toFixed(2)}
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={2} align="right" style={{ color: '#dc2626', fontSize: 15 }}>
                            ${trialBalanceData?.total_credit?.toFixed(2)}
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                      </Table.Summary>
                    )}
                  />
                </div>
              )
            },
            {
              key: 'balance-sheet',
              label: (
                <span>
                  <BookOutlined /> {t('balance_sheet', 'Balance Sheet')}
                </span>
              ),
              children: (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <Title level={4} style={{ margin: 0 }}>{t('statement_of_financial_position', 'Statement of Financial Position (Balance Sheet)')}</Title>
                    <Text type="secondary">{t('as_of', 'As of')} {asOfDate.format('MMMM DD, YYYY')}</Text>
                  </div>

                  <Row gutter={24}>
                    {/* Left Column: Assets */}
                    <Col xs={24} md={12}>
                      <Card title={<span style={{ color: '#16a34a' }}>{t('assets', 'ASSETS')}</span>} size="small" style={{ marginBottom: 16 }}>
                        <div style={{ fontWeight: 600, margin: '8px 0', color: '#475569' }}>{t('current_assets', 'Current Assets')}</div>
                        {balanceSheetData?.assets?.currentAssets?.items?.map(it => (
                          <div key={it.accountcode} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #f1f5f9' }}>
                            <span>{it.accountcode} - {it.accountname}</span>
                            <span style={{ fontWeight: 600 }}>${it.amount?.toFixed(2)}</span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 700, color: '#16a34a' }}>
                          <span>{t('total_current_assets', 'Total Current Assets')}:</span>
                          <span>${balanceSheetData?.assets?.currentAssets?.total?.toFixed(2)}</span>
                        </div>

                        <Divider style={{ margin: '8px 0' }} />

                        <div style={{ fontWeight: 600, margin: '8px 0', color: '#475569' }}>{t('fixed_assets', 'Fixed / Non-Current Assets')}</div>
                        {balanceSheetData?.assets?.fixedAssets?.items?.map(it => (
                          <div key={it.accountcode} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #f1f5f9' }}>
                            <span>{it.accountcode} - {it.accountname}</span>
                            <span style={{ fontWeight: 600 }}>${it.amount?.toFixed(2)}</span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 700, color: '#16a34a' }}>
                          <span>{t('total_fixed_assets', 'Total Fixed Assets')}:</span>
                          <span>${balanceSheetData?.assets?.fixedAssets?.total?.toFixed(2)}</span>
                        </div>

                        <div style={{ background: '#f0fdf4', padding: '12px 16px', borderRadius: 8, marginTop: 16, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, color: '#16a34a' }}>
                          <span>{t('total_assets', 'TOTAL ASSETS')}:</span>
                          <span>${balanceSheetData?.assets?.total?.toFixed(2)}</span>
                        </div>
                      </Card>
                    </Col>

                    {/* Right Column: Liabilities & Equity */}
                    <Col xs={24} md={12}>
                      <Card title={<span style={{ color: '#dc2626' }}>{t('liabilities_and_equity', 'LIABILITIES & EQUITY')}</span>} size="small" style={{ marginBottom: 16 }}>
                        <div style={{ fontWeight: 600, margin: '8px 0', color: '#475569' }}>{t('current_liabilities', 'Current Liabilities')}</div>
                        {balanceSheetData?.liabilities?.currentLiabilities?.items?.map(it => (
                          <div key={it.accountcode} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #f1f5f9' }}>
                            <span>{it.accountcode} - {it.accountname}</span>
                            <span style={{ fontWeight: 600 }}>${it.amount?.toFixed(2)}</span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 700, color: '#dc2626' }}>
                          <span>{t('total_current_liabilities', 'Total Current Liabilities')}:</span>
                          <span>${balanceSheetData?.liabilities?.currentLiabilities?.total?.toFixed(2)}</span>
                        </div>

                        <Divider style={{ margin: '8px 0' }} />

                        <div style={{ fontWeight: 600, margin: '8px 0', color: '#475569' }}>{t('owner_equity', 'Owner Equity & Retained Earnings')}</div>
                        {balanceSheetData?.equity?.items?.map(it => (
                          <div key={it.accountcode} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #f1f5f9' }}>
                            <span>{it.accountcode} - {it.accountname}</span>
                            <span style={{ fontWeight: 600 }}>${it.amount?.toFixed(2)}</span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #f1f5f9' }}>
                          <span>{t('current_period_earnings', 'Current Period Net Profit / (Loss)')}</span>
                          <span style={{ fontWeight: 600, color: (balanceSheetData?.equity?.currentYearEarnings || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                            ${balanceSheetData?.equity?.currentYearEarnings?.toFixed(2)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 700, color: '#2563eb' }}>
                          <span>{t('total_equity', 'Total Equity')}:</span>
                          <span>${balanceSheetData?.equity?.total?.toFixed(2)}</span>
                        </div>

                        <div style={{ background: '#eff6ff', padding: '12px 16px', borderRadius: 8, marginTop: 16, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, color: '#2563eb' }}>
                          <span>{t('total_liabilities_equity', 'TOTAL LIABILITIES & EQUITY')}:</span>
                          <span>${balanceSheetData?.totalLiabilitiesAndEquity?.toFixed(2)}</span>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </div>
              )
            },
            {
              key: 'income-statement',
              label: (
                <span>
                  <FileTextOutlined /> {t('income_statement', 'Profit & Loss (Income Statement)')}
                </span>
              ),
              children: (
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <Title level={4} style={{ margin: 0 }}>{t('statement_of_profit_loss', 'Statement of Profit and Loss')}</Title>
                    <Text type="secondary">
                      {t('for_period_from', 'For Period')}: {dateRange[0]?.format('YYYY-MM-DD')} {t('to', 'to')} {dateRange[1]?.format('YYYY-MM-DD')}
                    </Text>
                  </div>

                  {/* Revenue */}
                  <Card size="small" style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#16a34a', marginBottom: 8 }}>{t('operating_revenue', '1. OPERATING REVENUE')}</div>
                    {incomeStatementData?.revenue?.items?.map(it => (
                      <div key={it.accountcode} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                        <span>{it.accountcode} - {it.accountname}</span>
                        <span>${it.amount?.toFixed(2)}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid #e2e8f0', paddingTop: 6, marginTop: 4 }}>
                      <span>{t('total_revenue', 'Total Operating Revenue')}:</span>
                      <span style={{ color: '#16a34a' }}>${incomeStatementData?.revenue?.total?.toFixed(2)}</span>
                    </div>
                  </Card>

                  {/* COGS */}
                  <Card size="small" style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#ea580c', marginBottom: 8 }}>{t('cogs_title', '2. COST OF GOODS SOLD (COGS)')}</div>
                    {incomeStatementData?.cogs?.items?.map(it => (
                      <div key={it.accountcode} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                        <span>{it.accountcode} - {it.accountname}</span>
                        <span>${it.amount?.toFixed(2)}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid #e2e8f0', paddingTop: 6, marginTop: 4 }}>
                      <span>{t('total_cogs', 'Total Cost of Sales')}:</span>
                      <span style={{ color: '#ea580c' }}>${incomeStatementData?.cogs?.total?.toFixed(2)}</span>
                    </div>
                  </Card>

                  {/* Gross Profit */}
                  <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
                    <span>{t('gross_profit', 'GROSS PROFIT')}:</span>
                    <span style={{ color: (incomeStatementData?.grossProfit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                      ${incomeStatementData?.grossProfit?.toFixed(2)}
                    </span>
                  </div>

                  {/* Operating Expenses */}
                  <Card size="small" style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>{t('operating_expenses', '3. OPERATING EXPENSES')}</div>
                    {incomeStatementData?.operatingExpenses?.items?.map(it => (
                      <div key={it.accountcode} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                        <span>{it.accountcode} - {it.accountname}</span>
                        <span>${it.amount?.toFixed(2)}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid #e2e8f0', paddingTop: 6, marginTop: 4 }}>
                      <span>{t('total_operating_expenses', 'Total Operating Expenses')}:</span>
                      <span style={{ color: '#dc2626' }}>${incomeStatementData?.operatingExpenses?.total?.toFixed(2)}</span>
                    </div>
                  </Card>

                  {/* Net Profit */}
                  <div style={{ background: (incomeStatementData?.netProfit || 0) >= 0 ? '#f0fdf4' : '#fef2f2', padding: '16px 20px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18 }}>
                    <span>{t('net_profit_loss', 'NET PROFIT / (LOSS)')}:</span>
                    <span style={{ color: (incomeStatementData?.netProfit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                      ${incomeStatementData?.netProfit?.toFixed(2)}
                    </span>
                  </div>
                </div>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default FinancialReportsPage;
