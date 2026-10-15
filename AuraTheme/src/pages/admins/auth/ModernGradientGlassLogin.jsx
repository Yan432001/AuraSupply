import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Typography, 
  Checkbox, 
  message,
  Flex,
  theme,
  Divider,
  Space
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined,
  EyeInvisibleOutlined, 
  EyeTwoTone,
  ArrowRightOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Link } = Typography;
const { useToken } = theme;

const GradientGlassLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { token } = useToken();
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Login values:', values);
      message.success('Welcome back! Redirecting...');
      navigate('/admin/dashboard');
    } catch (error) {
      message.error('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(45deg, 
        ${token.colorPrimary} 0%, 
        #1890ff 25%, 
        #36cfc9 50%, 
        #73d13d 75%, 
        #ff7a45 100%)`,
      backgroundSize: '400% 400%',
      animation: 'gradient 15s ease infinite',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .glass-effect {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}</style>

      {/* Floating Elements */}
      <div style={{
        position: 'absolute',
        width: 300,
        height: 300,
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        top: '10%',
        left: '10%',
        filter: 'blur(40px)'
      }}></div>
      <div style={{
        position: 'absolute',
        width: 200,
        height: 200,
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        bottom: '10%',
        right: '10%',
        filter: 'blur(40px)'
      }}></div>

      {/* Main Card */}
      <div style={{
        width: '100%',
        maxWidth: 480,
        padding: 48,
        borderRadius: 32,
        position: 'relative',
        zIndex: 1,
        overflow: 'hidden'
      }} className="glass-effect">
        
        {/* Logo & Header */}
        <Flex vertical align="center" gap={20} style={{ marginBottom: 40 }}>
          <div style={{
            width: 80,
            height: 80,
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <div style={{
              width: 56,
              height: 56,
              background: 'white',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: token.colorPrimary,
              fontSize: 24,
              fontWeight: 'bold'
            }}>
              G
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Title level={2} style={{ color: 'white', margin: 0 }}>
              GLOO Admin
            </Title>
            <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 16 }}>
              Secure Management Console
            </Text>
          </div>
        </Flex>

        {/* Security Indicator */}
        <Flex justify="center" align="center" gap={8} style={{ 
          marginBottom: 32,
          padding: '12px 24px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <SafetyCertificateOutlined style={{ color: '#52c41a' }} />
          <Text style={{ color: 'white' }}>
            SSL Secured • Two-Factor Ready
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
            name="username"
            rules={[{ required: true, message: 'Please input your username!' }]}
            style={{ marginBottom: 24 }}
          >
            <Input
              prefix={<UserOutlined style={{ color: 'rgba(255, 255, 255, 0.6)' }} />}
              placeholder="Username"
              style={{
                borderRadius: 12,
                height: 52,
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                paddingLeft: 16
              }}
              className="glass-effect"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
            style={{ marginBottom: 24 }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'rgba(255, 255, 255, 0.6)' }} />}
              placeholder="Password"
              iconRender={(visible) => 
                visible ? 
                <EyeTwoTone style={{ color: 'rgba(255, 255, 255, 0.6)' }} /> : 
                <EyeInvisibleOutlined style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
              }
              style={{
                borderRadius: 12,
                height: 52,
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                paddingLeft: 16
              }}
              className="glass-effect"
            />
          </Form.Item>

          <Flex justify="space-between" align="center" style={{ marginBottom: 32 }}>
            <Checkbox style={{ color: 'white' }}>Remember me</Checkbox>
            <Link style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Forgot password?
            </Link>
          </Flex>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              icon={<ArrowRightOutlined />}
              iconPosition="end"
              style={{
                height: 52,
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 500,
                background: 'white',
                border: 'none',
                color: token.colorPrimary
              }}
            >
              Sign In to Dashboard
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.2)', margin: '32px 0' }}>
          <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Admin Access Only</Text>
        </Divider>

        <Flex justify="center">
          <Text style={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center' }}>
            Restricted area. Unauthorized access is prohibited.
            <br />
            <Text style={{ color: 'white', fontSize: 12 }}>v2.5.1 • © 2025 GLOO Admin</Text>
          </Text>
        </Flex>
      </div>
    </div>
  );
};

export default GradientGlassLogin;