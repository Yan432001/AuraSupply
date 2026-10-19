import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Table,
  Input,
  Tag,
  Space,
  Form,
  DatePicker,
  message,
  Popconfirm,
  Tabs,
} from 'antd';
import {
  GiftOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const PosMemberCardModal = ({
  visible,
  onClose,
  onSelectCardForSale,
  themeMode,
  t,
}) => {
  const isDark = themeMode === 'dark';
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [addForm] = Form.useForm();
  const [isAdding, setIsAdding] = useState(false);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/admin/pos/member-cards?search=${encodeURIComponent(search)}`);
      if (res.data?.success) {
        setCards(res.data.cards || []);
      }
    } catch (err) {
      console.warn('Failed loading member cards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchCards();
    }
  }, [visible, search]);

  const handleCreateCard = async (values) => {
    setIsAdding(true);
    try {
      const payload = {
        card_no: values.card_no,
        value: values.value || 0,
        discount: values.discount || 0,
        customer: values.customer || '-',
        expiry: values.expiry ? values.expiry.format('YYYY-MM-DD') : undefined,
      };
      const res = await axios.post('/api/admin/pos/member-cards', payload);
      if (res.data?.success) {
        message.success('Member card created successfully');
        addForm.resetFields();
        setActiveTab('list');
        fetchCards();
      } else {
        message.error(res.data?.message || 'Failed to create card');
      }
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Creation failed');
    } finally {
      setIsAdding(false);
    }
  };

  const columns = [
    {
      title: 'Card Number',
      dataIndex: 'card_no',
      key: 'card_no',
      render: (num) => (
        <span style={{ fontWeight: 800, color: '#be185d', fontFamily: 'monospace' }}>
          {num}
        </span>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
      render: (name, r) => name || r.customer || 'General Member',
    },
    {
      title: 'Available Balance',
      dataIndex: 'balance',
      key: 'balance',
      render: (bal) => (
        <Tag color="green" style={{ fontWeight: 800, fontSize: 13 }}>
          ${parseFloat(bal || 0).toFixed(2)}
        </Tag>
      ),
    },
    {
      title: 'VIP Discount',
      dataIndex: 'discount',
      key: 'discount',
      render: (disc) => (disc > 0 ? <Tag color="pink">{disc}% OFF</Tag> : '-'),
    },
    {
      title: 'Expiry',
      dataIndex: 'expiry',
      key: 'expiry',
      render: (exp) => (exp ? new Date(exp).toLocaleDateString('en-GB') : 'No Expiry'),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, r) => (
        <Button
          size="small"
          type="primary"
          style={{ background: '#be185d', borderRadius: 6, fontWeight: 700 }}
          onClick={() => {
            if (onSelectCardForSale) {
              onSelectCardForSale(r);
              onClose();
            }
          }}
        >
          Use in Sale
        </Button>
      ),
    },
  ];

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={720}
      centered
      destroyOnClose
      style={{ borderRadius: 20, overflow: 'hidden' }}
      styles={{ body: { padding: '24px 28px' } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>
            <GiftOutlined style={{ color: '#be185d', marginRight: 8 }} />
            Member Cards & VIP Loyalty
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            Manage VIP customer cards, balances, points, and auto-discounts
          </div>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchCards} size="middle" style={{ borderRadius: 8 }} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setActiveTab(activeTab === 'list' ? 'add' : 'list')}
            style={{ borderRadius: 8, background: '#be185d' }}
          >
            {activeTab === 'list' ? 'Issue New Card' : 'Back to Cards List'}
          </Button>
        </Space>
      </div>

      {activeTab === 'list' ? (
        <div>
          <div style={{ marginBottom: 12 }}>
            <Input
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Search by card number, customer name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              style={{ borderRadius: 10 }}
            />
          </div>

          <Table
            columns={columns}
            dataSource={cards}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 6 }}
            size="small"
          />
        </div>
      ) : (
        <Form form={addForm} layout="vertical" onFinish={handleCreateCard}>
          <Form.Item
            label="Card Number (Optional - Auto generated if blank)"
            name="card_no"
          >
            <Input placeholder="Leave blank to generate 16-digit number" />
          </Form.Item>

          <Form.Item label="Customer Name / Memo" name="customer">
            <Input placeholder="Customer name or VIP ID" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item label="Initial Balance ($)" name="value">
              <Input type="number" step="any" min="0" placeholder="0.00" />
            </Form.Item>

            <Form.Item label="VIP Discount Percentage (%)" name="discount">
              <Input type="number" step="any" min="0" max="100" placeholder="0%" />
            </Form.Item>
          </div>

          <Form.Item label="Expiry Date" name="expiry">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 12 }}>
            <Button onClick={() => setActiveTab('list')} style={{ marginRight: 8, borderRadius: 8 }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={isAdding} style={{ background: '#be185d', borderRadius: 8, fontWeight: 700 }}>
              Issue Member Card
            </Button>
          </div>
        </Form>
      )}
    </Modal>
  );
};

export default PosMemberCardModal;
