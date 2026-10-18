import React, { useState } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Tag,
  Button,
  Flex,
  Space,
  Input,
  Modal,
  Form,
  message,
  Avatar,
  Divider
} from 'antd';
import {
  BankOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined,
  CheckCircleFilled,
  RocketOutlined,
  TeamOutlined,
  SendOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  FileProtectOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { useTranslation } from '../../../contexts/LanguageContext';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const corporatePillars = [
  {
    icon: GlobalOutlined,
    title: 'Global Sourcing & Supply Chain',
    desc: 'Direct-trade partnerships across Southeast Asia, bonded warehousing, and multi-hub logistics dispatches.',
    stat: '21 Hubs'
  },
  {
    icon: RocketOutlined,
    title: 'Hospitality Technology & TMA',
    desc: 'Proprietary Telegram Mini App ordering system, kitchen KDS routing, and cloud POS registers.',
    stat: '99.98% Uptime'
  },
  {
    icon: SafetyCertificateOutlined,
    title: 'Quality Assurance & Compliance',
    desc: 'ISO 9001 certified procurement standards, cold-chain temperature monitoring, and full traceability.',
    stat: 'ISO 9001'
  },
  {
    icon: BankOutlined,
    title: 'Commercial B2B Financing',
    desc: 'Structured supplier credit lines, wholesale trade facilities, and seasonal inventory underwriting.',
    stat: 'Tier-1 Credit'
  }
];

const caseStudies = [
  {
    client: 'SBC Coffee Group',
    industry: 'Commercial Roastery & Retail',
    outcome: 'Automated 12-branch replenishment, cutting warehouse stockout by 92% with live Telegram E-Menu.',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=60'
  },
  {
    client: 'Aura Artisan Boulangerie',
    industry: 'Wholesale Bakery Chain',
    outcome: 'Scaled daily sourdough dispatches across 40 hospitality cafes with standardized temperature control.',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=60'
  },
  {
    client: 'Apex Logistics Corp',
    industry: 'Dry Port & Haulage Fleet',
    outcome: 'Implemented real-time GPS container waybill tracking and instant driver fuel expense reconciliation.',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=60'
  }
];

export default function CompanyProfileTemplateView() {
  const { t } = useTranslation();
  const [rfpModalOpen, setRfpModalOpen] = useState(false);
  const [rfpForm] = Form.useForm();

  const handleRfpSubmit = async () => {
    try {
      const values = await rfpForm.validateFields();
      message.success(t('rfp_submitted_success', `Thank you ${values.companyName}! Your corporate proposal request has been assigned to our enterprise solutions director.`));
      setRfpModalOpen(false);
      rfpForm.resetFields();
    } catch (_) {}
  };

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', paddingBottom: 48 }}>
      {/* 1. Corporate Hero Section */}
      <Card
        style={{
          borderRadius: 24,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0369a1 100%)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.35)',
          overflow: 'hidden',
          marginBottom: 40
        }}
        styles={{ body: { padding: '52px 40px' } }}
      >
        <Row gutter={[36, 28]} align="middle">
          <Col xs={24} md={15}>
            <Tag color="cyan" style={{ borderRadius: 20, padding: '4px 14px', fontWeight: 700, fontSize: 12, marginBottom: 16 }}>
              🏢 {t('corporate_enterprise_profile', 'AURA GROUP • CORPORATE PROFILE')}
            </Tag>
            <Title level={1} style={{ color: '#ffffff', fontWeight: 800, margin: '0 0 16px', lineHeight: 1.2 }}>
              {t('driving_enterprise_excellence', 'Driving Enterprise Excellence Across Global Supply Chains & Hospitality Infrastructure')}
            </Title>
            <Paragraph style={{ color: '#cbd5e1', fontSize: 15, lineHeight: 1.6, maxWidth: 640, marginBottom: 28 }}>
              {t('corporate_hero_desc', 'Aura Global delivers mission-critical commercial procurement, omnichannel e-menu ordering technology, and automated warehousing systems for high-growth enterprises and franchise networks.')}
            </Paragraph>

            <Space size={14} wrap>
              <Button
                type="primary"
                size="large"
                icon={<SendOutlined />}
                onClick={() => setRfpModalOpen(true)}
                style={{
                  height: 48,
                  padding: '0 28px',
                  borderRadius: 14,
                  fontWeight: 700,
                  background: '#0284c7',
                  borderColor: '#0284c7'
                }}
              >
                {t('request_corporate_proposal', 'Request Corporate Proposal')}
              </Button>
              <Button
                size="large"
                icon={<ArrowRightOutlined />}
                onClick={() => {
                  const el = document.getElementById('case-studies');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 14,
                  fontWeight: 700,
                  color: '#ffffff',
                  background: 'rgba(255, 255, 255, 0.12)',
                  borderColor: 'rgba(255, 255, 255, 0.2)'
                }}
              >
                {t('view_case_studies', 'View Case Studies')}
              </Button>
            </Space>
          </Col>

          {/* Key Enterprise Metrics */}
          <Col xs={24} md={9}>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.07)',
                borderRadius: 20,
                padding: 24,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(16px)'
              }}
            >
              <Title level={4} style={{ color: '#ffffff', margin: '0 0 16px', fontWeight: 700 }}>
                {t('enterprise_footprint', 'Enterprise Footprint')}
              </Title>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Flex justify="space-between" align="center">
                  <Text style={{ color: '#94a3b8' }}>Annual Commercial Volume</Text>
                  <Text strong style={{ color: '#f8fafc', fontSize: 16 }}>$184M+ USD</Text>
                </Flex>
                <Divider style={{ margin: '6px 0', borderColor: 'rgba(255,255,255,0.08)' }} />
                <Flex justify="space-between" align="center">
                  <Text style={{ color: '#94a3b8' }}>Active Enterprise Clients</Text>
                  <Text strong style={{ color: '#f8fafc', fontSize: 16 }}>3,840 Partners</Text>
                </Flex>
                <Divider style={{ margin: '6px 0', borderColor: 'rgba(255,255,255,0.08)' }} />
                <Flex justify="space-between" align="center">
                  <Text style={{ color: '#94a3b8' }}>Logistics Corridors</Text>
                  <Text strong style={{ color: '#f8fafc', fontSize: 16 }}>21 Regional Hubs</Text>
                </Flex>
                <Divider style={{ margin: '6px 0', borderColor: 'rgba(255,255,255,0.08)' }} />
                <Flex justify="space-between" align="center">
                  <Text style={{ color: '#94a3b8' }}>Quality Standards</Text>
                  <Tag color="cyan" style={{ margin: 0, fontWeight: 700 }}>ISO 9001:2015</Tag>
                </Flex>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 2. Core Business Solutions */}
      <div style={{ marginBottom: 44 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Tag color="blue" style={{ borderRadius: 12, fontWeight: 700 }}>SOLUTIONS & CAPABILITIES</Tag>
          <Title level={3} style={{ margin: '8px 0 6px', fontWeight: 700 }}>
            {t('integrated_corporate_solutions', 'Integrated Solutions for Modern Commercial Enterprises')}
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            {t('corporate_solutions_desc', 'Designed to solve high-volume scaling, multi-branch supply procurement, and inventory visibility.')}
          </Text>
        </div>

        <Row gutter={[20, 20]}>
          {corporatePillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <Col xs={24} sm={12} lg={6} key={idx}>
                <Card
                  hoverable
                  style={{ borderRadius: 16, height: '100%', border: '1px solid #e2e8f0' }}
                  styles={{ body: { padding: 24 } }}
                >
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 14,
                      background: 'rgba(2, 132, 199, 0.1)',
                      color: '#0284c7',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 24,
                      marginBottom: 16
                    }}
                  >
                    <Icon />
                  </div>
                  <Tag color="blue" style={{ borderRadius: 6, fontWeight: 700, marginBottom: 8 }}>
                    {p.stat}
                  </Tag>
                  <Title level={5} style={{ margin: '0 0 8px', fontWeight: 700 }}>
                    {p.title}
                  </Title>
                  <Paragraph style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                    {p.desc}
                  </Paragraph>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>

      {/* 3. Case Studies & Achievements */}
      <div id="case-studies" style={{ marginBottom: 44 }}>
        <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
          <div>
            <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
              {t('verified_case_studies', 'Client Case Studies & Proven Results')}
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {t('case_studies_desc', 'Real performance metrics achieved with leading franchise brands and logistics partners.')}
            </Text>
          </div>
          <Button type="link" onClick={() => setRfpModalOpen(true)} style={{ fontWeight: 600 }}>
            {t('submit_rfp', 'Submit RFP')} &rarr;
          </Button>
        </Flex>

        <Row gutter={[20, 20]}>
          {caseStudies.map((cs, idx) => (
            <Col xs={24} md={8} key={idx}>
              <Card
                hoverable
                cover={
                  <div style={{ height: 180, overflow: 'hidden' }}>
                    <img src={cs.image} alt={cs.client} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                }
                style={{ borderRadius: 16, overflow: 'hidden', height: '100%' }}
                styles={{ body: { padding: 20 } }}
              >
                <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 600, marginBottom: 8 }}>{cs.industry}</Tag>
                <Title level={5} style={{ margin: '0 0 8px', fontWeight: 700 }}>{cs.client}</Title>
                <Paragraph style={{ color: '#475569', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                  <CheckCircleFilled style={{ color: '#10b981', marginRight: 6 }} />
                  {cs.outcome}
                </Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* 4. Proposal / RFP Modal */}
      <Modal
        title={
          <Flex align="center" gap={10} style={{ color: '#0284c7' }}>
            <BankOutlined style={{ fontSize: 20 }} />
            <span>{t('request_corporate_proposal', 'Request Corporate Proposal (RFP)')}</span>
          </Flex>
        }
        open={rfpModalOpen}
        onOk={handleRfpSubmit}
        onCancel={() => setRfpModalOpen(false)}
        okText={t('submit_rfp_button', 'Submit Proposal Request')}
        destroyOnClose
      >
        <Form form={rfpForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="companyName"
            label={t('corporate_name', 'Company / Organization Name')}
            rules={[{ required: true, message: 'Please enter company name' }]}
          >
            <Input placeholder="e.g. Acme Hospitality International" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="contactPerson"
                label={t('contact_person', 'Contact Name')}
                rules={[{ required: true, message: 'Contact name required' }]}
              >
                <Input placeholder="e.g. Jane Smith" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label={t('email', 'Corporate Email')}
                rules={[{ required: true, type: 'email', message: 'Valid email required' }]}
              >
                <Input placeholder="procurement@acme.com" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="projectScope"
            label={t('project_scope', 'Scope of Requirements & Annual Volume')}
            rules={[{ required: true, message: 'Please describe your requirements' }]}
          >
            <TextArea rows={3} placeholder="Describe store locations, equipment needs, or monthly volume..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
