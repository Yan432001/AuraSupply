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
  AutoComplete,
  Spin,
  Alert
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
  SaveOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { formatCurrency } from '../../../utils/uiTheme';
import { useAdminTheme } from '../../../hooks/useAdminTheme';
import { useTranslation } from '../../../contexts/LanguageContext';
import BpasItemEditModal from '../../../components/common/BpasItemEditModal';

const { Title, Text } = Typography;
const { Option } = Select;

const API_BASE = '/api/admin/sales';

const EditSalePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { themeTokens, isDark } = useAdminTheme();
  const [form] = Form.useForm();
  const searchInputRef = useRef(null);

  // States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [originalSale, setOriginalSale] = useState(null);

  const [metadata, setMetadata] = useState({
    customers: [],
    billers: [],
    warehouses: [],
    units: [],
    taxRates: []
  });

  const [formItems, setFormItems] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Item Edit Modal (BpasItemEditModal / Image 2)
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Variant selector modal state
  const [variantModalVisible, setVariantModalVisible] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState(null);

  // Fetch Metadata & Sale Details
  const fetchData = async () => {
    setLoading(true);
    try {
      const [metaRes, saleRes] = await Promise.all([
        axios.get(`${API_BASE}/meta/options`),
        axios.get(`${API_BASE}/${id}`)
      ]);

      if (metaRes.data?.status && metaRes.data.data) {
        setMetadata(metaRes.data.data);
      }

      if (saleRes.data?.status && saleRes.data.data) {
        const sale = saleRes.data.data;
        setOriginalSale(sale);

        // Populate Form
        form.setFieldsValue({
          reference_no: sale.referenceNo,
          customer_id: sale.customerId,
          biller_id: sale.billerId,
          warehouse_id: sale.warehouseId,
          date: sale.date ? sale.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
          due_date: sale.dueDate ? sale.dueDate.slice(0, 10) : undefined,
          sale_status: sale.saleStatus || 'completed',
          order_discount: String(sale.orderDiscount || '0'),
          order_tax_id: sale.orderTaxId || (metaRes.data?.data?.taxRates?.[0]?.id || null),
          shipping: sale.shipping || 0,
          note: sale.note || '',
          staff_note: sale.staffNote || ''
        });

        // Populate Line Items
        const mappedItems = (sale.items || []).map((it, idx) => ({
          key: it.id || `item_${idx}_${Date.now()}`,
          id: it.id,
          product_id: it.productId,
          product_code: it.productCode || '',
          product_name: it.productName,
          product_type: it.productType || 'standard',
          option_id: it.optionId,
          variant_name: it.variantName,
          product_unit_id: it.unitId,
          unit_id: it.unitId,
          product_unit_code: it.unitCode || 'Unit',
          unit_name: it.unitName || 'Unit',
          quantity: parseFloat(it.quantity) || 1,
          unit_quantity: parseFloat(it.unitQuantity || it.quantity) || 1,
          unit_price: parseFloat(it.unitPrice) || 0,
          net_unit_price: parseFloat(it.netUnitPrice || it.unitPrice) || 0,
          real_unit_price: parseFloat(it.realUnitPrice || it.unitPrice) || 0,
          cost: parseFloat(it.cost) || 0,
          qoh: 0, // populated on load
          item_discount: parseFloat(it.itemDiscount) || 0,
          discount: String(it.discount || '0'),
          item_tax: parseFloat(it.itemTax) || 0,
          subtotal: parseFloat(it.subtotal) || 0,
          serial_no: it.serialNo || '',
          comment: it.comment || '',
          description: it.comment || ''
        }));
        setFormItems(mappedItems);
      } else {
        message.error(t('sale_not_found', 'Sale record not found.'));
        navigate('/admins/sales');
      }
    } catch (err) {
      console.error('Failed to load sale edit data:', err);
      message.error(t('error_loading_sale', 'Failed to load sale record.'));
    } finally {
      setLoading(false);
    }
  };

  // Search product suggestions from API
  const fetchSuggestions = async (term = '') => {
    setSearchingProducts(true);
    try {
      const currentWh = form.getFieldValue('warehouse_id') || 1;
      const res = await axios.get(`${API_BASE}/suggestions`, {
        params: {
          term: term.trim(),
          warehouse_id: currentWh,
          limit: 20
        }
      });
      if (res.data?.status && Array.isArray(res.data.data)) {
        setSuggestions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to search suggestions:', err);
    } finally {
      setSearchingProducts(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchSuggestions('');
  }, [id]);

  // Add Item to Order list
  const addItemToCart = (product, variant = null) => {
    const optId = variant ? variant.id : null;
    const existingIndex = formItems.findIndex(
      it => it.product_id === product.id && (optId ? it.option_id === optId : !it.option_id)
    );

    if (existingIndex >= 0) {
      const updated = [...formItems];
      const cur = updated[existingIndex];
      const newQty = (parseFloat(cur.unit_quantity || cur.quantity) || 1) + 1;
      cur.unit_quantity = newQty;
      cur.quantity = newQty;
      const price = parseFloat(cur.unit_price) || 0;
      const disc = parseFloat(cur.item_discount) || 0;
      const tax = parseFloat(cur.item_tax) || 0;
      cur.subtotal = Math.max(0, (newQty * price) - disc + tax);
      setFormItems(updated);
      message.info(`${product.name} quantity increased to ${newQty}`);
    } else {
      const price = variant ? parseFloat(variant.price || product.price || 0) : parseFloat(product.price || 0);
      const cost = variant ? parseFloat(variant.cost || product.cost || 0) : parseFloat(product.cost || 0);

      const newItem = {
        key: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        product_id: product.id,
        product_code: product.code || '',
        product_name: product.name,
        product_type: product.type || 'standard',
        option_id: optId,
        variant_name: variant ? variant.name : null,
        product_unit_id: product.unit_id || 1,
        unit_id: product.unit_id || 1,
        product_unit_code: product.unit_code || 'Unit',
        unit_name: product.unit_name || 'Unit',
        base_unit_price: price,
        unit_price: price,
        real_unit_price: price,
        net_unit_price: price,
        cost: cost,
        qoh: parseFloat(product.qoh || 0),
        quantity: 1,
        unit_quantity: 1,
        item_discount: 0,
        discount: '0',
        item_tax: 0,
        tax_rate_id: product.tax_rate_id || null,
        subtotal: price,
        serial_no: '',
        comment: '',
        variants: product.variants || [],
        units: product.units || []
      };

      setFormItems(prev => [...prev, newItem]);
      message.success(`${product.name} added to order`);
    }

    setSearchValue('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Handle selection from autocomplete
  const handleSelectProduct = (codeOrId) => {
    const prod = suggestions.find(p => p.code === codeOrId || p.id === codeOrId);
    if (!prod) return;

    if (prod.variants && prod.variants.length > 0) {
      setSelectedProductForVariant(prod);
      setVariantModalVisible(true);
    } else {
      addItemToCart(prod, null);
    }
  };

  // Open item edit popup (BpasItemEditModal / Image 2)
  const handleOpenItemEditModal = (item) => {
    setEditingItem(item);
    setEditModalVisible(true);
  };

  // Save changes from BpasItemEditModal
  const handleSaveEditedItem = (updatedItem) => {
    setFormItems(prev => prev.map(it => it.key === updatedItem.key ? updatedItem : it));
    message.success(t('item_updated_success', 'Item details updated'));
  };

  // Quick quantity change directly from table input
  const handleQuantityChange = (key, newQty) => {
    const qty = Math.max(parseFloat(newQty) || 1, 0.01);
    setFormItems(prev => prev.map(it => {
      if (it.key === key) {
        const price = parseFloat(it.unit_price) || 0;
        const disc = parseFloat(it.item_discount) || 0;
        const tax = parseFloat(it.item_tax) || 0;
        return {
          ...it,
          quantity: qty,
          unit_quantity: qty,
          subtotal: Math.max(0, (qty * price) - disc + tax)
        };
      }
      return it;
    }));
  };

  // Remove item from table
  const handleRemoveItem = (key) => {
    setFormItems(prev => prev.filter(it => it.key !== key));
  };

  // Live order calculations
  const calculations = useMemo(() => {
    const itemsTotal = formItems.reduce((acc, it) => acc + (parseFloat(it.subtotal) || 0), 0);
    const totalQty = formItems.reduce((acc, it) => acc + (parseFloat(it.unit_quantity || it.quantity) || 0), 0);

    let orderDiscountVal = 0;
    const orderDiscRaw = String(form.getFieldValue('order_discount') || '0').trim();
    if (orderDiscRaw.endsWith('%')) {
      const pct = parseFloat(orderDiscRaw.replace('%', '')) || 0;
      orderDiscountVal = (itemsTotal * pct) / 100;
    } else {
      orderDiscountVal = parseFloat(orderDiscRaw) || 0;
    }

    const netAfterDiscount = Math.max(0, itemsTotal - orderDiscountVal);

    const taxId = form.getFieldValue('order_tax_id');
    const taxObj = metadata.taxRates?.find(t => t.id === taxId);
    let orderTaxVal = 0;
    if (taxObj && taxObj.rate > 0) {
      orderTaxVal = (netAfterDiscount * taxObj.rate) / 100;
    }

    const shippingVal = parseFloat(form.getFieldValue('shipping') || 0);
    const grandTotal = Math.max(0, netAfterDiscount + orderTaxVal + shippingVal);
    const paidVal = parseFloat(originalSale?.paid || 0);
    const balance = Math.max(0, grandTotal - paidVal);

    return {
      itemsTotal,
      totalQty,
      orderDiscountVal,
      orderTaxVal,
      shippingVal,
      grandTotal,
      paidVal,
      balance
    };
  }, [
    formItems,
    metadata.taxRates,
    originalSale,
    Form.useWatch('order_discount', form),
    Form.useWatch('order_tax_id', form),
    Form.useWatch('shipping', form)
  ]);

  // Submit Updated Sale
  const handleSubmit = async (values) => {
    if (formItems.length === 0) {
      message.error(t('please_add_sale_items', 'Please add at least one product item to the sale.'));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        date: values.date,
        due_date: values.due_date || null,
        reference_no: values.reference_no,
        customer_id: values.customer_id,
        biller_id: values.biller_id,
        warehouse_id: values.warehouse_id,
        sale_status: values.sale_status || 'completed',
        order_discount: calculations.orderDiscountVal,
        order_tax: calculations.orderTaxVal,
        order_tax_id: values.order_tax_id || null,
        shipping: parseFloat(values.shipping) || 0,
        note: values.note || '',
        staff_note: values.staff_note || '',
        items: formItems.map(it => ({
          product_id: it.product_id,
          product_code: it.product_code,
          product_name: it.product_name,
          product_type: it.product_type,
          option_id: it.option_id || null,
          product_unit_id: it.product_unit_id || it.unit_id,
          product_unit_code: it.product_unit_code || it.unit_name || 'Unit',
          quantity: it.quantity,
          unit_quantity: it.unit_quantity,
          unit_price: it.unit_price,
          net_unit_price: it.net_unit_price || it.unit_price,
          cost: it.cost || 0,
          item_discount: it.item_discount || 0,
          discount: it.discount || '0',
          item_tax: it.item_tax || 0,
          subtotal: it.subtotal,
          serial_no: it.serial_no || '',
          comment: it.comment || ''
        }))
      };

      const res = await axios.put(`${API_BASE}/${id}`, payload);
      if (res.data?.status) {
        message.success(t('sale_updated_successfully', 'Sale updated and stock recalculated successfully!'));
        navigate(`/admins/sales/view/${id}`);
      }
    } catch (err) {
      console.error('Failed to update sale:', err);
      message.error(err.response?.data?.message || err.message || 'Failed to update sale');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip={t('loading_sale_data', 'Loading sale details...')} />
      </div>
    );
  }

  const isCancelled = originalSale?.saleStatus === 'cancelled';

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: themeTokens.colorBgLayout || '#f8fafc' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admins/sales')}>
              {t('back_to_sales', 'Back to Sales')}
            </Button>
            <Title level={3} style={{ margin: 0, color: '#1e293b' }}>
              {t('edit_sale', 'Edit Sale Invoice')}: {originalSale?.referenceNo}
            </Title>
          </Space>
          <div style={{ marginTop: 4 }}>
            <Text type="secondary">
              {t('edit_sale_desc', 'Update invoice items, adjust quantities or units, and recalculate warehouse stock movements.')}
            </Text>
          </div>
        </div>
      </div>

      {isCancelled && (
        <Alert
          message={t('sale_is_cancelled', 'This sale has been cancelled and cannot be modified.')}
          type="error"
          showIcon
          style={{ marginBottom: 20 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        disabled={isCancelled}
      >
        {/* Top Information Card */}
        <Card bordered={false} style={{ borderRadius: 8, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item
                name="date"
                label={<span>{t('date', 'Date')} <span style={{ color: 'red' }}>*</span></span>}
                rules={[{ required: true }]}
              >
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                name="reference_no"
                label={t('reference_no', 'Reference No')}
                rules={[{ required: true }]}
              >
                <Input disabled />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                name="biller_id"
                label={t('biller', 'Biller / Branch')}
                rules={[{ required: true }]}
              >
                <Select placeholder="Select biller">
                  {metadata.billers.map(b => (
                    <Option key={b.id} value={b.id}>{b.name} ({b.company || '-'})</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                name="warehouse_id"
                label={<span>{t('warehouse', 'Warehouse')} <span style={{ color: 'red' }}>*</span></span>}
                rules={[{ required: true }]}
              >
                <Select placeholder="Select warehouse">
                  {metadata.warehouses.map(w => (
                    <Option key={w.id} value={w.id}>{w.name} ({w.code})</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item
                name="customer_id"
                label={<span>{t('customer', 'Customer')} <span style={{ color: 'red' }}>*</span></span>}
                rules={[{ required: true }]}
              >
                <Select placeholder="Select customer" showSearch optionFilterProp="children">
                  {metadata.customers.map(c => (
                    <Option key={c.id} value={c.id}>{c.name} ({c.phone || c.company || '-'})</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="due_date" label={t('due_date', 'Required / Due Date')}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="sale_status" label={t('sale_status', 'Sale Status')}>
                <Select>
                  <Option value="completed">{t('completed', 'Completed (Stock Deducted)')}</Option>
                  <Option value="pending">{t('pending', 'Pending (Draft / Quotation)')}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="note" label={t('note', 'Invoice Note')}>
                <Input placeholder="Invoice note for customer..." />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Scan / Add Products Bar & Items List */}
        <Card bordered={false} style={{ borderRadius: 8, marginBottom: 20, boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)', background: themeTokens.colorBgContainer }}>
          {/* Autocomplete Bar matching AURA_v1 #add_item search */}
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
              options={suggestions.map(s => ({
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
                        ${s.price.toFixed(2)}
                      </span>
                      <Tag color={s.qoh > 0 ? 'green' : 'red'}>
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
                style={{ fontSize: 14, color: isDark ? '#f8fafc' : '#1e293b', background: 'transparent' }}
                onPressEnter={(e) => {
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
                onClick={() => fetchSuggestions(searchValue)}
                loading={searchingProducts}
              />
            </Tooltip>
          </div>

          {/* Items Table */}
          <Table
            dataSource={formItems}
            rowKey="key"
            pagination={false}
            bordered
            size="middle"
            className="aura-bpas-items-table"
            locale={{
              emptyText: <Empty description={t('no_items_in_sale', 'No items in order list.')} />
            }}
            columns={[
              {
                title: t('product_code_name', 'Product (Code - Name)'),
                key: 'product',
                render: (_, item) => (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Text strong style={{ color: isDark ? '#f8fafc' : '#1e293b', fontSize: 13 }}>
                        {item.product_name}
                      </Text>
                      {/* Edit Icon to open popup Image 2 */}
                      <Tooltip title={t('edit_item_popup', 'Edit Unit, Price, Discount, Tax')}>
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined style={{ color: '#2563eb', fontSize: 15 }} />}
                          onClick={() => handleOpenItemEditModal(item)}
                          style={{ padding: '0 4px', height: 22 }}
                        />
                      </Tooltip>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      <span>{item.product_code}</span>
                      {item.variant_name && <Tag color="cyan" style={{ marginLeft: 6 }}>{item.variant_name}</Tag>}
                      {item.unit_name && <Tag color="blue" style={{ marginLeft: 4 }}>{item.unit_name}</Tag>}
                    </div>
                    {item.description && (
                      <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', marginTop: 2 }}>
                        {item.description}
                      </div>
                    )}
                  </div>
                )
              },
              {
                title: t('net_unit_price', 'Net Unit Price'),
                dataIndex: 'net_unit_price',
                key: 'net_unit_price',
                width: 130,
                align: 'right',
                render: (val, item) => (
                  <Text>{formatCurrency(val != null ? val : item.unit_price || 0)}</Text>
                )
              },
              {
                title: t('qoh', 'QOH'),
                dataIndex: 'qoh',
                key: 'qoh',
                width: 90,
                align: 'center',
                render: (val) => {
                  const q = parseFloat(val) || 0;
                  return (
                    <Tag color={q > 0 ? 'green' : q === 0 ? 'default' : 'red'}>
                      {q}
                    </Tag>
                  );
                }
              },
              {
                title: t('quantity', 'Quantity'),
                dataIndex: 'unit_quantity',
                key: 'quantity',
                width: 120,
                render: (val, item) => (
                  <InputNumber
                    min={0.01}
                    step={1}
                    value={val != null ? val : item.quantity}
                    onChange={(newVal) => handleQuantityChange(item.key, newVal)}
                    style={{ width: '100%' }}
                  />
                )
              },
              {
                title: t('product_discount', 'Product Discount'),
                dataIndex: 'item_discount',
                key: 'item_discount',
                width: 120,
                align: 'right',
                render: (val) => <Text>{formatCurrency(val || 0)}</Text>
              },
              {
                title: t('product_tax', 'Product Tax'),
                dataIndex: 'item_tax',
                key: 'item_tax',
                width: 110,
                align: 'right',
                render: (val) => <Text>{formatCurrency(val || 0)}</Text>
              },
              {
                title: t('subtotal', 'Subtotal'),
                dataIndex: 'subtotal',
                key: 'subtotal',
                width: 130,
                align: 'right',
                render: (val) => <Text strong style={{ color: '#0f172a' }}>{formatCurrency(val || 0)}</Text>
              },
              {
                title: '',
                key: 'remove',
                width: 50,
                align: 'center',
                render: (_, item) => (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveItem(item.key)}
                  />
                )
              }
            ]}
          />

          {/* Grand Total Summary Strip (Dark/Light mode adaptive) */}
          <div
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)'
                : '#fef9c3',
              border: isDark
                ? '1px solid rgba(245, 158, 11, 0.35)'
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
              <strong style={{ color: isDark ? '#f1f5f9' : '#854d0e' }}>{formItems.length} ({calculations.totalQty})</strong>
            </div>
            <div>
              <span style={{ color: isDark ? '#94a3b8' : '#854d0e' }}>{t('total', 'Total')}: </span>
              <strong style={{ color: isDark ? '#f1f5f9' : '#854d0e' }}>{formatCurrency(calculations.itemsTotal)}</strong>
            </div>
            <div>
              <span style={{ color: isDark ? '#94a3b8' : '#854d0e' }}>{t('order_discount', 'Order Discount')}: </span>
              <strong style={{ color: isDark ? '#f87171' : '#dc2626' }}>{formatCurrency(calculations.orderDiscountVal)}</strong>
            </div>
            <div>
              <span style={{ color: isDark ? '#94a3b8' : '#854d0e' }}>{t('order_tax', 'Order Tax')}: </span>
              <strong style={{ color: isDark ? '#60a5fa' : '#2563eb' }}>{formatCurrency(calculations.orderTaxVal)}</strong>
            </div>
            <div>
              <span style={{ color: isDark ? '#94a3b8' : '#854d0e' }}>{t('shipping', 'Shipping')}: </span>
              <strong style={{ color: isDark ? '#fbbf24' : '#d97706' }}>{formatCurrency(calculations.shippingVal)}</strong>
            </div>
            <div style={{ fontSize: 16 }}>
              <span style={{ color: isDark ? '#e2e8f0' : '#854d0e', fontWeight: 700 }}>{t('grand_total', 'Grand Total')}: </span>
              <strong style={{ color: isDark ? '#4ade80' : '#15803d', fontSize: 18 }}>{formatCurrency(calculations.grandTotal)}</strong>
            </div>
          </div>
        </Card>

        {/* Order Discount, Tax, Shipping & Notes Card */}
        <Card bordered={false} style={{ borderRadius: 8, marginBottom: 20, boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)' }}>
          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item name="order_discount" label={t('order_discount', 'Order Discount (0 or 5%)')}>
                <Input placeholder="e.g. 10 or 5%" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="order_tax_id" label={t('order_tax', 'Order Tax')}>
                <Select placeholder="Select order tax" allowClear>
                  {metadata.taxRates?.map(t => (
                    <Option key={t.id} value={t.id}>{t.name} ({t.rate}%)</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="shipping" label={t('shipping', 'Shipping Cost')}>
                <InputNumber min={0} step={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="staff_note" label={t('staff_note', 'Staff Note (Private)')}>
                <Input placeholder="Internal remarks..." />
              </Form.Item>
            </Col>
          </Row>

          {/* Payment Status Summary Bar */}
          <div
            style={{
              background: isDark ? 'rgba(30, 41, 59, 0.75)' : '#f1f5f9',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
              borderRadius: 6,
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16
            }}
          >
            <div>
              <Text strong style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}>{t('paid_amount', 'Paid Amount')}: </Text>
              <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 15 }}>
                {formatCurrency(calculations.paidVal)}
              </span>
            </div>
            <div>
              <Text strong style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}>{t('balance_due', 'Outstanding Balance Due')}: </Text>
              <span style={{ color: calculations.balance > 0 ? '#ef4444' : '#16a34a', fontWeight: 700, fontSize: 15 }}>
                {formatCurrency(calculations.balance)}
              </span>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              icon={<SaveOutlined />}
              style={{
                background: '#337ab7',
                borderColor: '#2e6da4',
                padding: '0 32px',
                height: 38,
                fontWeight: 600
              }}
            >
              {t('update_sale', 'Update Sale')}
            </Button>
            <Button
              onClick={() => navigate('/admins/sales')}
              style={{ height: 38 }}
            >
              {t('cancel', 'Cancel')}
            </Button>
          </div>
        </Card>
      </Form>

      {/* Item Edit Modal (BpasItemEditModal / Image 2) */}
      <BpasItemEditModal
        open={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        item={editingItem}
        units={metadata.units}
        taxRates={metadata.taxRates}
        onSave={handleSaveEditedItem}
        mode="sales"
      />

      {/* Variant Selector Modal */}
      <Modal
        title={t('select_variant', 'Select Product Variant')}
        open={variantModalVisible}
        onCancel={() => setVariantModalVisible(false)}
        footer={null}
        width={400}
      >
        {selectedProductForVariant && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Text>{selectedProductForVariant.name}</Text>
            {selectedProductForVariant.variants?.map(v => (
              <Button
                key={v.id}
                type="default"
                style={{ textAlign: 'left', height: 42, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={() => {
                  addItemToCart(selectedProductForVariant, v);
                  setVariantModalVisible(false);
                }}
              >
                <span>{v.name}</span>
                <strong style={{ color: '#2563eb' }}>${v.price}</strong>
              </Button>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EditSalePage;
