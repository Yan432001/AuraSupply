import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Table,
  Input,
  Tag,
  Space,
  Form,
  message,
  Tabs,
} from 'antd';
import {
  InboxOutlined,
  PlusOutlined,
  ReloadOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const PosCustomerStockModal = ({
  visible,
  onClose,
  selectedCustomerId,
  selectedCustomerName,
  cart,
  onRedeemToCart,
  themeMode,
  t,
}) => {
  const isDark = themeMode === 'dark';
  const [customerStocks, setCustomerStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [depositForm] = Form.useForm();
  const [isDepositing, setIsDepositing] = useState(false);

  const fetchCustomerStocks = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/pos/customer-stocks');
      if (res.data?.success) {
        setCustomerStocks(res.data.customer_stocks || []);
      }
    } catch (err) {
      console.warn('Failed loading customer stocks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) fetchCustomerStocks();
  }, [visible]);

  // Handle Depositing Items into Customer Stock
  const handleDepositItems = async (values) => {
    if (cart.length === 0) {
      message.error('Cart is empty. Add items to cart before depositing.');
      return;
    }

    setIsDepositing(true);
    try {
      const payload = {
        customer_id: selectedCustomerId || 1,
        customer: selectedCustomerName || 'Customer',
        items: cart,
        note: values.note || 'POS Item Deposit',
      };
      const res = await axios.post('/api/admin/pos/customer-stocks', payload);
      if (res.data?.success) {
        message.success('Items deposited to customer stock successfully!');
        depositForm.resetFields();
        setActiveTab('list');
        fetchCustomerStocks();
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Deposit failed');
    } finally {
      setIsDepositing(false);
    }
  };

  // Handle Redeeming an item to the active cart
  const handleRedeem = (stockItem, stockParent) => {
    if (onRedeemToCart) {
      onRedeemToCart({
        id: stockItem.product_id,
        name: stockItem.product_name || 'Customer Deposit Item',
        code: stockItem.product_code || 'DEP-01',
        unit_price: 0,
        quantity: 1,
        unit_name: stockItem.product_unit_code || 'Unit',
        item_discount: 0,
        item_note: `Redeemed from held stock #${stockParent.reference_no}`,
      });
      message.success(`Redeemed 1x ${stockItem.product_name} into cart ($0.00)`);
      onClose();
    }
  };

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
            <InboxOutlined style={{ color: '#f59e0b', marginRight: 8 }} />
            Customer Held Stocks & Deposits
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            Manage bulk purchases held in storage and redeem bottles/items at table
          </div>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchCustomerStocks} size="middle" style={{ borderRadius: 8 }} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setActiveTab(activeTab === 'list' ? 'deposit' : 'list')}
            style={{ borderRadius: 8, background: '#f59e0b' }}
          >
            {activeTab === 'list' ? 'Deposit Current Cart' : 'Held Stocks List'}
          </Button>
        </Space>
      </div>

      {activeTab === 'list' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 440, overflowY: 'auto' }}>
          {customerStocks.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              No customer held stocks found. Use "Deposit Current Cart" to store customer items.
            </div>
          ) : (
            customerStocks.map((stock) => (
              <div
                key={stock.id}
                style={{
                  padding: '14px 16px',
                  borderRadius: 14,
                  background: isDark ? '#1e293b' : '#f8fafc',
                  border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#2F6FED', marginRight: 8 }}>
                      {stock.reference_no}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>
                      {stock.customer || stock.customer_name}
                    </span>
                  </div>
                  <Tag color="orange" style={{ borderRadius: 8, fontWeight: 700 }}>
                    {stock.status || 'Active'}
                  </Tag>
                </div>

                {/* Items in this deposit */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 6, borderTop: '1px dashed #cbd5e1' }}>
                  {(stock.items || []).map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>{item.product_name}</span>
                        <span style={{ color: '#64748b', fontSize: 11, marginLeft: 6 }}>({item.product_unit_code || 'Unit'})</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Tag color="blue" style={{ borderRadius: 6, fontWeight: 800 }}>
                          {item.quantity} available
                        </Tag>

                        <Button
                          size="small"
                          type="primary"
                          icon={<CheckOutlined />}
                          disabled={parseFloat(item.quantity) <= 0}
                          onClick={() => handleRedeem(item, stock)}
                          style={{ background: '#10b981', borderRadius: 6, fontWeight: 700 }}
                        >
                          Redeem to Cart
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <Form form={depositForm} layout="vertical" onFinish={handleDepositItems}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
              Depositing items for: <Tag color="blue">{selectedCustomerName || 'Customer'}</Tag>
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              The items currently in your cart ({cart.length} items) will be stored in warehouse stock under this customer's account.
            </div>
          </div>

          <Form.Item label="Deposit Remarks / Storage Note" name="note">
            <Input.TextArea rows={3} placeholder="e.g. VIP Locker #12, Paid in full, expiry in 6 months" />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Button onClick={() => setActiveTab('list')} style={{ marginRight: 8, borderRadius: 8 }}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isDepositing}
              disabled={cart.length === 0}
              style={{ background: '#f59e0b', borderRadius: 8, fontWeight: 700 }}
            >
              Confirm Deposit ({cart.length} items)
            </Button>
          </div>
        </Form>
      )}
    </Modal>
  );
};

export default PosCustomerStockModal;
