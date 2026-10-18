import React, { useState, useEffect } from 'react';
import {
  App, Card, Tabs, Table, Button, Form, Input, InputNumber, Switch, Space, Tag, Modal,
  message, Popconfirm, Typography, Row, Col, Select, Divider, Alert, Tooltip, Badge,
  Statistic, Rate
} from 'antd';
import {
  GlobalOutlined, MenuOutlined, PictureOutlined, FileTextOutlined,
  ReadOutlined, TeamOutlined, CommentOutlined, QuestionCircleOutlined,
  ApartmentOutlined, MailOutlined, UserAddOutlined, DatabaseOutlined,
  PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, ReloadOutlined,
  DownloadOutlined, CheckCircleOutlined, CopyOutlined, EyeOutlined,
  ShopOutlined, QrcodeOutlined, MobileOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminFrontEndController from '../AdminFrontEndController';
import AdminQrCodeGenerator from '../../../components/admins/AdminQrCodeGenerator';
import { useAdminTheme } from '../../../hooks/useAdminTheme';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function AdminCmsManager() {
  const { modal } = App.useApp ? App.useApp() : {};
  const adminTheme = useAdminTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  // Map aliases between legacy front-end and cms module menus
  const resolveInitialMenu = () => {
    const m = searchParams.get('menu');
    const mod = searchParams.get('module');
    if (m === 'shop-settings' || m === 'storefront' || m === 'list-pages' || mod === 'front-end' || mod === 'frontend') {
      return 'shop-settings';
    }
    if (m === 'slider-settings') return 'cms-hero';
    if (m === 'cms-qrcode' || m === 'qrcode') return 'cms-qrcode';
    return m || 'shop-settings';
  };

  const [activeTab, setActiveTab] = useState(resolveInitialMenu);
  const [loading, setLoading] = useState(false);

  // CMS State Stores
  const [settings, setSettings] = useState({});
  const [menus, setMenus] = useState([]);
  const [heroSlides, setHeroSlides] = useState([]);
  const [pages, setPages] = useState([]);
  const [posts, setPosts] = useState([]);
  const [team, setTeam] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [partners, setPartners] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [media, setMedia] = useState([]);
  const [dbStatus, setDbStatus] = useState(null);

  // Modal & Form States
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();

  // Language tab for bilingual editing: 'en' | 'km'
  const [contentLang, setContentLang] = useState('en');

  // Load all CMS data from API
  const fetchAllCmsData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cms/all');
      const json = await res.json();
      if (json.status && json.data) {
        setSettings(json.data.settings || {});
        setMenus(json.data.menus || []);
        setHeroSlides(json.data.heroSlides || []);
        setPages(json.data.pages || []);
        setPosts(json.data.posts || []);
        setTeam(json.data.teamMembers || []);
        setTestimonials(json.data.testimonials || []);
        setFaqs(json.data.faqs || []);
        setPartners(json.data.partners || []);
        setInquiries(json.data.contactMessages || []);
        setSubscribers(json.data.subscribers || []);
        setMedia(json.data.media || []);
      }
      // Check DB Status
      const dbRes = await fetch('/api/cms/db-status');
      const dbJson = await dbRes.json();
      if (dbJson.status) {
        setDbStatus(dbJson.database);
      }
    } catch (err) {
      console.error('Failed to load CMS data:', err);
      message.error('Failed to connect to CMS API: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCmsData();
  }, []);

  useEffect(() => {
    const m = searchParams.get('menu');
    if (m && m !== activeTab) {
      setActiveTab(m);
    }
  }, [location.search]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    navigate(`/admins?module=cms&menu=${key}`);
  };

  // -------------------------------------------------------------
  // CRUD Handlers
  // -------------------------------------------------------------
  const handleSaveSettings = async (values) => {
    setLoading(true);
    try {
      const res = await fetch('/api/cms/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (json.status) {
        message.success('Site settings saved successfully!');
        setSettings(json.data);
      } else {
        message.error(json.message || 'Error saving settings');
      }
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    setModalVisible(true);
    setTimeout(() => {
      form.resetFields();
      if (item) {
        form.setFieldsValue(item);
      }
    }, 0);
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem && editingItem.id) {
        values.id = editingItem.id;
      }

      let endpoint = '';
      if (modalType === 'menu') endpoint = '/api/cms/menus';
      else if (modalType === 'hero') endpoint = '/api/cms/hero';
      else if (modalType === 'page') endpoint = '/api/cms/pages';
      else if (modalType === 'post') endpoint = '/api/cms/posts';
      else if (modalType === 'team') endpoint = '/api/cms/team';
      else if (modalType === 'testimonial') endpoint = '/api/cms/testimonials';
      else if (modalType === 'faq') endpoint = '/api/cms/faqs';
      else if (modalType === 'partner') endpoint = '/api/cms/partners';
      else if (modalType === 'media') endpoint = '/api/cms/media';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (json.status) {
        message.success(json.message || 'Saved successfully');
        setModalVisible(false);
        fetchAllCmsData();
      } else {
        message.error(json.message || 'Error saving item');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (type, id) => {
    let endpoint = '';
    if (type === 'menu') endpoint = `/api/cms/menus/${id}`;
    else if (type === 'hero') endpoint = `/api/cms/hero/${id}`;
    else if (type === 'page') endpoint = `/api/cms/pages/${id}`;
    else if (type === 'post') endpoint = `/api/cms/posts/${id}`;
    else if (type === 'team') endpoint = `/api/cms/team/${id}`;
    else if (type === 'testimonial') endpoint = `/api/cms/testimonials/${id}`;
    else if (type === 'faq') endpoint = `/api/cms/faqs/${id}`;
    else if (type === 'partner') endpoint = `/api/cms/partners/${id}`;
    else if (type === 'inquiry') endpoint = `/api/cms/inquiries/${id}`;
    else if (type === 'subscriber') endpoint = `/api/cms/subscribers/${id}`;
    else if (type === 'media') endpoint = `/api/cms/media/${id}`;

    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      const json = await res.json();
      if (json.status) {
        message.success('Item deleted successfully');
        fetchAllCmsData();
      } else {
        message.error(json.message || 'Failed to delete');
      }
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleExportCsv = (data, filename) => {
    if (!data.length) return message.warning('No records to export');
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((row) =>
      Object.values(row)
        .map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`)
        .join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success(`Exported ${data.length} records to ${filename}.csv`);
  };

  // -------------------------------------------------------------
  // TAB 1: SITE SETTINGS
  // -------------------------------------------------------------
  const renderSettingsTab = () => (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span><GlobalOutlined style={{ marginRight: 8, color: '#2563eb' }} /> Global Website Settings & Branding</span>
          <Space>
            <Button
              type={contentLang === 'en' ? 'primary' : 'default'}
              size="small"
              onClick={() => setContentLang('en')}
            >
              🇺🇸 English
            </Button>
            <Button
              type={contentLang === 'km' ? 'primary' : 'default'}
              size="small"
              onClick={() => setContentLang('km')}
            >
              🇰🇭 ភាសាខ្មែរ (Khmer)
            </Button>
          </Space>
        </div>
      }
      styles={{ body: { padding: 24 } }}
    >
      <Form
        layout="vertical"
        onFinish={handleSaveSettings}
        initialValues={settings}
      >
        <Row gutter={24}>
          <Col xs={24} md={12}>
            {contentLang === 'en' ? (
              <Form.Item label="Site Name (English)" name="site_name_en" rules={[{ required: true }]}>
                <Input placeholder="e.g. Aura Global" />
              </Form.Item>
            ) : (
              <Form.Item label="ឈ្មោះគេហទំព័រ (Khmer)" name="site_name_km" rules={[{ required: true }]}>
                <Input placeholder="ឧទាហរណ៍៖ អូរ៉ា គ្លូប៊ល" />
              </Form.Item>
            )}
          </Col>
          <Col xs={24} md={12}>
            {contentLang === 'en' ? (
              <Form.Item label="Site Tagline (English)" name="tagline_en">
                <Input placeholder="e.g. Specialty Coffee & Modern Lifestyle" />
              </Form.Item>
            ) : (
              <Form.Item label="ពាក្យស្លោក (Khmer)" name="tagline_km">
                <Input placeholder="ឧទាហរណ៍៖ កាហ្វេរសជាតិដើម និងទាន់សម័យ" />
              </Form.Item>
            )}
          </Col>
        </Row>

        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item label="Header Logo Image URL" name="logo_url" rules={[{ required: true }]}>
              <Input placeholder="https://..." />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Favicon Icon URL" name="favicon_url">
              <Input placeholder="/favicon.ico" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" style={{ borderColor: adminTheme.border, fontSize: 13, color: adminTheme.subtext }}>
          Contact Information & Addresses
        </Divider>

        <Row gutter={24}>
          <Col xs={24} md={8}>
            <Form.Item label="Primary Phone" name="phone">
              <Input placeholder="+855 12 345 678" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Secondary Phone" name="phone_secondary">
              <Input placeholder="+855 23 999 888" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Contact Email" name="email" rules={[{ type: 'email' }]}>
              <Input placeholder="contact@domain.com" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col xs={24} md={12}>
            {contentLang === 'en' ? (
              <Form.Item label="Physical Address (English)" name="address_en">
                <TextArea rows={3} placeholder="No. 128, Preah Norodom Blvd, Phnom Penh..." />
              </Form.Item>
            ) : (
              <Form.Item label="អាសយដ្ឋាន (Khmer)" name="address_km">
                <TextArea rows={3} placeholder="អគារលេខ ១២៨ មហាវិថីព្រះនរោត្តម..." />
              </Form.Item>
            )}
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Google Maps Embed / Map Link" name="google_maps_iframe">
              <TextArea rows={3} placeholder="https://www.google.com/maps/embed?pb=..." />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" style={{ borderColor: adminTheme.border, fontSize: 13, color: adminTheme.subtext }}>
          Social Media Links
        </Divider>

        <Row gutter={24}>
          <Col xs={24} md={6}>
            <Form.Item label="Facebook URL" name="social_facebook">
              <Input placeholder="https://facebook.com/..." />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item label="Telegram Channel / Bot" name="social_telegram">
              <Input placeholder="https://t.me/..." />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item label="Instagram URL" name="social_instagram">
              <Input placeholder="https://instagram.com/..." />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item label="TikTok URL" name="social_tiktok">
              <Input placeholder="https://tiktok.com/@..." />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" style={{ borderColor: adminTheme.border, fontSize: 13, color: adminTheme.subtext }}>
          Footer & SEO Metadata Defaults
        </Divider>

        <Row gutter={24}>
          <Col xs={24} md={12}>
            {contentLang === 'en' ? (
              <Form.Item label="Footer Copyright Text (English)" name="footer_text_en">
                <Input placeholder="© 2026 Aura Global. All rights reserved." />
              </Form.Item>
            ) : (
              <Form.Item label="អត្ថបទ Footer (Khmer)" name="footer_text_km">
                <Input placeholder="© ២០២៦ អូរ៉ា គ្លូប៊ល..." />
              </Form.Item>
            )}
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="SEO Meta Title" name="seo_meta_title">
              <Input placeholder="Aura Global - Coffee & Lifestyle" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item label="SEO Meta Description" name="seo_meta_description">
              <TextArea rows={2} placeholder="Brief summary shown in Google search results..." />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="SEO Keywords (comma separated)" name="seo_keywords">
              <Input placeholder="coffee, bakery, cafe, phnom penh" />
            </Form.Item>
          </Col>
        </Row>

        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large" style={{ marginTop: 12 }}>
          Save Site Settings
        </Button>
      </Form>
    </Card>
  );

  // -------------------------------------------------------------
  // TAB 2: NAVIGATION MENUS
  // -------------------------------------------------------------
  const renderMenusTab = () => {
    const columns = [
      { title: 'Order', dataIndex: 'sort_order', key: 'sort_order', width: 80 },
      { title: 'Title (EN)', dataIndex: 'title_en', key: 'title_en', render: (t) => <b>{t}</b> },
      { title: 'Title (KM)', dataIndex: 'title_km', key: 'title_km', render: (t) => t || <Text type="secondary">-</Text> },
      { title: 'Target URL', dataIndex: 'url', key: 'url', render: (u) => <Tag color="blue">{u}</Tag> },
      {
        title: 'Placement',
        dataIndex: 'location',
        key: 'location',
        render: (loc) => <Tag color={loc === 'header' ? 'green' : 'purple'}>{loc}</Tag>,
      },
      {
        title: 'Status',
        dataIndex: 'is_active',
        key: 'is_active',
        render: (act) => <Tag color={act ? 'success' : 'default'}>{act ? 'Active' : 'Hidden'}</Tag>,
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 140,
        render: (_, record) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} onClick={() => openModal('menu', record)} />
            <Popconfirm title="Delete this menu item?" onConfirm={() => handleDeleteItem('menu', record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ];

    return (
      <Card
        title="Navigation Menu Items (Header & Footer)"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('menu')}>
            Add Menu Item
          </Button>
        }
      >
        <Table dataSource={menus} columns={columns} rowKey="id" pagination={false} />
      </Card>
    );
  };

  // -------------------------------------------------------------
  // TAB 3: HERO SLIDES
  // -------------------------------------------------------------
  const renderHeroTab = () => {
    const columns = [
      {
        title: 'Preview',
        dataIndex: 'image_url',
        key: 'image_url',
        width: 120,
        render: (url) => (
          <img
            src={url}
            alt="slide"
            style={{ width: 100, height: 50, objectFit: 'cover', borderRadius: 6 }}
          />
        ),
      },
      { title: 'Title (EN)', dataIndex: 'title_en', key: 'title_en', render: (t) => <b>{t}</b> },
      { title: 'Subtitle (EN)', dataIndex: 'subtitle_en', key: 'subtitle_en', ellipsis: true },
      { title: 'CTA Button', dataIndex: 'button_text_en', key: 'button_text_en' },
      { title: 'Target Link', dataIndex: 'button_url', key: 'button_url' },
      { title: 'Order', dataIndex: 'sort_order', key: 'sort_order', width: 80 },
      {
        title: 'Status',
        dataIndex: 'is_active',
        key: 'is_active',
        render: (act) => <Tag color={act ? 'success' : 'default'}>{act ? 'Active' : 'Disabled'}</Tag>,
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 140,
        render: (_, record) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} onClick={() => openModal('hero', record)} />
            <Popconfirm title="Delete slide?" onConfirm={() => handleDeleteItem('hero', record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ];

    return (
      <Card
        title="Home Page Hero Banners & Carousel Slides"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('hero')}>
            Add New Hero Slide
          </Button>
        }
      >
        <Table dataSource={heroSlides} columns={columns} rowKey="id" pagination={false} />
      </Card>
    );
  };

  // -------------------------------------------------------------
  // TAB 4: CUSTOM PAGES
  // -------------------------------------------------------------
  const renderPagesTab = () => {
    const columns = [
      { title: 'Page Title (EN)', dataIndex: 'title_en', key: 'title_en', render: (t) => <b>{t}</b> },
      { title: 'Slug / URL', dataIndex: 'slug', key: 'slug', render: (s) => <Tag color="geekblue">/pages/{s}</Tag> },
      { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'published' ? 'green' : 'orange'}>{s}</Tag> },
      {
        title: 'Actions',
        key: 'actions',
        width: 140,
        render: (_, record) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} onClick={() => openModal('page', record)} />
            <Popconfirm title="Delete page?" onConfirm={() => handleDeleteItem('page', record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ];

    return (
      <Card
        title="Static & Custom Rich Text Pages"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('page')}>
            Create New Page
          </Button>
        }
      >
        <Table dataSource={pages} columns={columns} rowKey="id" />
      </Card>
    );
  };

  // -------------------------------------------------------------
  // TAB 5: BLOG & ARTICLES
  // -------------------------------------------------------------
  const renderPostsTab = () => {
    const columns = [
      {
        title: 'Cover',
        dataIndex: 'cover_image',
        key: 'cover_image',
        width: 90,
        render: (url) => url ? (
          <img src={url} alt="post" style={{ width: 70, height: 45, objectFit: 'cover', borderRadius: 4 }} />
        ) : <Text type="secondary">No Image</Text>,
      },
      { title: 'Title (EN)', dataIndex: 'title_en', key: 'title_en', render: (t) => <b>{t}</b> },
      { title: 'Author', dataIndex: 'author_name', key: 'author_name' },
      { title: 'Views', dataIndex: 'views_count', key: 'views_count', width: 90 },
      { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'published' ? 'green' : 'gold'}>{s}</Tag> },
      {
        title: 'Actions',
        key: 'actions',
        width: 140,
        render: (_, record) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} onClick={() => openModal('post', record)} />
            <Popconfirm title="Delete post?" onConfirm={() => handleDeleteItem('post', record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ];

    return (
      <Card
        title="Blog Posts & Educational Articles"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('post')}>
            Write New Article
          </Button>
        }
      >
        <Table dataSource={posts} columns={columns} rowKey="id" />
      </Card>
    );
  };

  // -------------------------------------------------------------
  // TAB 6: TEAM MEMBERS
  // -------------------------------------------------------------
  const renderTeamTab = () => {
    const columns = [
      {
        title: 'Photo',
        dataIndex: 'photo_url',
        key: 'photo_url',
        width: 80,
        render: (url) => <img src={url} alt="team" style={{ width: 45, height: 45, borderRadius: '50%', objectFit: 'cover' }} />,
      },
      { title: 'Name', dataIndex: 'name', key: 'name', render: (n) => <b>{n}</b> },
      { title: 'Position (EN)', dataIndex: 'position_en', key: 'position_en' },
      { title: 'Position (KM)', dataIndex: 'position_km', key: 'position_km' },
      { title: 'Telegram', dataIndex: 'social_telegram', key: 'social_telegram' },
      { title: 'Order', dataIndex: 'sort_order', key: 'sort_order', width: 80 },
      {
        title: 'Actions',
        key: 'actions',
        width: 140,
        render: (_, record) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} onClick={() => openModal('team', record)} />
            <Popconfirm title="Delete team member?" onConfirm={() => handleDeleteItem('team', record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ];

    return (
      <Card
        title="Leadership & Barista Team Members"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('team')}>
            Add Team Member
          </Button>
        }
      >
        <Table dataSource={team} columns={columns} rowKey="id" />
      </Card>
    );
  };

  // -------------------------------------------------------------
  // TAB 7: TESTIMONIALS
  // -------------------------------------------------------------
  const renderTestimonialsTab = () => {
    const columns = [
      { title: 'Author', dataIndex: 'author_name', key: 'author_name', render: (n) => <b>{n}</b> },
      { title: 'Rating', dataIndex: 'rating', key: 'rating', render: (r) => <Rate disabled defaultValue={r} /> },
      { title: 'Quote (EN)', dataIndex: 'quote_en', key: 'quote_en', ellipsis: true },
      {
        title: 'Approved',
        dataIndex: 'is_approved',
        key: 'is_approved',
        render: (app) => <Tag color={app ? 'green' : 'default'}>{app ? 'Approved' : 'Hidden'}</Tag>,
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 140,
        render: (_, record) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} onClick={() => openModal('testimonial', record)} />
            <Popconfirm title="Delete testimonial?" onConfirm={() => handleDeleteItem('testimonial', record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ];

    return (
      <Card
        title="Customer Testimonials & Verified Reviews"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('testimonial')}>
            Add Testimonial
          </Button>
        }
      >
        <Table dataSource={testimonials} columns={columns} rowKey="id" />
      </Card>
    );
  };

  // -------------------------------------------------------------
  // TAB 8: FAQS
  // -------------------------------------------------------------
  const renderFaqsTab = () => {
    const columns = [
      { title: 'Category', dataIndex: 'category', key: 'category', render: (c) => <Tag color="blue">{c}</Tag> },
      { title: 'Question (EN)', dataIndex: 'question_en', key: 'question_en', render: (q) => <b>{q}</b> },
      { title: 'Answer (EN)', dataIndex: 'answer_en', key: 'answer_en', ellipsis: true },
      { title: 'Order', dataIndex: 'sort_order', key: 'sort_order', width: 80 },
      {
        title: 'Actions',
        key: 'actions',
        width: 140,
        render: (_, record) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} onClick={() => openModal('faq', record)} />
            <Popconfirm title="Delete FAQ?" onConfirm={() => handleDeleteItem('faq', record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ];

    return (
      <Card
        title="Frequently Asked Questions (FAQs)"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('faq')}>
            Add FAQ
          </Button>
        }
      >
        <Table dataSource={faqs} columns={columns} rowKey="id" />
      </Card>
    );
  };

  // -------------------------------------------------------------
  // TAB 9: PARTNERS
  // -------------------------------------------------------------
  const renderPartnersTab = () => {
    const columns = [
      {
        title: 'Logo',
        dataIndex: 'logo_url',
        key: 'logo_url',
        width: 100,
        render: (url) => <img src={url} alt="partner" style={{ maxHeight: 35, maxWidth: 80, objectFit: 'contain' }} />,
      },
      { title: 'Partner Name', dataIndex: 'name', key: 'name', render: (n) => <b>{n}</b> },
      { title: 'Website URL', dataIndex: 'website_url', key: 'website_url', render: (w) => w ? <a href={w} target="_blank" rel="noreferrer">{w}</a> : '-' },
      {
        title: 'Actions',
        key: 'actions',
        width: 140,
        render: (_, record) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} onClick={() => openModal('partner', record)} />
            <Popconfirm title="Delete partner?" onConfirm={() => handleDeleteItem('partner', record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ];

    return (
      <Card
        title="Official Partners & Sponsor Logos"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('partner')}>
            Add Partner Logo
          </Button>
        }
      >
        <Table dataSource={partners} columns={columns} rowKey="id" />
      </Card>
    );
  };

  // -------------------------------------------------------------
  // TAB 10: CONTACT INQUIRIES
  // -------------------------------------------------------------
  const renderInquiriesTab = () => {
    const columns = [
      { title: 'Sender', dataIndex: 'name', key: 'name', render: (n, r) => <div><b>{n}</b><br/><small style={{ color: adminTheme.subtext }}>{r.email}</small></div> },
      { title: 'Phone', dataIndex: 'phone', key: 'phone' },
      { title: 'Subject', dataIndex: 'subject', key: 'subject' },
      { title: 'Message', dataIndex: 'message', key: 'message', ellipsis: true },
      {
        title: 'Status',
        dataIndex: 'is_read',
        key: 'is_read',
        render: (read) => <Tag color={read ? 'default' : 'processing'}>{read ? 'Read' : 'New Message'}</Tag>,
      },
      {
        title: 'Date',
        dataIndex: 'created_at',
        key: 'created_at',
        render: (d) => new Date(d).toLocaleDateString(),
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 140,
        render: (_, record) => (
          <Space>
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                const infoFn = modal?.info || Modal.info;
                infoFn({
                  title: `Inquiry from ${record.name}`,
                  content: (
                    <div style={{ marginTop: 12 }}>
                      <p><b>Email:</b> {record.email}</p>
                      <p><b>Phone:</b> {record.phone || 'N/A'}</p>
                      <p><b>Subject:</b> {record.subject}</p>
                      <p><b>Message:</b></p>
                      <div style={{ background: adminTheme.cardMuted, padding: 12, borderRadius: 6, border: `1px solid ${adminTheme.border}` }}>
                        {record.message}
                      </div>
                    </div>
                  ),
                });
              }}
            />
            <Popconfirm title="Delete inquiry?" onConfirm={() => handleDeleteItem('inquiry', record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ];

    return (
      <Card
        title="Contact Form Messages & Inquiries"
        extra={
          <Button icon={<DownloadOutlined />} onClick={() => handleExportCsv(inquiries, 'contact_inquiries')}>
            Export CSV
          </Button>
        }
      >
        <Table dataSource={inquiries} columns={columns} rowKey="id" />
      </Card>
    );
  };

  // -------------------------------------------------------------
  // TAB 11: SUBSCRIBERS
  // -------------------------------------------------------------
  const renderSubscribersTab = () => {
    const columns = [
      { title: 'Subscriber Email', dataIndex: 'email', key: 'email', render: (e) => <b>{e}</b> },
      { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color="green">{s}</Tag> },
      {
        title: 'Date Subscribed',
        dataIndex: 'subscribed_at',
        key: 'subscribed_at',
        render: (d) => new Date(d).toLocaleString(),
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 100,
        render: (_, record) => (
          <Popconfirm title="Remove subscriber?" onConfirm={() => handleDeleteItem('subscriber', record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        ),
      },
    ];

    return (
      <Card
        title="Newsletter Subscribers List"
        extra={
          <Button icon={<DownloadOutlined />} onClick={() => handleExportCsv(subscribers, 'newsletter_subscribers')}>
            Export CSV
          </Button>
        }
      >
        <Table dataSource={subscribers} columns={columns} rowKey="id" />
      </Card>
    );
  };

  // -------------------------------------------------------------
  // TAB 12: MEDIA ASSETS
  // -------------------------------------------------------------
  const renderMediaTab = () => (
    <Card
      title="Media Library & Image Assets"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('media')}>
          Add Image Asset
        </Button>
      }
    >
      <Row gutter={[16, 16]}>
        {media.map((item) => (
          <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
            <Card
              hoverable
              cover={
                <img
                  src={item.file_path}
                  alt={item.alt_text || item.file_name}
                  style={{ height: 160, objectFit: 'cover' }}
                />
              }
              actions={[
                <Tooltip title="Copy Image URL">
                  <CopyOutlined
                    onClick={() => {
                      navigator.clipboard.writeText(item.file_path);
                      message.success('Copied image URL to clipboard!');
                    }}
                  />
                </Tooltip>,
                <Popconfirm title="Delete asset?" onConfirm={() => handleDeleteItem('media', item.id)}>
                  <DeleteOutlined style={{ color: '#ef4444' }} />
                </Popconfirm>,
              ]}
            >
              <Card.Meta
                title={<span style={{ fontSize: 13, color: adminTheme.text }}>{item.file_name}</span>}
                description={<small style={{ color: adminTheme.subtext }}>{item.alt_text || 'Asset item'}</small>}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );

  // -------------------------------------------------------------
  // TAB 13: DATABASE & MIGRATIONS
  // -------------------------------------------------------------
  const renderDatabaseTab = () => (
    <Card title="Database Connectivity & Table Inspector (MySQL / bpas_v6_8_9_db)">
      <Alert
        message="Localhost & Production MySQL Integration"
        description="This application automatically attempts to connect to your MySQL database specified in config.js / environment variables (Host: localhost, Database: bpas_v6_8_9_db). If MySQL is running locally, tables are automatically synced. When running in containerized environments, an active fallback store prevents outages."
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
      />

      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card size="small" style={{ background: adminTheme.cardMuted, borderColor: adminTheme.border }}>
            <Statistic title="Configured Database" value={dbStatus?.database_name || 'bpas_v6_8_9_db'} prefix={<DatabaseOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small" style={{ background: adminTheme.cardMuted, borderColor: adminTheme.border }}>
            <Statistic title="Database Host" value={dbStatus?.configured_host || 'localhost'} prefix={<GlobalOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small" style={{ background: adminTheme.cardMuted, borderColor: adminTheme.border }}>
            <Statistic title="CMS Core Tables" value={dbStatus?.tables_ready?.length || 13} prefix={<CheckCircleOutlined style={{ color: '#22c55e' }} />} />
          </Card>
        </Col>
      </Row>

      <Title level={5}>Generated Tables in Migration Script</Title>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {(dbStatus?.tables_ready || []).map((tbl) => (
          <Tag color="cyan" key={tbl} style={{ padding: '4px 10px', fontSize: 13 }}>
            📁 {tbl}
          </Tag>
        ))}
      </div>

      <Divider />

      <Space>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={() => {
            window.open('/database_schema_cms.sql', '_blank');
          }}
        >
          View / Download SQL Migration Script (database_schema_cms.sql)
        </Button>
        <Button icon={<ReloadOutlined />} onClick={fetchAllCmsData}>
          Refresh Database Status
        </Button>
      </Space>
    </Card>
  );

  // -------------------------------------------------------------
  // MODAL FOR CRUD ITEMS
  // -------------------------------------------------------------
  const renderItemModal = () => {
    let modalTitle = 'Edit Item';
    if (modalType === 'menu') modalTitle = editingItem ? 'Edit Menu Item' : 'New Menu Item';
    if (modalType === 'hero') modalTitle = editingItem ? 'Edit Hero Slide' : 'New Hero Slide';
    if (modalType === 'page') modalTitle = editingItem ? 'Edit Custom Page' : 'New Custom Page';
    if (modalType === 'post') modalTitle = editingItem ? 'Edit Article' : 'New Article';
    if (modalType === 'team') modalTitle = editingItem ? 'Edit Team Member' : 'New Team Member';
    if (modalType === 'testimonial') modalTitle = editingItem ? 'Edit Testimonial' : 'New Testimonial';
    if (modalType === 'faq') modalTitle = editingItem ? 'Edit FAQ' : 'New FAQ';
    if (modalType === 'partner') modalTitle = editingItem ? 'Edit Partner' : 'New Partner Logo';
    if (modalType === 'media') modalTitle = 'Record Media Asset';

    return (
      <Modal
        forceRender
        title={modalTitle}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleModalSubmit}
        width={700}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          {modalType === 'menu' && (
            <>
              <Form.Item label="Title (English)" name="title_en" rules={[{ required: true }]}>
                <Input placeholder="e.g. Products" />
              </Form.Item>
              <Form.Item label="Title (Khmer)" name="title_km">
                <Input placeholder="ឧទាហរណ៍៖ ផលិតផល" />
              </Form.Item>
              <Form.Item label="Target URL" name="url" rules={[{ required: true }]}>
                <Input placeholder="e.g. /shop" />
              </Form.Item>
              <Form.Item label="Location" name="location" initialValue="header">
                <Select>
                  <Option value="header">Header Main Menu</Option>
                  <Option value="footer_quick_links">Footer Quick Links</Option>
                  <Option value="footer_services">Footer Services</Option>
                </Select>
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Sort Order" name="sort_order" initialValue={1}>
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Is Active" name="is_active" valuePropName="checked" initialValue={true}>
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          {modalType === 'hero' && (
            <>
              <Form.Item label="Badge Tag (English)" name="badge_en">
                <Input placeholder="e.g. ✨ NEW ARRIVAL" />
              </Form.Item>
              <Form.Item label="Badge Tag (Khmer)" name="badge_km">
                <Input placeholder="e.g. ✨ ការប្រមូលផលថ្មី" />
              </Form.Item>
              <Form.Item label="Headline Title (English)" name="title_en" rules={[{ required: true }]}>
                <Input placeholder="e.g. Experience Pure Artisan Flavor" />
              </Form.Item>
              <Form.Item label="Headline Title (Khmer)" name="title_km">
                <Input placeholder="e.g. ពិសាជាមួយរសជាតិកាហ្វេដ៏ពិតប្រាកដ" />
              </Form.Item>
              <Form.Item label="Subtitle (English)" name="subtitle_en">
                <TextArea rows={2} placeholder="Description paragraph..." />
              </Form.Item>
              <Form.Item label="Subtitle (Khmer)" name="subtitle_km">
                <TextArea rows={2} placeholder="ការពិពណ៌នា..." />
              </Form.Item>
              <Form.Item label="Background Image URL" name="image_url" rules={[{ required: true }]}>
                <Input placeholder="https://... or /assets/uploads/banner.jpg" />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Button Text (EN)" name="button_text_en" initialValue="Order Now">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Button URL" name="button_url" initialValue="/shop">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Sort Order" name="sort_order" initialValue={1}>
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Active" name="is_active" valuePropName="checked" initialValue={true}>
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          {modalType === 'page' && (
            <>
              <Form.Item label="Page Title (English)" name="title_en" rules={[{ required: true }]}>
                <Input placeholder="e.g. Our Heritage" />
              </Form.Item>
              <Form.Item label="Page Title (Khmer)" name="title_km">
                <Input placeholder="ឧទាហរណ៍៖ ប្រវត្តិរបស់យើង" />
              </Form.Item>
              <Form.Item label="URL Slug" name="slug" rules={[{ required: true }]}>
                <Input placeholder="e.g. about" />
              </Form.Item>
              <Form.Item label="Content (English)" name="content_en" rules={[{ required: true }]}>
                <TextArea rows={5} placeholder="Full page body in HTML or plain text..." />
              </Form.Item>
              <Form.Item label="Content (Khmer)" name="content_km">
                <TextArea rows={5} placeholder="ខ្លឹមសារជាភាសាខ្មែរ..." />
              </Form.Item>
              <Form.Item label="Status" name="status" initialValue="published">
                <Select>
                  <Option value="published">Published</Option>
                  <Option value="draft">Draft</Option>
                </Select>
              </Form.Item>
            </>
          )}

          {modalType === 'post' && (
            <>
              <Form.Item label="Article Title (English)" name="title_en" rules={[{ required: true }]}>
                <Input placeholder="e.g. The Art of Pour-Over Coffee" />
              </Form.Item>
              <Form.Item label="Article Title (Khmer)" name="title_km">
                <Input placeholder="e.g. សិល្បៈនៃការឆុងកាហ្វេ" />
              </Form.Item>
              <Form.Item label="URL Slug" name="slug" rules={[{ required: true }]}>
                <Input placeholder="e.g. art-of-pour-over" />
              </Form.Item>
              <Form.Item label="Cover Image URL" name="cover_image">
                <Input placeholder="https://..." />
              </Form.Item>
              <Form.Item label="Excerpt (EN)" name="excerpt_en">
                <TextArea rows={2} placeholder="Brief summary..." />
              </Form.Item>
              <Form.Item label="Full Article Body (EN)" name="body_en" rules={[{ required: true }]}>
                <TextArea rows={6} placeholder="Detailed content..." />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Author Name" name="author_name" initialValue="Aura Editorial">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Status" name="status" initialValue="published">
                    <Select>
                      <Option value="published">Published</Option>
                      <Option value="draft">Draft</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          {modalType === 'team' && (
            <>
              <Form.Item label="Full Name" name="name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Sophea Kim" />
              </Form.Item>
              <Form.Item label="Position (English)" name="position_en" rules={[{ required: true }]}>
                <Input placeholder="e.g. Head Barista" />
              </Form.Item>
              <Form.Item label="Position (Khmer)" name="position_km">
                <Input placeholder="ឧទាហរណ៍៖ ប្រធានអ្នកឆុងកាហ្វេ" />
              </Form.Item>
              <Form.Item label="Photo URL" name="photo_url" rules={[{ required: true }]}>
                <Input placeholder="https://..." />
              </Form.Item>
              <Form.Item label="Bio / Description" name="bio_en">
                <TextArea rows={2} />
              </Form.Item>
              <Form.Item label="Telegram Username" name="social_telegram">
                <Input placeholder="@username" />
              </Form.Item>
            </>
          )}

          {modalType === 'testimonial' && (
            <>
              <Form.Item label="Customer Name" name="author_name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Kosal Chea" />
              </Form.Item>
              <Form.Item label="Role / Title" name="author_role_en">
                <Input placeholder="e.g. Food Critic" />
              </Form.Item>
              <Form.Item label="Rating (1-5)" name="rating" initialValue={5}>
                <Rate />
              </Form.Item>
              <Form.Item label="Review Quote (English)" name="quote_en" rules={[{ required: true }]}>
                <TextArea rows={3} />
              </Form.Item>
              <Form.Item label="Review Quote (Khmer)" name="quote_km">
                <TextArea rows={3} />
              </Form.Item>
              <Form.Item label="Approved / Visible" name="is_approved" valuePropName="checked" initialValue={true}>
                <Switch />
              </Form.Item>
            </>
          )}

          {modalType === 'faq' && (
            <>
              <Form.Item label="Category" name="category" initialValue="General">
                <Input placeholder="e.g. Ordering, Dietary, Payments" />
              </Form.Item>
              <Form.Item label="Question (English)" name="question_en" rules={[{ required: true }]}>
                <Input placeholder="e.g. Can I order via Telegram?" />
              </Form.Item>
              <Form.Item label="Question (Khmer)" name="question_km">
                <Input placeholder="សំណួរជាភាសាខ្មែរ..." />
              </Form.Item>
              <Form.Item label="Answer (English)" name="answer_en" rules={[{ required: true }]}>
                <TextArea rows={4} />
              </Form.Item>
              <Form.Item label="Answer (Khmer)" name="answer_km">
                <TextArea rows={4} />
              </Form.Item>
            </>
          )}

          {modalType === 'partner' && (
            <>
              <Form.Item label="Partner / Brand Name" name="name" rules={[{ required: true }]}>
                <Input placeholder="e.g. ABA Bank" />
              </Form.Item>
              <Form.Item label="Logo Image URL" name="logo_url" rules={[{ required: true }]}>
                <Input placeholder="https://..." />
              </Form.Item>
              <Form.Item label="Website Link" name="website_url">
                <Input placeholder="https://..." />
              </Form.Item>
            </>
          )}

          {modalType === 'media' && (
            <>
              <Form.Item label="Asset File Name" name="file_name" rules={[{ required: true }]}>
                <Input placeholder="e.g. cold-brew-banner.jpg" />
              </Form.Item>
              <Form.Item label="Image File URL" name="file_path" rules={[{ required: true }]}>
                <Input placeholder="https://... or /assets/uploads/image.png" />
              </Form.Item>
              <Form.Item label="Alt Text / Caption" name="alt_text">
                <Input placeholder="e.g. Fresh iced cold brew" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    );
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 40 }}>
      {/* Header bar */}
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: adminTheme.text }}>
            <GlobalOutlined style={{ marginRight: 10, color: adminTheme.primary }} />
            Website CMS &amp; Front-End Command Center
          </Title>
          <Text style={{ color: adminTheme.subtext }}>
            Integrated digital control for multi-store concepts, live customer channels (Web E-Menu &amp; TMA), site branding, hero banners, pages, and media assets.
          </Text>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={fetchAllCmsData} loading={loading}>
            Refresh
          </Button>
          <Button href="/shop/sbc-store" target="_blank" icon={<MobileOutlined style={{ color: '#0284c7' }} />}>
            Open E-Menu
          </Button>
          <Button type="primary" href="/" target="_blank" icon={<EyeOutlined />} style={{ background: adminTheme.primary, borderColor: adminTheme.primary }}>
            View Public Website
          </Button>
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        type="card"
        tabBarStyle={{ marginBottom: 16 }}
        items={[
          {
            key: 'shop-settings',
            label: (
              <span style={{ fontWeight: 700 }}>
                <ShopOutlined /> Storefront Concepts &amp; Channels
              </span>
            ),
            children: (
              <div style={{ marginTop: 8 }}>
                <AdminFrontEndController embedded={true} />
              </div>
            ),
          },
          { key: 'cms-settings', label: <span><GlobalOutlined /> Site Settings &amp; Branding</span>, children: renderSettingsTab() },
          { key: 'cms-hero', label: <span><PictureOutlined /> Hero Banners &amp; Sliders</span>, children: renderHeroTab() },
          { key: 'cms-menus', label: <span><MenuOutlined /> Navigation Menus</span>, children: renderMenusTab() },
          { key: 'cms-pages', label: <span><FileTextOutlined /> Custom Pages</span>, children: renderPagesTab() },
          { key: 'cms-blog', label: <span><ReadOutlined /> Blog &amp; Articles</span>, children: renderPostsTab() },
          { key: 'cms-team', label: <span><TeamOutlined /> Team Members</span>, children: renderTeamTab() },
          { key: 'cms-testimonials', label: <span><CommentOutlined /> Testimonials</span>, children: renderTestimonialsTab() },
          { key: 'cms-faqs', label: <span><QuestionCircleOutlined /> FAQs</span>, children: renderFaqsTab() },
          { key: 'cms-partners', label: <span><ApartmentOutlined /> Partners</span>, children: renderPartnersTab() },
          {
            key: 'cms-inquiries',
            label: (
              <span>
                <MailOutlined /> Inquiries{' '}
                {inquiries.filter((i) => !i.is_read).length > 0 && (
                  <Badge count={inquiries.filter((i) => !i.is_read).length} size="small" />
                )}
              </span>
            ),
            children: renderInquiriesTab(),
          },
          { key: 'cms-subscribers', label: <span><UserAddOutlined /> Subscribers</span>, children: renderSubscribersTab() },
          {
            key: 'cms-qrcode',
            label: <span><QrcodeOutlined /> Store QR Codes</span>,
            children: (
              <div style={{ marginTop: 8 }}>
                <AdminQrCodeGenerator />
              </div>
            ),
          },
          { key: 'cms-media', label: <span><PictureOutlined /> Media Assets</span>, children: renderMediaTab() },
          { key: 'cms-database', label: <span><DatabaseOutlined /> Database &amp; Migration</span>, children: renderDatabaseTab() },
        ]}
      />

      {renderItemModal()}
    </div>
  );
}
