import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  InputNumber,
  Select,
  Typography,
  message,
  Popconfirm,
  Tag
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useTranslation } from '../../../contexts/LanguageContext';

const { Title, Text } = Typography;
const { Option } = Select;

const AssetCategoriesPage = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [searchText, setSearchText] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/assets/categories', {
        params: { search: searchText || undefined }
      });
      if (res.data?.status) {
        setCategories(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching asset categories:', err);
      message.error(t('failed_fetch_categories', 'Failed to load asset categories.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    form.resetFields();
    form.setFieldsValue({
      useful_life_months: 36,
      depreciation_rate: 20.0,
      status: 'active'
    });
    setModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    form.resetFields();
    form.setFieldsValue({
      code: cat.code,
      name: cat.name,
      description: cat.description,
      useful_life_months: cat.useful_life_months,
      depreciation_rate: cat.depreciation_rate,
      status: cat.status
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingCategory) {
        const res = await axios.put(`/api/admin/assets/categories/${editingCategory.id}`, values);
        if (res.data?.status) {
          message.success(t('category_updated', 'Category updated successfully!'));
          setModalOpen(false);
          fetchCategories();
        }
      } else {
        const res = await axios.post('/api/admin/assets/categories', values);
        if (res.data?.status) {
          message.success(t('category_created', 'Category created successfully!'));
          setModalOpen(false);
          fetchCategories();
        }
      }
    } catch (err) {
      console.error('Error saving category:', err);
      message.error(err.response?.data?.message || err.message || 'Operation failed.');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`/api/admin/assets/categories/${id}`);
      if (res.data?.status) {
        message.success(t('category_deleted', 'Category deleted successfully!'));
        fetchCategories();
      }
    } catch (err) {
      message.error(err.response?.data?.message || err.message);
    }
  };

  const columns = [
    {
      title: t('code', 'Code'),
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (code) => <Tag color="blue">{code}</Tag>
    },
    {
      title: t('category_name', 'Category Name'),
      dataIndex: 'name',
      key: 'name',
      render: (name, r) => (
        <div>
          <Text strong style={{ fontSize: 14 }}>{name}</Text>
          {r.description && <div style={{ fontSize: 12, color: '#64748b' }}>{r.description}</div>}
        </div>
      )
    },
    {
      title: t('useful_life_months', 'Useful Life'),
      dataIndex: 'useful_life_months',
      key: 'useful_life_months',
      align: 'center',
      render: (months) => `${months} months (${(months / 12).toFixed(1)} yrs)`
    },
    {
      title: t('depreciation_rate', 'Depreciation Rate'),
      dataIndex: 'depreciation_rate',
      key: 'depreciation_rate',
      align: 'center',
      render: (rate) => `${parseFloat(rate || 0).toFixed(1)}% / yr`
    },
    {
      title: t('linked_assets', 'Linked Assets'),
      dataIndex: 'total_assets',
      key: 'total_assets',
      align: 'center',
      render: (count) => <Tag color="geekblue">{count || 0} assets</Tag>
    },
    {
      title: t('total_book_value', 'Total Net Book Value'),
      dataIndex: 'total_book_value',
      key: 'total_book_value',
      align: 'right',
      render: (val) => `$${(parseFloat(val) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    {
      title: t('status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (st) => (
        <Tag color={st === 'active' ? 'success' : 'default'}>
          {st ? st.toUpperCase() : 'ACTIVE'}
        </Tag>
      )
    },
    {
      title: t('actions', 'Actions'),
      key: 'actions',
      align: 'center',
      width: 120,
      render: (_, r) => (
        <Space size={6}>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(r)} />
          <Popconfirm
            title={t('confirm_delete_cat', 'Are you sure you want to delete this category?')}
            onConfirm={() => handleDelete(r.id)}
            okText={t('yes', 'Yes')}
            cancelText={t('no', 'No')}
          >
            <Button size="small" danger icon={<DeleteOutlined />} disabled={parseInt(r.total_assets, 10) > 0} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Card style={{ borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {t('asset_categories', 'Capital Asset Classification & Useful Life Rates')}
          </Title>
          <Text type="secondary">
            {t('asset_categories_desc', 'Standard asset categories, default amortization periods, and statutory depreciation rates.')}
          </Text>
        </div>
        <Space wrap>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openAddModal}
            style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
          >
            {t('add_category', 'New Asset Category')}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchCategories}>
            {t('refresh', 'Refresh')}
          </Button>
        </Space>
      </div>

      <div style={{ marginBottom: 16, maxWidth: 360 }}>
        <Input
          placeholder={t('search_category', 'Search category name or code...')}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onPressEnter={fetchCategories}
          allowClear
        />
      </div>

      <Table
        dataSource={categories}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="middle"
        pagination={false}
      />

      <Modal
        title={editingCategory ? t('edit_category', 'Edit Asset Category') : t('new_category', 'New Asset Category')}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText={t('save', 'Save Category')}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label={t('category_name', 'Category Name')} rules={[{ required: true, message: 'Category name is required' }]}>
            <Input placeholder="e.g. IT & Computing Equipment, Commercial Vehicles" />
          </Form.Item>

          <Form.Item name="code" label={t('category_code', 'Category Code (Unique)')}>
            <Input placeholder="e.g. CAT-IT, CAT-VEH" />
          </Form.Item>

          <Form.Item name="useful_life_months" label={t('useful_life_months', 'Default Useful Life (Months)')} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={1} placeholder="e.g. 36 (3 yrs), 60 (5 yrs)" />
          </Form.Item>

          <Form.Item name="depreciation_rate" label={t('depreciation_rate', 'Default Depreciation Rate (% / Year)')}>
            <InputNumber style={{ width: '100%' }} min={0} max={100} precision={2} placeholder="e.g. 20.00" />
          </Form.Item>

          <Form.Item name="description" label={t('description', 'Description / Scope')}>
            <Input.TextArea rows={2} placeholder="Equipment included in this category..." />
          </Form.Item>

          <Form.Item name="status" label={t('status', 'Status')}>
            <Select>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default AssetCategoriesPage;
