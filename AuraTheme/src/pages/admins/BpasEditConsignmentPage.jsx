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
  AutoComplete,
  Spin,
  Tooltip,
} from 'antd';
import {
  SaveOutlined,
  RollbackOutlined,
  DeleteOutlined,
  SearchOutlined,
  BarcodeOutlined,
  ShopOutlined,
  SendOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { formatCurrency } from '../../utils/uiTheme';
import { useAdminTheme } from '../../hooks/useAdminTheme';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function BpasEditConsignmentPage({ onBack = null, onSuccess = null }) {
  const adminTheme = useAdminTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();

  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Metadata options
  const [warehouses, setWarehouses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [billers, setBillers] = useState([]);
  const [consignmentRecord, setConsignmentRecord] = useState(null);

  // Items
  const [items, setItems] = useState([]);

  // Product Search / Autocomplete
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOptions, setSearchOptions] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Load Metadata and Record
  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      try {
        const [metaRes, detailRes] = await Promise.all([
          axios.get('/api/admin/consignments/meta/options'),
          axios.get(`/api/admin/consignments/${id}`)
        ]);

        if (metaRes.data?.success && metaRes.data.data) {
          const d = metaRes.data.data;
          setWarehouses(d.warehouses || []);
          setCustomers(d.customers || []);
          setBillers(d.billers || []);
        }

        if (detailRes.data?.success && detailRes.data.data) {
          const rec = detailRes.data.data;
          setConsignmentRecord(rec);

          form.setFieldsValue({
            date: rec.date ? dayjs(rec.date) : dayjs(),
            dispatch_date: rec.dispatch_date ? dayjs(rec.dispatch_date) : dayjs(),
            valid_day: rec.valid_day || 30,
            expected_return_date: rec.expected_return_date ? dayjs(rec.expected_return_date) : null,
            reference_no: rec.reference_no,
            warehouse_id: rec.warehouse_id,
            customer_id: rec.customer_id,
            biller_id: rec.biller_id,
            destination: rec.destination,
            status: rec.status,
            note: rec.note,
          });

          const mappedItems = (rec.items || []).map((it, idx) => ({
            key: `item_${it.id || idx}_${Date.now()}`,
            id: it.id,
            product_id: it.product_id,
            product_code: it.product_code,
            product_name: it.product_name,
            product_type: it.product_type || 'standard',
            product_unit_id: it.product_unit_id,
            product_unit_code: it.product_unit_code || 'Unit',
            option_id: it.option_id || null,
            unit_price: parseFloat(it.unit_price || 0),
            real_unit_price: parseFloat(it.real_unit_price || it.unit_price || 0),
            net_unit_price: parseFloat(it.net_unit_price || it.unit_price || 0),
            unit_cost: parseFloat(it.unit_cost || 0),
            quantity: parseFloat(it.quantity || 0),
            return_qty: parseFloat(it.return_qty || 0),
            sale_qty: parseFloat(it.sale_qty || 0),
            damage_qty: parseFloat(it.damage_qty || 0),
            missing_qty: parseFloat(it.missing_qty || 0),
            batch_no: it.batch_no || '',
            expiry: it.expiry ? dayjs(it.expiry).format('YYYY-MM-DD') : null,
            current_warehouse_stock: parseFloat(it.current_warehouse_stock || 0),
          }));

          setItems(mappedItems);
        }
      } catch (err) {
        message.error(err.response?.data?.message || 'Failed to load consignment record');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, form]);

  // Search Products for addition
  const handleProductSearch = (value) => {
    setSearchTerm(value);
    if (!value || value.trim().length < 1) {
      setSearchOptions([]);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      setSearchingProducts(true);
      try {
        const whId = form.getFieldValue('warehouse_id') || 'all';
        const res = await axios.get('/api/admin/consignments/products', {
          params: { warehouse_id: whId, term: value, limit: 15 }
        });
        if (res.data?.success && res.data.data) {
          const opts = res.data.data.map((p) => ({
            value: String(p.product_id),
            label: (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{p.product_name}</span>
                  <span style={{ fontSize: 12, color: adminTheme.subtext, marginLeft: 8 }}>
                    ({p.product_code})
                  </span>
                </div>
                <div style={{ fontSize: 12, textAlign: 'right' }}>
                  <span style={{ color: parseFloat(p.current_warehouse_stock) > 0 ? '#059669' : '#dc2626', fontWeight: 600 }}>
                    Stock: {parseFloat(p.current_warehouse_stock || 0)} {p.product_unit_code || 'Unit'}
                  </span>
                  <span style={{ marginLeft: 10, color: '#2563eb' }}>
                    Price: {formatCurrency(p.unit_price || 0)}
                  </span>
                </div>
              </div>
            ),
            product: p,
          }));
          setSearchOptions(opts);
        }
      } catch (err) {
        console.warn('Failed to search products:', err.message);
      } finally {
        setSearchingProducts(false);
      }
    }, 300);
  };

  // Add Product
  const handleSelectProduct = (value, option) => {
    const prod = option.product;
    if (!prod) return;

    const existingIndex = items.findIndex(it => it.product_id === prod.product_id);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity = (parseFloat(updated[existingIndex].quantity) || 0) + 1;
      setItems(updated);
      message.info(`Increased quantity for ${prod.product_name}`);
    } else {
      const newItem = {
        key: `prod_${prod.product_id}_${Date.now()}`,
        product_id: prod.product_id,
        product_code: prod.product_code,
        product_name: prod.product_name,
        product_type: prod.product_type || 'standard',
        product_unit_id: prod.product_unit_id,
        product_unit_code: prod.product_unit_code || 'Unit',
        option_id: null,
        unit_price: parseFloat(prod.unit_price || 0),
        real_unit_price: parseFloat(prod.unit_price || 0),
        net_unit_price: parseFloat(prod.unit_price || 0),
        unit_cost: parseFloat(prod.unit_cost || 0),
        quantity: 1,
        return_qty: 0,
        sale_qty: 0,
        damage_qty: 0,
        missing_qty: 0,
        batch_no: '',
        expiry: null,
        current_warehouse_stock: parseFloat(prod.current_warehouse_stock || 0),
      };
      setItems([...items, newItem]);
      message.success(`Added ${prod.product_name}`);
    }

    setSearchTerm('');
    setSearchOptions([]);
  };

  // Item field change
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  // Remove Item
  const handleRemoveItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  // Calculate Totals
  const totalUnits = items.reduce((sum, it) => sum + (parseFloat(it.quantity) || 0), 0);
  const totalAmount = items.reduce((sum, it) => sum + ((parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0)), 0);

  // Submit Handler
  const handleSubmit = async (values) => {
    if (items.length === 0) {
      message.error('Please add at least one product item.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        date: values.date ? values.date.format('YYYY-MM-DD HH:mm:ss') : dayjs().format('YYYY-MM-DD HH:mm:ss'),
        dispatch_date: values.dispatch_date ? values.dispatch_date.format('YYYY-MM-DD HH:mm:ss') : dayjs().format('YYYY-MM-DD HH:mm:ss'),
        valid_day: values.valid_day || 30,
        expected_return_date: values.expected_return_date ? values.expected_return_date.format('YYYY-MM-DD') : null,
        reference_no: values.reference_no,
        warehouse_id: values.warehouse_id,
        customer_id: values.customer_id,
        biller_id: values.biller_id,
        destination: values.destination || '',
        note: values.note || '',
        status: values.status,
        items: items.map(it => ({
          id: it.id || null,
          product_id: it.product_id,
          product_code: it.product_code,
          product_name: it.product_name,
          product_type: it.product_type || 'standard',
          product_unit_id: it.product_unit_id,
          product_unit_code: it.product_unit_code,
          option_id: it.option_id || null,
          unit_price: parseFloat(it.unit_price || 0),
          real_unit_price: parseFloat(it.real_unit_price || it.unit_price || 0),
          net_unit_price: parseFloat(it.net_unit_price || it.unit_price || 0),
          unit_cost: parseFloat(it.unit_cost || 0),
          quantity: parseFloat(it.quantity || 0),
          return_qty: parseFloat(it.return_qty || 0),
          sale_qty: parseFloat(it.sale_qty || 0),
          damage_qty: parseFloat(it.damage_qty || 0),
          missing_qty: parseFloat(it.missing_qty || 0),
          batch_no: it.batch_no || '',
          expiry: it.expiry || null,
        })),
      };

      const res = await axios.put(`/api/admin/consignments/${id}`, payload);
      if (res.data?.success) {
        message.success('Consignment voucher updated and inventory re-synced successfully!');
        if (onSuccess) {
          onSuccess(res.data.data);
        } else {
          navigate('/admins/products?tab=consignments');
        }
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to update consignment voucher');
    } finally {
      setSubmitting(false);
    }
  };

  // Back Navigation
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/admins/products?tab=consignments');
    }
  };

  // Table Columns
  const columns = [
    {
      title: '#',
      key: 'idx',
      width: 45,
      render: (_, __, i) => i + 1,
    },
    {
      title: 'Product (Code & Name)',
      key: 'product',
      render: (_, it) => (
        <div>
          <div style={{ fontWeight: 600 }}>{it.product_name}</div>
          <div style={{ fontSize: 12, color: adminTheme.subtext }}>
            SKU: {it.product_code} | Unit: {it.product_unit_code}
          </div>
        </div>
      ),
    },
    {
      title: 'Dispatched Qty *',
      key: 'quantity',
      width: 140,
      render: (_, it, index) => (
        <InputNumber
          min={0.01}
          step={1}
          value={it.quantity}
          onChange={(val) => handleItemChange(index, 'quantity', val)}
          style={{ width: '100%', borderColor: '#2563eb' }}
        />
      ),
    },
    {
      title: 'Sold',
      dataIndex: 'sale_qty',
      key: 'sale_qty',
      width: 80,
      align: 'right',
      render: (q) => <Tag color="green">{parseFloat(q || 0)}</Tag>,
    },
    {
      title: 'Returned',
      dataIndex: 'return_qty',
      key: 'return_qty',
      width: 85,
      align: 'right',
      render: (q) => <Tag color="purple">{parseFloat(q || 0)}</Tag>,
    },
    {
      title: 'Price ($)',
      key: 'unit_price',
      width: 120,
      render: (_, it, index) => (
        <InputNumber
          min={0}
          step={0.01}
          value={it.unit_price}
          onChange={(val) => handleItemChange(index, 'unit_price', val)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Batch #',
      key: 'batch_no',
      width: 120,
      render: (_, it, index) => (
        <Input
          placeholder="Batch"
          value={it.batch_no}
          onChange={(e) => handleItemChange(index, 'batch_no', e.target.value)}
        />
      ),
    },
    {
      title: 'Expiry Date',
      key: 'expiry',
      width: 135,
      render: (_, it, index) => (
        <DatePicker
          placeholder="YYYY-MM-DD"
          value={it.expiry ? dayjs(it.expiry) : null}
          onChange={(date) => handleItemChange(index, 'expiry', date ? date.format('YYYY-MM-DD') : null)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Subtotal',
      key: 'subtotal',
      width: 110,
      align: 'right',
      render: (_, it) => (
        <span style={{ fontWeight: 700, color: '#1e293b' }}>
          {formatCurrency((parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0))}
        </span>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 50,
      align: 'center',
      render: (_, __, index) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveItem(index)}
        />
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spin size="large" tip="Loading Consignment Voucher..." />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Header Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShopOutlined style={{ color: '#2563eb' }} />
            Edit Consignment - {consignmentRecord?.reference_no || `#${id}`}
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Modify consigned product allocations, adjust terms, update statuses, and safely re-sync warehouse stock.
          </Text>
        </div>
        <Space>
          <Button icon={<RollbackOutlined />} onClick={handleBack}>
            Back to List
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={submitting}
            onClick={() => form.submit()}
            style={{ fontWeight: 600, background: '#2563eb' }}
          >
            Update & Resync Consignment
          </Button>
        </Space>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        {/* 2. Header Form Card */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileTextOutlined style={{ color: '#2563eb' }} />
              <span>Consignment Header & Agreement Details</span>
            </div>
          }
          bordered={false}
          style={{ background: adminTheme.surface, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          <Row gutter={[16, 12]}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="Voucher Date"
                name="date"
                rules={[{ required: true, message: 'Date is required' }]}
              >
                <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="Reference Number"
                name="reference_no"
                rules={[{ required: true, message: 'Reference number is required' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="Customer / Consignee"
                name="customer_id"
                rules={[{ required: true, message: 'Customer is required' }]}
              >
                <Select
                  placeholder="Select customer / consignee"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {customers.map((c) => (
                    <Option key={c.id} value={c.id}>
                      {c.company && c.company !== '-' ? c.company : c.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="Source Warehouse"
                name="warehouse_id"
                rules={[{ required: true, message: 'Source warehouse is required' }]}
              >
                <Select placeholder="Select source warehouse">
                  {warehouses.map((wh) => (
                    <Option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Destination Store / Location" name="destination">
                <Input placeholder="Customer branch, booth, or shelf location" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Valid Agreement (Days)" name="valid_day">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Expected Return Date" name="expected_return_date">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Consignment Status" name="status" rules={[{ required: true }]}>
                <Select>
                  <Option value="dispatched">Dispatched</Option>
                  <Option value="partially_sold">Partially Sold</Option>
                  <Option value="partially_returned">Partially Returned</Option>
                  <Option value="completed">Completed</Option>
                  <Option value="pending">Pending</Option>
                  <Option value="draft">Draft</Option>
                  <Option value="cancelled">Cancelled (Revert Stock)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 3. Products Items Table */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SendOutlined style={{ color: '#2563eb' }} />
                <span>Dispatched Consignment Items ({items.length} products)</span>
              </div>
              <Space>
                <Tag color="blue" style={{ fontSize: 13, padding: '3px 10px' }}>
                  Total Dispatched Units: <strong>{totalUnits.toLocaleString()}</strong>
                </Tag>
                <Tag color="green" style={{ fontSize: 13, padding: '3px 10px' }}>
                  Total Stock Value: <strong>{formatCurrency(totalAmount)}</strong>
                </Tag>
              </Space>
            </div>
          }
          bordered={false}
          style={{ background: adminTheme.surface, borderRadius: 8, marginTop: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          {/* Autocomplete Search Bar */}
          <div style={{ marginBottom: 16 }}>
            <AutoComplete
              style={{ width: '100%' }}
              options={searchOptions}
              onSearch={handleProductSearch}
              onSelect={handleSelectProduct}
              value={searchTerm}
            >
              <Input
                size="large"
                placeholder="Search products by SKU code, name, or scan barcode to add item..."
                prefix={<SearchOutlined style={{ color: '#2563eb' }} />}
                suffix={searchingProducts ? <Spin size="small" /> : <BarcodeOutlined style={{ color: adminTheme.subtext }} />}
                allowClear
              />
            </AutoComplete>
          </div>

          <Table
            dataSource={items}
            columns={columns}
            pagination={false}
            scroll={{ x: 1000 }}
            size="middle"
          />

          <Divider style={{ margin: '16px 0' }} />

          {/* Bottom Notes & Submit Card */}
          <Row gutter={[16, 16]}>
            <Col xs={24} md={14}>
              <Form.Item label="Consignment Terms & Delivery Remarks" name="note">
                <TextArea rows={3} placeholder="Commission agreement, return policy notes, driver signature..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={10}>
              <Card
                bordered
                style={{ background: '#f8fafc', borderColor: '#e2e8f0', borderRadius: 8 }}
                bodyStyle={{ padding: 16 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text type="secondary">Total Line Products:</Text>
                  <strong>{items.length}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text type="secondary">Total Dispatched Units:</Text>
                  <strong style={{ color: '#2563eb', fontSize: 15 }}>{totalUnits.toLocaleString()}</strong>
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                  <Text strong style={{ fontSize: 15 }}>Total Consigned Value:</Text>
                  <strong style={{ fontSize: 17, color: '#059669' }}>{formatCurrency(totalAmount)}</strong>
                </div>
                <Button
                  type="primary"
                  block
                  size="large"
                  icon={<SaveOutlined />}
                  loading={submitting}
                  onClick={() => form.submit()}
                  style={{ background: '#2563eb', fontWeight: 700 }}
                >
                  Update & Resync Consignment
                </Button>
              </Card>
            </Col>
          </Row>
        </Card>
      </Form>
    </div>
  );
}
