import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Typography, 
  Divider, 
  Space, 
  Checkbox, 
  message,
  Flex,
  theme
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  EyeInvisibleOutlined, 
  EyeTwoTone,
  GoogleOutlined,
  GithubOutlined,
  TwitterOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Link } = Typography;
const { useToken } = theme;

const ModernCardLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { token } = useToken();
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Simulate API call
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
      background: `linear-gradient(135deg, ${token.colorPrimary} 0%, #1890ff 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          border: 'none',
          overflow: 'hidden'
        }}
        styles={{ body: { padding: 40 } }}
      >
        {/* Logo Header */}
        <Flex vertical align="center" gap={8} style={{ marginBottom: 32 }}>
          <div style={{
            width: 64,
            height: 64,
            background: token.colorPrimary,
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: 8
          }}>
            G
          </div>
          <Title level={3} style={{ margin: 0, color: token.colorTextHeading }}>
            Welcome Back
          </Title>
          <Text type="secondary">
            Sign in to your GLOO Admin account
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
          >
            <Input
              prefix={<UserOutlined style={{ color: token.colorTextSecondary }} />}
              placeholder="Username or Email"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: token.colorTextSecondary }} />}
              placeholder="Password"
              iconRender={(visible) => 
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Remember me</Checkbox>
            </Form.Item>
            <Link href="#" style={{ fontSize: 14 }}>
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
              style={{
                height: 48,
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 500
              }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>Or continue with</Divider>

        {/* Social Login */}
        <Space size="middle" style={{ width: '100%', justifyContent: 'center' }}>
          <Button 
            icon={<GoogleOutlined />} 
            style={{ width: 48, height: 48, borderRadius: '50%' }}
          />
          <Button 
            icon={<GithubOutlined />} 
            style={{ width: 48, height: 48, borderRadius: '50%' }}
          />
          <Button 
            icon={<TwitterOutlined />} 
            style={{ width: 48, height: 48, borderRadius: '50%' }}
          />
        </Space>

        {/* Footer */}
        <Flex justify="center" style={{ marginTop: 32 }}>
          <Text type="secondary">
            Don't have an account?{' '}
            <Link href="#" strong>Sign up</Link>
          </Text>
        </Flex>
      </Card>
    </div>
  );
};

export default ModernCardLogin;