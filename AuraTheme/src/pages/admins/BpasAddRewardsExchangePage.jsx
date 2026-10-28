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
  GiftOutlined,
  TrophyOutlined,
  DollarOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/uiTheme';
import { useAdminTheme } from '../../hooks/useAdminTheme';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function BpasAddRewardsExchangePage({ onBack = null, onSuccess = null }) {
  const adminTheme = useAdminTheme();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Loading states
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Metadata options
  const [warehouses, setWarehouses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [billers, setBillers] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

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
      const res = await axios.get('/api/admin/rewards_exchange/meta/options');
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        setWarehouses(d.warehouses || []);
        setCustomers(d.customers || []);
        setBillers(d.billers || []);

        const defaultWh = d.warehouses[0]?.id || null;
        setSelectedWarehouseId(defaultWh);

        const defaultCust = d.customers[0] || null;
        setSelectedCustomer(defaultCust);

        form.setFieldsValue({
          date: dayjs(),
          reference_no: d.nextReference || '',
          warehouse_id: defaultWh,
          customer_id: defaultCust?.id || null,
          biller_id: d.billers[0]?.id || null,
          category: 'customer',
          type: 'points',
          status: 'completed',
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

  // Handle Customer Change
  const handleCustomerChange = (customerId) => {
    const cust = customers.find(c => c.id === customerId);
    setSelectedCustomer(cust || null);
  };

  // Search Products for AutoComplete
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
        const res = await axios.get('/api/admin/rewards_exchange/products', {
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
                  <Tag color="gold" style={{ fontWeight: 600 }}>{p.default_points} pts</Tag>
                  <div>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Stock: {parseFloat(p.warehouse_stock || 0)}
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
          total_points: newQty * copy[existingIdx].points,
        };
        return copy;
      }

      const defaultPts = prod.default_points || 10;
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
          unit_price: parseFloat(prod.unit_price || 0),
          unit_cost: parseFloat(prod.unit_cost || 0),
          points: defaultPts,
          quantity: 1,
          total_points: defaultPts * 1,
          warehouse_stock: parseFloat(prod.warehouse_stock || 0),
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
      if (field === 'quantity' || field === 'points') {
        const q = parseFloat(field === 'quantity' ? value : item.quantity) || 0;
        const p = parseFloat(field === 'points' ? value : item.points) || 0;
        item.total_points = q * p;
      }
      copy[idx] = item;
      return copy;
    });
  };

  // Remove Item
  const handleRemoveItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  // Calculate Totals & Validation
  const totalQuantity = items.reduce((sum, it) => sum + (parseFloat(it.quantity) || 0), 0);
  const totalPointsRequired = items.reduce((sum, it) => sum + (parseFloat(it.total_points) || 0), 0);
  const customerAvailablePoints = parseFloat(selectedCustomer?.award_points || 0);
  const exchangeType = Form.useWatch('type', form) || 'points';
  const hasInsufficientPoints = (exchangeType === 'points' && totalPointsRequired > customerAvailablePoints);
  const remainingPoints = customerAvailablePoints - totalPointsRequired;

  // Submit Handler
  const handleSubmit = async (values) => {
    if (items.length === 0) {
      message.error('Please add at least one exchange or redemption item.');
      return;
    }

    if (hasInsufficientPoints) {
      message.error(`Customer has only ${customerAvailablePoints} points, but ${totalPointsRequired} points are required.`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        date: values.date ? values.date.format('YYYY-MM-DD HH:mm:ss') : dayjs().format('YYYY-MM-DD HH:mm:ss'),
        reference_no: values.reference_no,
        category: values.category || 'customer',
        type: values.type || 'points',
        warehouse_id: values.warehouse_id,
        customer_id: values.customer_id,
        biller_id: values.biller_id,
        status: values.status || 'completed',
        note: values.note || '',
        staff_note: values.staff_note || '',
        items: items.map(it => ({
          product_id: it.product_id,
          product_code: it.product_code,
          product_name: it.product_name,
          product_type: it.product_type,
          quantity: it.quantity,
          points: it.points,
          unit_price: it.unit_price,
          unit_cost: it.unit_cost,
          product_unit_id: it.product_unit_id,
          product_unit_code: it.product_unit_code,
        }))
      };

      const res = await axios.post('/api/admin/rewards_exchange', payload);
      if (res.data?.success) {
        message.success(`Rewards exchange voucher ${res.data.data.reference_no} created successfully! Points deducted and inventory updated.`);
        if (onSuccess) {
          onSuccess(res.data.data);
        } else {
          navigate('/admins/products?tab=rewards-exchange');
        }
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to create rewards exchange');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/admins/products?tab=rewards-exchange');
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
      title: 'Warehouse Stock',
      key: 'wh_stock',
      align: 'center',
      width: 130,
      render: (_, r) => (
        <Tag color={r.warehouse_stock > 0 ? 'blue' : 'default'}>
          {r.warehouse_stock} in stock
        </Tag>
      ),
    },
    {
      title: 'Points / Unit',
      key: 'points',
      width: 140,
      align: 'center',
      render: (_, r, idx) => (
        <InputNumber
          min={0}
          value={r.points}
          onChange={(val) => handleItemChange(idx, 'points', val)}
          style={{ width: '100%' }}
          addonAfter="pts"
        />
      ),
    },
    {
      title: 'Exchange Qty',
      key: 'qty',
      width: 130,
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
      title: 'Subtotal Points',
      key: 'subtotal_points',
      width: 150,
      align: 'right',
      render: (_, r) => (
        <span style={{ fontWeight: 700, color: '#d97706', fontSize: 14 }}>
          {parseFloat(r.total_points || 0).toLocaleString()} pts
        </span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
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
    <div style={{ padding: '20px', maxWidth: 1250, margin: '0 auto' }}>
      {/* Header bar */}
      <Card bordered={false} style={{ marginBottom: 16, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space align="center" size={12}>
              <Button icon={<RollbackOutlined />} onClick={handleBack}>
                Back to Rewards
              </Button>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrophyOutlined style={{ fontSize: 20, color: '#d97706' }} />
              </div>
              <div>
                <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                  Add Rewards Exchange
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Create loyalty point redemption voucher or product exchange
                </Text>
              </div>
            </Space>
          </Col>

          <Col>
            <Space>
              <Button onClick={handleBack}>Cancel</Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={submitting}
                disabled={hasInsufficientPoints}
                style={{ background: hasInsufficientPoints ? undefined : '#d97706', borderColor: hasInsufficientPoints ? undefined : '#d97706', fontWeight: 600 }}
                onClick={() => form.submit()}
              >
                Save & Issue Rewards
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Warning banner if insufficient points */}
      {hasInsufficientPoints && (
        <Alert
          message="Insufficient Loyalty Points"
          description={`Customer "${selectedCustomer?.name || 'Selected Customer'}" has only ${customerAvailablePoints} points available, but this redemption requires ${totalPointsRequired} points. Please reduce item quantities or add points to the customer profile.`}
          type="error"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
      )}

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={[16, 16]}>
          {/* Main Form Fields */}
          <Col xs={24} lg={16}>
            <Card
              title={<Space><FileTextOutlined style={{ color: '#2563eb' }} /><span>Voucher Information</span></Space>}
              bordered={false}
              style={{ borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Customer / Beneficiary"
                    name="customer_id"
                    rules={[{ required: true, message: 'Customer is required' }]}
                  >
                    <Select
                      showSearch
                      filterOption={(input, opt) => (opt?.children || '').toLowerCase().includes(input.toLowerCase())}
                      placeholder="Select Customer"
                      onChange={handleCustomerChange}
                      loading={loadingMeta}
                    >
                      {customers.map(c => (
                        <Option key={c.id} value={c.id}>
                          {c.company && c.company !== '-' ? `${c.company} (${c.name})` : c.name} — [{c.award_points || 0} pts]
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Fulfillment Warehouse"
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

                <Col xs={24} sm={8}>
                  <Form.Item
                    label="Reference Number"
                    name="reference_no"
                    rules={[{ required: true, message: 'Reference number is required' }]}
                  >
                    <Input placeholder="Auto-generated" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={8}>
                  <Form.Item
                    label="Exchange Date"
                    name="date"
                    rules={[{ required: true, message: 'Date is required' }]}
                  >
                    <DatePicker showTime style={{ width: '100%' }} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={8}>
                  <Form.Item
                    label="Exchange Type"
                    name="type"
                    rules={[{ required: true, message: 'Exchange type is required' }]}
                  >
                    <Select>
                      <Option value="points">Points Redemption</Option>
                      <Option value="product">Product Exchange</Option>
                      <Option value="money">Money Exchange</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Biller / Company"
                    name="biller_id"
                  >
                    <Select placeholder="Select Biller">
                      {billers.map(b => (
                        <Option key={b.id} value={b.id}>{b.company || b.name}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Status"
                    name="status"
                    rules={[{ required: true, message: 'Status is required' }]}
                  >
                    <Select>
                      <Option value="completed">Completed (Deduct Points & Stock Now)</Option>
                      <Option value="pending">Pending (Review & Issue Later)</Option>
                      <Option value="approved">Approved</Option>
                      <Option value="draft">Draft</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Product Selector and Items Table */}
            <Card
              title={<Space><GiftOutlined style={{ color: '#d97706' }} /><span>Exchange & Redemption Items</span></Space>}
              bordered={false}
              style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
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
                    placeholder="Type product name, code, or scan barcode to add reward item..."
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
                locale={{ emptyText: 'No reward items added yet. Search above to add products.' }}
              />

              {/* Notes */}
              <Divider style={{ margin: '16px 0' }} />
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label="Public Customer Note" name="note">
                    <TextArea rows={3} placeholder="Note displayed on printed voucher..." />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Staff Internal Note" name="staff_note">
                    <TextArea rows={3} placeholder="Internal staff notes and comments..." />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Right Summary Sidebar */}
          <Col xs={24} lg={8}>
            {/* Customer Loyalty Profile Card */}
            <Card
              bordered={false}
              style={{
                borderRadius: 12,
                marginBottom: 16,
                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                border: '1px solid #fde68a',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Space>
                    <TrophyOutlined style={{ color: '#d97706', fontSize: 20 }} />
                    <Text strong style={{ color: '#92400e', fontSize: 15 }}>Customer Loyalty Balance</Text>
                  </Space>
                  <Tag color="gold" style={{ fontWeight: 700 }}>ACTIVE</Tag>
                </div>

                <Divider style={{ margin: '6px 0', borderColor: '#fde68a' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="secondary">Customer:</Text>
                  <Text strong>{selectedCustomer?.name || 'No customer selected'}</Text>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="secondary">Current Points Balance:</Text>
                  <span style={{ fontSize: 20, fontWeight: 800, color: '#d97706' }}>
                    {customerAvailablePoints.toLocaleString()} pts
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="secondary">Points to Redeem:</Text>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#dc2626' }}>
                    -{totalPointsRequired.toLocaleString()} pts
                  </span>
                </div>

                <Divider style={{ margin: '6px 0', borderColor: '#fde68a' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong style={{ color: remainingPoints < 0 ? '#dc2626' : '#15803d' }}>
                    Remaining After Exchange:
                  </Text>
                  <span style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: remainingPoints < 0 ? '#dc2626' : '#15803d'
                  }}>
                    {remainingPoints.toLocaleString()} pts
                  </span>
                </div>
              </Space>
            </Card>

            {/* Redemption Summary Card */}
            <Card
              title={<Space><CheckCircleOutlined style={{ color: '#10b981' }} /><span>Voucher Summary</span></Space>}
              bordered={false}
              style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size={14}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Unique Items:</Text>
                  <Text strong>{items.length}</Text>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Total Units Issued:</Text>
                  <Text strong>{totalQuantity} units</Text>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Total Points Required:</Text>
                  <span style={{ fontWeight: 800, fontSize: 18, color: '#d97706' }}>
                    {totalPointsRequired.toLocaleString()} pts
                  </span>
                </div>

                <Divider style={{ margin: '8px 0' }} />

                <Button
                  type="primary"
                  block
                  size="large"
                  icon={<SaveOutlined />}
                  loading={submitting}
                  disabled={hasInsufficientPoints}
                  style={{
                    background: hasInsufficientPoints ? undefined : '#d97706',
                    borderColor: hasInsufficientPoints ? undefined : '#d97706',
                    fontWeight: 700,
                    height: 46
                  }}
                  onClick={() => form.submit()}
                >
                  Confirm & Deduct Points
                </Button>

                <Button block onClick={handleBack}>
                  Cancel
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
