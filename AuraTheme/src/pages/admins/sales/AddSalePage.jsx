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
  Modal
} from 'antd';
import {
  ShoppingOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  DollarOutlined,
  CheckOutlined,
  UserOutlined,
  BarcodeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatCurrency } from '../../../utils/uiTheme';
import { useAdminTheme } from '../../../hooks/useAdminTheme';
import { useTranslation } from '../../../contexts/LanguageContext';

const { Title, Text } = Typography;
const { Option } = Select;

const API_BASE = '/api/admin/sales';

const AddSalePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { themeTokens } = useAdminTheme();
  const [form] = Form.useForm();

  // State
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [metadata, setMetadata] = useState({
    customers: [],
    billers: [],
    warehouses: [],
    units: [],
    nextReference: ''
  });

  const [formItems, setFormItems] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);

  // Variant selector modal state
  const [variantModalVisible, setVariantModalVisible] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState(null);

  // Fetch Metadata
  const fetchMetadata = async () => {
    setLoadingMeta(true);
    try {
      const res = await axios.get(`${API_BASE}/meta/options`);
      if (res.data?.status && res.data.data) {
        const meta = res.data.data;
        setMetadata(meta);
        form.setFieldsValue({
          reference_no: meta.nextReference,
          customer_id: meta.customers[0]?.id || 1,
          biller_id: meta.billers[0]?.id || 1,
          warehouse_id: meta.warehouses[0]?.id || 1,
          date: new Date().toISOString().slice(0, 10),
          sale_status: 'completed',
          order_discount: 0,
          order_tax: 0,
          shipping: 0,
          paid: 0,
          paid_by: 'cash'
        });
      }
    } catch (err) {
      console.error('Failed to load sale metadata:', err);
    } finally {
      setLoadingMeta(false);
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
    fetchMetadata();
    searchProducts('');
  }, []);

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
    const paid = parseFloat(form.getFieldValue('paid') || 0);
    const balance = Math.max(0, grandTotal - paid);

    return {
      itemsSubtotal,
      orderDiscount,
      orderTax,
      shipping,
      grandTotal,
      paid,
      balance
    };
  }, [
    formItems,
    Form.useWatch('order_discount', form),
    Form.useWatch('order_tax', form),
    Form.useWatch('shipping', form),
    Form.useWatch('paid', form)
  ]);

  // Submit Sale
  const handleSubmit = async (values) => {
    if (formItems.length === 0) {
      message.error(t('please_add_sale_items', 'Please add at least one product item to the sale.'));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...values,
        pos: 0, // Commercial Sale
        items: formItems.map(it => ({
          product_id: it.product_id,
          product_code: it.product_code,
          product_name: it.product_name,
          product_type: it.product_type,
          option_id: it.option_id,
          product_unit_id: it.product_unit_id,
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

      if (parseFloat(values.paid) > 0) {
        payload.payment = {
          amount: parseFloat(values.paid),
          paid_by: values.paid_by || 'cash',
          reference_no: `PAY-${values.reference_no}`
        };
      }

      const res = await axios.post(API_BASE, payload);
      if (res.data?.status && res.data.data) {
        message.success(t('sale_created_successfully', 'Sale created and invoice issued successfully!'));
        navigate(`/admins/sales/view/${res.data.data.id}`);
      }
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Failed to create sale');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: themeTokens.colorBgLayout || '#f8fafc' }}>
      {/* Page Title & Back Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admins/sales')}>
              {t('back_to_sales', 'Back to Sales List')}
            </Button>
            <Title level={3} style={{ margin: 0 }}>
              {t('add_sale', 'Add New Sale Invoice')}
            </Title>
          </Space>
          <div style={{ marginTop: 4 }}>
            <Text type="secondary">
              {t('add_sale_desc', 'Create a new commercial sales order, select product variants, apply discounts/taxes, and deduct warehouse stock.')}
            </Text>
          </div>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Card bordered={false} style={{ borderRadius: 8, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item
                name="reference_no"
                label={t('invoice_reference', 'Invoice / Reference No')}
                rules={[{ required: true, message: 'Please provide reference number' }]}
              >
                <Input placeholder="SALE-YYYYMM-XXXX" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                name="customer_id"
                label={t('customer', 'Customer')}
                rules={[{ required: true, message: 'Please select customer' }]}
              >
                <Select placeholder="Select customer" showSearch optionFilterProp="children">
                  {metadata.customers.map(c => (
                    <Option key={c.id} value={c.id}>{c.name} ({c.phone || c.company || '-'})</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                name="warehouse_id"
                label={t('dispatch_warehouse', 'Dispatch Warehouse')}
                rules={[{ required: true, message: 'Please select warehouse' }]}
              >
                <Select placeholder="Select warehouse">
                  {metadata.warehouses.map(w => (
                    <Option key={w.id} value={w.id}>{w.name} ({w.code})</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                name="sale_status"
                label={t('sale_status', 'Sale Status')}
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="completed">{t('status_completed_desc', 'Completed (Deducts stock immediately)')}</Option>
                  <Option value="pending">{t('status_pending_desc', 'Pending (Stock reserved / not deducted)')}</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item name="date" label={t('date', 'Sale Date')} rules={[{ required: true }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="due_date" label={t('due_date', 'Payment Due Date')}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="biller_id" label={t('biller_branch', 'Biller / Store Branch')}>
                <Select placeholder="Select biller">
                  {metadata.billers.map(b => (
                    <Option key={b.id} value={b.id}>{b.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="note" label={t('invoice_note', 'Invoice Note')}>
                <Input placeholder="Notes visible to customer..." />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Product Catalog & Item Selector Card */}
        <Card bordered={false} style={{ borderRadius: 8, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <Divider orientation="left" style={{ margin: '0 0 16px 0' }}>
            <Space>
              <ShoppingOutlined style={{ color: themeTokens.colorPrimary }} />
              <Text strong>{t('order_items', 'Order Items & Variants')}</Text>
            </Space>
          </Divider>

          {/* Product Quick-Search Bar */}
          <div style={{ marginBottom: 16, background: '#f1f5f9', padding: 12, borderRadius: 6 }}>
            <Row gutter={12} align="middle">
              <Col xs={24} md={18}>
                <Select
                  showSearch
                  placeholder={t('search_products_to_add', 'Type product name, SKU or barcode to add to sale...')}
                  style={{ width: '100%' }}
                  loading={searchingProducts}
                  filterOption={false}
                  onSearch={(val) => searchProducts(val)}
                  onChange={(val) => handleSelectProduct(val)}
                  value={null}
                >
                  {availableProducts.map(p => (
                    <Option key={p.id} value={p.id}>
                      {p.code} - {p.name} (Price: {formatCurrency(p.price || 0)})
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} md={6}>
                <Text type="secondary">
                  <BarcodeOutlined /> {availableProducts.length} {t('products_catalog', 'catalog items loaded')}
                </Text>
              </Col>
            </Row>
          </div>

          {/* Items Table */}
          <Table
            dataSource={formItems}
            rowKey="key"
            pagination={false}
            bordered
            size="middle"
            locale={{
              emptyText: <Empty description={t('no_items_in_sale', 'No items added. Use the product selector above to search and add items.')} />
            }}
            columns={[
              {
                title: t('product', 'Product'),
                key: 'product',
                render: (_, item) => (
                  <div>
                    <Text strong>{item.product_name}</Text>
                    {item.variant_name && (
                      <div><Tag color="cyan">{item.variant_name}</Tag></div>
                    )}
                    <div><Text type="secondary" style={{ fontSize: 11 }}>SKU: {item.product_code}</Text></div>
                  </div>
                )
              },
              {
                title: t('unit', 'Unit'),
                dataIndex: 'product_unit_code',
                key: 'unit',
                width: 90,
                render: (val) => <Tag color="blue">{val || 'Unit'}</Tag>
              },
              {
                title: t('unit_price', 'Price ($)'),
                dataIndex: 'unit_price',
                key: 'unit_price',
                width: 130,
                render: (val, item) => (
                  <InputNumber
                    min={0}
                    step={0.5}
                    precision={2}
                    value={val}
                    onChange={(newVal) => handleUpdateItem(item.key, 'unit_price', newVal)}
                    style={{ width: '100%' }}
                  />
                )
              },
              {
                title: t('quantity', 'Quantity'),
                dataIndex: 'quantity',
                key: 'quantity',
                width: 120,
                render: (val, item) => (
                  <InputNumber
                    min={0.01}
                    step={1}
                    value={val}
                    onChange={(newVal) => handleUpdateItem(item.key, 'quantity', newVal)}
                    style={{ width: '100%' }}
                  />
                )
              },
              {
                title: t('discount', 'Discount ($)'),
                dataIndex: 'item_discount',
                key: 'item_discount',
                width: 110,
                render: (val, item) => (
                  <InputNumber
                    min={0}
                    step={0.5}
                    value={val}
                    onChange={(newVal) => handleUpdateItem(item.key, 'item_discount', newVal)}
                    style={{ width: '100%' }}
                  />
                )
              },
              {
                title: t('subtotal', 'Subtotal ($)'),
                dataIndex: 'subtotal',
                key: 'subtotal',
                align: 'right',
                width: 130,
                render: (val) => <Text strong>{formatCurrency(val)}</Text>
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
        </Card>

        {/* Calculations and Payment Details Card */}
        <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Title level={5}>{t('additional_charges_and_payment', 'Additional Adjustments & Payment')}</Title>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="order_discount" label={t('order_discount', 'Order Discount ($)')}>
                    <InputNumber min={0} step={1} precision={2} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="order_tax" label={t('order_tax', 'Order Tax ($)')}>
                    <InputNumber min={0} step={1} precision={2} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="shipping" label={t('shipping', 'Shipping ($)')}>
                    <InputNumber min={0} step={1} precision={2} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Divider style={{ margin: '12px 0' }} />
              <Title level={5}>{t('payment_receipt', 'Initial Payment Collection')}</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="paid" label={t('amount_paid', 'Amount Paid ($)')}>
                    <InputNumber min={0} step={1} precision={2} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="paid_by" label={t('payment_method', 'Payment Method')}>
                    <Select>
                      <Option value="cash">{t('cash', 'Cash')}</Option>
                      <Option value="bank_transfer">{t('bank_transfer', 'Bank Transfer')}</Option>
                      <Option value="khqr">{t('khqr', 'ABA KHQR')}</Option>
                      <Option value="cheque">{t('cheque', 'Cheque')}</Option>
                      <Option value="credit_card">{t('credit_card', 'Credit Card')}</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Col>

            <Col xs={24} md={12}>
              <Card size="small" style={{ background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text type="secondary">{t('items_subtotal', 'Items Subtotal')}:</Text>
                  <Text strong>{formatCurrency(calculations.itemsSubtotal)}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text type="secondary">{t('order_discount', 'Order Discount')}:</Text>
                  <Text style={{ color: '#dc2626' }}>- {formatCurrency(calculations.orderDiscount)}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text type="secondary">{t('order_tax', 'Order Tax')}:</Text>
                  <Text>+ {formatCurrency(calculations.orderTax)}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text type="secondary">{t('shipping', 'Shipping')}:</Text>
                  <Text>+ {formatCurrency(calculations.shipping)}</Text>
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Title level={4} style={{ margin: 0 }}>{t('grand_total', 'Grand Total')}:</Title>
                  <Title level={4} style={{ margin: 0, color: themeTokens.colorPrimary }}>
                    {formatCurrency(calculations.grandTotal)}
                  </Title>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: '#16a34a' }}>{t('paid', 'Paid')}:</Text>
                  <Text style={{ color: '#16a34a', fontWeight: 600 }}>{formatCurrency(calculations.paid)}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong>{t('balance_due', 'Balance Due')}:</Text>
                  <Text strong style={{ color: calculations.balance > 0 ? '#dc2626' : '#16a34a' }}>
                    {formatCurrency(calculations.balance)}
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button onClick={() => navigate('/admins/sales')}>
              {t('cancel', 'Cancel')}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              icon={<CheckOutlined />}
              style={{ background: themeTokens.colorPrimary }}
            >
              {t('finalize_sale', 'Create Sale Invoice')}
            </Button>
          </div>
        </Card>
      </Form>

      {/* Product Variant Picker Modal */}
      <Modal
        title={t('select_variant_attributes', 'Select Product Variant')}
        open={variantModalVisible}
        onCancel={() => setVariantModalVisible(false)}
        footer={null}
      >
        <Text strong>{selectedProductForVariant?.name}</Text>
        <div style={{ margin: '16px 0' }}>
          {selectedProductForVariant?.variants?.map(v => (
            <div
              key={v.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                marginBottom: 8,
                cursor: 'pointer'
              }}
              onClick={() => {
                addItemToCart(selectedProductForVariant, v);
                setVariantModalVisible(false);
              }}
            >
              <div>
                <Text strong>{v.name}</Text>
                {v.sku && <div><Text type="secondary" style={{ fontSize: 11 }}>SKU: {v.sku}</Text></div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <Text strong style={{ color: themeTokens.colorPrimary }}>{formatCurrency(v.price || selectedProductForVariant.price)}</Text>
                <div><Button size="small" type="primary">{t('select', 'Select')}</Button></div>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default AddSalePage;
