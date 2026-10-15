import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Tag,
  Space,
  Row,
  Col,
  Statistic,
  Typography,
  Avatar,
  Divider,
  Badge,
  Modal,
  App,
  Tooltip,
  Descriptions,
} from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
  PictureOutlined,
  AppstoreOutlined,
  CommentOutlined,
  BookOutlined,
  BarChartOutlined,
  SettingOutlined,
  PlusOutlined,
  DownloadOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  GlobalOutlined,
  SaveOutlined,
  FireOutlined,
  QrcodeOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminDataTable, { convertToCsv, downloadCsvFile } from '../../components/admins/AdminDataTable';
import AdminQrCodeGenerator from '../../components/admins/AdminQrCodeGenerator';
import { loadWebsiteData, saveWebsiteData } from '../../data/websiteDataManager';
import { useAdminTheme } from '../../hooks/useAdminTheme';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function AdminSimpleDataManager() {
  const adminTheme = useAdminTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // Active Section Tab (supports URL query ?section=posts or ?menu=...)
  const initialSection = searchParams.get('section') || searchParams.get('menu')?.replace(/^cms-/, '') || 'dashboard';
  const [activeTab, setActiveTab] = useState(initialSection);

  // App-level notification/message
  const { message } = App.useApp();

  // Central Dataset Store
  const [dataStore, setDataStore] = useState(loadWebsiteData);
  const [loading, setLoading] = useState(false);

  // Modals for Adding / Editing records
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [formModalType, setFormModalType] = useState(''); // 'user' | 'post' | 'story' | 'media' | 'category' | 'comment' | 'saved' | 'report'
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  // Keep in sync with query parameter
  useEffect(() => {
    const s = searchParams.get('section');
    if (s && s !== activeTab) {
      setActiveTab(s);
    }
  }, [location.search]);

  // Save changes to localStorage / in-memory store
  const persistChanges = (newStore) => {
    setDataStore(newStore);
    saveWebsiteData(newStore);
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    navigate(`/admins?module=data&section=${key}`);
  };

  // --------------------------------------------------------------------------
  // CREATE / EDIT ACTIONS
  // --------------------------------------------------------------------------
  const openCreateModal = (type) => {
    setFormModalType(type);
    setEditingRecord(null);
    form.resetFields();
    setFormModalVisible(true);
  };

  const openEditModal = (type, record) => {
    setFormModalType(type);
    setEditingRecord(record);
    setFormModalVisible(true);
    setTimeout(() => {
      form.setFieldsValue(record);
    }, 0);
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      const collectionKey = formModalType === 'story' ? 'stories' : `${formModalType}s`;
      const currentList = [...(dataStore[collectionKey] || [])];

      if (editingRecord) {
        // UPDATE existing record
        const index = currentList.findIndex((item) => item.id === editingRecord.id);
        if (index !== -1) {
          currentList[index] = {
            ...currentList[index],
            ...values,
            updated_at: new Date().toISOString().slice(0, 10),
          };
          const newStore = { ...dataStore, [collectionKey]: currentList };
          persistChanges(newStore);
          message.success(`${formModalType.toUpperCase()} updated successfully!`);
        }
      } else {
        // CREATE new record
        const newRecord = {
          ...values,
          id: Date.now(),
          created_at: new Date().toISOString().slice(0, 10),
          updated_at: new Date().toISOString().slice(0, 10),
          status: values.status || 'active',
        };
        const newStore = {
          ...dataStore,
          [collectionKey]: [newRecord, ...currentList],
        };
        persistChanges(newStore);
        message.success(`New ${formModalType} created successfully!`);
      }

      setFormModalVisible(false);
      form.resetFields();
    } catch (err) {
      console.warn('Form validation failed:', err);
    }
  };

  // --------------------------------------------------------------------------
  // DELETE & BULK DELETE ACTIONS
  // --------------------------------------------------------------------------
  const handleDeleteItem = (collectionKey, record) => {
    const currentList = dataStore[collectionKey] || [];
    const updated = currentList.filter((item) => item.id !== record.id);
    const newStore = { ...dataStore, [collectionKey]: updated };
    persistChanges(newStore);
    message.success('Record deleted successfully');
  };

  const handleBulkDelete = (collectionKey, selectedIds) => {
    const currentList = dataStore[collectionKey] || [];
    const updated = currentList.filter((item) => !selectedIds.includes(item.id));
    const newStore = { ...dataStore, [collectionKey]: updated };
    persistChanges(newStore);
    message.success(`Deleted ${selectedIds.length} records successfully!`);
  };

  const handleBulkStatusChange = (collectionKey, selectedIds, newStatus) => {
    const currentList = (dataStore[collectionKey] || []).map((item) => {
      if (selectedIds.includes(item.id)) {
        return { ...item, status: newStatus };
      }
      return item;
    });
    const newStore = { ...dataStore, [collectionKey]: currentList };
    persistChanges(newStore);
    message.success(`Updated status of ${selectedIds.length} records to "${newStatus}"!`);
  };

  const handleBulkImport = (collectionKey, importedRecords) => {
    const currentList = [...(dataStore[collectionKey] || [])];
    const timestamp = new Date().toISOString().slice(0, 10);
    const formattedRecords = importedRecords.map((rec, index) => ({
      ...rec,
      id: rec.id || (Date.now() + index),
      status: rec.status || 'active',
      created_at: rec.created_at || timestamp,
      updated_at: timestamp,
    }));

    const newStore = {
      ...dataStore,
      [collectionKey]: [...formattedRecords, ...currentList],
    };
    persistChanges(newStore);
    message.success(`Bulk import completed! Added ${formattedRecords.length} records to ${collectionKey}.`);
  };

  // --------------------------------------------------------------------------
  // SETTINGS SAVE
  // --------------------------------------------------------------------------
  const handleSaveSettings = (values) => {
    const newStore = {
      ...dataStore,
      settings: { ...dataStore.settings, ...values },
    };
    persistChanges(newStore);
    message.success('Website settings updated and published successfully!');
  };

  // --------------------------------------------------------------------------
  // GLOBAL EXPORT ALL DATA
  // --------------------------------------------------------------------------
  const handleExportAllCmsData = () => {
    const allRecords = [
      ...(dataStore.users || []).map((u) => ({ ...u, _table: 'Users' })),
      ...(dataStore.posts || []).map((p) => ({ ...p, _table: 'Posts' })),
      ...(dataStore.stories || []).map((s) => ({ ...s, _table: 'Stories' })),
      ...(dataStore.categories || []).map((c) => ({ ...c, _table: 'Categories' })),
    ];
    if (!allRecords.length) {
      message.warning('No records to export');
      return;
    }
    const cols = [
      { title: 'Table', dataIndex: '_table' },
      { title: 'ID', dataIndex: 'id' },
      { title: 'Name/Title', dataIndex: 'title' },
      { title: 'Category/Role', dataIndex: 'category' },
      { title: 'Status', dataIndex: 'status' },
      { title: 'Created Date', dataIndex: 'created_at' },
    ];
    const csv = convertToCsv(cols, allRecords);
    downloadCsvFile(csv, 'aura_website_complete_export');
    message.success(`Exported ${allRecords.length} records across all tables to CSV!`);
  };

  // --------------------------------------------------------------------------
  // DASHBOARD OVERVIEW TAB
  // --------------------------------------------------------------------------
  const renderDashboardTab = () => {
    const totalUsers = dataStore.users?.length || 0;
    const totalPosts = dataStore.posts?.length || 0;
    const totalStories = dataStore.stories?.length || 0;
    const totalMedia = dataStore.media?.length || 0;
    const totalCategories = dataStore.categories?.length || 0;
    const totalComments = dataStore.comments?.length || 0;

    const quickActionItems = [
      { label: 'Add New Post', icon: <FileTextOutlined />, color: '#2563eb', action: () => openCreateModal('post') },
      { label: 'QR Generator', icon: <QrcodeOutlined />, color: '#0284c7', action: () => handleTabChange('qrcode') },
      { label: 'Upload Media', icon: <PictureOutlined />, color: '#10b981', action: () => openCreateModal('media') },
      { label: 'Add Story', icon: <VideoCameraOutlined />, color: '#8b5cf6', action: () => openCreateModal('story') },
      { label: 'New Category', icon: <AppstoreOutlined />, color: '#f59e0b', action: () => openCreateModal('category') },
      { label: 'Add User', icon: <UserOutlined />, color: '#ec4899', action: () => openCreateModal('user') },
      { label: 'Export All CSV', icon: <DownloadOutlined />, color: '#06b6d4', action: handleExportAllCmsData },
    ];

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* KPI Stats Grid */}
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} lg={4}>
            <Card hoverable onClick={() => handleTabChange('users')} style={{ borderRadius: 12, borderTop: '4px solid #2563eb' }}>
              <Statistic
                title={<span style={{ fontWeight: 600 }}>Total Users</span>}
                value={totalUsers}
                prefix={<UserOutlined style={{ color: '#2563eb', marginRight: 6 }} />}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>3 Admins / {totalUsers} Total</Text>
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card hoverable onClick={() => handleTabChange('posts')} style={{ borderRadius: 12, borderTop: '4px solid #10b981' }}>
              <Statistic
                title={<span style={{ fontWeight: 600 }}>Total Posts</span>}
                value={totalPosts}
                prefix={<FileTextOutlined style={{ color: '#10b981', marginRight: 6 }} />}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>Articles & Guides</Text>
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card hoverable onClick={() => handleTabChange('stories')} style={{ borderRadius: 12, borderTop: '4px solid #8b5cf6' }}>
              <Statistic
                title={<span style={{ fontWeight: 600 }}>Total Stories</span>}
                value={totalStories}
                prefix={<VideoCameraOutlined style={{ color: '#8b5cf6', marginRight: 6 }} />}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>Active Visual Clips</Text>
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card hoverable onClick={() => handleTabChange('media')} style={{ borderRadius: 12, borderTop: '4px solid #f59e0b' }}>
              <Statistic
                title={<span style={{ fontWeight: 600 }}>Images / Media</span>}
                value={totalMedia}
                prefix={<PictureOutlined style={{ color: '#f59e0b', marginRight: 6 }} />}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>Assets in Library</Text>
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card hoverable onClick={() => handleTabChange('categories')} style={{ borderRadius: 12, borderTop: '4px solid #06b6d4' }}>
              <Statistic
                title={<span style={{ fontWeight: 600 }}>Total Categories</span>}
                value={totalCategories}
                prefix={<AppstoreOutlined style={{ color: '#06b6d4', marginRight: 6 }} />}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>Content Taxonomies</Text>
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card hoverable onClick={() => handleTabChange('comments')} style={{ borderRadius: 12, borderTop: '4px solid #ec4899' }}>
              <Statistic
                title={<span style={{ fontWeight: 600 }}>Total Comments</span>}
                value={totalComments}
                prefix={<CommentOutlined style={{ color: '#ec4899', marginRight: 6 }} />}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>Reader Feedback</Text>
            </Card>
          </Col>
        </Row>

        {/* Quick Actions Bar */}
        <Card title={<span><FireOutlined style={{ color: '#f59e0b', marginRight: 8 }} /> Quick Actions</span>} style={{ borderRadius: 12 }}>
          <Row gutter={[12, 12]}>
            {quickActionItems.map((qa, index) => (
              <Col xs={12} sm={8} md={4} key={index}>
                <Button
                  block
                  icon={qa.icon}
                  onClick={qa.action}
                  style={{
                    height: 48,
                    borderRadius: 8,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {qa.label}
                </Button>
              </Col>
            ))}
          </Row>
        </Card>

        {/* Recent Activity & Quick Preview */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card
              title={<span><ClockCircleOutlined style={{ marginRight: 8, color: '#2563eb' }} /> Recent Activity</span>}
              style={{ borderRadius: 12, height: '100%' }}
              extra={<Button type="link" onClick={() => handleTabChange('posts')}>View All</Button>}
            >
              <Space orientation="vertical" direction="vertical" style={{ width: '100%' }} size="middle">
                {(dataStore.posts || []).slice(0, 4).map((post) => (
                  <div
                    key={post.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: adminTheme.cardMuted,
                      borderRadius: 8,
                      border: `1px solid ${adminTheme.border}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img
                        src={post.image}
                        alt={post.title}
                        style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover' }}
                      />
                      <div>
                        <Text strong style={{ fontSize: 14, color: adminTheme.text }}>{post.title}</Text>
                        <div style={{ fontSize: 12, color: adminTheme.subtext }}>
                          By {post.author} • {post.category} • {post.created_at}
                        </div>
                      </div>
                    </div>
                    <Tag color={post.status === 'published' ? 'green' : 'orange'}>
                      {post.status.toUpperCase()}
                    </Tag>
                  </div>
                ))}
              </Space>
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card
              title={<span><GlobalOutlined style={{ marginRight: 8, color: '#10b981' }} /> Website Live Status</span>}
              style={{ borderRadius: 12, height: '100%' }}
            >
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Website Name">{dataStore.settings?.site_name || 'Aura Global'}</Descriptions.Item>
                <Descriptions.Item label="Tagline">{dataStore.settings?.site_tagline}</Descriptions.Item>
                <Descriptions.Item label="Public URL">
                  <a href="/" target="_blank" rel="noreferrer">Open Customer Website ↗</a>
                </Descriptions.Item>
                <Descriptions.Item label="Data Synchronization">
                  <Badge status="processing" text="Real-time Client & API Connected" />
                </Descriptions.Item>
                <Descriptions.Item label="Contact Support">{dataStore.settings?.email}</Descriptions.Item>
              </Descriptions>

              <Button
                type="primary"
                block
                icon={<SettingOutlined />}
                onClick={() => handleTabChange('settings')}
                style={{ marginTop: 16, borderRadius: 8, background: '#2563eb' }}
              >
                Configure Website Settings
              </Button>
            </Card>
          </Col>
        </Row>
      </Space>
    );
  };

  // --------------------------------------------------------------------------
  // USERS TABLE
  // --------------------------------------------------------------------------
  const renderUsersTable = () => {
    const columns = [
      {
        title: 'User',
        key: 'user',
        render: (_, record) => (
          <Space>
            <Avatar src={record.avatar} icon={<UserOutlined />} />
            <div>
              <Text strong style={{ color: adminTheme.text }}>{record.name}</Text>
              <div style={{ fontSize: 12, color: adminTheme.subtext }}>@{record.username}</div>
            </div>
          </Space>
        ),
      },
      { title: 'Email', dataIndex: 'email', key: 'email' },
      {
        title: 'Role',
        dataIndex: 'role',
        key: 'role',
        render: (role) => (
          <Tag color={role === 'Super Admin' ? 'purple' : role === 'Content Editor' ? 'blue' : 'default'}>
            {role}
          </Tag>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status) => (
          <Tag color={status === 'active' ? 'success' : status === 'pending' ? 'warning' : 'default'}>
            {status?.toUpperCase()}
          </Tag>
        ),
      },
      { title: 'Joined', dataIndex: 'joined_date', key: 'joined_date' },
      { title: 'Last Active', dataIndex: 'last_login', key: 'last_login' },
    ];

    return (
      <AdminDataTable
        title="Website Users & Administrators"
        description="Manage user credentials, permission roles, and account statuses."
        columns={columns}
        dataSource={dataStore.users || []}
        exportFileName="website_users"
        addLabel="Add New User"
        onAdd={() => openCreateModal('user')}
        onBulkImport={(records) => handleBulkImport('users', records)}
        onEdit={(record) => openEditModal('user', record)}
        onDelete={(record) => handleDeleteItem('users', record)}
        onBulkDelete={(ids) => handleBulkDelete('users', ids)}
        onBulkStatusChange={(ids, status) => handleBulkStatusChange('users', ids, status)}
        filters={[
          {
            key: 'role',
            label: 'Role',
            options: [
              { label: 'Super Admin', value: 'Super Admin' },
              { label: 'Content Editor', value: 'Content Editor' },
              { label: 'Store Manager', value: 'Store Manager' },
              { label: 'Member', value: 'Member' },
            ],
          },
          {
            key: 'status',
            label: 'Status',
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Pending', value: 'pending' },
              { label: 'Inactive', value: 'inactive' },
            ],
          },
        ]}
      />
    );
  };

  // --------------------------------------------------------------------------
  // POSTS TABLE
  // --------------------------------------------------------------------------
  const renderPostsTable = () => {
    const columns = [
      {
        title: 'Article / Post',
        key: 'title',
        render: (_, record) => (
          <Space align="start">
            <img
              src={record.image}
              alt={record.title}
              style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover' }}
            />
            <div>
              <Text strong style={{ color: adminTheme.text }}>{record.title}</Text>
              <div style={{ fontSize: 12, color: adminTheme.subtext, maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {record.excerpt}
              </div>
            </div>
          </Space>
        ),
      },
      { title: 'Category', dataIndex: 'category', key: 'category', render: (cat) => <Tag color="geekblue">{cat}</Tag> },
      { title: 'Author', dataIndex: 'author', key: 'author' },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status) => (
          <Tag color={status === 'published' ? 'green' : status === 'scheduled' ? 'blue' : 'orange'}>
            {status?.toUpperCase()}
          </Tag>
        ),
      },
      { title: 'Views', dataIndex: 'views', key: 'views', sorter: (a, b) => a.views - b.views },
      { title: 'Published Date', dataIndex: 'created_at', key: 'created_at' },
    ];

    return (
      <AdminDataTable
        title="Articles, Guides & Blog Posts"
        description="Publish editorial articles, brewing tutorials, and announcements to the public site."
        columns={columns}
        dataSource={dataStore.posts || []}
        exportFileName="website_posts"
        addLabel="Add New Post"
        onAdd={() => openCreateModal('post')}
        onBulkImport={(records) => handleBulkImport('posts', records)}
        onEdit={(record) => openEditModal('post', record)}
        onDelete={(record) => handleDeleteItem('posts', record)}
        onBulkDelete={(ids) => handleBulkDelete('posts', ids)}
        onBulkStatusChange={(ids, status) => handleBulkStatusChange('posts', ids, status)}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { label: 'Published', value: 'published' },
              { label: 'Draft', value: 'draft' },
              { label: 'Scheduled', value: 'scheduled' },
            ],
          },
          {
            key: 'category',
            label: 'Category',
            options: (dataStore.categories || []).map((c) => ({ label: c.name, value: c.name })),
          },
        ]}
      />
    );
  };

  // --------------------------------------------------------------------------
  // STORIES TABLE
  // --------------------------------------------------------------------------
  const renderStoriesTable = () => {
    const columns = [
      {
        title: 'Story / Preview',
        key: 'story',
        render: (_, record) => (
          <Space>
            <img
              src={record.media_url}
              alt={record.title}
              style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover' }}
            />
            <div>
              <Text strong style={{ color: adminTheme.text }}>{record.title}</Text>
              <div style={{ fontSize: 12, color: adminTheme.subtext }}>
                Format: {record.media_type} • Duration: {record.duration}
              </div>
            </div>
          </Space>
        ),
      },
      { title: 'Category', dataIndex: 'category', key: 'category', render: (c) => <Tag color="purple">{c}</Tag> },
      { title: 'Author', dataIndex: 'author', key: 'author' },
      { title: 'Views', dataIndex: 'views', key: 'views', sorter: (a, b) => a.views - b.views },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status) => (
          <Tag color={status === 'active' ? 'green' : 'default'}>{status?.toUpperCase()}</Tag>
        ),
      },
      { title: 'Created', dataIndex: 'created_at', key: 'created_at' },
    ];

    return (
      <AdminDataTable
        title="Visual Stories & Shorts"
        description="Manage short-form video stories and image highlights displayed on the home page."
        columns={columns}
        dataSource={dataStore.stories || []}
        exportFileName="website_stories"
        addLabel="Add New Story"
        onAdd={() => openCreateModal('story')}
        onBulkImport={(records) => handleBulkImport('stories', records)}
        onEdit={(record) => openEditModal('story', record)}
        onDelete={(record) => handleDeleteItem('stories', record)}
        onBulkDelete={(ids) => handleBulkDelete('stories', ids)}
        onBulkStatusChange={(ids, status) => handleBulkStatusChange('stories', ids, status)}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ],
          },
        ]}
      />
    );
  };

  // --------------------------------------------------------------------------
  // MEDIA TABLE
  // --------------------------------------------------------------------------
  const renderMediaTable = () => {
    const columns = [
      {
        title: 'Asset Preview',
        key: 'preview',
        render: (_, record) => (
          <Space>
            <img
              src={record.url}
              alt={record.title}
              style={{ width: 54, height: 44, borderRadius: 6, objectFit: 'cover', border: '1px solid #e2e8f0' }}
            />
            <div>
              <Text strong>{record.title}</Text>
              <div style={{ fontSize: 11, color: '#94a3b8', maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {record.url}
              </div>
            </div>
          </Space>
        ),
      },
      { title: 'Category', dataIndex: 'category', key: 'category', render: (c) => <Tag color="blue">{c}</Tag> },
      { title: 'Dimensions', dataIndex: 'dimensions', key: 'dimensions' },
      { title: 'File Size', dataIndex: 'size', key: 'size' },
      { title: 'Uploaded By', dataIndex: 'author', key: 'author' },
      { title: 'Upload Date', dataIndex: 'created_at', key: 'created_at' },
    ];

    return (
      <AdminDataTable
        title="Images & Media Assets"
        description="Central asset library for banners, logos, coffee roasts, and website media."
        columns={columns}
        dataSource={dataStore.media || []}
        exportFileName="website_media_assets"
        addLabel="Upload Asset"
        onAdd={() => openCreateModal('media')}
        onBulkImport={(records) => handleBulkImport('media', records)}
        onEdit={(record) => openEditModal('media', record)}
        onDelete={(record) => handleDeleteItem('media', record)}
        onBulkDelete={(ids) => handleBulkDelete('media', ids)}
        filters={[
          {
            key: 'category',
            label: 'Category',
            options: [
              { label: 'Products', value: 'Products' },
              { label: 'Banners', value: 'Banners' },
              { label: 'Gallery', value: 'Gallery' },
              { label: 'Locations', value: 'Locations' },
            ],
          },
        ]}
      />
    );
  };

  // --------------------------------------------------------------------------
  // CATEGORIES TABLE
  // --------------------------------------------------------------------------
  const renderCategoriesTable = () => {
    const columns = [
      { title: 'Category Name', dataIndex: 'name', key: 'name', render: (text) => <b>{text}</b> },
      { title: 'Slug', dataIndex: 'slug', key: 'slug', render: (slug) => <Tag color="cyan">{slug}</Tag> },
      { title: 'Description', dataIndex: 'description', key: 'description' },
      { title: 'Total Items', dataIndex: 'count', key: 'count', sorter: (a, b) => a.count - b.count },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status) => (
          <Tag color={status === 'active' ? 'green' : 'default'}>{status?.toUpperCase()}</Tag>
        ),
      },
      { title: 'Created', dataIndex: 'created_at', key: 'created_at' },
    ];

    return (
      <AdminDataTable
        title="Website Content Categories"
        description="Taxonomies for grouping blog posts, e-menu products, and store resources."
        columns={columns}
        dataSource={dataStore.categories || []}
        exportFileName="website_categories"
        addLabel="Add Category"
        onAdd={() => openCreateModal('category')}
        onBulkImport={(records) => handleBulkImport('categories', records)}
        onEdit={(record) => openEditModal('category', record)}
        onDelete={(record) => handleDeleteItem('categories', record)}
        onBulkDelete={(ids) => handleBulkDelete('categories', ids)}
        onBulkStatusChange={(ids, status) => handleBulkStatusChange('categories', ids, status)}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ],
          },
        ]}
      />
    );
  };

  // --------------------------------------------------------------------------
  // COMMENTS TABLE
  // --------------------------------------------------------------------------
  const renderCommentsTable = () => {
    const columns = [
      { title: 'Target Article', dataIndex: 'post_title', key: 'post_title', render: (t) => <Text strong>{t}</Text> },
      {
        title: 'Author',
        key: 'author',
        render: (_, record) => (
          <div>
            <div>{record.author_name}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{record.author_email}</div>
          </div>
        ),
      },
      {
        title: 'Comment Content',
        dataIndex: 'content',
        key: 'content',
        render: (c) => <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0 }}>{c}</Paragraph>,
      },
      { title: 'Rating', dataIndex: 'rating', key: 'rating', render: (r) => <Tag color="gold">★ {r}/5</Tag> },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status) => {
          const color = status === 'approved' ? 'green' : status === 'pending' ? 'orange' : 'red';
          return <Tag color={color}>{status?.toUpperCase()}</Tag>;
        },
      },
      { title: 'Timestamp', dataIndex: 'created_at', key: 'created_at' },
    ];

    return (
      <AdminDataTable
        title="Customer Reviews & Comments"
        description="Moderate customer comments, approve reviews, or mark spam."
        columns={columns}
        dataSource={dataStore.comments || []}
        exportFileName="website_comments"
        addLabel="Add Test Comment"
        onAdd={() => openCreateModal('comment')}
        onBulkImport={(records) => handleBulkImport('comments', records)}
        onEdit={(record) => openEditModal('comment', record)}
        onDelete={(record) => handleDeleteItem('comments', record)}
        onBulkDelete={(ids) => handleBulkDelete('comments', ids)}
        onBulkStatusChange={(ids, status) => handleBulkStatusChange('comments', ids, status)}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { label: 'Approved', value: 'approved' },
              { label: 'Pending', value: 'pending' },
              { label: 'Spam', value: 'spam' },
            ],
          },
        ]}
      />
    );
  };

  // --------------------------------------------------------------------------
  // SAVED ITEMS TABLE
  // --------------------------------------------------------------------------
  const renderSavedItemsTable = () => {
    const columns = [
      { title: 'User Account', dataIndex: 'user_name', key: 'user_name', render: (u) => <b>{u}</b> },
      { title: 'Item Title', dataIndex: 'item_title', key: 'item_title' },
      { title: 'Item Type', dataIndex: 'item_type', key: 'item_type', render: (t) => <Tag color="purple">{t}</Tag> },
      { title: 'Admin Note', dataIndex: 'note', key: 'note' },
      { title: 'Saved Date', dataIndex: 'saved_date', key: 'saved_date' },
    ];

    return (
      <AdminDataTable
        title="Saved Items & Wishlists"
        description="Customer bookmarks, saved brewing recipes, and wishlist entries."
        columns={columns}
        dataSource={dataStore.savedItems || []}
        exportFileName="website_saved_items"
        addLabel="Add Bookmark"
        onAdd={() => openCreateModal('saved')}
        onBulkImport={(records) => handleBulkImport('savedItems', records)}
        onEdit={(record) => openEditModal('saved', record)}
        onDelete={(record) => handleDeleteItem('savedItems', record)}
        onBulkDelete={(ids) => handleBulkDelete('savedItems', ids)}
      />
    );
  };

  // --------------------------------------------------------------------------
  // REPORTS TABLE
  // --------------------------------------------------------------------------
  const renderReportsTable = () => {
    const columns = [
      { title: 'Report Title', dataIndex: 'report_title', key: 'report_title', render: (t) => <b>{t}</b> },
      { title: 'Type', dataIndex: 'type', key: 'type', render: (t) => <Tag color="blue">{t}</Tag> },
      { title: 'Generated By', dataIndex: 'generated_by', key: 'generated_by' },
      { title: 'Reporting Period', dataIndex: 'period', key: 'period' },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status) => (
          <Tag color={status === 'completed' ? 'success' : 'processing'}>
            {status?.toUpperCase()}
          </Tag>
        ),
      },
      { title: 'Format', dataIndex: 'file_format', key: 'file_format' },
      { title: 'Generated Date', dataIndex: 'created_at', key: 'created_at' },
    ];

    return (
      <AdminDataTable
        title="Audit & Engagement Reports"
        description="Download and manage website analytics, visitor logs, and export summaries."
        columns={columns}
        dataSource={dataStore.reports || []}
        exportFileName="website_reports"
        addLabel="Generate Report"
        onAdd={() => openCreateModal('report')}
        onBulkImport={(records) => handleBulkImport('reports', records)}
        onEdit={(record) => openEditModal('report', record)}
        onDelete={(record) => handleDeleteItem('reports', record)}
        onBulkDelete={(ids) => handleBulkDelete('reports', ids)}
      />
    );
  };

  // --------------------------------------------------------------------------
  // SETTINGS TAB
  // --------------------------------------------------------------------------
  const renderSettingsTab = () => {
    return (
      <Card
        title={<span><GlobalOutlined style={{ marginRight: 8, color: '#2563eb' }} /> Global Website Settings & Branding</span>}
        style={{ borderRadius: 12 }}
      >
        <Form
          layout="vertical"
          initialValues={dataStore.settings}
          onFinish={handleSaveSettings}
        >
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item label="Website Name" name="site_name" rules={[{ required: true }]}>
                <Input placeholder="Aura Global" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Tagline" name="site_tagline">
                <Input placeholder="Specialty Coffee, Artisanal Bakery & Modern Living" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item label="Brand Logo Image URL" name="logo_url" rules={[{ required: true }]}>
                <Input placeholder="https://..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Favicon URL" name="favicon_url">
                <Input placeholder="/favicon.ico" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Contact Information</Divider>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item label="Official Phone" name="phone">
                <Input placeholder="+855 12 345 678" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Support Email" name="email" rules={[{ type: 'email' }]}>
                <Input placeholder="contact@auraglobal.com" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24}>
              <Form.Item label="Headquarters Address" name="address">
                <Input placeholder="No. 128 Preah Norodom Blvd, Phnom Penh, Cambodia" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Footer & SEO Meta</Divider>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item label="Footer Copyright Notice" name="footer_text">
                <Input placeholder="© 2026 Aura Global. All rights reserved." />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="SEO Meta Title" name="seo_meta_title">
                <Input placeholder="Aura Global - Coffee & Lifestyle" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="SEO Meta Description" name="seo_meta_description">
                <TextArea rows={2} placeholder="Meta description shown in search engine results..." />
              </Form.Item>
            </Col>
          </Row>

          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            size="large"
            style={{ borderRadius: 8, background: '#2563eb' }}
          >
            Save & Publish Settings
          </Button>
        </Form>
      </Card>
    );
  };

  // --------------------------------------------------------------------------
  // MASTER TABS CONFIG
  // --------------------------------------------------------------------------
  const tabsItems = [
    { key: 'dashboard', label: <span><DashboardOutlined /> Dashboard</span>, children: renderDashboardTab() },
    { key: 'users', label: <span><UserOutlined /> Users ({dataStore.users?.length || 0})</span>, children: renderUsersTable() },
    { key: 'posts', label: <span><FileTextOutlined /> Posts ({dataStore.posts?.length || 0})</span>, children: renderPostsTable() },
    { key: 'stories', label: <span><VideoCameraOutlined /> Stories ({dataStore.stories?.length || 0})</span>, children: renderStoriesTable() },
    { key: 'media', label: <span><PictureOutlined /> Media ({dataStore.media?.length || 0})</span>, children: renderMediaTable() },
    { key: 'categories', label: <span><AppstoreOutlined /> Categories ({dataStore.categories?.length || 0})</span>, children: renderCategoriesTable() },
    { key: 'comments', label: <span><CommentOutlined /> Comments ({dataStore.comments?.length || 0})</span>, children: renderCommentsTable() },
    { key: 'saved', label: <span><BookOutlined /> Saved Items ({dataStore.savedItems?.length || 0})</span>, children: renderSavedItemsTable() },
    { key: 'reports', label: <span><BarChartOutlined /> Reports ({dataStore.reports?.length || 0})</span>, children: renderReportsTable() },
    { key: 'qrcode', label: <span><QrcodeOutlined /> QR Code Generator</span>, children: <AdminQrCodeGenerator /> },
    { key: 'settings', label: <span><SettingOutlined /> Website Settings</span>, children: renderSettingsTab() },
  ];

  return (
    <div style={{ padding: '4px 0 24px 0' }}>
      {/* Top Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
          borderRadius: 14,
          padding: '24px 28px',
          color: '#ffffff',
          marginBottom: 20,
          boxShadow: '0 4px 12px rgba(37,99,235,0.18)',
        }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Title level={3} style={{ color: '#ffffff', margin: 0, fontWeight: 700 }}>
              Website Data Management Panel
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.85)', margin: '6px 0 0 0', fontSize: 14 }}>
              Centralized interface for viewing, filtering, editing, and bulk exporting all website data across Users, Posts, Stories, Media, and Categories.
            </Paragraph>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space wrap size="middle">
              <Button
                icon={<QrcodeOutlined />}
                onClick={() => handleTabChange('qrcode')}
                style={{
                  background: '#38bdf8',
                  borderColor: '#38bdf8',
                  color: '#0f172a',
                  borderRadius: 8,
                  fontWeight: 600,
                }}
              >
                QR Code Tool
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExportAllCmsData}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderColor: 'rgba(255,255,255,0.4)',
                  color: '#ffffff',
                  borderRadius: 8,
                  fontWeight: 500,
                }}
              >
                Export All (CSV)
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={tabsItems}
        size="large"
        tabBarStyle={{
          background: adminTheme.card,
          padding: '0 16px',
          borderRadius: 10,
          border: `1px solid ${adminTheme.border}`,
          marginBottom: 16,
        }}
      />

      {/* Modal Form for Add & Edit */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {editingRecord ? <SettingOutlined style={{ color: '#d97706' }} /> : <PlusOutlined style={{ color: '#2563eb' }} />}
            <span>
              {editingRecord ? `Edit ${formModalType.toUpperCase()} Record` : `Add New ${formModalType.toUpperCase()}`}
            </span>
          </div>
        }
        open={formModalVisible}
        forceRender
        onCancel={() => setFormModalVisible(false)}
        onOk={handleFormSubmit}
        okText={editingRecord ? 'Save Changes' : 'Create Record'}
        width={680}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {formModalType === 'user' && (
            <>
              <Form.Item label="Full Name" name="name" rules={[{ required: true }]}>
                <Input placeholder="e.g. John Doe" />
              </Form.Item>
              <Form.Item label="Username" name="username" rules={[{ required: true }]}>
                <Input placeholder="e.g. john.doe" />
              </Form.Item>
              <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
                <Input placeholder="john@example.com" />
              </Form.Item>
              <Form.Item label="Role" name="role" initialValue="Member">
                <Select>
                  <Option value="Super Admin">Super Admin</Option>
                  <Option value="Content Editor">Content Editor</Option>
                  <Option value="Store Manager">Store Manager</Option>
                  <Option value="Member">Member</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Status" name="status" initialValue="active">
                <Select>
                  <Option value="active">Active</Option>
                  <Option value="pending">Pending</Option>
                  <Option value="inactive">Inactive</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Avatar Image URL" name="avatar">
                <Input placeholder="https://images.unsplash.com/..." />
              </Form.Item>
            </>
          )}

          {formModalType === 'post' && (
            <>
              <Form.Item label="Article Title" name="title" rules={[{ required: true }]}>
                <Input placeholder="e.g. The Secrets to Colombian Cold Brew" />
              </Form.Item>
              <Form.Item label="Category" name="category" rules={[{ required: true }]}>
                <Select>
                  {(dataStore.categories || []).map((cat) => (
                    <Option key={cat.id} value={cat.name}>{cat.name}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="Author" name="author" initialValue="Admin Aura">
                <Input placeholder="Author name" />
              </Form.Item>
              <Form.Item label="Status" name="status" initialValue="published">
                <Select>
                  <Option value="published">Published</Option>
                  <Option value="draft">Draft</Option>
                  <Option value="scheduled">Scheduled</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Featured Image URL" name="image" rules={[{ required: true }]}>
                <Input placeholder="https://images.unsplash.com/..." />
              </Form.Item>
              <Form.Item label="Excerpt / Short Summary" name="excerpt">
                <TextArea rows={2} placeholder="Brief preview text..." />
              </Form.Item>
            </>
          )}

          {formModalType === 'story' && (
            <>
              <Form.Item label="Story Title" name="title" rules={[{ required: true }]}>
                <Input placeholder="e.g. Roasting Batch #42 Morning Prep" />
              </Form.Item>
              <Form.Item label="Category" name="category" initialValue="Roastery">
                <Input placeholder="e.g. Roastery, Barista, Cafe" />
              </Form.Item>
              <Form.Item label="Media Type" name="media_type" initialValue="image">
                <Select>
                  <Option value="image">Image</Option>
                  <Option value="video">Video</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Media URL" name="media_url" rules={[{ required: true }]}>
                <Input placeholder="https://..." />
              </Form.Item>
              <Form.Item label="Author" name="author" initialValue="Admin Aura">
                <Input placeholder="Author name" />
              </Form.Item>
              <Form.Item label="Duration" name="duration" initialValue="15s">
                <Input placeholder="e.g. 15s, 30s" />
              </Form.Item>
              <Form.Item label="Status" name="status" initialValue="active">
                <Select>
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                </Select>
              </Form.Item>
            </>
          )}

          {formModalType === 'media' && (
            <>
              <Form.Item label="Media Title" name="title" rules={[{ required: true }]}>
                <Input placeholder="e.g. Signature Espresso Roasted Bag" />
              </Form.Item>
              <Form.Item label="Asset URL" name="url" rules={[{ required: true }]}>
                <Input placeholder="https://images.unsplash.com/..." />
              </Form.Item>
              <Form.Item label="Category" name="category" initialValue="Products">
                <Select>
                  <Option value="Products">Products</Option>
                  <Option value="Banners">Banners</Option>
                  <Option value="Gallery">Gallery</Option>
                  <Option value="Locations">Locations</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Dimensions" name="dimensions" initialValue="1920x1080">
                <Input placeholder="e.g. 1920x1080" />
              </Form.Item>
              <Form.Item label="File Size" name="size" initialValue="1.2 MB">
                <Input placeholder="e.g. 1.2 MB" />
              </Form.Item>
              <Form.Item label="Uploaded By" name="author" initialValue="Admin Aura">
                <Input placeholder="Admin Aura" />
              </Form.Item>
            </>
          )}

          {formModalType === 'category' && (
            <>
              <Form.Item label="Category Name" name="name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Cold Brew & Iced Coffee" />
              </Form.Item>
              <Form.Item label="Slug (URL identifier)" name="slug" rules={[{ required: true }]}>
                <Input placeholder="e.g. cold-brew-iced-coffee" />
              </Form.Item>
              <Form.Item label="Description" name="description">
                <TextArea rows={2} placeholder="Category description..." />
              </Form.Item>
              <Form.Item label="Status" name="status" initialValue="active">
                <Select>
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                </Select>
              </Form.Item>
            </>
          )}

          {formModalType === 'comment' && (
            <>
              <Form.Item label="Target Article" name="post_title" rules={[{ required: true }]}>
                <Input placeholder="Article title" />
              </Form.Item>
              <Form.Item label="Author Name" name="author_name" rules={[{ required: true }]}>
                <Input placeholder="Reviewer name" />
              </Form.Item>
              <Form.Item label="Author Email" name="author_email" rules={[{ required: true, type: 'email' }]}>
                <Input placeholder="reviewer@example.com" />
              </Form.Item>
              <Form.Item label="Comment Content" name="content" rules={[{ required: true }]}>
                <TextArea rows={3} placeholder="Customer review or feedback..." />
              </Form.Item>
              <Form.Item label="Rating" name="rating" initialValue={5}>
                <InputNumber min={1} max={5} />
              </Form.Item>
              <Form.Item label="Moderation Status" name="status" initialValue="approved">
                <Select>
                  <Option value="approved">Approved</Option>
                  <Option value="pending">Pending</Option>
                  <Option value="spam">Spam</Option>
                </Select>
              </Form.Item>
            </>
          )}

          {formModalType === 'saved' && (
            <>
              <Form.Item label="User Account" name="user_name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Admin Aura" />
              </Form.Item>
              <Form.Item label="Item Title" name="item_title" rules={[{ required: true }]}>
                <Input placeholder="Saved item title" />
              </Form.Item>
              <Form.Item label="Item Type" name="item_type" initialValue="Post">
                <Select>
                  <Option value="Post">Post</Option>
                  <Option value="Story">Story</Option>
                  <Option value="Media Asset">Media Asset</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Admin Note" name="note">
                <Input placeholder="Reference note..." />
              </Form.Item>
            </>
          )}

          {formModalType === 'report' && (
            <>
              <Form.Item label="Report Title" name="report_title" rules={[{ required: true }]}>
                <Input placeholder="e.g. Quarterly Content Performance Summary" />
              </Form.Item>
              <Form.Item label="Type" name="type" initialValue="Analytics">
                <Select>
                  <Option value="Analytics">Analytics</Option>
                  <Option value="Editorial">Editorial</Option>
                  <Option value="Customer Experience">Customer Experience</Option>
                  <Option value="Infrastructure">Infrastructure</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Reporting Period" name="period" initialValue="Last 30 Days">
                <Input placeholder="e.g. September 2026, Q3 2026" />
              </Form.Item>
              <Form.Item label="Status" name="status" initialValue="completed">
                <Select>
                  <Option value="completed">Completed</Option>
                  <Option value="processing">Processing</Option>
                </Select>
              </Form.Item>
              <Form.Item label="File Format" name="file_format" initialValue="CSV">
                <Input placeholder="CSV, PDF, JSON" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}
