import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Table,
  Row,
  Col,
  Space,
  Typography,
  Tag,
  InputNumber,
  message,
  Divider,
  Alert,
  AutoComplete,
  Spin,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
  BarcodeOutlined,
  SaveOutlined,
  RollbackOutlined,
  ReloadOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  EditOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { formatCurrency } from '../../utils/uiTheme';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import BpasItemEditModal from '../../components/common/BpasItemEditModal';

const { Title, Text } = Typography;
const { Option } = Select;

export default function BpasAddQuantityAdjustmentPage({ onBack, onSuccess }) {
  const adminTheme = useAdminTheme();
  const isDark = adminTheme?.isDark;
  const [form] = Form.useForm();

  // State
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [billers, setBillers] = useState([]);
  const [units, setUnits] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(1);

  // Search & Items
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [productOptions, setProductOptions] = useState([]);
  const [items, setItems] = useState([]);

  // Item Edit Modal (Popup matching Image 2)
  const [editingModalItem, setEditingModalItem] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 1. Fetch Metadata Options & Next Reference
  useEffect(() => {
    const fetchMetadata = async () => {
      setLoadingMeta(true);
      try {
        const res = await axios.get('/api/admin/products/quantity_adjustments/meta/options');
        if (res.data?.success) {
          const meta = res.data.data;
          setWarehouses(meta.warehouses || []);
          setBillers(meta.billers || []);
          setUnits(meta.units || []);
          setTaxRates(meta.taxRates || []);
          const defaultWh = meta.warehouses?.[0]?.id || 1;
          setSelectedWarehouseId(defaultWh);

          form.setFieldsValue({
            date: dayjs(),
            reference_no: meta.nextReferenceNo,
            warehouse_id: defaultWh,
            biller_id: meta.billers?.[0]?.id || 3,
            note: ''
          });
        }
      } catch (err) {
        message.error('Failed to load metadata options');
      } finally {
        setLoadingMeta(false);
      }
    };

    fetchMetadata();
  }, [form]);

  // 2. Search Products for current warehouse
  const handleSearchProducts = async (value) => {
    setSearchQuery(value);
    if (!value || value.trim().length === 0) {
      setProductOptions([]);
      return;
    }

    setSearchingProducts(true);
    try {
      const res = await axios.get('/api/admin/products/quantity_adjustments/products', {
        params: {
          warehouse_id: selectedWarehouseId,
          search: value.trim(),
          limit: 20
        }
      });

      if (res.data?.success) {
        const prods = res.data.data || [];
        setProductOptions(
          prods.map((p) => ({
            value: String(p.id),
            product: p,
            label: (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#1e293b' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    Code: {p.code} | Barcode: {p.barcode || '—'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Tag color={Number(p.warehouse_stock) > 0 ? 'blue' : 'orange'}>
                    Stock: {Number(p.warehouse_stock)} {p.unit_name || ''}
                  </Tag>
                  <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
                    Cost: {formatCurrency(p.cost)}
                  </div>
                </div>
              </div>
            )
          }))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingProducts(false);
    }
  };

  // 3. Add Product to items list
  const handleSelectProduct = (_, option) => {
    const prod = option.product;
    if (!prod) return;

    // Check if already in items (if no variants)
    const existingIndex = items.findIndex((i) => i.product_id === prod.id && !i.option_id);
    if (existingIndex >= 0 && (!prod.variants || prod.variants.length === 0)) {
      const updated = [...items];
      const newUnitQty = Number(updated[existingIndex].unit_quantity || updated[existingIndex].quantity) + 1;
      let newBaseQty = newUnitQty;
      if (updated[existingIndex].unit_operator && updated[existingIndex].unit_operation_value) {
        const opVal = parseFloat(updated[existingIndex].unit_operation_value) || 1;
        if (updated[existingIndex].unit_operator === '*') newBaseQty = newUnitQty * opVal;
        else if (updated[existingIndex].unit_operator === '/') newBaseQty = opVal !== 0 ? newUnitQty / opVal : newUnitQty;
      }
      updated[existingIndex].unit_quantity = newUnitQty;
      updated[existingIndex].quantity = newBaseQty;
      setItems(updated);
      message.info(`Incremented quantity for "${prod.name}"`);
      setSearchQuery('');
      setProductOptions([]);
      return;
    }

    const defaultVariant = prod.variants?.[0] || null;
    const initialQoh = defaultVariant
      ? Number(defaultVariant.variant_warehouse_stock || 0)
      : Number(prod.warehouse_stock || 0);

    const newItem = {
      key: `${prod.id}_${Date.now()}`,
      product_id: prod.id,
      product_code: prod.code,
      product_name: prod.name,
      unit_id: prod.unit_id || 1,
      base_unit_id: prod.base_unit_id || prod.unit_id || 1,
      unit_name: prod.unit_name || 'Unit',
      unit_code: prod.unit_code || 'Unit',
      unit_operator: prod.unit_operator || null,
      unit_operation_value: prod.unit_operation_value || null,
      unit_cost: Number(prod.cost) || 0,
      cost: Number(prod.cost) || 0,
      variants: prod.variants || [],
      option_id: defaultVariant ? defaultVariant.id : null,
      warehouse_qoh: initialQoh,
      type: 'addition', // default addition
      quantity: 1,      // base qty
      unit_quantity: 1, // unit qty
      discount: '0',
      tax_rate_id: prod.tax_rate_id || null,
      description: '',
      serial_no: '',
      expiry: null
    };

    setItems([...items, newItem]);
    setSearchQuery('');
    setProductOptions([]);
  };

  // Open Edit Modal for a row item (matching Image 2)
  const handleOpenEditModal = (item) => {
    setEditingModalItem(item);
    setIsEditModalOpen(true);
  };

  // Save changes from Edit Modal
  const handleSaveModalItem = (updatedItem) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.key !== updatedItem.key) return i;
        const merged = { ...i, ...updatedItem };
        if (updatedItem.option_id && updatedItem.variants?.length > 0) {
          const selectedVar = updatedItem.variants.find((v) => v.id === updatedItem.option_id);
          if (selectedVar) {
            merged.warehouse_qoh = Number(selectedVar.variant_warehouse_stock || 0);
          }
        }
        return merged;
      })
    );
    message.success(`Updated item "${updatedItem.product_name}"`);
  };

  // 4. Update an item property
  const handleUpdateItem = (key, field, val) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        const updated = { ...item, [field]: val };

        // If unit_quantity or quantity changed, recalculate base quantity
        if (field === 'unit_quantity' || field === 'quantity') {
          const uQty = Number(val) || 0;
          updated.unit_quantity = uQty;
          let bQty = uQty;
          if (item.unit_operator && item.unit_operation_value) {
            const opVal = parseFloat(item.unit_operation_value) || 1;
            if (item.unit_operator === '*') bQty = uQty * opVal;
            else if (item.unit_operator === '/') bQty = opVal !== 0 ? uQty / opVal : uQty;
          }
          updated.quantity = bQty;
        }

        // If variant changed, update QOH
        if (field === 'option_id') {
          const selectedVar = item.variants.find((v) => v.id === val);
          if (selectedVar) {
            updated.warehouse_qoh = Number(selectedVar.variant_warehouse_stock || 0);
          }
        }
        return updated;
      })
    );
  };

  // 5. Remove item
  const handleRemoveItem = (key) => {
    setItems(items.filter((i) => i.key !== key));
  };

  // 6. Reset form
  const handleReset = () => {
    setItems([]);
    form.resetFields();
    form.setFieldsValue({
      date: dayjs(),
      warehouse_id: warehouses[0]?.id || 1,
      biller_id: billers[0]?.id || 3
    });
  };

  // 7. Submit Adjustment
  const handleSubmit = async (values) => {
    if (items.length === 0) {
      message.error('Please add at least one product item to adjust.');
      return;
    }

    // Validate subtractions against QOH
    for (const item of items) {
      if (item.type === 'subtraction' && Number(item.quantity) > Number(item.warehouse_qoh)) {
        message.error(
          `Cannot subtract ${item.unit_quantity || item.quantity} (${item.quantity} base units) of "${item.product_name}". Only ${item.warehouse_qoh} available in this warehouse.`
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        date: values.date ? values.date.format('YYYY-MM-DD HH:mm:ss') : dayjs().format('YYYY-MM-DD HH:mm:ss'),
        reference_no: values.reference_no,
        warehouse_id: values.warehouse_id,
        biller_id: values.biller_id,
        note: values.note,
        items: items.map((i) => ({
          product_id: i.product_id,
          option_id: i.option_id || null,
          unit_id: i.unit_id || i.product_unit_id || null,
          product_unit_id: i.unit_id || i.product_unit_id || null,
          unit_name: i.unit_name || i.product_unit_code || 'Unit',
          product_unit_code: i.unit_name || i.product_unit_code || 'Unit',
          unit_operator: i.unit_operator || null,
          unit_operation_value: i.unit_operation_value || null,
          unit_quantity: Number(i.unit_quantity != null ? i.unit_quantity : i.quantity),
          quantity: Number(i.quantity),
          type: i.type,
          serial_no: i.serial_no || null,
          expiry: i.expiry ? dayjs(i.expiry).format('YYYY-MM-DD') : null,
          unit_cost: Number(i.unit_cost),
          description: i.description || null
        }))
      };

      const res = await axios.post('/api/admin/products/quantity_adjustments', payload);
      if (res.data?.success) {
        message.success(res.data.message || 'Quantity Adjustment saved successfully!');
        if (onSuccess) onSuccess();
        else if (onBack) onBack();
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to save quantity adjustment.');
    } finally {
      setSubmitting(false);
    }
  };

  // Columns for dynamic items table
  const columns = [
    {
      title: '#',
      key: 'idx',
      width: 45,
      align: 'center',
      render: (_, __, idx) => idx + 1
    },
    {
      title: 'Product (Code - Name)',
      key: 'product',
      width: 240,
      render: (_, r) => (
        <div>
          <strong style={{ color: isDark ? '#f8fafc' : '#1e293b' }}>{r.product_code}</strong> - {r.product_name}
        </div>
      )
    },
    {
      title: 'Description',
      key: 'description',
      width: 170,
      render: (_, r) => (
        <Space align="center" size={6}>
          <Tooltip title="Edit Item Details (Popup Image 2)">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#2563eb', fontSize: 14 }} />}
              onClick={() => handleOpenEditModal(r)}
              style={{
                border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
                borderRadius: 4,
                width: 26,
                height: 26,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f8fafc'
              }}
            />
          </Tooltip>
          <span style={{ fontSize: 12, color: r.description ? (isDark ? '#cbd5e1' : '#334155') : '#94a3b8' }}>
            {r.description || '—'}
          </span>
        </Space>
      )
    },
    {
      title: 'Unit',
      key: 'unit',
      width: 110,
      render: (_, r) => (
        <Tooltip title="Click to change unit in edit modal">
          <Tag
            color="geekblue"
            style={{ cursor: 'pointer', fontWeight: 600, fontSize: 12 }}
            onClick={() => handleOpenEditModal(r)}
          >
            {r.unit_name || 'Unit'}
            {r.unit_operator && r.unit_operation_value ? ` (${r.unit_operator}${r.unit_operation_value})` : ''}
          </Tag>
        </Tooltip>
      )
    },
    {
      title: 'Current QOH',
      dataIndex: 'warehouse_qoh',
      key: 'warehouse_qoh',
      width: 105,
      align: 'right',
      render: (qoh) => (
        <Tag color={Number(qoh) > 0 ? 'blue' : 'default'} style={{ fontWeight: 700 }}>
          {Number(qoh)}
        </Tag>
      )
    },
    {
      title: 'Variant Option',
      key: 'option_id',
      width: 160,
      render: (_, r) => {
        if (!r.variants || r.variants.length === 0) {
          return <span style={{ color: '#94a3b8' }}>n/a</span>;
        }
        return (
          <Select
            size="small"
            style={{ width: '100%' }}
            value={r.option_id}
            onChange={(val) => handleUpdateItem(r.key, 'option_id', val)}
          >
            {r.variants.map((v) => (
              <Option key={v.id} value={v.id}>
                {v.name} (Stock: {v.variant_warehouse_stock})
              </Option>
            ))}
          </Select>
        );
      }
    },
    {
      title: 'Adjustment Type',
      key: 'type',
      width: 155,
      render: (_, r) => (
        <Select
          size="small"
          style={{ width: '100%' }}
          value={r.type}
          onChange={(val) => handleUpdateItem(r.key, 'type', val)}
        >
          <Option value="addition">
            <span style={{ color: '#16a34a', fontWeight: 700 }}>+ Addition (Add)</span>
          </Option>
          <Option value="subtraction">
            <span style={{ color: '#dc2626', fontWeight: 700 }}>- Subtraction (Deduct)</span>
          </Option>
        </Select>
      )
    },
    {
      title: 'Adjustment Qty',
      key: 'quantity',
      width: 140,
      render: (_, r) => {
        const isSub = r.type === 'subtraction';
        const isExceed = isSub && Number(r.quantity) > Number(r.warehouse_qoh);
        const displayVal = r.unit_quantity != null ? r.unit_quantity : r.quantity;
        const hasConversion = r.unit_operator && r.unit_operation_value;

        return (
          <div>
            <InputNumber
              size="small"
              min={0.01}
              step={1}
              style={{ width: '100%', borderColor: isExceed ? '#ef4444' : undefined }}
              value={displayVal}
              onChange={(val) => handleUpdateItem(r.key, 'unit_quantity', val)}
            />
            {hasConversion && (
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                = {r.quantity} Base Units
              </div>
            )}
            {isExceed && (
              <div style={{ color: '#ef4444', fontSize: 10, fontWeight: 700, marginTop: 2 }}>
                <WarningOutlined /> Exceeds QOH ({r.warehouse_qoh})
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Serial No',
      key: 'serial_no',
      width: 130,
      render: (_, r) => (
        <Input
          size="small"
          placeholder="Optional Serial"
          value={r.serial_no}
          onChange={(e) => handleUpdateItem(r.key, 'serial_no', e.target.value)}
        />
      )
    },
    {
      title: 'Expiry',
      key: 'expiry',
      width: 125,
      render: (_, r) => (
        <DatePicker
          size="small"
          style={{ width: '100%' }}
          value={r.expiry ? dayjs(r.expiry) : null}
          onChange={(d) => handleUpdateItem(r.key, 'expiry', d)}
        />
      )
    },
    {
      title: 'Action',
      key: 'action',
      width: 55,
      align: 'center',
      render: (_, r) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveItem(r.key)}
        />
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Header Card */}
      <Card
        style={{ borderRadius: 12, border: `1px solid ${adminTheme?.border || '#e2e8f0'}` }}
        styles={{ body: { padding: '16px 20px' } }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size={10}>
            <Button icon={<RollbackOutlined />} onClick={onBack} style={{ fontWeight: 600 }}>
              Back to List
            </Button>
            <Title level={4} style={{ margin: 0, color: '#2563eb' }}>
              Add Quantity Adjustment
            </Title>
          </Space>
          <Text type="secondary" style={{ fontSize: 13 }}>
            AURA_v1 Standard Inventory Reconciliation Voucher
          </Text>
        </div>
      </Card>

      {/* Main Form Container */}
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Card
          style={{ borderRadius: 12, border: `1px solid ${adminTheme?.border || '#e2e8f0'}` }}
          styles={{ body: { padding: '20px' } }}
        >
          {loadingMeta ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="default" />
              <div style={{ marginTop: 10, color: '#64748b', fontSize: 13 }}>Loading metadata...</div>
            </div>
          ) : (
            <>
              {/* Form Header Fields */}
              <Row gutter={16}>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="date" label="Adjustment Date" rules={[{ required: true }]}>
                    <DatePicker showTime style={{ width: '100%' }} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="reference_no" label="Reference No" rules={[{ required: true }]}>
                    <Input placeholder="Adj26/0001" style={{ fontWeight: 700 }} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="warehouse_id" label="Warehouse" rules={[{ required: true }]}>
                    <Select
                      placeholder="Select Warehouse"
                      onChange={(val) => {
                        setSelectedWarehouseId(val);
                        setItems([]); // Clear items if warehouse changes to prevent wrong QOH
                      }}
                    >
                      {warehouses.map((wh) => (
                        <Option key={wh.id} value={wh.id}>
                          {wh.name} ({wh.code})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="biller_id" label="Biller / Branch">
                    <Select placeholder="Select Biller">
                      {billers.map((b) => (
                        <Option key={b.id} value={b.id}>
                          {b.company && b.company !== '-' ? b.company : b.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              {/* Barcode Search Bar */}
              <div style={{
                margin: '14px 0 20px',
                background: isDark ? 'rgba(30, 41, 59, 0.85)' : '#f8fafc',
                padding: '16px',
                borderRadius: 8,
                border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #e2e8f0',
                boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.3)' : 'none'
              }}>
                <Text strong style={{ fontSize: 13, color: isDark ? '#e2e8f0' : '#334155', display: 'block', marginBottom: 8 }}>
                  <BarcodeOutlined style={{ marginRight: 6, color: isDark ? '#a78bfa' : '#2563eb' }} />
                  Scan Barcode or Search Products (Auto-adds to adjustment table):
                </Text>
                <AutoComplete
                  style={{ width: '100%' }}
                  options={productOptions}
                  onSelect={handleSelectProduct}
                  onSearch={handleSearchProducts}
                  value={searchQuery}
                >
                  <Input
                    size="large"
                    placeholder="Enter product name, code, SKU, or scan barcode..."
                    prefix={<SearchOutlined style={{ color: '#2563eb' }} />}
                    suffix={searchingProducts ? <Spin size="small" /> : null}
                  />
                </AutoComplete>
              </div>

              {/* Items Table */}
              <div style={{ marginBottom: 20 }}>
                <Table
                  rowKey="key"
                  dataSource={items}
                  columns={columns}
                  pagination={false}
                  bordered
                  size="middle"
                  locale={{
                    emptyText: (
                      <div style={{ padding: '24px 0', textAlign: 'center', color: '#94a3b8' }}>
                        <InfoCircleOutlined style={{ fontSize: 24, marginBottom: 8, display: 'block' }} />
                        No products added yet. Use the barcode search above to add items to this adjustment voucher.
                      </div>
                    )
                  }}
                />
              </div>

              {/* Notes */}
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item name="note" label="Adjustment Reason / Audit Note">
                    <Input.TextArea rows={3} placeholder="Provide details regarding the cycle count, damage, or discrepancy..." />
                  </Form.Item>
                </Col>
              </Row>

              <Divider style={{ margin: '16px 0' }} />

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  Reset
                </Button>
                <Space size={10}>
                  <Button onClick={onBack}>Cancel</Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={submitting}
                    disabled={items.length === 0}
                    style={{ background: '#16a34a', borderColor: '#16a34a', fontWeight: 700 }}
                  >
                    Submit Quantity Adjustment
                  </Button>
                </Space>
              </div>
            </>
          )}
        </Card>
      </Form>

      {/* Edit Item Modal (Popup matching Image 2) */}
      <BpasItemEditModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        item={editingModalItem}
        units={units}
        taxRates={taxRates}
        onSave={handleSaveModalItem}
        mode="quantity-adjustment"
      />
    </div>
  );
}
