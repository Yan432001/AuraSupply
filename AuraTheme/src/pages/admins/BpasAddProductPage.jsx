import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Tabs,
  Switch,
  Row,
  Col,
  Table,
  Space,
  Tag,
  Divider,
  message,
  Typography,
  DatePicker,
  Upload,
  Flex,
  Modal,
  Alert,
  Tooltip,
  Breadcrumb,
  Statistic
} from 'antd';
import {
  PlusOutlined,
  ArrowLeftOutlined,
  BarcodeOutlined,
  CheckOutlined,
  UploadOutlined,
  DeleteOutlined,
  CopyOutlined,
  ShopOutlined,
  DollarOutlined,
  ReloadOutlined,
  FileTextOutlined,
  InboxOutlined,
  ThunderboltOutlined,
  ApartmentOutlined,
  CalculatorOutlined,
  TagOutlined,
  BankOutlined,
  TeamOutlined,
  GiftOutlined,
  SettingOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { formatCurrency } from '../../utils/uiTheme';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { useTranslation } from '../../contexts/LanguageContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function BpasAddProductPage({ onBack, editProduct = null }) {
  const adminTheme = useAdminTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [activeTab, setActiveTab] = useState('required');
  const [productType, setProductType] = useState(editProduct?.type || 'standard');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Metadata Lists
  const [categoriesList, setCategoriesList] = useState([]);
  const [unitsList, setUnitsList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [warehousesList, setWarehousesList] = useState([]);
  const [suppliersList, setSuppliersList] = useState([]);
  const [taxRatesList, setTaxRatesList] = useState([]);
  const [accountsList, setAccountsList] = useState([]);
  const [attributesList, setAttributesList] = useState([]);

  // Cover image preview
  const [coverImageUrl, setCoverImageUrl] = useState(editProduct?.image || '');

  // Variants state
  const [variantRows, setVariantRows] = useState([]);
  const [newVariantName, setNewVariantName] = useState('');

  // Variant generator state & modal
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState([]);

  // Multi-Warehouse allocations state
  const [warehouseAllocations, setWarehouseAllocations] = useState([]);

  // Real-time watched form fields for calculation
  const watchPrice = Form.useWatch('price', form) || 0;
  const watchCost = Form.useWatch('cost', form) || 0;
  const watchPromotion = Form.useWatch('promotion', form);

  // Calculate Profit Margin
  const profitMargin = watchPrice > 0 ? (((watchPrice - watchCost) / watchPrice) * 100).toFixed(1) : 0;
  const markupPercentage = watchCost > 0 ? (((watchPrice - watchCost) / watchCost) * 100).toFixed(1) : 0;

  // 1. Load All Metadata via dedicated meta options endpoint
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const res = await axios.get('/api/products/meta/options');
        if (res.data?.status && res.data?.data) {
          const d = res.data.data;
          setCategoriesList(d.categories || []);
          setUnitsList(d.units || []);
          setBrandsList(d.brands || []);
          setWarehousesList(d.warehouses || []);
          setSuppliersList(d.suppliers || []);
          setTaxRatesList(d.tax_rates || []);
          setAttributesList(d.attributes || []);
          setAccountsList(d.accounts || []);

          // Initialize warehouse allocations
          if (Array.isArray(d.warehouses) && d.warehouses.length > 0 && !editProduct) {
            setWarehouseAllocations(
              d.warehouses.map((w, idx) => ({
                warehouse_id: w.id,
                warehouse_name: w.name,
                quantity: idx === 0 ? 10 : 0
              }))
            );
          }
        }
      } catch (err) {
        console.warn('Metadata note in Add Product:', err.message);
      }
    };
    loadMetadata();
  }, []);

  // 2. Pre-fill Form if in Edit Mode
  useEffect(() => {
    if (editProduct) {
      setCoverImageUrl(editProduct.image || '');
      setProductType(editProduct.type || 'standard');

      form.setFieldsValue({
        type: editProduct.type || 'standard',
        name: editProduct.name || '',
        second_name: editProduct.second_name || '',
        code: editProduct.code || '',
        barcode: editProduct.barcode || editProduct.code || '',
        sku: editProduct.sku || editProduct.code || '',
        category_id: editProduct.category_id || undefined,
        subcategory_id: editProduct.subcategory_id || undefined,
        brand_id: editProduct.brand_id || editProduct.brand || undefined,
        unit: editProduct.unit || undefined,
        purchase_unit: editProduct.purchase_unit || editProduct.unit || undefined,
        sale_unit: editProduct.sale_unit || editProduct.unit || undefined,
        currency: editProduct.currency || 'USD',
        price: parseFloat(editProduct.price) || 0,
        cost: parseFloat(editProduct.cost) || 0,
        alert_quantity: parseFloat(editProduct.alert_quantity) || 10,
        tax_rate: editProduct.tax_rate ? String(editProduct.tax_rate) : '0',
        tax_method: editProduct.tax_method || 'exclusive',
        barcode_symbology: editProduct.barcode_symbology || 'Code128',
        weight: editProduct.weight ? parseFloat(editProduct.weight) : undefined,
        p_length: editProduct.p_length ? parseFloat(editProduct.p_length) : undefined,
        p_width: editProduct.p_width ? parseFloat(editProduct.p_width) : undefined,
        p_height: editProduct.p_height ? parseFloat(editProduct.p_height) : undefined,
        cf1: editProduct.cf1 || '',
        cf2: editProduct.cf2 || '',
        cf3: editProduct.cf3 || '',
        cf4: editProduct.cf4 || '',
        cf5: editProduct.cf5 || '',
        cf6: editProduct.cf6 || '',
        details: editProduct.details || '',
        product_details: editProduct.product_details || '',
        supplier1: editProduct.supplier1 || undefined,
        supplier1price: editProduct.supplier1price || undefined,
        supplier1_part_no: editProduct.supplier1_part_no || '',
        supplier2: editProduct.supplier2 || undefined,
        supplier2price: editProduct.supplier2price || undefined,
        supplier2_part_no: editProduct.supplier2_part_no || '',
        supplier3: editProduct.supplier3 || undefined,
        supplier3price: editProduct.supplier3price || undefined,
        supplier3_part_no: editProduct.supplier3_part_no || '',
        promotion: Boolean(editProduct.promotion),
        promo_price: editProduct.promo_price || undefined,
        start_date: editProduct.start_date ? dayjs(editProduct.start_date) : undefined,
        end_date: editProduct.end_date ? dayjs(editProduct.end_date) : undefined,
      });

      if (Array.isArray(editProduct.variants) && editProduct.variants.length > 0) {
        setVariantRows(
          editProduct.variants.map((v) => ({
            id: v.id,
            name: v.name,
            sku: v.sku || `${editProduct.code}-${v.name}`,
            barcode: v.barcode || v.sku || `${editProduct.code}-${v.name}`,
            cost: parseFloat(v.cost) || parseFloat(editProduct.cost) || 0,
            price: parseFloat(v.price) || parseFloat(editProduct.price) || 0,
            quantity: parseFloat(v.quantity) || 0,
            warehouse_id: v.warehouses?.[0]?.warehouse_id || warehousesList[0]?.id || 1,
            status: v.status !== 0 ? 1 : 0,
            attributes: v.attributes || null
          }))
        );
      }

      if (Array.isArray(editProduct.warehouse_stock) && editProduct.warehouse_stock.length > 0) {
        setWarehouseAllocations(
          editProduct.warehouse_stock.map((w) => ({
            warehouse_id: w.warehouse_id,
            warehouse_name: w.warehouse_name,
            quantity: parseFloat(w.quantity) || 0
          }))
        );
      }
    } else {
      // Default clean values for new product
      form.setFieldsValue({
        type: 'standard',
        currency: 'USD',
        price: 25.0,
        cost: 15.0,
        alert_quantity: 10,
        tax_method: 'exclusive',
        barcode_symbology: 'Code128'
      });
    }
  }, [editProduct, warehousesList]);

  // Random Code / Barcode generator (AURA_v1 <i class="fa fa-random"></i>)
  const handleRandomCode = () => {
    const code = `${Math.floor(10000000 + Math.random() * 90000000)}`;
    form.setFieldsValue({ code, barcode: code, sku: code });
    message.success(`Generated Barcode Code: ${code}`);
  };

  // Add Manual Variant Row
  const handleAddManualVariant = () => {
    if (!newVariantName.trim()) {
      message.warning('Please enter a variant combination name (e.g. Red / XL).');
      return;
    }
    const currentCode = form.getFieldValue('code') || 'PRD';
    const currentPrice = form.getFieldValue('price') || 0;
    const currentCost = form.getFieldValue('cost') || 0;
    const vName = newVariantName.trim();
    const vSku = `${currentCode}-${vName.replace(/[^a-zA-Z0-9]+/g, '-').toUpperCase()}`;

    if (variantRows.some((r) => r.name.toLowerCase() === vName.toLowerCase())) {
      message.error(`Variant combination '${vName}' already exists.`);
      return;
    }

    setVariantRows((prev) => [
      ...prev,
      {
        id: `manual_${Date.now()}`,
        name: vName,
        sku: vSku,
        barcode: vSku,
        cost: parseFloat(currentCost) || 0,
        price: parseFloat(currentPrice) || 0,
        quantity: 10,
        warehouse_id: warehousesList[0]?.id || 1,
        status: 1,
        attributes: null
      }
    ]);
    setNewVariantName('');
  };

  // Generate Cartesian Combinations from selected attributes
  const handleGenerateCombinations = async () => {
    if (selectedAttributes.length === 0) {
      message.warning('Please select at least one attribute to generate variants.');
      return;
    }

    const currentCode = form.getFieldValue('code') || 'PRD';
    const currentPrice = form.getFieldValue('price') || 0;
    const currentCost = form.getFieldValue('cost') || 0;

    try {
      const res = await axios.post('/api/admin/attributes/generate-combinations', {
        attributeSelections: selectedAttributes,
        baseSku: currentCode,
        basePrice: parseFloat(currentPrice) || 0,
        baseCost: parseFloat(currentCost) || 0
      });

      if (res.data?.success && Array.isArray(res.data.data)) {
        const generated = res.data.data.map((g) => ({
          ...g,
          warehouse_id: warehousesList[0]?.id || 1
        }));
        setVariantRows(generated);
        setIsGeneratorOpen(false);
        message.success(`Generated ${generated.length} variant combinations!`);
      }
    } catch (err) {
      message.error('Failed to generate variant combinations: ' + (err.response?.data?.message || err.message));
    }
  };

  // Update Warehouse Allocation quantity
  const handleWarehouseQtyChange = (warehouseId, qty) => {
    setWarehouseAllocations((prev) =>
      prev.map((w) => (w.warehouse_id === warehouseId ? { ...w, quantity: Math.max(0, parseFloat(qty) || 0) } : w))
    );
  };

  // Handle Form Submit
  const handleSubmitProduct = async () => {
    try {
      const values = await form.validateFields();

      setIsSubmitting(true);

      const payload = {
        ...values,
        image: coverImageUrl,
        barcode: values.barcode || values.code,
        sku: values.sku || values.code,
        price: parseFloat(values.price) || 0,
        cost: parseFloat(values.cost) || 0,
        alert_quantity: parseFloat(values.alert_quantity) || 10,
        weight: values.weight ? parseFloat(values.weight) : null,
        p_length: values.p_length ? parseFloat(values.p_length) : null,
        p_width: values.p_width ? parseFloat(values.p_width) : null,
        p_height: values.p_height ? parseFloat(values.p_height) : null,
        promotion: values.promotion ? 1 : 0,
        promo_price: values.promo_price ? parseFloat(values.promo_price) : null,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
        variants: variantRows.map((v) => ({
          id: typeof v.id === 'number' ? v.id : undefined,
          name: v.name,
          sku: v.sku,
          barcode: v.barcode,
          cost: parseFloat(v.cost) || 0,
          price: parseFloat(v.price) || 0,
          quantity: parseFloat(v.quantity) || 0,
          warehouse_id: v.warehouse_id || warehousesList[0]?.id || 1,
          status: v.status !== 0 ? 1 : 0,
          attributes: v.attributes || null
        })),
        warehouse_allocations: warehouseAllocations
      };

      if (editProduct?.id) {
        const res = await axios.put(`/api/admin/products/${editProduct.id}`, payload);
        if (res.data?.success || res.data?.status) {
          message.success(`Product "${values.name}" updated successfully!`);
        }
      } else {
        const res = await axios.post('/api/admin/products', payload);
        if (res.data?.success || res.data?.status) {
          message.success(`Product "${values.name}" created successfully in catalog!`);
        }
      }

      if (onBack) {
        onBack();
      } else {
        navigate('/admins/products');
      }
    } catch (err) {
      console.error('Submit product error:', err);
      message.error(err.response?.data?.message || err.message || 'Please check required fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 
        =========================================================================
        HEADER NAVIGATION & BREADCRUMB
        =========================================================================
      */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          padding: '14px 20px',
          background: adminTheme.surface,
          border: `1px solid ${adminTheme.border}`,
          borderRadius: 8,
          borderLeft: '4px solid #2563eb'
        }}
      >
        <Space direction="vertical" size={2}>
          <Breadcrumb
            items={[
              { title: <span style={{ color: adminTheme.subtext, cursor: 'pointer' }} onClick={onBack}>Inventory</span> },
              { title: <span style={{ color: adminTheme.subtext, cursor: 'pointer' }} onClick={onBack}>Products</span> },
              { title: <strong style={{ color: adminTheme.text }}>{editProduct ? 'Edit Product' : 'Add Product'}</strong> }
            ]}
          />
          <h2 style={{ color: '#2563eb', fontSize: 18, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <PlusOutlined style={{ fontSize: 16 }} />
            {editProduct ? `Edit Product: ${editProduct.name}` : 'Add Product'}
            <Tag color="blue" style={{ fontSize: 11, marginLeft: 6 }}>AURA_v1 Template</Tag>
          </h2>
        </Space>

        <Space wrap>
          <Button icon={<ArrowLeftOutlined />} onClick={onBack || (() => navigate('/admins/products'))}>
            {t('back_to_products', 'Back to List')}
          </Button>

          <Button onClick={() => form.resetFields()}>
            {t('reset_form', 'Reset')}
          </Button>

          <Button
            type="primary"
            icon={<SaveOutlined />}
            size="large"
            loading={isSubmitting}
            onClick={handleSubmitProduct}
            style={{ background: '#16a34a', borderColor: '#16a34a', fontWeight: 700 }}
          >
            {editProduct ? 'Save Changes' : 'Save Product'}
          </Button>
        </Space>
      </div>

      {/* 
        =========================================================================
        PROFIT MARGIN & VALUATION SUMMARY STRIP
        =========================================================================
      */}
      <Card size="small" style={{ background: adminTheme.surface, borderColor: adminTheme.border }}>
        <Row gutter={[16, 8]} align="middle">
          <Col xs={12} sm={6}>
            <Statistic title="Selling Price" value={watchPrice} prefix="$" precision={2} valueStyle={{ color: '#16a34a', fontWeight: 800 }} />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic title="Unit Cost" value={watchCost} prefix="$" precision={2} valueStyle={{ color: adminTheme.subtext, fontWeight: 700 }} />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Profit Margin"
              value={profitMargin}
              suffix="%"
              valueStyle={{ color: profitMargin > 20 ? '#16a34a' : profitMargin > 0 ? '#d97706' : '#dc2626', fontWeight: 800 }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic title="Markup" value={markupPercentage} suffix="%" valueStyle={{ color: '#2563eb', fontWeight: 700 }} />
          </Col>
        </Row>
      </Card>

      {/* 
        =========================================================================
        MAIN TABBED FORM CONTAINER (Matching AURA_v1 add.php)
        =========================================================================
      */}
      <Card
        style={{ borderRadius: 8, border: `1px solid ${adminTheme.border}` }}
        styles={{ body: { padding: '20px' } }}
      >
        <Form form={form} layout="vertical">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            type="card"
            items={[
              // TAB 1: REQUIRED
              {
                key: 'required',
                label: (
                  <span style={{ fontWeight: 700, padding: '0 4px' }}>
                    <FileTextOutlined style={{ marginRight: 6 }} />
                    Required *
                  </span>
                ),
                children: (
                  <div style={{ paddingTop: 10 }}>
                    <Row gutter={[20, 16]}>
                      {/* Left Column: Core Fields */}
                      <Col xs={24} lg={16}>
                        <Row gutter={[16, 12]}>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              label={<strong>Product Type</strong>}
                              name="type"
                              rules={[{ required: true, message: 'Please select product type' }]}
                            >
                              <Select onChange={(val) => setProductType(val)}>
                                <Option value="standard">Standard (Physical Good)</Option>
                                <Option value="combo">Combo (Bundle of Products)</Option>
                                <Option value="digital">Digital (Downloadable / Serial)</Option>
                                <Option value="service">Service (Non-Physical / Labor)</Option>
                              </Select>
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12}>
                            <Form.Item
                              label={<strong>Barcode / Code</strong>}
                              name="code"
                              rules={[{ required: true, message: 'Product Code/Barcode is required' }]}
                            >
                              <Input
                                placeholder="Scan or enter barcode"
                                addonAfter={
                                  <Tooltip title="Generate Random Barcode">
                                    <ThunderboltOutlined onClick={handleRandomCode} style={{ cursor: 'pointer', color: '#2563eb' }} />
                                  </Tooltip>
                                }
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={16}>
                            <Form.Item
                              label={<strong>Product Name</strong>}
                              name="name"
                              rules={[{ required: true, message: 'Product Name is required' }]}
                            >
                              <Input placeholder="e.g. Organic Cotton T-Shirt" />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={8}>
                            <Form.Item label="SKU" name="sku">
                              <Input placeholder="Leave blank to use code" />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12}>
                            <Form.Item label="Second Name / Local Name" name="second_name">
                              <Input placeholder="e.g. អាវយឺតកប្បាស (Khmer / Alternate)" />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12}>
                            <Form.Item
                              label={<strong>Category</strong>}
                              name="category_id"
                              rules={[{ required: true, message: 'Please select category' }]}
                            >
                              <Select placeholder="Select Category" showSearch optionFilterProp="children">
                                {categoriesList.map((c) => (
                                  <Option key={c.id} value={c.id}>
                                    {c.name}
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={8}>
                            <Form.Item label={<strong>Base Unit</strong>} name="unit" rules={[{ required: true }]}>
                              <Select placeholder="Select Base Unit">
                                {unitsList.map((u) => (
                                  <Option key={u.id} value={u.id}>
                                    {u.name} ({u.code})
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={8}>
                            <Form.Item label="Purchase Unit" name="purchase_unit">
                              <Select placeholder="Select Purchase Unit">
                                {unitsList.map((u) => (
                                  <Option key={u.id} value={u.id}>
                                    {u.name} ({u.code})
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={8}>
                            <Form.Item label="Sale Unit" name="sale_unit">
                              <Select placeholder="Select Sale Unit">
                                {unitsList.map((u) => (
                                  <Option key={u.id} value={u.id}>
                                    {u.name} ({u.code})
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={8}>
                            <Form.Item label={<strong>Cost ($)</strong>} name="cost" rules={[{ required: true }]}>
                              <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={8}>
                            <Form.Item label={<strong>Selling Price ($)</strong>} name="price" rules={[{ required: true }]}>
                              <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={8}>
                            <Form.Item label="Alert Quantity" name="alert_quantity">
                              <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12}>
                            <Form.Item label="Tax Rate" name="tax_rate">
                              <Select placeholder="Select Tax Rate">
                                {taxRatesList.map((tr) => (
                                  <Option key={tr.id} value={String(tr.rate)}>
                                    {tr.name} ({tr.rate}%)
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12}>
                            <Form.Item label="Tax Method" name="tax_method">
                              <Select>
                                <Option value="exclusive">Exclusive (Price + Tax)</Option>
                                <Option value="inclusive">Inclusive (Price includes Tax)</Option>
                              </Select>
                            </Form.Item>
                          </Col>
                        </Row>
                      </Col>

                      {/* Right Column: Image & Media Upload */}
                      <Col xs={24} lg={8}>
                        <Card
                          title={<span style={{ fontWeight: 700 }}>Product Cover Image</span>}
                          size="small"
                          style={{ background: '#f8fafc', borderColor: '#e2e8f0', textAlign: 'center' }}
                        >
                          <div
                            style={{
                              width: '100%',
                              height: 180,
                              background: '#fff',
                              border: '1px dashed #cbd5e1',
                              borderRadius: 8,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: 12,
                              overflow: 'hidden'
                            }}
                          >
                            {coverImageUrl ? (
                              <img
                                src={coverImageUrl.startsWith('http') || coverImageUrl.startsWith('/') ? coverImageUrl : `/assets/uploads/${coverImageUrl}`}
                                alt="Product Preview"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = '/assets/uploads/no_image.png';
                                }}
                              />
                            ) : (
                              <div style={{ color: '#94a3b8' }}>
                                <InboxOutlined style={{ fontSize: 36 }} />
                                <div style={{ fontSize: 12, marginTop: 4 }}>No Cover Image</div>
                              </div>
                            )}
                          </div>

                          <Form.Item label="Image File / URL" style={{ marginBottom: 8 }}>
                            <Input
                              placeholder="e.g. no_image.png or URL"
                              value={coverImageUrl}
                              onChange={(e) => setCoverImageUrl(e.target.value)}
                            />
                          </Form.Item>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            Supported: PNG, JPG, WEBP (Max 2MB)
                          </Text>
                        </Card>
                      </Col>
                    </Row>
                  </div>
                )
              },

              // TAB 2: DETAILS & DIMENSIONS
              {
                key: 'details',
                label: (
                  <span style={{ fontWeight: 700, padding: '0 4px' }}>
                    <TagOutlined style={{ marginRight: 6 }} />
                    Details & Specs
                  </span>
                ),
                children: (
                  <div style={{ paddingTop: 10 }}>
                    <Row gutter={[16, 12]}>
                      <Col xs={24} sm={8}>
                        <Form.Item label="Brand" name="brand_id">
                          <Select placeholder="Select Brand" allowClear>
                            {brandsList.map((b) => (
                              <Option key={b.id} value={b.id}>
                                {b.name}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={8}>
                        <Form.Item label="Weight (kg)" name="weight">
                          <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="e.g. 0.25" />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={8}>
                        <Form.Item label="Barcode Symbology" name="barcode_symbology">
                          <Select>
                            <Option value="Code128">Code 128 (Standard)</Option>
                            <Option value="EAN13">EAN-13 (13 Digits)</Option>
                            <Option value="UPC">UPC-A (12 Digits)</Option>
                            <Option value="Code39">Code 39</Option>
                          </Select>
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={8}>
                        <Form.Item label="Length (cm)" name="p_length">
                          <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={8}>
                        <Form.Item label="Width (cm)" name="p_width">
                          <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={8}>
                        <Form.Item label="Height (cm)" name="p_height">
                          <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>

                      <Divider style={{ margin: '8px 0' }}>Custom Fields</Divider>

                      <Col xs={24} sm={8}>
                        <Form.Item label="Custom Field 1" name="cf1">
                          <Input placeholder="Custom info 1" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Form.Item label="Custom Field 2" name="cf2">
                          <Input placeholder="Custom info 2" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Form.Item label="Custom Field 3" name="cf3">
                          <Input placeholder="Custom info 3" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Form.Item label="Custom Field 4" name="cf4">
                          <Input placeholder="Custom info 4" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Form.Item label="Custom Field 5" name="cf5">
                          <Input placeholder="Custom info 5" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Form.Item label="Custom Field 6" name="cf6">
                          <Input placeholder="Custom info 6" />
                        </Form.Item>
                      </Col>

                      <Col span={24}>
                        <Form.Item label="Product Details & Description" name="product_details">
                          <TextArea rows={4} placeholder="Enter detailed product description, specifications, or internal notes..." />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                )
              },

              // TAB 3: ACCOUNTING & LEDGER
              {
                key: 'accounting',
                label: (
                  <span style={{ fontWeight: 700, padding: '0 4px' }}>
                    <BankOutlined style={{ marginRight: 6 }} />
                    Accounting
                  </span>
                ),
                children: (
                  <div style={{ paddingTop: 10 }}>
                    <Alert
                      type="info"
                      showIcon
                      message="General Ledger Integration"
                      description="Assign the asset, COGS, and revenue accounts for automatic double-entry journal postings during purchases and sales transactions."
                      style={{ marginBottom: 16 }}
                    />
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12}>
                        <Form.Item label="Inventory Asset Account" name="inventory_account">
                          <Select placeholder="11040 - Inventory Asset" allowClear>
                            {accountsList.map((a) => (
                              <Option key={a.id} value={a.account_code || a.id}>
                                {a.account_code} - {a.account_name}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12}>
                        <Form.Item label="Cost of Goods Sold (COGS) Account" name="cogs_account">
                          <Select placeholder="51010 - Cost of Goods Sold" allowClear>
                            {accountsList.map((a) => (
                              <Option key={a.id} value={a.account_code || a.id}>
                                {a.account_code} - {a.account_name}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12}>
                        <Form.Item label="Sales Revenue Account" name="sales_account">
                          <Select placeholder="41010 - Sales Revenue" allowClear>
                            {accountsList.map((a) => (
                              <Option key={a.id} value={a.account_code || a.id}>
                                {a.account_code} - {a.account_name}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12}>
                        <Form.Item label="Expense Account" name="expense_account">
                          <Select placeholder="61010 - Operating Expense" allowClear>
                            {accountsList.map((a) => (
                              <Option key={a.id} value={a.account_code || a.id}>
                                {a.account_code} - {a.account_name}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                )
              },

              // TAB 4: MULTI-VARIANTS
              {
                key: 'variants',
                label: (
                  <span style={{ fontWeight: 700, padding: '0 4px' }}>
                    <ApartmentOutlined style={{ marginRight: 6 }} />
                    Multi-Variants ({variantRows.length})
                  </span>
                ),
                children: (
                  <div style={{ paddingTop: 10 }}>
                    <Flex justify="space-between" align="center" wrap="wrap" gap={10} style={{ marginBottom: 14 }}>
                      <Space>
                        <Input
                          placeholder="e.g. Red / XL"
                          value={newVariantName}
                          onChange={(e) => setNewVariantName(e.target.value)}
                          onPressEnter={handleAddManualVariant}
                          style={{ width: 220 }}
                        />
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddManualVariant}>
                          Add Variant
                        </Button>
                      </Space>

                      <Button
                        icon={<ThunderboltOutlined style={{ color: '#2563eb' }} />}
                        onClick={() => setIsGeneratorOpen(true)}
                        style={{ borderColor: '#2563eb', color: '#2563eb', fontWeight: 600 }}
                      >
                        Combination Generator
                      </Button>
                    </Flex>

                    <Table
                      dataSource={variantRows}
                      rowKey="id"
                      pagination={false}
                      size="middle"
                      columns={[
                        {
                          title: 'Variant Name',
                          dataIndex: 'name',
                          key: 'name',
                          render: (name, _, idx) => (
                            <Input
                              value={name}
                              onChange={(e) => {
                                const updated = [...variantRows];
                                updated[idx].name = e.target.value;
                                setVariantRows(updated);
                              }}
                            />
                          )
                        },
                        {
                          title: 'SKU',
                          dataIndex: 'sku',
                          key: 'sku',
                          render: (sku, _, idx) => (
                            <Input
                              value={sku}
                              onChange={(e) => {
                                const updated = [...variantRows];
                                updated[idx].sku = e.target.value;
                                setVariantRows(updated);
                              }}
                            />
                          )
                        },
                        {
                          title: 'Barcode',
                          dataIndex: 'barcode',
                          key: 'barcode',
                          render: (bc, _, idx) => (
                            <Input
                              value={bc}
                              onChange={(e) => {
                                const updated = [...variantRows];
                                updated[idx].barcode = e.target.value;
                                setVariantRows(updated);
                              }}
                            />
                          )
                        },
                        {
                          title: 'Cost ($)',
                          dataIndex: 'cost',
                          key: 'cost',
                          width: 100,
                          render: (c, _, idx) => (
                            <InputNumber
                              min={0}
                              step={0.01}
                              value={c}
                              onChange={(val) => {
                                const updated = [...variantRows];
                                updated[idx].cost = val;
                                setVariantRows(updated);
                              }}
                              style={{ width: '100%' }}
                            />
                          )
                        },
                        {
                          title: 'Price ($)',
                          dataIndex: 'price',
                          key: 'price',
                          width: 100,
                          render: (p, _, idx) => (
                            <InputNumber
                              min={0}
                              step={0.01}
                              value={p}
                              onChange={(val) => {
                                const updated = [...variantRows];
                                updated[idx].price = val;
                                setVariantRows(updated);
                              }}
                              style={{ width: '100%' }}
                            />
                          )
                        },
                        {
                          title: 'Stock Qty',
                          dataIndex: 'quantity',
                          key: 'quantity',
                          width: 90,
                          render: (q, _, idx) => (
                            <InputNumber
                              min={0}
                              value={q}
                              onChange={(val) => {
                                const updated = [...variantRows];
                                updated[idx].quantity = val;
                                setVariantRows(updated);
                              }}
                              style={{ width: '100%' }}
                            />
                          )
                        },
                        {
                          title: '',
                          key: 'action',
                          width: 50,
                          render: (_, __, idx) => (
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => {
                                setVariantRows((prev) => prev.filter((___, i) => i !== idx));
                              }}
                            />
                          )
                        }
                      ]}
                      locale={{
                        emptyText: 'No variants configured. This product will be sold as a single item.'
                      }}
                    />
                  </div>
                )
              },

              // TAB 5: SUPPLIERS
              {
                key: 'tab_supplier',
                label: (
                  <span style={{ fontWeight: 700, padding: '0 4px' }}>
                    <TeamOutlined style={{ marginRight: 6 }} />
                    Suppliers
                  </span>
                ),
                children: (
                  <div style={{ paddingTop: 10 }}>
                    <Row gutter={[16, 16]}>
                      {/* Supplier 1 */}
                      <Col span={24}>
                        <Card title="Primary Supplier" size="small" style={{ background: '#f8fafc' }}>
                          <Row gutter={12}>
                            <Col xs={24} sm={10}>
                              <Form.Item label="Supplier" name="supplier1">
                                <Select placeholder="Select Primary Supplier" allowClear>
                                  {suppliersList.map((s) => (
                                    <Option key={s.id} value={s.id}>
                                      {s.name} ({s.company})
                                    </Option>
                                  ))}
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col xs={24} sm={7}>
                              <Form.Item label="Supplier Price ($)" name="supplier1price">
                                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                              </Form.Item>
                            </Col>
                            <Col xs={24} sm={7}>
                              <Form.Item label="Supplier Part No." name="supplier1_part_no">
                                <Input placeholder="e.g. SUP-A101" />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Card>
                      </Col>

                      {/* Supplier 2 */}
                      <Col span={24}>
                        <Card title="Secondary Supplier" size="small" style={{ background: '#f8fafc' }}>
                          <Row gutter={12}>
                            <Col xs={24} sm={10}>
                              <Form.Item label="Supplier" name="supplier2">
                                <Select placeholder="Select Secondary Supplier" allowClear>
                                  {suppliersList.map((s) => (
                                    <Option key={s.id} value={s.id}>
                                      {s.name} ({s.company})
                                    </Option>
                                  ))}
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col xs={24} sm={7}>
                              <Form.Item label="Supplier Price ($)" name="supplier2price">
                                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                              </Form.Item>
                            </Col>
                            <Col xs={24} sm={7}>
                              <Form.Item label="Supplier Part No." name="supplier2_part_no">
                                <Input placeholder="e.g. SUP-B202" />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Card>
                      </Col>

                      {/* Supplier 3 */}
                      <Col span={24}>
                        <Card title="Tertiary Supplier" size="small" style={{ background: '#f8fafc' }}>
                          <Row gutter={12}>
                            <Col xs={24} sm={10}>
                              <Form.Item label="Supplier" name="supplier3">
                                <Select placeholder="Select Tertiary Supplier" allowClear>
                                  {suppliersList.map((s) => (
                                    <Option key={s.id} value={s.id}>
                                      {s.name} ({s.company})
                                    </Option>
                                  ))}
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col xs={24} sm={7}>
                              <Form.Item label="Supplier Price ($)" name="supplier3price">
                                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                              </Form.Item>
                            </Col>
                            <Col xs={24} sm={7}>
                              <Form.Item label="Supplier Part No." name="supplier3_part_no">
                                <Input placeholder="e.g. SUP-C303" />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Card>
                      </Col>
                    </Row>
                  </div>
                )
              },

              // TAB 6: PROMOTION
              {
                key: 'tab_promotion',
                label: (
                  <span style={{ fontWeight: 700, padding: '0 4px' }}>
                    <GiftOutlined style={{ marginRight: 6 }} />
                    Promotion
                  </span>
                ),
                children: (
                  <div style={{ paddingTop: 10 }}>
                    <Row gutter={[16, 16]}>
                      <Col span={24}>
                        <Form.Item label={<strong>Enable Promotion</strong>} name="promotion" valuePropName="checked">
                          <Switch />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={8}>
                        <Form.Item label={<strong>Promotional Price ($)</strong>} name="promo_price">
                          <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="Discounted price" />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={8}>
                        <Form.Item label="Start Date" name="start_date">
                          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={8}>
                        <Form.Item label="End Date" name="end_date">
                          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                )
              },

              // TAB 7: WAREHOUSE STOCK ALLOCATION
              {
                key: 'warehouse',
                label: (
                  <span style={{ fontWeight: 700, padding: '0 4px' }}>
                    <ShopOutlined style={{ marginRight: 6 }} />
                    Warehouse Stock
                  </span>
                ),
                children: (
                  <div style={{ paddingTop: 10 }}>
                    <Alert
                      type="info"
                      showIcon
                      message="Initial Stock Allocation"
                      description="Specify the opening stock balance physically present across warehouses upon creating this product."
                      style={{ marginBottom: 16 }}
                    />
                    <Table
                      dataSource={warehouseAllocations}
                      rowKey="warehouse_id"
                      pagination={false}
                      columns={[
                        {
                          title: 'Warehouse Name',
                          dataIndex: 'warehouse_name',
                          key: 'warehouse_name',
                          render: (w) => <strong>{w}</strong>
                        },
                        {
                          title: 'Initial Stock Quantity',
                          dataIndex: 'quantity',
                          key: 'quantity',
                          render: (q, r) => (
                            <InputNumber
                              min={0}
                              value={q}
                              onChange={(val) => handleWarehouseQtyChange(r.warehouse_id, val)}
                              style={{ width: 140 }}
                            />
                          )
                        }
                      ]}
                    />
                  </div>
                )
              }
            ]}
          />
        </Form>
      </Card>

      {/* 
        =========================================================================
        CARTESIAN COMBINATION GENERATOR MODAL
        =========================================================================
      */}
      <Modal
        title={
          <Space>
            <ThunderboltOutlined style={{ color: '#2563eb' }} />
            <span>Generate Variant Combinations</span>
          </Space>
        }
        open={isGeneratorOpen}
        onCancel={() => setIsGeneratorOpen(false)}
        onOk={handleGenerateCombinations}
        okText="Generate Matrix"
        width={650}
      >
        <Paragraph type="secondary">
          Select attribute options below. The generator will compute the Cartesian product (e.g. 2 Colors × 3 Sizes = 6 Variant Combinations).
        </Paragraph>
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          {attributesList.map((attr) => (
            <div key={attr.id} style={{ background: '#f8fafc', padding: 10, borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{attr.name}</div>
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder={`Select ${attr.name} values`}
                onChange={(vals) => {
                  setSelectedAttributes((prev) => {
                    const filtered = prev.filter((a) => a.name !== attr.name);
                    if (vals.length > 0) {
                      return [...filtered, { name: attr.name, values: vals }];
                    }
                    return filtered;
                  });
                }}
              >
                {(attr.values || []).map((v) => (
                  <Option key={v.id} value={v.value}>
                    {v.value}
                  </Option>
                ))}
              </Select>
            </div>
          ))}
        </Space>
      </Modal>
    </div>
  );
}
