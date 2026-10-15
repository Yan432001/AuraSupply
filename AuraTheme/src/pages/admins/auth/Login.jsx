import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space } from 'antd';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserOutlined} from '@ant-design/icons';

const { Title } = Typography;

const Login = () => {
  const [form] = Form.useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = (values) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      login({ name: values.username, id: 'user-1' }); // Simulated user
      navigate('/');
      setLoading(false);
    }, 1000);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', background: '#F8FAFC' }}>
      <Card style={{ width: 400, borderRadius: 16, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        <Space direction="vertical" style={{ width: '100%', textAlign: 'center' }} size={24}>
          <Title level={2} style={{ margin: 0, color: '#6366F1' }}>Welcome Back 🌟</Title>
          <Title level={4} style={{ margin: 0, color: '#64748B' }}>Sign in to your Aura account</Title>
          <Form form={form} onFinish={onFinish} layout="vertical">
            <Form.Item name="username" rules={[{ required: true, message: 'Please input your username!' }]}>
              <Input placeholder="Username" prefix={<UserOutlined />} size="large" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: 'Please input your password!' }]}>
              <Input.Password placeholder="Password" size="large" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block size="large" style={{ borderRadius: 12 }}>
                Sign In
              </Button>
            </Form.Item>
          </Form>
          <div>
            {/* <Text type="secondary">Don't have an account? <Link to="/signup">Sign up</Link></Text> */}
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default Login;