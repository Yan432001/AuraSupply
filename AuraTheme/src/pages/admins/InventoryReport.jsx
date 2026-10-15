import React, { useState, useEffect } from 'react';
import { Tag, Typography, Button, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import GenericReportPage from './reports/GenericReportPage';
import { formatCurrency } from '../../utils/uiTheme';
import { useAdminTheme } from '../../hooks/useAdminTheme';

const { Text } = Typography;

const stockTag = (quantity, alertQuantity = 5) => {
  const q = parseFloat(quantity || 0);
  const alert = parseFloat(alertQuantity || 5);
  if (q <= 0) return { label: 'Out of Stock', color: 'red' };
  if (q <= alert) return { label: `Low Stock (${q})`, color: 'orange' };
  return { label: `In Stock (${q})`, color: 'green' };
};

const InventoryReport = () => {
  const adminTheme = useAdminTheme();
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState({ totalCatalogValue: 0, inStock: 0, outOfStock: 0, lowStock: 0 });

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/products?limit=250');
      if (res.data?.status && Array.isArray(res.data?.data)) {
        setProductsList(res.data.data);
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        }
      }
    } catch (err) {
      console.warn('Failed to load live inventory:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const rows = productsList.map((product) => {
    const q = parseFloat(product.quantity || product.stockCount || 0);
    const p = parseFloat(product.price || 0);
    const tag = stockTag(q, product.alertQuantity);
    return {
      key: product.id,
      code: product.code || `#PRD-${product.id}`,
      name: product.name,
      category: product.category || 'General',
      quantity: q,
      unitPrice: p,
      value: p * q,
      status: tag.label,
      statusColor: tag.color,
    };
  });

  const columns = [
    { title: 'Code', dataIndex: 'code', key: 'code', width: 110, render: (v) => <Text style={{ fontFamily: 'monospace', color: adminTheme.subtext }}>{v}</Text> },
    { title: 'Product Name', dataIndex: 'name', key: 'name', render: (v) => <Text strong style={{ color: adminTheme.text }}>{v}</Text> },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    { title: 'Quantity on Hand', dataIndex: 'quantity', key: 'quantity', sorter: (a, b) => a.quantity - b.quantity },
    { title: 'Unit Price', dataIndex: 'unitPrice', key: 'unitPrice', render: formatCurrency },
    { title: 'Total Stock Value', dataIndex: 'value', key: 'value', sorter: (a, b) => a.value - b.value, render: formatCurrency },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v, record) => <Tag color={record.statusColor} style={{ borderRadius: 999, fontWeight: 700 }}>{v}</Tag>,
    },
  ];

  return (
    <GenericReportPage
      title="Live Inventory Valuation & Stock Report"
      subtitle={`Tracked SKUs from MySQL aura_products • Total Value: ${formatCurrency(metrics.totalCatalogValue || 0)}`}
      accent={adminTheme.systemTeal}
      columns={columns}
      rows={rows}
      loading={loading}
      extra={
        <Button icon={<ReloadOutlined />} onClick={fetchInventory} loading={loading}>
          Refresh Stock
        </Button>
      }
    />
  );
};

export default InventoryReport;
