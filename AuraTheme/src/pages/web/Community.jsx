import React from 'react';
import { Button, Card, Col, Row, Space, Tag, Typography } from 'antd';
import {
  CustomerServiceOutlined,
  MessageOutlined,
  SafetyCertificateOutlined,
  SolutionOutlined,
} from '@ant-design/icons';
import { publicTheme } from '../../utils/webTheme';

const { Paragraph, Text, Title } = Typography;

const supportBlocks = [
  {
    title: 'Website support',
    icon: <CustomerServiceOutlined />,
    text: 'Get help with orders, login, account settings, payments, and website usage.',
  },
  {
    title: 'Seller onboarding help',
    icon: <SolutionOutlined />,
    text: 'Support new shops with setup guidance, listing rules, and first-order preparation.',
  },
  {
    title: 'Trust and safety',
    icon: <SafetyCertificateOutlined />,
    text: 'Review service policies, issue resolution flow, and support standards for the platform.',
  },
];

const channels = [
  { title: 'Live chat support', text: 'Fast support for urgent questions during working hours.' },
  { title: 'Email support desk', text: 'Share documents, screenshots, and account questions with the team.' },
  { title: 'Seller help center', text: 'Guides for shop management, products, shipping, and service.' },
];

const Community = () => (
  <div style={{ padding: 0 }}>
    <Card
      className="frosted-panel stagger-rise"
      style={{
        borderRadius: 32,
        border: `1px solid ${publicTheme.border}`,
        boxShadow: publicTheme.shadow,
        background: publicTheme.heroBackground,
        marginBottom: 24,
      }}
      styles={{ body: { padding: 28 } }}
    >
      <Row gutter={[24, 24]} align="middle">
        <Col xs={24} lg={15}>
          <Space direction="vertical" size={16}>
            <Tag style={{ width: 'fit-content', borderRadius: 999, border: 'none', background: publicTheme.pill, color: publicTheme.primary, fontWeight: 700, padding: '8px 14px' }}>
              Service page
            </Tag>
            <Title level={1} style={{ fontSize: 'clamp(30px, 4vw, 50px)', margin: 0, color: publicTheme.text, lineHeight: 1.06 }}>
              Support for your website, shops, products, and customers.
            </Title>
            <Paragraph style={{ margin: 0, color: publicTheme.subtext, fontSize: 16, maxWidth: 760 }}>
              This page now works as your website support center. It helps customers and sellers find support channels, onboarding help, and platform guidance without mixing that content with product shopping.
            </Paragraph>
          </Space>
        </Col>

        <Col xs={24} lg={9}>
          <div
            style={{
              borderRadius: 28,
              padding: 22,
              background: 'linear-gradient(160deg, #1c2333 0%, #2f6fed 100%)',
            }}
          >
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <MessageOutlined style={{ color: '#b7efe3', fontSize: 22 }} />
              <Title level={3} style={{ margin: 0, color: 'white' }}>
                Need help right now?
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.78)' }}>
                Contact support for shop issues, product questions, account access, or website guidance.
              </Text>
              <Button style={{ height: 44, borderRadius: 16, background: '#ffffff', color: publicTheme.primary, border: 'none', fontWeight: 700 }}>
                Contact support
              </Button>
            </Space>
          </div>
        </Col>
      </Row>
    </Card>

    <Row gutter={[18, 18]} style={{ marginBottom: 24 }}>
      {supportBlocks.map((item) => (
        <Col xs={24} md={8} key={item.title}>
          <Card
            style={{
              height: '100%',
              borderRadius: 26,
              border: `1px solid ${publicTheme.border}`,
              background: publicTheme.cardBackground,
              boxShadow: publicTheme.lightShadow,
            }}
            styles={{ body: { padding: 22 } }}
          >
            <Space direction="vertical" size={14}>
              <div style={{ color: publicTheme.primary, fontSize: 22 }}>{item.icon}</div>
              <Title level={4} style={{ margin: 0, color: publicTheme.text }}>
                {item.title}
              </Title>
              <Paragraph style={{ margin: 0, color: publicTheme.subtext }}>
                {item.text}
              </Paragraph>
            </Space>
          </Card>
        </Col>
      ))}
    </Row>

    <Card
      style={{
        borderRadius: 30,
        border: `1px solid ${publicTheme.border}`,
        background: publicTheme.cardBackground,
        boxShadow: publicTheme.lightShadow,
      }}
      styles={{ body: { padding: 24 } }}
    >
      <Title level={3} style={{ marginTop: 0, color: publicTheme.text }}>
        Support channels
      </Title>
      <Row gutter={[18, 18]}>
        {channels.map((item) => (
          <Col xs={24} md={8} key={item.title}>
            <div
              style={{
                borderRadius: 22,
                padding: 18,
                background: publicTheme.cardMuted,
                border: `1px solid ${publicTheme.softBorder}`,
                height: '100%',
              }}
            >
              <Text strong style={{ display: 'block', color: publicTheme.text, marginBottom: 8 }}>
                {item.title}
              </Text>
              <Text style={{ color: publicTheme.subtext }}>
                {item.text}
              </Text>
            </div>
          </Col>
        ))}
      </Row>
    </Card>
  </div>
);

export default Community;
