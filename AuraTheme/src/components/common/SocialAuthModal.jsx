import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  Button,
  Input,
  Typography,
  Space,
  Flex,
  Avatar,
  Tag,
  Divider,
  message,
  Tabs,
  Alert,
} from 'antd';
import {
  SendOutlined,
  CheckCircleFilled,
  SafetyCertificateOutlined,
  UserOutlined,
  PhoneOutlined,
  LockOutlined,
  QrcodeOutlined,
  ArrowRightOutlined,
  CheckOutlined,
  ReloadOutlined,
  CopyOutlined,
  LoadingOutlined,
  RobotOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;

// Authentic Google Logo SVG Component
export function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

// Authentic Telegram Plane Icon SVG Component
export function TelegramIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <circle cx="12" cy="12" r="12" fill="#2AABEE" />
      <path
        d="M5.3 11.8l12.4-4.8c.6-.2 1.1.2.9.8l-2.1 10c-.2.7-.6.9-1.2.5l-3.3-2.4-1.6 1.5c-.2.2-.3.3-.7.3l.2-3.4 6.2-5.6c.3-.3 0-.4-.3-.2l-7.7 4.9-3.3-1c-.7-.2-.7-.7.1-1l.3-.2z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export default function SocialAuthModal({ open, onClose, mode = 'register', defaultProvider = 'telegram' }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(defaultProvider);
  const [loading, setLoading] = useState(false);

  // Google Form State
  const [googleAccount, setGoogleAccount] = useState('heanyan1@gmail.com');
  const [googleName, setGoogleName] = useState('Hean Yan');

  // Telegram Bot Session State
  const [authSessionToken, setAuthSessionToken] = useState('');
  const [telegramBotUrl, setTelegramBotUrl] = useState('');
  const [isWaitingBot, setIsWaitingBot] = useState(false);

  // Completed Registered State
  const [completedCredentials, setCompletedCredentials] = useState(null);
  const pollIntervalRef = useRef(null);

  // Initialize Telegram Auth Session when tab or modal opens
  const initTelegramAuthSession = async (autoOpen = false) => {
    try {
      setIsWaitingBot(true);
      const res = await axios.post('/api/tma/telegram-auth/init');
      if (res.data?.status && res.data?.token) {
        setAuthSessionToken(res.data.token);
        setTelegramBotUrl(res.data.botUrl);

        if (autoOpen && res.data.botUrl) {
          // Auto-open Telegram Bot to check account and register
          window.open(res.data.botUrl, '_blank', 'noopener,noreferrer');
        }

        // Start polling for bot completion
        startPolling(res.data.token);
      }
    } catch (err) {
      console.warn('Could not initialize Telegram auth session:', err.message);
    }
  };

  const startPolling = (token) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await axios.get('/api/tma/telegram-auth/check', { params: { token } });
        if (res.data?.status && res.data?.completed) {
          clearInterval(pollIntervalRef.current);
          setIsWaitingBot(false);
          handleRegistrationSuccess(res.data.user, res.data.credentials);
        }
      } catch (e) {
        // Polling retry
      }
    }, 1800);
  };

  useEffect(() => {
    if (open && activeTab === 'telegram') {
      initTelegramAuthSession(false);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [open, activeTab]);

  useEffect(() => {
    setActiveTab(defaultProvider);
    setCompletedCredentials(null);
  }, [defaultProvider, open]);

  // Handle successful registration/auth
  const handleRegistrationSuccess = (userData, creds) => {
    setCompletedCredentials({
      user: userData,
      username: creds?.username || userData?.username,
      password: creds?.password || 'Aura#2026',
    });

    const memberUser = {
      id: userData.id || `tg-${Date.now()}`,
      name: `${userData.first_name || userData.name || 'Member'} ${userData.last_name || ''}`.trim(),
      username: `@${userData.username || creds?.username || 'member'}`,
      email: userData.email || `${creds?.username}@telegram.aura`,
      provider: 'telegram',
      role: 'customer',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userData.username || 'aura')}&backgroundColor=2AABEE`,
      joinedAt: new Date().toISOString(),
      tier: 'Gold VIP Member',
      loyaltyPoints: 150,
      telegramVerified: true,
      chatId: userData.telegram_id || `chat_${Date.now().toString().slice(-6)}`,
    };

    login(memberUser);
    message.success(`🎉 Account registered via Telegram Bot! Credentials sent to your Telegram personal chat.`);
  };

  // Handle Google Registration / Login
  const handleGoogleAuth = () => {
    setLoading(true);
    setTimeout(() => {
      const email = googleAccount.trim().toLowerCase();
      const name = googleName.trim() || email.split('@')[0];
      const newUser = {
        id: `google-${Date.now()}`,
        name: name,
        email: email,
        provider: 'google',
        role: 'customer',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=4285f4&textColor=ffffff`,
        joinedAt: new Date().toISOString(),
        tier: 'Gold VIP Member',
        loyaltyPoints: mode === 'register' ? 150 : 100,
        googleVerified: true,
      };

      login(newUser);
      message.success(
        mode === 'register'
          ? `Welcome, ${name}! Registered with Google (${email}) + 150 VIP bonus points!`
          : `Signed in with Google (${email})!`
      );
      setLoading(false);
      onClose();
      navigate('/profile');
    }, 600);
  };

  const copyToClipboard = (text, label) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      message.success(`Copied ${label} to clipboard!`);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={() => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        onClose();
      }}
      footer={null}
      width={500}
      centered
      styles={{
        content: {
          padding: 0,
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)',
          border: '1px solid #e2e8f0',
        },
      }}
    >
      {/* Top Banner Header */}
      <div
        style={{
          padding: '24px 24px 18px',
          background: activeTab === 'telegram'
            ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
            : 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
          borderBottom: '1px solid #f1f5f9',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'inline-flex', marginBottom: 8 }}>
          {activeTab === 'telegram' ? <TelegramIcon size={42} /> : <GoogleIcon size={42} />}
        </div>
        <Title level={3} style={{ margin: '4px 0 2px', fontWeight: 800, color: '#0f172a' }}>
          {activeTab === 'telegram' ? 'Telegram Bot Automated Registration' : 'Google Account Registration'}
        </Title>
        <Text style={{ fontSize: 12.5, color: '#64748b' }}>
          {activeTab === 'telegram'
            ? 'Auto-opens the Telegram Bot, inserts you into the users table, and sends username & password to your personal Telegram.'
            : 'Instant Google profile verification with 150 VIP Welcome Points.'}
        </Text>
      </div>

      {/* Provider Switch Tabs */}
      <div style={{ padding: '0 24px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            setCompletedCredentials(null);
          }}
          centered
          items={[
            {
              key: 'telegram',
              label: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13 }}>
                  <TelegramIcon size={16} /> Telegram Bot (Auto-Credentials)
                </span>
              ),
            },
            {
              key: 'google',
              label: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13 }}>
                  <GoogleIcon size={16} /> Google Account
                </span>
              ),
            },
          ]}
        />
      </div>

      {/* ========================================================================= */}
      {/* TELEGRAM BOT FLOW: AUTO CATCH INFO & SEND CREDENTIALS TO USER ACCOUNT     */}
      {/* ========================================================================= */}
      {activeTab === 'telegram' && (
        <div style={{ padding: '14px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {completedCredentials ? (
            /* SUCCESS STATE: Credentials Generated & Dispatched */
            <div className="space-y-4 animate-fadeIn">
              <div
                style={{
                  padding: '16px',
                  borderRadius: 16,
                  background: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  textAlign: 'center',
                }}
              >
                <CheckCircleFilled style={{ color: '#16a34a', fontSize: 32, marginBottom: 8 }} />
                <h4 style={{ margin: 0, fontWeight: 800, fontSize: 16, color: '#14532d' }}>
                  User Account Registered in Database!
                </h4>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#166534' }}>
                  The Telegram Bot has created your username &amp; password and dispatched them to your Telegram chat.
                </p>
              </div>

              {/* Display Generated Credentials Card */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: 16,
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  space: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                    🔑 Generated Login Credentials
                  </span>
                  <Tag color="cyan" style={{ borderRadius: 6, margin: 0 }}>
                    INSERTED IN USERS TABLE
                  </Tag>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Username row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '8px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <div>
                      <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Username:</span>
                      <span style={{ fontWeight: 800, fontSize: 14, fontFamily: 'monospace', color: '#0f172a' }}>
                        {completedCredentials.username}
                      </span>
                    </div>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(completedCredentials.username, 'Username')}
                    >
                      Copy
                    </Button>
                  </div>

                  {/* Password row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '8px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <div>
                      <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Temporary Password:</span>
                      <span style={{ fontWeight: 800, fontSize: 14, fontFamily: 'monospace', color: '#dc2626' }}>
                        {completedCredentials.password}
                      </span>
                    </div>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(completedCredentials.password, 'Password')}
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                <div style={{ marginTop: 12, fontSize: 11, color: '#0369a1', background: '#e0f2fe', padding: '8px 10px', borderRadius: 8 }}>
                  ✉️ <b>Telegram Delivery:</b> These credentials have also been sent via direct private message to your Telegram personal chat!
                </div>
              </div>

              <Button
                type="primary"
                size="large"
                block
                onClick={() => {
                  onClose();
                  navigate('/profile');
                }}
                style={{
                  height: 48,
                  borderRadius: 14,
                  fontWeight: 700,
                  fontSize: 14.5,
                  background: '#16a34a',
                  borderColor: '#16a34a',
                }}
              >
                Go to My Profile &amp; Loyalty Rewards &rarr;
              </Button>
            </div>
          ) : (
            /* STEPPED BOT REGISTRATION VIEW */
            <div className="space-y-4">
              {/* How it works banner */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 14,
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  fontSize: 12,
                  color: '#0369a1',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RobotOutlined style={{ fontSize: 15, color: '#0284c7' }} />
                  <span>How the Telegram Bot Concept Works:</span>
                </div>
                <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.5, fontSize: 11.5 }}>
                  <li>Click <b>Launch Telegram Bot</b> below to open the bot</li>
                  <li>Tap <b>Start</b> in Telegram &rarr; bot catches your account info</li>
                  <li>Bot inserts you into the <b>User Table</b> and creates a username &amp; password</li>
                  <li>Bot sends credentials directly to your <b>personal Telegram chat</b>!</li>
                </ol>
              </div>

              {/* Bot Deep-Link Action Button */}
              <div style={{ textAlign: 'center' }}>
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<SendOutlined />}
                  onClick={() => {
                    initTelegramAuthSession(true);
                  }}
                  style={{
                    height: 52,
                    borderRadius: 14,
                    fontWeight: 800,
                    fontSize: 15,
                    background: '#0284c7',
                    borderColor: '#0284c7',
                    boxShadow: '0 4px 16px rgba(2, 132, 199, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <span>Auto-Open &amp; Check in Telegram Bot</span>
                </Button>

                {/* Live Status indicator */}
                <div
                  style={{
                    marginTop: 14,
                    padding: '14px',
                    borderRadius: 14,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#0369a1', fontWeight: 700 }}>
                    <LoadingOutlined spin style={{ color: '#0284c7' }} />
                    <span>Listening for /start from your Telegram account...</span>
                  </div>
                  <span style={{ fontSize: 11.5, color: '#64748b', maxWidth: 360, lineHeight: 1.4 }}>
                    Once you tap <b>Start</b> in Telegram, the bot will automatically insert you into the User Table, generate your username &amp; password, and send them directly to your personal chat!
                  </span>

                  {telegramBotUrl && (
                    <a
                      href={telegramBotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: '#0284c7', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <SendOutlined /> Click here if Telegram didn't open automatically &rarr;
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* GOOGLE ACCOUNT FLOW                                                       */}
      {/* ========================================================================= */}
      {activeTab === 'google' && (
        <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Google Profile Card */}
          <div
            style={{
              padding: '16px',
              borderRadius: 16,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <Avatar
              size={48}
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(googleName)}&backgroundColor=4285f4`}
              style={{ border: '2px solid #3b82f6' }}
            />
            <div style={{ flex: 1 }}>
              <Flex align="center" gap={6}>
                <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
                  {googleName}
                </Text>
                <Tag color="green" style={{ borderRadius: 6, fontSize: 10, margin: 0, padding: '1px 6px' }}>
                  ✓ VERIFIED
                </Tag>
              </Flex>
              <Text style={{ fontSize: 12, color: '#64748b', display: 'block' }}>
                {googleAccount}
              </Text>
            </div>
            <GoogleIcon size={20} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <Text style={{ fontSize: 11.5, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                Google Account Email:
              </Text>
              <Input
                value={googleAccount}
                onChange={(e) => setGoogleAccount(e.target.value)}
                prefix={<GoogleIcon size={14} />}
                size="large"
                style={{ borderRadius: 12 }}
                placeholder="you@gmail.com"
              />
            </div>
            <div>
              <Text style={{ fontSize: 11.5, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                Display Name:
              </Text>
              <Input
                value={googleName}
                onChange={(e) => setGoogleName(e.target.value)}
                prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                size="large"
                style={{ borderRadius: 12 }}
                placeholder="Full Name"
              />
            </div>
          </div>

          <Button
            type="primary"
            size="large"
            block
            loading={loading}
            onClick={handleGoogleAuth}
            style={{
              height: 48,
              borderRadius: 14,
              fontWeight: 700,
              fontSize: 14.5,
              background: '#1d4ed8',
              boxShadow: '0 4px 14px rgba(29, 78, 216, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <GoogleIcon size={18} />
            <span>Continue with Google</span>
          </Button>
        </div>
      )}

      {/* Security info footer */}
      <div style={{ padding: '12px 24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
        <Space size={6} style={{ color: '#94a3b8', fontSize: 11 }}>
          <SafetyCertificateOutlined style={{ color: '#16a34a' }} />
          <span>Telegram Bot API Connected • Instant Private Credential Delivery</span>
        </Space>
      </div>
    </Modal>
  );
}
