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
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { formatCurrency } from '../../utils/uiTheme';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { useTranslation } from '../../contexts/LanguageContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function BpasAddProductPage({ onBack, editProduct = null }) {
  const adminTheme = useAdminTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [activeTab, setActiveTab] = useState('required');
  const [productType, setProductType] = useState(editProduct?.type || 'standard');
  const [categoriesList, setCategoriesList] = useState([]);
  const [unitsList, setUnitsList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [warehousesList, setWarehousesList] = useState([]);
  const [attributesList, setAttributesList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cover image preview
  const [coverImageUrl, setCoverImageUrl] = useState(editProduct?.image || '');

  // Variants state
  const [variantRows, setVariantRows] = useState([]);
  const [newVariantName, setNewVariantName] = useState('');

  // Variant generator state & modal
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState([]); // [{ name: "Color", values: ["Red", "Blue"] }]

  // Multi-Unit pricing & packaging state (AURA_v1 cost_price_by_units)
  const [multiUnitRows, setMultiUnitRows] = useState([]);
  const selectedUnit = Form.useWatch('unit', form);
  const watchCode = Form.useWatch('code', form);
  const watchPrice = Form.useWatch('price', form);
  const watchCost = Form.useWatch('cost', form);

  // Load Metadata & Attributes
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [whRes, catRes, unitsRes, brandsRes, attrRes] = await Promise.allSettled([
          axios.get('/api/warehouses'),
          axios.get('/api/categories'),
          axios.get('/api/units'),
          axios.get('/api/brands'),
          axios.get('/api/admin/attributes'),
        ]);

        if (whRes.status === 'fulfilled' && Array.isArray(whRes.value.data?.data)) {
          setWarehousesList(whRes.value.data.data);
        }
        if (catRes.status === 'fulfilled') {
          const raw = catRes.value.data?.data || catRes.value.data;
          if (Array.isArray(raw)) setCategoriesList(raw);
        }
        if (unitsRes.status === 'fulfilled' && Array.isArray(unitsRes.value.data?.data)) {
          setUnitsList(unitsRes.value.data.data);
        }
        if (brandsRes.status === 'fulfilled') {
          const raw = brandsRes.value.data?.data || brandsRes.value.data;
          if (Array.isArray(raw)) setBrandsList(raw);
        }
        if (attrRes.status === 'fulfilled' && Array.isArray(attrRes.value.data?.data)) {
          setAttributesList(attrRes.value.data.data);
        }
      } catch (err) {
        console.warn('Metadata note in Add Product:', err.message);
      }
    };
    loadMeta();
  }, []);

  // Sync multi-unit rows when selectedUnit or unitsList changes
  useEffect(() => {
    if (!selectedUnit || !unitsList.length) return;
    const baseU = unitsList.find(u => u.id === selectedUnit || u.code === selectedUnit || u.name === selectedUnit);
    if (!baseU) return;
    const baseId = baseU.id;
    const related = unitsList.filter(u => u.id === baseId || u.base_unit === baseId);

    setMultiUnitRows(prev => {
      return related.map(u => {
        const existing = prev.find(p => p.unit_id === u.id || p.id === u.id);
        const isBase = u.id === baseId;
        return {
          unit_id: u.id,
          unit_code: u.code,
          unit_name: u.name,
          base_unit: u.base_unit,
          operator: u.operator || '*',
          operation_value: u.operation_value || '1',
          unit_qty: isBase ? 1 : (parseFloat(u.operation_value) || 1),
          cost: existing?.cost ?? (isBase ? form.getFieldValue('cost') || 1.5 : 0),
          price: existing?.price ?? (isBase ? form.getFieldValue('price') || 3.0 : 0),
          product_code: existing?.product_code || existing?.unit_barcode || ''
        };
      });
    });
  }, [selectedUnit, unitsList]);

  // Load existing product details and variants when editing product
  useEffect(() => {
    if (editProduct?.id) {
      axios.get(`/api/admin/products/${editProduct.id}`)
        .then(res => {
          if (res.data?.success && res.data?.data) {
            const p = res.data.data;
            form.setFieldsValue({
              type: p.type || 'standard',
              code: p.code,
              name: p.name,
              category_id: p.category_id,
              unit: p.unit || 1,
              currency: p.currency || 'USD',
              price: parseFloat(p.price) || 0,
              cost: parseFloat(p.cost) || 0,
              alert_quantity: parseFloat(p.alert_quantity) || 10,
              tax_rate: p.tax_rate ? String(p.tax_rate) : '0',
              tax_method: p.tax_method || 'exclusive',
              rack: p.rack || 'A-01',
              details: p.details || p.product_details || '',
              inStock: p.quantity > 0,
              featured: Boolean(p.featured),
              brand: p.brand || '',
              biller_id: p.biller_id || 1,
            });
            setCoverImageUrl(p.image || '');

            if (Array.isArray(p.variants) && p.variants.length > 0) {
              setVariantRows(p.variants.map((v, idx) => ({
                id: v.id || `var_${idx}`,
                name: v.name,
                sku: v.sku || `${p.code}-${v.name.replace(/[^a-zA-Z0-9]+/g, '-')}`,
                barcode: v.barcode || v.sku || '',
                cost: parseFloat(v.cost) || parseFloat(p.cost) || 0,
                price: parseFloat(v.price) || parseFloat(p.price) || 0,
                quantity: parseFloat(v.quantity) || 0,
                warehouse_id: v.warehouse_id || 1,
                status: v.status !== 0 ? 1 : 0,
                attributes: v.attributes || null
              })));
            }
          }
        })
        .catch(err => console.warn('Edit product fetch error:', err.message));
    } else {
      const generatedCode = `PRD-${Date.now().toString().slice(-6)}`;
      form.setFieldsValue({
        type: 'standard',
        code: generatedCode,
        name: '',
        category_id: 1,
        unit: 1,
        currency: 'USD',
        price: 25.0,
        cost: 10.0,
        alert_quantity: 10,
        tax_rate: '0',
        tax_method: 'exclusive',
        rack: 'A-01',
        inStock: true,
        featured: false,
        biller_id: 1,
      });
    }
  }, [editProduct]);

  // Code generator
  const handleRandomCode = () => {
    const code = `PRD-${Date.now().toString().slice(-6)}`;
    form.setFieldsValue({ code });
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

    // Check duplicate combination
    if (variantRows.some(r => r.name.toLowerCase() === vName.toLowerCase())) {
      message.error(`Variant combination '${vName}' already exists in this product.`);
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
      },
    ]);
    setNewVariantName('');
  };

  // Generate Cartesian Combinations
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
        baseCost: parseFloat(currentCost) || 0,
      });

      if (res.data?.success && Array.isArray(res.data.data)) {
        const generated = res.data.data.map(g => ({
          ...g,
          warehouse_id: warehousesList[0]?.id || 1,
        }));

        setVariantRows(generated);
        setIsGeneratorOpen(false);
        message.success(`Successfully generated ${generated.length} variant combinations!`);
      }
    } catch (err) {
      message.error('Failed to generate variant combinations: ' + (err.response?.data?.message || err.message));
    }
  };

  // Handle Submit Form with full variant and warehouse persistence
  const handleSubmitProduct = async () => {
    try {
      const values = await form.validateFields();

      // Check variant duplicate SKUs and combinations before submit
      if (variantRows.length > 0) {
        const seenNames = new Set();
        const seenSkus = new Set();
        for (const v of variantRows) {
          const vName = (v.name || '').trim().toLowerCase();
          if (!vName) {
            message.error('Every variant must have a valid name.');
            return;
          }
          if (seenNames.has(vName)) {
            message.error(`Duplicate variant combination '${v.name}' detected.`);
            return;
          }
          seenNames.add(vName);

          const vSku = (v.sku || '').trim().toLowerCase();
          if (vSku) {
            if (seenSkus.has(vSku)) {
              message.error(`Duplicate SKU '${v.sku}' detected among variants.`);
              return;
            }
            seenSkus.add(vSku);
          }
        }
      }

      setIsSubmitting(true);

      const payload = {
        ...values,
        image: coverImageUrl,
        category_id: values.category_id || 1,
        price: parseFloat(values.price) || 0,
        cost: parseFloat(values.cost) || 0,
        alert_quantity: parseFloat(values.alert_quantity) || 10,
        variants: variantRows.map(v => ({
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
        unitPrices: multiUnitRows
      };

      if (editProduct?.id) {
        const res = await axios.put(`/api/admin/products/${editProduct.id}`, payload);
        if (res.data?.success || res.data?.status) {
          message.success(`Product "${values.name}" updated successfully!`);
        }
      } else {
        const res = await axios.post('/api/admin/products', payload);
        if (res.data?.success || res.data?.status) {
          message.success(`Product "${values.name}" added to inventory catalog!`);
        }
      }

      // Return to product list
      if (onBack) {
        onBack();
      } else {
        navigate('/admins/products');
      }
    } catch (err) {
      console.error('Submit product error:', err);
      message.error(err.response?.data?.message || err.message || 'Please check all required fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Header Navigation */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 20px',
          background: adminTheme.card,
          border: `1px solid ${adminTheme.border}`,
          borderRadius: 12,
          borderLeft: '4px solid #3b82f6',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              if (onBack) onBack();
              else navigate('/admins/products');
            }}
            style={{ fontWeight: 700 }}
          >
            {t('back_to_products', 'Back to Products')}
          </Button>
          <h2 style={{ color: '#2563eb', fontSize: 18, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <PlusOutlined style={{ fontSize: 16 }} />
            {editProduct ? `${t('edit_product', 'Edit Product')}: ${editProduct.name}` : t('add_product', 'Add Product')}
          </h2>
        </div>

        <Space size={10}>
          <Button onClick={() => form.resetFields()}>
            {t('reset_form', 'Reset Form')}
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            loading={isSubmitting}
            onClick={handleSubmitProduct}
            style={{
              fontWeight: 800,
              background: '#2563eb',
              borderColor: '#1d4ed8',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
            }}
          >
            {editProduct ? t('save_changes', 'Save Changes') : t('save_product', 'Save Product')}
          </Button>
        </Space>
      </div>

      {/* 2. Main Box Container */}
      <Card
        style={{
          borderRadius: 12,
          border: `1px solid ${adminTheme.border}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}
        styles={{ body: { padding: '24px' } }}
      >
        <Form form={form} layout="vertical">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            type="card"
            style={{ marginBottom: 20 }}
            items={[
              // TAB 1: REQUIRED
              {
                key: 'required',
                label: <span style={{ fontWeight: 700, padding: '0 4px' }}>{t('required_fields', 'Required *')}</span>,
                children: (
                  <div style={{ paddingTop: 12 }}>
                    <Row gutter={24}>
                      <Col xs={24} md={15}>
                        <Row gutter={16}>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              name="type"
                              label={<span style={{ fontWeight: 700 }}>{t('product_type', 'Product Type')}</span>}
                              rules={[{ required: true }]}
                            >
                              <Select onChange={(val) => setProductType(val)} style={{ width: '100%' }}>
                                <Option value="standard">Standard Product (Single or Variants)</Option>
                                <Option value="combo">Combo Item</Option>
                                <Option value="digital">Digital Product</Option>
                                <Option value="service">Service Item</Option>
                              </Select>
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12}>
                            <Form.Item
                              name="code"
                              label={<span style={{ fontWeight: 700 }}>{t('sku_barcode_code', 'Parent SKU / Code')}</span>}
                              rules={[{ required: true, message: 'Please enter a unique SKU/code' }]}
                              extra={
                                <a onClick={handleRandomCode} style={{ fontSize: 11.5, color: '#2563eb' }}>
                                  <BarcodeOutlined /> {t('auto_generate_code', 'Generate Unique Code')}
                                </a>
                              }
                            >
                              <Input placeholder="e.g. TSHIRT-001" />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Form.Item
                          name="name"
                          label={<span style={{ fontWeight: 700 }}>{t('product_name', 'Product Name')}</span>}
                          rules={[{ required: true, message: 'Please enter product title' }]}
                        >
                          <Input placeholder="e.g. Aura Premium Cotton T-Shirt" size="large" />
                        </Form.Item>

                        <Row gutter={16}>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              name="category_id"
                              label={<span style={{ fontWeight: 700 }}>{t('category', 'Category')}</span>}
                              rules={[{ required: true }]}
                            >
                              <Select placeholder="Select category" showSearch optionFilterProp="children">
                                {categoriesList.map((cat) => (
                                  <Option key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12}>
                            <Form.Item
                              name="unit"
                              label={<span style={{ fontWeight: 700 }}>{t('base_unit', 'Base Unit')}</span>}
                              rules={[{ required: true }]}
                            >
                              <Select placeholder="Select base unit">
                                {unitsList.map((u) => (
                                  <Option key={u.id} value={u.id}>
                                    {u.name} ({u.code})
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row gutter={16}>
                          <Col xs={24} sm={8}>
                            <Form.Item name="currency" label={<span style={{ fontWeight: 700 }}>Currency</span>}>
                              <Select defaultValue="USD">
                                <Option value="USD">USD ($)</Option>
                                <Option value="KHR">KHR (៛)</Option>
                              </Select>
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={8}>
                            <Form.Item
                              name="cost"
                              label={<span style={{ fontWeight: 700 }}>Cost Price ($)</span>}
                              rules={[{ required: true }]}
                            >
                              <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={8}>
                            <Form.Item
                              name="price"
                              label={<span style={{ fontWeight: 700 }}>Selling Price ($)</span>}
                              rules={[{ required: true }]}
                            >
                              <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row gutter={16}>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              name="alert_quantity"
                              label={<span style={{ fontWeight: 700 }}>Low Stock Alert Threshold</span>}
                            >
                              <InputNumber min={0} defaultValue={10} style={{ width: '100%' }} />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12}>
                            <Form.Item name="rack" label={<span style={{ fontWeight: 700 }}>Rack / Shelf Location</span>}>
                              <Input placeholder="e.g. RACK-A-01" />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Form.Item
                          name="inStock"
                          label={<span style={{ fontWeight: 700 }}>Status Availability</span>}
                          valuePropName="checked"
                        >
                          <Switch checkedChildren="Active" unCheckedChildren="Inactive" defaultChecked />
                        </Form.Item>
                      </Col>

                      {/* Right Column: Image */}
                      <Col xs={24} md={9}>
                        <div
                          style={{
                            padding: 16,
                            borderRadius: 12,
                            background: adminTheme.cardMuted,
                            border: `1px dashed ${adminTheme.border}`,
                          }}
                        >
                          <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>
                            Product Cover Image
                          </label>

                          <div
                            style={{
                              width: '100%',
                              height: 180,
                              borderRadius: 10,
                              overflow: 'hidden',
                              background: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: 12,
                              border: `1px solid ${adminTheme.border}`,
                            }}
                          >
                            {coverImageUrl ? (
                              <img
                                src={coverImageUrl}
                                alt="Product Cover"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.src = '/placeholder.png';
                                }}
                              />
                            ) : (
                              <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                                <InboxOutlined style={{ fontSize: 36, display: 'block', marginBottom: 6 }} />
                                <span style={{ fontSize: 12 }}>No image provided</span>
                              </div>
                            )}
                          </div>

                          <Form.Item label={<span style={{ fontSize: 12, fontWeight: 600 }}>Image URL or Path</span>}>
                            <Input
                              placeholder="https://example.com/item.png or /assets/uploads/image.png"
                              value={coverImageUrl}
                              onChange={(e) => setCoverImageUrl(e.target.value)}
                            />
                          </Form.Item>
                        </div>
                      </Col>
                    </Row>
                  </div>
                ),
              },

              // TAB 2: PRODUCT VARIANTS (Cartesian Generator & Variant Manager)
              {
                key: 'variants',
                label: (
                  <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ApartmentOutlined />
                    {t('product_variants', 'Product Variants')}
                    {variantRows.length > 0 && <Tag color="blue">{variantRows.length}</Tag>}
                  </span>
                ),
                children: (
                  <div style={{ paddingTop: 12 }}>
                    <div
                      style={{
                        padding: '14px 18px',
                        background: '#f8fafc',
                        borderRadius: 10,
                        border: '1px solid #e2e8f0',
                        marginBottom: 18,
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>
                          Multi-Variant Management & Attribute Matrix
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          Define multiple variations (Color, Size, Material, etc.) with unique SKUs, barcodes, prices, and stock.
                        </div>
                      </div>

                      <Space size={10} wrap>
                        <Button
                          type="primary"
                          icon={<ThunderboltOutlined />}
                          onClick={() => setIsGeneratorOpen(true)}
                          style={{ fontWeight: 700, background: '#2563eb' }}
                        >
                          Generate Variant Combinations
                        </Button>
                      </Space>
                    </div>

                    {/* Manual Variant Add Bar */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                      <Input
                        placeholder="Manual variant name (e.g. Red / Size 42)"
                        value={newVariantName}
                        onChange={(e) => setNewVariantName(e.target.value)}
                        style={{ width: 280 }}
                        onPressEnter={handleAddManualVariant}
                      />
                      <Button icon={<PlusOutlined />} onClick={handleAddManualVariant} style={{ fontWeight: 600 }}>
                        Add Single Variant
                      </Button>
                    </div>

                    {/* Variants Table */}
                    <Table
                      rowKey="id"
                      dataSource={variantRows}
                      pagination={false}
                      scroll={{ x: 900 }}
                      columns={[
                        {
                          title: 'Variant Combination',
                          dataIndex: 'name',
                          key: 'name',
                          render: (name, record, idx) => (
                            <div>
                              <Input
                                value={name}
                                onChange={(e) => {
                                  const updated = [...variantRows];
                                  updated[idx].name = e.target.value;
                                  setVariantRows(updated);
                                }}
                                style={{ fontWeight: 700 }}
                              />
                              {record.attributes && (
                                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                                  {Object.entries(record.attributes).map(([k, v]) => (
                                    <Tag key={k} color="blue" style={{ fontSize: 10 }}>
                                      {k}: {v}
                                    </Tag>
                                  ))}
                                </div>
                              )}
                            </div>
                          ),
                        },
                        {
                          title: 'Unique SKU',
                          dataIndex: 'sku',
                          key: 'sku',
                          width: 170,
                          render: (sku, record, idx) => (
                            <Input
                              value={sku}
                              placeholder="Unique SKU"
                              onChange={(e) => {
                                const updated = [...variantRows];
                                updated[idx].sku = e.target.value;
                                setVariantRows(updated);
                              }}
                            />
                          ),
                        },
                        {
                          title: 'Barcode',
                          dataIndex: 'barcode',
                          key: 'barcode',
                          width: 150,
                          render: (bc, record, idx) => (
                            <Input
                              value={bc}
                              placeholder="Barcode"
                              onChange={(e) => {
                                const updated = [...variantRows];
                                updated[idx].barcode = e.target.value;
                                setVariantRows(updated);
                              }}
                            />
                          ),
                        },
                        {
                          title: 'Cost ($)',
                          dataIndex: 'cost',
                          key: 'cost',
                          width: 110,
                          render: (cost, record, idx) => (
                            <InputNumber
                              min={0}
                              step={0.5}
                              value={cost}
                              onChange={(val) => {
                                const updated = [...variantRows];
                                updated[idx].cost = val;
                                setVariantRows(updated);
                              }}
                            />
                          ),
                        },
                        {
                          title: 'Selling Price ($)',
                          dataIndex: 'price',
                          key: 'price',
                          width: 120,
                          render: (price, record, idx) => (
                            <InputNumber
                              min={0}
                              step={0.5}
                              value={price}
                              onChange={(val) => {
                                const updated = [...variantRows];
                                updated[idx].price = val;
                                setVariantRows(updated);
                              }}
                            />
                          ),
                        },
                        {
                          title: 'Initial Stock',
                          dataIndex: 'quantity',
                          key: 'quantity',
                          width: 110,
                          render: (qty, record, idx) => (
                            <InputNumber
                              min={0}
                              value={qty}
                              onChange={(val) => {
                                const updated = [...variantRows];
                                updated[idx].quantity = val;
                                setVariantRows(updated);
                              }}
                            />
                          ),
                        },
                        {
                          title: 'Warehouse',
                          dataIndex: 'warehouse_id',
                          key: 'warehouse_id',
                          width: 160,
                          render: (whId, record, idx) => (
                            <Select
                              value={whId || warehousesList[0]?.id || 1}
                              onChange={(val) => {
                                const updated = [...variantRows];
                                updated[idx].warehouse_id = val;
                                setVariantRows(updated);
                              }}
                              style={{ width: '100%' }}
                            >
                              {warehousesList.map((wh) => (
                                <Option key={wh.id} value={wh.id}>
                                  {wh.name}
                                </Option>
                              ))}
                            </Select>
                          ),
                        },
                        {
                          title: 'Active',
                          dataIndex: 'status',
                          key: 'status',
                          width: 80,
                          render: (status, record, idx) => (
                            <Switch
                              size="small"
                              checked={status !== 0}
                              onChange={(checked) => {
                                const updated = [...variantRows];
                                updated[idx].status = checked ? 1 : 0;
                                setVariantRows(updated);
                              }}
                            />
                          ),
                        },
                        {
                          title: 'Action',
                          key: 'action',
                          width: 60,
                          align: 'center',
                          render: (_, __, idx) => (
                            <Button
                              danger
                              size="small"
                              type="text"
                              icon={<DeleteOutlined />}
                              onClick={() => setVariantRows((prev) => prev.filter((_, i) => i !== idx))}
                            />
                          ),
                        },
                      ]}
                    />

                    {variantRows.length > 0 && (
                      <div style={{ marginTop: 14, textAlign: 'right', fontWeight: 700, color: '#334155' }}>
                        Total Variant Stock Units: <Tag color="green" style={{ fontSize: 13, fontWeight: 800 }}>
                          {variantRows.reduce((acc, v) => acc + (parseFloat(v.quantity) || 0), 0)}
                        </Tag>
                      </div>
                    )}
                  </div>
                ),
              },

              // TAB 3: DETAILS & DESCRIPTIONS
              {
                key: 'details',
                label: <span style={{ fontWeight: 700 }}>{t('details_spec', 'Details & Specs')}</span>,
                children: (
                  <div style={{ paddingTop: 12 }}>
                    <Form.Item name="details" label="Short Description">
                      <Input.TextArea rows={3} placeholder="Brief summary for catalog previews..." />
                    </Form.Item>
                    <Form.Item name="product_details" label="Detailed Specifications & Attributes">
                      <Input.TextArea rows={6} placeholder="Full product specifications, care instructions, warranty details..." />
                    </Form.Item>
                  </div>
                ),
              },
            ]}
          />
        </Form>
      </Card>

      {/* 3. Cartesian Variant Generator Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800 }}>
            <ThunderboltOutlined style={{ color: '#2563eb' }} />
            <span>Generate Variant Combinations</span>
          </div>
        }
        open={isGeneratorOpen}
        onCancel={() => setIsGeneratorOpen(false)}
        width={680}
        footer={[
          <Button key="cancel" onClick={() => setIsGeneratorOpen(false)}>
            Cancel
          </Button>,
          <Button
            key="generate"
            type="primary"
            icon={<CheckOutlined />}
            onClick={handleGenerateCombinations}
            style={{ fontWeight: 700, background: '#2563eb' }}
          >
            Generate Combinations
          </Button>,
        ]}
      >
        <Alert
          type="info"
          showIcon
          message="Cartesian Attribute Combination Generator"
          description="Select attributes (e.g. Color, Size, Material) and choose which values apply to this product. The system will automatically build the matrix with derived SKUs and attribute combinations."
          style={{ marginBottom: 18 }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {attributesList.map((attr) => {
            const currentSel = selectedAttributes.find((s) => s.name === attr.name);
            const currentVals = currentSel ? currentSel.values : [];

            return (
              <div
                key={attr.id}
                style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  background: currentVals.length > 0 ? '#f0f9ff' : '#ffffff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>{attr.name}</span>
                  {currentVals.length > 0 && (
                    <Tag color="blue">{currentVals.length} selected</Tag>
                  )}
                </div>

                <Select
                  mode="multiple"
                  placeholder={`Select ${attr.name} options...`}
                  style={{ width: '100%' }}
                  value={currentVals}
                  onChange={(vals) => {
                    setSelectedAttributes((prev) => {
                      const next = prev.filter((p) => p.name !== attr.name);
                      if (vals.length > 0) {
                        next.push({ name: attr.name, values: vals });
                      }
                      return next;
                    });
                  }}
                >
                  {(attr.values || []).map((val) => (
                    <Option key={val.id} value={val.value}>
                      {val.color_code ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: val.color_code,
                              border: '1px solid #cbd5e1',
                            }}
                          />
                          {val.value}
                        </span>
                      ) : (
                        val.value
                      )}
                    </Option>
                  ))}
                </Select>
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
