import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Table,
  Input,
  Tag,
  Space,
} from 'antd';
import {
  HistoryOutlined,
  SearchOutlined,
  PrinterOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const PosSalesHistoryModal = ({
  visible,
  onClose,
  onReprintReceipt,
  themeMode,
  t,
}) => {
  const isDark = themeMode === 'dark';
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/pos/sales?limit=50');
      if (res.data?.success) {
        setSales(res.data.sales || []);
      }
    } catch (err) {
      console.warn('Failed loading POS sales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) fetchSales();
  }, [visible]);

  const filtered = sales.filter((s) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      (s.reference_no && s.reference_no.toLowerCase().includes(term)) ||
      (s.customer && s.customer.toLowerCase().includes(term)) ||
      (s.cashier_username && s.cashier_username.toLowerCase().includes(term))
    );
  });

  const columns = [
    {
      title: 'Reference',
      dataIndex: 'reference_no',
      key: 'reference_no',
      render: (ref, r) => (
        <span style={{ fontWeight: 800, color: '#2F6FED' }}>
          {ref || `INV-${r.id}`}
        </span>
      ),
    },
    {
      title: 'Date & Time',
      dataIndex: 'date',
      key: 'date',
      render: (d) => (d ? new Date(d).toLocaleString('en-GB') : '-'),
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
      render: (c) => c || 'General Customer',
    },
    {
      title: 'Store / Biller',
      dataIndex: 'biller_name',
      key: 'biller_name',
      render: (b) => (b ? <Tag color="blue" style={{ borderRadius: 6 }}>{b}</Tag> : <span style={{ color: '#94a3b8' }}>-</span>),
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouse_name',
      key: 'warehouse_name',
      render: (w) => (w ? <Tag color="cyan" style={{ borderRadius: 6 }}>{w}</Tag> : <span style={{ color: '#94a3b8' }}>-</span>),
    },
    {
      title: 'Grand Total',
      dataIndex: 'grand_total',
      key: 'grand_total',
      render: (t) => (
        <span style={{ fontWeight: 800, color: '#10b981' }}>
          ${parseFloat(t || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'payment_status',
      key: 'payment_status',
      render: (st) => (
        <Tag color={st === 'paid' ? 'success' : 'warning'} style={{ borderRadius: 6, fontWeight: 700 }}>
          {(st || 'paid').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Reprint',
      key: 'action',
      render: (_, r) => (
        <Button
          size="small"
          icon={<PrinterOutlined />}
          onClick={() => {
            if (onReprintReceipt) {
              onReprintReceipt(r);
              onClose();
            }
          }}
          style={{ borderRadius: 6 }}
        >
          Reprint
        </Button>
      ),
    },
  ];

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={780}
      centered
      destroyOnClose
      style={{ borderRadius: 20, overflow: 'hidden' }}
      styles={{ body: { padding: '24px 28px' } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>
            <HistoryOutlined style={{ color: '#2F6FED', marginRight: 8 }} />
            POS Completed Sales History
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            Browse past transactions, check payment details, and reprint receipts
          </div>
        </div>

        <Button icon={<ReloadOutlined />} onClick={fetchSales} size="middle" style={{ borderRadius: 8 }}>
          Refresh
        </Button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          placeholder="Search by invoice reference, customer name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ borderRadius: 10 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 7 }}
        size="small"
      />
    </Modal>
  );
};

export default PosSalesHistoryModal;
