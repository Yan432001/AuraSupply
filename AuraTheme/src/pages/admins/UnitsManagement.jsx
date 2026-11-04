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
  Dropdown,
  Row,
  Col,
  Statistic,
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
  CheckCircleOutlined,
  FileExcelOutlined,
  DownOutlined,
  SettingOutlined,
  FolderOpenOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';
import axios from 'axios';
import TableActionDropdown from '../../components/common/TableActionDropdown';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { useTranslation } from '../../contexts/LanguageContext';
import { unitToBaseQty } from '../../utils/unitConverter';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

/**
 * UnitsManagement (http://localhost:5173/admins?module=settings&menu=units)
 * Replicates admin/system_settings/units from AURA_v1:
 * - Controller: bpas/controllers/admin/System_settings.php (units, getUnits, add_unit, edit_unit, delete_unit, unit_actions)
 * - Model: bpas/models/admin/Settings_model.php & bpas/models/Site.php (addUnit, updateUnit, deleteUnit, getUnitChildren, getAllBaseUnits, getUnitByID, getUnitsByBUID)
 * - Views: themes/default/admin/views/settings/units.php, add_unit.php, edit_unit.php
 */
export default function UnitsManagement() {
  const adminTheme = useAdminTheme();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState([]);
  const [baseUnits, setBaseUnits] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [baseUnitFilter, setBaseUnitFilter] = useState('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form] = Form.useForm();
  const selectedBaseUnit = Form.useWatch('base_unit', form);
  const selectedOperator = Form.useWatch('operator', form) || '*';
  const inputOpValue = Form.useWatch('operation_value', form) || '1';
  const inputName = Form.useWatch('name', form) || '';

  // Load units from API (replicates System_settings::getUnits)
  const fetchUnits = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/units');
      const rows = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : [];
      setUnits(rows);
    } catch (err) {
      console.error('Failed to load units:', err);
      message.error(t('error_loading_units', 'Failed to load units from server'));
    } finally {
      setLoading(false);
    }
  };

  // Load base units for parent unit dropdown (replicates Site::getAllBaseUnits)
  const fetchBaseUnits = async () => {
    try {
      const res = await axios.get('/api/admin/units/base');
      const rows = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : [];
      setBaseUnits(rows);
    } catch (err) {
      console.error('Failed to load base units:', err);
    }
  };

  useEffect(() => {
    fetchUnits();
    fetchBaseUnits();
  }, []);

  // Replicates System_settings::add_unit() modal open
  const openAddModal = (presetBaseUnitId = 0) => {
    setEditingUnit(null);
    form.resetFields();
    const isSub = Number(presetBaseUnitId) > 0;
    form.setFieldsValue({
      code: '',
      name: '',
      base_unit: isSub ? Number(presetBaseUnitId) : 0,
      operator: isSub ? '*' : null,
      operation_value: isSub ? '1' : null
    });
    setModalVisible(true);
  };

  // Replicates System_settings::edit_unit($id) modal open
  const openEditModal = (record) => {
    setEditingUnit(record);
    const hasBase = record.base_unit && Number(record.base_unit) > 0;
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      base_unit: hasBase ? Number(record.base_unit) : 0,
      operator: hasBase ? (record.operator || '*') : null,
      operation_value: hasBase ? (record.operation_value ?? '1') : null
    });
    setModalVisible(true);
  };

  // Replicates add_unit.php / edit_unit.php $('#base_unit').change() behavior:
  // If id > 0 -> $('#measuring').slideDown(), else $('#measuring').slideUp()
  const handleBaseUnitChange = (val) => {
    if (!val || Number(val) <= 0) {
      form.setFieldsValue({
        base_unit: 0,
        operator: null,
        operation_value: null
      });
    } else {
      const currOp = form.getFieldValue('operator');
      const currVal = form.getFieldValue('operation_value');
      form.setFieldsValue({
        base_unit: Number(val),
        operator: currOp || '*',
        operation_value: currVal || '1'
      });
    }
  };

  // Replicates System_settings::add_unit() and System_settings::edit_unit($id)
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const isSubUnit = values.base_unit && Number(values.base_unit) > 0;
      const payload = {
        code: String(values.code).trim(),
        name: String(values.name).trim(),
        base_unit: isSubUnit ? Number(values.base_unit) : null,
        operator: isSubUnit ? values.operator : null,
        unit_value: isSubUnit ? String(values.operation_value).trim() : null,
        operation_value: isSubUnit ? String(values.operation_value).trim() : null
      };

      if (editingUnit) {
        const res = await axios.put(`/api/admin/units/${editingUnit.id}`, payload);
        if (res.data?.status) {
          message.success(res.data?.message || t('unit_updated', 'Unit successfully updated'));
          setModalVisible(false);
          fetchUnits();
          fetchBaseUnits();
        } else {
          message.error(res.data?.message || t('error_updating_unit', 'Failed to update unit'));
        }
      } else {
        const res = await axios.post('/api/admin/units', payload);
        if (res.data?.status) {
          message.success(res.data?.message || t('unit_added', 'Unit successfully added'));
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

  // Replicates System_settings::delete_unit($id) (checks getUnitChildren($id) first)
  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`/api/admin/units/${id}`);
      if (res.data?.error === 0 || res.data?.status === true) {
        message.success(res.data?.msg || res.data?.message || t('unit_deleted', 'Unit successfully deleted'));
        setSelectedRowKeys((prev) => prev.filter((k) => k !== id));
        fetchUnits();
        fetchBaseUnits();
      } else {
        message.error(res.data?.msg || res.data?.message || t('unit_has_subunit', 'Unit can not be deleted! Unit has sub-units.'));
      }
    } catch (err) {
      message.error(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          t('unit_has_subunit', 'Unit can not be deleted! Unit has sub-units.')
      );
    }
  };

  // Replicates System_settings::unit_actions() -> form_action = 'delete'
  const handleBulkDelete = () => {
    if (!selectedRowKeys.length) {
      message.error(t('no_record_selected', 'No record selected, please select at least one row'));
      return;
    }

    Modal.confirm({
      title: t('delete_units', 'Delete Units'),
      content: t(
        'r_u_sure',
        "Are you sure you want to delete the selected unit(s)?"
      ),
      okText: t('i_m_sure', "Yes I'm sure"),
      okType: 'danger',
      cancelText: t('no', 'No'),
      onOk: async () => {
        try {
          const res = await axios.post('/api/admin/units/actions', {
            form_action: 'delete',
            val: selectedRowKeys
          });
          if (res.data?.status) {
            message.success(res.data.message || t('units_deleted', 'Units successfully deleted'));
            setSelectedRowKeys([]);
            fetchUnits();
            fetchBaseUnits();
          } else {
            message.error(res.data?.message || t('error_deleting_unit', 'Failed to delete units'));
          }
        } catch (err) {
          message.error(err.response?.data?.message || t('error_deleting_unit', 'Failed to delete units'));
        }
      }
    });
  };

  // Replicates System_settings::unit_actions() -> form_action = 'export_excel'
  // Exports columns: Code, Name, Base Unit, Operator, Operation Value
  const handleExportExcel = async () => {
    try {
      const targetIds =
        selectedRowKeys.length > 0 ? selectedRowKeys : filteredUnits.map((u) => u.id);

      if (!targetIds.length) {
        message.error(t('no_record_selected', 'No record selected, please select at least one row'));
        return;
      }

      const res = await axios.post('/api/admin/units/actions', {
        form_action: 'export_excel',
        val: targetIds
      });

      const rows = res.data?.data || [];
      const headers = [
        t('unit_code', 'Unit Code'),
        t('unit_name', 'Unit Name'),
        t('base_unit', 'Base Unit'),
        t('operator', 'Operator'),
        t('operation_value', 'Operation Value')
      ];
      const csvLines = [
        headers.join(','),
        ...rows.map((r) =>
          [
            `"${(r.code || '').replace(/"/g, '""')}"`,
            `"${(r.name || '').replace(/"/g, '""')}"`,
            `"${(r.base_unit || '').replace(/"/g, '""')}"`,
            `"${r.operator || ''}"`,
            `"${r.operation_value || ''}"`
          ].join(',')
        )
      ];

      const blob = new Blob(['\uFEFF' + csvLines.join('\n')], {
        type: 'text/csv;charset=utf-8;'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `units_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success(t('export_success', `Exported ${rows.length} unit(s) to Excel file`));
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to export units');
    }
  };

  // Filtered units
  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      if (baseUnitFilter === 'root' && u.base_unit) return false;
      if (baseUnitFilter === 'sub' && !u.base_unit) return false;
      if (
        baseUnitFilter !== 'all' &&
        baseUnitFilter !== 'root' &&
        baseUnitFilter !== 'sub' &&
        Number(u.base_unit) !== Number(baseUnitFilter) &&
        Number(u.id) !== Number(baseUnitFilter)
      ) {
        return false;
      }

      if (!searchText.trim()) return true;
      const q = searchText.toLowerCase();
      return (
        u.code?.toLowerCase().includes(q) ||
        u.name?.toLowerCase().includes(q) ||
        u.base_unit_name?.toLowerCase().includes(q) ||
        u.base_unit_code?.toLowerCase().includes(q) ||
        String(u.operator || '').toLowerCase().includes(q) ||
        String(u.operation_value || '').toLowerCase().includes(q)
      );
    });
  }, [units, searchText, baseUnitFilter]);

  // Summary statistics
  const stats = useMemo(() => {
    const total = units.length;
    const baseCount = units.filter((u) => !u.base_unit).length;
    const subCount = total - baseCount;
    return { total, baseCount, subCount };
  }, [units]);

  // Selected parent unit name for live formula preview
  const parentUnitObj = useMemo(() => {
    return baseUnits.find((b) => Number(b.id) === Number(selectedBaseUnit));
  }, [baseUnits, selectedBaseUnit]);

  const computedPreviewQty = useMemo(() => {
    return unitToBaseQty(1, {
      operator: selectedOperator,
      operation_value: inputOpValue
    });
  }, [selectedOperator, inputOpValue]);

  // Exact columns matching AURA_v1 themes/default/admin/views/settings/units.php (#UnitTable):
  // 1. Checkbox (handled by Table rowSelection)
  // 2. Unit Code (code)
  // 3. Unit Name (name)
  // 4. Base Unit (base_unit)
  // 5. Operator (operator)
  // 6. Operation Value (operation_value)
  // 7. Actions (Edit Unit, Add Sub-Unit, Delete Unit)
  const columns = [
    {
      title: t('unit_code', 'Unit Code'),
      dataIndex: 'code',
      key: 'code',
      width: 150,
      sorter: (a, b) => String(a.code || '').localeCompare(String(b.code || '')),
      render: (code) => (
        <Tag color="blue" style={{ fontWeight: 600, fontSize: 13, padding: '2px 10px' }}>
          {code}
        </Tag>
      )
    },
    {
      title: t('unit_name', 'Unit Name'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => String(a.name || '').localeCompare(String(b.name || '')),
      render: (name, record) => (
        <Space size={8} wrap>
          <Text strong style={{ color: adminTheme.text, fontSize: 14 }}>
            {name}
          </Text>
          {record.sub_unit_count > 0 && (
            <Tag
              color="cyan"
              style={{ fontSize: 11, cursor: 'pointer' }}
              onClick={() => setBaseUnitFilter(record.id)}
              title="Click to filter this Base Unit family"
            >
              <ApartmentOutlined /> {record.sub_unit_count} {t('sub_units', 'Sub-units')}
            </Tag>
          )}
          {record.product_count > 0 && (
            <Tag color="default" style={{ fontSize: 11 }}>
              {record.product_count} {t('products', 'products')}
            </Tag>
          )}
        </Space>
      )
    },
    {
      title: t('base_unit', 'Base Unit'),
      dataIndex: 'base_unit_name',
      key: 'base_unit',
      width: 200,
      sorter: (a, b) =>
        String(a.base_unit_name || '').localeCompare(String(b.base_unit_name || '')),
      render: (baseName, record) => {
        if (!record.base_unit) {
          return <Text type="secondary">—</Text>;
        }
        return (
          <Space size={6}>
            <ApartmentOutlined style={{ color: '#0284c7' }} />
            <Text strong style={{ color: adminTheme.text }}>
              {baseName || `#${record.base_unit}`}
            </Text>
            {record.base_unit_code && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                ({record.base_unit_code})
              </Text>
            )}
          </Space>
        );
      }
    },
    {
      title: t('operator', 'Operator'),
      dataIndex: 'operator',
      key: 'operator',
      width: 120,
      align: 'center',
      sorter: (a, b) => String(a.operator || '').localeCompare(String(b.operator || '')),
      render: (op) =>
        op ? (
          <Tag
            color="purple"
            style={{ fontWeight: 700, fontSize: 14, minWidth: 32, textAlign: 'center' }}
          >
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
      width: 220,
      sorter: (a, b) =>
        parseFloat(a.operation_value || 0) - parseFloat(b.operation_value || 0),
      render: (val, record) => {
        if (!record.base_unit || !val) {
          return <Text type="secondary">—</Text>;
        }
        const baseQty = unitToBaseQty(1, record);
        return (
          <Space size={8} wrap>
            <Text strong style={{ color: adminTheme.text, fontSize: 14 }}>
              {val}
            </Text>
            <Tag color="geekblue" style={{ fontSize: 11.5, margin: 0 }}>
              1 {record.code} = {baseQty} {record.base_unit_code || record.base_unit_name}
            </Tag>
          </Space>
        );
      }
    },
    {
      title: t('actions', 'Actions'),
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const actionItems = [
          {
            key: 'edit',
            icon: <EditOutlined style={{ color: '#2563eb' }} />,
            label: t('edit_unit', 'Edit Unit'),
            onClick: () => openEditModal(record)
          },
          ...(!record.base_unit
            ? [
                {
                  key: 'add_subunit',
                  icon: <PlusOutlined style={{ color: '#16a34a' }} />,
                  label: t('add_sub_unit', `Add Sub-Unit under ${record.name}`),
                  onClick: () => openAddModal(record.id)
                }
              ]
            : []),
          {
            type: 'divider'
          },
          {
            key: 'delete',
            icon: <DeleteOutlined style={{ color: '#dc2626' }} />,
            danger: true,
            label: t('delete_unit', 'Delete Unit'),
            onClick: () => {
              Modal.confirm({
                title: t('delete_unit', 'Delete Unit'),
                content: t('r_u_sure', "Are you sure you want to delete this unit?"),
                okText: t('i_m_sure', "Yes I'm sure"),
                okType: 'danger',
                cancelText: t('no', 'No'),
                onOk: () => handleDelete(record.id)
              });
            }
          }
        ];

        return <TableActionDropdown items={actionItems} />;
      }
    }
  ];

  // Top-right Actions dropdown matching AURA_v1 themes/default/admin/views/settings/units.php:
  // - Add Unit (system_settings/add_unit)
  // - Export to Excel file (data-action="export_excel")
  // - Divider
  // - Delete Units (data-action="delete")
  const headerActionItems = [
    {
      key: 'add_unit',
      icon: <PlusOutlined style={{ color: '#0284c7' }} />,
      label: t('add_unit', 'Add Unit'),
      onClick: () => openAddModal(0)
    },
    {
      key: 'export_excel',
      icon: <FileExcelOutlined style={{ color: '#16a34a' }} />,
      label: t('export_to_excel', 'Export to Excel file'),
      onClick: handleExportExcel
    },
    {
      type: 'divider'
    },
    {
      key: 'delete_units',
      icon: <DeleteOutlined style={{ color: '#dc2626' }} />,
      danger: true,
      label: t('delete_units', 'Delete Units'),
      onClick: handleBulkDelete
    }
  ];

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      {/* Top Breadcrumb & Action Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div>
          <Text style={{ color: adminTheme.subtext, fontSize: 12.5 }}>
            {t('home', 'Home')} / {t('system_settings', 'System Settings')} /{' '}
            <strong style={{ color: adminTheme.text }}>{t('units', 'Units')}</strong>
          </Text>
          <Title level={4} style={{ margin: '2px 0 0', color: adminTheme.text }}>
            <FolderOpenOutlined style={{ marginRight: 8, color: '#0284c7' }} />
            {t('units', 'Units')}
          </Title>
        </div>

        <Space wrap>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchUnits();
              fetchBaseUnits();
            }}
            loading={loading}
          >
            {t('refresh', 'Refresh')}
          </Button>
          <Button icon={<FileExcelOutlined />} onClick={handleExportExcel}>
            {t('export_to_excel', 'Export to Excel file')}
          </Button>
          {selectedRowKeys.length > 0 && (
            <Button danger icon={<DeleteOutlined />} onClick={handleBulkDelete}>
              {t('delete_units', 'Delete Units')} ({selectedRowKeys.length})
            </Button>
          )}
          <Dropdown menu={{ items: headerActionItems }} placement="bottomRight" trigger={['click']}>
            <Button icon={<UnorderedListOutlined />}>
              {t('actions', 'Actions')} <DownOutlined />
            </Button>
          </Dropdown>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openAddModal(0)}
            style={{ background: '#0284c7', color: '#ffffff' }}
          >
            {t('add_unit', 'Add Unit')}
          </Button>
        </Space>
      </div>

      {/* Summary KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card
            style={{
              background: adminTheme.card,
              border: `1px solid ${adminTheme.border}`,
              borderRadius: 12,
              boxShadow: adminTheme.shadow,
              cursor: 'pointer'
            }}
            styles={{ body: { padding: '14px 20px' } }}
            onClick={() => setBaseUnitFilter('all')}
          >
            <Statistic
              title={
                <span style={{ color: adminTheme.subtext, fontSize: 13 }}>
                  {t('total_units', 'All Units')}
                </span>
              }
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
              borderRadius: 12,
              boxShadow: adminTheme.shadow,
              cursor: 'pointer'
            }}
            styles={{ body: { padding: '14px 20px' } }}
            onClick={() => setBaseUnitFilter('root')}
          >
            <Statistic
              title={
                <span style={{ color: adminTheme.subtext, fontSize: 13 }}>
                  {t('base_units', 'Base Units (Primary)')}
                </span>
              }
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
              borderRadius: 12,
              boxShadow: adminTheme.shadow,
              cursor: 'pointer'
            }}
            styles={{ body: { padding: '14px 20px' } }}
            onClick={() => setBaseUnitFilter('sub')}
          >
            <Statistic
              title={
                <span style={{ color: adminTheme.subtext, fontSize: 13 }}>
                  {t('sub_units', 'Sub-Units (With Operator)')}
                </span>
              }
              value={stats.subCount}
              prefix={<ApartmentOutlined style={{ color: '#8b5cf6' }} />}
              valueStyle={{ color: '#8b5cf6', fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Box Table Card matching AURA_v1 themes/default/admin/views/settings/units.php */}
      <Card
        title={
          <Space>
            <FolderOpenOutlined style={{ color: '#0284c7' }} />
            <span style={{ color: adminTheme.text, fontWeight: 700 }}>
              {t('units', 'Units')}
            </span>
          </Space>
        }
        extra={
          <Dropdown menu={{ items: headerActionItems }} placement="bottomRight" trigger={['click']}>
            <Button type="text" icon={<UnorderedListOutlined />} style={{ fontWeight: 600 }}>
              {t('actions', 'Actions')} <DownOutlined />
            </Button>
          </Dropdown>
        }
        style={{
          background: adminTheme.card,
          border: `1px solid ${adminTheme.border}`,
          borderRadius: 14,
          boxShadow: adminTheme.shadow
        }}
        styles={{ body: { padding: 20 } }}
      >
        <Paragraph style={{ margin: '0 0 16px', color: adminTheme.subtext, fontSize: 13 }}>
          {t('list_results', 'Please use the table below to navigate or filter the results.')}
        </Paragraph>

        {/* Filter & Search Bar */}
        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <Space wrap>
            <Input
              placeholder={t('search_units', 'Search Unit Code, Unit Name, Base Unit...')}
              prefix={<SearchOutlined style={{ color: adminTheme.subtext }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 320, borderRadius: 8 }}
              allowClear
            />
            <Select
              value={baseUnitFilter}
              onChange={(val) => setBaseUnitFilter(val)}
              style={{ minWidth: 220 }}
            >
              <Option value="all">{t('all_units', 'All Units (Base & Sub-Units)')}</Option>
              <Option value="root">{t('only_base_units', 'Only Base Units (Root)')}</Option>
              <Option value="sub">{t('only_sub_units', 'Only Sub-Units')}</Option>
              {baseUnits.map((bu) => (
                <Option key={bu.id} value={bu.id}>
                  {t('family_of', 'Family')}: {bu.name} ({bu.code})
                </Option>
              ))}
            </Select>
            {baseUnitFilter !== 'all' && (
              <Button size="small" onClick={() => setBaseUnitFilter('all')}>
                {t('clear_filter', 'Reset Filter')}
              </Button>
            )}
          </Space>

          <Text style={{ color: adminTheme.subtext, fontSize: 13 }}>
            {selectedRowKeys.length > 0 ? `${selectedRowKeys.length} selected · ` : ''}
            {t('showing_units', `Showing ${filteredUnits.length} of ${units.length} units`)}
          </Text>
        </div>

        {/* #UnitTable */}
        <Table
          id="UnitTable"
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys)
          }}
          columns={columns}
          dataSource={filteredUnits}
          rowKey="id"
          loading={loading}
          bordered
          pagination={{
            defaultPageSize: 25,
            showSizeChanger: true,
            pageSizeOptions: ['10', '25', '50', '100'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
          }}
          style={{ background: 'transparent' }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Add / Edit Unit Modal matching AURA_v1 add_unit.php & edit_unit.php */}
      <Modal
        title={
          <Space>
            <BlockOutlined style={{ color: '#0284c7' }} />
            <span style={{ fontWeight: 700 }}>
              {editingUnit ? t('edit_unit', 'Edit Unit') : t('add_unit', 'Add Unit')}
            </span>
          </Space>
        }
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        confirmLoading={saving}
        okText={editingUnit ? t('edit_unit', 'Edit Unit') : t('add_unit', 'Add Unit')}
        cancelText={t('cancel', 'Cancel')}
        okButtonProps={{ style: { background: '#0284c7', color: '#ffffff' } }}
        destroyOnHidden
        width={540}
      >
        <p style={{ color: adminTheme.subtext, fontSize: 13, marginBottom: 16 }}>
          {t(
            'enter_info',
            'Please fill in the information below. The field labels marked with * are required input fields.'
          )}
        </p>

        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label={<span style={{ fontWeight: 600 }}>{t('unit_code', 'Unit Code')} *</span>}
            rules={[{ required: true, message: t('code_required', 'Unit Code is required') }]}
          >
            <Input id="code" placeholder="e.g. Pc, Box, Ctn, Kg" />
          </Form.Item>

          <Form.Item
            name="name"
            label={<span style={{ fontWeight: 600 }}>{t('unit_name', 'Unit Name')} *</span>}
            rules={[{ required: true, message: t('name_required', 'Unit Name is required') }]}
          >
            <Input id="name" placeholder="e.g. Piece, Box of 12, Carton of 24, Kilogram" />
          </Form.Item>

          <Form.Item
            name="base_unit"
            label={<span style={{ fontWeight: 600 }}>{t('base_unit', 'Base Unit')}</span>}
          >
            <Select
              id="base_unit"
              placeholder={t('select_unit', 'Select Unit')}
              onChange={handleBaseUnitChange}
              showSearch
              optionFilterProp="children"
              style={{ width: '100%' }}
            >
              <Option value={0}>{t('select_unit', 'Select Unit')}</Option>
              {baseUnits
                .filter((bu) => !editingUnit || Number(bu.id) !== Number(editingUnit.id))
                .map((bu) => (
                  <Option key={bu.id} value={bu.id}>
                    {bu.name} ({bu.code})
                  </Option>
                ))}
            </Select>
          </Form.Item>

          {/* #measuring block matching AURA_v1 add_unit.php / edit_unit.php */}
          <div
            id="measuring"
            style={{
              display: Number(selectedBaseUnit) > 0 ? 'block' : 'none',
              background: adminTheme.subtle,
              border: `1px solid ${adminTheme.border}`,
              borderRadius: 10,
              padding: 16,
              marginTop: 8
            }}
          >
            <Form.Item
              name="operator"
              label={<span style={{ fontWeight: 600 }}>{t('operator', 'Operator')} *</span>}
              rules={
                Number(selectedBaseUnit) > 0
                  ? [{ required: true, message: t('operator_required', 'Operator is required') }]
                  : []
              }
            >
              <Select id="operator" placeholder={t('select_operator', 'Select Operator')}>
                <Option value="*">* ({t('multiply', 'Multiply')})</Option>
                <Option value="/">/ ({t('divide', 'Divide')})</Option>
                <Option value="+">+ ({t('add', 'Add')})</Option>
                <Option value="-">- ({t('subtract', 'Subtract')})</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="operation_value"
              label={
                <span style={{ fontWeight: 600 }}>
                  {t('operation_value', 'Operation Value')} *
                </span>
              }
              rules={
                Number(selectedBaseUnit) > 0
                  ? [
                      {
                        required: true,
                        message: t('operation_value_required', 'Operation Value is required')
                      }
                    ]
                  : []
              }
              style={{ marginBottom: 12 }}
            >
              <Input id="operation_value" placeholder="e.g. 12, 24, 1000" />
            </Form.Item>

            {/* Live formula helper: [ base_unit = 1 [operator] [operation_value] ] */}
            <Alert
              type="info"
              showIcon
              icon={<CalculatorOutlined />}
              message={
                <span>
                  <Text style={{ fontSize: 12.5 }}>
                    [ {parentUnitObj?.name || t('base_unit', 'Base Unit')} = 1 {selectedOperator}{' '}
                    {inputOpValue} ] →{' '}
                  </Text>
                  <Text strong style={{ color: '#0284c7', fontSize: 13 }}>
                    1 {inputName || t('sub_unit', 'Sub-Unit')} = {computedPreviewQty}{' '}
                    {parentUnitObj ? `${parentUnitObj.name} (${parentUnitObj.code})` : ''}
                  </Text>
                </span>
              }
              style={{ borderRadius: 8 }}
            />
          </div>
        </Form>
      </Modal>
    </Space>
  );
}
