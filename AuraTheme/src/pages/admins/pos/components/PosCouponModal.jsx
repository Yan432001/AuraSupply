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
} from 'antd';
import {
  TagOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const PosCouponModal = ({
  visible,
  onClose,
  onApplyCouponToCart,
  themeMode,
  t,
}) => {
  const isDark = themeMode === 'dark';
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/pos/coupons');
      if (res.data?.success) {
        setCoupons(res.data.coupons || []);
      }
    } catch (err) {
      console.warn('Failed to load coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) fetchCoupons();
  }, [visible]);

  const handleCreateCoupon = async (values) => {
    setIsSubmitting(true);
    try {
      const payload = {
        card_no: values.card_no,
        value: values.value,
        customer: values.customer || '-',
        expiry: values.expiry ? values.expiry.format('YYYY-MM-DD') : undefined,
      };
      const res = await axios.post('/api/admin/pos/coupons', payload);
      if (res.data?.success) {
        message.success('Coupon created successfully');
        form.resetFields();
        setActiveTab('list');
        fetchCoupons();
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed creating coupon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Coupon Code',
      dataIndex: 'card_no',
      key: 'card_no',
      render: (code) => <Tag color="blue" style={{ fontWeight: 800 }}>{code}</Tag>,
    },
    {
      title: 'Discount Value',
      dataIndex: 'value',
      key: 'value',
      render: (val) => <span style={{ fontWeight: 800, color: '#10b981' }}>${parseFloat(val || 0).toFixed(2)} OFF</span>,
    },
    {
      title: 'Status',
      dataIndex: 'used',
      key: 'used',
      render: (used) => (
        <Tag color={used === 1 ? 'default' : 'success'}>
          {used === 1 ? 'Redeemed' : 'Available'}
        </Tag>
      ),
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
          disabled={r.used === 1}
          style={{ background: '#14b8a6', borderRadius: 6, fontWeight: 700 }}
          onClick={() => {
            if (onApplyCouponToCart) {
              onApplyCouponToCart(r);
              onClose();
            }
          }}
        >
          Apply to Cart
        </Button>
      ),
    },
  ];

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={640}
      centered
      destroyOnClose
      style={{ borderRadius: 20, overflow: 'hidden' }}
      styles={{ body: { padding: '24px 28px' } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>
            <TagOutlined style={{ color: '#14b8a6', marginRight: 8 }} />
            Promotions & Coupons
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            Browse active discount coupons and 1-click apply to active sale
          </div>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchCoupons} size="middle" style={{ borderRadius: 8 }} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setActiveTab(activeTab === 'list' ? 'add' : 'list')}
            style={{ borderRadius: 8, background: '#14b8a6' }}
          >
            {activeTab === 'list' ? 'Create Coupon' : 'Coupons List'}
          </Button>
        </Space>
      </div>

      {activeTab === 'list' ? (
        <Table
          columns={columns}
          dataSource={coupons}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 6 }}
          size="small"
        />
      ) : (
        <Form form={form} layout="vertical" onFinish={handleCreateCoupon}>
          <Form.Item label="Coupon Code" name="card_no" rules={[{ required: true, message: 'Please enter a code' }]}>
            <Input placeholder="e.g. SUMMER2026, VIP10" />
          </Form.Item>

          <Form.Item label="Discount Amount ($)" name="value" rules={[{ required: true, message: 'Please enter amount' }]}>
            <Input type="number" step="any" min="0" placeholder="e.g. 5.00" />
          </Form.Item>

          <Form.Item label="Valid Until (Expiry Date)" name="expiry">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 12 }}>
            <Button onClick={() => setActiveTab('list')} style={{ marginRight: 8, borderRadius: 8 }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={isSubmitting} style={{ background: '#14b8a6', borderRadius: 8, fontWeight: 700 }}>
              Save Coupon
            </Button>
          </div>
        </Form>
      )}
    </Modal>
  );
};

export default PosCouponModal;
