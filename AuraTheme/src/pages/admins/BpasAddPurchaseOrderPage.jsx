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
  Alert,
  Radio
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
  LinkOutlined,
  DollarOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatCurrency } from '../../utils/uiTheme';
import { useAdminTheme } from '../../hooks/useAdminTheme';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function BpasAddPurchaseOrderPage({ onBack = null, onSuccess = null }) {
  const adminTheme = useAdminTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();

  // Mode: 'standalone' vs 'import_pr'
  const [creationMode, setCreationMode] = useState('standalone');

  // Loading states
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingPrItems, setLoadingPrItems] = useState(false);

  // Metadata options
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [billers, setBillers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [approvedPrs, setApprovedPrs] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
  const [selectedPrId, setSelectedPrId] = useState(null);

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

  // Fetch Metadata Options
  const fetchMetadata = async () => {
    setLoadingMeta(true);
    try {
      const res = await axios.get('/api/admin/purchase_orders/meta/options');
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        setWarehouses(d.warehouses || []);
        setSuppliers(d.suppliers || []);
        setBillers(d.billers || []);
        setProjects(d.projects || []);
        setTaxRates(d.taxRates || []);
        setApprovedPrs(d.approvedPurchaseRequests || []);

        const defaultWh = d.warehouses[0]?.id || 1;
        const defaultSup = d.suppliers[0]?.id || 1;
        setSelectedWarehouseId(defaultWh);
        setSelectedSupplierId(defaultSup);

        form.setFieldsValue({
          date: dayjs(),
          reference_no: d.nextReference || '',
          warehouse_id: defaultWh,
          supplier_id: defaultSup,
          biller_id: d.billers[0]?.id || 3,
          project_id: d.projects[0]?.id || 0,
          deadline: dayjs().add(7, 'day'),
          payment_term: 30,
          status: 'pending',
          order_discount: 0,
          order_tax: 0,
          shipping: 0,
        });

        // Check if query params have pr_id or quote_id to import
        const queryPrId = searchParams.get('quote_id') || searchParams.get('pr_id') || searchParams.get('purchase_request_id');
        if (queryPrId) {
          setCreationMode('import_pr');
          handleSelectPr(parseInt(queryPrId, 10));
        }
      }
    } catch (err) {
      console.error('Failed to load purchase orders metadata:', err);
      message.error('Failed to load metadata options');
    } finally {
      setLoadingMeta(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  // Handle PR selection for import
  const handleSelectPr = async (prId) => {
    if (!prId) return;
    setSelectedPrId(prId);
    setLoadingPrItems(true);
    try {
      const res = await axios.get(`/api/admin/purchase_orders/purchase_requests/${prId}/items`);
      if (res.data?.success && res.data.data) {
        const { pr, items: prItems } = res.data.data;

        // Populate header fields from PR
        if (pr) {
          form.setFieldsValue({
            warehouse_id: pr.warehouse_id,
            supplier_id: pr.supplier_id,
            purchase_ref: pr.reference_no,
            note: `Imported from PR ${pr.reference_no}${pr.note ? ` - ${pr.note}` : ''}`,
          });
          setSelectedWarehouseId(pr.warehouse_id);
          setSelectedSupplierId(pr.supplier_id);
        }

        // Map PR items to PO items
        const mappedItems = prItems.map((item) => {
          const qty = parseFloat(item.quantity || 1);
          const cost = parseFloat(item.unit_cost || 0);
          const disc = parseFloat(item.item_discount || 0);
          const taxVal = parseFloat(item.item_tax || 0);
          return {
            pri_id: item.pri_id,
            product_id: item.product_id,
            product_code: item.product_code,
            product_name: item.product_name,
            product_unit_id: item.product_unit_id,
            product_unit_code: item.product_unit_code || 'Unit',
            requested_qty: parseFloat(item.requested_qty || qty),
            ordered_qty: parseFloat(item.ordered_qty || 0),
            quantity: qty,
            unit_cost: cost,
            item_discount: disc,
            item_tax: taxVal,
            subtotal: (qty * cost) - disc + taxVal,
            qoh: parseFloat(item.qoh || 0),
            remarks: item.remarks || '',
          };
        });

        setItems(mappedItems);
        message.success(`Imported ${mappedItems.length} item(s) from PR ${pr?.reference_no || prId}`);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to import purchase request items');
    } finally {
      setLoadingPrItems(false);
    }
  };

  // Product Search for autocomplete
  const handleSearchProducts = (text) => {
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
    if (!option?.product) return;
    const p = option.product;

    // Check if already in items
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
    if (items.length === 0) {
      message.error('Please add at least one product line to the purchase order.');
      return;
    }

    for (const item of items) {
      if (!item.quantity || item.quantity <= 0) {
        message.error(`Please specify a valid quantity for ${item.product_name}.`);
        return;
      }
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
        request_id: creationMode === 'import_pr' ? selectedPrId : null,
        purchase_request_id: creationMode === 'import_pr' ? selectedPrId : null,
        deadline: values.deadline ? values.deadline.format('YYYY-MM-DD') : null,
        payment_term: values.payment_term || 0,
        status: values.status || 'pending',
        order_status: 'pending',
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

      const res = await axios.post('/api/admin/purchase_orders', payload);
      if (res.data?.success) {
        message.success(`Purchase order ${res.data.data?.reference_no || ''} created successfully!`);
        if (onSuccess) {
          onSuccess(res.data.data);
        } else {
          navigate('/admins/purchases_orders');
        }
      }
    } catch (err) {
      console.error('Failed to create purchase order:', err);
      message.error(err.response?.data?.message || 'Failed to create purchase order');
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
            Add Purchase Order
          </Title>
          <Paragraph type="secondary" style={{ margin: 0 }}>
            Create a vendor purchase order from scratch or import from an approved purchase requisition.
          </Paragraph>
        </div>
        <Space>
          <Button icon={<RollbackOutlined />} onClick={handleBackNavigation}>
            Back to Orders
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={submitting}
            onClick={() => form.submit()}
            style={{ background: '#2563eb' }}
          >
            Create Purchase Order
          </Button>
        </Space>
      </div>

      {/* 2. Inventory Stock Rule Notice */}
      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message="Inventory Separation Rule"
        description="Creating or approving a Purchase Order does NOT increase warehouse inventory. Physical stock is updated only when goods receipts are recorded via Goods Received Note (GRN) / Stock Received."
        style={{ marginBottom: 20, borderRadius: 8 }}
      />

      {loadingMeta ? (
        <Card style={{ textAlign: 'center', padding: '60px 0', borderRadius: 12 }}>
          <Spin size="large" />
          <div style={{ marginTop: 12, color: '#6b7280' }}>Loading configuration & master data...</div>
        </Card>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            date: dayjs(),
            payment_term: 30,
            status: 'pending',
          }}
        >
          {/* Creation Mode Switch */}
          <Card
            bordered={false}
            className="shadow-sm"
            style={{ borderRadius: 12, marginBottom: 20, background: '#f8fafc' }}
          >
            <Row align="middle" justify="space-between">
              <Col>
                <Text strong style={{ fontSize: 14, marginRight: 16 }}>Creation Mode:</Text>
                <Radio.Group
                  value={creationMode}
                  onChange={(e) => {
                    const mode = e.target.value;
                    setCreationMode(mode);
                    if (mode === 'standalone') {
                      setSelectedPrId(null);
                    }
                  }}
                  buttonStyle="solid"
                >
                  <Radio.Button value="standalone">
                    <FileTextOutlined style={{ marginRight: 6 }} />
                    Standalone Purchase Order
                  </Radio.Button>
                  <Radio.Button value="import_pr">
                    <LinkOutlined style={{ marginRight: 6 }} />
                    Import from Approved Purchase Request
                  </Radio.Button>
                </Radio.Group>
              </Col>
              {creationMode === 'import_pr' && (
                <Col xs={24} md={12} style={{ marginTop: 8 }}>
                  <Space style={{ width: '100%' }}>
                    <Text strong>Select Approved PR:</Text>
                    <Select
                      style={{ minWidth: 320 }}
                      placeholder="Select approved PR to import items..."
                      value={selectedPrId}
                      onChange={handleSelectPr}
                      loading={loadingPrItems}
                    >
                      {approvedPrs.map((pr) => (
                        <Option key={pr.id} value={pr.id}>
                          {pr.reference_no} - {pr.supplier} ({parseFloat(pr.total_qty || 0)} units - {formatCurrency(pr.grand_total || 0)})
                        </Option>
                      ))}
                    </Select>
                  </Space>
                </Col>
              )}
            </Row>
          </Card>

          {/* Form Header Fields */}
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
                  <InputNumber style={{ width: '100%' }} min={0} max={365} placeholder="e.g. 30" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Initial Approval Status" name="status">
                  <Select>
                    <Option value="pending">Pending Approval</Option>
                    <Option value="approved">Approved</Option>
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

          {/* Product Search & Line Items */}
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
                <div style={{ width: 400 }}>
                  <AutoComplete
                    style={{ width: '100%' }}
                    value={searchTerm}
                    options={searchOptions}
                    onSearch={handleSearchProducts}
                    onSelect={handleSelectProduct}
                    placeholder="Search product by name, code, barcode..."
                  >
                    <Input prefix={<SearchOutlined style={{ color: '#9ca3af' }} />} allowClear />
                  </AutoComplete>
                </div>
              </div>
            }
          >
            <Table
              dataSource={items}
              rowKey={(r, idx) => r.product_id + '-' + idx}
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
                      onChange={(val) => handleItemChange(idx, 'unit_cost', val || 0)}
                      style={{ width: '100%' }}
                    />
                  ),
                },
                {
                  title: 'Quantity',
                  key: 'quantity',
                  width: 120,
                  render: (_, r, idx) => (
                    <InputNumber
                      min={0.01}
                      step={1}
                      value={r.quantity}
                      onChange={(val) => handleItemChange(idx, 'quantity', val || 1)}
                      style={{ width: '100%' }}
                    />
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
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveItem(idx)}
                    />
                  ),
                },
              ]}
              locale={{
                emptyText: (
                  <div style={{ padding: '30px 0', textAlign: 'center', color: '#9ca3af' }}>
                    <ShoppingCartOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                    <div>No items added yet. Search products above or import an approved PR.</div>
                  </div>
                ),
              }}
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

            {/* Bottom Form Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <Button size="large" onClick={handleBackNavigation}>
                Cancel
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<SaveOutlined />}
                loading={submitting}
                onClick={() => form.submit()}
                style={{ background: '#2563eb' }}
              >
                Create Purchase Order
              </Button>
            </div>
          </Card>
        </Form>
      )}
    </div>
  );
}
