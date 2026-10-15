import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Input,
  Tag,
  Space,
  Flex,
  Modal,
  Form,
  Select,
  Switch,
  Typography,
  Tabs,
  Badge,
  Tooltip,
  Divider,
  Popconfirm,
  message,
  Statistic,
  Radio,
  InputNumber,
} from 'antd';
import {
  DesktopOutlined,
  MobileOutlined,
  ShopOutlined,
  EyeOutlined,
  EditOutlined,
  PlusOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  QrcodeOutlined,
  ThunderboltOutlined,
  PictureOutlined,
  SettingOutlined,
  LinkOutlined,
  CopyOutlined,
  GlobalOutlined,
  ReloadOutlined,
  StarFilled,
  FireFilled,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import simpleData from '../../../data/simpleData';
import { useAdminTheme } from '../../hooks/useAdminTheme';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const STORES_STORAGE_KEY = 'aura_admin_frontend_stores';
const PRODUCTS_STORAGE_KEY = 'aura_admin_frontend_products';

export default function AdminFrontEndController({ embedded = false }) {
  const adminTheme = useAdminTheme();
  const navigate = useNavigate();

  // Stores state with localStorage persistence
  const [stores, setStores] = useState(() => {
    try {
      const saved = localStorage.getItem(STORES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return simpleData.stores || [];
  });

  // Products state with localStorage persistence
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return simpleData.products || [];
  });

  // Selected store for management
  const [selectedStoreId, setSelectedStoreId] = useState(() => stores[0]?.id || 1);
  const [activeTab, setActiveTab] = useState('display');
  const [editStoreModalOpen, setEditStoreModalOpen] = useState(false);
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [editProductModalOpen, setEditProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [storeForm] = Form.useForm();
  const [productForm] = Form.useForm();

  // Currently active store object
  const currentStore = useMemo(() => {
    return stores.find((s) => s.id === selectedStoreId) || stores[0] || {};
  }, [stores, selectedStoreId]);

  // Products for the currently selected store
  const storeProducts = useMemo(() => {
    return products.filter((p) => Number(p.biller_id) === Number(currentStore.id));
  }, [products, currentStore]);

  // Persist stores changes
  const saveStores = (updated) => {
    setStores(updated);
    try {
      localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Persist products changes
  const saveProducts = (updated) => {
    setProducts(updated);
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Sync currentStore to form when modal opens
  useEffect(() => {
    if (editStoreModalOpen && currentStore) {
      storeForm.setFieldsValue({
        name: currentStore.name,
        company: currentStore.company,
        slug: currentStore.slug,
        tagline: currentStore.tagline,
        description: currentStore.description,
        theme_color: currentStore.theme_color || '#ea580c',
        theme_style: currentStore.theme_style || 'espresso',
        banner: currentStore.banner,
        logo: currentStore.logo,
        address: currentStore.address,
        phone: currentStore.phone,
        email: currentStore.email,
        operating_hours: currentStore.operating_hours || '7:00 AM - 9:00 PM',
        announcement: currentStore.announcement || 'Welcome to our specialty storefront! Fresh batches daily.',
        show_announcement: currentStore.show_announcement !== false,
        is_open: currentStore.is_open !== false,
        allow_delivery: currentStore.allow_delivery !== false,
        allow_dinein: currentStore.allow_dinein !== false,
      });
    }
  }, [editStoreModalOpen, currentStore, storeForm]);

  // Handle saving store settings
  const handleSaveStore = async () => {
    try {
      const values = await storeForm.validateFields();
      const updated = stores.map((s) =>
        s.id === currentStore.id ? { ...s, ...values } : s
      );
      saveStores(updated);
      message.success(`Updated display settings for "${values.name}"!`);
      setEditStoreModalOpen(false);
    } catch (err) {
      console.warn('Validate failed:', err);
    }
  };

  // Toggle product visibility
  const handleToggleProductStatus = (productId) => {
    const updated = products.map((p) =>
      p.id === productId ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p
    );
    saveProducts(updated);
    message.success('Product display status updated');
  };

  // Toggle featured status
  const handleToggleFeatured = (productId) => {
    const updated = products.map((p) =>
      p.id === productId ? { ...p, is_featured: !p.is_featured } : p
    );
    saveProducts(updated);
    message.success('Featured product updated');
  };

  // Save new product to current store
  const handleAddProduct = async () => {
    try {
      const values = await productForm.validateFields();
      const newId = products.length ? Math.max(...products.map((p) => p.id)) + 1 : 101;
      const newProd = {
        id: newId,
        biller_id: currentStore.id,
        name: values.name,
        code: values.code || `PRD-${newId}`,
        price: Number(values.price),
        category: values.category || 'Specialty Coffee',
        details: values.details || '',
        image: values.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
        status: values.status ? 'active' : 'inactive',
        is_featured: Boolean(values.is_featured),
      };
      saveProducts([...products, newProd]);
      message.success(`Added product "${values.name}" to ${currentStore.name}`);
      setAddProductModalOpen(false);
      productForm.resetFields();
    } catch (err) {
      console.warn('Add product error:', err);
    }
  };

  // Open edit product modal
  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    productForm.setFieldsValue({
      name: prod.name,
      code: prod.code,
      price: prod.price,
      category: prod.category,
      details: prod.details,
      image: prod.image,
      status: prod.status !== 'inactive',
      is_featured: Boolean(prod.is_featured),
    });
    setEditProductModalOpen(true);
  };

  // Save edited product
  const handleSaveEditProduct = async () => {
    try {
      const values = await productForm.validateFields();
      const updated = products.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              ...values,
              price: Number(values.price),
              status: values.status ? 'active' : 'inactive',
              is_featured: Boolean(values.is_featured),
            }
          : p
      );
      saveProducts(updated);
      message.success(`Updated "${values.name}"`);
      setEditProductModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      console.warn('Edit product error:', err);
    }
  };

  // Delete product
  const handleDeleteProduct = (productId) => {
    const updated = products.filter((p) => p.id !== productId);
    saveProducts(updated);
    message.success('Product deleted');
  };

  const copyStoreLink = (url) => {
    navigator.clipboard.writeText(url);
    message.success('Storefront URL copied to clipboard!');
  };

  const cardStyle = {
    borderRadius: 16,
    border: `1px solid ${adminTheme.border}`,
    background: adminTheme.card,
  };

  const productColumns = [
    {
      title: 'Item & Details',
      key: 'item',
      render: (_, record) => (
        <Flex align="center" gap={12}>
          <img
            src={record.image}
            alt={record.name}
            style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }}
          />
          <div>
            <Flex align="center" gap={6}>
              <Text strong style={{ color: adminTheme.text, fontSize: 13 }}>
                {record.name}
              </Text>
              {record.is_featured && (
                <Tag color="orange" style={{ margin: 0, fontSize: 10, borderRadius: 4 }}>
                  ★ FEATURED
                </Tag>
              )}
            </Flex>
            <Text style={{ fontSize: 11, color: adminTheme.subtext, display: 'block' }}>
              {record.details || record.category || 'Specialty item'}
            </Text>
          </div>
        </Flex>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (cat) => <Tag color="blue" style={{ borderRadius: 6 }}>{cat || 'Catalog'}</Tag>,
    },
    {
      title: 'Store Price',
      dataIndex: 'price',
      key: 'price',
      render: (price) => (
        <Text strong style={{ color: '#16a34a', fontSize: 13 }}>
          ${Number(price || 0).toFixed(2)}
        </Text>
      ),
    },
    {
      title: 'Storefront Display',
      key: 'status',
      width: 140,
      render: (_, record) => {
        const isActive = record.status !== 'inactive';
        return (
          <Switch
            checked={isActive}
            onChange={() => handleToggleProductStatus(record.id)}
            checkedChildren="SHOW"
            unCheckedChildren="HIDE"
            style={{ background: isActive ? '#16a34a' : '#94a3b8' }}
          />
        );
      },
    },
    {
      title: 'Featured',
      key: 'featured',
      width: 100,
      render: (_, record) => (
        <Button
          size="small"
          type={record.is_featured ? 'primary' : 'default'}
          icon={<StarFilled style={{ color: record.is_featured ? '#fff' : '#f59e0b' }} />}
          onClick={() => handleToggleFeatured(record.id)}
          style={record.is_featured ? { background: '#f59e0b', borderColor: '#f59e0b' } : {}}
        >
          {record.is_featured ? 'Top' : 'Pin'}
        </Button>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size={6}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenEditProduct(record)}
          />
          <Popconfirm
            title="Delete this product from store?"
            onConfirm={() => handleDeleteProduct(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" danger icon={<CloseCircleFilled />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      {/* 1. Header Banner */}
      {!embedded ? (
        <Flex justify="space-between" align="flex-start" wrap="wrap" gap={16}>
          <div>
            <Flex align="center" gap={10}>
              <Title level={3} style={{ margin: 0, color: adminTheme.text }}>
                Front End &amp; Storefront Display Controller
              </Title>
              <Tag color="purple" style={{ borderRadius: 8, fontWeight: 700, padding: '2px 10px' }}>
                Multi-Store Owner Control
              </Tag>
            </Flex>
            <Text style={{ color: adminTheme.subtext, fontSize: 13, marginTop: 4, display: 'block' }}>
              Control website and customer-facing E-Menu displays, branding banners, store visual themes, and catalog products across all Aura shops.
            </Text>
          </div>

          <Space size={10} wrap>
            {/* Active Store Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text strong style={{ color: adminTheme.text }}>Selected Store:</Text>
              <Select
                value={selectedStoreId}
                onChange={setSelectedStoreId}
                style={{ minWidth: 280 }}
                size="middle"
              >
                <Select.OptGroup label="🌟 Aura Global Flagship Stores">
                  {stores
                    .filter((s) => ['sbc-store', 'aura-bakery', 'aura-bistro', 'aura-lounge', 'aura-tech'].includes(s.slug))
                    .map((s) => (
                      <Option key={s.id} value={s.id}>
                        {s.name} (/{s.slug})
                      </Option>
                    ))}
                </Select.OptGroup>
                <Select.OptGroup label="🎨 UI Concept Demonstrations (Multi-Store)">
                  {stores
                    .filter((s) => !['sbc-store', 'aura-bakery', 'aura-bistro', 'aura-lounge', 'aura-tech'].includes(s.slug))
                    .map((s) => (
                      <Option key={s.id} value={s.id}>
                        {s.name} (/{s.slug})
                      </Option>
                    ))}
                </Select.OptGroup>
              </Select>
            </div>

            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setEditStoreModalOpen(true)}
              style={{ borderRadius: 10, fontWeight: 600, background: '#7c3aed', borderColor: '#7c3aed' }}
            >
              Edit Website Concept
            </Button>

            <Button
              icon={<PlusOutlined />}
              onClick={() => {
                productForm.resetFields();
                setAddProductModalOpen(true);
              }}
              style={{ borderRadius: 10, fontWeight: 600 }}
            >
              + Add Store Product
            </Button>
          </Space>
        </Flex>
      ) : (
        <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ paddingBottom: 6 }}>
          <div>
            <Text strong style={{ fontSize: 15, color: adminTheme.text }}>
              Storefront Concepts &amp; Product Display Manager
            </Text>
            <Text style={{ display: 'block', fontSize: 12, color: adminTheme.subtext }}>
              Manage multi-store branding, theme styles, live E-Menu &amp; TMA channels, and public product visibility.
            </Text>
          </div>

          <Space size={10} wrap>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text strong style={{ color: adminTheme.text, fontSize: 12.5 }}>Active Store:</Text>
              <Select
                value={selectedStoreId}
                onChange={setSelectedStoreId}
                style={{ minWidth: 260 }}
                size="middle"
              >
                <Select.OptGroup label="🌟 Aura Global Flagship Stores">
                  {stores
                    .filter((s) => ['sbc-store', 'aura-bakery', 'aura-bistro', 'aura-lounge', 'aura-tech'].includes(s.slug))
                    .map((s) => (
                      <Option key={s.id} value={s.id}>
                        {s.name} (/{s.slug})
                      </Option>
                    ))}
                </Select.OptGroup>
                <Select.OptGroup label="🎨 UI Concept Demonstrations (Multi-Store)">
                  {stores
                    .filter((s) => !['sbc-store', 'aura-bakery', 'aura-bistro', 'aura-lounge', 'aura-tech'].includes(s.slug))
                    .map((s) => (
                      <Option key={s.id} value={s.id}>
                        {s.name} (/{s.slug})
                      </Option>
                    ))}
                </Select.OptGroup>
              </Select>
            </div>

            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setEditStoreModalOpen(true)}
              style={{ borderRadius: 8, fontWeight: 600, background: '#7c3aed', borderColor: '#7c3aed' }}
            >
              Edit Store Concept
            </Button>

            <Button
              icon={<PlusOutlined />}
              onClick={() => {
                productForm.resetFields();
                setAddProductModalOpen(true);
              }}
              style={{ borderRadius: 8, fontWeight: 600 }}
            >
              + Add Product
            </Button>
          </Space>
        </Flex>
      )}

      {/* 2. Live Storefront Concept Overview Card */}
      <Card
        style={{
          ...cardStyle,
          background: `linear-gradient(135deg, ${currentStore.theme_color || '#ea580c'}15, transparent 65%), ${adminTheme.card}`,
          borderColor: `${currentStore.theme_color || '#ea580c'}44`,
        }}
        styles={{ body: { padding: 22 } }}
      >
        <Row gutter={[24, 20]} align="middle">
          <Col xs={24} md={8}>
            <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', height: 160 }}>
              <img
                src={currentStore.banner || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80'}
                alt={currentStore.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: 12,
                }}
              >
                <Flex align="center" gap={10}>
                  <img
                    src={currentStore.logo || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=300&q=80'}
                    alt="Logo"
                    style={{ width: 40, height: 40, borderRadius: 10, border: '2px solid white' }}
                  />
                  <div>
                    <Text strong style={{ color: 'white', fontSize: 14, display: 'block' }}>
                      {currentStore.name}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11 }}>
                      Slug: /{currentStore.slug}
                    </Text>
                  </div>
                </Flex>
              </div>
            </div>
          </Col>

          <Col xs={24} md={10}>
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              <Flex align="center" gap={8} wrap="wrap">
                <Title level={4} style={{ margin: 0, color: adminTheme.text }}>
                  {currentStore.name}
                </Title>
                {['sbc-store', 'aura-bakery', 'aura-bistro', 'aura-lounge', 'aura-tech'].includes(currentStore.slug) ? (
                  <Tag color="gold" style={{ borderRadius: 6, fontWeight: 700 }}>
                    🌟 AURA FLAGSHIP STORE
                  </Tag>
                ) : (
                  <Tag color="orange" style={{ borderRadius: 6, fontWeight: 700 }}>
                    🎨 UI CONCEPT DEMO ONLY
                  </Tag>
                )}
                <Tag color={currentStore.is_open ? 'green' : 'red'} style={{ borderRadius: 6, fontWeight: 700 }}>
                  {currentStore.is_open ? '● LIVE / OPEN' : 'CLOSED'}
                </Tag>
                <Tag color="purple" style={{ borderRadius: 6 }}>
                  Theme: {currentStore.theme_style || 'espresso'}
                </Tag>
              </Flex>
              <Text strong style={{ color: currentStore.theme_color || '#ea580c', fontSize: 13 }}>
                "{currentStore.tagline || 'Artisan Roasts & Dining'}"
              </Text>
              <Paragraph ellipsis={{ rows: 2 }} style={{ color: adminTheme.subtext, fontSize: 12, margin: 0 }}>
                {currentStore.description || 'Welcome to our specialty storefront.'}
              </Paragraph>
              <div style={{ marginTop: 4 }}>
                <Text style={{ fontSize: 11.5, color: adminTheme.subtext }}>
                  📍 {currentStore.address} &bull; 🕒 {currentStore.operating_hours || '7:00 AM - 9:00 PM'}
                </Text>
              </div>
            </Space>
          </Col>

          <Col xs={24} md={6}>
            <Card
              size="small"
              style={{ borderRadius: 12, background: 'rgba(0,0,0,0.03)', border: `1px solid ${adminTheme.border}` }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: adminTheme.subtext, marginBottom: 8 }}>
                LIVE STOREFRONT CHANNELS
              </div>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Tooltip title="Contactless browser digital E-Menu for table QR code guests">
                  <Button
                    block
                    size="small"
                    type="primary"
                    icon={<GlobalOutlined />}
                    onClick={() => window.open(`/shop/${currentStore.slug}`, '_blank')}
                    style={{ borderRadius: 8, background: '#2563eb' }}
                  >
                    Web E-Menu (/shop/...)
                  </Button>
                </Tooltip>
                <Button
                  block
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => copyStoreLink(`${window.location.origin}/shop/${currentStore.slug}`)}
                  style={{ borderRadius: 8 }}
                >
                  Copy E-Menu Direct Link
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 3. Main Workspace Tabs */}
      <Card style={cardStyle} styles={{ body: { padding: 20 } }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'display',
              label: (
                <span style={{ fontWeight: 600, fontSize: 13.5 }}>
                  <DesktopOutlined /> Website Display &amp; Visual Branding
                </span>
              ),
              children: (
                <Row gutter={[20, 20]} style={{ marginTop: 12 }}>
                  <Col xs={24} md={12}>
                    <Card
                      title="Hero Banner & Announcement"
                      size="small"
                      style={{ borderRadius: 12, border: `1px solid ${adminTheme.border}` }}
                    >
                      <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        <div>
                          <Text strong style={{ fontSize: 12 }}>Announcement Bar Alert:</Text>
                          <div style={{ padding: '8px 12px', background: '#fef3c7', color: '#92400e', borderRadius: 8, marginTop: 4, fontSize: 12 }}>
                            📢 {currentStore.announcement || 'Enjoy artisan roasts and seasonal bakery specials!'}
                          </div>
                        </div>

                        <div>
                          <Text strong style={{ fontSize: 12 }}>Visual Theme Color:</Text>
                          <Flex orientation="horizontal" gap={8} align="center" style={{ marginTop: 4 }}>
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                background: currentStore.theme_color || '#ea580c',
                                border: '1px solid rgba(0,0,0,0.1)',
                              }}
                            />
                            <Text code>{currentStore.theme_color || '#ea580c'}</Text>
                            <Tag color="cyan">{currentStore.theme_style || 'espresso'}</Tag>
                          </Flex>
                        </div>

                        <div>
                          <Text strong style={{ fontSize: 12 }}>Active Order Channels:</Text>
                          <Flex gap={8} style={{ marginTop: 4 }}>
                            <Tag color={currentStore.allow_delivery !== false ? 'green' : 'default'}>
                              {currentStore.allow_delivery !== false ? '✓ Delivery Allowed' : '✕ Delivery Disabled'}
                            </Tag>
                            <Tag color={currentStore.allow_dinein !== false ? 'green' : 'default'}>
                              {currentStore.allow_dinein !== false ? '✓ Dine-in & Table QR' : '✕ Dine-in Disabled'}
                            </Tag>
                          </Flex>
                        </div>
                      </Space>
                    </Card>
                  </Col>

                  <Col xs={24} md={12}>
                    <Card
                      title="Store Contact & Physical Details"
                      size="small"
                      style={{ borderRadius: 12, border: `1px solid ${adminTheme.border}` }}
                    >
                      <Space direction="vertical" size={10} style={{ width: '100%' }}>
                        <div>
                          <Text style={{ fontSize: 11, color: adminTheme.subtext }}>Official Registered Name:</Text>
                          <Text strong style={{ display: 'block', fontSize: 13 }}>
                            {currentStore.company || currentStore.name}
                          </Text>
                        </div>
                        <div>
                          <Text style={{ fontSize: 11, color: adminTheme.subtext }}>Location Address:</Text>
                          <Text style={{ display: 'block', fontSize: 12 }}>
                            {currentStore.address}
                          </Text>
                        </div>
                        <div>
                          <Text style={{ fontSize: 11, color: adminTheme.subtext }}>Store Phone & Email:</Text>
                          <Text style={{ display: 'block', fontSize: 12 }}>
                            {currentStore.phone} &bull; {currentStore.email}
                          </Text>
                        </div>
                      </Space>
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'products',
              label: (
                <span style={{ fontWeight: 600, fontSize: 13.5 }}>
                  <ShopOutlined /> Store Products Controller ({storeProducts.length})
                </span>
              ),
              children: (
                <Space direction="vertical" size={16} style={{ width: '100%', marginTop: 12 }}>
                  <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                    <div>
                      <Text strong style={{ fontSize: 14 }}>
                        Products Displayed in "{currentStore.name}"
                      </Text>
                      <Text style={{ fontSize: 12, color: adminTheme.subtext, display: 'block' }}>
                        Toggle products on/off for the public website and mark top items as Featured.
                      </Text>
                    </div>

                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        productForm.resetFields();
                        setAddProductModalOpen(true);
                      }}
                      style={{ borderRadius: 8, background: '#16a34a', borderColor: '#16a34a' }}
                    >
                      + Add New Product
                    </Button>
                  </Flex>

                  <Table
                    columns={productColumns}
                    dataSource={storeProducts}
                    rowKey="id"
                    pagination={{ pageSize: 8 }}
                  />
                </Space>
              ),
            },
            {
              key: 'all_stores',
              label: (
                <span style={{ fontWeight: 600, fontSize: 13.5 }}>
                  <GlobalOutlined /> All Stores Overview ({stores.length})
                </span>
              ),
              children: (
                <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
                  {stores.map((st) => (
                    <Col xs={24} sm={12} md={8} key={st.id}>
                      <Card
                        hoverable
                        onClick={() => setSelectedStoreId(st.id)}
                        style={{
                          borderRadius: 14,
                          border: selectedStoreId === st.id ? '2px solid #7c3aed' : `1px solid ${adminTheme.border}`,
                          background: adminTheme.card,
                        }}
                        styles={{ body: { padding: 14 } }}
                      >
                        <Flex align="center" gap={10}>
                          <img
                            src={st.logo}
                            alt={st.name}
                            style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }}
                          />
                          <div style={{ flex: 1 }}>
                            <Text strong style={{ fontSize: 13.5, color: adminTheme.text, display: 'block' }}>
                              {st.name}
                            </Text>
                            <Text style={{ fontSize: 11, color: adminTheme.subtext }}>
                              Slug: /{st.slug}
                            </Text>
                          </div>
                          {selectedStoreId === st.id && (
                            <Tag color="purple" style={{ margin: 0 }}>ACTIVE</Tag>
                          )}
                        </Flex>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ),
            },
          ]}
        />
      </Card>

      {/* 4. Modal: Edit Storefront Display Settings */}
      <Modal
        title={
          <Flex align="center" gap={8}>
            <DesktopOutlined style={{ color: '#7c3aed' }} />
            <span>Storefront Display &amp; Visual Concept Controller</span>
          </Flex>
        }
        open={editStoreModalOpen}
        onCancel={() => setEditStoreModalOpen(false)}
        onOk={handleSaveStore}
        okText="Save Storefront Settings"
        width={720}
        forceRender
      >
        <Form form={storeForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="name" label="Public Storefront Name" rules={[{ required: true }]}>
                <Input placeholder="Store Name" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="slug" label="URL Slug" rules={[{ required: true }]}>
                <Input placeholder="e.g. sbc-store" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="tagline" label="Hero Tagline">
                <Input placeholder="e.g. Artisan Highland Roasts & Specialty Espresso" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="theme_style" label="Visual Theme Preset">
                <Select>
                  <Option value="espresso">Espresso Warm</Option>
                  <Option value="rose">Rose Sunset</Option>
                  <Option value="emerald">Botanical Emerald</Option>
                  <Option value="cyan">Cyber Cyan</Option>
                  <Option value="minimal">Minimal Studio</Option>
                  <Option value="glass">Glassmorphism Translucent</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="theme_color" label="Theme Accent Color (HEX)">
                <Input placeholder="#ea580c" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="operating_hours" label="Operating Hours">
                <Input placeholder="6:30 AM - 8:30 PM" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="logo" label="Logo Image URL">
                <Input placeholder="https://..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="banner" label="Hero Banner Image URL">
                <Input placeholder="https://..." />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="announcement" label="Storefront Announcement Bar">
            <Input placeholder="e.g. Welcome! 20% off all artisan cold brews this week." />
          </Form.Item>

          <Form.Item name="description" label="Store Story & Description">
            <TextArea rows={2} placeholder="About this store..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="is_open" label="Store Open Status" valuePropName="checked">
                <Switch checkedChildren="OPEN" unCheckedChildren="CLOSED" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="allow_delivery" label="Delivery Channel" valuePropName="checked">
                <Switch checkedChildren="ENABLED" unCheckedChildren="DISABLED" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="allow_dinein" label="Table / Dine-in" valuePropName="checked">
                <Switch checkedChildren="ENABLED" unCheckedChildren="DISABLED" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 5. Modal: Add Product to Store */}
      <Modal
        title={
          <Flex align="center" gap={8}>
            <PlusOutlined style={{ color: '#16a34a' }} />
            <span>Add Product to "{currentStore.name}"</span>
          </Flex>
        }
        open={addProductModalOpen}
        onCancel={() => setAddProductModalOpen(false)}
        onOk={handleAddProduct}
        okText="Add Product"
        width={600}
        forceRender
      >
        <Form form={productForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="name" label="Product Name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Iced Coconut Cascara" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="price" label="Price ($ USD)" rules={[{ required: true }]}>
                <InputNumber min={0.5} step={0.25} style={{ width: '100%' }} placeholder="3.50" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="Category">
                <Input placeholder="e.g. Specialty Coffee" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="code" label="Item Code / SKU">
                <Input placeholder="e.g. PRD-201" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="details" label="Flavor Notes & Description">
            <TextArea rows={2} placeholder="e.g. Double shot ristretto with fresh coconut water." />
          </Form.Item>

          <Form.Item name="image" label="Photo URL">
            <Input placeholder="https://..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="Show on Storefront" valuePropName="checked" initialValue={true}>
                <Switch checkedChildren="VISIBLE" unCheckedChildren="HIDDEN" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_featured" label="Pin as Featured Item" valuePropName="checked" initialValue={false}>
                <Switch checkedChildren="FEATURED" unCheckedChildren="STANDARD" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 6. Modal: Edit Existing Product */}
      <Modal
        title={
          <Flex align="center" gap={8}>
            <EditOutlined style={{ color: '#2563eb' }} />
            <span>Edit Product</span>
          </Flex>
        }
        open={editProductModalOpen}
        onCancel={() => setEditProductModalOpen(false)}
        onOk={handleSaveEditProduct}
        okText="Save Product"
        width={600}
        forceRender
      >
        <Form form={productForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="name" label="Product Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="price" label="Price ($ USD)" rules={[{ required: true }]}>
                <InputNumber min={0.5} step={0.25} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="Category">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="code" label="Item Code / SKU">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="details" label="Flavor Notes & Description">
            <TextArea rows={2} />
          </Form.Item>

          <Form.Item name="image" label="Photo URL">
            <Input />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="Show on Storefront" valuePropName="checked">
                <Switch checkedChildren="VISIBLE" unCheckedChildren="HIDDEN" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_featured" label="Pin as Featured Item" valuePropName="checked">
                <Switch checkedChildren="FEATURED" unCheckedChildren="STANDARD" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Space>
  );
}
