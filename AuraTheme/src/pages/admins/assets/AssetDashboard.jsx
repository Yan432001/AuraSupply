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
  Progress,
  Divider,
  Tooltip
} from 'antd';
import {
  AppstoreOutlined,
  CheckCircleOutlined,
  UserOutlined,
  ToolOutlined,
  DeleteOutlined,
  DollarOutlined,
  FallOutlined,
  CalendarOutlined,
  AlertOutlined,
  PlusOutlined,
  HistoryOutlined,
  CalculatorOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useTranslation } from '../../../contexts/LanguageContext';
import { useAdminTheme } from '../../../hooks/useAdminTheme';

const { Title, Text } = Typography;

const AssetDashboard = ({ onNavigateTab }) => {
  const { t } = useTranslation();
  const { themeTokens } = useAdminTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/admin/assets/dashboard');
      if (res.data?.status && res.data?.data) {
        setData(res.data.data);
      } else {
        setError('Failed to retrieve dashboard metrics.');
      }
    } catch (err) {
      console.error('AssetDashboard fetch error:', err);
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
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>{t('loading_asset_metrics', 'Loading Asset Metrics & Valuation...')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message={t('error_loading_data', 'Error Loading Asset Dashboard')}
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" type="primary" onClick={fetchMetrics}>
            {t('retry', 'Retry')}
          </Button>
        }
        style={{ marginBottom: 24 }}
      />
    );
  }

  const summary = data?.summary || {};
  const byCategory = data?.byCategory || [];
  const byLocation = data?.byLocation || [];
  const upcomingMaintenance = data?.upcomingMaintenance || [];
  const expiringWarranties = data?.expiringWarranties || [];
  const recentActivities = data?.recentActivities || [];

  const totalCost = parseFloat(summary.total_acquisition_cost) || 0;
  const totalBookValue = parseFloat(summary.total_current_value) || 0;
  const totalDepr = parseFloat(summary.total_depreciation) || 0;
  const deprPercent = totalCost > 0 ? ((totalDepr / totalCost) * 100).toFixed(1) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. Header & Quick Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {t('asset_management_overview', 'Fixed Asset Portfolio & Valuation')}
          </Title>
          <Text type="secondary">
            {t('asset_management_subtitle', 'Comprehensive capital equipment register, amortized depreciation, assignments, and preventive servicing.')}
          </Text>
        </div>
        <Space wrap>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => onNavigateTab && onNavigateTab('add-asset')}
            style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
          >
            {t('add_new_asset', 'Add Asset')}
          </Button>
          <Button
            icon={<CalculatorOutlined />}
            onClick={() => onNavigateTab && onNavigateTab('depreciation')}
          >
            {t('depreciation_amortization', 'Amortization Engine')}
          </Button>
          <Button
            icon={<ToolOutlined />}
            onClick={() => onNavigateTab && onNavigateTab('maintenance')}
          >
            {t('maintenance_orders', 'Maintenance')}
          </Button>
        </Space>
      </div>

      {/* 2. Primary KPI Metric Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            style={{ borderRadius: 8, height: '100%', borderLeft: '4px solid #2563eb' }}
            onClick={() => onNavigateTab && onNavigateTab('register')}
          >
            <Statistic
              title={t('total_registered_assets', 'Total Capital Assets')}
              value={summary.total_assets || 0}
              prefix={<AppstoreOutlined style={{ color: '#2563eb', marginRight: 6 }} />}
              suffix={<Text type="secondary" style={{ fontSize: 13 }}>units</Text>}
            />
            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Tag color="success">{summary.available_assets || 0} Available</Tag>
              <Tag color="blue">{summary.assigned_assets || 0} Assigned</Tag>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            style={{ borderRadius: 8, height: '100%', borderLeft: '4px solid #16a34a' }}
            onClick={() => onNavigateTab && onNavigateTab('depreciation')}
          >
            <Statistic
              title={t('current_book_value', 'Current Net Book Value')}
              value={totalBookValue}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#16a34a', marginRight: 6 }} />}
            />
            <div style={{ marginTop: 10, fontSize: 12, color: '#64748b' }}>
              {t('acquisition_cost', 'Original Cost')}: <Text strong>${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            style={{ borderRadius: 8, height: '100%', borderLeft: '4px solid #d97706' }}
            onClick={() => onNavigateTab && onNavigateTab('depreciation')}
          >
            <Statistic
              title={t('accumulated_depreciation', 'Amortized Depreciation')}
              value={totalDepr}
              precision={2}
              prefix={<FallOutlined style={{ color: '#d97706', marginRight: 6 }} />}
            />
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Progress percent={parseFloat(deprPercent)} size="small" status="active" strokeColor="#d97706" style={{ margin: 0, flex: 1 }} />
              <span style={{ fontSize: 11, fontWeight: 600 }}>{deprPercent}%</span>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            style={{ borderRadius: 8, height: '100%', borderLeft: '4px solid #dc2626' }}
            onClick={() => onNavigateTab && onNavigateTab('maintenance')}
          >
            <Statistic
              title={t('maintenance_attention', 'In Servicing / Disposed')}
              value={summary.maintenance_assets || 0}
              prefix={<ToolOutlined style={{ color: '#dc2626', marginRight: 6 }} />}
              suffix={<Text type="secondary" style={{ fontSize: 13 }}>in repair</Text>}
            />
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <Tag color="orange">{upcomingMaintenance.length} Scheduled</Tag>
              <Tag color="default">{summary.disposed_assets || 0} Retired</Tag>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 3. Valuation by Category & Location Distribution */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <AppstoreOutlined style={{ color: '#2563eb' }} />
                <span>{t('portfolio_by_category', 'Asset Portfolio by Category')}</span>
              </Space>
            }
            extra={
              <Button type="link" onClick={() => onNavigateTab && onNavigateTab('categories')}>
                {t('manage_categories', 'Manage Categories')} &rarr;
              </Button>
            }
            style={{ borderRadius: 8 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {byCategory.length === 0 ? (
                <Text type="secondary">{t('no_categories_data', 'No category data recorded.')}</Text>
              ) : (
                byCategory.map((cat, idx) => {
                  const catVal = parseFloat(cat.total_value) || 0;
                  const pct = totalBookValue > 0 ? ((catVal / totalBookValue) * 100).toFixed(1) : 0;
                  return (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text strong>{cat.category_name}</Text>
                        <div>
                          <Tag color="blue">{cat.count} assets</Tag>
                          <Text strong style={{ marginLeft: 8 }}>
                            ${catVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Text>
                          <Text type="secondary" style={{ marginLeft: 6, fontSize: 12 }}>
                            ({pct}%)
                          </Text>
                        </div>
                      </div>
                      <Progress percent={parseFloat(pct)} size="small" strokeColor="#2563eb" showInfo={false} />
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <EnvironmentOutlined style={{ color: '#059669' }} />
                <span>{t('location_distribution', 'Location & Department Hubs')}</span>
              </Space>
            }
            extra={
              <Button type="link" onClick={() => onNavigateTab && onNavigateTab('transfers')}>
                {t('transfer_log', 'Transfer Log')} &rarr;
              </Button>
            }
            style={{ borderRadius: 8 }}
          >
            <Table
              dataSource={byLocation}
              rowKey="location_name"
              pagination={false}
              size="small"
              columns={[
                {
                  title: t('location', 'Location / Facility'),
                  dataIndex: 'location_name',
                  key: 'location_name',
                  render: (text) => <Text strong>{text || 'Unassigned'}</Text>
                },
                {
                  title: t('assets', 'Assets'),
                  dataIndex: 'count',
                  key: 'count',
                  align: 'center',
                  render: (count) => <Tag color="cyan">{count}</Tag>
                },
                {
                  title: t('book_value', 'Book Value'),
                  dataIndex: 'total_value',
                  key: 'total_value',
                  align: 'right',
                  render: (val) => `$${(parseFloat(val) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* 4. Upcoming Maintenance & Expiring Warranties */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <CalendarOutlined style={{ color: '#d97706' }} />
                <span>{t('upcoming_maintenance_schedules', 'Upcoming Preventive & Corrective Maintenance')}</span>
              </Space>
            }
            extra={
              <Button type="link" onClick={() => onNavigateTab && onNavigateTab('maintenance')}>
                {t('all_maintenance_orders', 'All Work Orders')} &rarr;
              </Button>
            }
            style={{ borderRadius: 8 }}
          >
            <Table
              dataSource={upcomingMaintenance}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: t('ref_code', 'Ref / Asset'),
                  key: 'asset',
                  render: (_, r) => (
                    <div>
                      <Text strong style={{ color: '#2563eb' }}>{r.asset_code}</Text>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{r.asset_name}</div>
                    </div>
                  )
                },
                {
                  title: t('work_order_title', 'Work Order'),
                  dataIndex: 'title',
                  key: 'title',
                  ellipsis: true
                },
                {
                  title: t('priority', 'Priority'),
                  dataIndex: 'priority',
                  key: 'priority',
                  align: 'center',
                  render: (p) => {
                    const colorMap = { urgent: 'error', high: 'warning', medium: 'processing', low: 'default' };
                    return <Tag color={colorMap[p] || 'default'}>{p?.toUpperCase()}</Tag>;
                  }
                },
                {
                  title: t('scheduled_date', 'Scheduled Date'),
                  dataIndex: 'scheduled_date',
                  key: 'scheduled_date',
                  render: (d) => d ? new Date(d).toLocaleDateString() : '-'
                },
                {
                  title: t('est_cost', 'Est. Cost'),
                  dataIndex: 'cost',
                  key: 'cost',
                  align: 'right',
                  render: (c) => `$${(parseFloat(c) || 0).toFixed(2)}`
                }
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <AlertOutlined style={{ color: '#ea580c' }} />
                <span>{t('warranty_alerts', 'Expiring Warranties (< 90 Days)')}</span>
              </Space>
            }
            style={{ borderRadius: 8 }}
          >
            {expiringWarranties.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b' }}>
                <CheckCircleOutlined style={{ fontSize: 28, color: '#16a34a', marginBottom: 8 }} />
                <div>{t('no_warranty_concerns', 'All active asset warranties are in good standing.')}</div>
              </div>
            ) : (
              <Table
                dataSource={expiringWarranties}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: t('asset', 'Asset'),
                    key: 'asset',
                    render: (_, r) => (
                      <div>
                        <Text strong>{r.asset_code}</Text>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{r.brand} {r.model}</div>
                      </div>
                    )
                  },
                  {
                    title: t('warranty_end', 'Expiration'),
                    dataIndex: 'warranty_end',
                    key: 'warranty_end',
                    render: (d) => d ? new Date(d).toLocaleDateString() : '-'
                  },
                  {
                    title: t('days_remaining', 'Status'),
                    dataIndex: 'days_remaining',
                    key: 'days_remaining',
                    align: 'center',
                    render: (days) => {
                      if (days <= 30) return <Tag color="error">{days} days left</Tag>;
                      return <Tag color="warning">{days} days left</Tag>;
                    }
                  }
                ]}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* 5. Recent Asset Activities Feed */}
      <Card
        title={
          <Space>
            <HistoryOutlined style={{ color: '#0284c7' }} />
            <span>{t('recent_asset_movements', 'Recent Asset Movements, Assignments & Servicing')}</span>
          </Space>
        }
        style={{ borderRadius: 8 }}
      >
        <Table
          dataSource={recentActivities}
          rowKey={(r) => `${r.activity_type}-${r.id}`}
          pagination={false}
          size="small"
          columns={[
            {
              title: t('event_type', 'Activity Type'),
              dataIndex: 'activity_type',
              key: 'activity_type',
              render: (type) => {
                const map = {
                  assignment: <Tag color="purple"><UserOutlined /> Assignment</Tag>,
                  transfer: <Tag color="blue"><EnvironmentOutlined /> Transfer</Tag>,
                  maintenance: <Tag color="orange"><ToolOutlined /> Maintenance</Tag>,
                  disposal: <Tag color="red"><DeleteOutlined /> Disposal</Tag>
                };
                return map[type] || <Tag>{type}</Tag>;
              }
            },
            {
              title: t('asset', 'Target Asset'),
              key: 'asset',
              render: (_, r) => (
                <div>
                  <Text strong>{r.asset_code}</Text> &mdash; {r.asset_name}
                </div>
              )
            },
            {
              title: t('description', 'Details / Note'),
              dataIndex: 'description',
              key: 'description'
            },
            {
              title: t('date', 'Activity Date'),
              dataIndex: 'activity_date',
              key: 'activity_date',
              render: (d) => d ? new Date(d).toLocaleDateString() : '-'
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default AssetDashboard;
