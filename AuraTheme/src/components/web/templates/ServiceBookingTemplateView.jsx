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
  Select,
  DatePicker,
  Radio,
  Divider,
  Rate
} from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SolutionOutlined,
  VideoCameraOutlined,
  TeamOutlined,
  SendOutlined,
  ThunderboltOutlined,
  StarFilled,
  CustomerServiceOutlined
} from '@ant-design/icons';
import { useTranslation } from '../../../contexts/LanguageContext';

const { Title, Text, Paragraph } = Typography;

const serviceOfferings = [
  {
    id: 'srv-booking-1',
    title: 'Turnkey Telegram Mini App & E-Menu Setup',
    duration: '2-Day Turnaround',
    price: '$450',
    type: 'Implementation',
    rating: 5.0,
    desc: 'Complete deployment of table QR e-menu ordering, automated kitchen Telegram bot dispatch, and menu photo digitization.',
    features: ['Custom Telegram Bot Token', 'Printable Table QR Standees', 'Staff Cashier Training Session', '30-Day Technical SLA']
  },
  {
    id: 'srv-booking-2',
    title: 'Kitchen KDS & Multi-Printer Routing Architecture',
    duration: '3-Day Turnaround',
    price: '$680',
    type: 'Systems Engineering',
    rating: 4.9,
    desc: 'Hardware integration for thermal receipt printers, kitchen display screens (KDS), and cash drawer kick relays.',
    features: ['Split Kitchen Routing (Bar / Hot / Cold)', 'Auto Failover Offline Buffer', 'Hardware Cabling & IP Setup', '60-Day Hardware Support']
  },
  {
    id: 'srv-booking-3',
    title: 'Commercial Coffee & Roastery Setup Consulting',
    duration: '1-Week Engagement',
    price: '$850',
    type: 'Consultation',
    rating: 4.9,
    desc: 'Espresso machine procurement selection, water filtration reverse-osmosis calibration, and barista workflow ergonomics.',
    features: ['Equipment ROI Financial Model', 'Water TDS Quality Testing', 'Barista Workflow Optimization', 'Direct-Trade Green Coffee Intro']
  },
  {
    id: 'srv-booking-4',
    title: 'Franchise Storefront Digitization & ERP Sync',
    duration: '2-Week Retainer',
    price: '$1,200',
    type: 'Enterprise Retainer',
    rating: 5.0,
    desc: 'End-to-end multi-store inventory sync, centralized branch billing, and automated royalty accounting reports.',
    features: ['Multi-Biller General Ledger', 'Central Commissary Warehouse', 'Franchisee Portal Accounts', 'Dedicated Senior Architect']
  }
];

export default function ServiceBookingTemplateView() {
  const { t } = useTranslation();
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingForm] = Form.useForm();

  const handleOpenBooking = (service) => {
    setSelectedService(service);
    bookingForm.setFieldsValue({
      serviceId: service?.id || 'general-advisory',
      serviceName: service?.title || 'General Strategy & Discovery Call',
      meetingType: 'virtual',
      timeSlot: '10:00 AM - 11:00 AM'
    });
    setBookingModalOpen(true);
  };

  const handleBookingSubmit = async () => {
    try {
      const values = await bookingForm.validateFields();
      message.success(t('booking_confirmed_success', `Appointment booked for ${values.clientName}! A calendar invitation has been sent to ${values.email}.`));
      setBookingModalOpen(false);
      bookingForm.resetFields();
    } catch (_) {}
  };

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', paddingBottom: 48 }}>
      {/* 1. Booking Hero Banner */}
      <Card
        style={{
          borderRadius: 24,
          background: 'linear-gradient(135deg, #431407 0%, #7c2d12 60%, #ea580c 100%)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 20px 45px rgba(234, 88, 12, 0.25)',
          overflow: 'hidden',
          marginBottom: 36
        }}
        styles={{ body: { padding: '48px 36px' } }}
      >
        <Row gutter={[32, 24]} align="middle">
          <Col xs={24} md={15}>
            <Tag color="orange" style={{ borderRadius: 20, padding: '4px 14px', fontWeight: 700, fontSize: 12, marginBottom: 16 }}>
              📅 {t('service_booking_portal', 'AURA ADVISORY & ON-DEMAND BOOKING')}
            </Tag>
            <Title level={1} style={{ color: '#ffffff', fontWeight: 800, margin: '0 0 16px', lineHeight: 1.2 }}>
              {t('bespoke_advisory_booking_hero', 'Bespoke Advisory, Turnkey Digital Setup & Operational Consulting')}
            </Title>
            <Paragraph style={{ color: '#fed7aa', fontSize: 15, lineHeight: 1.6, maxWidth: 620, marginBottom: 28 }}>
              {t('booking_hero_desc', 'Book 1-on-1 strategy sessions, on-site store engineering, and instant Telegram E-Menu deployment with our verified hospitality technology experts.')}
            </Paragraph>

            <Space size={14} wrap>
              <Button
                type="primary"
                size="large"
                icon={<CalendarOutlined />}
                onClick={() => handleOpenBooking(null)}
                style={{
                  height: 48,
                  padding: '0 28px',
                  borderRadius: 14,
                  fontWeight: 700,
                  background: '#f97316',
                  borderColor: '#f97316'
                }}
              >
                {t('book_consultation_now', 'Book Appointment Now')}
              </Button>
              <Button
                size="large"
                icon={<CustomerServiceOutlined />}
                onClick={() => {
                  const el = document.getElementById('services-menu');
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
                {t('explore_service_menu', 'Explore Service Packages')}
              </Button>
            </Space>
          </Col>

          {/* Booking Hero Trust Badges */}
          <Col xs={24} md={9}>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 20,
                padding: 24,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(16px)'
              }}
            >
              <Title level={4} style={{ color: '#ffffff', margin: '0 0 16px', fontWeight: 700 }}>
                {t('booking_guarantees', 'Service Guarantees')}
              </Title>
              <Space direction="vertical" size={14} style={{ width: '100%' }}>
                <Flex align="center" gap={10}>
                  <CheckCircleOutlined style={{ color: '#4ade80', fontSize: 18 }} />
                  <Text style={{ color: '#ffedd5', fontSize: 13.5 }}>Guaranteed Turnaround SLAs</Text>
                </Flex>
                <Flex align="center" gap={10}>
                  <CheckCircleOutlined style={{ color: '#4ade80', fontSize: 18 }} />
                  <Text style={{ color: '#ffedd5', fontSize: 13.5 }}>Dedicated Enterprise Technical Lead</Text>
                </Flex>
                <Flex align="center" gap={10}>
                  <CheckCircleOutlined style={{ color: '#4ade80', fontSize: 18 }} />
                  <Text style={{ color: '#ffedd5', fontSize: 13.5 }}>Virtual Zoom or On-Site Dispatch</Text>
                </Flex>
                <Flex align="center" gap={10}>
                  <CheckCircleOutlined style={{ color: '#4ade80', fontSize: 18 }} />
                  <Text style={{ color: '#ffedd5', fontSize: 13.5 }}>30-Day Post-Launch Warranty</Text>
                </Flex>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 2. Service Packages Menu */}
      <div id="services-menu" style={{ marginBottom: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Tag color="orange" style={{ borderRadius: 12, fontWeight: 700 }}>SERVICES & PACKAGES</Tag>
          <Title level={3} style={{ margin: '8px 0 6px', fontWeight: 700 }}>
            {t('popular_consulting_packages', 'Popular Consulting Packages & Advisory Menus')}
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            {t('packages_subtitle', 'Choose a package and schedule an appointment directly with our engineering team.')}
          </Text>
        </div>

        <Row gutter={[20, 20]}>
          {serviceOfferings.map((srv) => (
            <Col xs={24} sm={12} lg={6} key={srv.id}>
              <Card
                hoverable
                style={{ borderRadius: 16, height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid #fed7aa' }}
                styles={{ body: { padding: 22, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
              >
                <div>
                  <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                    <Tag color="volcano" style={{ borderRadius: 4, fontWeight: 700, margin: 0 }}>{srv.type}</Tag>
                    <Text style={{ fontSize: 12, color: '#ea580c', fontWeight: 600 }}>
                      <ClockCircleOutlined style={{ marginRight: 4 }} />
                      {srv.duration}
                    </Text>
                  </Flex>

                  <Title level={5} style={{ margin: '8px 0', fontSize: 15, lineHeight: 1.4, minHeight: 44 }}>
                    {srv.title}
                  </Title>

                  <Paragraph style={{ color: '#64748b', fontSize: 12.5, lineHeight: 1.5, minHeight: 48, marginBottom: 16 }}>
                    {srv.desc}
                  </Paragraph>

                  <div style={{ background: '#fff7ed', padding: '10px 12px', borderRadius: 10, marginBottom: 16 }}>
                    <Text strong style={{ fontSize: 11.5, color: '#9a3412', display: 'block', marginBottom: 6 }}>
                      {t('package_includes', 'Package Includes')}:
                    </Text>
                    {srv.features.map((f, idx) => (
                      <Flex key={idx} align="center" gap={6} style={{ marginBottom: 4 }}>
                        <CheckCircleOutlined style={{ color: '#ea580c', fontSize: 12 }} />
                        <Text style={{ fontSize: 11, color: '#475569' }}>{f}</Text>
                      </Flex>
                    ))}
                  </div>
                </div>

                <div>
                  <Flex justify="space-between" align="center" style={{ marginBottom: 14 }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 11 }}>{t('service_rate', 'Rate')}</Text>
                      <Title level={3} style={{ margin: 0, color: '#ea580c' }}>{srv.price}</Title>
                    </div>
                    <Flex align="center" gap={4}>
                      <StarFilled style={{ color: '#f59e0b', fontSize: 12 }} />
                      <Text strong style={{ fontSize: 12 }}>{srv.rating}</Text>
                    </Flex>
                  </Flex>

                  <Button
                    type="primary"
                    block
                    icon={<CalendarOutlined />}
                    onClick={() => handleOpenBooking(srv)}
                    style={{ borderRadius: 10, fontWeight: 700, background: '#ea580c', borderColor: '#ea580c' }}
                  >
                    {t('schedule_appointment', 'Book Appointment')}
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* 3. Interactive Booking Modal */}
      <Modal
        title={
          <Flex align="center" gap={10} style={{ color: '#ea580c' }}>
            <CalendarOutlined style={{ fontSize: 20 }} />
            <span>{t('book_consultation_appointment', 'Schedule Consultation Appointment')}</span>
          </Flex>
        }
        open={bookingModalOpen}
        onOk={handleBookingSubmit}
        onCancel={() => setBookingModalOpen(false)}
        okText={t('confirm_booking_button', 'Confirm & Book Appointment')}
        destroyOnClose
      >
        <Form form={bookingForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="serviceName" label={t('selected_service', 'Service Offering')}>
            <Input disabled prefix={<SolutionOutlined />} />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="clientName"
                label={t('your_name', 'Your Full Name')}
                rules={[{ required: true, message: 'Please enter your name' }]}
              >
                <Input placeholder="e.g. Alex Morgan" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label={t('email', 'Email Address')}
                rules={[{ required: true, type: 'email', message: 'Valid email required' }]}
              >
                <Input placeholder="alex@company.com" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="meetingType"
                label={t('session_format', 'Meeting Format')}
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { value: 'virtual', label: '🎥 Virtual Video (Zoom / Meet)' },
                    { value: 'onsite', label: '🏢 On-Site Client Visit' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="timeSlot"
                label={t('preferred_time', 'Preferred Time Slot')}
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { value: '09:00 AM - 10:00 AM', label: '09:00 AM - 10:00 AM' },
                    { value: '10:00 AM - 11:00 AM', label: '10:00 AM - 11:00 AM' },
                    { value: '02:00 PM - 03:00 PM', label: '02:00 PM - 03:00 PM' },
                    { value: '04:00 PM - 05:00 PM', label: '04:00 PM - 05:00 PM' }
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
