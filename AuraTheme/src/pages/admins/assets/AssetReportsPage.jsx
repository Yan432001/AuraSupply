import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Radio,
  Space,
  Typography,
  Tag,
  Statistic,
  Row,
  Col,
  message
} from 'antd';
import {
  PrinterOutlined,
  DownloadOutlined,
  ReloadOutlined,
  BarChartOutlined,
  DollarOutlined,
  AppstoreOutlined,
  ToolOutlined,
  DeleteOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useTranslation } from '../../../contexts/LanguageContext';

const { Title, Text } = Typography;

const AssetReportsPage = () => {
  const { t } = useTranslation();
  const [reportType, setReportType] = useState('by_category');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);

  const fetchReport = async (type = reportType) => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/assets/reports', { params: { type } });
      if (res.data?.status) {
        setReportData(res.data.data?.data || []);
      }
    } catch (err) {
      console.error('Error fetching asset report:', err);
      message.error(t('failed_fetch_report', 'Failed to generate report.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(reportType);
  }, [reportType]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!reportData || reportData.length === 0) {
      message.warning('No data to export.');
      return;
    }
    const headers = Object.keys(reportData[0]).join(',');
    const rows = reportData.map(row => Object.values(row).map(v => `"${v !== null ? v : ''}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `asset_report_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render Table Columns based on report type
  const getColumns = () => {
    if (reportType === 'by_category') {
      return [
        {
          title: t('category', 'Category'),
          key: 'category',
          render: (_, r) => (
            <div>
              <Text strong>{r.category_name}</Text>
              <div style={{ fontSize: 11, color: '#64748b' }}>Code: {r.category_code}</div>
            </div>
          )
        },
        {
          title: t('depr_rate', 'Rate'),
          dataIndex: 'depreciation_rate',
          key: 'depreciation_rate',
          align: 'center',
          render: rate => `${parseFloat(rate || 0).toFixed(1)}%`
        },
        {
          title: t('total_units', 'Total Units'),
          dataIndex: 'total_assets',
          key: 'total_assets',
          align: 'center',
          render: c => <Tag color="blue">{c} assets</Tag>
        },
        {
          title: t('available', 'Available'),
          dataIndex: 'available_count',
          key: 'available_count',
          align: 'center',
          render: c => <Tag color="green">{c}</Tag>
        },
        {
          title: t('assigned', 'Assigned'),
          dataIndex: 'assigned_count',
          key: 'assigned_count',
          align: 'center',
          render: c => <Tag color="cyan">{c}</Tag>
        },
        {
          title: t('maintenance', 'Maintenance'),
          dataIndex: 'maintenance_count',
          key: 'maintenance_count',
          align: 'center',
          render: c => <Tag color="orange">{c}</Tag>
        },
        {
          title: t('acquisition_cost', 'Acquisition Cost ($)'),
          dataIndex: 'total_purchase_cost',
          key: 'total_purchase_cost',
          align: 'right',
          render: c => `$${parseFloat(c || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        },
        {
          title: t('amortized_depr', 'Amortized Depr ($)'),
          dataIndex: 'total_depreciation',
          key: 'total_depreciation',
          align: 'right',
          render: d => `$${parseFloat(d || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        },
        {
          title: t('net_book_value', 'Net Book Value ($)'),
          dataIndex: 'total_net_book_value',
          key: 'total_net_book_value',
          align: 'right',
          render: v => (
            <span style={{ fontWeight: 700, color: '#16a34a' }}>
              ${parseFloat(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )
        }
      ];
    }

    if (reportType === 'by_location') {
      return [
        {
          title: t('location_facility', 'Location / Facility'),
          dataIndex: 'location_name',
          key: 'location_name',
          render: loc => <Text strong>{loc || 'Unassigned Facility'}</Text>
        },
        {
          title: t('total_units', 'Total Equipment'),
          dataIndex: 'total_assets',
          key: 'total_assets',
          align: 'center',
          render: c => <Tag color="blue">{c} units</Tag>
        },
        {
          title: t('available', 'Available'),
          dataIndex: 'available_count',
          key: 'available_count',
          align: 'center',
          render: c => <Tag color="green">{c}</Tag>
        },
        {
          title: t('assigned', 'In Custody'),
          dataIndex: 'assigned_count',
          key: 'assigned_count',
          align: 'center',
          render: c => <Tag color="cyan">{c}</Tag>
        },
        {
          title: t('in_servicing', 'In Servicing'),
          dataIndex: 'maintenance_count',
          key: 'maintenance_count',
          align: 'center',
          render: c => <Tag color="orange">{c}</Tag>
        },
        {
          title: t('total_cost', 'Acquisition Cost ($)'),
          dataIndex: 'total_purchase_cost',
          key: 'total_purchase_cost',
          align: 'right',
          render: c => `$${parseFloat(c || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        },
        {
          title: t('total_net_book_value', 'Net Book Value ($)'),
          dataIndex: 'total_net_book_value',
          key: 'total_net_book_value',
          align: 'right',
          render: v => (
            <span style={{ fontWeight: 700, color: '#16a34a' }}>
              ${parseFloat(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )
        }
      ];
    }

    if (reportType === 'maintenance_costs') {
      return [
        {
          title: t('asset_code', 'Asset Code'),
          dataIndex: 'asset_code',
          key: 'asset_code',
          render: code => <Text strong style={{ color: '#2563eb' }}>{code}</Text>
        },
        {
          title: t('asset_name', 'Asset Name'),
          dataIndex: 'asset_name',
          key: 'asset_name'
        },
        {
          title: t('category', 'Category'),
          dataIndex: 'category_name',
          key: 'category_name',
          render: cat => <Tag color="geekblue">{cat}</Tag>
        },
        {
          title: t('location', 'Location'),
          dataIndex: 'location_name',
          key: 'location_name'
        },
        {
          title: t('service_events', 'Service Events'),
          dataIndex: 'total_service_events',
          key: 'total_service_events',
          align: 'center',
          render: s => <Tag color="orange">{s} work orders</Tag>
        },
        {
          title: t('last_service_date', 'Last Service'),
          dataIndex: 'last_maintenance_date',
          key: 'last_maintenance_date',
          render: d => d ? new Date(d).toLocaleDateString() : '-'
        },
        {
          title: t('cumulative_maintenance_cost', 'Total Maintenance Expense ($)'),
          dataIndex: 'total_maintenance_cost',
          key: 'total_maintenance_cost',
          align: 'right',
          render: c => (
            <span style={{ fontWeight: 700, color: '#dc2626' }}>
              ${parseFloat(c || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )
        }
      ];
    }

    if (reportType === 'disposals') {
      return [
        {
          title: t('reference_no', 'Disposal Ref'),
          dataIndex: 'reference_no',
          key: 'reference_no',
          render: r => <Tag color="blue">{r}</Tag>
        },
        {
          title: t('asset', 'Asset Code & Name'),
          key: 'asset',
          render: (_, r) => <div><strong>{r.asset_code}</strong> &mdash; {r.asset_name}</div>
        },
        {
          title: t('method', 'Method'),
          dataIndex: 'disposal_method',
          key: 'disposal_method',
          render: m => <Tag color="purple">{m?.toUpperCase()}</Tag>
        },
        {
          title: t('disposal_date', 'Date'),
          dataIndex: 'disposal_date',
          key: 'disposal_date',
          render: d => d ? new Date(d).toLocaleDateString() : '-'
        },
        {
          title: t('original_cost', 'Original Cost'),
          dataIndex: 'purchase_cost',
          key: 'purchase_cost',
          align: 'right',
          render: c => `$${parseFloat(c || 0).toFixed(2)}`
        },
        {
          title: t('book_value_disposal', 'Book Value at Disposal'),
          dataIndex: 'book_value_at_disposal',
          key: 'book_value_at_disposal',
          align: 'right',
          render: b => `$${parseFloat(b || 0).toFixed(2)}`
        },
        {
          title: t('sale_amount', 'Sale Proceeds'),
          dataIndex: 'sale_amount',
          key: 'sale_amount',
          align: 'right',
          render: s => `$${parseFloat(s || 0).toFixed(2)}`
        },
        {
          title: t('gain_loss', 'Gain / (Loss)'),
          dataIndex: 'gain_loss',
          key: 'gain_loss',
          align: 'right',
          render: gl => {
            const val = parseFloat(gl || 0);
            return (
              <span style={{ fontWeight: 700, color: val >= 0 ? '#16a34a' : '#dc2626' }}>
                {val >= 0 ? `+$${val.toFixed(2)}` : `-$${Math.abs(val).toFixed(2)}`}
              </span>
            );
          }
        }
      ];
    }

    return [];
  };

  return (
    <Card style={{ borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {t('asset_reports_analytics', 'Fixed Capital Asset Reports & Financial Analytics')}
          </Title>
          <Text type="secondary">
            {t('asset_reports_desc', 'Export balance sheet valuation schedules, facility distributions, servicing expenses, and disposal losses.')}
          </Text>
        </div>
        <Space wrap>
          <Button icon={<PrinterOutlined />} onClick={handlePrint}>
            {t('print', 'Print Report')}
          </Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportCsv} style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}>
            {t('export_csv', 'Export CSV')}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => fetchReport(reportType)}>
            {t('refresh', 'Refresh')}
          </Button>
        </Space>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Radio.Group
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          buttonStyle="solid"
        >
          <Radio.Button value="by_category">
            <AppstoreOutlined style={{ marginRight: 6 }} />
            {t('category_valuation_schedule', 'Category Valuation Schedule')}
          </Radio.Button>
          <Radio.Button value="by_location">
            <EnvironmentOutlined style={{ marginRight: 6 }} />
            {t('facility_location_distribution', 'Facility & Location Distribution')}
          </Radio.Button>
          <Radio.Button value="maintenance_costs">
            <ToolOutlined style={{ marginRight: 6 }} />
            {t('maintenance_cost_analysis', 'Maintenance & Servicing Expenses')}
          </Radio.Button>
          <Radio.Button value="disposals">
            <DeleteOutlined style={{ marginRight: 6 }} />
            {t('disposals_gain_loss', 'Retirements & Gain / Loss')}
          </Radio.Button>
        </Radio.Group>
      </div>

      <Table
        dataSource={reportData}
        columns={getColumns()}
        rowKey={(r, idx) => r.id || r.category_id || r.asset_id || idx}
        loading={loading}
        size="middle"
        pagination={false}
      />
    </Card>
  );
};

export default AssetReportsPage;
