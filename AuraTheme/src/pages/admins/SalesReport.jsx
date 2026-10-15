import React, { useState, useEffect } from 'react';
import { Tag, Typography, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import GenericReportPage from './reports/GenericReportPage';
import { formatCurrency } from '../../utils/uiTheme';
import { useAdminTheme } from '../../hooks/useAdminTheme';

const { Text } = Typography;

const statusColor = {
  Completed: 'green',
  Ready: 'purple',
  Preparing: 'cyan',
  Pending: 'gold',
  Cancelled: 'red'
};

const SalesReport = () => {
  const adminTheme = useAdminTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState({ totalOrders: 0, totalRevenue: 0 });

  const fetchSalesReport = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/orders?limit=100');
      if (res.data?.status && Array.isArray(res.data?.data)) {
        setOrders(res.data.data);
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        }
      }
    } catch (err) {
      console.warn('Failed to load sales report:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesReport();
  }, []);

  const rows = orders.map((order) => {
    const d = new Date(order.date);
    const dateFormatted = !isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : order.date;
    return {
      key: order.id,
      orderId: order.referenceNo || `#SO-${order.id}`,
      customer: order.customer_name || 'General Customer',
      store: order.store_name || 'Aura Supply HQ',
      itemsCount: order.items_count || order.items?.length || 1,
      total: order.grandTotal || order.total || 0,
      paymentStatus: order.payment_status || 'due',
      status: order.status || 'Pending',
      date: dateFormatted,
    };
  });

  const columns = [
    { title: 'Reference', dataIndex: 'orderId', key: 'orderId', render: (v) => <Text strong style={{ color: adminTheme.primary }}>{v}</Text> },
    { title: 'Customer', dataIndex: 'customer', key: 'customer' },
    { title: 'Biller / Store', dataIndex: 'store', key: 'store' },
    { title: 'Items', dataIndex: 'itemsCount', key: 'itemsCount' },
    { title: 'Total Amount', dataIndex: 'total', key: 'total', sorter: (a, b) => a.total - b.total, render: formatCurrency },
    {
      title: 'Payment',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (v) => <Tag color={v === 'paid' ? 'green' : 'orange'} style={{ textTransform: 'uppercase', fontSize: 11 }}>{v}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v) => <Tag color={statusColor[v] || 'default'} style={{ borderRadius: 999, fontWeight: 700 }}>{v}</Tag>,
    },
    { title: 'Date', dataIndex: 'date', key: 'date' },
  ];

  return (
    <GenericReportPage
      title="Live Sales & Revenue Performance Report"
      subtitle={`Recorded sales orders from MySQL aura_sales • Total Revenue: ${formatCurrency(metrics.totalRevenue || 0)}`}
      accent={adminTheme.primary}
      columns={columns}
      rows={rows}
      loading={loading}
      extra={
        <Button icon={<ReloadOutlined />} onClick={fetchSalesReport} loading={loading}>
          Refresh Report
        </Button>
      }
    />
  );
};

export default SalesReport;
