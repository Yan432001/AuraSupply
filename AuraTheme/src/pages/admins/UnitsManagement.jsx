import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Space,
  Typography,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Tooltip,
  Divider,
  Alert
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BlockOutlined,
  ApartmentOutlined,
  ReloadOutlined,
  SearchOutlined,
  CalculatorOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { useTranslation } from '../../contexts/LanguageContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function UnitsManagement() {
  const adminTheme = useAdminTheme();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState([]);
  const [baseUnits, setBaseUnits] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form] = Form.useForm();
  const selectedBaseUnit = Form.useWatch('base_unit', form);
  const selectedOperator = Form.useWatch('operator', form) || '*';
  const inputOpValue = Form.useWatch('operation_value', form) || '1';
  const inputName = Form.useWatch('name', form) || '';

  // Load units from API
  const fetchUnits = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/units');
      if (res.data?.status && Array.isArray(res.data.data)) {
        setUnits(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load units:', err);
      message.error(t('error_loading_units', 'Failed to load units from server'));
    } finally {
      setLoading(false);
    }
  };

  // Load base units for parent unit dropdown
  const fetchBaseUnits = async () => {
    try {
      const res = await axios.get('/api/admin/units/base');
      if (res.data?.status && Array.isArray(res.data.data)) {
        setBaseUnits(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load base units:', err);
    }
  };

  useEffect(() => {
    fetchUnits();
    fetchBaseUnits();
  }, []);

  const openAddModal = () => {
    setEditingUnit(null);
    form.resetFields();
    form.setFieldsValue({
      base_unit: 0,
      operator: '*',
      operation_value: '1'
    });
    setModalVisible(true);
  };

  const openEditModal = (record) => {
    setEditingUnit(record);
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      base_unit: record.base_unit || 0,
      operator: record.operator || '*',
      operation_value: record.operation_value || '1'
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const payload = {
        code: values.code,
        name: values.name,
        base_unit: values.base_unit > 0 ? values.base_unit : null,
        operator: values.base_unit > 0 ? values.operator : null,
        operation_value: values.base_unit > 0 ? values.operation_value : null
      };

      if (editingUnit) {
        const res = await axios.put(`/api/admin/units/${editingUnit.id}`, payload);
        if (res.data?.status) {
          message.success(t('unit_updated', 'Unit updated successfully'));
          setModalVisible(false);
          fetchUnits();
          fetchBaseUnits();
        } else {
          message.error(res.data?.message || t('error_updating_unit', 'Failed to update unit'));
        }
      } else {
        const res = await axios.post('/api/admin/units', payload);
        if (res.data?.status) {
          message.success(t('unit_created', 'Unit created successfully'));
          setModalVisible(false);
          fetchUnits();
          fetchBaseUnits();
        } else {
          message.error(res.data?.message || t('error_creating_unit', 'Failed to create unit'));
        }
      }
    } catch (err) {
      console.error('Save unit error:', err);
      if (err.response?.data?.message) {
        message.error(err.response.data.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`/api/admin/units/${id}`);
      if (res.data?.status) {
        message.success(t('unit_deleted', 'Unit deleted successfully'));
        fetchUnits();
        fetchBaseUnits();
      } else {
        message.error(res.data?.message || t('error_deleting_unit', 'Failed to delete unit'));
      }
    } catch (err) {
      console.error('Delete unit error:', err);
      message.error(err.response?.data?.message || t('error_deleting_unit', 'Failed to delete unit'));
    }
  };

  // Filtered units
  const filteredUnits = useMemo(() => {
    if (!searchText.trim()) return units;
    const q = searchText.toLowerCase();
    return units.filter(
      (u) =>
        u.code?.toLowerCase().includes(q) ||
        u.name?.toLowerCase().includes(q) ||
        u.base_unit_name?.toLowerCase().includes(q)
    );
  }, [units, searchText]);

  // Summary statistics
  const stats = useMemo(() => {
    const total = units.length;
    const baseCount = units.filter((u) => !u.base_unit).length;
    const subCount = total - baseCount;
    return { total, baseCount, subCount };
  }, [units]);

  // Selected parent unit name for live formula preview
  const parentUnitObj = useMemo(() => {
    return baseUnits.find((b) => b.id === selectedBaseUnit);
  }, [baseUnits, selectedBaseUnit]);

  const columns = [
    {
      title: t('unit_code', 'Unit Code'),
      dataIndex: 'code',
      key: 'code',
      width: 140,
      render: (code) => <Tag color="blue" style={{ fontWeight: 600, fontSize: 13, padding: '2px 8px' }}>{code}</Tag>
    },
    {
      title: t('unit_name', 'Unit Name'),
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div>
          <Text strong style={{ color: adminTheme.text, fontSize: 14 }}>{name}</Text>
          {record.sub_unit_count > 0 && (
            <div style={{ marginTop: 2 }}>
              <Tag color="cyan" style={{ fontSize: 11 }}>
                <ApartmentOutlined /> {record.sub_unit_count} {t('derived_units', 'Sub-units')}
              </Tag>
            </div>
          )}
        </div>
      )
    },
    {
      title: t('base_unit', 'Base Unit / Type'),
      dataIndex: 'base_unit_name',
      key: 'base_unit_name',
      width: 180,
      render: (baseName, record) => {
        if (!record.base_unit) {
          return (
            <Tag color="green" style={{ fontWeight: 700, padding: '3px 10px', borderRadius: 12 }}>
              <CheckCircleOutlined /> {t('primary_base_unit', 'Base Unit')}
            </Tag>
          );
        }
        return (
          <Space>
            <ApartmentOutlined style={{ color: '#0284c7' }} />
            <Text style={{ color: adminTheme.text }}>
              {baseName || 'Unit #' + record.base_unit} ({record.base_unit_code || ''})
            </Text>
          </Space>
        );
      }
    },
    {
      title: t('operator', 'Operator'),
      dataIndex: 'operator',
      key: 'operator',
      width: 100,
      align: 'center',
      render: (op) =>
        op ? (
          <Tag color="purple" style={{ fontWeight: 800, fontSize: 14, minWidth: 28, textAlign: 'center' }}>
            {op}
          </Tag>
        ) : (
          <Text type="secondary">—</Text>
        )
    },
    {
      title: t('operation_value', 'Operation Value'),
      dataIndex: 'operation_value',
      key: 'operation_value',
      width: 140,
      render: (val) =>
        val ? (
          <Text strong style={{ color: adminTheme.text, fontSize: 14 }}>
            {val}
          </Text>
        ) : (
          <Text type="secondary">1 (Root)</Text>
        )
    },
    {
      title: t('conversion_ratio', 'Conversion Ratio'),
      key: 'conversion',
      render: (_, record) => {
        if (!record.base_unit) {
          return (
            <Text type="secondary" style={{ fontStyle: 'italic', fontSize: 12.5 }}>
              1 {record.name} = 1.0 (Root)
            </Text>
          );
        }
        return (
          <Tag color="geekblue" style={{ fontSize: 12.5, padding: '3px 10px', borderRadius: 6 }}>
            1 {record.name} = {record.operation_value} × {record.base_unit_name || record.base_unit_code}
          </Tag>
        );
      }
    },
    {
      title: t('usage', 'Products'),
      dataIndex: 'product_count',
      key: 'product_count',
      width: 100,
      align: 'center',
      render: (count) => (
        <Tag color={count > 0 ? 'volcano' : 'default'} style={{ borderRadius: 10 }}>
          {count || 0} {t('products', 'items')}
        </Tag>
      )
    },
    {
      title: t('actions', 'Actions'),
      key: 'actions',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title={t('edit_unit', 'Edit Unit')}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#0284c7' }} />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          <Tooltip title={t('delete_unit', 'Delete Unit')}>
            <Popconfirm
              title={t('confirm_delete_unit', 'Are you sure you want to delete this unit?')}
              description={t('delete_unit_warning', 'Ensure no products or sub-units depend on it.')}
              okText={t('yes', 'Yes')}
              cancelText={t('no', 'No')}
              onConfirm={() => handleDelete(record.id)}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      {/* Header and Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Text style={{ color: adminTheme.subtext, fontSize: 12.5 }}>
            {t('settings', 'Settings')} / {t('catalog_master_data', 'Catalog Master Data')} / {t('units', 'Units')}
          </Text>
          <Title level={4} style={{ margin: '2px 0 0', color: adminTheme.text }}>
            <BlockOutlined style={{ marginRight: 8, color: '#0284c7' }} />
            {t('unit_management_title', 'Product Units & Measurement Management')}
          </Title>
          <Paragraph style={{ margin: '4px 0 0', color: adminTheme.subtext, fontSize: 13 }}>
            {t('unit_management_desc', 'Standardize unit conversions, multipliers, and packaging specifications replicated from AURA_v1.')}
          </Paragraph>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchUnits(); fetchBaseUnits(); }} loading={loading}>
            {t('refresh', 'Refresh')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal} style={{ background: '#0284c7' }}>
            {t('add_unit', 'Add Unit')}
          </Button>
        </Space>
      </div>

      {/* KPI Highlights */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card
            style={{
              background: adminTheme.card,
              border: `1px solid ${adminTheme.border}`,
              borderRadius: 14,
              boxShadow: adminTheme.shadow
            }}
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Statistic
              title={<span style={{ color: adminTheme.subtext, fontSize: 13 }}>{t('total_units', 'Total Units')}</span>}
              value={stats.total}
              prefix={<BlockOutlined style={{ color: '#0284c7' }} />}
              valueStyle={{ color: adminTheme.text, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            style={{
              background: adminTheme.card,
              border: `1px solid ${adminTheme.border}`,
              borderRadius: 14,
              boxShadow: adminTheme.shadow
            }}
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Statistic
              title={<span style={{ color: adminTheme.subtext, fontSize: 13 }}>{t('base_units', 'Base Units (Root)')}</span>}
              value={stats.baseCount}
              prefix={<CheckCircleOutlined style={{ color: '#16a34a' }} />}
              valueStyle={{ color: '#16a34a', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            style={{
              background: adminTheme.card,
              border: `1px solid ${adminTheme.border}`,
              borderRadius: 14,
              boxShadow: adminTheme.shadow
            }}
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Statistic
              title={<span style={{ color: adminTheme.subtext, fontSize: 13 }}>{t('derived_units', 'Derived Sub-Units')}</span>}
              value={stats.subCount}
              prefix={<ApartmentOutlined style={{ color: '#8b5cf6' }} />}
              valueStyle={{ color: '#8b5cf6', fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Units Table Card */}
      <Card
        style={{
          background: adminTheme.card,
          border: `1px solid ${adminTheme.border}`,
          borderRadius: 16,
          boxShadow: adminTheme.shadow
        }}
        styles={{ body: { padding: 20 } }}
      >
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Input
            placeholder={t('search_units', 'Search unit by code, name, or base unit...')}
            prefix={<SearchOutlined style={{ color: adminTheme.subtext }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ maxWidth: 360, borderRadius: 8 }}
            allowClear
          />
          <Text style={{ color: adminTheme.subtext, fontSize: 13 }}>
            {t('showing_units', `Showing ${filteredUnits.length} of ${units.length} units`)}
          </Text>
        </div>

        <Table
          columns={columns}
          dataSource={filteredUnits}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15, showSizeChanger: true }}
          style={{ background: 'transparent' }}
          scroll={{ x: 650 }}
        />
      </Card>

      {/* Add / Edit Unit Modal */}
      <Modal
        title={
          <Space>
            <BlockOutlined style={{ color: '#0284c7' }} />
            <span>{editingUnit ? t('edit_unit', 'Edit Unit') : t('add_unit', 'Add Unit')}</span>
          </Space>
        }
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        confirmLoading={saving}
        okText={editingUnit ? t('save_changes', 'Save Changes') : t('create_unit', 'Create Unit')}
        cancelText={t('cancel', 'Cancel')}
        destroyOnHidden
        width={560}
      >
        <Alert
          message={t('unit_definition_tip', 'Unit Definition Standard (AURA_v1)')}
          description={t(
            'unit_definition_desc',
            'If this is a base unit (e.g. Piece, Can, Gram), select "None / Base Unit". If this is a derived packaging (e.g. Case of 24 Cans, Box of 50), choose the Base Unit and set the operator & multiplier.'
          )}
          type="info"
          showIcon
          style={{ marginBottom: 20, borderRadius: 10 }}
        />

        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label={<span style={{ fontWeight: 600 }}>{t('unit_code', 'Unit Code')}</span>}
                rules={[{ required: true, message: t('code_required', 'Unit code is required') }]}
              >
                <Input placeholder="e.g. Case, Box_24, Kg, Can" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label={<span style={{ fontWeight: 600 }}>{t('unit_name', 'Unit Name')}</span>}
                rules={[{ required: true, message: t('name_required', 'Unit name is required') }]}
              >
                <Input placeholder="e.g. Case of 24, Kilogram, Bottle" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="base_unit"
            label={<span style={{ fontWeight: 600 }}>{t('base_unit', 'Base Unit')}</span>}
            tooltip={t('base_unit_tooltip', 'Select the parent unit to which this unit is converted.')}
          >
            <Select placeholder={t('select_unit', 'Select unit')}>
              <Option value={0}>
                <span style={{ fontWeight: 700, color: '#16a34a' }}>
                  ✓ {t('none_base_unit', 'None / Primary Base Unit (e.g. Piece, Can, Gram)')}
                </span>
              </Option>
              {baseUnits
                .filter((bu) => !editingUnit || bu.id !== editingUnit.id)
                .map((bu) => (
                  <Option key={bu.id} value={bu.id}>
                    {bu.name} ({bu.code})
                  </Option>
                ))}
            </Select>
          </Form.Item>

          {/* Conditional Measuring section matching AURA_v1 add_unit.php */}
          {selectedBaseUnit > 0 && (
            <div
              style={{
                background: adminTheme.subtle,
                border: `1px solid ${adminTheme.border}`,
                borderRadius: 12,
                padding: 16,
                marginTop: 8
              }}
            >
              <Text strong style={{ display: 'block', marginBottom: 12, color: adminTheme.text }}>
                <CalculatorOutlined style={{ marginRight: 6, color: '#0284c7' }} />
                {t('unit_measuring_conversion', 'Measuring & Conversion Rules')}
              </Text>

              <Row gutter={16}>
                <Col span={10}>
                  <Form.Item
                    name="operator"
                    label={<span style={{ fontWeight: 600 }}>{t('operator', 'Operator')}</span>}
                    rules={[{ required: true }]}
                  >
                    <Select>
                      <Option value="*">* ({t('multiply', 'Multiply')})</Option>
                      <Option value="/">/ ({t('divide', 'Divide')})</Option>
                      <Option value="+">+ ({t('add', 'Add')})</Option>
                      <Option value="-">- ({t('subtract', 'Subtract')})</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={14}>
                  <Form.Item
                    name="operation_value"
                    label={<span style={{ fontWeight: 600 }}>{t('operation_value', 'Operation Value (Ratio)')}</span>}
                    rules={[{ required: true, message: t('val_required', 'Operation value is required') }]}
                  >
                    <Input placeholder="e.g. 24, 1000, 50" />
                  </Form.Item>
                </Col>
              </Row>

              {/* Dynamic conversion preview */}
              <div
                style={{
                  background: adminTheme.card,
                  borderRadius: 8,
                  padding: '10px 14px',
                  border: `1px dashed ${adminTheme.border}`
                }}
              >
                <Text style={{ fontSize: 13, color: adminTheme.subtext }}>
                  {t('formula_preview', 'Formula Preview')}:{' '}
                </Text>
                <Text strong style={{ fontSize: 14, color: '#0284c7' }}>
                  1 {inputName || 'Unit'} = {inputOpValue} {selectedOperator}{' '}
                  {parentUnitObj?.name || parentUnitObj?.code || 'Base Unit'}
                </Text>
              </div>
            </div>
          )}
        </Form>
      </Modal>
    </Space>
  );
}
