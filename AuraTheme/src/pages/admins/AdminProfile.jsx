import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Avatar,
  Typography,
  Tag,
  Descriptions,
  Button,
  Form,
  Input,
  Select,
  Divider,
  Space,
  Alert,
  Spin,
  Tabs,
  Badge,
  message,
  Statistic
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
  LockOutlined,
  ShopOutlined,
  DatabaseOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  EditOutlined,
  SaveOutlined,
  DollarOutlined,
  CrownOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminTheme } from '../../hooks/useAdminTheme';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function AdminProfile() {
  const { user: authUser, login } = useAuth();
  const adminTheme = useAdminTheme();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/auth/profile');
      if (res.data?.success && res.data?.data) {
        const payload = res.data.data;
        const u = payload.user || payload.profile || payload;
        setProfileData(u);
        profileForm.setFieldsValue({
          first_name: u.first_name || '',
          last_name: u.last_name || '',
          phone: u.phone || '',
          gender: u.gender || 'male',
          avatar: u.avatar || '',
        });
      }
    } catch (err) {
      console.error('Error fetching admin profile:', err);
      message.error(err.response?.data?.message || 'Failed to fetch user profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (values) => {
    setUpdatingProfile(true);
    try {
      const res = await axios.put('/api/admin/auth/profile', values);
      if (res.data?.success) {
        message.success('Profile details updated successfully!');
        const updated = res.data.data?.user || res.data.data?.profile || res.data.data;
        setProfileData(updated);
        // Refresh local session context
        login({ user: updated });
      } else {
        message.error(res.data?.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      message.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (values) => {
    setUpdatingPassword(true);
    try {
      const res = await axios.post('/api/admin/auth/change-password', values);
      if (res.data?.success) {
        message.success('Password changed successfully!');
        passwordForm.resetFields();
      } else {
        message.error(res.data?.message || 'Failed to change password');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      message.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip="Loading user profile..." />
      </div>
    );
  }

  const u = profileData || authUser || {};
  const roleName = (u.group_name || u.role || 'Admin').toUpperCase();
  const isOwner = Boolean(u.Owner || u.isOwner || u.level === 1 || u.group_id === 1);
  const isAdmin = Boolean(u.Admin || u.isAdmin || u.level === 2 || u.group_id === 2);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>
      {/* 1. Header Banner */}
      <Card
        style={{
          borderRadius: 16,
          background: adminTheme.cardBg,
          border: `1px solid ${adminTheme.border || 'rgba(0,0,0,0.06)'}`,
          marginBottom: 24,
          boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} sm={24} md={16}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ position: 'relative' }}>
                <Avatar
                  size={84}
                  src={u.avatar || undefined}
                  icon={<UserOutlined style={{ fontSize: 36 }} />}
                  style={{
                    border: '3px solid #f97316',
                    boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#10b981',
                    border: '2px solid #ffffff',
                    boxShadow: '0 0 8px #10b981',
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <Title level={3} style={{ margin: 0, color: adminTheme.text }}>
                    {u.name || (u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.username)}
                  </Title>
                  <Tag
                    color={isOwner ? 'gold' : isAdmin ? 'orange' : 'blue'}
                    icon={isOwner ? <CrownOutlined /> : <SafetyCertificateOutlined />}
                    style={{ fontWeight: 700, padding: '2px 10px', borderRadius: 6, fontSize: 12 }}
                  >
                    {roleName} (Level {u.level ?? 1})
                  </Tag>
                  <Tag color="success" style={{ fontWeight: 600, borderRadius: 6 }}>
                    ACTIVE ACCOUNT
                  </Tag>
                </div>
                <Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 13 }}>
                  @{u.username} &bull; {u.email}
                </Text>
                <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
                  <Text style={{ fontSize: 12, color: adminTheme.subtext }}>
                    <ShopOutlined style={{ marginRight: 5, color: '#f97316' }} />
                    Store: <strong>{u.biller_name || 'All Stores / Central'}</strong>
                  </Text>
                  <Text style={{ fontSize: 12, color: adminTheme.subtext }}>
                    <DatabaseOutlined style={{ marginRight: 5, color: '#0ea5e9' }} />
                    Warehouse: <strong>{u.warehouse_name || 'Central Warehouse'}</strong>
                  </Text>
                </div>
              </div>
            </div>
          </Col>

          <Col xs={24} sm={24} md={8}>
            <Row gutter={[12, 12]} justify="end">
              <Col span={12}>
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: adminTheme.headerButtonBg || 'rgba(0,0,0,0.02)',
                    border: `1px solid ${adminTheme.border || 'rgba(0,0,0,0.06)'}`,
                    textAlign: 'center',
                  }}
                >
                  <Text style={{ fontSize: 11, color: adminTheme.subtext, display: 'block' }}>ACCOUNT ID</Text>
                  <Title level={4} style={{ margin: '4px 0 0', color: adminTheme.text }}>
                    #{u.id || u.user_id}
                  </Title>
                </div>
              </Col>
              <Col span={12}>
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: adminTheme.headerButtonBg || 'rgba(0,0,0,0.02)',
                    border: `1px solid ${adminTheme.border || 'rgba(0,0,0,0.06)'}`,
                    textAlign: 'center',
                  }}
                >
                  <Text style={{ fontSize: 11, color: adminTheme.subtext, display: 'block' }}>ROLE LEVEL</Text>
                  <Title level={4} style={{ margin: '4px 0 0', color: '#f97316' }}>
                    Level {u.level ?? 1}
                  </Title>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* 2. Main Content Tabs */}
      <Tabs
        defaultActiveKey="overview"
        type="card"
        items={[
          {
            key: 'overview',
            label: (
              <span>
                <UserOutlined /> Account Overview
              </span>
            ),
            children: (
              <Row gutter={[24, 24]}>
                {/* Account Details */}
                <Col xs={24} lg={14}>
                  <Card
                    title={<strong>Personal & Contact Information</strong>}
                    style={{ borderRadius: 12, background: adminTheme.cardBg }}
                  >
                    <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
                      <Descriptions.Item label="Username">{u.username}</Descriptions.Item>
                      <Descriptions.Item label="Email Address">{u.email}</Descriptions.Item>
                      <Descriptions.Item label="First Name">{u.first_name || '-'}</Descriptions.Item>
                      <Descriptions.Item label="Last Name">{u.last_name || '-'}</Descriptions.Item>
                      <Descriptions.Item label="Phone Number">{u.phone || '-'}</Descriptions.Item>
                      <Descriptions.Item label="Gender">
                        <Tag color={u.gender === 'female' ? 'magenta' : 'blue'}>
                          {(u.gender || 'male').toUpperCase()}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Store Context (Biller)">
                        {u.biller_name || 'All Billers (Central)'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Default Warehouse">
                        {u.warehouse_name || 'Central Warehouse'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Last Login Time">
                        {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Just now'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Last Login IP">
                        {u.last_login_ip || '127.0.0.1'}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>

                {/* Permissions & CI3 Rights Summary */}
                <Col xs={24} lg={10}>
                  <Card
                    title={<strong>Access Rights & ERP Permissions</strong>}
                    style={{ borderRadius: 12, background: adminTheme.cardBg }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          borderRadius: 8,
                          background: 'rgba(249, 115, 22, 0.05)',
                          border: '1px solid rgba(249, 115, 22, 0.15)',
                        }}
                      >
                        <div>
                          <Text strong style={{ display: 'block' }}>View Right (Scope)</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {u.view_right == 1 ? 'Can view all documents company-wide' : 'Restricted to own records only'}
                          </Text>
                        </div>
                        <Tag color={u.view_right == 1 || isOwner || isAdmin ? 'green' : 'orange'}>
                          {u.view_right == 1 || isOwner || isAdmin ? 'ALL DOCUMENTS' : 'OWN ONLY'}
                        </Tag>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          borderRadius: 8,
                          background: 'rgba(14, 165, 233, 0.05)',
                          border: '1px solid rgba(14, 165, 233, 0.15)',
                        }}
                      >
                        <div>
                          <Text strong style={{ display: 'block' }}>Edit Right (Scope)</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {u.edit_right == 1 ? 'Can edit records company-wide' : 'Can only edit own records'}
                          </Text>
                        </div>
                        <Tag color={u.edit_right == 1 || isOwner || isAdmin ? 'green' : 'orange'}>
                          {u.edit_right == 1 || isOwner || isAdmin ? 'ALL DOCUMENTS' : 'OWN ONLY'}
                        </Tag>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          borderRadius: 8,
                          background: 'rgba(16, 185, 129, 0.05)',
                          border: '1px solid rgba(16, 185, 129, 0.15)',
                        }}
                      >
                        <div>
                          <Text strong style={{ display: 'block' }}>Show Cost / Buying Price</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            Controls cost visibility on products & purchases
                          </Text>
                        </div>
                        <Tag color={u.show_cost == 1 || isOwner || isAdmin ? 'green' : 'default'}>
                          {u.show_cost == 1 || isOwner || isAdmin ? 'VISIBLE' : 'HIDDEN'}
                        </Tag>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          borderRadius: 8,
                          background: 'rgba(168, 85, 247, 0.05)',
                          border: '1px solid rgba(168, 85, 247, 0.15)',
                        }}
                      >
                        <div>
                          <Text strong style={{ display: 'block' }}>Show Selling Price</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            Controls price visibility across catalogs
                          </Text>
                        </div>
                        <Tag color={u.show_price == 1 || isOwner || isAdmin ? 'green' : 'default'}>
                          {u.show_price == 1 || isOwner || isAdmin ? 'VISIBLE' : 'HIDDEN'}
                        </Tag>
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'edit',
            label: (
              <span>
                <EditOutlined /> Edit Profile
              </span>
            ),
            children: (
              <Card
                title={<strong>Update Account Details</strong>}
                style={{ borderRadius: 12, maxWidth: 720, background: adminTheme.cardBg }}
              >
                <Form
                  form={profileForm}
                  layout="vertical"
                  onFinish={handleUpdateProfile}
                  initialValues={{
                    first_name: u.first_name || '',
                    last_name: u.last_name || '',
                    phone: u.phone || '',
                    gender: u.gender || 'male',
                    avatar: u.avatar || '',
                  }}
                >
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item label="First Name" name="first_name">
                        <Input placeholder="Enter first name" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item label="Last Name" name="last_name">
                        <Input placeholder="Enter last name" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item label="Phone Number" name="phone">
                        <Input placeholder="e.g. 012 345 678" prefix={<PhoneOutlined />} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item label="Gender" name="gender">
                        <Select>
                          <Option value="male">Male</Option>
                          <Option value="female">Female</Option>
                          <Option value="other">Other</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item label="Avatar Image URL" name="avatar" extra="Provide an image URL or leave empty for default avatar">
                    <Input placeholder="https://example.com/avatar.png" prefix={<UserOutlined />} />
                  </Form.Item>

                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={updatingProfile}>
                      Save Profile Changes
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
          {
            key: 'security',
            label: (
              <span>
                <KeyOutlined /> Change Password
              </span>
            ),
            children: (
              <Card
                title={<strong>Security & Password Update</strong>}
                style={{ borderRadius: 12, maxWidth: 600, background: adminTheme.cardBg }}
              >
                <Alert
                  type="info"
                  showIcon
                  message="Secure Bcrypt Password Upgrade"
                  description="When you change your password, it will be automatically hashed with high-security Bcrypt with salt rounds."
                  style={{ marginBottom: 20, borderRadius: 8 }}
                />

                <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
                  <Form.Item
                    label="Current Password"
                    name="current_password"
                    rules={[{ required: true, message: 'Please enter your current password' }]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="Enter current password" />
                  </Form.Item>

                  <Form.Item
                    label="New Password"
                    name="new_password"
                    rules={[
                      { required: true, message: 'Please enter a new password' },
                      { min: 6, message: 'Password must be at least 6 characters' },
                    ]}
                  >
                    <Input.Password prefix={<KeyOutlined />} placeholder="Enter new password (min. 6 characters)" />
                  </Form.Item>

                  <Form.Item
                    label="Confirm New Password"
                    name="confirm_password"
                    dependencies={['new_password']}
                    rules={[
                      { required: true, message: 'Please confirm your new password' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('new_password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('The two passwords do not match!'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="Confirm new password" />
                  </Form.Item>

                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button type="primary" danger htmlType="submit" icon={<KeyOutlined />} loading={updatingPassword}>
                      Update Password
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
