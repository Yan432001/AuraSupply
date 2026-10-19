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

const PosRegistersListModal = ({
  visible,
  onClose,
  onViewShiftSummary,
  themeMode,
  t,
}) => {
  const isDark = themeMode === 'dark';
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
          <div style={{ fontSize: 18, fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>
            <UnorderedListOutlined style={{ color: '#3b82f6', marginRight: 8 }} />
            Cash Registers Shift History
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
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
