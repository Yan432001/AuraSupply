import React, { useState, useEffect } from 'react';
import { Tag, Typography, Button, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import GenericReportPage from './reports/GenericReportPage';
import { formatCurrency } from '../../utils/uiTheme';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { useTranslation } from '../../contexts/LanguageContext';

const { Text } = Typography;

const InventoryReport = () => {
  const adminTheme = useAdminTheme();
  const { t } = useTranslation();
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState({ totalCatalogValue: 0, inStock: 0, outOfStock: 0, lowStock: 0 });

  const stockTag = (quantity, alertQuantity = 5) => {
    const q = parseFloat(quantity || 0);
    const alert = parseFloat(alertQuantity || 5);
    if (q <= 0) return { label: t('out_of_stock', 'Out of Stock'), color: 'red' };
    if (q <= alert) return { label: `${t('low_stock', 'Low Stock')} (${q})`, color: 'orange' };
    return { label: `${t('in_stock', 'In Stock')} (${q})`, color: 'green' };
  };

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
    { title: t('code', 'Code'), dataIndex: 'code', key: 'code', width: 110, render: (v) => <Text style={{ fontFamily: 'monospace', color: adminTheme.subtext }}>{v}</Text> },
    { title: t('product_name', 'Product Name'), dataIndex: 'name', key: 'name', render: (v) => <Text strong style={{ color: adminTheme.text }}>{v}</Text> },
    { title: t('category', 'Category'), dataIndex: 'category', key: 'category' },
    { title: t('quantity_on_hand', 'Quantity on Hand'), dataIndex: 'quantity', key: 'quantity', sorter: (a, b) => a.quantity - b.quantity },
    { title: t('unit_price', 'Unit Price'), dataIndex: 'unitPrice', key: 'unitPrice', render: formatCurrency },
    { title: t('total_stock_value', 'Total Stock Value'), dataIndex: 'value', key: 'value', sorter: (a, b) => a.value - b.value, render: formatCurrency },
    {
      title: t('status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      render: (v, record) => <Tag color={record.statusColor} style={{ borderRadius: 999, fontWeight: 700 }}>{v}</Tag>,
    },
  ];

  return (
    <GenericReportPage
      title={t('inventory_report_title', 'Live Inventory Valuation & Stock Report')}
      subtitle={t('inventory_report_subtitle', 'Tracked SKUs from MySQL aura_products • Total Value: {value}').replace('{value}', formatCurrency(metrics.totalCatalogValue || 0))}
      accent={adminTheme.systemTeal}
      columns={columns}
      rows={rows}
      loading={loading}
      extra={
        <Button icon={<ReloadOutlined />} onClick={fetchInventory} loading={loading}>
          {t('refresh_stock', 'Refresh Stock')}
        </Button>
      }
    />
  );
};

export default InventoryReport;
