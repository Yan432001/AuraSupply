import React, { useState, useEffect } from 'react';
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
  Popconfirm
} from 'antd';
import {
  SaveOutlined,
  RollbackOutlined,
  ReloadOutlined,
  SearchOutlined,
  BarcodeOutlined,
  DeleteOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { formatCurrency } from '../../utils/uiTheme';
import { useAdminTheme } from '../../hooks/useAdminTheme';

const { Title, Text } = Typography;
const { Option } = Select;

export default function BpasEditQuantityAdjustmentPage({ adjustmentId, onBack, onSuccess }) {
  const adminTheme = useAdminTheme();
  const [form] = Form.useForm();

  // State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [billers, setBillers] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(1);
  const [adjustmentRecord, setAdjustmentRecord] = useState(null);

  // Search & Items
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [productOptions, setProductOptions] = useState([]);
  const [items, setItems] = useState([]);

  // 1. Fetch Metadata and Adjustment Data
  useEffect(() => {
    const fetchAdjustmentAndMeta = async () => {
      setLoading(true);
      try {
        const [metaRes, adjRes] = await Promise.all([
          axios.get('/api/admin/products/quantity_adjustments/meta/options'),
          axios.get(`/api/admin/products/quantity_adjustments/${adjustmentId}`)
        ]);

        if (metaRes.data?.success) {
          setWarehouses(metaRes.data.data.warehouses || []);
          setBillers(metaRes.data.data.billers || []);
        }

        if (adjRes.data?.success) {
          const adj = adjRes.data.data;
          setAdjustmentRecord(adj);
          setSelectedWarehouseId(adj.warehouse_id);

          form.setFieldsValue({
            date: adj.date ? dayjs(adj.date) : dayjs(),
            reference_no: adj.reference_no,
            warehouse_id: adj.warehouse_id,
            biller_id: adj.biller_id,
            note: adj.note || ''
          });

          // Preload items
          const formattedItems = (adj.items || []).map((i) => ({
            key: `item_${i.id}_${Date.now()}`,
            id: i.id,
            product_id: i.product_id,
            product_code: i.product_code,
            product_name: i.product_name,
            unit_name: i.unit_name || 'Unit',
            unit_cost: Number(i.unit_cost) || 0,
            option_id: i.option_id,
            variant_name: i.variant_name,
            variants: i.variants || [],
            warehouse_qoh: Number(i.warehouse_qoh) || 0,
            type: i.type || 'addition',
            quantity: Number(i.quantity) || 1,
            serial_no: i.serial_no || '',
            expiry: i.expiry ? dayjs(i.expiry) : null
          }));

          setItems(formattedItems);
        }
      } catch (err) {
        message.error('Failed to load adjustment details');
      } finally {
        setLoading(false);
      }
    };

    if (adjustmentId) {
      fetchAdjustmentAndMeta();
    }
  }, [adjustmentId, form]);

  // 2. Search Products
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
                  <div style={{ fontWeight: 700, color: '#1e293b' }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Code: {p.code}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Tag color={Number(p.warehouse_stock) > 0 ? 'blue' : 'orange'}>
                    Stock: {Number(p.warehouse_stock)}
                  </Tag>
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

  // 3. Add Product to list
  const handleSelectProduct = (_, option) => {
    const prod = option.product;
    if (!prod) return;

    const defaultVariant = prod.variants?.[0] || null;
    const initialQoh = defaultVariant
      ? Number(defaultVariant.variant_warehouse_stock || 0)
      : Number(prod.warehouse_stock || 0);

    const newItem = {
      key: `new_${prod.id}_${Date.now()}`,
      product_id: prod.id,
      product_code: prod.code,
      product_name: prod.name,
      unit_name: prod.unit_name || 'Unit',
      unit_cost: Number(prod.cost) || 0,
      variants: prod.variants || [],
      option_id: defaultVariant ? defaultVariant.id : null,
      warehouse_qoh: initialQoh,
      type: 'addition',
      quantity: 1,
      serial_no: '',
      expiry: null
    };

    setItems([...items, newItem]);
    setSearchQuery('');
    setProductOptions([]);
  };

  // 4. Update Item
  const handleUpdateItem = (key, field, val) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        const updated = { ...item, [field]: val };
        if (field === 'option_id' && item.variants) {
          const selectedVar = item.variants.find((v) => v.id === val);
          if (selectedVar) {
            updated.warehouse_qoh = Number(selectedVar.variant_warehouse_stock || 0);
          }
        }
        return updated;
      })
    );
  };

  // 5. Remove Item
  const handleRemoveItem = (key) => {
    setItems(items.filter((i) => i.key !== key));
  };

  // 6. Submit Update
  const handleSubmit = async (values) => {
    if (items.length === 0) {
      message.error('Please add at least one product item to adjust.');
      return;
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
          quantity: Number(i.quantity),
          type: i.type,
          serial_no: i.serial_no || null,
          expiry: i.expiry ? dayjs(i.expiry).format('YYYY-MM-DD') : null,
          unit_cost: Number(i.unit_cost)
        }))
      };

      const res = await axios.put(`/api/admin/products/quantity_adjustments/${adjustmentId}`, payload);
      if (res.data?.success) {
        message.success(res.data.message || 'Quantity Adjustment updated successfully!');
        if (onSuccess) onSuccess();
        else if (onBack) onBack();
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to update quantity adjustment.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: '#',
      key: 'idx',
      width: 45,
      align: 'center',
      render: (_, __, idx) => idx + 1
    },
    {
      title: 'Product',
      key: 'product',
      width: 260,
      render: (_, r) => (
        <div>
          <strong style={{ color: '#1e293b' }}>{r.product_code}</strong> - {r.product_name}
          <div style={{ fontSize: 12, color: '#64748b' }}>Unit: {r.unit_name}</div>
        </div>
      )
    },
    {
      title: 'Current QOH',
      dataIndex: 'warehouse_qoh',
      key: 'warehouse_qoh',
      width: 110,
      align: 'right',
      render: (qoh) => (
        <Tag color={Number(qoh) > 0 ? 'blue' : 'default'} style={{ fontWeight: 700 }}>
          {Number(qoh)}
        </Tag>
      )
    },
    {
      title: 'Variant',
      key: 'option_id',
      width: 170,
      render: (_, r) => {
        if (!r.variants || r.variants.length === 0) {
          return <span style={{ color: '#94a3b8' }}>{r.variant_name || 'n/a'}</span>;
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
                {v.name}
              </Option>
            ))}
          </Select>
        );
      }
    },
    {
      title: 'Adjustment Type',
      key: 'type',
      width: 160,
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
      width: 130,
      render: (_, r) => (
        <InputNumber
          size="small"
          min={0.01}
          step={1}
          style={{ width: '100%' }}
          value={r.quantity}
          onChange={(val) => handleUpdateItem(r.key, 'quantity', val)}
        />
      )
    },
    {
      title: 'Serial No',
      key: 'serial_no',
      width: 140,
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
      width: 130,
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
      width: 60,
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

  if (loading) {
    return (
      <Card style={{ borderRadius: 12, padding: '40px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 12, color: '#64748b', fontSize: 13 }}>Loading adjustment voucher...</div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header Card */}
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
              Edit Quantity Adjustment: {adjustmentRecord?.reference_no}
            </Title>
          </Space>
          <Tag color="blue" style={{ fontSize: 13, padding: '4px 8px' }}>
            ID #{adjustmentId}
          </Tag>
        </div>
      </Card>

      <Alert
        message="Atomic Stock Balance Reversal"
        description="Updating this adjustment will automatically reverse previous inventory movements and re-calculate current stock levels atomically."
        type="info"
        showIcon
        style={{ borderRadius: 8 }}
      />

      {/* Main Form */}
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Card
          style={{ borderRadius: 12, border: `1px solid ${adminTheme?.border || '#e2e8f0'}` }}
          styles={{ body: { padding: '20px' } }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="date" label="Adjustment Date" rules={[{ required: true }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="reference_no" label="Reference No" rules={[{ required: true }]}>
                <Input style={{ fontWeight: 700 }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="warehouse_id" label="Warehouse" rules={[{ required: true }]}>
                <Select placeholder="Select Warehouse" disabled>
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
          <div style={{ margin: '14px 0 20px', background: '#f8fafc', padding: '16px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <Text strong style={{ fontSize: 13, color: '#334155', display: 'block', marginBottom: 8 }}>
              <BarcodeOutlined style={{ marginRight: 6, color: '#2563eb' }} />
              Add More Products (Scan Barcode or Search):
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
            />
          </div>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="note" label="Adjustment Reason / Audit Note">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '16px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button onClick={onBack}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={submitting}
              disabled={items.length === 0}
              style={{ fontWeight: 700 }}
            >
              Save Changes & Recalculate Stock
            </Button>
          </div>
        </Card>
      </Form>
    </div>
  );
}
