import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Table,
  Tag,
  Space,
} from 'antd';
import {
  UnorderedListOutlined,
  ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { useAdminTheme } from '../../../../hooks/useAdminTheme';

const PosRegistersListModal = ({
  visible,
  onClose,
  onViewShiftSummary,
  themeMode: propThemeMode,
  adminTheme: propAdminTheme,
  t,
}) => {
  const hookAdminTheme = useAdminTheme();
  const adminTheme = propAdminTheme || hookAdminTheme;
  const isDark = Boolean(adminTheme.isDark || propThemeMode === 'dark');
  const primaryColor = adminTheme.primary || '#2563eb';
  const textColor = adminTheme.text || (isDark ? '#f8fafc' : '#0f172a');
  const subtextColor = adminTheme.subtext || (isDark ? '#94a3b8' : '#64748b');
  const [registers, setRegisters] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRegisters = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/pos/registers');
      if (res.data?.success) {
        setRegisters(res.data.registers || []);
      }
    } catch (err) {
      console.warn('Failed loading registers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) fetchRegisters();
  }, [visible]);

  const columns = [
    {
      title: 'Shift #',
      dataIndex: 'id',
      key: 'id',
      render: (id) => <span style={{ fontWeight: 800 }}>#{id}</span>,
    },
    {
      title: 'Cashier',
      dataIndex: 'cashier_username',
      key: 'cashier_username',
      render: (c, r) => c || r.user_id || 'Cashier',
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
      title: 'Open Time',
      dataIndex: 'date',
      key: 'date',
      render: (d) => (d ? new Date(d).toLocaleString('en-GB') : '-'),
    },
    {
      title: 'Close Time',
      dataIndex: 'closed_at',
      key: 'closed_at',
      render: (d, r) => (r.status === 'open' ? <Tag color="processing">In Progress</Tag> : d ? new Date(d).toLocaleString('en-GB') : '-'),
    },
    {
      title: 'Opening Cash',
      dataIndex: 'cash_in_hand',
      key: 'cash_in_hand',
      render: (c) => `$${parseFloat(c || 0).toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (st) => (
        <Tag color={st === 'open' ? 'success' : 'default'} style={{ borderRadius: 6, fontWeight: 700 }}>
          {st?.toUpperCase() || 'CLOSED'}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, r) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            if (onViewShiftSummary) {
              onViewShiftSummary(r);
              onClose();
            }
          }}
          style={{ borderRadius: 6 }}
        >
          View Shift
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
          <div style={{ fontSize: 18, fontWeight: 800, color: textColor }}>
            <UnorderedListOutlined style={{ color: primaryColor, marginRight: 8 }} />
            Cash Registers Shift History
          </div>
          <div style={{ fontSize: 12, color: subtextColor }}>
            Shift records, opening cash, closing times, and cash drawer reconciliations
          </div>
        </div>

        <Button icon={<ReloadOutlined />} onClick={fetchRegisters} size="middle" style={{ borderRadius: 8 }}>
          Refresh
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={registers}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 6 }}
        size="small"
      />
    </Modal>
  );
};

export default PosRegistersListModal;
