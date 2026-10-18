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
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { formatCurrency } from '../../utils/uiTheme';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { useTranslation } from '../../contexts/LanguageContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const LIVE_PRODUCTS_KEY = 'aura_admin_live_products_v2';
const getLiveProducts = () => {
  try {
    const raw = localStorage.getItem(LIVE_PRODUCTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.products)) return parsed.products;
    return [];
  } catch {
    return [];
  }
};
const saveLiveProducts = (prods) => {
  try {
    const list = Array.isArray(prods) ? prods : Array.isArray(prods?.products) ? prods.products : [];
    localStorage.setItem(LIVE_PRODUCTS_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('aura_live_products_updated', { detail: list }));
  } catch (_) {}
};

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cover image preview
  const [coverImageUrl, setCoverImageUrl] = useState(editProduct?.image || '');

  // Variants state
  const [variantRows, setVariantRows] = useState([
    { id: 1, name: 'Standard (Default)', warehouse_id: 1, priceAddition: 0, quantity: 50, barcode: '88581001' },
    { id: 2, name: 'Large Pack', warehouse_id: 1, priceAddition: 2.5, quantity: 30, barcode: '88581002' },
  ]);
  const [newVariantName, setNewVariantName] = useState('');

  // Add-on state
  const [addOnRows, setAddOnRows] = useState([
    { id: 1, name: 'Extra Shot Espresso', price: 0.75, description: 'Single rich espresso shot' },
    { id: 2, name: 'Oat Milk Substitution', price: 0.50, description: 'Dairy-free organic oat milk' },
  ]);

  // Multi-Unit pricing & packaging state (AURA_v1 cost_price_by_units)
  const [multiUnitRows, setMultiUnitRows] = useState([]);
  const selectedUnit = Form.useWatch('unit', form);

  // Load Metadata
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [whRes, catRes, unitsRes, brandsRes] = await Promise.allSettled([
          axios.get('/api/warehouses'),
          axios.get('/api/categories'),
          axios.get('/api/units'),
          axios.get('/api/brands'),
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

  // Load existing multi-unit pricing when editing product
  useEffect(() => {
    if (editProduct?.id) {
      axios.get(`/api/admin/products/${editProduct.id}/units`)
        .then(res => {
          if (res.data?.status && Array.isArray(res.data.data?.units) && res.data.data.units.length > 0) {
            setMultiUnitRows(res.data.data.units.map(u => ({
              unit_id: u.id,
              unit_code: u.code,
              unit_name: u.name,
              base_unit: u.base_unit,
              operator: u.operator,
              operation_value: u.operation_value,
              unit_qty: u.unit_qty,
              cost: u.unit_cost !== null ? u.unit_cost : (editProduct.cost || 0),
              price: u.unit_price !== null ? u.unit_price : (editProduct.price || 0),
              product_code: u.unit_barcode || ''
            })));
          }
        })
        .catch(err => console.warn('Product units fetch notice:', err.message));
    }
  }, [editProduct?.id]);

  // Initialize Form
  useEffect(() => {
    if (editProduct) {
      form.setFieldsValue({
        type: editProduct.type || 'standard',
        code: editProduct.code,
        name: editProduct.name,
        category: editProduct.category,
        unit: editProduct.unit || 'Pcs',
        default_sale_unit: editProduct.unit || 'Pcs',
        default_purchase_unit: editProduct.unit || 'Pcs',
        currency: 'USD',
        price: editProduct.price || 3.0,
        cost: editProduct.cost || 1.5,
        alert_quantity: editProduct.alertQuantity || 10,
        tax_rate: '0',
        tax_method: 'inclusive',
        rack: editProduct.rack || 'A-01',
        details: editProduct.description || editProduct.details || '',
        inStock: editProduct.inStock !== false,
        featured: editProduct.featured || false,
        hide_pos: false,
        hide_shop: false,
      });
      setCoverImageUrl(editProduct.image || '');
    } else {
      const generatedCode = `8858${Math.floor(1000 + Math.random() * 9000)}`;
      form.setFieldsValue({
        type: 'standard',
        code: generatedCode,
        name: '',
        category: 'Coffee & Beverages',
        unit: 'Pcs',
        default_sale_unit: 'Pcs',
        default_purchase_unit: 'Box',
        currency: 'USD',
        price: 3.5,
        cost: 1.8,
        alert_quantity: 10,
        tax_rate: '0',
        tax_method: 'inclusive',
        rack: 'A-01',
        inStock: true,
        featured: false,
        hide_pos: false,
        hide_shop: false,
      });
    }
  }, [editProduct]);

  // Code generator
  const handleRandomCode = () => {
    const code = `8858${Math.floor(1000 + Math.random() * 9000)}`;
    form.setFieldsValue({ code });
    message.success(`Generated Barcode Code: ${code}`);
  };

  // Add Variant Row
  const handleAddVariant = () => {
    if (!newVariantName.trim()) {
      message.warning('Please enter a variant name.');
      return;
    }
    const newId = Date.now();
    setVariantRows((prev) => [
      ...prev,
      {
        id: newId,
        name: newVariantName.trim(),
        warehouse_id: 1,
        priceAddition: 0,
        quantity: 20,
        barcode: `8858${Math.floor(1000 + Math.random() * 9000)}`,
      },
    ]);
    setNewVariantName('');
  };

  // Handle Submit Form
  const handleSubmitProduct = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);

      const liveProducts = getLiveProducts();
      let updated;
      if (editProduct) {
        updated = liveProducts.map((p) =>
          p.id === editProduct.id
            ? {
                ...p,
                name: values.name,
                code: values.code,
                type: values.type,
                category: values.category,
                unit: values.unit,
                cost: Number(values.cost) || p.cost,
                price: Number(values.price) || p.price,
                alertQuantity: Number(values.alert_quantity) || 10,
                rack: values.rack,
                inStock: values.inStock,
                image: coverImageUrl || p.image,
                details: values.details,
              }
            : p
        );
        message.success(`Product "${values.name}" updated successfully!`);
      } else {
        const newProduct = {
          id: Date.now(),
          name: values.name,
          code: values.code,
          type: values.type || 'standard',
          category: values.category || 'General',
          unit: values.unit || 'Pcs',
          cost: Number(values.cost) || 1.8,
          price: Number(values.price) || 3.5,
          stockCount: 50,
          alertQuantity: Number(values.alert_quantity) || 10,
          rack: values.rack || 'A-01',
          inStock: values.inStock !== false,
          image: coverImageUrl || '/assets/uploads/no_image.png',
          details: values.details || '',
        };
        updated = [newProduct, ...liveProducts];
        message.success(`Product "${values.name}" added to catalog!`);
      }

      saveLiveProducts(updated);

      // Attempt backend persistence
      try {
        const payload = {
          ...values,
          image: coverImageUrl,
          unitPrices: multiUnitRows
        };
        if (editProduct?.id) {
          await axios.put(`/api/admin/products/${editProduct.id}`, payload);
        } else {
          await axios.post('/api/admin/products', payload);
        }
      } catch (_) {}

      // Navigate back to product list
      if (onBack) {
        onBack();
      } else {
        navigate('/admins/products');
      }
    } catch (err) {
      message.error('Please verify all required fields in the form.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. BPAS Breadcrumb Header */}
      {/* 1. BPAS Breadcrumb Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          background: adminTheme.card,
          border: `1px solid ${adminTheme.border}`,
          borderRadius: 8,
          borderLeft: '4px solid #428bca',
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
          <h2 style={{ color: '#428bca', fontSize: 19, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
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
              background: '#428bca',
              borderColor: '#357ebd',
              boxShadow: '0 2px 8px rgba(66, 139, 202, 0.3)',
            }}
          >
            {editProduct ? t('save_changes', 'Save Changes') : t('add_product', 'Add Product')}
          </Button>
        </Space>
      </div>

      {/* 2. Main Box Container matching BPAS .box and .box-content */}
      <Card
        style={{
          borderRadius: 8,
          border: `1px solid ${adminTheme.border}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}
        styles={{ body: { padding: '24px' } }}
      >
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 18 }}>
          Please fill in the information below. The field labels marked with * are required input fields.
        </p>

        <Form form={form} layout="vertical">
          {/* BPAS Tabs: Required | Details | Accounting | Variants | Supplier | Promotion | Shop | Add On | Racks */}
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
                      {/* Left Column: Core Fields */}
                      <Col xs={24} md={15}>
                        <Row gutter={16}>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              name="type"
                              label={<span style={{ fontWeight: 700 }}>Product Type</span>}
                              rules={[{ required: true }]}
                            >
                              <Select
                                onChange={(val) => setProductType(val)}
                                style={{ width: '100%' }}
                              >
                                <Option value="standard">Standard Product</Option>
                                <Option value="combo">Combo / Meal Deal</Option>
                                <Option value="digital">Digital Product</Option>
                                <Option value="service">Service Item</Option>
                                <Option value="bom">Bill of Materials (BOM)</Option>
                              </Select>
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12}>
                            <Form.Item
                              name="code"
                              label={<span style={{ fontWeight: 700 }}>Barcode / Product Code</span>}
                              rules={[{ required: true, message: 'Please enter or generate a code' }]}
                            >
                              <Input
                                placeholder="Scan or generate barcode"
                                suffix={
                                  <Button
                                    size="small"
                                    type="text"
                                    icon={<ReloadOutlined style={{ color: '#2563eb' }} />}
                                    onClick={handleRandomCode}
                                    title="Generate Random Code"
                                  >
                                    Generate
                                  </Button>
                                }
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row gutter={16}>
                          <Col xs={24}>
                            <Form.Item
                              name="name"
                              label={<span style={{ fontWeight: 700 }}>Product Name</span>}
                              rules={[{ required: true, message: 'Please enter product name' }]}
                            >
                              <Input placeholder="e.g. Specialty Roasted Arabica Blend 250g" size="large" />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row gutter={16}>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              name="category"
                              label={<span style={{ fontWeight: 700 }}>Category</span>}
                              rules={[{ required: true }]}
                            >
                              <Select placeholder="Select category" showSearch>
                                {categoriesList.length > 0 ? (
                                  categoriesList.map((cat) => (
                                    <Option key={cat.id || cat.name} value={cat.name || cat.id}>
                                      {cat.name}
                                    </Option>
                                  ))
                                ) : (
                                  <>
                                    <Option value="Coffee & Beverages">Coffee & Beverages</Option>
                                    <Option value="Bakery & Pastries">Bakery & Pastries</Option>
                                    <Option value="Tea & Herbal">Tea & Herbal</Option>
                                    <Option value="Syrups & Ingredients">Syrups & Ingredients</Option>
                                    <Option value="Packaging & Cups">Packaging & Cups</Option>
                                  </>
                                )}
                              </Select>
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12}>
                            <Form.Item
                              name="unit"
                              label={<span style={{ fontWeight: 700 }}>Base Unit (Root Measurement)</span>}
                              rules={[{ required: true, message: 'Please select a base unit' }]}
                              tooltip="Primary unit in which warehouse stock ledger balances are stored."
                            >
                              <Select placeholder="Select base unit">
                                {unitsList.filter(u => !u.base_unit || u.base_unit === 0).map((u) => (
                                  <Option key={u.id} value={u.id}>
                                    {u.name} ({u.code})
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row gutter={16}>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              name="default_sale_unit"
                              label={<span style={{ fontWeight: 700 }}>Default Sale Unit</span>}
                              tooltip="Default unit selected when adding to sales invoices or POS register."
                            >
                              <Select placeholder="Select sale unit">
                                {unitsList.filter(u => {
                                  const baseId = typeof selectedUnit === 'number' ? selectedUnit : unitsList.find(x => x.code === selectedUnit || x.name === selectedUnit)?.id;
                                  return baseId ? (u.id === baseId || u.base_unit === baseId) : true;
                                }).map((u) => (
                                  <Option key={u.id} value={u.id}>
                                    {u.name} ({u.code}) {u.base_unit ? `[${u.operation_value}x]` : '[Base]'}
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12}>
                            <Form.Item
                              name="default_purchase_unit"
                              label={<span style={{ fontWeight: 700 }}>Default Purchase Unit</span>}
                              tooltip="Default unit selected when placing vendor purchase orders."
                            >
                              <Select placeholder="Select purchase unit">
                                {unitsList.filter(u => {
                                  const baseId = typeof selectedUnit === 'number' ? selectedUnit : unitsList.find(x => x.code === selectedUnit || x.name === selectedUnit)?.id;
                                  return baseId ? (u.id === baseId || u.base_unit === baseId) : true;
                                }).map((u) => (
                                  <Option key={u.id} value={u.id}>
                                    {u.name} ({u.code}) {u.base_unit ? `[${u.operation_value}x]` : '[Base]'}
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                        </Row>

                        {/* Multi-Unit Pricing & Packaging Table (AURA_v1 cost_price_by_units) */}
                        {multiUnitRows.length > 0 && (
                          <div style={{ marginBottom: 20, background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                              <span style={{ fontWeight: 700, fontSize: 13.5, color: '#1e293b' }}>
                                📦 Multi-Unit Pricing & Packaging Barcodes (AURA_v1)
                              </span>
                              <Tag color="blue">{multiUnitRows.length} Units Configured</Tag>
                            </div>
                            <Table
                              size="small"
                              pagination={false}
                              dataSource={multiUnitRows}
                              rowKey="unit_id"
                              scroll={{ x: 650 }}
                              columns={[
                                {
                                  title: 'Unit',
                                  dataIndex: 'unit_name',
                                  render: (name, r) => (
                                    <div>
                                      <strong>{name}</strong> <span style={{ color: '#64748b' }}>({r.unit_code})</span>
                                      {r.base_unit ? (
                                        <div style={{ fontSize: 11, color: '#0284c7' }}>
                                          1 {r.unit_code} = {r.operation_value} {r.operator} Base
                                        </div>
                                      ) : (
                                        <div style={{ fontSize: 11, color: '#16a34a' }}>Base Unit</div>
                                      )}
                                    </div>
                                  )
                                },
                                {
                                  title: 'Cost ($)',
                                  dataIndex: 'cost',
                                  width: 120,
                                  render: (val, r, idx) => (
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={val}
                                      onChange={(e) => {
                                        const next = [...multiUnitRows];
                                        next[idx].cost = parseFloat(e.target.value) || 0;
                                        setMultiUnitRows(next);
                                      }}
                                    />
                                  )
                                },
                                {
                                  title: 'Price ($)',
                                  dataIndex: 'price',
                                  width: 120,
                                  render: (val, r, idx) => (
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={val}
                                      onChange={(e) => {
                                        const next = [...multiUnitRows];
                                        next[idx].price = parseFloat(e.target.value) || 0;
                                        setMultiUnitRows(next);
                                      }}
                                    />
                                  )
                                },
                                {
                                  title: 'Packaging Barcode / SKU',
                                  dataIndex: 'product_code',
                                  render: (val, r, idx) => (
                                    <Input
                                      placeholder="Leave blank to use main code"
                                      value={val}
                                      onChange={(e) => {
                                        const next = [...multiUnitRows];
                                        next[idx].product_code = e.target.value;
                                        setMultiUnitRows(next);
                                      }}
                                    />
                                  )
                                }
                              ]}
                            />
                          </div>
                        )}

                        <Row gutter={16}>
                          <Col xs={24} sm={8}>
                            <Form.Item
                              name="currency"
                              label={<span style={{ fontWeight: 700 }}>Currency</span>}
                            >
                              <Select defaultValue="USD">
                                <Option value="USD">USD ($)</Option>
                                <Option value="KHR">KHR (៛)</Option>
                                <Option value="THB">THB (฿)</Option>
                              </Select>
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={8}>
                            <Form.Item
                              name="cost"
                              label={<span style={{ fontWeight: 700 }}>Product Cost ($)</span>}
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
                              label={<span style={{ fontWeight: 700 }}>Alert Quantity (Low Stock Threshold)</span>}
                            >
                              <InputNumber min={0} defaultValue={10} style={{ width: '100%' }} />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12}>
                            <Form.Item
                              name="rack"
                              label={<span style={{ fontWeight: 700 }}>Rack / Shelf Location</span>}
                            >
                              <Input placeholder="e.g. A-01, SHELF-B" />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Form.Item
                          name="inStock"
                          label={<span style={{ fontWeight: 700 }}>Live Store Availability</span>}
                          valuePropName="checked"
                        >
                          <Switch checkedChildren="Active (In Stock)" unCheckedChildren="Inactive (Out of Stock)" />
                        </Form.Item>
                      </Col>

                      {/* Right Column: Image Preview & Media */}
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
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = '/assets/uploads/no_image.png';
                                }}
                              />
                            ) : (
                              <div style={{ textAlign: 'center', color: adminTheme.subtext }}>
                                <InboxOutlined style={{ fontSize: 36, color: '#94a3b8' }} />
                                <div style={{ fontSize: 12, marginTop: 4 }}>No Image Selected</div>
                              </div>
                            )}
                          </div>

                          <Form.Item label="Image URL / Path">
                            <Input
                              placeholder="e.g. /assets/uploads/products/coffee.jpg"
                              value={coverImageUrl}
                              onChange={(e) => setCoverImageUrl(e.target.value)}
                            />
                          </Form.Item>

                          <Divider style={{ margin: '12px 0' }} />

                          <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>
                            Catalog Display Badges
                          </label>
                          <Space wrap>
                            <Tag color="volcano" style={{ cursor: 'pointer' }}>🔥 Hot Deal</Tag>
                            <Tag color="green" style={{ cursor: 'pointer' }}>⚡ Best Seller</Tag>
                            <Tag color="blue" style={{ cursor: 'pointer' }}>✨ New Arrival</Tag>
                            <Tag color="purple" style={{ cursor: 'pointer' }}>👑 VIP Choice</Tag>
                          </Space>
                        </div>
                      </Col>
                    </Row>
                  </div>
                ),
              },

              // TAB 2: DETAILS
              {
                key: 'details',
                label: <span style={{ fontWeight: 700, padding: '0 4px' }}>{t('details', 'Details')}</span>,
                children: (
                  <div style={{ paddingTop: 12 }}>
                    <Row gutter={16}>
                      <Col xs={24} sm={8}>
                        <Form.Item name="item_code" label="Item Code / Supplier Code">
                          <Input placeholder="e.g. VEN-904" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Form.Item name="serial" label="Serial Number">
                          <Input placeholder="e.g. SN-2026-X1" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Form.Item name="batch_number" label="Batch / Lot Number">
                          <Input placeholder="e.g. LOT-202610" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col xs={24} sm={8}>
                        <Form.Item name="second_name" label="Second Name (Khmer / Local Title)">
                          <Input placeholder="ឈ្មោះផលិតផលជាភាសាខ្មែរ" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Form.Item name="weight" label="Weight (Kg)">
                          <Input placeholder="e.g. 0.25" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Form.Item name="barcode_symbology" label="Barcode Symbology">
                          <Select defaultValue="code128">
                            <Option value="code128">Code128</Option>
                            <Option value="ean13">EAN-13</Option>
                            <Option value="ean8">EAN-8</Option>
                            <Option value="upca">UPC-A</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item name="details" label="Product Description & Brewing Guide">
                      <Input.TextArea rows={5} placeholder="Provide tasting notes, origins, brewing guide, and warranty information..." />
                    </Form.Item>
                  </div>
                ),
              },

              // TAB 3: ACCOUNTING
              {
                key: 'accounting',
                label: <span style={{ fontWeight: 700 }}>{t('accounting', 'Accounting')}</span>,
                children: (
                  <div style={{ paddingTop: 12 }}>
                    <Paragraph type="secondary">
                      Map this product to default double-entry general ledger accounts for automated billing and inventory journals.
                    </Paragraph>
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item label={t('sales_revenue_account', 'Sales / Revenue Account')}>
                          <Select defaultValue="411000">
                            <Option value="411000">411000 - Sales Revenue (Merchandise)</Option>
                            <Option value="412000">412000 - Service & Labor Income</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item label={t('cogs_account', 'Cost of Goods Sold (COGS) Account')}>
                          <Select defaultValue="511000">
                            <Option value="511000">511000 - Cost of Goods Sold (COGS)</Option>
                            <Option value="512000">512000 - Direct Material Usage</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item label={t('inventory_asset_account', 'Inventory Asset Account')}>
                          <Select defaultValue="113000">
                            <Option value="113000">113000 - Finished Goods Inventory</Option>
                            <Option value="113100">113100 - Raw Materials & Ingredients</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item label={t('inventory_adj_account', 'Inventory Adjustment Account')}>
                          <Select defaultValue="513000">
                            <Option value="513000">513000 - Inventory Adjustment Variance</Option>
                            <Option value="514000">514000 - Inventory Shrinkage & Loss</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ),
              },

              // TAB 4: VARIANTS
              {
                key: 'variants',
                label: <span style={{ fontWeight: 700 }}>{t('variants', 'Variants')}</span>,
                children: (
                  <div style={{ paddingTop: 12 }}>
                    <Paragraph type="secondary">
                      Create SKU variations (e.g. Size, Flavor, Bean Grind) with customized price adjustments and barcode tags.
                    </Paragraph>

                    <Space style={{ marginBottom: 16 }}>
                      <Input
                        placeholder="New option name (e.g. Whole Bean 500g)"
                        value={newVariantName}
                        onChange={(e) => setNewVariantName(e.target.value)}
                        style={{ width: 300 }}
                      />
                      <Button type="primary" icon={<PlusOutlined />} onClick={handleAddVariant}>
                        {t('add_variant_row', 'Add Variant Row')}
                      </Button>
                    </Space>

                    <Table
                      rowKey="id"
                      dataSource={variantRows}
                      scroll={{ x: 600 }}
                      columns={[
                        { title: t('variant_name', 'Variant Name'), dataIndex: 'name', key: 'name', render: (t) => <strong>{t}</strong> },
                        { title: t('barcode', 'Barcode'), dataIndex: 'barcode', key: 'barcode', render: (b) => <Tag color="blue">{b}</Tag> },
                        {
                          title: t('price_addition', 'Price Addition ($)'),
                          dataIndex: 'priceAddition',
                          key: 'priceAddition',
                          render: (p) => <span style={{ color: '#16a34a', fontWeight: 700 }}>+{formatCurrency(p)}</span>,
                        },
                        { title: t('default_qty', 'Default Qty'), dataIndex: 'quantity', key: 'quantity', align: 'right' },
                        {
                          title: t('action', 'Action'),
                          key: 'action',
                          width: 80,
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
                      pagination={false}
                    />
                  </div>
                ),
              },

              // TAB 5: SUPPLIER
              {
                key: 'supplier',
                label: <span style={{ fontWeight: 700 }}>{t('supplier', 'Supplier')}</span>,
                children: (
                  <div style={{ paddingTop: 12 }}>
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item label={t('primary_supplier', 'Primary Supplier')}>
                          <Select defaultValue="1">
                            <Option value="1">Angkor Harvest Coffee Farm (Kampot)</Option>
                            <Option value="2">Mondulkiri Organic Co-op</Option>
                            <Option value="3">Golden Packaging Supplies Co.</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={6}>
                        <Form.Item label={t('supplier_part_no', 'Supplier Part / Item No')}>
                          <Input placeholder="e.g. SUP-COF-01" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={6}>
                        <Form.Item label={t('supplier_purchase_price', 'Supplier Purchase Price ($)')}>
                          <InputNumber min={0} defaultValue={1.8} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ),
              },

              // TAB 6: PROMOTION
              {
                key: 'promotion',
                label: <span style={{ fontWeight: 700 }}>{t('promotion', 'Promotion')}</span>,
                children: (
                  <div style={{ paddingTop: 12 }}>
                    <Paragraph type="secondary">
                      Schedule special temporary promotional prices with start and end dates.
                    </Paragraph>
                    <Row gutter={16} align="middle">
                      <Col xs={24} sm={8}>
                        <Form.Item label={t('promotional_price', 'Promotional Discount Price ($)')}>
                          <InputNumber min={0} placeholder="e.g. 2.99" style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Form.Item label={t('promotion_start_date', 'Promotion Start Date')}>
                          <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Form.Item label={t('promotion_end_date', 'Promotion End Date')}>
                          <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ),
              },

              // TAB 7: SHOP / WEB
              {
                key: 'shop',
                label: <span style={{ fontWeight: 700 }}>{t('shop', 'Shop')}</span>,
                children: (
                  <div style={{ paddingTop: 12 }}>
                    <Row gutter={24}>
                      <Col xs={24} sm={8}>
                        <Form.Item name="featured" label={t('featured_home', 'Featured on Public Home Page')} valuePropName="checked">
                          <Switch checkedChildren={t('featured', 'Featured')} unCheckedChildren={t('standard', 'Standard')} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Form.Item name="hide_pos" label={t('hide_pos', 'Hide from Cashier POS Terminal')} valuePropName="checked">
                          <Switch checkedChildren={t('hidden_in_pos', 'Hidden in POS')} unCheckedChildren={t('visible_in_pos', 'Visible in POS')} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Form.Item name="hide_shop" label={t('hide_shop', 'Hide from E-Menu & Public Web')} valuePropName="checked">
                          <Switch checkedChildren={t('hidden_online', 'Hidden Online')} unCheckedChildren={t('visible_online', 'Visible Online')} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ),
              },

              // TAB 8: ADD ON
              {
                key: 'add_on',
                label: <span style={{ fontWeight: 700 }}>{t('add_on', 'Add On')}</span>,
                children: (
                  <div style={{ paddingTop: 12 }}>
                    <Paragraph type="secondary">
                      Available toppings, milk substitutions, extra shots, or condiment add-ons for counter ordering.
                    </Paragraph>
                    <Table
                      rowKey="id"
                      dataSource={addOnRows}
                      scroll={{ x: 500 }}
                      columns={[
                        { title: 'Add On Name', dataIndex: 'name', key: 'name', render: (t) => <strong>{t}</strong> },
                        { title: 'Additional Price', dataIndex: 'price', key: 'price', render: (p) => <Tag color="green">+{formatCurrency(p)}</Tag> },
                        { title: 'Description', dataIndex: 'description', key: 'description' },
                      ]}
                      pagination={false}
                    />
                  </div>
                ),
              },

              // TAB 9: RACKS
              {
                key: 'racks',
                label: <span style={{ fontWeight: 700 }}>Racks</span>,
                children: (
                  <div style={{ paddingTop: 12 }}>
                    <Paragraph type="secondary">
                      Set aisle and bin racks for each warehouse location.
                    </Paragraph>
                    {(warehousesList.length > 0 ? warehousesList : [
                      { id: 1, name: 'Warehouse 1 (Main Storage)' },
                      { id: 2, name: 'Warehouse 2 (Transit Depot)' },
                      { id: 3, name: 'Store Counter (Retail)' },
                    ]).map((wh) => (
                      <Row key={wh.id} gutter={16} align="middle" style={{ marginBottom: 12 }}>
                        <Col span={10}>
                          <strong>{wh.name}</strong>
                        </Col>
                        <Col span={14}>
                          <Input placeholder={`Rack bin in ${wh.name} (e.g. RACK-B2)`} defaultValue="A-01" />
                        </Col>
                      </Row>
                    ))}
                  </div>
                ),
              },
            ]}
          />

          <Divider style={{ margin: '16px 0' }} />

          {/* Bottom Action Footer */}
          <Flex justify="space-between" align="center">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => {
                if (onBack) onBack();
                else navigate('/admins/products');
              }}
            >
              Cancel & Return
            </Button>

            <Space size={12}>
              <Button onClick={() => form.resetFields()}>
                Reset Form
              </Button>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                loading={isSubmitting}
                onClick={handleSubmitProduct}
                style={{
                  fontWeight: 800,
                  background: '#2563eb',
                  paddingInline: 28,
                  height: 40,
                }}
              >
                {editProduct ? 'Update Product' : 'Add Product'}
              </Button>
            </Space>
          </Flex>
        </Form>
      </Card>
    </div>
  );
}
