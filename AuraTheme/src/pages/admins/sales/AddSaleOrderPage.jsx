import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Row,
  Col,
  Typography,
  Form,
  InputNumber,
  message,
  Divider,
  Empty,
  Modal,
  Tooltip,
  AutoComplete
} from 'antd';
import {
  ShoppingOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  DollarOutlined,
  CheckOutlined,
  UserOutlined,
  BarcodeOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  CameraOutlined,
  CalculatorOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatCurrency } from '../../../utils/uiTheme';
import { useAdminTheme } from '../../../hooks/useAdminTheme';
import { useTranslation } from '../../../contexts/LanguageContext';
import BpasItemEditModal from '../../../components/common/BpasItemEditModal';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const API_BASE = '/api/admin/sales_orders';

const AddSaleOrderPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const adminTheme = useAdminTheme();
  const themeTokens = adminTheme?.themeTokens || adminTheme;
  const isDark = adminTheme?.isDark;
  const [form] = Form.useForm();
  const searchInputRef = useRef(null);

  // Loading States
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Metadata options
  const [customers, setCustomers] = useState([]);
  const [billers, setBillers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [taxRates, setTaxRates] = useState([]);

  // Selected Warehouse
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);

  // Items List
  const [formItems, setFormItems] = useState([]);

  // Autocomplete / Search state
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);

  // Edit Item Modal state
  const [editingItem, setEditingItem] = useState(null);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // Order Calculations
  const [orderDiscount, setOrderDiscount] = useState('0');
  const [orderTaxId, setOrderTaxId] = useState(null);
  const [shipping, setShipping] = useState(0);

  // Advance Deposit collection
  const [collectDeposit, setCollectDeposit] = useState(false);

  // 1. Fetch metadata (customers, billers, warehouses, taxRates, next reference)
  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      setLoadingMeta(true);
      const res = await axios.get(`${API_BASE}/meta/options`);
      if (res.data?.success && res.data?.data) {
        const {
          customers = [],
          billers = [],
          warehouses = [],
          taxRates = [],
          nextReference = ''
        } = res.data.data;

        setCustomers(customers);
        setBillers(billers);
        setWarehouses(warehouses);
        setTaxRates(taxRates);

        // Set form defaults
        const defaultWh = warehouses[0]?.id || 1;
        const defaultBiller = billers[0]?.id || 1;
        const defaultCustomer = customers[0]?.id || 1;

        setSelectedWarehouseId(defaultWh);

        form.setFieldsValue({
          date: new Date().toISOString().slice(0, 10),
          reference_no: nextReference || `SALE-ORD-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-0001`,
          warehouse_id: defaultWh,
          biller_id: defaultBiller,
          customer_id: defaultCustomer,
          order_status: 'pending',
          sale_status: 'order',
          order_discount: '0',
          order_tax_id: null,
          shipping: 0,
          paid: 0,
          paid_by: 'Cash'
        });
      }
    } catch (err) {
      console.error('Error fetching sales order metadata:', err);
      message.error(t('failed_load_metadata', 'Failed to load form options'));
    } finally {
      setLoadingMeta(false);
    }
  };

  // 2. Fetch product suggestions for autocomplete matching AURA_v1 #add_item
  const fetchSuggestions = async (term) => {
    if (!term || term.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    try {
      setSearching(true);
      const res = await axios.get('/api/admin/sales/suggestions', {
        params: {
          term: term.trim(),
          warehouse_id: selectedWarehouseId || 1
        }
      });
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setSuggestions(res.data.data);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error('Error searching products:', err);
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  };

  // 3. Add product item to table
  const handleSelectProduct = (productCode) => {
    const found = suggestions.find((p) => p.code === productCode);
    if (!found) return;

    // Check if already in items list -> increment quantity
    const existingIndex = formItems.findIndex((i) => i.product_id === found.id);
    if (existingIndex >= 0) {
      const updated = [...formItems];
      updated[existingIndex].quantity = (Number(updated[existingIndex].quantity) || 1) + 1;
      setFormItems(updated);
      message.info(t('item_qty_incremented', 'Increased quantity for product in list'));
    } else {
      // Add new row with AURA_v1 structure
      const newItem = {
        product_id: found.id,
        product_code: found.code,
        product_name: found.name,
        product_type: found.type || 'standard',
        description: '',
        net_unit_price: Number(found.price) || 0,
        unit_price: Number(found.price) || 0,
        real_unit_price: Number(found.price) || 0,
        quantity: 1,
        unit_quantity: 1,
        product_unit_id: found.unit_id || 1,
        product_unit_code: found.unit_name || 'Unit',
        qoh: Number(found.qoh) || 0,
        item_discount: '0',
        discount: 0,
        item_tax: 0,
        tax_rate_id: 1,
        tax: '0%',
        expiry: ''
      };
      setFormItems([...formItems, newItem]);
    }

    setSearchValue('');
    setSuggestions([]);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // 4. Remove item from list
  const handleRemoveItem = (index) => {
    const updated = formItems.filter((_, idx) => idx !== index);
    setFormItems(updated);
  };

  // 5. Update item inline (Quantity, Unit Price, etc.)
  const handleUpdateItemField = (index, field, value) => {
    const updated = [...formItems];
    updated[index][field] = value;
    setFormItems(updated);
  };

  // 6. Open BPAS Item Edit Modal (Unit, Option, Expiry, Tax, Discount)
  const handleOpenEditItem = (item, index) => {
    setEditingItem(item);
    setEditingIndex(index);
    setEditModalVisible(true);
  };

  // 7. Save edited item back to row
  const handleSaveEditedItem = (savedData) => {
    if (editingIndex < 0) return;
    const updated = [...formItems];
    updated[editingIndex] = {
      ...updated[editingIndex],
      ...savedData,
      quantity: Number(savedData.quantity) || updated[editingIndex].quantity,
      net_unit_price: Number(savedData.net_unit_cost || savedData.net_unit_price) || updated[editingIndex].net_unit_price,
      item_discount: savedData.discount || updated[editingIndex].item_discount,
      expiry: savedData.expiry || updated[editingIndex].expiry,
      product_unit_id: savedData.product_unit_id || updated[editingIndex].product_unit_id,
      product_unit_code: savedData.product_unit_code || updated[editingIndex].product_unit_code,
      description: savedData.description !== undefined ? savedData.description : updated[editingIndex].description
    };
    setFormItems(updated);
    setEditModalVisible(false);
  };

  // 8. Financial Calculations (subtotal, line discounts, line taxes, order discount, order tax, grand total)
  const calculations = useMemo(() => {
    let itemsTotal = 0;
    let totalQty = 0;

    formItems.forEach((item) => {
      const qty = Number(item.quantity) || 0;
      const unitPrice = Number(item.net_unit_price) || 0;

      // Item discount (either % e.g. "10%" or flat e.g. 5)
      let itemDiscountVal = 0;
      if (typeof item.item_discount === 'string' && item.item_discount.includes('%')) {
        const pct = parseFloat(item.item_discount) || 0;
        itemDiscountVal = (unitPrice * pct) / 100;
      } else {
        itemDiscountVal = Number(item.item_discount) || 0;
      }

      const effectivePrice = Math.max(0, unitPrice - itemDiscountVal);
      const rowSubtotal = qty * effectivePrice;

      itemsTotal += rowSubtotal;
      totalQty += qty;
    });

    // Order Discount (numeric or percentage e.g. 5%)
    let orderDiscountVal = 0;
    if (typeof orderDiscount === 'string' && orderDiscount.includes('%')) {
      const pct = parseFloat(orderDiscount) || 0;
      orderDiscountVal = (itemsTotal * pct) / 100;
    } else {
      orderDiscountVal = Number(orderDiscount) || 0;
    }

    const netAfterOrderDiscount = Math.max(0, itemsTotal - orderDiscountVal);

    // Order Tax
    let orderTaxVal = 0;
    let orderTaxRate = 0;
    if (orderTaxId) {
      const selectedTax = taxRates.find((t) => t.id === Number(orderTaxId));
      if (selectedTax) {
        orderTaxRate = Number(selectedTax.rate) || 0;
        orderTaxVal = (netAfterOrderDiscount * orderTaxRate) / 100;
      }
    }

    // Shipping
    const shippingVal = Number(shipping) || 0;

    // Grand Total
    const grandTotal = netAfterOrderDiscount + orderTaxVal + shippingVal;

    return {
      itemsTotal,
      totalQty,
      orderDiscountVal,
      orderTaxVal,
      orderTaxRate,
      shippingVal,
      grandTotal
    };
  }, [formItems, orderDiscount, orderTaxId, shipping, taxRates]);

  // 9. Submit Sales Order
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (formItems.length === 0) {
        message.warning(t('please_add_products', 'Please add at least one product item to the sales order.'));
        return;
      }

      setSubmitting(true);

      const payload = {
        date: values.date,
        reference_no: values.reference_no,
        customer_id: values.customer_id,
        biller_id: values.biller_id,
        warehouse_id: values.warehouse_id,
        order_status: values.order_status || 'pending',
        sale_status: values.sale_status || 'order',
        note: values.note || '',
        staff_note: values.staff_note || '',
        order_discount: orderDiscount,
        order_tax_id: orderTaxId,
        shipping: shipping,
        items: formItems.map((item) => ({
          product_id: item.product_id,
          product_code: item.product_code,
          product_name: item.product_name,
          product_type: item.product_type || 'standard',
          net_unit_price: Number(item.net_unit_price) || 0,
          unit_price: Number(item.net_unit_price) || 0,
          quantity: Number(item.quantity) || 1,
          unit_quantity: Number(item.quantity) || 1,
          product_unit_id: item.product_unit_id || 1,
          product_unit_code: item.product_unit_code || 'Unit',
          discount: item.item_discount || '0',
          item_discount: item.item_discount || '0',
          item_tax: item.item_tax || 0,
          tax_rate_id: item.tax_rate_id || 1,
          expiry: item.expiry || null,
          comment: item.description || ''
        }))
      };

      // Optional advance deposit
      if (collectDeposit && Number(values.paid) > 0) {
        payload.paid = Number(values.paid);
        payload.paid_by = values.paid_by || 'Cash';
        payload.payment_note = values.payment_note || 'Advance customer deposit';
      }

      const res = await axios.post(API_BASE, payload);
      if (res.data?.success) {
        message.success(t('sale_order_created_success', 'Sales order created successfully!'));
        navigate('/admins/sales/orders');
      } else {
        message.error(res.data?.message || t('failed_create_sale_order', 'Failed to create sales order'));
      }
    } catch (err) {
      console.error('Error creating sales order:', err);
      if (err.errorFields) {
        message.error(t('form_validation_failed', 'Please fill in all required fields'));
      } else {
        message.error(err.response?.data?.message || t('error_saving_sale_order', 'Error saving sales order'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: themeTokens.colorBgLayout || '#f8fafc' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Space orientation="vertical" size={2}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/admins/sales/orders')}
              shape="circle"
            />
            <Title level={3} style={{ margin: 0, color: themeTokens.colorTextHeading }}>
              {t('add_sale_order', 'Add Sales Order')}
            </Title>
            <Tag color="cyan">AURA_v1 Concept</Tag>
          </div>
          <Text type="secondary" style={{ marginLeft: 42 }}>
            {t('add_sale_order_desc', 'Please fill in the information below. Field labels marked with * are required input fields.')}
          </Text>
        </Space>
        <Space orientation="horizontal">
          <Button onClick={() => form.resetFields()}>
            {t('reset', 'Reset')}
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={handleSubmit}
            loading={submitting}
            style={{ background: '#0284c7', borderColor: '#0284c7' }}
          >
            {t('submit_sale_order', 'Submit Sales Order')}
          </Button>
        </Space>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          date: new Date().toISOString().slice(0, 10),
          order_status: 'pending',
          sale_status: 'order',
          order_discount: '0',
          shipping: 0,
          paid: 0,
          paid_by: 'Cash'
        }}
      >
        {/* Basic Information Card */}
        <Card
          bordered={false}
          style={{
            borderRadius: 8,
            marginBottom: 20,
            boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
            background: themeTokens.colorBgContainer
          }}
        >
          <Row gutter={[16, 12]}>
            {/* Date */}
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="date"
                label={<span><span style={{ color: '#ef4444' }}>* </span>{t('date', 'Date')}</span>}
                rules={[{ required: true, message: t('date_required', 'Date is required') }]}
              >
                <Input type="date" />
              </Form.Item>
            </Col>

            {/* Reference No */}
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="reference_no"
                label={t('reference_no', 'Reference No')}
              >
                <Input placeholder="e.g. SALE-ORD-202610-0001" />
              </Form.Item>
            </Col>

            {/* Biller */}
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="biller_id"
                label={<span><span style={{ color: '#ef4444' }}>* </span>{t('biller', 'Biller')}</span>}
                rules={[{ required: true, message: t('biller_required', 'Biller is required') }]}
              >
                <Select
                  placeholder={t('select_biller', 'Select Biller')}
                  showSearch
                  optionFilterProp="children"
                >
                  {billers.map((b) => (
                    <Option key={b.id} value={b.id}>
                      {b.name} {b.company ? `(${b.company})` : ''}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Warehouse */}
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="warehouse_id"
                label={<span><span style={{ color: '#ef4444' }}>* </span>{t('warehouse', 'Warehouse')}</span>}
                rules={[{ required: true, message: t('warehouse_required', 'Warehouse is required') }]}
              >
                <Select
                  placeholder={t('select_warehouse', 'Select Warehouse')}
                  onChange={(val) => setSelectedWarehouseId(val)}
                  showSearch
                  optionFilterProp="children"
                >
                  {warehouses.map((w) => (
                    <Option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Customer */}
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="customer_id"
                label={<span><span style={{ color: '#ef4444' }}>* </span>{t('customer', 'Customer')}</span>}
                rules={[{ required: true, message: t('customer_required', 'Customer is required') }]}
              >
                <Select
                  placeholder={t('select_customer', 'Select Customer')}
                  showSearch
                  optionFilterProp="children"
                >
                  {customers.map((c) => (
                    <Option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ''}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Due Date */}
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="due_date"
                label={t('due_date', 'Due Date')}
              >
                <Input type="date" />
              </Form.Item>
            </Col>

            {/* Order Status */}
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="order_status"
                label={t('order_status', 'Order Status')}
              >
                <Select>
                  <Option value="pending">{t('pending', 'Pending Approval')}</Option>
                  <Option value="approved">{t('approved', 'Approved')}</Option>
                  <Option value="rejected">{t('rejected', 'Rejected')}</Option>
                </Select>
              </Form.Item>
            </Col>

            {/* Sale Status */}
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="sale_status"
                label={t('sale_status', 'Sale Status')}
              >
                <Select>
                  <Option value="order">{t('order', 'Order')}</Option>
                  <Option value="completed">{t('completed', 'Completed')}</Option>
                </Select>
              </Form.Item>
            </Col>

            {/* Note */}
            <Col xs={24}>
              <Form.Item name="note" label={t('note', 'Order Note')}>
                <Input placeholder={t('order_note_placeholder', 'Client-facing note or delivery remarks...')} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Scan / Add Products Bar & Items List */}
        <Card
          bordered={false}
          style={{
            borderRadius: 8,
            marginBottom: 20,
            boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
            background: themeTokens.colorBgContainer
          }}
        >
          {/* Autocomplete Bar with Dark/Light Adaptive Design */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid #cbd5e1',
              borderRadius: 8,
              padding: '6px 14px',
              background: isDark ? '#1e293b' : '#f8fafc',
              marginBottom: 16,
              boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.35)' : '0 1px 2px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.2s'
            }}
          >
            <BarcodeOutlined style={{ fontSize: 22, color: isDark ? '#a78bfa' : '#64748b', marginRight: 12 }} />
            <AutoComplete
              style={{ flex: 1, background: 'transparent' }}
              value={searchValue}
              options={suggestions.map((s) => ({
                value: s.code,
                label: (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
                    <div>
                      <span style={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#1e293b' }}>{s.name}</span>
                      <span style={{ color: isDark ? '#94a3b8' : '#64748b', marginLeft: 8, fontSize: 12 }}>({s.code})</span>
                      {s.unit_name && <Tag color="blue" style={{ marginLeft: 6 }}>{s.unit_name}</Tag>}
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, color: isDark ? '#38bdf8' : '#0284c7', marginRight: 12 }}>
                        ${Number(s.price || 0).toFixed(2)}
                      </span>
                      <Tag color={Number(s.qoh || 0) > 0 ? 'green' : 'red'}>
                        QOH: {s.qoh}
                      </Tag>
                    </div>
                  </div>
                )
              }))}
              onSearch={(val) => {
                setSearchValue(val);
                fetchSuggestions(val);
              }}
              onSelect={(val) => handleSelectProduct(val)}
              placeholder={t('scan_or_search_products', 'Please Scan barcode or add products to order list...')}
            >
              <Input
                ref={searchInputRef}
                bordered={false}
                style={{
                  fontSize: 14,
                  color: isDark ? '#f8fafc' : '#1e293b',
                  background: 'transparent'
                }}
                onPressEnter={() => {
                  if (searchValue && suggestions.length > 0) {
                    handleSelectProduct(suggestions[0].code);
                  }
                }}
              />
            </AutoComplete>
            <Tooltip title={t('refresh_catalog', 'Reload product catalog')}>
              <Button
                type="text"
                icon={<ReloadOutlined style={{ color: isDark ? '#94a3b8' : '#64748b' }} />}
                onClick={() => fetchSuggestions(searchValue || 'a')}
              />
            </Tooltip>
          </div>

          {/* Items Table */}
          <Table
            dataSource={formItems.map((item, idx) => ({ ...item, key: `item-${idx}`, _index: idx }))}
            pagination={false}
            bordered
            size="middle"
            locale={{
              emptyText: (
                <Empty
                  description={t('no_items_in_sale', 'No items in order list. Scan barcode or type product name above to add items.')}
                />
              )
            }}
            columns={[
              {
                title: t('product_name_code', 'Product (Code - Name)'),
                key: 'product',
                render: (_, record) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text strong style={{ color: isDark ? '#f8fafc' : '#1e293b', fontSize: 13 }}>
                      {record.product_name} ({record.product_code})
                    </Text>
                    {record.description && (
                      <Tooltip title={record.description}>
                        <Tag color="purple" style={{ fontSize: 10 }}>{t('note', 'Note')}</Tag>
                      </Tooltip>
                    )}
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined style={{ color: '#3b82f6', fontSize: 13 }} />}
                      onClick={() => handleOpenEditItem(record, record._index)}
                      title={t('edit_item_details', 'Edit item unit, tax, discount & serial')}
                    />
                  </div>
                )
              },
              {
                title: t('net_unit_price', 'Net Unit Price'),
                dataIndex: 'net_unit_price',
                key: 'net_unit_price',
                width: 140,
                align: 'right',
                render: (val, record) => (
                  <InputNumber
                    min={0}
                    precision={2}
                    value={val}
                    onChange={(newVal) => handleUpdateItemField(record._index, 'net_unit_price', newVal)}
                    style={{ width: '100%', textAlign: 'right' }}
                    prefix="$"
                  />
                )
              },
              {
                title: t('qoh', 'QOH'),
                dataIndex: 'qoh',
                key: 'qoh',
                width: 80,
                align: 'center',
                render: (qoh) => (
                  <Tag color={Number(qoh) > 0 ? 'green' : 'red'}>
                    {qoh}
                  </Tag>
                )
              },
              {
                title: t('quantity', 'Quantity'),
                dataIndex: 'quantity',
                key: 'quantity',
                width: 130,
                align: 'center',
                render: (qty, record) => (
                  <InputNumber
                    min={1}
                    value={qty}
                    onChange={(newVal) => handleUpdateItemField(record._index, 'quantity', newVal)}
                    style={{ width: '100%' }}
                  />
                )
              },
              {
                title: t('product_unit', 'Unit'),
                dataIndex: 'product_unit_code',
                key: 'product_unit_code',
                width: 100,
                align: 'center',
                render: (unit) => (
                  <Tag color="geekblue">{unit || 'Unit'}</Tag>
                )
              },
              {
                title: t('product_discount', 'Product Discount'),
                dataIndex: 'item_discount',
                key: 'item_discount',
                width: 130,
                align: 'right',
                render: (disc, record) => (
                  <Input
                    value={disc}
                    onChange={(e) => handleUpdateItemField(record._index, 'item_discount', e.target.value)}
                    placeholder="0 or 5%"
                    style={{ textAlign: 'right' }}
                  />
                )
              },
              {
                title: t('product_tax', 'Product Tax'),
                dataIndex: 'item_tax',
                key: 'item_tax',
                width: 110,
                align: 'right',
                render: (tax) => formatCurrency(Number(tax) || 0)
              },
              {
                title: t('subtotal', 'Subtotal'),
                key: 'subtotal',
                width: 130,
                align: 'right',
                render: (_, record) => {
                  const qty = Number(record.quantity) || 0;
                  const unitPrice = Number(record.net_unit_price) || 0;
                  let discountVal = 0;
                  if (typeof record.item_discount === 'string' && record.item_discount.includes('%')) {
                    const pct = parseFloat(record.item_discount) || 0;
                    discountVal = (unitPrice * pct) / 100;
                  } else {
                    discountVal = Number(record.item_discount) || 0;
                  }
                  const rowTotal = qty * Math.max(0, unitPrice - discountVal);
                  return (
                    <Text strong style={{ color: isDark ? '#38bdf8' : '#0369a1' }}>
                      {formatCurrency(rowTotal)}
                    </Text>
                  );
                }
              },
              {
                title: '',
                key: 'action',
                width: 50,
                align: 'center',
                render: (_, record) => (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveItem(record._index)}
                  />
                )
              }
            ]}
          />

          {/* Grand Total Summary Strip (Harmonious in both Dark and Light modes) */}
          <div
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)'
                : '#fef9c3',
              border: isDark
                ? '1px solid rgba(255, 255, 255, 0.12)'
                : '1px solid #fde047',
              borderRadius: 8,
              padding: '12px 18px',
              marginTop: 14,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 13,
              fontWeight: 600,
              color: isDark ? '#f8fafc' : '#854d0e',
              boxShadow: isDark
                ? '0 4px 14px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
                : 'none'
            }}
          >
            <div>
              <span style={{ color: isDark ? '#94a3b8' : '#854d0e' }}>{t('items', 'Items')}: </span>
              <strong style={{ color: isDark ? '#f1f5f9' : '#854d0e' }}>
                {formItems.length} ({calculations.totalQty})
              </strong>
            </div>
            <div>
              <span style={{ color: isDark ? '#94a3b8' : '#854d0e' }}>{t('total', 'Total')}: </span>
              <strong style={{ color: isDark ? '#f1f5f9' : '#854d0e' }}>
                {formatCurrency(calculations.itemsTotal)}
              </strong>
            </div>
            <div>
              <span style={{ color: isDark ? '#94a3b8' : '#854d0e' }}>{t('order_discount', 'Order Discount')}: </span>
              <strong style={{ color: isDark ? '#f87171' : '#dc2626' }}>
                {formatCurrency(calculations.orderDiscountVal)}
              </strong>
            </div>
            <div>
              <span style={{ color: isDark ? '#94a3b8' : '#854d0e' }}>{t('order_tax', 'Order Tax')}: </span>
              <strong style={{ color: isDark ? '#60a5fa' : '#2563eb' }}>
                {formatCurrency(calculations.orderTaxVal)}
              </strong>
            </div>
            <div>
              <span style={{ color: isDark ? '#94a3b8' : '#854d0e' }}>{t('shipping', 'Shipping')}: </span>
              <strong style={{ color: isDark ? '#fbbf24' : '#d97706' }}>
                {formatCurrency(calculations.shippingVal)}
              </strong>
            </div>
            <div style={{ fontSize: 16 }}>
              <span style={{ color: isDark ? '#e2e8f0' : '#854d0e', fontWeight: 700 }}>{t('grand_total', 'Grand Total')}: </span>
              <strong style={{ color: isDark ? '#34d399' : '#15803d', fontSize: 18 }}>
                {formatCurrency(calculations.grandTotal)}
              </strong>
            </div>
          </div>
        </Card>

        {/* Order Discount, Tax, Shipping & Notes Section */}
        <Card
          bordered={false}
          style={{
            borderRadius: 8,
            marginBottom: 20,
            boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
            background: themeTokens.colorBgContainer
          }}
        >
          <Row gutter={[16, 12]}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="order_discount" label={t('order_discount', 'Order Discount (0 or 5%)')}>
                <Input
                  value={orderDiscount}
                  onChange={(e) => setOrderDiscount(e.target.value)}
                  placeholder="0 or 5%"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="order_tax_id" label={t('order_tax', 'Order Tax')}>
                <Select
                  value={orderTaxId}
                  onChange={(val) => setOrderTaxId(val)}
                  allowClear
                  placeholder={t('select_tax_rate', 'Select Tax Rate')}
                >
                  {taxRates.map((tr) => (
                    <Option key={tr.id} value={tr.id}>
                      {tr.name} ({tr.rate}%)
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="shipping" label={t('shipping', 'Shipping Fee')}>
                <InputNumber
                  min={0}
                  value={shipping}
                  onChange={(val) => setShipping(val || 0)}
                  style={{ width: '100%' }}
                  prefix="$"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="staff_note" label={t('staff_note', 'Staff Note')}>
                <Input placeholder={t('staff_note_placeholder', 'Internal fulfillment notes...')} />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '12px 0 16px' }} />

          {/* Advance Deposit Section matching AURA_v1 sales_order add_deposit */}
          <div style={{ marginBottom: 12 }}>
            <Button
              type={collectDeposit ? 'primary' : 'default'}
              icon={<DollarOutlined />}
              onClick={() => setCollectDeposit(!collectDeposit)}
              style={collectDeposit ? { background: '#10b981', borderColor: '#10b981' } : {}}
            >
              {collectDeposit ? t('hide_deposit_form', 'Remove Advance Deposit') : t('collect_advance_deposit', 'Collect Advance Customer Deposit')}
            </Button>
          </div>

          {collectDeposit && (
            <Row gutter={[16, 12]} style={{ padding: '12px', background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: 8 }}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item name="paid" label={t('amount_paid', 'Deposit Amount')}>
                  <InputNumber
                    min={0}
                    max={calculations.grandTotal}
                    style={{ width: '100%' }}
                    prefix="$"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item name="paid_by" label={t('paying_by', 'Paying by')}>
                  <Select>
                    <Option value="Cash">{t('cash', 'Cash')}</Option>
                    <Option value="Bank Transfer">{t('bank_transfer', 'Bank Transfer')}</Option>
                    <Option value="Cheque">{t('cheque', 'Cheque')}</Option>
                    <Option value="Credit Card">{t('credit_card', 'Credit Card')}</Option>
                    <Option value="Deposit">{t('deposit_account', 'Customer Deposit Account')}</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={24} md={12}>
                <Form.Item name="payment_note" label={t('payment_note', 'Deposit Note')}>
                  <Input placeholder="e.g. ABA Bank Ref #12345678, deposit on agreement" />
                </Form.Item>
              </Col>
            </Row>
          )}
        </Card>

        {/* Submit Actions Bottom */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 30 }}>
          <Button size="large" onClick={() => navigate('/admins/sales/orders')}>
            {t('cancel', 'Cancel')}
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<CheckOutlined />}
            onClick={handleSubmit}
            loading={submitting}
            style={{ background: '#0284c7', borderColor: '#0284c7', minWidth: 160 }}
          >
            {t('save_sale_order', 'Save Sales Order')}
          </Button>
        </div>
      </Form>

      {/* BPAS Item Edit Modal */}
      {editingItem && (
        <BpasItemEditModal
          visible={editModalVisible}
          item={editingItem}
          onCancel={() => setEditModalVisible(false)}
          onSave={handleSaveEditedItem}
        />
      )}
    </div>
  );
};

export default AddSaleOrderPage;
