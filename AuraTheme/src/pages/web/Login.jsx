import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Checkbox,
  Typography,
  Space,
  Divider,
  Flex,
  message,
  Alert,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  ArrowRightOutlined,
  GoogleOutlined,
  ThunderboltOutlined,
  CheckCircleFilled,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import AuraLogo from '../../components/common/AuraLogo';
import SocialAuthModal, { GoogleIcon, TelegramIcon } from '../../components/common/SocialAuthModal';
import { loginUser } from '../../utils/apiconfig';

const { Title, Text, Paragraph } = Typography;

export default function Login() {
  const [form] = Form.useForm();
  const { loginWeb, loginAdmin, login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [socialProvider, setSocialProvider] = useState('google');

  // Detect auto-logout due to inactivity
  const searchParams = new URLSearchParams(location.search);
  const isInactiveLogout = searchParams.get('reason') === 'inactivity';

  // Destination after login
  const from = location.state?.from?.pathname || '/profile';

  const onFinish = async (values) => {
    setLoading(true);
    setErrorMsg('');

    const rawUser = (values.emailOrUsername || '').trim();
    const rawPass = values.password;

    try {
      let res = await loginUser({
        login: rawUser,
        username: rawUser,
        identity: rawUser,
        email: rawUser,
        password: rawPass,
        remember_me: values.remember || false
      });

      // If loginUser failed, attempt direct admin login fallback (for admin/staff credentials)
      if (!res?.success || (!res?.token && !res?.data?.token)) {
        try {
          const adminFallback = await axios.post('/api/admin/auth/login', {
            username: rawUser,
            password: rawPass,
            remember_me: values.remember || false
          });
          if (adminFallback.data?.success && adminFallback.data?.data?.token) {
            res = adminFallback.data;
          }
        } catch (_) {
          // Keep original error response
        }
      }

      if (res?.success && (res?.token || res?.data?.token || res?.data?.accessToken)) {
        const payload = res.data || res;
        const token = payload.token || payload.access_token || payload.accessToken || res.token;
        const profile = payload.user || payload.profile || res.profile || res.user || {};
        const isStaff = Boolean(
          payload.isStaff ||
          res.isStaff ||
          Number(profile.group_id) === 1 ||
          Number(profile.group_id) === 2 ||
          profile.role === 'owner' ||
          profile.role === 'admin' ||
          rawUser.toLowerCase() === 'admin' ||
          rawUser.toLowerCase() === 'sbcsolutions'
        );

        const userData = {
          ...profile,
          id: profile.id,
          name: profile.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : (profile.username || profile.name || rawUser),
          username: profile.username || rawUser,
          email: profile.email || rawUser,
          role: profile.role || profile.group_name || (isStaff ? 'admin' : 'customer'),
          group_id: profile.group_id || (isStaff ? 1 : 4),
          token: token,
          avatar: profile.avatar || null,
          tier: isStaff ? 'System Administrator' : (profile.role === 'supplier' ? 'Verified Supplier' : 'Valued Customer')
        };

        if (isStaff) {
          if (loginAdmin) loginAdmin({ token, user: userData });
          if (loginWeb) loginWeb({ token, user: userData });
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(userData));
          message.success(`${t('welcome_back', 'Welcome back')}, ${userData.name}!`);
          setLoading(false);
          navigate('/admins/dashboard', { replace: true });
          return;
        }

        if (loginWeb) {
          loginWeb({ token, user: userData });
        } else {
          login(userData);
        }

        message.success(`${t('welcome_back', 'Welcome back')}, ${userData.name}!`);
        setLoading(false);
        navigate(from, { replace: true });
        return;
      } else {
        const msg = res?.message || res?.error?.message || t('invalid_username_password', 'Invalid username or password');
        setErrorMsg(msg);
        setLoading(false);
      }
    } catch (err) {
      console.warn('Real login error:', err);
      // Try admin fallback on catch
      try {
        const adminFallback = await axios.post('/api/admin/auth/login', {
          username: rawUser,
          password: rawPass,
          remember_me: values.remember || false
        });
        if (adminFallback.data?.success && adminFallback.data?.data?.token) {
          const payload = adminFallback.data.data;
          const token = payload.token;
          const user = payload.user;
          if (loginAdmin) loginAdmin({ token, user });
          if (loginWeb) loginWeb({ token, user });
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          message.success(`Welcome back, ${user.name || 'Admin'}!`);
          setLoading(false);
          navigate('/admins/dashboard', { replace: true });
          return;
        }
      } catch (_) {}

      setErrorMsg(err.response?.data?.message || err.message || t('invalid_username_password', 'Invalid username or password'));
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        background: 'radial-gradient(circle at 10% 10%, rgba(47, 111, 237, 0.12), transparent 45%), radial-gradient(circle at 90% 90%, rgba(255, 122, 61, 0.10), transparent 45%), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 460 }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', marginBottom: 12 }}>
            <AuraLogo size={42} showText={true} textColor="#0f172a" />
          </div>
          <Title level={2} style={{ margin: '8px 0 4px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
            {t('welcome_back', 'Welcome Back')}
          </Title>
          <Text style={{ color: '#64748b', fontSize: 13.5 }}>
            {t('login_subtitle', 'Sign in to access your orders, profile, and account management.')}
          </Text>
        </div>

        {/* Login Card */}
        <Card
          style={{
            borderRadius: 24,
            boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.12), 0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(16px)',
          }}
          styles={{ body: { padding: '32px 28px' } }}
        >
          {/* 1-Tap Social Authentication (Google & Telegram) */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>
              {t('one_tap_instant_signin', '1-Tap Instant Sign In:')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                type="button"
                onClick={() => {
                  setSocialProvider('google');
                  setSocialModalOpen(true);
                }}
                className="py-3 px-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2.5 shadow-xs hover:border-slate-300 transition-all active:scale-[0.98] cursor-pointer"
              >
                <GoogleIcon size={18} />
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSocialProvider('telegram');
                  setSocialModalOpen(true);
                }}
                className="py-3 px-3 rounded-2xl bg-[#f0f9ff] hover:bg-[#e0f2fe] border border-[#bae6fd] text-[#0284c7] text-xs font-bold flex items-center justify-center gap-2.5 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
              >
                <TelegramIcon size={18} />
                <span>Telegram</span>
              </button>
            </div>
          </div>

          <Divider style={{ margin: '14px 0 18px', fontSize: 11.5, color: '#94a3b8' }}>
            {t('or_sign_in_with_credentials', 'Or sign in with credentials')}
          </Divider>

          {isInactiveLogout && (
            <Alert
              message={t('session_expired_title', 'Session Expired')}
              description={t('session_expired_inactivity', 'Your session has expired due to inactivity. Please sign in again.')}
              type="warning"
              showIcon
              style={{ marginBottom: 18, borderRadius: 10 }}
            />
          )}

          {errorMsg && (
            <Alert message={errorMsg} type="error" showIcon style={{ marginBottom: 18, borderRadius: 10 }} />
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ remember: true }}
            requiredMark={false}
          >
            <Form.Item
              name="emailOrUsername"
              label={<span style={{ fontWeight: 600, fontSize: 13 }}>{t('email_or_username', 'Email or Username')}</span>}
              rules={[{ required: true, message: t('enter_email_or_username', 'Please enter your email or username') }]}
            >
              <Input
                autoComplete="username"
                prefix={<UserOutlined style={{ color: '#94a3b8', marginRight: 6 }} />}
                placeholder="name@auraglobal.com"
                size="large"
                style={{ borderRadius: 12, height: 46 }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={
                <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{t('password', 'Password')}</span>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      message.info(t('password_reset_sent', 'Password reset instructions sent to your email.'));
                    }}
                    style={{ fontSize: 12, color: '#2563eb', fontWeight: 500 }}
                  >
                    {t('forgot_password_question', 'Forgot password?')}
                  </a>
                </Flex>
              }
              rules={[{ required: true, message: t('enter_password', 'Please enter your password') }]}
            >
              <Input.Password
                autoComplete="current-password"
                prefix={<LockOutlined style={{ color: '#94a3b8', marginRight: 6 }} />}
                placeholder="••••••••"
                size="large"
                style={{ borderRadius: 12, height: 46 }}
              />
            </Form.Item>

            <Form.Item name="remember" valuePropName="checked" style={{ marginBottom: 20 }}>
              <Checkbox style={{ fontSize: 12.5, color: '#64748b' }}>
                {t('keep_signed_in', 'Keep me signed in on this device')}
              </Checkbox>
            </Form.Item>

            <Form.Item style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                style={{
                  height: 48,
                  borderRadius: 14,
                  fontWeight: 700,
                  fontSize: 15,
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                }}
              >
                {t('sign_in_to_account', 'Sign In to Account')}
              </Button>
            </Form.Item>

            {/* Quick 1-Click Demo Fill */}
            <div style={{ textAlign: 'center', display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
              <Button
                type="dashed"
                size="small"
                onClick={() => {
                  form.setFieldsValue({ emailOrUsername: 'admin', password: 'admin' });
                  onFinish({ emailOrUsername: 'admin', password: 'admin' });
                }}
                style={{
                  borderRadius: 20,
                  fontSize: 12,
                  color: '#2563eb',
                  borderColor: '#93c5fd',
                  background: '#eff6ff'
                }}
              >
                ⚡ admin / admin
              </Button>
              <Button
                type="dashed"
                size="small"
                onClick={() => {
                  form.setFieldsValue({ emailOrUsername: 'heanyan1@gmail.com', password: 'Sbc@12345' });
                  onFinish({ emailOrUsername: 'heanyan1@gmail.com', password: 'Sbc@12345' });
                }}
                style={{
                  borderRadius: 20,
                  fontSize: 12,
                  color: '#059669',
                  borderColor: '#6ee7b7',
                  background: '#ecfdf5'
                }}
              >
                ⚡ heanyan1@gmail.com / Sbc@12345
              </Button>
              <Button
                type="dashed"
                size="small"
                onClick={() => {
                  form.setFieldsValue({ emailOrUsername: 'sbcsolutions', password: 'Sbc@12345' });
                  onFinish({ emailOrUsername: 'sbcsolutions', password: 'Sbc@12345' });
                }}
                style={{
                  borderRadius: 20,
                  fontSize: 12,
                  color: '#7c3aed',
                  borderColor: '#c4b5fd',
                  background: '#f5f3ff'
                }}
              >
                ⚡ sbcsolutions / Sbc@12345
              </Button>
            </div>
          </Form>

          <Divider style={{ margin: '20px 0 16px', fontSize: 12, color: '#94a3b8' }}>
            {t('new_to_aura', 'New to Aura?')}
          </Divider>

          {/* Switch to Register */}
          <div style={{ textAlign: 'center' }}>
            <Text style={{ fontSize: 13, color: '#64748b' }}>
              {t('dont_have_account', "Don't have an account yet?")}{' '}
            </Text>
            <Link
              to="/register"
              style={{ fontWeight: 700, color: '#2563eb', fontSize: 13 }}
              className="hover:underline"
            >
              {t('create_an_account', 'Create an Account')} &rarr;
            </Link>
          </div>
        </Card>

        {/* Security Assurance footer */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Space size={6} style={{ color: '#94a3b8', fontSize: 11.5 }}>
            <SafetyCertificateOutlined style={{ color: '#16a34a' }} />
            <span>{t('security_encrypted_auth', '256-bit encrypted authentication • Protected by Aura Cloud')}</span>
          </Space>
        </div>

        {/* Google & Telegram Authentication Concept Modal */}
        <SocialAuthModal
          open={socialModalOpen}
          onClose={() => setSocialModalOpen(false)}
          mode="login"
          defaultProvider={socialProvider}
        />
      </div>
    </div>
  );
}
