import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Row,
  Col,
  Statistic,
  Typography,
  message,
  Switch
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../contexts/LanguageContext';

const { Title, Text } = Typography;

const AccountsPayablePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  const fetchAP = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.pageSize,
        search: search.trim() || undefined,
        overdue_only: overdueOnly ? 'true' : undefined
      };
      const res = await axios.get('/api/admin/accounting/ap', { params });
      if (res.data?.status) {
        setBills(res.data.data || []);
        setPagination({
          current: res.data.pagination?.page || 1,
          pageSize: res.data.pagination?.limit || 20,
          total: res.data.pagination?.total || 0
        });
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to load Accounts Payable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAP(1);
  }, [overdueOnly]);

  const totalOutstanding = bills.reduce((acc, b) => acc + (parseFloat(b.balance_due) || 0), 0);
  const overdueCount = bills.filter(b => (parseInt(b.days_outstanding, 10) || 0) > 30).length;

  const columns = [
    {
      title: t('bill_date', 'Bill Date'),
      dataIndex: 'date',
      width: 120,
      render: (d) => d ? dayjs(d).format('YYYY-MM-DD') : '-'
    },
    {
      title: t('reference_no', 'Purchase Ref.'),
      dataIndex: 'reference_no',
      width: 160,
      render: (ref) => (
        <span style={{ fontWeight: 600, color: '#2563eb' }}>
          {ref}
        </span>
      )
    },
    {
      title: t('supplier_name', 'Supplier / Vendor'),
      dataIndex: 'supplier_name',
      render: (name, r) => (
        <div>
          <span style={{ fontWeight: 600 }}>{name}</span>
          {r.supplier_company && <div style={{ fontSize: 11, color: '#64748b' }}>{r.supplier_company}</div>}
        </div>
      )
    },
    {
      title: t('due_date', 'Due Date'),
      dataIndex: 'due_date',
      width: 120,
      render: (due) => due ? dayjs(due).format('YYYY-MM-DD') : '-'
    },
    {
      title: t('grand_total', 'Bill Total ($)'),
      dataIndex: 'grand_total',
      align: 'right',
      width: 130,
      render: (v) => `$${parseFloat(v || 0).toFixed(2)}`
    },
    {
      title: t('paid_amount', 'Paid ($)'),
      dataIndex: 'paid',
      align: 'right',
      width: 120,
      render: (p) => <span style={{ color: '#16a34a' }}>${parseFloat(p || 0).toFixed(2)}</span>
    },
    {
      title: t('balance_due', 'Balance Due ($)'),
      dataIndex: 'balance_due',
      align: 'right',
      width: 140,
      render: (b) => <Text strong style={{ color: '#dc2626' }}>${parseFloat(b || 0).toFixed(2)}</Text>
    },
    {
      title: t('aging_status', 'Aging Bucket'),
      dataIndex: 'aging_bucket',
      width: 130,
      align: 'center',
      render: (bucket) => {
        let color = 'green';
        let label = '0 - 30 Days';
        if (bucket === '31_60') { color = 'gold'; label = '31 - 60 Days'; }
        if (bucket === '61_90') { color = 'orange'; label = '61 - 90 Days'; }
        if (bucket === 'over_90') { color = 'red'; label = 'Over 90 Days'; }
        return <Tag color={color}>{label}</Tag>;
      }
    }
  ];

  return (
    <div>
      {/* Metric Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card bordered={false} style={{ borderRadius: 10 }}>
            <Statistic
              title={<span style={{ fontWeight: 600 }}>{t('total_payables_outstanding', 'Total Payables Outstanding')}</span>}
              value={totalOutstanding}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#dc2626', fontWeight: 700 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {bills.length} {t('bills_with_balances', 'Purchase bills with open liabilities')}
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card bordered={false} style={{ borderRadius: 10 }}>
            <Statistic
              title={<span style={{ fontWeight: 600 }}>{t('past_due_payables', 'Overdue Payables (>30 Days)')}</span>}
              value={overdueCount}
              valueStyle={{ color: '#ea580c', fontWeight: 700 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('supplier_payment_schedules', 'Subject to supplier credit terms')}
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={24} lg={8} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => fetchAP(1)}>
              {t('refresh', 'Refresh')}
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Filters and Table */}
      <Card bordered={false} style={{ borderRadius: 10, marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={14}>
            <Space>
              <Input
                placeholder={t('search_supplier_bill', 'Search supplier name or purchase ref...')}
                prefix={<SearchOutlined />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onPressEnter={() => fetchAP(1)}
                style={{ width: 300 }}
                allowClear
              />
              <Button type="primary" onClick={() => fetchAP(1)}>{t('search', 'Search')}</Button>
            </Space>
          </Col>

          <Col xs={24} sm={10} style={{ textAlign: 'right' }}>
            <Space>
              <span>{t('show_overdue_only', 'Overdue Only (>30d)')}:</span>
              <Switch checked={overdueOnly} onChange={setOverdueOnly} />
            </Space>
          </Col>
        </Row>
      </Card>

      <Card bordered={false} style={{ borderRadius: 10 }}>
        <Table
          dataSource={bills}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (p) => fetchAP(p)
          }}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default AccountsPayablePage;
