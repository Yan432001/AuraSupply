import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
  Statistic,
  Tag,
  Typography,
  Space,
  Alert,
  message,
  Tooltip
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  PrinterOutlined,
  BookOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DollarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';
import { useTranslation } from '../../../contexts/LanguageContext';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const GeneralLedgerPage = ({ defaultAccountCode }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountCode, setSelectedAccountCode] = useState(defaultAccountCode || null);
  const [dateRange, setDateRange] = useState([dayjs().startOf('year'), dayjs()]);
  const [tranType, setTranType] = useState(null);
  const [ledgerData, setLedgerData] = useState(null);

  // Load account list
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await axios.get('/api/admin/accounting/accounts?limit=1000');
        if (res.data?.status) {
          const list = res.data.data || [];
          setAccounts(list);
          if (!selectedAccountCode && list.length > 0) {
            setSelectedAccountCode(list[0].accountcode);
          }
        }
      } catch (_) {}
    };
    fetchAccounts();
  }, []);

  const fetchLedger = async () => {
    if (!selectedAccountCode) return;
    setLoading(true);
    try {
      const params = {
        account_code: selectedAccountCode,
        start_date: dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : undefined,
        end_date: dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : undefined,
        tran_type: tranType || undefined
      };
      const res = await axios.get('/api/admin/accounting/ledger', { params });
      if (res.data?.status) {
        setLedgerData(res.data.data);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to fetch General Ledger statement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAccountCode) {
      fetchLedger();
    }
  }, [selectedAccountCode, dateRange, tranType]);

  const columns = [
    {
      title: t('date', 'Date'),
      dataIndex: 'tran_date',
      width: 130,
      render: (d) => d ? dayjs(d).format('YYYY-MM-DD') : '-'
    },
    {
      title: t('reference', 'Reference No.'),
      dataIndex: 'reference_no',
      width: 170,
      render: (ref) => <Text strong style={{ color: '#2563eb' }}>{ref}</Text>
    },
    {
      title: t('source_type', 'Source'),
      dataIndex: 'tran_type',
      width: 120,
      render: (tp) => <Tag color="geekblue">{tp?.toUpperCase()}</Tag>
    },
    {
      title: t('narrative', 'Account / Description'),
      dataIndex: 'narrative',
      render: (nar, r) => (
        <div>
          <span style={{ fontWeight: 600 }}>{nar}</span>
          {r.description && <div style={{ fontSize: 12, color: '#64748b' }}>{r.description}</div>}
        </div>
      )
    },
    {
      title: t('debit', 'Debit ($)'),
      dataIndex: 'debit',
      align: 'right',
      width: 130,
      render: (v) => v > 0 ? (
        <span style={{ color: '#16a34a', fontWeight: 600 }}>${parseFloat(v).toFixed(2)}</span>
      ) : '-'
    },
    {
      title: t('credit', 'Credit ($)'),
      dataIndex: 'credit',
      align: 'right',
      width: 130,
      render: (v) => v > 0 ? (
        <span style={{ color: '#dc2626', fontWeight: 600 }}>${parseFloat(v).toFixed(2)}</span>
      ) : '-'
    },
    {
      title: t('running_balance', 'Running Balance ($)'),
      dataIndex: 'running_balance',
      align: 'right',
      width: 160,
      render: (bal) => (
        <Text strong style={{ color: bal < 0 ? '#dc2626' : '#1e293b' }}>
          ${parseFloat(bal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      )
    }
  ];

  return (
    <div>
      {/* Search & Selection Controls */}
      <Card bordered={false} style={{ borderRadius: 10, marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} md={18}>
            <Space wrap>
              <Select
                showSearch
                placeholder={t('select_account', 'Select Account Code / Name')}
                value={selectedAccountCode}
                onChange={setSelectedAccountCode}
                filterOption={(input, option) =>
                  String(option.children).toLowerCase().includes(input.toLowerCase())
                }
                style={{ width: 300 }}
              >
                {accounts.map(a => (
                  <Option key={a.accountcode} value={a.accountcode}>
                    [{a.accountcode}] {a.accountname} ({a.sectionname})
                  </Option>
                ))}
              </Select>

              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                style={{ width: 260 }}
              />

              <Select
                placeholder={t('transaction_type', 'Source Module')}
                value={tranType}
                onChange={setTranType}
                style={{ width: 150 }}
                allowClear
              >
                <Option value="JOURNAL">Journal Voucher</Option>
                <Option value="SALE">Sales Invoice</Option>
                <Option value="POS">POS Sale</Option>
                <Option value="Purchases">Purchases</Option>
                <Option value="PAYMENT">Payment</Option>
                <Option value="TRANSFER">Fund Transfer</Option>
              </Select>

              <Button type="primary" icon={<SearchOutlined />} onClick={fetchLedger}>
                {t('generate_statement', 'Generate')}
              </Button>
            </Space>
          </Col>

          <Col xs={24} md={6} style={{ textAlign: 'right' }}>
            <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
              {t('print_statement', 'Print Statement')}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Account Balances Summary Card */}
      {ledgerData && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <Card bordered={false} style={{ borderRadius: 10 }}>
              <Statistic
                title={<span style={{ fontWeight: 600 }}>{t('opening_balance', 'Opening Balance')}</span>}
                value={ledgerData.opening_balance || 0}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#2563eb', fontWeight: 700 }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t('as_of', 'Prior to')} {dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : 'start'}
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card bordered={false} style={{ borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t('period_debits', 'Period Debits')}</Text>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#16a34a' }}>
                    +${(ledgerData.total_period_debit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t('period_credits', 'Period Credits')}</Text>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#dc2626' }}>
                    -${(ledgerData.total_period_credit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card bordered={false} style={{ borderRadius: 10 }}>
              <Statistic
                title={<span style={{ fontWeight: 600 }}>{t('closing_balance', 'Closing Balance')}</span>}
                value={ledgerData.closing_balance || 0}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#16a34a', fontWeight: 700 }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t('as_of', 'As of')} {dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : 'today'}
              </Text>
            </Card>
          </Col>
        </Row>
      )}

      {/* Ledger Table */}
      <Card bordered={false} style={{ borderRadius: 10 }}>
        <Table
          dataSource={ledgerData?.transactions || []}
          columns={columns}
          rowKey="tran_id"
          loading={loading}
          pagination={false}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default GeneralLedgerPage;
