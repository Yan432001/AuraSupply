import React, { useState, useEffect, useMemo } from 'react';
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
  Modal,
  Form,
  Alert,
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
  EditOutlined,
  KeyOutlined,
  LockOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import OrderReceiptModal from '../../components/common/OrderReceiptModal';
import PasswordComplexityIndicator, { passwordComplexityRule } from '../../components/common/PasswordComplexityIndicator';
import { formatCurrency, publicTheme } from '../../utils/webTheme';
import { exportSingleOrderPdf } from '../../utils/orderPdfExporter';
import { fetchOrders } from '../../utils/apiconfig';

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
  const { user, logout, loginWeb } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const watchNewPassword = Form.useWatch('new_password', passwordForm);

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

  const fetchCustomerProfile = async () => {
    try {
      const res = await axios.get('/api/web/auth/profile');
      if (res.data?.success && res.data?.data) {
        const u = res.data.data.user || res.data.data.profile || res.data.data;
        if (loginWeb) loginWeb({ user: u });
        profileForm.setFieldsValue({
          username: u.username || '',
          name: u.first_name || u.name || '',
          phone: u.phone || '',
          company: u.company || '',
          address: u.address || '',
        });
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchCustomerProfile();
  }, []);

  const openEditModal = () => {
    profileForm.setFieldsValue({
      username: user?.username || '',
      name: user?.name || user?.first_name || '',
      phone: user?.phone || '',
      company: user?.company || '',
      address: user?.address || '',
    });
    setEditProfileOpen(true);
  };

  const handleSaveProfile = async (values) => {
    setUpdatingProfile(true);
    try {
      const res = await axios.put('/api/web/auth/profile', values);
      if (res.data?.success) {
        message.success(t('profile_updated_successfully', 'Profile updated successfully!'));
        const updated = res.data.data?.user || res.data.data?.profile || res.data.data;
        if (loginWeb) loginWeb({ user: updated });
        setEditProfileOpen(false);
      } else {
        message.error(res.data?.message || t('failed_to_update_profile', 'Failed to update profile'));
      }
    } catch (err) {
      message.error(err.response?.data?.message || t('failed_to_update_profile', 'Failed to update profile'));
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (values) => {
    setUpdatingPassword(true);
    try {
      const res = await axios.post('/api/web/auth/change-password', values);
      if (res.data?.success) {
        message.success(t('password_changed_successfully', 'Password changed successfully!'));
        passwordForm.resetFields();
        setChangePasswordOpen(false);
      } else {
        message.error(res.data?.message || t('failed_to_change_password', 'Failed to change password'));
      }
    } catch (err) {
      message.error(err.response?.data?.message || t('failed_to_change_password', 'Failed to change password'));
    } finally {
      setUpdatingPassword(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setSyncSecondsAgo(Math.floor((Date.now() - lastSyncTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastSyncTime]);

  const fetchUserOrders = async (isSilent = false) => {
    if (!isSilent) setLoadingOrders(true);
    try {
      // 1. Fetch real orders from database API
      const res = await fetchOrders().catch(() => null);
      let apiOrders = [];
      if (res?.success && Array.isArray(res.data)) {
        apiOrders = res.data.map((o) => ({
          ...o,
          orderId: o.reference_no || `AUR-${o.id}`,
          total: o.grand_total || o.total,
          createdAt: o.date ? new Date(o.date).toLocaleString() : new Date().toLocaleString(),
          status: o.status || 'Confirmed',
        }));
      }

      // 2. Fetch from local storage web order history
      let localOrders = [];
      try {
        localOrders = JSON.parse(localStorage.getItem('aura_web_order_history') || '[]');
      } catch (_) {}

      // Combine and deduplicate
      const seen = new Set();
      const combined = [];
      [...apiOrders, ...localOrders].forEach((item) => {
        const idKey = item.orderId || item.reference_no || item.id;
        if (idKey && !seen.has(idKey)) {
          seen.add(idKey);
          combined.push(item);
        }
      });

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
    message.success(t('logout_success', 'Successfully logged out.'));
    navigate('/');
  };

  const statusLabel = (st) => {
    switch (st.toLowerCase()) {
      case 'all': return t('all', 'ALL');
      case 'confirmed': return t('confirmed', 'CONFIRMED');
      case 'preparing': return t('preparing', 'PREPARING');
      case 'completed': return t('completed', 'COMPLETED');
      case 'pending': return t('pending', 'PENDING');
      default: return st.toUpperCase();
    }
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
          <Col xs={24} lg={13}>
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
                    {user?.name || user?.first_name || user?.username || t('wholesale_partner', 'Aura Wholesale Partner')}
                  </Title>
                  <Tag color="blue" style={{ borderRadius: 6, fontWeight: 700, fontSize: 11 }}>
                    {user?.tier || t('enterprise_vip', 'Enterprise Tier 1 VIP')}
                  </Tag>
                  {user?.username && (
                    <Tag color="purple" style={{ borderRadius: 6, fontWeight: 700, fontSize: 11 }}>
                      @{user.username}
                    </Tag>
                  )}
                </div>
                <div style={{ color: publicTheme.subtext, fontSize: 13, marginTop: 4 }}>
                  {user?.email || 'procurement@auraglobal.com'} • {t('account_id', 'Account ID')}: {user?.id || 'AUR-CORP-9182'}
                </div>
                <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 12, color: publicTheme.subtext, flexWrap: 'wrap' }}>
                  {user?.phone && <span><PhoneOutlined /> {user.phone}</span>}
                  {user?.company && <span><ShopOutlined /> {user.company}</span>}
                  <span><SafetyCertificateOutlined style={{ color: '#10b981' }} /> {t('verified_business_buyer', 'Verified Business Buyer')}</span>
                </div>
              </div>
            </div>
          </Col>

          <Col xs={24} lg={11} style={{ textAlign: 'right' }}>
            <Space wrap size={8}>
              <Button
                icon={<EditOutlined />}
                onClick={openEditModal}
                style={{ borderRadius: 12, height: 40, fontWeight: 700 }}
              >
                {t('edit_profile', 'Edit Profile')}
              </Button>
              <Button
                icon={<KeyOutlined />}
                onClick={() => setChangePasswordOpen(true)}
                style={{ borderRadius: 12, height: 40, fontWeight: 700 }}
              >
                {t('change_password', 'Change Password')}
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchUserOrders(false)}
                loading={loadingOrders}
                style={{ borderRadius: 12, height: 40, fontWeight: 700 }}
              >
                {t('sync_orders', 'Sync Orders')}
              </Button>
              <Button
                danger
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                style={{ borderRadius: 12, height: 40, fontWeight: 700 }}
              >
                {t('sign_out', 'Sign Out')}
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
            {t('live_background_sync', 'Live Background Order Sync:')}
          </span>
          <span style={{ fontSize: 12, color: publicTheme.subtext }}>
            {backgroundSyncEnabled ? `${t('active', 'Active')} (${t('last_sync', 'last sync')} ${syncSecondsAgo}s ${t('ago', 'ago')})` : t('paused_battery_saver', 'Paused (Battery Saver)')}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: publicTheme.subtext }}>{t('auto_refresh', 'Auto Refresh:')}</span>
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
              {t('procurement_orders_history', 'Procurement Orders History')}
            </div>
            <div style={{ fontSize: 12, color: publicTheme.subtext }}>
              {t('procurement_orders_desc', 'Track order tickets, view fulfillment progress, and download PDF tax receipts.')}
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
                {statusLabel(st)}
              </Tag>
            ))}
          </Space>
        </div>

        {loadingOrders ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <Spin indicator={<SyncOutlined spin style={{ fontSize: 32, color: publicTheme.primary }} />} />
            <div style={{ marginTop: 12, fontWeight: 700, color: publicTheme.text }}>
              {t('syncing_orders', 'Syncing procurement orders...')}
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>📦</div>
            <Title level={4} style={{ color: publicTheme.text, margin: 0 }}>
              {t('no_orders_found', 'No orders found in this category')}
            </Title>
            <Paragraph style={{ color: publicTheme.subtext, marginTop: 4 }}>
              {t('no_orders_desc', 'When you submit wholesale orders or telegram e-menu bookings, they appear here in real-time.')}
            </Paragraph>
            <Button
              type="primary"
              onClick={() => navigate('/products')}
              style={{ borderRadius: 12, fontWeight: 700, marginTop: 12 }}
            >
              {t('start_procurement_order', 'Start Procurement Order')}
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
                        {t('order', 'Order')} #{order.orderId || `AUR-${1000 + idx}`}
                      </span>
                      {order.customer?.poNumber && (
                        <span style={{ fontSize: 12, color: publicTheme.subtext, marginLeft: 8 }}>
                          • PO: {order.customer.poNumber}
                        </span>
                      )}
                      <div style={{ fontSize: 11.5, color: publicTheme.subtext, marginTop: 2 }}>
                        {t('placed_on', 'Placed on')} {order.createdAt || t('recent', 'Recent')} • {t('carrier', 'Carrier')}: {order.deliveryMethod || t('regional_freight', 'Regional Freight')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Tag color={statusColor[currentStatus] || 'blue'} style={{ borderRadius: 6, fontWeight: 800 }}>
                        {statusLabel(currentStatus)}
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
                      {t('proforma_invoice', 'Proforma Invoice')}
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      icon={<EyeOutlined />}
                      onClick={() => setSelectedReceiptOrder(order)}
                      style={{ borderRadius: 8, fontWeight: 700, background: publicTheme.primary }}
                    >
                      {t('view_receipt_ticket', 'View Receipt Ticket')}
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

      {/* Edit Profile Modal (Allows updating username, name, phone, company, address) */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800 }}>
            <EditOutlined style={{ color: publicTheme.primary }} />
            <span>{t('edit_profile', 'Edit Profile')}</span>
          </div>
        }
        open={editProfileOpen}
        onCancel={() => setEditProfileOpen(false)}
        footer={null}
        destroyOnClose
        centered
        styles={{ body: { paddingTop: 16 } }}
      >
        <Form form={profileForm} layout="vertical" onFinish={handleSaveProfile}>
          <Form.Item
            label={t('username', 'Username')}
            name="username"
            tooltip={t('username_criteria_tooltip', 'Username must be 3-30 characters, letters, numbers, underscores, dots, or hyphens')}
            rules={[
              { required: true, message: t('username_required', 'Please enter a username') },
              { min: 3, message: t('username_min_3', 'Username must be at least 3 characters') },
              { max: 30, message: t('username_max_30', 'Username cannot exceed 30 characters') },
              {
                pattern: /^[a-zA-Z0-9_.-]+$/,
                message: t('username_invalid_chars', 'Only letters, numbers, underscores, dots, and hyphens are allowed'),
              },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="e.g. john_doe" />
          </Form.Item>

          <Form.Item
            label={t('full_name', 'Full Name')}
            name="name"
            rules={[{ required: true, message: t('name_required', 'Please enter your name') }]}
          >
            <Input placeholder="e.g. John Doe" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label={t('phone_number', 'Phone Number')} name="phone">
                <Input prefix={<PhoneOutlined />} placeholder="e.g. +855 12 345 678" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label={t('company_name', 'Company / Business')} name="company">
                <Input prefix={<ShopOutlined />} placeholder="e.g. Acme Corp" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={t('delivery_address', 'Delivery Address')} name="address">
            <Input.TextArea rows={2} placeholder="e.g. #123 St 456, Phnom Penh" />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <Button onClick={() => setEditProfileOpen(false)} style={{ borderRadius: 10 }}>
              {t('cancel', 'Cancel')}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={updatingProfile}
              style={{ borderRadius: 10, fontWeight: 700, background: publicTheme.primary }}
            >
              {t('save_profile_changes', 'Save Profile Changes')}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Change Password Modal (Enforces password complexity: uppercase, lowercase, numbers, symbols, min 8 chars) */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800 }}>
            <KeyOutlined style={{ color: publicTheme.primary }} />
            <span>{t('change_password', 'Change Password')}</span>
          </div>
        }
        open={changePasswordOpen}
        onCancel={() => setChangePasswordOpen(false)}
        footer={null}
        destroyOnClose
        centered
        styles={{ body: { paddingTop: 16 } }}
      >
        <Alert
          type="info"
          showIcon
          message={t('password_policy_title', 'Secure Password Requirements')}
          description={t(
            'password_policy_desc',
            'Password must be at least 8 characters long and include uppercase letters (A-Z), lowercase letters (a-z), numbers (0-9), and symbols (!@#$%^&*).'
          )}
          style={{ marginBottom: 16, borderRadius: 10 }}
        />

        <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
          <Form.Item
            label={t('current_password', 'Current Password')}
            name="current_password"
            rules={[{ required: true, message: t('enter_current_password', 'Please enter your current password') }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder={t('enter_current_password', 'Enter current password')} />
          </Form.Item>

          <Form.Item
            label={t('new_password', 'New Password')}
            name="new_password"
            rules={[
              { required: true, message: t('enter_new_password', 'Please enter a new password') },
              passwordComplexityRule(t),
            ]}
          >
            <Input.Password prefix={<KeyOutlined />} placeholder={t('enter_new_password', 'Enter new password')} />
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <PasswordComplexityIndicator password={watchNewPassword} t={t} />
          </div>

          <Form.Item
            label={t('confirm_new_password', 'Confirm New Password')}
            name="confirm_password"
            dependencies={['new_password']}
            rules={[
              { required: true, message: t('confirm_password_required', 'Please confirm your new password') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('passwords_do_not_match', 'The two passwords do not match!')));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder={t('confirm_new_password', 'Confirm new password')} />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <Button onClick={() => setChangePasswordOpen(false)} style={{ borderRadius: 10 }}>
              {t('cancel', 'Cancel')}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={updatingPassword}
              style={{ borderRadius: 10, fontWeight: 700, background: publicTheme.primary }}
            >
              {t('update_password', 'Update Password')}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
