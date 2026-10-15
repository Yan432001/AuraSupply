import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Space,
  Tag,
  Button,
  Avatar,
  Divider,
  Flex,
  message,
  Switch,
  Badge,
  Spin,
  Tabs,
  Input,
} from 'antd';
import { Typography } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  GiftOutlined,
  ShopOutlined,
  SendOutlined,
  CheckCircleFilled,
  ThunderboltOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  EyeOutlined,
  ReloadOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import OrderReceiptModal from '../../components/common/OrderReceiptModal';
import { formatCurrency, publicTheme } from '../../utils/webTheme';
import { exportSingleOrderPdf } from '../../utils/orderPdfExporter';

const { Title, Paragraph, Text } = Typography;

const statusColor = {
  Pending: 'gold',
  Confirmed: 'blue',
  Preparing: 'cyan',
  Ready: 'purple',
  Completed: 'green',
  Cancelled: 'red',
};

const SYNC_STORAGE_KEY = 'aura_order_background_sync';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [backgroundSyncEnabled, setBackgroundSyncEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem(SYNC_STORAGE_KEY);
      return stored !== 'false';
    } catch {
      return true;
    }
  });

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [syncSecondsAgo, setSyncSecondsAgo] = useState(0);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const timer = setInterval(() => {
      setSyncSecondsAgo(Math.floor((Date.now() - lastSyncTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastSyncTime]);

  const fetchUserOrders = async (isSilent = false) => {
    if (!isSilent) setLoadingOrders(true);
    try {
      // 1. Fetch from backend API
      const res = await axios.get('/api/tma/orders').catch(() => null);
      let apiOrders = [];
      if (res?.data?.status) {
        apiOrders = res.data.orders || res.data.data || [];
      }

      // 2. Fetch from local storage web order history
      let localOrders = [];
      try {
        localOrders = JSON.parse(localStorage.getItem('aura_web_order_history') || '[]');
      } catch (_) {}

      // Combine and deduplicate
      const combined = [...localOrders, ...apiOrders];
      setOrders(combined);
      setLastSyncTime(new Date());
      setSyncSecondsAgo(0);
    } catch (err) {
      if (!isSilent) {
        console.warn('Orders fetch error:', err.message);
      }
    } finally {
      if (!isSilent) setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchUserOrders();
  }, []);

  useEffect(() => {
    if (!backgroundSyncEnabled) return;
    const interval = setInterval(() => {
      fetchUserOrders(true);
    }, 6000);
    return () => clearInterval(interval);
  }, [backgroundSyncEnabled]);

  const handleToggleSync = (checked) => {
    setBackgroundSyncEnabled(checked);
    try {
      localStorage.setItem(SYNC_STORAGE_KEY, checked ? 'true' : 'false');
      window.dispatchEvent(new Event('aura-sync-pref-changed'));
    } catch {}
  };

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter((o) => (o.status || 'Confirmed').toLowerCase() === statusFilter.toLowerCase());
  }, [orders, statusFilter]);

  const handleLogout = () => {
    logout();
    message.success('Successfully logged out.');
    navigate('/');
  };

  return (
    <div style={{ width: '100%', paddingBottom: 56 }}>
      {/* Profile Header Card */}
      <Card
        style={{
          borderRadius: 24,
          border: `1px solid ${publicTheme.border}`,
          boxShadow: publicTheme.shadow,
          marginBottom: 24,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)',
        }}
        styles={{ body: { padding: '28px 32px' } }}
      >
        <Row gutter={[24, 20]} align="middle" justify="space-between">
          <Col xs={24} md={15}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <Avatar
                size={72}
                src={user?.avatar}
                icon={<UserOutlined />}
                style={{
                  background: publicTheme.primary,
                  boxShadow: '0 4px 14px rgba(47, 111, 237, 0.25)',
                  border: '3px solid #ffffff',
                }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Title level={2} style={{ margin: 0, fontWeight: 850, color: publicTheme.text }}>
                    {user?.name || 'Aura Wholesale Partner'}
                  </Title>
                  <Tag color="blue" style={{ borderRadius: 6, fontWeight: 700, fontSize: 11 }}>
                    {user?.tier || 'Enterprise Tier 1 VIP'}
                  </Tag>
                </div>
                <div style={{ color: publicTheme.subtext, fontSize: 13, marginTop: 4 }}>
                  {user?.email || 'procurement@auraglobal.com'} • Account ID: {user?.id || 'AUR-CORP-9182'}
                </div>
                <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 12, color: publicTheme.subtext }}>
                  <span><BankOutlined /> Net-30 Corporate Credit: <strong>$50,000 Approved</strong></span>
                  <span><SafetyCertificateOutlined style={{ color: '#10b981' }} /> Verified Business Buyer</span>
                </div>
              </div>
            </div>
          </Col>

          <Col xs={24} md={9} style={{ textAlign: 'right' }}>
            <Space wrap size={10}>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchUserOrders(false)}
                loading={loadingOrders}
                style={{ borderRadius: 12, height: 42, fontWeight: 700 }}
              >
                Sync Orders
              </Button>
              <Button
                danger
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                style={{ borderRadius: 12, height: 42, fontWeight: 700 }}
              >
                Sign Out
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Real-Time Background Synchronization Status Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 18,
          padding: '12px 20px',
          border: `1px solid ${publicTheme.border}`,
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
          marginBottom: 24,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: backgroundSyncEnabled ? '#10b981' : '#94a3b8',
              boxShadow: backgroundSyncEnabled ? '0 0 10px #10b981' : 'none',
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 700, color: publicTheme.text }}>
            Live Background Order Sync:
          </span>
          <span style={{ fontSize: 12, color: publicTheme.subtext }}>
            {backgroundSyncEnabled ? `Active (last sync ${syncSecondsAgo}s ago)` : 'Paused (Battery Saver)'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: publicTheme.subtext }}>Auto Refresh:</span>
          <Switch checked={backgroundSyncEnabled} onChange={handleToggleSync} />
        </div>
      </div>

      {/* Main Order Workspace */}
      <Card
        style={{
          borderRadius: 22,
          border: `1px solid ${publicTheme.border}`,
          boxShadow: publicTheme.lightShadow,
        }}
        styles={{ body: { padding: '24px 28px' } }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 850, color: publicTheme.text }}>
              Procurement Orders History
            </div>
            <div style={{ fontSize: 12, color: publicTheme.subtext }}>
              Track order tickets, view fulfillment progress, and download PDF tax receipts.
            </div>
          </div>

          <Space size={6} wrap>
            {['all', 'confirmed', 'preparing', 'completed', 'pending'].map((st) => (
              <Tag
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  cursor: 'pointer',
                  borderRadius: 999,
                  background: statusFilter === st ? publicTheme.primary : '#f1f5f9',
                  color: statusFilter === st ? '#ffffff' : publicTheme.text,
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 11,
                  padding: '3px 12px',
                }}
              >
                {st.toUpperCase()}
              </Tag>
            ))}
          </Space>
        </div>

        {loadingOrders ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <Spin indicator={<SyncOutlined spin style={{ fontSize: 32, color: publicTheme.primary }} />} />
            <div style={{ marginTop: 12, fontWeight: 700, color: publicTheme.text }}>
              Syncing procurement orders...
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>📦</div>
            <Title level={4} style={{ color: publicTheme.text, margin: 0 }}>
              No orders found in this category
            </Title>
            <Paragraph style={{ color: publicTheme.subtext, marginTop: 4 }}>
              When you submit wholesale orders or telegram e-menu bookings, they appear here in real-time.
            </Paragraph>
            <Button
              type="primary"
              onClick={() => navigate('/products')}
              style={{ borderRadius: 12, fontWeight: 700, marginTop: 12 }}
            >
              Start Procurement Order
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredOrders.map((order, idx) => {
              const currentStatus = order.status || 'Confirmed';
              const itemsList = order.items || [];
              const orderTotal = Number(order.total || order.subtotal || 0);

              return (
                <div
                  key={order.orderId || idx}
                  style={{
                    borderRadius: 18,
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    padding: '20px 22px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <span style={{ fontSize: 15, fontWeight: 850, color: publicTheme.text }}>
                        Order #{order.orderId || `AUR-${1000 + idx}`}
                      </span>
                      {order.customer?.poNumber && (
                        <span style={{ fontSize: 12, color: publicTheme.subtext, marginLeft: 8 }}>
                          • PO: {order.customer.poNumber}
                        </span>
                      )}
                      <div style={{ fontSize: 11.5, color: publicTheme.subtext, marginTop: 2 }}>
                        Placed on {order.createdAt || 'Recent'} • Carrier: {order.deliveryMethod || 'Regional Freight'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Tag color={statusColor[currentStatus] || 'blue'} style={{ borderRadius: 6, fontWeight: 800 }}>
                        {currentStatus.toUpperCase()}
                      </Tag>
                      <span style={{ fontSize: 18, fontWeight: 900, color: publicTheme.primary }}>
                        {formatCurrency(orderTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  {itemsList.length > 0 && (
                    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10, marginBottom: 12 }}>
                      {itemsList.map((item, itemIdx) => (
                        <div
                          key={itemIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            background: '#ffffff',
                            borderRadius: 10,
                            padding: '6px 10px',
                            border: '1px solid #e2e8f0',
                            flexShrink: 0,
                          }}
                        >
                          {item.image && (
                            <img src={item.image} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
                          )}
                          <div style={{ fontSize: 12, fontWeight: 700, color: publicTheme.text }}>
                            {item.quantity || 1}x {item.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                    <Button
                      size="small"
                      icon={<FilePdfOutlined />}
                      onClick={() => exportSingleOrderPdf(order)}
                      style={{ borderRadius: 8, fontWeight: 700 }}
                    >
                      Proforma Invoice
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      icon={<EyeOutlined />}
                      onClick={() => setSelectedReceiptOrder(order)}
                      style={{ borderRadius: 8, fontWeight: 700, background: publicTheme.primary }}
                    >
                      View Receipt Ticket
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Printable Receipt Modal */}
      <OrderReceiptModal
        order={selectedReceiptOrder}
        open={Boolean(selectedReceiptOrder)}
        onClose={() => setSelectedReceiptOrder(null)}
      />
    </div>
  );
}
