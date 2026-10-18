import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Checkbox,
  Space,
  Alert,
  Modal,
  Tag,
  Divider,
  Dropdown,
  message
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  ArrowRightOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined,
  CheckCircleFilled,
  AppstoreOutlined,
  ShoppingCartOutlined,
  ReconciliationOutlined,
  CreditCardOutlined,
  BankOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { useAdminTheme } from '../../../hooks/useAdminTheme';
import { useLanguage, useTranslation, SUPPORTED_LANGUAGES } from '../../../contexts/LanguageContext';

const { Title, Text, Paragraph } = Typography;

const ModernAuraLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const adminTheme = useAdminTheme();
  const { currentLanguage, setLanguage, activeLanguage, languages } = useLanguage();
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(null);

  const langList = Array.isArray(languages) && languages.length ? languages : SUPPORTED_LANGUAGES;
  const languageMenuItems = langList.map((lang) => {
    const isSelected = lang.code === currentLanguage;
    return {
      key: `login-lang-${lang.code}`,
      icon: <span style={{ fontSize: 16 }}>{lang.flag}</span>,
      label: (
        <span style={{ fontWeight: isSelected ? 700 : 500, color: isSelected ? '#2563eb' : undefined }}>
          {lang.native} ({lang.name})
        </span>
      ),
      onClick: () => {
        setLanguage(lang.code);
      },
    };
  });

  const onFinish = async (values) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await axios.post('/api/admin/auth/login', {
        username: values.username,
        password: values.password,
        remember_me: values.remember_me || false
      });

      if (res.data?.success || res.data?.status) {
        const payload = res.data.data || res.data;
        const token = payload.token || payload.access_token || res.data.token || res.data.access_token;
        const user = payload.user || payload.profile || res.data.user || res.data.profile || {};
        const group = payload.group || res.data.group;
        const GP = payload.GP || res.data.GP || {};
        const permissions = payload.permissions || res.data.permissions || [];
        const branches = payload.branches || res.data.branches || [];

        const enrichedUser = {
          ...user,
          group,
          role: group?.name || user?.role || 'admin',
          group_name: group?.name || user?.group_name || 'admin',
          level: group?.level ?? user?.level,
          GP,
          permissions,
          branches
        };

        const userRole = (group?.name || user?.role || user?.group_name || '').toLowerCase();
        const isCustomer = userRole === 'customer' || Number(user?.group_id) === 4 || Number(group?.allow_admin_login) === 0;

        if (isCustomer) {
          setErrorMessage('Access denied: Customer accounts are strictly prohibited from logging into the administrative portal.');
          return;
        }

        login({ token, user: enrichedUser });
        message.success(`Welcome back, ${user.first_name || user.username || 'Admin'}!`);
        navigate('/admins/dashboard');
      } else {
        setErrorMessage(res.data?.message || 'Login failed. Please verify credentials.');
      }
    } catch (err) {
      console.error('[Login Error]', err);
      const apiMsg = err.response?.data?.message || err.message || 'Authentication failed. Please check network.';
      setErrorMessage(apiMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    form.setFieldsValue({
      username: 'admin',
      password: 'admin',
      remember_me: true
    });
  };

  const handleForgotSubmit = async () => {
    if (!forgotEmail) {
      message.error('Please enter your registered email');
      return;
    }
    try {
      const res = await axios.post('/api/admin/auth/forgot-password', { email: forgotEmail });
      setForgotSuccess(res.data?.data?.resetCode ? `Reset code generated: ${res.data.data.resetCode}` : 'Instructions sent to your email.');
    } catch (err) {
      message.error('Failed to submit reset request');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0b1329 100%)',
        color: '#f8fafc',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Ambient Glows */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, rgba(37,99,235,0) 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '25%',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14,165,233,0.15) 0%, rgba(14,165,233,0) 70%)',
          filter: 'blur(70px)',
          pointerEvents: 'none'
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          zIndex: 1
        }}
      >
        {/* ================================================================= */}
        {/* LEFT PANEL: Modern Redesigned Vector Hub (Fixed Typos & Centered)  */}
        {/* ================================================================= */}
        <div
          style={{
            flex: '1 1 540px',
            maxWidth: '650px',
            padding: '24px 32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          {/* Brand Pill */}
          <div style={{ marginBottom: 16 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(37, 99, 235, 0.15)',
                border: '1px solid rgba(37, 99, 235, 0.35)',
                borderRadius: 20,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                color: '#60a5fa',
                letterSpacing: '0.05em'
              }}
            >
              <SafetyCertificateOutlined /> {t('login_badge', 'AURA B2B ERP & SOURCING PLATFORM')}
            </span>
          </div>

          <Title
            level={1}
            style={{
              color: '#ffffff',
              fontSize: '2.5rem',
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: 12
            }}
          >
            {t('enterprise_operations_hub', 'Enterprise Operations Hub')}
          </Title>
          <Paragraph
            style={{
              color: '#94a3b8',
              fontSize: 15,
              lineHeight: 1.6,
              maxWidth: 540,
              marginBottom: 32
            }}
          >
            {t('enterprise_operations_hub_desc', 'Centralized procurement, inventory telemetry, and unified user access control.')}
          </Paragraph>

          {/* SVG Orbiting Module Hub Illustration */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '520px',
              height: '340px',
              margin: '0 auto',
              background: 'rgba(15, 23, 42, 0.5)',
              borderRadius: 24,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* SVG Connecting Web */}
            <svg
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
              viewBox="0 0 520 340"
            >
              <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              {/* Lines from Center (260, 170) to 6 Satellites */}
              <line x1="260" y1="170" x2="100" y2="70" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="260" y1="170" x2="260" y2="45" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="260" y1="170" x2="420" y2="70" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="260" y1="170" x2="100" y2="270" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="260" y1="170" x2="260" y2="295" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="260" y1="170" x2="420" y2="270" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="4 4" />
            </svg>

            {/* Satellite 1: Invoices & Sales */}
            <div style={{ position: 'absolute', top: '45px', left: '20px', textAlign: 'center' }}>
              <div style={{ width: 44, height: 44, margin: '0 auto 6px', borderRadius: 12, background: 'rgba(37,99,235,0.25)', border: '1px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', fontSize: 18 }}>
                <ShoppingCartOutlined />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                {t('invoices_sales', 'Invoices & Sales')}
              </span>
            </div>

            {/* Satellite 2: Purchases & Sourcing */}
            <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
              <div style={{ width: 44, height: 44, margin: '0 auto 6px', borderRadius: 12, background: 'rgba(14,165,233,0.25)', border: '1px solid #0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontSize: 18 }}>
                <ReconciliationOutlined />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                {t('purchases_sourcing', 'Purchases & Sourcing')}
              </span>
            </div>

            {/* Satellite 3: Quick POS Register */}
            <div style={{ position: 'absolute', top: '45px', right: '20px', textAlign: 'center' }}>
              <div style={{ width: 44, height: 44, margin: '0 auto 6px', borderRadius: 12, background: 'rgba(16,185,129,0.25)', border: '1px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', fontSize: 18 }}>
                <CreditCardOutlined />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                {t('pos_register', 'Quick POS Register')}
              </span>
            </div>

            {/* CENTER HUB: Aura Core Logo with Clean Halo */}
            <div
              style={{
                position: 'relative',
                width: 104,
                height: 104,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #0284c7 100%)',
                boxShadow: '0 0 35px rgba(37,99,235,0.6)',
                border: '3px solid rgba(255,255,255,0.4)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2
              }}
            >
              <img
                src="/logos/aura-logo-white.svg"
                alt="Aura ERP"
                style={{ width: 48, height: 48, objectFit: 'contain' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <span style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', letterSpacing: '0.08em' }}>AURA</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: '#bfdbfe', letterSpacing: '0.04em' }}>CORE ERP</span>
            </div>

            {/* Satellite 4: Stock Adjustments */}
            <div style={{ position: 'absolute', bottom: '35px', left: '20px', textAlign: 'center' }}>
              <div style={{ width: 44, height: 44, margin: '0 auto 6px', borderRadius: 12, background: 'rgba(245,158,11,0.25)', border: '1px solid #f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', fontSize: 18 }}>
                <AppstoreOutlined />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                {t('stock_adjustments', 'Stock Adjustments')}
              </span>
            </div>

            {/* Satellite 5: Financial Accounts */}
            <div style={{ position: 'absolute', bottom: '15px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
              <div style={{ width: 44, height: 44, margin: '0 auto 6px', borderRadius: 12, background: 'rgba(139,92,246,0.25)', border: '1px solid #8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc', fontSize: 18 }}>
                <BankOutlined />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                {t('financial_accounts', 'Financial Accounts')}
              </span>
            </div>

            {/* Satellite 6: Analytics & Reports */}
            <div style={{ position: 'absolute', bottom: '35px', right: '20px', textAlign: 'center' }}>
              <div style={{ width: 44, height: 44, margin: '0 auto 6px', borderRadius: 12, background: 'rgba(236,72,153,0.25)', border: '1px solid #ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f472b6', fontSize: 18 }}>
                <BarChartOutlined />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                {t('analytics_reports', 'Analytics & Reports')}
              </span>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT PANEL: Roomy, Well-Spaced Modern Login Form Card            */}
        {/* ================================================================= */}
        <div
          style={{
            flex: '1 1 420px',
            maxWidth: '480px',
            padding: '20px'
          }}
        >
          <Card
            style={{
              borderRadius: 20,
              background: '#ffffff',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              overflow: 'hidden'
            }}
            styles={{ body: { padding: '40px 36px' } }}
          >
            {/* Header: Title + Language Switcher */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
              <div>
                <Title level={2} style={{ margin: 0, color: '#0f172a', fontWeight: 700, fontSize: 24 }}>
                  {t('sign_in_aura_erp', 'Sign In to Aura ERP')}
                </Title>
                <Text type="secondary" style={{ fontSize: 14 }}>
                  {t('sign_in_credentials_desc', 'Enter your credentials to access the administrative portal')}
                </Text>
              </div>

              {/* Language Switcher */}
              <Dropdown menu={{ items: languageMenuItems }} trigger={['click']} placement="bottomRight">
                <Button
                  size="small"
                  shape="round"
                  icon={<span style={{ fontSize: 14 }}>{activeLanguage?.flag || '🌐'}</span>}
                  style={{
                    fontSize: 12,
                    borderColor: '#cbd5e1',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  {activeLanguage?.native || activeLanguage?.name || 'Language'}
                </Button>
              </Dropdown>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <Alert
                type="error"
                showIcon
                message={errorMessage}
                closable
                onClose={() => setErrorMessage(null)}
                style={{ marginBottom: 24, borderRadius: 10 }}
              />
            )}

            {/* Login Form */}
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={{ remember_me: true }}
              requiredMark={false}
            >
              <Form.Item
                label={<span style={{ fontWeight: 600, color: '#334155' }}>{t('username_or_email', 'Username or Email')}</span>}
                name="username"
                rules={[{ required: true, message: t('enter_username', 'Please enter your username') }]}
              >
                <Input
                  size="large"
                  autoComplete="username"
                  prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                  placeholder={t('username_or_email', 'Username or Email')}
                  style={{ borderRadius: 10 }}
                />
              </Form.Item>

              <Form.Item
                label={<span style={{ fontWeight: 600, color: '#334155' }}>{t('password', 'Password')}</span>}
                name="password"
                rules={[{ required: true, message: t('enter_password', 'Please enter your password') }]}
              >
                <Input.Password
                  size="large"
                  autoComplete="current-password"
                  prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                  placeholder={t('password', 'Password')}
                  style={{ borderRadius: 10 }}
                />
              </Form.Item>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Form.Item name="remember_me" valuePropName="checked" noStyle>
                  <Checkbox style={{ color: '#64748b', fontSize: 13 }}>{t('remember_device', 'Remember this device')}</Checkbox>
                </Form.Item>

                <Button
                  type="link"
                  onClick={() => setForgotModalVisible(true)}
                  style={{ padding: 0, fontSize: 13, color: '#2563eb' }}
                >
                  {t('forgot_password', 'Forgot password?')}
                </Button>
              </div>

              <Form.Item style={{ marginBottom: 16 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={loading}
                  icon={<ArrowRightOutlined />}
                  style={{
                    height: 48,
                    borderRadius: 12,
                    background: '#2563eb',
                    fontWeight: 600,
                    fontSize: 15,
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
                  }}
                >
                  {t('sign_in_command_center', 'Sign In to Command Center')}
                </Button>
              </Form.Item>
            </Form>

            <Divider style={{ margin: '20px 0 16px', borderColor: '#f1f5f9' }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{t('demo_credentials', 'DEMO CREDENTIALS')}</span>
            </Divider>

            {/* Quick 1-Click Demo Fill */}
            <div style={{ textAlign: 'center' }}>
              <Button
                type="dashed"
                size="small"
                onClick={handleQuickFill}
                style={{
                  borderRadius: 20,
                  fontSize: 12,
                  color: '#2563eb',
                  borderColor: '#93c5fd',
                  background: '#eff6ff'
                }}
              >
                ⚡ {t('demo_sign_in_pill', 'Quick Demo Sign In: admin / admin')}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        title={t('reset_password', 'Reset Password')}
        open={forgotModalVisible}
        onCancel={() => {
          setForgotModalVisible(false);
          setForgotSuccess(null);
        }}
        onOk={handleForgotSubmit}
        okText={t('send_reset_code', 'Send Reset Code')}
        okButtonProps={{ style: { background: '#2563eb' } }}
      >
        <Paragraph type="secondary" style={{ fontSize: 13, marginTop: 12 }}>
          {t('reset_password_desc', 'Enter the registered email associated with your user account. We will issue a verification code.')}
        </Paragraph>
        {forgotSuccess ? (
          <Alert type="success" message={forgotSuccess} showIcon />
        ) : (
          <Input
            size="large"
            placeholder="admin@aurasupply.com"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            style={{ borderRadius: 8, marginTop: 8 }}
          />
        )}
      </Modal>
    </div>
  );
};

export default ModernAuraLogin;
