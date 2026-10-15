import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Typography, 
  message,
  Flex,
  theme,
  Tabs
} from 'antd';
import { 
  MailOutlined, 
  LockOutlined,
  GoogleCircleFilled,
  FacebookFilled,
  TwitterCircleFilled
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Link } = Typography;
const { TabPane } = Tabs;
const { useToken } = theme;

const MinimalistFloatingLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { token } = useToken();
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('1');

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Login values:', values);
      message.success('Login successful!');
      navigate('/admin/dashboard');
    } catch (error) {
      message.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: token.colorBgLayout,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.05,
        background: `radial-gradient(circle at 20% 80%, ${token.colorPrimary} 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, #1890ff 0%, transparent 50%)`
      }}></div>

      {/* Floating Card */}
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: token.colorBgContainer,
        borderRadius: 24,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
        padding: 48,
        position: 'relative',
        zIndex: 1,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${token.colorBorderSecondary}`
      }}>
        {/* Logo */}
        <Flex vertical align="center" gap={16} style={{ marginBottom: 40 }}>
          <div style={{
            width: 72,
            height: 72,
            background: `linear-gradient(135deg, ${token.colorPrimary} 0%, #1890ff 100%)`,
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 28,
            fontWeight: 'bold',
            boxShadow: `0 8px 24px ${token.colorPrimary}40`
          }}>
            G
          </div>
          <Title level={3} style={{ margin: 0 }}>
            GLOO Admin
          </Title>
          <Text type="secondary">
            Secure Admin Portal
          </Text>
        </Flex>

        {/* Login Form */}
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: token.colorTextSecondary }} />}
              placeholder="admin@example.com"
              style={{
                borderRadius: 12,
                height: 52,
                background: token.colorFillAlter,
                border: 'none',
                paddingLeft: 16
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: token.colorTextSecondary }} />}
              placeholder="••••••••"
              style={{
                borderRadius: 12,
                height: 52,
                background: token.colorFillAlter,
                border: 'none',
                paddingLeft: 16
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{
                height: 52,
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 500,
                background: `linear-gradient(135deg, ${token.colorPrimary} 0%, #1890ff 100%)`,
                border: 'none',
                boxShadow: `0 4px 16px ${token.colorPrimary}40`
              }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link href="#" style={{ fontSize: 14 }}>
            Trouble signing in?
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MinimalistFloatingLogin;