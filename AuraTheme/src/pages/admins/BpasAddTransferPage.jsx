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
  Tooltip,
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
  SendOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/uiTheme';
import { useAdminTheme } from '../../hooks/useAdminTheme';

const { Title, Text } = Typography;
const { Option } = Select;

export default function BpasAddTransferPage({ onBack = null, onSuccess = null }) {
  const adminTheme = useAdminTheme();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // State
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [billers, setBillers] = useState([]);
  const [fromWarehouseId, setFromWarehouseId] = useState(null);
  const [toWarehouseId, setToWarehouseId] = useState(null);

  // Search & Items
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [productOptions, setProductOptions] = useState([]);
  const [items, setItems] = useState([]);
  const [shippingCost, setShippingCost] = useState(0);

  // Auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('aura_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch metadata options on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      setLoadingMeta(true);
      try {
        const res = await axios.get('/api/admin/transfers/meta/options', {
          headers: getAuthHeaders(),
        });
        if (res.data?.success && res.data?.data) {
          const meta = res.data.data;
          setWarehouses(meta.warehouses || []);
          setBillers(meta.billers || []);

          const defaultFrom = meta.warehouses[0]?.id || 1;
          const defaultTo = meta.warehouses[1]?.id || (meta.warehouses[0]?.id ? null : 2);
          setFromWarehouseId(defaultFrom);
          setToWarehouseId(defaultTo);

          form.setFieldsValue({
            date: dayjs(),
            transfer_no: meta.nextReferenceNo,
            from_warehouse_id: defaultFrom,
            to_warehouse_id: defaultTo,
            from_biller: meta.billers[0]?.id || null,
            to_biller: meta.billers[1]?.id || meta.billers[0]?.id || null,
            status: 'pending',
            shipping: 0,
            note: '',
          });
        }
      } catch (err) {
        message.error('Failed to load transfer options');
      } finally {
        setLoadingMeta(false);
      }
    };

    fetchMetadata();
  }, [form]);

  // Product AutoComplete Search
  useEffect(() => {
    if (!fromWarehouseId || !searchQuery.trim()) {
      setProductOptions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingProducts(true);
      try {
        const res = await axios.get('/api/admin/transfers/products', {
          params: { warehouse_id: fromWarehouseId, term: searchQuery, limit: 15 },
          headers: getAuthHeaders(),
        });
        if (res.data?.success) {
          const formatted = (res.data.data || []).map((p) => ({
            value: `${p.product_id}_${p.option_id || 0}`,
            label: (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                <div>
                  <Text strong>{p.display_name}</Text>
                  <div style={{ fontSize: 12, color: adminTheme.subtext }}>
                    Code: {p.product_code} | Unit: {p.unit_code}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Tag color={p.available_quantity > 0 ? 'green' : 'red'}>
                    Stock: {Number(p.available_quantity).toLocaleString()}
                  </Tag>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0284c7' }}>
                    {formatCurrency(p.unit_cost)}
                  </div>
                </div>
              </div>
            ),
            product: p,
          }));
          setProductOptions(formatted);
        }
      } catch (err) {
        console.error('Failed to search warehouse products:', err);
      } finally {
        setSearchingProducts(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, fromWarehouseId, adminTheme.subtext]);

  // Handle Product Selection
  const handleSelectProduct = (value, option) => {
    const prod = option.product;
    if (!prod) return;

    // Check if already in items list
    const existingIndex = items.findIndex(
      (item) => item.product_id === prod.product_id && (item.option_id || null) === (prod.option_id || null)
    );

    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * updated[existingIndex].unit_cost;
      setItems(updated);
      message.info(`Incremented quantity for "${prod.display_name}"`);
    } else {
      const newItem = {
        key: `${prod.product_id}_${prod.option_id || 0}_${Date.now()}`,
        product_id: prod.product_id,
        product_code: prod.product_code,
        product_name: prod.product_name,
        display_name: prod.display_name,
        option_id: prod.option_id || null,
        variant_name: prod.variant_name || null,
        unit_code: prod.unit_code || 'ea',
        unit_id: prod.unit_id,
        available_quantity: prod.available_quantity,
        quantity: 1,
        unit_cost: prod.unit_cost,
        subtotal: prod.unit_cost * 1,
        image: prod.image,
      };
      setItems([...items, newItem]);
      message.success(`Added "${prod.display_name}" to transfer`);
    }

    setSearchQuery('');
  };

  // Update item quantity
  const handleQuantityChange = (key, val) => {
    const qty = Math.max(0.01, parseFloat(val) || 1);
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, quantity: qty, subtotal: qty * item.unit_cost } : item))
    );
  };

  // Remove item
  const handleRemoveItem = (key) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  // Calculation totals
  const totalItemsCount = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
  const totalItemsCost = items.reduce((sum, item) => sum + (parseFloat(item.subtotal) || 0), 0);
  const grandTotal = totalItemsCost + (parseFloat(shippingCost) || 0);

  // Form submission
  const handleSubmit = async (values) => {
    if (parseInt(values.from_warehouse_id, 10) === parseInt(values.to_warehouse_id, 10)) {
      message.error('Source warehouse and destination warehouse cannot be the same!');
      return;
    }

    if (!items.length) {
      message.warning('Please add at least one product item to the transfer');
      return;
    }

    // If immediate dispatch, validate stock
    if (['in_transit', 'sent', 'completed'].includes(values.status)) {
      const deficient = items.find((item) => item.quantity > item.available_quantity);
      if (deficient) {
        message.error(
          `Insufficient stock for "${deficient.display_name}". Available: ${deficient.available_quantity}, Transferring: ${deficient.quantity}`
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        transfer_no: values.transfer_no,
        date: values.date ? values.date.format('YYYY-MM-DD HH:mm:ss') : dayjs().format('YYYY-MM-DD HH:mm:ss'),
        from_warehouse_id: values.from_warehouse_id,
        to_warehouse_id: values.to_warehouse_id,
        from_biller: values.from_biller || null,
        to_biller: values.to_biller || null,
        status: values.status,
        shipping: values.shipping || 0,
        note: values.note || '',
        items: items.map((i) => ({
          product_id: i.product_id,
          product_code: i.product_code,
          product_name: i.product_name,
          option_id: i.option_id,
          quantity: i.quantity,
          unit_cost: i.unit_cost,
          unit_quantity: 1,
          product_unit_code: i.unit_code,
          product_unit_id: i.unit_id,
          subtotal: i.subtotal,
        })),
      };

      const res = await axios.post('/api/admin/transfers', payload, { headers: getAuthHeaders() });
      if (res.data?.success) {
        message.success(res.data.message || 'Transfer created successfully!');
        if (onSuccess) {
          onSuccess(res.data.data);
        } else {
          navigate('/admins/products?tab=transfers');
        }
      }
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Failed to save transfer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackNavigation = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '16px 8px' }}>
      {/* Top Banner & Header */}
      <Card
        style={{
          marginBottom: 16,
          background: adminTheme.surface,
          borderColor: adminTheme.border,
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
        }}
        bodyStyle={{ padding: '16px 20px' }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} sm={16}>
            <Space align="center" size={14}>
              <Button icon={<RollbackOutlined />} onClick={handleBackNavigation}>
                Back
              </Button>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 22,
                }}
              >
                <SwapOutlined />
              </div>
              <div>
                <Title level={4} style={{ margin: 0, color: adminTheme.text }}>
                  Add Inventory Transfer
                </Title>
                <Text style={{ fontSize: 13, color: adminTheme.subtext }}>
                  Transfer stock between warehouses with real-time balance tracking and lifecycle validation
                </Text>
              </div>
            </Space>
          </Col>
          <Col xs={24} sm={8} style={{ textAlign: 'right' }}>
            <Space orientation="horizontal">
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={submitting}
                onClick={() => form.submit()}
                style={{ background: '#16a34a', borderColor: '#16a34a', fontWeight: 700 }}
              >
                Submit Transfer
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Main Form */}
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={[16, 16]}>
          {/* Left Column: Form Inputs & Product Search */}
          <Col xs={24} lg={17}>
            <Card
              title={
                <Space>
                  <ApartmentOutlined style={{ color: '#2563eb' }} />
                  <span>Transfer Information</span>
                </Space>
              }
              style={{
                marginBottom: 16,
                background: adminTheme.surface,
                borderColor: adminTheme.border,
              }}
            >
              <Row gutter={[16, 8]}>
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="date"
                    label={<strong>Date & Time</strong>}
                    rules={[{ required: true, message: 'Please select transfer date' }]}
                  >
                    <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm:ss" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={8}>
                  <Form.Item
                    name="transfer_no"
                    label={<strong>Reference No</strong>}
                    rules={[{ required: true, message: 'Reference No is required' }]}
                  >
                    <Input placeholder="TR-XXXXXX" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={8}>
                  <Form.Item
                    name="status"
                    label={<strong>Transfer Status</strong>}
                    rules={[{ required: true, message: 'Select initial status' }]}
                  >
                    <Select>
                      <Option value="pending">
                        <Tag color="orange">Pending (Transfer Request)</Tag>
                      </Option>
                      <Option value="approved">
                        <Tag color="blue">Approved (Transfer Order)</Tag>
                      </Option>
                      <Option value="in_transit">
                        <Tag color="purple">In Transit (Dispatch Now)</Tag>
                      </Option>
                      <Option value="completed">
                        <Tag color="green">Completed (Direct Transfer)</Tag>
                      </Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="from_warehouse_id"
                    label={<strong>From Warehouse (Source) *</strong>}
                    rules={[{ required: true, message: 'Source warehouse is required' }]}
                  >
                    <Select
                      placeholder="Select source warehouse"
                      onChange={(val) => {
                        setFromWarehouseId(val);
                        setItems([]); // Clear items if warehouse changes
                      }}
                    >
                      {warehouses.map((wh) => (
                        <Option key={wh.id} value={wh.id}>
                          <strong>{wh.name}</strong> ({wh.code})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="to_warehouse_id"
                    label={<strong>To Warehouse (Destination) *</strong>}
                    rules={[{ required: true, message: 'Destination warehouse is required' }]}
                  >
                    <Select
                      placeholder="Select destination warehouse"
                      onChange={(val) => setToWarehouseId(val)}
                    >
                      {warehouses.map((wh) => (
                        <Option key={wh.id} value={wh.id} disabled={wh.id === fromWarehouseId}>
                          <strong>{wh.name}</strong> ({wh.code})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item name="from_biller" label="From Biller / Entity">
                    <Select placeholder="Select sender entity" allowClear>
                      {billers.map((b) => (
                        <Option key={b.id} value={b.id}>
                          {b.company || b.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item name="to_biller" label="To Biller / Entity">
                    <Select placeholder="Select recipient entity" allowClear>
                      {billers.map((b) => (
                        <Option key={b.id} value={b.id}>
                          {b.company || b.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Product Search & Barcode Input */}
            <Card
              style={{
                marginBottom: 16,
                background: adminTheme.surface,
                borderColor: adminTheme.border,
              }}
              bodyStyle={{ padding: '16px' }}
            >
              <div style={{ marginBottom: 8 }}>
                <Text strong style={{ fontSize: 14 }}>
                  Scan Barcode or Search Products from{' '}
                  <span style={{ color: '#2563eb' }}>
                    {warehouses.find((w) => w.id === fromWarehouseId)?.name || 'Selected Warehouse'}
                  </span>
                </Text>
              </div>
              <AutoComplete
                options={productOptions}
                onSelect={handleSelectProduct}
                style={{ width: '100%' }}
                value={searchQuery}
                onChange={(val) => setSearchQuery(val)}
              >
                <Input
                  size="large"
                  placeholder="Scan barcode or enter product code / name..."
                  prefix={<BarcodeOutlined style={{ color: '#2563eb', fontSize: 20 }} />}
                  suffix={searchingProducts ? <Spin size="small" /> : <SearchOutlined />}
                />
              </AutoComplete>
            </Card>

            {/* Transfer Items Table */}
            <Card
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Transfer Items ({items.length})</span>
                  {items.length > 0 && (
                    <Button danger size="small" onClick={() => setItems([])}>
                      Clear All Items
                    </Button>
                  )}
                </div>
              }
              style={{
                background: adminTheme.surface,
                borderColor: adminTheme.border,
              }}
            >
              <Table
                dataSource={items}
                rowKey="key"
                pagination={false}
                locale={{ emptyText: 'No products added to transfer yet. Scan or search above.' }}
                columns={[
                  {
                    title: 'Product (Code - Name)',
                    key: 'product',
                    render: (_, r) => (
                      <div>
                        <strong style={{ color: adminTheme.text }}>{r.product_name}</strong>
                        {r.variant_name && <Tag color="blue" style={{ marginLeft: 6 }}>{r.variant_name}</Tag>}
                        <div style={{ fontSize: 12, color: adminTheme.subtext }}>
                          Code: {r.product_code} | Unit: {r.unit_code}
                        </div>
                      </div>
                    ),
                  },
                  {
                    title: 'On-Hand Stock',
                    dataIndex: 'available_quantity',
                    key: 'available_quantity',
                    align: 'center',
                    width: 130,
                    render: (q) => (
                      <Tag color={q > 0 ? 'green' : 'red'} style={{ fontWeight: 700 }}>
                        {Number(q).toLocaleString()}
                      </Tag>
                    ),
                  },
                  {
                    title: 'Transfer Qty',
                    key: 'quantity',
                    width: 140,
                    align: 'center',
                    render: (_, r) => (
                      <InputNumber
                        min={0.01}
                        value={r.quantity}
                        onChange={(val) => handleQuantityChange(r.key, val)}
                        style={{ width: '100%', fontWeight: 700 }}
                      />
                    ),
                  },
                  {
                    title: 'Unit Cost',
                    dataIndex: 'unit_cost',
                    key: 'unit_cost',
                    align: 'right',
                    width: 120,
                    render: (c) => formatCurrency(c),
                  },
                  {
                    title: 'Subtotal',
                    dataIndex: 'subtotal',
                    key: 'subtotal',
                    align: 'right',
                    width: 130,
                    render: (s) => <strong style={{ color: '#0284c7' }}>{formatCurrency(s)}</strong>,
                  },
                  {
                    title: '',
                    key: 'action',
                    width: 60,
                    align: 'center',
                    render: (_, r) => (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveItem(r.key)}
                      />
                    ),
                  },
                ]}
              />
            </Card>
          </Col>

          {/* Right Column: Summary, Notes, and Dispatch Details */}
          <Col xs={24} lg={7}>
            {/* Summary Card */}
            <Card
              title={<strong>Summary & Totals</strong>}
              style={{
                marginBottom: 16,
                background: adminTheme.surface,
                borderColor: adminTheme.border,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Total Line Items:</Text>
                  <strong>{totalItemsCount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Total Transfer Units:</Text>
                  <strong>{totalQuantity.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Items Total Cost:</Text>
                  <strong>{formatCurrency(totalItemsCost)}</strong>
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <div>
                  <Form.Item name="shipping" label="Shipping / Transport Charge">
                    <InputNumber
                      min={0}
                      style={{ width: '100%' }}
                      placeholder="0.00"
                      onChange={(val) => setShippingCost(val || 0)}
                    />
                  </Form.Item>
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#f8fafc',
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <Text strong style={{ fontSize: 15 }}>
                    Grand Total:
                  </Text>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Notes & Memo */}
            <Card
              title={<strong>Transfer Notes & Instructions</strong>}
              style={{
                background: adminTheme.surface,
                borderColor: adminTheme.border,
              }}
            >
              <Form.Item name="note" label="Remarks / Transport Memo">
                <Input.TextArea
                  rows={4}
                  placeholder="Enter logistics notes, vehicle details, driver name, or transfer reason..."
                />
              </Form.Item>

              <Alert
                message="Workflow Rule"
                description="Creating in 'Pending' reserves item intention without deducting stock. Selecting 'In Transit' deducts stock from the source warehouse immediately."
                type="info"
                showIcon
                style={{ fontSize: 12, marginTop: 12 }}
              />
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
