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
  ApartmentOutlined,
  InfoCircleOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  LockOutlined,
  InboxOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { formatCurrency } from '../../utils/uiTheme';
import { useAdminTheme } from '../../hooks/useAdminTheme';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function BpasEditPurchaseOrderPage({ onBack = null, onSuccess = null }) {
  const adminTheme = useAdminTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();

  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState('');

  // Metadata options
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [billers, setBillers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);

  // Items list
  const [items, setItems] = useState([]);

  // Product Search / Autocomplete
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOptions, setSearchOptions] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Order level financials
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [orderTax, setOrderTax] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [originalPo, setOriginalPo] = useState(null);

  // Fetch PO & Metadata
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [metaRes, poRes] = await Promise.all([
          axios.get('/api/admin/purchase_orders/meta/options'),
          axios.get(`/api/admin/purchase_orders/${id}`),
        ]);

        if (metaRes.data?.success && metaRes.data.data) {
          const d = metaRes.data.data;
          setWarehouses(d.warehouses || []);
          setSuppliers(d.suppliers || []);
          setBillers(d.billers || []);
          setProjects(d.projects || []);
        }

        if (poRes.data?.success && poRes.data.data) {
          const po = poRes.data.data;
          setOriginalPo(po);

          // Check if locked
          const hasReceivedItems = (po.items || []).some(
            (it) => parseFloat(it.quantity_received || 0) > 0
          );
          if (po.received == 1 || po.order_status === 'completed' || hasReceivedItems) {
            setIsLocked(true);
            setLockMessage(
              'This Purchase Order has already been partially or fully received into inventory stock. Line items cannot be modified directly; please adjust via Goods Received Note (GRN) / Stock Received.'
            );
          }

          setSelectedWarehouseId(po.warehouse_id);
          setSelectedSupplierId(po.supplier_id);
          setOrderDiscount(parseFloat(po.order_discount || 0));
          setOrderTax(parseFloat(po.order_tax || 0));
          setShipping(parseFloat(po.shipping || 0));

          form.setFieldsValue({
            date: dayjs(po.date),
            reference_no: po.reference_no,
            purchase_ref: po.purchase_ref || '',
            warehouse_id: po.warehouse_id,
            supplier_id: po.supplier_id,
            biller_id: po.biller_id || 3,
            project_id: po.project_id || 0,
            deadline: po.deadline ? dayjs(po.deadline) : null,
            payment_term: po.payment_term || 0,
            status: po.status || 'pending',
            note: po.note || '',
          });

          // Line items mapping
          const mappedItems = (po.items || []).map((it) => ({
            id: it.id,
            pri_id: it.pri_id,
            product_id: it.product_id,
            product_code: it.product_code || it.current_product_code,
            product_name: it.product_name || it.current_product_name,
            product_unit_id: it.product_unit_id,
            product_unit_code: it.product_unit_code || 'Unit',
            quantity: parseFloat(it.quantity || 1),
            quantity_received: parseFloat(it.quantity_received || 0),
            quantity_balance: parseFloat(it.quantity_balance !== undefined ? it.quantity_balance : (it.quantity - (it.quantity_received || 0))),
            unit_cost: parseFloat(it.unit_cost || 0),
            item_discount: parseFloat(it.item_discount || 0),
            item_tax: parseFloat(it.item_tax || 0),
            subtotal: parseFloat(it.subtotal || 0),
            qoh: parseFloat(it.live_qoh !== undefined ? it.live_qoh : it.qoh || 0),
            remarks: it.remarks || '',
          }));

          setItems(mappedItems);
        } else {
          message.error('Purchase Order not found');
          navigate('/admins/purchases_orders');
        }
      } catch (err) {
        console.error('Failed to load purchase order:', err);
        message.error(err.response?.data?.message || 'Failed to load purchase order');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, form, navigate]);

  // Product Search for autocomplete
  const handleSearchProducts = (text) => {
    if (isLocked) return;
    setSearchTerm(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!text || text.trim().length === 0) {
      setSearchOptions([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearchingProducts(true);
      try {
        const res = await axios.get('/api/admin/purchase_orders/products', {
          params: {
            warehouse_id: selectedWarehouseId || 'all',
            supplier_id: selectedSupplierId || null,
            term: text.trim(),
            limit: 20,
          },
        });
        if (res.data?.success && res.data.data) {
          const options = res.data.data.map((p) => {
            const pid = p.product_id || p.id;
            const pcode = p.product_code || p.code;
            const pname = p.product_name || p.name;
            const pcost = parseFloat(p.unit_cost || p.cost || 0);
            return {
              value: `${pcode} - ${pname}`,
              product: {
                product_id: pid,
                product_code: pcode,
                product_name: pname,
                unit_cost: pcost,
                product_unit_id: p.product_unit_id,
                product_unit_code: p.product_unit_code || 'Unit',
                qoh: parseFloat(p.qoh || 0),
              },
              label: (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text strong style={{ fontSize: 13 }}>{pname}</Text>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>
                      <Tag color="default" style={{ marginRight: 4 }}>{pcode}</Tag>
                      Unit: {p.product_unit_code || 'Unit'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: '#16a34a' }}>{formatCurrency(pcost)}</div>
                    <div style={{ fontSize: 11, color: '#8c8c8c' }}>Stock: {parseFloat(p.qoh || 0).toLocaleString()}</div>
                  </div>
                </div>
              ),
            };
          });
          setSearchOptions(options);
        }
      } catch (err) {
        console.warn('Product search failed:', err.message);
      } finally {
        setSearchingProducts(false);
      }
    }, 300);
  };

  // Add Product from autocomplete
  const handleSelectProduct = (value, option) => {
    if (isLocked || !option?.product) return;
    const p = option.product;

    const existingIndex = items.findIndex((it) => it.product_id === p.product_id);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].subtotal =
        (updated[existingIndex].quantity * updated[existingIndex].unit_cost) -
        (updated[existingIndex].item_discount || 0) +
        (updated[existingIndex].item_tax || 0);
      setItems(updated);
      message.info(`Increased quantity for ${p.product_name}`);
    } else {
      const newItem = {
        product_id: p.product_id,
        product_code: p.product_code,
        product_name: p.product_name,
        product_unit_id: p.product_unit_id,
        product_unit_code: p.product_unit_code || 'Unit',
        quantity: 1,
        quantity_received: 0,
        quantity_balance: 1,
        unit_cost: p.unit_cost,
        item_discount: 0,
        item_tax: 0,
        subtotal: p.unit_cost,
        qoh: p.qoh,
        remarks: '',
      };
      setItems([...items, newItem]);
      message.success(`Added ${p.product_name}`);
    }
    setSearchTerm('');
    setSearchOptions([]);
  };

  // Update item fields
  const handleItemChange = (index, field, value) => {
    if (isLocked) return;
    const updated = [...items];
    updated[index][field] = value;

    const qty = parseFloat(updated[index].quantity || 0);
    const cost = parseFloat(updated[index].unit_cost || 0);
    const disc = parseFloat(updated[index].item_discount || 0);
    const taxVal = parseFloat(updated[index].item_tax || 0);

    updated[index].subtotal = Math.max(0, (qty * cost) - disc + taxVal);
    setItems(updated);
  };

  // Remove item
  const handleRemoveItem = (index) => {
    if (isLocked) return;
    const updated = items.filter((_, idx) => idx !== index);
    setItems(updated);
  };

  // Financial calculations
  const calculateTotals = () => {
    let itemsTotal = 0;
    let totalQty = 0;
    let totalItemDiscount = 0;
    let totalItemTax = 0;

    for (const item of items) {
      const qty = parseFloat(item.quantity || 0);
      const cost = parseFloat(item.unit_cost || 0);
      const disc = parseFloat(item.item_discount || 0);
      const taxVal = parseFloat(item.item_tax || 0);

      itemsTotal += (qty * cost);
      totalQty += qty;
      totalItemDiscount += disc;
      totalItemTax += taxVal;
    }

    const numOrderDiscount = parseFloat(orderDiscount || 0);
    const numOrderTax = parseFloat(orderTax || 0);
    const numShipping = parseFloat(shipping || 0);

    const grandTotal = Math.max(0, itemsTotal - totalItemDiscount - numOrderDiscount + totalItemTax + numOrderTax + numShipping);

    return {
      itemsTotal,
      totalQty,
      totalItemDiscount,
      totalItemTax,
      grandTotal,
    };
  };

  const totals = calculateTotals();

  // Submit Handler
  const handleSubmit = async (values) => {
    if (isLocked) {
      message.warning('This order is locked because items have already been received.');
      return;
    }

    if (items.length === 0) {
      message.error('Please add at least one product line.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        date: values.date ? values.date.format('YYYY-MM-DD HH:mm:ss') : dayjs().format('YYYY-MM-DD HH:mm:ss'),
        reference_no: values.reference_no,
        purchase_ref: values.purchase_ref || '',
        warehouse_id: values.warehouse_id,
        supplier_id: values.supplier_id,
        biller_id: values.biller_id,
        project_id: values.project_id || 0,
        deadline: values.deadline ? values.deadline.format('YYYY-MM-DD') : null,
        payment_term: values.payment_term || 0,
        status: values.status || 'pending',
        shipping: shipping,
        order_discount: orderDiscount,
        order_tax: orderTax,
        note: values.note || '',
        items: items.map((it) => ({
          product_id: it.product_id,
          product_code: it.product_code,
          product_name: it.product_name,
          product_unit_id: it.product_unit_id,
          product_unit_code: it.product_unit_code,
          quantity: it.quantity,
          unit_cost: it.unit_cost,
          item_discount: it.item_discount || 0,
          item_tax: it.item_tax || 0,
          pri_id: it.pri_id || null,
          qoh: it.qoh || 0,
          remarks: it.remarks || '',
        })),
      };

      const res = await axios.put(`/api/admin/purchase_orders/${id}`, payload);
      if (res.data?.success) {
        message.success(`Purchase order ${values.reference_no} updated successfully!`);
        if (onSuccess) {
          onSuccess(res.data.data);
        } else {
          navigate('/admins/purchases_orders');
        }
      }
    } catch (err) {
      console.error('Failed to update purchase order:', err);
      message.error(err.response?.data?.message || 'Failed to update purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackNavigation = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/admins/purchases_orders');
    }
  };

  return (
    <div style={{ padding: '20px 24px' }}>
      {/* 1. Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            <ShoppingCartOutlined style={{ marginRight: 8, color: '#2563eb' }} />
            Edit Purchase Order #{id}
          </Title>
          <Paragraph type="secondary" style={{ margin: 0 }}>
            Modify vendor order specs, quantities, unit costs, and delivery parameters.
          </Paragraph>
        </div>
        <Space>
          <Button icon={<RollbackOutlined />} onClick={handleBackNavigation}>
            Back to Orders
          </Button>
          {!isLocked && (
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={submitting}
              onClick={() => form.submit()}
              style={{ background: '#2563eb' }}
            >
              Save Changes
            </Button>
          )}
        </Space>
      </div>

      {isLocked && (
        <Alert
          type="warning"
          showIcon
          icon={<LockOutlined />}
          message="Order Locked - Goods Receipt in Progress or Completed"
          description={lockMessage}
          style={{ marginBottom: 20, borderRadius: 8 }}
        />
      )}

      {loading ? (
        <Card style={{ textAlign: 'center', padding: '60px 0', borderRadius: 12 }}>
          <Spin size="large" />
          <div style={{ marginTop: 12, color: '#6b7280' }}>Loading purchase order #{id}...</div>
        </Card>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={isLocked}
        >
          {/* Header Fields */}
          <Card
            bordered={false}
            className="shadow-sm"
            style={{ borderRadius: 12, marginBottom: 20 }}
            title={<Text strong><ApartmentOutlined style={{ marginRight: 8, color: '#2563eb' }} />Order Header & Parties</Text>}
          >
            <Row gutter={[16, 12]}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  label="Order Date"
                  name="date"
                  rules={[{ required: true, message: 'Please select date' }]}
                >
                  <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm:ss" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  label="Reference No"
                  name="reference_no"
                  rules={[{ required: true, message: 'Reference number is required' }]}
                >
                  <Input placeholder="e.g. PO26/0001" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  label="Supplier"
                  name="supplier_id"
                  rules={[{ required: true, message: 'Please select supplier' }]}
                >
                  <Select
                    placeholder="Select supplier"
                    onChange={(val) => setSelectedSupplierId(val)}
                    showSearch
                    optionFilterProp="children"
                  >
                    {suppliers.map((s) => (
                      <Option key={s.id} value={s.id}>
                        {s.company && s.company !== '-' ? s.company : s.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  label="Destination Warehouse"
                  name="warehouse_id"
                  rules={[{ required: true, message: 'Please select destination warehouse' }]}
                >
                  <Select
                    placeholder="Select warehouse"
                    onChange={(val) => setSelectedWarehouseId(val)}
                  >
                    {warehouses.map((w) => (
                      <Option key={w.id} value={w.id}>{w.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Biller" name="biller_id">
                  <Select placeholder="Select biller entity">
                    {billers.map((b) => (
                      <Option key={b.id} value={b.id}>{b.company || b.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Expected Delivery Deadline" name="deadline">
                  <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Payment Term (Days)" name="payment_term">
                  <InputNumber style={{ width: '100%' }} min={0} max={365} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Approval Status" name="status">
                  <Select>
                    <Option value="pending">Pending Approval</Option>
                    <Option value="approved">Approved</Option>
                    <Option value="rejected">Rejected</Option>
                    <Option value="completed">Completed</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Supplier Quotation / Order Ref" name="purchase_ref">
                  <Input placeholder="Vendor proforma / quote #" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={24} md={18}>
                <Form.Item label="Order Notes & Special Instructions" name="note">
                  <Input placeholder="Delivery instructions, freight terms, receiving inspection notes..." />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Line Items */}
          <Card
            bordered={false}
            className="shadow-sm"
            style={{ borderRadius: 12, marginBottom: 20 }}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>
                  <ShoppingCartOutlined style={{ marginRight: 8, color: '#2563eb' }} />
                  Order Line Items ({items.length})
                </Text>
                {!isLocked && (
                  <div style={{ width: 400 }}>
                    <AutoComplete
                      style={{ width: '100%' }}
                      value={searchTerm}
                      options={searchOptions}
                      onSearch={handleSearchProducts}
                      onSelect={handleSelectProduct}
                      placeholder="Search product to add..."
                    >
                      <Input prefix={<SearchOutlined style={{ color: '#9ca3af' }} />} allowClear />
                    </AutoComplete>
                  </div>
                )}
              </div>
            }
          >
            <Table
              dataSource={items}
              rowKey={(r, idx) => (r.id || r.product_id) + '-' + idx}
              pagination={false}
              size="middle"
              bordered
              columns={[
                {
                  title: '#',
                  render: (_, __, idx) => idx + 1,
                  width: 45,
                  align: 'center',
                },
                {
                  title: 'Product',
                  key: 'product',
                  render: (_, r) => (
                    <div>
                      <Text strong>{r.product_name}</Text>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>
                        <Tag color="default" style={{ marginRight: 4 }}>{r.product_code}</Tag>
                        Stock: {parseFloat(r.qoh || 0).toLocaleString()}
                        {r.pri_id && <Tag color="purple" style={{ marginLeft: 6 }}>From PR</Tag>}
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Unit',
                  dataIndex: 'product_unit_code',
                  key: 'product_unit_code',
                  width: 80,
                  align: 'center',
                  render: (u) => u || 'Unit',
                },
                {
                  title: 'Unit Cost ($)',
                  key: 'unit_cost',
                  width: 130,
                  render: (_, r, idx) => (
                    <InputNumber
                      min={0}
                      step={0.01}
                      precision={2}
                      value={r.unit_cost}
                      disabled={isLocked}
                      onChange={(val) => handleItemChange(idx, 'unit_cost', val || 0)}
                      style={{ width: '100%' }}
                    />
                  ),
                },
                {
                  title: 'Ordered Qty',
                  key: 'quantity',
                  width: 120,
                  render: (_, r, idx) => (
                    <InputNumber
                      min={0.01}
                      step={1}
                      value={r.quantity}
                      disabled={isLocked}
                      onChange={(val) => handleItemChange(idx, 'quantity', val || 1)}
                      style={{ width: '100%' }}
                    />
                  ),
                },
                {
                  title: 'Received',
                  dataIndex: 'quantity_received',
                  key: 'quantity_received',
                  width: 90,
                  align: 'center',
                  render: (rec) => (
                    <Text style={{ color: parseFloat(rec || 0) > 0 ? '#16a34a' : '#9ca3af' }}>
                      {parseFloat(rec || 0).toLocaleString()}
                    </Text>
                  ),
                },
                {
                  title: 'Discount ($)',
                  key: 'item_discount',
                  width: 110,
                  render: (_, r, idx) => (
                    <InputNumber
                      min={0}
                      step={0.1}
                      value={r.item_discount || 0}
                      disabled={isLocked}
                      onChange={(val) => handleItemChange(idx, 'item_discount', val || 0)}
                      style={{ width: '100%' }}
                    />
                  ),
                },
                {
                  title: 'Tax ($)',
                  key: 'item_tax',
                  width: 100,
                  render: (_, r, idx) => (
                    <InputNumber
                      min={0}
                      step={0.1}
                      value={r.item_tax || 0}
                      disabled={isLocked}
                      onChange={(val) => handleItemChange(idx, 'item_tax', val || 0)}
                      style={{ width: '100%' }}
                    />
                  ),
                },
                {
                  title: 'Subtotal ($)',
                  key: 'subtotal',
                  width: 120,
                  align: 'right',
                  render: (_, r) => (
                    <Text strong style={{ color: '#16a34a' }}>
                      {formatCurrency(r.subtotal || 0)}
                    </Text>
                  ),
                },
                {
                  title: '',
                  key: 'actions',
                  width: 50,
                  align: 'center',
                  render: (_, __, idx) => (
                    !isLocked && (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveItem(idx)}
                      />
                    )
                  ),
                },
              ]}
            />

            {/* Financial Summary & Adjustments */}
            <Row gutter={[24, 16]} style={{ marginTop: 24 }}>
              <Col xs={24} md={12}>
                <Card size="small" title={<Text strong>Order Adjustments</Text>} style={{ background: '#f8fafc' }}>
                  <Row gutter={[16, 12]}>
                    <Col span={8}>
                      <div><Text type="secondary" style={{ fontSize: 12 }}>Order Discount ($)</Text></div>
                      <InputNumber
                        min={0}
                        step={0.5}
                        value={orderDiscount}
                        disabled={isLocked}
                        onChange={(v) => setOrderDiscount(v || 0)}
                        style={{ width: '100%', marginTop: 4 }}
                      />
                    </Col>
                    <Col span={8}>
                      <div><Text type="secondary" style={{ fontSize: 12 }}>Order Tax ($)</Text></div>
                      <InputNumber
                        min={0}
                        step={0.5}
                        value={orderTax}
                        disabled={isLocked}
                        onChange={(v) => setOrderTax(v || 0)}
                        style={{ width: '100%', marginTop: 4 }}
                      />
                    </Col>
                    <Col span={8}>
                      <div><Text type="secondary" style={{ fontSize: 12 }}>Shipping / Freight ($)</Text></div>
                      <InputNumber
                        min={0}
                        step={1}
                        value={shipping}
                        disabled={isLocked}
                        onChange={(v) => setShipping(v || 0)}
                        style={{ width: '100%', marginTop: 4 }}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text type="secondary">Total Line Items:</Text>
                    <Text strong>{items.length} lines ({totals.totalQty} total units)</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text type="secondary">Items Gross Total:</Text>
                    <Text strong>{formatCurrency(totals.itemsTotal)}</Text>
                  </div>
                  {totals.totalItemDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text type="secondary">Items Total Discount:</Text>
                      <Text style={{ color: '#dc2626' }}>-{formatCurrency(totals.totalItemDiscount)}</Text>
                    </div>
                  )}
                  {parseFloat(orderDiscount || 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text type="secondary">Order Level Discount:</Text>
                      <Text style={{ color: '#dc2626' }}>-{formatCurrency(orderDiscount)}</Text>
                    </div>
                  )}
                  {parseFloat(orderTax || 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text type="secondary">Order Level Tax:</Text>
                      <Text>+{formatCurrency(orderTax)}</Text>
                    </div>
                  )}
                  {parseFloat(shipping || 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text type="secondary">Shipping / Freight:</Text>
                      <Text>+{formatCurrency(shipping)}</Text>
                    </div>
                  )}
                  <Divider style={{ margin: '12px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ fontSize: 16 }}>Purchase Order Total:</Text>
                    <Text strong style={{ fontSize: 24, color: '#16a34a' }}>
                      {formatCurrency(totals.grandTotal)}
                    </Text>
                  </div>
                </div>
              </Col>
            </Row>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <Button size="large" onClick={handleBackNavigation}>
                Back
              </Button>
              {!isLocked && (
                <Button
                  type="primary"
                  size="large"
                  icon={<SaveOutlined />}
                  loading={submitting}
                  onClick={() => form.submit()}
                  style={{ background: '#2563eb' }}
                >
                  Save Changes
                </Button>
              )}
            </div>
          </Card>
        </Form>
      )}
    </div>
  );
}
