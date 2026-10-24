import React, { useState, useEffect, useMemo } from 'react';
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
  Spin,
  Alert
} from 'antd';
import {
  ShoppingOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
  DollarOutlined,
  CheckOutlined,
  UserOutlined,
  BarcodeOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { formatCurrency } from '../../../utils/uiTheme';
import { useAdminTheme } from '../../../hooks/useAdminTheme';
import { useTranslation } from '../../../contexts/LanguageContext';

const { Title, Text } = Typography;
const { Option } = Select;

const API_BASE = '/api/admin/sales';

const EditSalePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { themeTokens } = useAdminTheme();
  const [form] = Form.useForm();

  // State
  const [loading, setLoading] = useState(true);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [originalSale, setOriginalSale] = useState(null);

  const [metadata, setMetadata] = useState({
    customers: [],
    billers: [],
    warehouses: [],
    units: []
  });

  const [formItems, setFormItems] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);

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
          order_discount: sale.orderDiscount || 0,
          order_tax: sale.orderTax || 0,
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
          product_unit_id: it.productUnitId,
          product_unit_code: it.productUnitCode || 'Unit',
          quantity: parseFloat(it.quantity) || 1,
          unit_price: parseFloat(it.unitPrice) || 0,
          cost: parseFloat(it.cost) || 0,
          item_discount: parseFloat(it.itemDiscount) || 0,
          item_tax: parseFloat(it.itemTax) || 0,
          subtotal: parseFloat(it.subtotal) || 0,
          serial_no: it.serialNo || '',
          comment: it.comment || ''
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

  // Search Products for Catalog Selector
  const searchProducts = async (term = '') => {
    setSearchingProducts(true);
    try {
      const res = await axios.get('/api/admin/products', {
        params: { search: term, limit: 30 }
      });
      if (res.data?.data) {
        setAvailableProducts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to search products:', err);
    } finally {
      setSearchingProducts(false);
    }
  };

  useEffect(() => {
    fetchData();
    searchProducts('');
  }, [id]);

  // Handle Product Select
  const handleSelectProduct = (productId) => {
    const prod = availableProducts.find(p => p.id === productId);
    if (!prod) return;

    // If product has variants, prompt variant selector
    if (prod.variants && prod.variants.length > 0) {
      setSelectedProductForVariant(prod);
      setVariantModalVisible(true);
    } else {
      addItemToCart(prod, null);
    }
  };

  // Add Item to Sale Table
  const addItemToCart = (product, variant = null) => {
    const existingIndex = formItems.findIndex(
      it => it.product_id === product.id && (variant ? it.option_id === variant.id : !it.option_id)
    );

    if (existingIndex >= 0) {
      const updated = [...formItems];
      updated[existingIndex].quantity = (parseFloat(updated[existingIndex].quantity) || 1) + 1;
      const unitPrice = parseFloat(updated[existingIndex].unit_price) || 0;
      const disc = parseFloat(updated[existingIndex].item_discount) || 0;
      const tax = parseFloat(updated[existingIndex].item_tax) || 0;
      updated[existingIndex].subtotal = Math.max(0, (updated[existingIndex].quantity * unitPrice) - disc + tax);
      setFormItems(updated);
    } else {
      const price = variant ? parseFloat(variant.price || product.price || 0) : parseFloat(product.price || 0);
      const cost = variant ? parseFloat(variant.cost || product.cost || 0) : parseFloat(product.cost || 0);

      const newItem = {
        key: Date.now() + Math.random(),
        product_id: product.id,
        product_code: product.code || '',
        product_name: product.name,
        product_type: product.type || 'standard',
        option_id: variant ? variant.id : null,
        variant_name: variant ? variant.name : null,
        product_unit_id: product.sale_unit || product.unit || 1,
        product_unit_code: product.unit_name || 'Unit',
        quantity: 1,
        unit_price: price,
        cost: cost,
        item_discount: 0,
        item_tax: 0,
        subtotal: price,
        serial_no: '',
        comment: ''
      };
      setFormItems([...formItems, newItem]);
    }
  };

  // Update item in table
  const handleUpdateItem = (key, field, value) => {
    const updated = formItems.map(it => {
      if (it.key === key) {
        const item = { ...it, [field]: value };
        const qty = parseFloat(field === 'quantity' ? value : item.quantity) || 0;
        const price = parseFloat(field === 'unit_price' ? value : item.unit_price) || 0;
        const disc = parseFloat(field === 'item_discount' ? value : item.item_discount) || 0;
        const tax = parseFloat(field === 'item_tax' ? value : item.item_tax) || 0;
        item.subtotal = Math.max(0, (qty * price) - disc + tax);
        return item;
      }
      return it;
    });
    setFormItems(updated);
  };

  // Remove item
  const handleRemoveItem = (key) => {
    setFormItems(formItems.filter(it => it.key !== key));
  };

  // Live Calculations
  const calculations = useMemo(() => {
    const itemsSubtotal = formItems.reduce((acc, it) => acc + (parseFloat(it.subtotal) || 0), 0);
    const orderDiscount = parseFloat(form.getFieldValue('order_discount') || 0);
    const orderTax = parseFloat(form.getFieldValue('order_tax') || 0);
    const shipping = parseFloat(form.getFieldValue('shipping') || 0);
    const grandTotal = Math.max(0, (itemsSubtotal - orderDiscount) + orderTax + shipping);
    const alreadyPaid = parseFloat(originalSale?.paid || 0);
    const balance = Math.max(0, grandTotal - alreadyPaid);

    return {
      itemsSubtotal,
      orderDiscount,
      orderTax,
      shipping,
      grandTotal,
      alreadyPaid,
      balance
    };
  }, [
    formItems,
    originalSale,
    Form.useWatch('order_discount', form),
    Form.useWatch('order_tax', form),
    Form.useWatch('shipping', form)
  ]);

  // Submit Sale Update
  const handleSubmit = async (values) => {
    if (formItems.length === 0) {
      message.error(t('please_add_sale_items', 'Please add at least one product item to the sale.'));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...values,
        items: formItems.map(it => ({
          product_id: it.product_id,
          product_code: it.product_code,
          product_name: it.product_name,
          product_type: it.product_type,
          option_id: it.option_id,
          product_unit_id: it.product_unit_id,
          product_unit_code: it.product_unit_code,
          quantity: it.quantity,
          unit_price: it.unit_price,
          cost: it.cost,
          item_discount: it.item_discount,
          item_tax: it.item_tax,
          subtotal: it.subtotal,
          serial_no: it.serial_no,
          comment: it.comment
        }))
      };

      const res = await axios.put(`${API_BASE}/${id}`, payload);
      if (res.data?.status) {
        message.success(t('sale_updated_success', 'Sale updated successfully.'));
        navigate(`/admins/sales/view/${id}`);
      } else {
        message.error(res.data?.message || t('failed_to_update_sale', 'Failed to update sale.'));
      }
    } catch (err) {
      console.error('Update sale error:', err);
      message.error(err.response?.data?.message || t('failed_to_update_sale', 'Failed to update sale.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Table Columns
  const columns = [
    {
      title: '#',
      dataIndex: 'index',
      key: 'index',
      width: 50,
      render: (_, __, idx) => idx + 1
    },
    {
      title: t('product', 'Product'),
      dataIndex: 'product_name',
      key: 'product_name',
      render: (name, record) => (
        <div>
          <Text strong style={{ fontSize: '13px' }}>{name}</Text>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            {record.product_code && <span style={{ marginRight: 8 }}>SKU: {record.product_code}</span>}
            {record.variant_name && (
              <Tag color="cyan" style={{ fontSize: '11px', padding: '0 4px', margin: 0 }}>
                {record.variant_name}
              </Tag>
            )}
          </div>
        </div>
      )
    },
    {
      title: t('unit_price', 'Unit Price ($)'),
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 140,
      render: (val, record) => (
        <InputNumber
          min={0}
          step={0.01}
          value={val}
          onChange={(v) => handleUpdateItem(record.key, 'unit_price', v)}
          style={{ width: '100%' }}
          prefix="$"
        />
      )
    },
    {
      title: t('quantity', 'Quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 130,
      render: (val, record) => (
        <InputNumber
          min={1}
          step={1}
          value={val}
          onChange={(v) => handleUpdateItem(record.key, 'quantity', v)}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: t('discount', 'Discount ($)'),
      dataIndex: 'item_discount',
      key: 'item_discount',
      width: 120,
      render: (val, record) => (
        <InputNumber
          min={0}
          step={0.01}
          value={val}
          onChange={(v) => handleUpdateItem(record.key, 'item_discount', v)}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: t('tax', 'Tax ($)'),
      dataIndex: 'item_tax',
      key: 'item_tax',
      width: 110,
      render: (val, record) => (
        <InputNumber
          min={0}
          step={0.01}
          value={val}
          onChange={(v) => handleUpdateItem(record.key, 'item_tax', v)}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: t('subtotal', 'Subtotal ($)'),
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 130,
      align: 'right',
      render: (val) => (
        <Text strong style={{ color: themeTokens.colorPrimary, fontSize: '14px' }}>
          {formatCurrency(val)}
        </Text>
      )
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
          onClick={() => handleRemoveItem(record.key)}
        />
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip={t('loading_sale_details', 'Loading sale details...')} />
      </div>
    );
  }

  const isCancelled = originalSale?.saleStatus === 'cancelled';

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Space direction="horizontal" align="center" size="middle">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admins/sales')}
            style={{ borderRadius: '8px' }}
          >
            {t('back_to_sales', 'Back to Sales')}
          </Button>
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
              {t('edit_sale', 'Edit Sale')} #{originalSale?.referenceNo}
            </Title>
            <Text type="secondary" style={{ fontSize: '13px' }}>
              {t('edit_sale_subtitle', 'Update sale items, prices, discounts, and dispatch parameters with transactional stock synchronization.')}
            </Text>
          </div>
        </Space>

        <Space>
          <Button
            onClick={() => navigate(`/admins/sales/view/${id}`)}
            style={{ borderRadius: '8px' }}
          >
            {t('view_detail', 'View Detail')}
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={submitting}
            disabled={isCancelled}
            onClick={() => form.submit()}
            style={{
              background: themeTokens.colorPrimary,
              borderColor: themeTokens.colorPrimary,
              borderRadius: '8px',
              fontWeight: 600
            }}
          >
            {t('save_changes', 'Save Changes')}
          </Button>
        </Space>
      </div>

      {isCancelled && (
        <Alert
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message={t('cancelled_sale_readonly', 'This sale is CANCELLED')}
          description={t('cancelled_sale_desc', 'Stock movements have been reversed. Modifications are disabled to preserve audit trail integrity.')}
          style={{ marginBottom: 20, borderRadius: '8px' }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        disabled={isCancelled}
      >
        {/* Header Information Card */}
        <Card
          bordered={false}
          style={{
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            marginBottom: '20px'
          }}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserOutlined style={{ color: themeTokens.colorPrimary }} />
              <span>{t('sale_parameters', 'Sale Information & Customer')}</span>
            </div>
          }
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="reference_no"
                label={t('reference_no', 'Reference No')}
                rules={[{ required: true, message: 'Reference number is required' }]}
              >
                <Input readOnly style={{ background: '#f8fafc', fontWeight: 600 }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="date"
                label={t('sale_date', 'Sale Date')}
                rules={[{ required: true, message: 'Sale date is required' }]}
              >
                <Input type="date" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="biller_id"
                label={t('biller', 'Biller / Branch')}
                rules={[{ required: true, message: 'Please select biller' }]}
              >
                <Select placeholder="Select Biller">
                  {metadata.billers.map(b => (
                    <Option key={b.id} value={b.id}>{b.company || b.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="warehouse_id"
                label={t('warehouse', 'Warehouse / Inventory Source')}
                rules={[{ required: true, message: 'Please select warehouse' }]}
              >
                <Select placeholder="Select Warehouse">
                  {metadata.warehouses.map(w => (
                    <Option key={w.id} value={w.id}>{w.name} ({w.code})</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="customer_id"
                label={t('customer', 'Customer')}
                rules={[{ required: true, message: 'Please select customer' }]}
              >
                <Select
                  showSearch
                  placeholder="Select Customer"
                  filterOption={(input, option) =>
                    (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {metadata.customers.map(c => (
                    <Option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ''}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="sale_status"
                label={t('sale_status', 'Sale Status')}
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="completed">
                    <Tag color="success" style={{ margin: 0 }}>Completed (Deducts Stock)</Tag>
                  </Option>
                  <Option value="pending">
                    <Tag color="warning" style={{ margin: 0 }}>Pending (Hold Order)</Tag>
                  </Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="due_date"
                label={t('payment_due_date', 'Payment Due Date')}
              >
                <Input type="date" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <div style={{ paddingTop: '30px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {t('original_channel', 'Sales Channel')}:{' '}
                  <Tag color={originalSale?.pos ? 'orange' : 'blue'}>
                    {originalSale?.pos ? 'POS Terminal Counter' : 'Commercial Invoice'}
                  </Tag>
                </Text>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Product Selection & Items Table */}
        <Card
          bordered={false}
          style={{
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            marginBottom: '20px'
          }}
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarcodeOutlined style={{ color: themeTokens.colorPrimary }} />
                <span>{t('order_items', 'Order Items')} ({formItems.length})</span>
              </div>
              <Text type="secondary" style={{ fontSize: '13px', fontWeight: 'normal' }}>
                {t('search_catalog_hint', 'Search and select products to append into sale')}
              </Text>
            </div>
          }
        >
          {/* Product Quick-Add Bar */}
          <div style={{ marginBottom: 16 }}>
            <Select
              showSearch
              placeholder={t('search_product_placeholder', 'Type product name or SKU barcode to add to sale...')}
              filterOption={false}
              onSearch={searchProducts}
              onChange={handleSelectProduct}
              value={null}
              loading={searchingProducts}
              style={{ width: '100%', maxWidth: '600px' }}
              notFoundContent={searchingProducts ? <Spin size="small" /> : <Empty description={t('no_products_found', 'No products found')} />}
            >
              {availableProducts.map(prod => (
                <Option key={prod.id} value={prod.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      <strong>{prod.name}</strong> ({prod.code})
                    </span>
                    <span style={{ color: themeTokens.colorPrimary, fontWeight: 600 }}>
                      {formatCurrency(prod.price)}
                    </span>
                  </div>
                </Option>
              ))}
            </Select>
          </div>

          {/* Items Table */}
          <Table
            dataSource={formItems}
            columns={columns}
            pagination={false}
            rowKey="key"
            locale={{
              emptyText: (
                <Empty
                  description={t('no_sale_items', 'No items in this sale. Search and add products above.')}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )
            }}
            style={{ borderRadius: '8px', overflow: 'hidden' }}
          />
        </Card>

        {/* Financial Summary & Bottom Fields */}
        <Row gutter={20}>
          {/* Notes & Comments */}
          <Col xs={24} lg={14}>
            <Card
              bordered={false}
              style={{
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                marginBottom: '20px'
              }}
              title={t('sale_notes', 'Sale Notes & Staff Comments')}
            >
              <Form.Item name="note" label={t('customer_invoice_note', 'Invoice Note (Printed on receipt)')}>
                <Input.TextArea rows={3} placeholder={t('note_placeholder', 'Terms, warranties, or customer message...')} />
              </Form.Item>

              <Form.Item name="staff_note" label={t('internal_staff_note', 'Internal Staff Note (Confidential)')}>
                <Input.TextArea rows={2} placeholder={t('staff_note_placeholder', 'Internal warehouse or accounting notes...')} />
              </Form.Item>
            </Card>
          </Col>

          {/* Financial Calculation Box */}
          <Col xs={24} lg={10}>
            <Card
              bordered={false}
              style={{
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                background: '#f8fafc',
                marginBottom: '20px'
              }}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DollarOutlined style={{ color: themeTokens.colorPrimary }} />
                  <span>{t('financial_totals', 'Financial Totals')}</span>
                </div>
              }
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ color: '#64748b' }}>{t('items_subtotal', 'Items Subtotal')}:</Text>
                <Text strong style={{ fontSize: '15px' }}>{formatCurrency(calculations.itemsSubtotal)}</Text>
              </div>

              <Row gutter={8} style={{ marginBottom: 12 }}>
                <Col span={14}>
                  <Text style={{ color: '#64748b' }}>{t('order_discount', 'Order Discount ($)')}:</Text>
                </Col>
                <Col span={10}>
                  <Form.Item name="order_discount" noStyle>
                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={8} style={{ marginBottom: 12 }}>
                <Col span={14}>
                  <Text style={{ color: '#64748b' }}>{t('order_tax', 'Order Tax ($)')}:</Text>
                </Col>
                <Col span={10}>
                  <Form.Item name="order_tax" noStyle>
                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={8} style={{ marginBottom: 12 }}>
                <Col span={14}>
                  <Text style={{ color: '#64748b' }}>{t('shipping_charge', 'Shipping Fee ($)')}:</Text>
                </Col>
                <Col span={10}>
                  <Form.Item name="shipping" noStyle>
                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Divider style={{ margin: '14px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
                <Text strong style={{ fontSize: '16px', color: '#0f172a' }}>{t('grand_total', 'Grand Total')}:</Text>
                <Text strong style={{ fontSize: '20px', color: themeTokens.colorPrimary }}>
                  {formatCurrency(calculations.grandTotal)}
                </Text>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                <Text style={{ color: '#64748b' }}>{t('already_paid', 'Already Paid')}:</Text>
                <Tag color={calculations.alreadyPaid >= calculations.grandTotal && calculations.grandTotal > 0 ? 'green' : 'blue'}>
                  {formatCurrency(calculations.alreadyPaid)}
                </Tag>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong style={{ color: calculations.balance > 0 ? '#ef4444' : '#10b981' }}>
                  {t('balance_due', 'Balance Due')}:
                </Text>
                <Text strong style={{ fontSize: '16px', color: calculations.balance > 0 ? '#ef4444' : '#10b981' }}>
                  {formatCurrency(calculations.balance)}
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </Form>

      {/* Product Variant Picker Modal */}
      <Modal
        title={
          <div>
            <ShoppingOutlined style={{ marginRight: 8, color: themeTokens.colorPrimary }} />
            <span>{t('choose_variant', 'Select Product Variant')}</span>
          </div>
        }
        open={variantModalVisible}
        onCancel={() => setVariantModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <p style={{ color: '#64748b', fontSize: '13px' }}>
          <strong>{selectedProductForVariant?.name}</strong> has multiple variants. Please choose one:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
          {selectedProductForVariant?.variants?.map(v => (
            <Card
              key={v.id}
              hoverable
              size="small"
              onClick={() => {
                addItemToCart(selectedProductForVariant, v);
                setVariantModalVisible(false);
              }}
              style={{ borderRadius: '8px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong>{v.name}</Text>
                  {v.sku && (
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      SKU: {v.sku}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Text strong style={{ color: themeTokens.colorPrimary }}>
                    {formatCurrency(v.price || selectedProductForVariant?.price)}
                  </Text>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default EditSalePage;
