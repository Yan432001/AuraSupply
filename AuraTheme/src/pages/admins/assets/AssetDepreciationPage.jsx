import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Row,
  Col,
  Statistic,
  Space,
  Select,
  Input,
  DatePicker,
  Typography,
  Progress,
  Tag,
  Popconfirm,
  message,
  Alert
} from 'antd';
import {
  CalculatorOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  DollarOutlined,
  FallOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useTranslation } from '../../../contexts/LanguageContext';

const { Title, Text } = Typography;
const { Option } = Select;

const AssetDepreciationPage = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ schedule: [], totals: {} });
  const [categories, setCategories] = useState([]);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [targetDate, setTargetDate] = useState(dayjs());
  const [runningBatch, setRunningBatch] = useState(false);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const params = {
        category_id: selectedCategory || undefined,
        search: searchText || undefined,
        target_date: targetDate ? targetDate.format('YYYY-MM-DD') : undefined
      };
      const res = await axios.get('/api/admin/assets/depreciation', { params });
      if (res.data?.status && res.data.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching depreciation schedule:', err);
      message.error(t('failed_fetch_depreciation', 'Failed to calculate depreciation schedule.'));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/admin/assets/categories');
      if (res.data?.status) {
        setCategories(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [selectedCategory, targetDate]);

  const handleRunDepreciation = async () => {
    try {
      setRunningBatch(true);
      const res = await axios.post('/api/admin/assets/depreciation/run', {
        target_date: targetDate ? targetDate.format('YYYY-MM-DD') : undefined
      });
      if (res.data?.status) {
        message.success(
          t('depreciation_batch_success', `Depreciation committed for ${res.data.data?.assets_updated} assets! Total amortized: $${res.data.data?.total_accumulated_depreciation}`)
        );
        fetchSchedule();
      }
    } catch (err) {
      console.error('Batch depreciation error:', err);
      message.error(err.response?.data?.message || err.message);
    } finally {
      setRunningBatch(false);
    }
  };

  const totals = data.totals || {};
  const schedule = data.schedule || [];

  const columns = [
    {
      title: t('asset', 'Equipment & Category'),
      key: 'asset',
      render: (_, r) => (
        <div>
          <Text strong style={{ color: '#2563eb' }}>{r.asset_code}</Text>
          <div>{r.name}</div>
          <Tag color="geekblue" style={{ fontSize: 11, padding: '0 4px', marginTop: 2 }}>{r.category_name}</Tag>
        </div>
      )
    },
    {
      title: t('in_service_date', 'In-Service Date'),
      dataIndex: 'purchase_date',
      key: 'purchase_date',
      render: (d) => d ? new Date(d).toLocaleDateString() : '-'
    },
    {
      title: t('original_cost', 'Original Cost ($)'),
      dataIndex: 'purchase_cost',
      key: 'purchase_cost',
      align: 'right',
      render: (c) => `$${parseFloat(c || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    {
      title: t('salvage_value', 'Salvage ($)'),
      dataIndex: 'residual_value',
      key: 'residual_value',
      align: 'right',
      render: (s) => `$${parseFloat(s || 0).toFixed(2)}`
    },
    {
      title: t('amortization_life', 'Useful Life (Months)'),
      key: 'life',
      align: 'center',
      render: (_, r) => (
        <div>
          <span style={{ fontWeight: 600 }}>{r.useful_life_months} mo</span>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            Elapsed: {r.months_elapsed} | Left: {r.remaining_months}
          </div>
        </div>
      )
    },
    {
      title: t('monthly_expense', 'Monthly Amortization'),
      dataIndex: 'monthly_depreciation',
      key: 'monthly_depreciation',
      align: 'right',
      render: (m) => `$${parseFloat(m || 0).toFixed(2)}`
    },
    {
      title: t('amortized_depreciation', 'Amortized Depreciation ($)'),
      key: 'depreciation_progress',
      width: 220,
      render: (_, r) => (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ fontWeight: 600, color: '#d97706' }}>
              ${parseFloat(r.accumulated_depreciation || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span>{r.depreciation_percentage}%</span>
          </div>
          <Progress percent={r.depreciation_percentage} size="small" strokeColor="#d97706" showInfo={false} />
        </div>
      )
    },
    {
      title: t('net_book_value', 'Net Book Value ($)'),
      dataIndex: 'net_book_value',
      key: 'net_book_value',
      align: 'right',
      render: (b) => (
        <span style={{ fontWeight: 700, color: '#16a34a', fontSize: 14 }}>
          ${parseFloat(b || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    }
  ];

  return (
    <Card style={{ borderRadius: 8 }}>
      {/* 1. Header Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {t('straight_line_depreciation_engine', 'Straight-Line Depreciation & Amortization Engine')}
          </Title>
          <Text type="secondary">
            {t('depreciation_desc', 'Calculate statutory monthly depreciation, track diminishing net book values, and commit ledger journal amortizations.')}
          </Text>
        </div>
        <Space wrap>
          <Popconfirm
            title={t('confirm_run_depreciation', 'Commit Depreciation Schedule?')}
            description={t('confirm_run_desc', 'This will update the recorded accumulated depreciation and current book value for all active capital assets as of the selected target date.')}
            onConfirm={handleRunDepreciation}
            okText={t('execute', 'Execute Amortization')}
            cancelText={t('cancel', 'Cancel')}
          >
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              loading={runningBatch}
              style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
            >
              {t('commit_amortization', 'Commit Amortization to Database')}
            </Button>
          </Popconfirm>
          <Button icon={<ReloadOutlined />} onClick={fetchSchedule}>
            {t('recalculate', 'Recalculate')}
          </Button>
        </Space>
      </div>

      {/* 2. KPI Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ borderRadius: 6, background: '#f8fafc', borderLeft: '3px solid #2563eb' }}>
            <Statistic
              title={t('portfolio_acquisition_cost', 'Total Portfolio Cost')}
              value={totals.total_cost || 0}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#0f172a', fontWeight: 700 }}
            />
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              Active Capital Equipment: <strong>{totals.total_assets || 0} units</strong>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ borderRadius: 6, background: '#f8fafc', borderLeft: '3px solid #16a34a' }}>
            <Statistic
              title={t('total_net_book_value', 'Total Net Book Value')}
              value={totals.total_net_book_value || 0}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#16a34a', fontWeight: 700 }}
            />
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              Remaining balance on balance sheet
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ borderRadius: 6, background: '#f8fafc', borderLeft: '3px solid #d97706' }}>
            <Statistic
              title={t('total_amortized_depreciation', 'Total Amortized Depreciation')}
              value={totals.total_accumulated_depreciation || 0}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#d97706', fontWeight: 700 }}
            />
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              Accumulated write-off to date
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ borderRadius: 6, background: '#f8fafc', borderLeft: '3px solid #7c3aed' }}>
            <Statistic
              title={t('monthly_depreciation_run_rate', 'Monthly Amortization Run-Rate')}
              value={totals.total_monthly_depreciation || 0}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#7c3aed', fontWeight: 700 }}
            />
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              Monthly P&L depreciation expense
            </div>
          </Card>
        </Col>
      </Row>

      {/* 3. Filter Bar */}
      <Card size="small" style={{ marginBottom: 16, background: '#f8fafc', borderColor: '#e2e8f0' }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder={t('search_asset', 'Search asset code or name...')}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={fetchSchedule}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} md={6}>
            <Select
              style={{ width: '100%' }}
              placeholder={t('filter_by_category', 'Filter by Category')}
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(val)}
              allowClear
            >
              {categories.map((c) => (
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={6}>
            <Space align="center">
              <Text strong>{t('as_of_date', 'As of Date:')}</Text>
              <DatePicker
                value={targetDate}
                onChange={(d) => setTargetDate(d)}
                allowClear={false}
              />
            </Space>
          </Col>
          <Col xs={24} sm={6} md={4} style={{ textAlign: 'right' }}>
            <Button type="primary" onClick={fetchSchedule} icon={<CalculatorOutlined />}>
              {t('calculate', 'Calculate')}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 4. Schedule Table */}
      <Table
        dataSource={schedule}
        columns={columns}
        rowKey="asset_id"
        loading={loading}
        size="middle"
        pagination={false}
      />
    </Card>
  );
};

export default AssetDepreciationPage;
