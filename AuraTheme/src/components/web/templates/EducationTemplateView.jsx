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
  Rate,
  Avatar,
  Badge,
  Tabs
} from 'antd';
import {
  BookOutlined,
  ReadOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  TeamOutlined,
  TrophyOutlined,
  SafetyCertificateOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
  UserOutlined,
  StarFilled,
  SearchOutlined,
  DownloadOutlined,
  SendOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../contexts/LanguageContext';

const { Title, Text, Paragraph } = Typography;

const sampleCourses = [
  {
    id: 'course-1',
    title: 'Hospitality Business Management & Micro-Enterprise',
    category: 'Business',
    level: 'Diploma',
    duration: '12 Weeks',
    students: 340,
    rating: 4.9,
    price: '$280',
    tag: 'Accredited',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=60',
    instructor: 'Dr. Sarah Leng',
    instructorRole: 'Hospitality Dean',
    syllabus: ['Revenue Management', 'Inventory FIFO Accounting', 'Staff Rota Scheduling', 'Customer Service Quality']
  },
  {
    id: 'course-2',
    title: 'Specialty Coffee Barista & Roastery Operations',
    category: 'Culinary Arts',
    level: 'Certificate',
    duration: '6 Weeks',
    students: 520,
    rating: 5.0,
    price: '$190',
    tag: 'Hands-on Lab',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=60',
    instructor: 'Master Barista K. Chan',
    instructorRole: 'SCA Certified Roaster',
    syllabus: ['Espresso Calibration', 'Sensory Cupping', 'Milk Micro-texture', 'Roast Profile Logging']
  },
  {
    id: 'course-3',
    title: 'Artisan Sourdough & European Viennoiserie Masterclass',
    category: 'Culinary Arts',
    level: 'Professional',
    duration: '8 Weeks',
    students: 290,
    rating: 4.8,
    price: '$240',
    tag: 'Practical Lab',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=60',
    instructor: 'Chef Laurent V.',
    instructorRole: 'Executive Pastry Chef',
    syllabus: ['Wild Yeast Starters', 'Lamination Science', 'Baguette Proofing', 'Commercial Bakery Scaling']
  },
  {
    id: 'course-4',
    title: 'Modern Retail POS, Telegram Mini Apps & Cloud Commerce',
    category: 'Technology',
    level: 'Certificate',
    duration: '4 Weeks',
    students: 410,
    rating: 4.9,
    price: '$150',
    tag: 'Tech Track',
    image: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800&auto=format&fit=crop&q=60',
    instructor: 'Eng. Sovann Dara',
    instructorRole: 'Lead Systems Architect',
    syllabus: ['Telegram Bot APIs', 'QR Table Menus', 'Receipt Printer Thermal Pins', 'Offline Register Sync']
  }
];

export default function EducationTemplateView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [admissionModalOpen, setAdmissionModalOpen] = useState(false);
  const [selectedCourseForAdmission, setSelectedCourseForAdmission] = useState(null);
  const [form] = Form.useForm();

  const filteredCourses = sampleCourses.filter((c) => {
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        c.title.toLowerCase().includes(q) ||
        c.instructor.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleApply = (course) => {
    setSelectedCourseForAdmission(course);
    form.setFieldsValue({
      course: course?.title || 'General Admission',
      term: 'Semester 1 - 2026'
    });
    setAdmissionModalOpen(true);
  };

  const handleAdmissionSubmit = async () => {
    try {
      const values = await form.validateFields();
      message.success(t('admission_submitted', `Application submitted successfully for ${values.fullName}! Admissions office will contact you within 24 hours.`));
      setAdmissionModalOpen(false);
      form.resetFields();
    } catch (_) {}
  };

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', paddingBottom: 48 }}>
      {/* 1. Education Hero Banner */}
      <Card
        style={{
          borderRadius: 24,
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 20px 40px rgba(49, 46, 129, 0.25)',
          overflow: 'hidden',
          marginBottom: 36
        }}
        styles={{ body: { padding: '48px 36px' } }}
      >
        <Row gutter={[32, 24]} align="middle">
          <Col xs={24} md={15}>
            <Tag color="purple" style={{ borderRadius: 20, padding: '4px 14px', fontWeight: 700, fontSize: 12, marginBottom: 16 }}>
              🎓 {t('aura_academy_portal', 'AURA EDUCATION & ACADEMY PORTAL')}
            </Tag>
            <Title level={1} style={{ color: '#ffffff', fontWeight: 800, margin: '0 0 16px', lineHeight: 1.2 }}>
              {t('empowering_next_gen_skills', 'Empowering Next-Generation Leaders Through Accredited Practical Skills')}
            </Title>
            <Paragraph style={{ color: '#c7d2fe', fontSize: 15, lineHeight: 1.6, maxWidth: 620, marginBottom: 28 }}>
              {t('academy_hero_desc', 'Join over 1,400 students advancing their careers in hospitality management, culinary mastery, enterprise technology, and small business operations with certified industry mentors.')}
            </Paragraph>

            <Space size={14} wrap>
              <Button
                type="primary"
                size="large"
                icon={<ReadOutlined />}
                onClick={() => {
                  const el = document.getElementById('courses-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  height: 48,
                  padding: '0 28px',
                  borderRadius: 14,
                  fontWeight: 700,
                  background: '#6366f1',
                  borderColor: '#6366f1'
                }}
              >
                {t('explore_courses', 'Explore Courses')}
              </Button>
              <Button
                size="large"
                icon={<ArrowRightOutlined />}
                onClick={() => handleApply(null)}
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
                {t('apply_online_admission', 'Apply Online Admission')}
              </Button>
            </Space>
          </Col>

          {/* Hero Statistics Badges */}
          <Col xs={24} md={9}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: 16, padding: 18, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Text style={{ color: '#a5b4fc', fontSize: 12 }}>{t('enrolled_students', 'Enrolled Students')}</Text>
                  <Title level={2} style={{ color: '#ffffff', margin: '4px 0 0' }}>1,420+</Title>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: 16, padding: 18, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Text style={{ color: '#a5b4fc', fontSize: 12 }}>{t('accredited_programs', 'Accredited Programs')}</Text>
                  <Title level={2} style={{ color: '#ffffff', margin: '4px 0 0' }}>48</Title>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: 16, padding: 18, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Text style={{ color: '#a5b4fc', fontSize: 12 }}>{t('graduate_employment', 'Employment Rate')}</Text>
                  <Title level={2} style={{ color: '#ffffff', margin: '4px 0 0' }}>98.4%</Title>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: 16, padding: 18, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Text style={{ color: '#a5b4fc', fontSize: 12 }}>{t('certified_mentors', 'Certified Mentors')}</Text>
                  <Title level={2} style={{ color: '#ffffff', margin: '4px 0 0' }}>32</Title>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* 2. Course Catalog Section */}
      <div id="courses-section" style={{ marginBottom: 36 }}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 20 }}>
          <div>
            <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
              {t('featured_courses_programs', 'Featured Courses & Academic Programs')}
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {t('courses_subtitle', 'Browse accredited diploma certifications, masterclasses, and vocational tracks.')}
            </Text>
          </div>

          <Space size={10} wrap>
            <Input
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder={t('search_courses', 'Search courses or mentors...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 220, borderRadius: 10 }}
              allowClear
            />
            <Button
              type={selectedCategory === 'all' ? 'primary' : 'default'}
              onClick={() => setSelectedCategory('all')}
              style={{ borderRadius: 8 }}
            >
              {t('all', 'All')}
            </Button>
            <Button
              type={selectedCategory === 'Business' ? 'primary' : 'default'}
              onClick={() => setSelectedCategory('Business')}
              style={{ borderRadius: 8 }}
            >
              Business
            </Button>
            <Button
              type={selectedCategory === 'Culinary Arts' ? 'primary' : 'default'}
              onClick={() => setSelectedCategory('Culinary Arts')}
              style={{ borderRadius: 8 }}
            >
              Culinary Arts
            </Button>
            <Button
              type={selectedCategory === 'Technology' ? 'primary' : 'default'}
              onClick={() => setSelectedCategory('Technology')}
              style={{ borderRadius: 8 }}
            >
              Technology
            </Button>
          </Space>
        </Flex>

        <Row gutter={[20, 20]}>
          {filteredCourses.map((c) => (
            <Col xs={24} sm={12} lg={6} key={c.id}>
              <Card
                hoverable
                cover={
                  <div style={{ position: 'relative', height: 170, overflow: 'hidden' }}>
                    <img
                      src={c.image}
                      alt={c.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <Tag
                      color="purple"
                      style={{ position: 'absolute', top: 12, right: 12, borderRadius: 6, fontWeight: 700 }}
                    >
                      {c.tag}
                    </Tag>
                  </div>
                }
                style={{ borderRadius: 16, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}
                styles={{ body: { padding: 18, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
              >
                <div>
                  <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
                    <Tag style={{ borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{c.category}</Tag>
                    <Text style={{ fontSize: 12, color: '#64748b' }}>
                      <ClockCircleOutlined style={{ marginRight: 4 }} />
                      {c.duration}
                    </Text>
                  </Flex>

                  <Title level={5} style={{ margin: '6px 0', fontSize: 14.5, lineHeight: 1.4, minHeight: 42 }}>
                    {c.title}
                  </Title>

                  <Flex align="center" gap={8} style={{ margin: '8px 0 12px' }}>
                    <Avatar size={24} icon={<UserOutlined />} style={{ background: '#6366f1' }} />
                    <div>
                      <Text strong style={{ fontSize: 12, display: 'block' }}>{c.instructor}</Text>
                      <Text type="secondary" style={{ fontSize: 10.5 }}>{c.instructorRole}</Text>
                    </div>
                  </Flex>

                  <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: 8, marginBottom: 12 }}>
                    <Text style={{ fontSize: 11, color: '#475569', display: 'block', fontWeight: 600, marginBottom: 4 }}>
                      {t('syllabus_highlights', 'Syllabus Highlights')}:
                    </Text>
                    {c.syllabus.slice(0, 2).map((item, idx) => (
                      <Text key={idx} style={{ fontSize: 10.5, color: '#64748b', display: 'block' }}>
                        &bull; {item}
                      </Text>
                    ))}
                  </div>
                </div>

                <div>
                  <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 11 }}>{t('tuition_fee', 'Tuition')}</Text>
                      <Title level={4} style={{ margin: 0, color: '#2563eb' }}>{c.price}</Title>
                    </div>
                    <Flex align="center" gap={4}>
                      <StarFilled style={{ color: '#f59e0b', fontSize: 12 }} />
                      <Text strong style={{ fontSize: 12 }}>{c.rating}</Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>({c.students})</Text>
                    </Flex>
                  </Flex>

                  <Button
                    type="primary"
                    block
                    onClick={() => handleApply(c)}
                    style={{ borderRadius: 10, fontWeight: 600, background: '#4f46e5', borderColor: '#4f46e5' }}
                  >
                    {t('enroll_apply_now', 'Apply for Admission')}
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* 3. Admission Modal */}
      <Modal
        title={
          <Flex align="center" gap={10} style={{ color: '#4f46e5' }}>
            <ReadOutlined style={{ fontSize: 20 }} />
            <span>{t('online_admission_application', 'Online Student Admission Application')}</span>
          </Flex>
        }
        open={admissionModalOpen}
        onOk={handleAdmissionSubmit}
        onCancel={() => setAdmissionModalOpen(false)}
        okText={t('submit_application', 'Submit Application')}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="course" label={t('selected_program', 'Selected Program / Track')}>
            <Input disabled prefix={<BookOutlined />} />
          </Form.Item>

          <Form.Item
            name="fullName"
            label={t('student_full_name', 'Student Full Name')}
            rules={[{ required: true, message: 'Please enter your full name' }]}
          >
            <Input placeholder="e.g. John Doe" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="email"
                label={t('email', 'Email Address')}
                rules={[{ required: true, type: 'email', message: 'Valid email required' }]}
              >
                <Input placeholder="student@example.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label={t('phone_number', 'Phone / Telegram Number')}
                rules={[{ required: true, message: 'Phone number required' }]}
              >
                <Input placeholder="+855 12 345 678" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="term" label={t('admission_intake', 'Admission Intake Term')}>
            <Input disabled prefix={<CalendarOutlined />} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
