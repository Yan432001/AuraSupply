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
  Tag,
  Flex,
  Select,
  message,
  Alert,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  CheckCircleFilled,
  SafetyCertificateOutlined,
  GiftOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuraLogo from '../../components/common/AuraLogo';
import SocialAuthModal, { GoogleIcon, TelegramIcon } from '../../components/common/SocialAuthModal';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function Register() {
  const [form] = Form.useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [socialProvider, setSocialProvider] = useState('google');

  const onFinish = (values) => {
    setLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      const newUser = {
        id: `user-${Date.now()}`,
        name: values.fullName.trim(),
        email: values.email.toLowerCase().trim(),
        phone: values.phone?.trim() || '',
        memberType: values.memberType || 'customer',
        role: 'customer',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        joinedAt: new Date().toISOString(),
        tier: 'Bronze VIP Member',
        loyaltyPoints: 100, // Welcome bonus points!
      };

      // Store in registered users catalog
      try {
        const existing = JSON.parse(localStorage.getItem('aura_registered_members') || '[]');
        existing.push(newUser);
        localStorage.setItem('aura_registered_members', JSON.stringify(existing));
      } catch {}

      // Log user in
      login(newUser);
      message.success(`Welcome to Aura Supply, ${newUser.name}! You received 100 welcome reward points! 🎉`);
      setLoading(false);
      navigate('/profile');
    }, 650);
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 16px',
        background: 'radial-gradient(circle at 90% 10%, rgba(47, 111, 237, 0.12), transparent 45%), radial-gradient(circle at 10% 90%, rgba(255, 122, 61, 0.12), transparent 45%), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 500 }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', marginBottom: 12 }}>
            <AuraLogo size={42} showText={true} textColor="#0f172a" />
          </div>
          <Title level={2} style={{ margin: '8px 0 4px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
            Create Your Account
          </Title>
          <Text style={{ color: '#64748b', fontSize: 13.5 }}>
            Join Aura Supply for exclusive store rewards, table ordering &amp; order history.
          </Text>
        </div>

        {/* Register Card */}
        <Card
          style={{
            borderRadius: 24,
            boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.12), 0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(16px)',
          }}
          styles={{ body: { padding: '32px 30px' } }}
        >
          {/* Welcome Perks Banner */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, #eff6ff 0%, #fef3c7 100%)',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 18,
            }}
          >
            <div style={{ fontSize: 20 }}>🎁</div>
            <div style={{ fontSize: 11.5, color: '#1e3a8a' }}>
              <b>Member Perk:</b> Get <b>100 instant loyalty points</b> on registration for your next cafe or bakery visit!
            </div>
          </div>

          {/* Social 1-Tap Registration Concept (Google & Telegram) */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>
              1-Tap Instant Registration:
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
            Or register with email
          </Divider>

          {errorMsg && (
            <Alert message={errorMsg} type="error" showIcon style={{ marginBottom: 18, borderRadius: 10 }} />
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ memberType: 'customer', agreeTerms: true }}
            requiredMark={false}
          >
            <Form.Item
              name="fullName"
              label={<span style={{ fontWeight: 600, fontSize: 13 }}>Full Name</span>}
              rules={[{ required: true, message: 'Please enter your full name' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#94a3b8', marginRight: 6 }} />}
                placeholder="e.g. Sokha Rith"
                size="large"
                style={{ borderRadius: 12, height: 46 }}
              />
            </Form.Item>

            <Form.Item
              name="email"
              label={<span style={{ fontWeight: 600, fontSize: 13 }}>Email Address</span>}
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email address' },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: '#94a3b8', marginRight: 6 }} />}
                placeholder="sokha@example.com"
                size="large"
                style={{ borderRadius: 12, height: 46 }}
              />
            </Form.Item>

            <Form.Item
              name="phone"
              label={<span style={{ fontWeight: 600, fontSize: 13 }}>Phone / Telegram Number</span>}
            >
              <Input
                prefix={<PhoneOutlined style={{ color: '#94a3b8', marginRight: 6 }} />}
                placeholder="+855 12 345 678"
                size="large"
                style={{ borderRadius: 12, height: 46 }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span style={{ fontWeight: 600, fontSize: 13 }}>Password</span>}
              rules={[
                { required: true, message: 'Please create a password' },
                { min: 6, message: 'Password must be at least 6 characters' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#94a3b8', marginRight: 6 }} />}
                placeholder="At least 6 characters"
                size="large"
                style={{ borderRadius: 12, height: 46 }}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label={<span style={{ fontWeight: 600, fontSize: 13 }}>Confirm Password</span>}
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('The two passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#94a3b8', marginRight: 6 }} />}
                placeholder="Repeat password"
                size="large"
                style={{ borderRadius: 12, height: 46 }}
              />
            </Form.Item>

            <Form.Item
              name="memberType"
              label={<span style={{ fontWeight: 600, fontSize: 13 }}>Membership Type</span>}
            >
              <Select size="large" style={{ borderRadius: 12 }}>
                <Option value="customer">🛍️ Dining &amp; Retail Customer</Option>
                <Option value="b2b">🏪 Business / Wholesale Partner</Option>
                <Option value="enthusiast">☕ Specialty Coffee Club Member</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="agreeTerms"
              valuePropName="checked"
              rules={[
                {
                  validator: (_, value) =>
                    value ? Promise.resolve() : Promise.reject(new Error('Please agree to terms & conditions')),
                },
              ]}
              style={{ marginBottom: 22 }}
            >
              <Checkbox style={{ fontSize: 12.5, color: '#64748b' }}>
                I agree to the <a href="#terms" onClick={(e) => { e.preventDefault(); message.info('Aura Global terms apply.'); }}>Terms of Service</a> and <a href="#privacy" onClick={(e) => { e.preventDefault(); message.info('Aura Global privacy policy.'); }}>Privacy Policy</a>.
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
                Create Member Account
              </Button>
            </Form.Item>
          </Form>

          <Divider style={{ margin: '20px 0 16px', fontSize: 12, color: '#94a3b8' }}>
            Already Registered?
          </Divider>

          {/* Switch to Login */}
          <div style={{ textAlign: 'center' }}>
            <Text style={{ fontSize: 13, color: '#64748b' }}>
              Already have an Aura account?{' '}
            </Text>
            <Link
              to="/login"
              style={{ fontWeight: 700, color: '#2563eb', fontSize: 13 }}
              className="hover:underline"
            >
              Sign In Instead &rarr;
            </Link>
          </div>
        </Card>

        {/* Security Assurance footer */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Space size={6} style={{ color: '#94a3b8', fontSize: 11.5 }}>
            <SafetyCertificateOutlined style={{ color: '#16a34a' }} />
            <span>Encrypted Member Profile • Powered by Aura Global ERP</span>
          </Space>
        </div>

        {/* Google & Telegram Registration Concept Modal */}
        <SocialAuthModal
          open={socialModalOpen}
          onClose={() => setSocialModalOpen(false)}
          mode="register"
          defaultProvider={socialProvider}
        />
      </div>
    </div>
  );
}
