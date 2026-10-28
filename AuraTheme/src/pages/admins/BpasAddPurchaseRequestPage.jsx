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
  Alert
} from 'antd';
import {
  SaveOutlined,
  RollbackOutlined,
  DeleteOutlined,
  SearchOutlined,
  BarcodeOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  AuditOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/uiTheme';
import { useAdminTheme } from '../../hooks/useAdminTheme';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function BpasAddPurchaseRequestPage({ onBack = null, onSuccess = null }) {
  const adminTheme = useAdminTheme();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Loading states
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Metadata options
  const [warehouses, setWarehouses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [billers, setBillers] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);

  // Items
  const [items, setItems] = useState([]);

  // Product Search / Autocomplete
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOptions, setSearchOptions] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Fetch Metadata Options
  const fetchMetadata = async () => {
    setLoadingMeta(true);
    try {
      const res = await axios.get('/api/admin/purchase_requests/meta/options');
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        setWarehouses(d.warehouses || []);
        setDepartments(d.departments || []);
        setSuppliers(d.suppliers || []);
        setBillers(d.billers || []);

        const defaultWh = d.warehouses[0]?.id || null;
        setSelectedWarehouseId(defaultWh);

        form.setFieldsValue({
          date: dayjs(),
          reference_no: d.nextReference || '',
          warehouse_id: defaultWh,
          department_id: d.departments[0]?.id || null,
          supplier_id: d.suppliers[0]?.id || null,
          biller_id: d.billers[0]?.id || null,
          status: 'pending',
          required_date_text: 'Within 7 business days',
          purpose: 'Restocking inventory for department sales',
        });
      }
    } catch (err) {
      message.error('Failed to load initial metadata options');
    } finally {
      setLoadingMeta(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  // Search Products for AutoComplete with live QOH
  const handleProductSearch = (value) => {
    setSearchTerm(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!value || value.trim().length === 0) {
      setSearchOptions([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearchingProducts(true);
      try {
        const res = await axios.get('/api/admin/purchase_requests/products', {
          params: {
            warehouse_id: selectedWarehouseId || 'all',
            term: value.trim(),
            limit: 15,
          }
        });

        if (res.data?.success && res.data.data) {
          const opts = res.data.data.map(p => ({
            value: `${p.product_id}`,
            label: (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong>{p.product_name}</Text>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {p.product_code} | {p.product_unit_name || 'Unit'}
                    </Text>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Tag color={p.qoh > 0 ? 'blue' : 'default'} style={{ fontWeight: 600 }}>
                    QOH: {parseFloat(p.qoh || 0)}
                  </Tag>
                  <div>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Cost: {formatCurrency(parseFloat(p.unit_cost || 0))}
                    </Text>
                  </div>
                </div>
              </div>
            ),
            product: p,
          }));
          setSearchOptions(opts);
        }
      } catch (err) {
        console.warn('Product search failed:', err.message);
      } finally {
        setSearchingProducts(false);
      }
    }, 250);
  };

  // Add Product to Items Table
  const handleSelectProduct = (value, option) => {
    const prod = option.product;
    if (!prod) return;

    setItems(prev => {
      const existingIdx = prev.findIndex(it => it.product_id === prod.product_id);
      if (existingIdx >= 0) {
        const copy = [...prev];
        const newQty = (copy[existingIdx].quantity || 1) + 1;
        copy[existingIdx] = {
          ...copy[existingIdx],
          quantity: newQty,
          subtotal: newQty * copy[existingIdx].unit_cost,
        };
        return copy;
      }

      const defaultCost = parseFloat(prod.unit_cost || 0);
      return [
        ...prev,
        {
          key: prod.product_id,
          product_id: prod.product_id,
          product_code: prod.product_code,
          product_name: prod.product_name,
          product_type: prod.product_type,
          product_unit_id: prod.product_unit_id,
          product_unit_code: prod.product_unit_code,
          unit_cost: defaultCost,
          quantity: 1,
          subtotal: defaultCost * 1,
          qoh: parseFloat(prod.qoh || 0),
          description: '',
        }
      ];
    });

    setSearchTerm('');
    setSearchOptions([]);
  };

  // Update item field
  const handleItemChange = (idx, field, value) => {
    setItems(prev => {
      const copy = [...prev];
      const item = { ...copy[idx], [field]: value };
      if (field === 'quantity' || field === 'unit_cost') {
        const q = parseFloat(field === 'quantity' ? value : item.quantity) || 0;
        const c = parseFloat(field === 'unit_cost' ? value : item.unit_cost) || 0;
        item.subtotal = q * c;
      }
      copy[idx] = item;
      return copy;
    });
  };

  // Remove Item
  const handleRemoveItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  // Calculate Totals
  const totalQuantity = items.reduce((sum, it) => sum + (parseFloat(it.quantity) || 0), 0);
  const totalAmount = items.reduce((sum, it) => sum + (parseFloat(it.subtotal) || 0), 0);

  // Submit Handler
  const handleSubmit = async (values) => {
    if (items.length === 0) {
      message.error('Please add at least one product to the purchase request.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        date: values.date ? values.date.format('YYYY-MM-DD HH:mm:ss') : dayjs().format('YYYY-MM-DD HH:mm:ss'),
        reference_no: values.reference_no,
        warehouse_id: values.warehouse_id,
        department_id: values.department_id,
        supplier_id: values.supplier_id,
        biller_id: values.biller_id,
        purpose: values.purpose || '',
        required_date: values.required_date ? values.required_date.format('YYYY-MM-DD') : null,
        required_date_text: values.required_date_text || '',
        deadline: values.deadline ? values.deadline.format('YYYY-MM-DD HH:mm:ss') : null,
        status: values.status || 'pending',
        note: values.note || '',
        items: items.map(it => ({
          product_id: it.product_id,
          product_code: it.product_code,
          product_name: it.product_name,
          product_type: it.product_type,
          quantity: it.quantity,
          unit_cost: it.unit_cost,
          product_unit_id: it.product_unit_id,
          product_unit_code: it.product_unit_code,
          qoh: it.qoh,
          description: it.description || '',
        }))
      };

      const res = await axios.post('/api/admin/purchase_requests', payload);
      if (res.data?.success) {
        message.success(`Purchase request ${res.data.data.reference_no} submitted successfully!`);
        if (onSuccess) {
          onSuccess(res.data.data);
        } else {
          navigate('/admins/products?tab=purchase-requests');
        }
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to create purchase request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/admins/products?tab=purchase-requests');
    }
  };

  const itemColumns = [
    {
      title: 'Product Information',
      key: 'product_info',
      render: (_, r) => (
        <div>
          <Text strong>{r.product_name}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Code: {r.product_code} | Unit: {r.product_unit_code || 'Unit'}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Current QOH',
      key: 'qoh',
      align: 'center',
      width: 130,
      render: (_, r) => (
        <Tag color={r.qoh > 0 ? 'blue' : 'default'}>
          {r.qoh} in stock
        </Tag>
      ),
    },
    {
      title: 'Requested Qty',
      key: 'qty',
      width: 140,
      align: 'center',
      render: (_, r, idx) => (
        <InputNumber
          min={1}
          value={r.quantity}
          onChange={(val) => handleItemChange(idx, 'quantity', val)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Est. Unit Cost',
      key: 'unit_cost',
      width: 140,
      align: 'center',
      render: (_, r, idx) => (
        <InputNumber
          min={0}
          step={0.1}
          value={r.unit_cost}
          onChange={(val) => handleItemChange(idx, 'unit_cost', val)}
          style={{ width: '100%' }}
          prefix="$"
        />
      ),
    },
    {
      title: 'Subtotal',
      key: 'subtotal',
      width: 140,
      align: 'right',
      render: (_, r) => (
        <Text strong style={{ fontSize: 13 }}>
          {formatCurrency(parseFloat(r.subtotal || 0))}
        </Text>
      ),
    },
    {
      title: 'Remarks / Item Note',
      key: 'desc',
      width: 200,
      render: (_, r, idx) => (
        <Input
          placeholder="e.g. Specification or brand..."
          value={r.description}
          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
        />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 70,
      align: 'center',
      render: (_, __, idx) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveItem(idx)}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: '20px 24px', width: '100%', boxSizing: 'border-box' }}>
      {/* Top Header Card */}
      <Card
        bordered={false}
        style={{
          marginBottom: 16,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          background: adminTheme.cardBg,
          borderColor: adminTheme.sidebarBorder,
        }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} sm={16}>
            <Space align="center" size={12} wrap>
              <Button icon={<RollbackOutlined />} onClick={handleBack}>
                Back to Requests
              </Button>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: adminTheme.isDark ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShoppingCartOutlined style={{ fontSize: 20, color: '#2563eb' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Title level={4} style={{ margin: 0, fontWeight: 700, color: adminTheme.text }}>
                    Create Purchase Request
                  </Title>
                  <Tag color="gold" style={{ fontWeight: 700, margin: 0 }}>NEW DRAFT</Tag>
                </div>
                <Text type="secondary" style={{ fontSize: 13, color: adminTheme.subtext }}>
                  Submit internal purchase requisition for department material procurement
                </Text>
              </div>
            </Space>
          </Col>

          <Col xs={24} sm={8} style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={handleBack}>Cancel</Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={submitting}
                style={{ background: '#2563eb', borderColor: '#2563eb', fontWeight: 600 }}
                onClick={() => form.submit()}
              >
                Submit Requisition
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {/* Requisition Information Card */}
        <Card
          title={
            <Space>
              <FileTextOutlined style={{ color: '#2563eb' }} />
              <span style={{ color: adminTheme.text }}>Requisition Information</span>
            </Space>
          }
          bordered={false}
          style={{
            borderRadius: 12,
            marginBottom: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            background: adminTheme.cardBg,
            borderColor: adminTheme.sidebarBorder,
          }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="Requesting Department"
                name="department_id"
                rules={[{ required: true, message: 'Department is required' }]}
              >
                <Select placeholder="Select Department" loading={loadingMeta}>
                  {departments.map(d => (
                    <Option key={d.id} value={d.id}>{d.name} ({d.code || 'Dept'})</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="Destination Warehouse"
                name="warehouse_id"
                rules={[{ required: true, message: 'Warehouse is required' }]}
              >
                <Select
                  placeholder="Select Warehouse"
                  onChange={(val) => setSelectedWarehouseId(val)}
                  loading={loadingMeta}
                >
                  {warehouses.map(w => (
                    <Option key={w.id} value={w.id}>{w.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="Suggested Supplier (Optional)"
                name="supplier_id"
              >
                <Select
                  showSearch
                  filterOption={(input, opt) => (opt?.children || '').toLowerCase().includes(input.toLowerCase())}
                  placeholder="Select Supplier"
                  loading={loadingMeta}
                >
                  {suppliers.map(s => (
                    <Option key={s.id} value={s.id}>
                      {s.company && s.company !== '-' ? `${s.company} (${s.name})` : s.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="Biller / Entity"
                name="biller_id"
              >
                <Select placeholder="Select Biller">
                  {billers.map(b => (
                    <Option key={b.id} value={b.id}>{b.company || b.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="PR Reference No"
                name="reference_no"
                rules={[{ required: true, message: 'Reference number is required' }]}
              >
                <Input placeholder="Auto-generated" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="Request Date"
                name="date"
                rules={[{ required: true, message: 'Date is required' }]}
              >
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="Target Delivery Date / Text"
                name="required_date_text"
                rules={[{ required: true, message: 'Delivery expectation is required' }]}
              >
                <Input placeholder="e.g. Within 7 days, or Urgent" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="Purpose / Business Need"
                name="purpose"
                rules={[{ required: true, message: 'Purpose is required' }]}
              >
                <Input placeholder="Describe the reason for this purchase request..." />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Requested Products Card */}
        <Card
          title={
            <Space>
              <ShoppingCartOutlined style={{ color: '#2563eb' }} />
              <span style={{ color: adminTheme.text }}>Requested Products</span>
            </Space>
          }
          bordered={false}
          style={{
            borderRadius: 12,
            marginBottom: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            background: adminTheme.cardBg,
            borderColor: adminTheme.sidebarBorder,
          }}
        >
          {/* Product Search Bar */}
          <div style={{ marginBottom: 16 }}>
            <AutoComplete
              style={{ width: '100%' }}
              options={searchOptions}
              onSelect={handleSelectProduct}
              onSearch={handleProductSearch}
              value={searchTerm}
            >
              <Input
                size="large"
                placeholder="Type product name, code, or scan barcode to add requisition item..."
                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                suffix={searchingProducts ? <Spin size="small" /> : <BarcodeOutlined style={{ color: '#94a3b8' }} />}
              />
            </AutoComplete>
          </div>

          {/* Items Table */}
          <Table
            dataSource={items}
            columns={itemColumns}
            rowKey="key"
            pagination={false}
            locale={{ emptyText: 'No products added to requisition. Search above to add items.' }}
            summary={() => items.length > 0 && (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ background: adminTheme.isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc', fontWeight: 600 }}>
                  <Table.Summary.Cell index={0}>
                    <Text strong style={{ color: adminTheme.text }}>Total ({items.length} line items)</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} />
                  <Table.Summary.Cell index={2} align="center">
                    <Tag color="blue" style={{ fontSize: 13, padding: '2px 10px', fontWeight: 700 }}>
                      {totalQuantity.toLocaleString()} units
                    </Tag>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} />
                  <Table.Summary.Cell index={4} align="right">
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#2563eb' }}>
                      {formatCurrency(totalAmount)}
                    </span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} />
                  <Table.Summary.Cell index={6} />
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />

          {/* Remarks */}
          <Divider style={{ margin: '16px 0' }} />
          <Form.Item label="Public Notes / Requisition Instructions" name="note">
            <TextArea rows={3} placeholder="Additional instructions or notes for procurement team..." />
          </Form.Item>
        </Card>

        {/* Bottom Action & Requisition Summary Strip */}
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            marginBottom: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            background: adminTheme.cardBg,
            borderColor: adminTheme.sidebarBorder,
          }}
        >
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Space size={24} wrap>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', color: adminTheme.subtext }}>Total Line Items</Text>
                  <Text strong style={{ fontSize: 16, color: adminTheme.text }}>{items.length}</Text>
                </div>
                <Divider type="vertical" style={{ height: 32 }} />
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', color: adminTheme.subtext }}>Total Units Requested</Text>
                  <Text strong style={{ fontSize: 16, color: adminTheme.text }}>{totalQuantity.toLocaleString()} units</Text>
                </div>
                <Divider type="vertical" style={{ height: 32 }} />
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', color: adminTheme.subtext }}>Estimated Value</Text>
                  <span style={{ fontSize: 19, fontWeight: 800, color: '#2563eb' }}>
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </Space>
            </Col>
            <Col xs={24} md={12} style={{ textAlign: 'right' }}>
              <Space size={12}>
                <Button size="large" onClick={handleBack} style={{ minWidth: 100 }}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  size="large"
                  icon={<SaveOutlined />}
                  loading={submitting}
                  onClick={() => form.submit()}
                  style={{ background: '#2563eb', borderColor: '#2563eb', fontWeight: 700, minWidth: 170 }}
                >
                  Submit Requisition
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      </Form>
    </div>
  );
}
