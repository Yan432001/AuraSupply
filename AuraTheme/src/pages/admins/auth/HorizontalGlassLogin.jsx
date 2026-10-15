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
  Space,
  Row,
  Col
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined,
  MailOutlined,
  EyeInvisibleOutlined, 
  EyeTwoTone,
  ArrowRightOutlined,
  SafetyCertificateOutlined,
  DashboardOutlined,
  BarChartOutlined,
  TeamOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Link } = Typography;
const { useToken } = theme;

const HorizontalGlassLogin = () => {
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

  const features = [
    { icon: <DashboardOutlined />, title: 'Dashboard Analytics', color: '#1890ff' },
    { icon: <BarChartOutlined />, title: 'Advanced Reports', color: '#52c41a' },
    { icon: <TeamOutlined />, title: 'User Management', color: '#722ed1' },
    { icon: <SettingOutlined />, title: 'System Control', color: '#fa8c16' }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, 
        ${token.colorPrimary} 0%, 
        #1890ff 30%, 
        #36cfc9 70%, 
        #73d13d 100%)`,
      backgroundSize: '400% 400%',
      animation: 'gradient 15s ease infinite',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 25px 75px rgba(0, 0, 0, 0.1);
        }
        
        .feature-card {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .feature-card:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-4px);
          border-color: rgba(255, 255, 255, 0.25);
        }
        
        .form-input {
          background: rgba(255, 255, 255, 0.08) !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          color: white !important;
          transition: all 0.3s ease;
        }
        
        .form-input:hover, .form-input:focus {
          background: rgba(255, 255, 255, 0.12) !important;
          border-color: rgba(255, 255, 255, 0.3) !important;
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1) !important;
        }
        
        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.5) !important;
        }
      `}</style>

      {/* Background Elements */}
      <div style={{
        position: 'absolute',
        width: 400,
        height: 400,
        background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        top: '10%',
        left: '5%',
        filter: 'blur(60px)',
        animation: 'float 8s ease-in-out infinite'
      }}></div>
      <div style={{
        position: 'absolute',
        width: 300,
        height: 300,
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        bottom: '10%',
        right: '5%',
        filter: 'blur(40px)',
        animation: 'float 12s ease-in-out infinite reverse'
      }}></div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>

      {/* Main Horizontal Card */}
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: 1000,
        borderRadius: 32,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'row',
        minHeight: 600,
        position: 'relative',
        zIndex: 1
      }}>
        
        {/* Left Side - Logo & Features */}
        <div style={{
          flex: 1,
          padding: 60,
          background: 'linear-gradient(135deg, rgba(24, 144, 255, 0.2) 0%, rgba(82, 196, 26, 0.1) 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
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
            background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.05) 0%, transparent 50%)',
            zIndex: 0
          }}></div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Logo */}
            <Flex align="center" gap={20} style={{ marginBottom: 48 }}>
              <div style={{
                width: 80,
                height: 80,
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                borderRadius: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
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
                  fontSize: 28,
                  fontWeight: 'bold'
                }}>
                  G
                </div>
              </div>
              <div>
                <Title level={1} style={{ color: 'white', margin: 0, fontSize: 36 }}>
                  GLOO
                </Title>
                <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 18 }}>
                  Admin Dashboard
                </Text>
              </div>
            </Flex>

            {/* Welcome Text */}
            <div style={{ marginBottom: 48 }}>
              <Title level={2} style={{ color: 'white', marginBottom: 16 }}>
                Welcome Back
              </Title>
              <Text style={{ 
                color: 'rgba(255, 255, 255, 0.8)', 
                fontSize: 16,
                lineHeight: 1.6,
                display: 'block'
              }}>
                Access your complete admin dashboard with powerful tools for analytics, 
                user management, and system configuration.
              </Text>
            </div>

            {/* Feature Grid */}
            <div style={{ marginBottom: 40 }}>
              <Text strong style={{ 
                color: 'rgba(255, 255, 255, 0.9)', 
                fontSize: 14,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 20,
                display: 'block'
              }}>
                Platform Features
              </Text>
              <Row gutter={[16, 16]}>
                {features.map((feature, index) => (
                  <Col span={12} key={index}>
                    <div className="feature-card" style={{
                      padding: '16px 12px',
                      borderRadius: 12,
                      textAlign: 'center'
                    }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        background: feature.color + '30',
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px',
                        color: feature.color,
                        fontSize: 18
                      }}>
                        {feature.icon}
                      </div>
                      <Text style={{ 
                        color: 'rgba(255, 255, 255, 0.9)', 
                        fontSize: 12,
                        display: 'block'
                      }}>
                        {feature.title}
                      </Text>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          </div>

          {/* Left Footer */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Divider style={{ 
              borderColor: 'rgba(255, 255, 255, 0.2)', 
              margin: '24px 0',
              opacity: 0.5 
            }} />
            <Flex align="center" justify="space-between">
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 12 }}>
                v2.5.1 • Secure Access
              </Text>
              <SafetyCertificateOutlined style={{ color: '#52c41a' }} />
            </Flex>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div style={{
          flex: 1,
          padding: 60,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)'
        }}>
          <div style={{ width: '100%', maxWidth: 380, margin: '0 auto' }}>
            {/* Form Header */}
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <Title level={3} style={{ color: 'white', marginBottom: 8 }}>
                Sign In
              </Title>
              <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 14 }}>
                Enter your credentials to continue
              </Text>
            </div>

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
                style={{ marginBottom: 24 }}
              >
                <Input
                  prefix={<MailOutlined style={{ color: 'rgba(255, 255, 255, 0.6)' }} />}
                  placeholder="Email address"
                  className="form-input"
                  style={{
                    borderRadius: 12,
                    height: 52,
                    paddingLeft: 16
                  }}
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
                  className="form-input"
                  style={{
                    borderRadius: 12,
                    height: 52,
                    paddingLeft: 16
                  }}
                />
              </Form.Item>

              <Flex justify="space-between" align="center" style={{ marginBottom: 32 }}>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    Remember me
                  </Checkbox>
                </Form.Item>
                <Link style={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  fontSize: 14,
                  textDecoration: 'underline'
                }}>
                  Forgot password?
                </Link>
              </Flex>

              <Form.Item style={{ marginBottom: 24 }}>
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
                    color: token.colorPrimary,
                    boxShadow: '0 8px 24px rgba(24, 144, 255, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(24, 144, 255, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(24, 144, 255, 0.3)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Sign In to Dashboard
                </Button>
              </Form.Item>

              <div style={{ textAlign: 'center' }}>
                <Link style={{ 
                  color: 'rgba(255, 255, 255, 0.7)', 
                  fontSize: 14 
                }}>
                  Need help? Contact System Administrator
                </Link>
              </div>
            </Form>

            {/* Divider */}
            <Divider style={{ 
              borderColor: 'rgba(255, 255, 255, 0.2)', 
              margin: '40px 0 24px',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              Quick Access
            </Divider>

            {/* Quick Info */}
            <div style={{ textAlign: 'center' }}>
              <Text style={{ 
                color: 'rgba(255, 255, 255, 0.6)', 
                fontSize: 12,
                lineHeight: 1.5,
                display: 'block'
              }}>
                This is a restricted administrative area. All activities are logged 
                and monitored for security purposes.
                <br />
                Unauthorized access attempts will be reported.
              </Text>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Copyright */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        textAlign: 'center',
        zIndex: 2
      }}>
        <Text style={{ 
          color: 'rgba(255, 255, 255, 0.5)', 
          fontSize: 12 
        }}>
          © 2025 GLOO Admin Dashboard • All rights reserved
        </Text>
      </div>
    </div>
  );
};

export default HorizontalGlassLogin;