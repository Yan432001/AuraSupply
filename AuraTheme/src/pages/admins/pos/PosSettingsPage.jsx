import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  Tabs,
  Row,
  Col,
  Divider,
  Typography,
  message,
  Space,
  Tag,
  Tooltip,
  Alert,
  Spin,
  Breadcrumb,
} from 'antd';
import {
  SettingOutlined,
  PrinterOutlined,
  KeyOutlined,
  SaveOutlined,
  UndoOutlined,
  ShopOutlined,
  CheckCircleFilled,
  InfoCircleOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  SafetyCertificateOutlined,
  ArrowLeftOutlined,
  CoffeeOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAdminTheme } from '../../../hooks/useAdminTheme';
import { useTranslation } from '../../../contexts/LanguageContext';
import { useAuth } from '../../../contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function PosSettingsPage() {
  const adminTheme = useAdminTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Master options from backend
  const [billers, setBillers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [floors, setFloors] = useState([]);
  const [currentSettings, setCurrentSettings] = useState(null);

  // Fetch settings & options on mount
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [res, tableRes] = await Promise.all([
        axios.get('/api/admin/pos/settings'),
        axios.get('/api/admin/pos/tables').catch(() => ({ data: { floors: [] } }))
      ]);
      if (res.data?.success) {
        const s = res.data.settings || {};
        setCurrentSettings(s);
        setBillers(res.data.billers || []);
        setWarehouses(res.data.warehouses || []);
        setCategories(res.data.categories || []);
        setCustomers(res.data.customers || []);
        setFloors(tableRes.data?.floors || []);

        form.setFieldsValue({
          pos_type: s.pos_type || 'pos',
          show_floor: s.show_floor !== undefined ? String(s.show_floor) : '-1',
          pro_limit: Number(s.pro_limit) || 20,
          cat_limit: Number(s.cat_limit) || 20,
          default_biller: s.default_biller ? Number(s.default_biller) : undefined,
          default_warehouse: s.default_warehouse ? Number(s.default_warehouse) : undefined,
          default_customer: s.default_customer ? Number(s.default_customer) : undefined,
          default_category: s.default_category ? Number(s.default_category) : undefined,
          pin_code: s.pin_code || '',
          rounding: Number(s.rounding) || 0,
          display_time: Number(s.display_time) === 1,
          keyboard: Number(s.keyboard) === 1,
          product_button_color: s.product_button_color || 'default',
          item_order: Number(s.item_order) || 0,
          after_sale_page: Number(s.after_sale_page) || 0,
          show_qty: Number(s.show_qty) === 1,
          show_item: Number(s.show_item) || 1,
          show_close_register_products: Number(s.show_close_register_products) === 1,
          pos_multi_payment: Number(s.pos_multi_payment) === 1,
          member_card: Number(s.member_card) === 1,
          coupon_card: Number(s.coupon_card) === 1,
          // Hardware & Printing
          remote_printing: Number(s.remote_printing) || 1,
          auto_print: Number(s.auto_print) === 1,
          char_per_line: Number(s.char_per_line) || 42,
          cash_drawer_codes: s.cash_drawer_codes || '\\x1C',
          cf_title1: s.cf_title1 || '',
          cf_value1: s.cf_value1 || '',
          cf_title2: s.cf_title2 || '',
          cf_value2: s.cf_value2 || '',
          // Shortcuts
          focus_add_item: s.focus_add_item || 'Ctrl+F3',
          add_manual_product: s.add_manual_product || 'Ctrl+Shift+M',
          customer_selection: s.customer_selection || 'Ctrl+Shift+C',
          add_customer: s.add_customer || 'Ctrl+Shift+A',
          cancel_sale: s.cancel_sale || 'F4',
          suspend_sale: s.suspend_sale || 'F7',
          print_items_list: s.print_items_list || 'F9',
          finalize_sale: s.finalize_sale || 'F8',
          today_sale: s.today_sale || 'Ctrl+F1',
          open_hold_bills: s.open_hold_bills || 'Ctrl+F2',
          close_register: s.close_register || 'Ctrl+F10',
        });
      }
    } catch (err) {
      message.error(t('failed_fetch_settings', 'Failed to load POS settings'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (values) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        display_time: values.display_time ? 1 : 0,
        keyboard: values.keyboard ? 1 : 0,
        show_qty: values.show_qty ? 1 : 0,
        show_close_register_products: values.show_close_register_products ? 1 : 0,
        pos_multi_payment: values.pos_multi_payment ? 1 : 0,
        member_card: values.member_card ? 1 : 0,
        coupon_card: values.coupon_card ? 1 : 0,
        auto_print: values.auto_print ? 1 : 0,
      };

      const res = await axios.put('/api/admin/pos/settings', payload);
      if (res.data?.success) {
        message.success(t('pos_settings_saved', 'POS settings updated successfully!'));
        setCurrentSettings(res.data.settings);
      } else {
        message.error(res.data?.message || 'Failed to update POS settings');
      }
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  const cardStyle = {
    borderRadius: 16,
    border: `1px solid ${adminTheme.border}`,
    background: adminTheme.card,
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1280, margin: '0 auto' }}>
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <Breadcrumb
            items={[
              { title: <a onClick={() => navigate('/admins')}>{t('dashboard', 'Dashboard')}</a> },
              { title: <a onClick={() => navigate('/admins/pos')}>{t('pos_terminal', 'POS Terminal')}</a> },
              { title: t('pos_settings', 'POS Settings') },
            ]}
            style={{ marginBottom: 8 }}
          />
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <SettingOutlined style={{ color: '#2F6FED' }} />
            {t('pos_settings', 'POS System Settings & Hardware')}
          </Title>
          <Text type="secondary">
            {t('pos_settings_sub', 'Configure default biller, warehouses, receipt layout, display limits, and feature toggles matching AURA_v1.')}
          </Text>
        </div>

        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admins/pos')}>
            {t('open_pos', 'Open POS')}
          </Button>
          <Button icon={<UndoOutlined />} onClick={fetchSettings} loading={loading}>
            {t('refresh', 'Refresh')}
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={() => form.submit()}
            style={{ minWidth: 120, background: '#2F6FED', borderColor: '#2F6FED' }}
          >
            {t('save_settings', 'Save Changes')}
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          autoComplete="off"
        >
          <Card style={cardStyle}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: 'general',
                  label: (
                    <span style={{ fontWeight: 600 }}>
                      <ShopOutlined /> {t('pos_config', 'General & Default Scoping')}
                    </span>
                  ),
                  children: (
                    <div style={{ paddingTop: 8 }}>
                      <Alert
                        message={t('scoping_info', 'Default Biller & Store Warehouse Isolation')}
                        description={t(
                          'scoping_info_desc',
                          'When a cashier operates POS, inventory stock and register audits are scoped by the selected default biller and linked store warehouse. Super Admins can override and switch between stores anytime in the POS terminal.'
                        )}
                        type="info"
                        showIcon
                        style={{ marginBottom: 24, borderRadius: 12 }}
                      />

                      {/* POS Operation Mode & Restaurant Table Service Concept (AURA_v1) */}
                      <Card
                        size="small"
                        title={
                          <span style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>
                            <CoffeeOutlined style={{ color: '#f59e0b', marginRight: 6 }} />
                            {t('pos_operation_mode_title', 'POS Operation Mode & Restaurant Tables (ប្រភេទ POS និងការគ្រប់គ្រងតុ)')}
                          </span>
                        }
                        style={{
                          marginBottom: 24,
                          borderRadius: 14,
                          border: '1.5px solid #fed7aa',
                          background: '#fffaf5',
                        }}
                      >
                        <Row gutter={[20, 16]}>
                          <Col xs={24} md={14}>
                            <Form.Item
                              name="pos_type"
                              label={t('pos_type_label', 'POS Operation Mode (ប្រភេទដំណើរការ POS)')}
                              rules={[{ required: true }]}
                              tooltip="Switches POS between fast retail counter sales and restaurant dine-in table management"
                            >
                              <Select size="large" style={{ borderRadius: 10 }}>
                                <Option value="pos">
                                  🏪 {t('pos_mode_retail', 'Quick Retail & Counter POS (លក់រហ័ស / Counter)')}
                                </Option>
                                <Option value="table">
                                  🍽️ {t('pos_mode_restaurant', 'Restaurant & Dine-In Table Service (ភោជនីយដ្ឋាន / បម្រើតាមតុ)')}
                                </Option>
                                <Option value="room">
                                  🏨 {t('pos_mode_room', 'Hospitality & Room Service (បន្ទប់ស្នាក់នៅ / សណ្ឋាគារ)')}
                                </Option>
                              </Select>
                            </Form.Item>
                          </Col>

                          <Col xs={24} md={10}>
                            <Form.Item
                              name="show_floor"
                              label={t('default_floor_label', 'Default Floor / Block (ជាន់ / តំបន់លំនាំដើម)')}
                              tooltip="Filter which floor area or dining block is loaded on POS startup"
                            >
                              <Select size="large" style={{ borderRadius: 10 }}>
                                <Option value="-1">🏢 {t('show_all_floors', 'Show All Floors (បង្ហាញគ្រប់ជាន់)')}</Option>
                                {floors.map((f) => (
                                  <Option key={f.id} value={String(f.id)}>
                                    📍 {f.name}
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                        </Row>
                        <div style={{ fontSize: 12, color: '#78350f', marginTop: -4 }}>
                          ℹ️ {t('pos_mode_hint', 'In "Restaurant & Dine-In Table" mode, cashiers can assign orders to tables, manage live dining floor plans, hold bills, and settle payments by table.')}
                        </div>
                      </Card>

                      <Row gutter={[20, 16]}>
                        {/* Default Biller */}
                        <Col xs={24} md={8}>
                          <Form.Item
                            name="default_biller"
                            label={t('default_biller', 'Default Biller / Store')}
                            rules={[{ required: true, message: 'Please select default biller' }]}
                            tooltip="The primary issuing corporate branch or store entity"
                          >
                            <Select
                              placeholder="Select Default Biller"
                              size="large"
                              showSearch
                              optionFilterProp="children"
                            >
                              {billers.map((b) => (
                                <Option key={b.id} value={b.id}>
                                  🏬 {b.name || b.company} {b.warehouse_name ? `(${b.warehouse_name})` : ''}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>

                        {/* Default Warehouse */}
                        <Col xs={24} md={8}>
                          <Form.Item
                            name="default_warehouse"
                            label={t('default_warehouse', 'Default Stock Warehouse')}
                            rules={[{ required: true, message: 'Please select default warehouse' }]}
                            tooltip="Physical inventory depot where stock is deducted for counter sales"
                          >
                            <Select
                              placeholder="Select Default Warehouse"
                              size="large"
                              showSearch
                              optionFilterProp="children"
                            >
                              {warehouses.map((w) => (
                                <Option key={w.id} value={w.id}>
                                  📦 {w.name} ({w.code})
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>

                        {/* Default Customer */}
                        <Col xs={24} md={8}>
                          <Form.Item
                            name="default_customer"
                            label={t('default_customer', 'Default Walk-in Customer')}
                            rules={[{ required: true, message: 'Please select default customer' }]}
                          >
                            <Select
                              placeholder="Select Default Customer"
                              size="large"
                              showSearch
                              optionFilterProp="children"
                            >
                              {customers.map((c) => (
                                <Option key={c.id} value={c.id}>
                                  👤 {c.name} {c.phone ? `(${c.phone})` : ''}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>

                        {/* Default Category */}
                        <Col xs={24} md={8}>
                          <Form.Item
                            name="default_category"
                            label={t('default_category', 'Default Catalog Category')}
                            tooltip="Initial category loaded when POS Terminal opens"
                          >
                            <Select
                              placeholder="Select Default Category"
                              size="large"
                              showSearch
                              optionFilterProp="children"
                            >
                              <Option value={0}>{t('all_categories', 'All Categories')}</Option>
                              {categories.map((c) => (
                                <Option key={c.id} value={c.id}>
                                  🏷️ {c.name} ({c.code})
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>

                        {/* Product Display Limit */}
                        <Col xs={24} md={8}>
                          <Form.Item
                            name="pro_limit"
                            label={t('pro_limit', 'Product Display Limit (Items/Page)')}
                            rules={[{ required: true, message: 'Required' }]}
                          >
                            <InputNumber min={6} max={500} style={{ width: '100%' }} size="large" />
                          </Form.Item>
                        </Col>

                        {/* Category Display Limit */}
                        <Col xs={24} md={8}>
                          <Form.Item
                            name="cat_limit"
                            label={t('cat_limit', 'Category Filter Limit')}
                          >
                            <InputNumber min={4} max={100} style={{ width: '100%' }} size="large" />
                          </Form.Item>
                        </Col>

                        {/* PIN Code for Manager Overrides */}
                        <Col xs={24} md={8}>
                          <Form.Item
                            name="pin_code"
                            label={t('delete_code', 'Supervisor / Void PIN Code')}
                            tooltip="Required when deleting held items, voiding transactions, or applying excessive discounts"
                          >
                            <Input.Password placeholder="4-8 digit numeric PIN" size="large" maxLength={8} />
                          </Form.Item>
                        </Col>

                        {/* Cash Rounding */}
                        <Col xs={24} md={8}>
                          <Form.Item
                            name="rounding"
                            label={t('rounding', 'Currency Cash Rounding')}
                          >
                            <Select size="large">
                              <Option value={0}>{t('disable', 'Disabled (Exact Cents)')}</Option>
                              <Option value={1}>{t('to_nearest_005', 'Round to Nearest 0.05')}</Option>
                              <Option value={2}>{t('to_nearest_050', 'Round to Nearest 0.50')}</Option>
                              <Option value={3}>{t('to_nearest_number', 'Round to Nearest Integer (1.00)')}</Option>
                              <Option value={4}>{t('to_next_number', 'Always Round Up (Ceil)')}</Option>
                            </Select>
                          </Form.Item>
                        </Col>

                        {/* Item Order */}
                        <Col xs={24} md={8}>
                          <Form.Item
                            name="item_order"
                            label={t('item_order', 'Cart Line Order')}
                          >
                            <Select size="large">
                              <Option value={0}>{t('default', 'Default (Chronological Added)')}</Option>
                              <Option value={1}>{t('category', 'Grouped by Category')}</Option>
                            </Select>
                          </Form.Item>
                        </Col>

                        {/* After Sale Action */}
                        <Col xs={24} md={8}>
                          <Form.Item
                            name="after_sale_page"
                            label={t('after_sale_page', 'Workflow After Checkout')}
                          >
                            <Select size="large">
                              <Option value={0}>{t('receipt', 'Show Receipt Print Dialog')}</Option>
                              <Option value={1}>{t('pos', 'Directly Clear & Ready Next Sale')}</Option>
                            </Select>
                          </Form.Item>
                        </Col>

                        {/* Product Button Color */}
                        <Col xs={24} md={8}>
                          <Form.Item
                            name="product_button_color"
                            label={t('product_button_color', 'Catalog Card Accent Color')}
                          >
                            <Select size="large">
                              <Option value="default">Default Neutral (Slate)</Option>
                              <Option value="primary">Corporate Blue</Option>
                              <Option value="info">Cyan Modern</Option>
                              <Option value="warning">Amber Gold</Option>
                              <Option value="danger">Crimson Red</Option>
                            </Select>
                          </Form.Item>
                        </Col>

                        {/* Show In Stock vs All */}
                        <Col xs={24} md={8}>
                          <Form.Item
                            name="show_item"
                            label={t('item_qty', 'Catalog Stock Filter')}
                          >
                            <Select size="large">
                              <Option value={1}>{t('all', 'Show All Products (Even Out-of-Stock)')}</Option>
                              <Option value={0}>{t('in_stock', 'In-Stock Only (Warehouse Qty > 0)')}</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Divider style={{ margin: '16px 0 24px' }} />

                      <Title level={5} style={{ marginBottom: 16 }}>
                        <ThunderboltOutlined style={{ color: '#10b981' }} /> {t('feature_toggles', 'Feature Toggles')}
                      </Title>

                      <Row gutter={[24, 16]}>
                        <Col xs={24} sm={12} md={6}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                            <div>
                              <div style={{ fontWeight: 600 }}>{t('display_time', 'Display Real-time Clock')}</div>
                              <Text type="secondary" style={{ fontSize: 12 }}>Show live digital clock in header</Text>
                            </div>
                            <Form.Item name="display_time" valuePropName="checked" noStyle>
                              <Switch />
                            </Form.Item>
                          </div>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                            <div>
                              <div style={{ fontWeight: 600 }}>{t('show_quantity', 'Show Stock Numbers')}</div>
                              <Text type="secondary" style={{ fontSize: 12 }}>Display badge on product tiles</Text>
                            </div>
                            <Form.Item name="show_qty" valuePropName="checked" noStyle>
                              <Switch />
                            </Form.Item>
                          </div>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                            <div>
                              <div style={{ fontWeight: 600 }}>{t('pos_multi_payment', 'Multi-Payment Tender')}</div>
                              <Text type="secondary" style={{ fontSize: 12 }}>Split bills across cash & cards</Text>
                            </div>
                            <Form.Item name="pos_multi_payment" valuePropName="checked" noStyle>
                              <Switch />
                            </Form.Item>
                          </div>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                            <div>
                              <div style={{ fontWeight: 600 }}>{t('member_card', 'Member Loyalty Cards')}</div>
                              <Text type="secondary" style={{ fontSize: 12 }}>Enable VIP card scan & points</Text>
                            </div>
                            <Form.Item name="member_card" valuePropName="checked" noStyle>
                              <Switch />
                            </Form.Item>
                          </div>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                            <div>
                              <div style={{ fontWeight: 600 }}>{t('coupon_card', 'Promotional Coupons')}</div>
                              <Text type="secondary" style={{ fontSize: 12 }}>Allow voucher codes at checkout</Text>
                            </div>
                            <Form.Item name="coupon_card" valuePropName="checked" noStyle>
                              <Switch />
                            </Form.Item>
                          </div>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                            <div>
                              <div style={{ fontWeight: 600 }}>{t('keyboard', 'Touch Keyboard')}</div>
                              <Text type="secondary" style={{ fontSize: 12 }}>Onscreen virtual numpad</Text>
                            </div>
                            <Form.Item name="keyboard" valuePropName="checked" noStyle>
                              <Switch />
                            </Form.Item>
                          </div>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                            <div>
                              <div style={{ fontWeight: 600 }}>{t('close_register_products', 'Shift Products Summary')}</div>
                              <Text type="secondary" style={{ fontSize: 12 }}>Item breakdown upon closing</Text>
                            </div>
                            <Form.Item name="show_close_register_products" valuePropName="checked" noStyle>
                              <Switch />
                            </Form.Item>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  ),
                },
                {
                  key: 'printing',
                  label: (
                    <span style={{ fontWeight: 600 }}>
                      <PrinterOutlined /> {t('pos_printing', 'Hardware & Receipt Printing')}
                    </span>
                  ),
                  children: (
                    <div style={{ paddingTop: 8 }}>
                      <Row gutter={[20, 16]}>
                        <Col xs={24} md={8}>
                          <Form.Item
                            name="remote_printing"
                            label={t('printing_mode', 'Printing Method')}
                            tooltip="Web Browser Dialog uses browser print; Local Install connects to ESC/POS direct USB/LAN printers"
                          >
                            <Select size="large">
                              <Option value={1}>🌐 Web Browser Native Print Dialog</Option>
                              <Option value={0}>🔌 Local Direct ESC/POS Driver</Option>
                              <Option value={3}>🖥️ PHP POS Print App / Network Socket</Option>
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                          <Form.Item
                            name="char_per_line"
                            label={t('char_per_line', 'Receipt Roll Width / Char Per Line')}
                            tooltip="42 columns for standard 80mm rolls, 32 columns for compact 58mm rolls"
                          >
                            <Select size="large">
                              <Option value={42}>80mm Thermal Receipt (42 - 48 characters/line)</Option>
                              <Option value={32}>58mm Compact Receipt (32 characters/line)</Option>
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                          <Form.Item
                            name="cash_drawer_codes"
                            label={t('cash_drawer_codes', 'Cash Drawer Kick Command')}
                            tooltip="ESC/POS control character code to open cash drawer on payment"
                          >
                            <Input placeholder="e.g. \x1C or 27,112,0,50,250" size="large" />
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', marginTop: 8 }}>
                            <div>
                              <div style={{ fontWeight: 600 }}>{t('auto_print', 'Automatic Print on Checkout')}</div>
                              <Text type="secondary" style={{ fontSize: 12 }}>Immediately prompt print window upon sale completion</Text>
                            </div>
                            <Form.Item name="auto_print" valuePropName="checked" noStyle>
                              <Switch />
                            </Form.Item>
                          </div>
                        </Col>
                      </Row>

                      <Divider style={{ margin: '24px 0 20px' }} />

                      <Title level={5} style={{ marginBottom: 16 }}>
                        <SafetyCertificateOutlined style={{ color: '#2F6FED' }} /> {t('custom_fields', 'Custom Receipt Header & Footer Lines')}
                      </Title>

                      <Row gutter={[20, 16]}>
                        <Col xs={24} md={12}>
                          <Card size="small" style={{ borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <Form.Item name="cf_title1" label="Custom Line 1 Label (e.g. VAT TIN / Tax ID)">
                              <Input placeholder="e.g. Tax ID / VAT Number" size="large" />
                            </Form.Item>
                            <Form.Item name="cf_value1" label="Custom Line 1 Value" style={{ margin: 0 }}>
                              <Input placeholder="e.g. K009-887766554" size="large" />
                            </Form.Item>
                          </Card>
                        </Col>

                        <Col xs={24} md={12}>
                          <Card size="small" style={{ borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <Form.Item name="cf_title2" label="Custom Line 2 Label (e.g. Guest WiFi / Return Policy)">
                              <Input placeholder="e.g. Customer WiFi" size="large" />
                            </Form.Item>
                            <Form.Item name="cf_value2" label="Custom Line 2 Value" style={{ margin: 0 }}>
                              <Input placeholder="e.g. AuraGuest2026 / PW: welcomeaura" size="large" />
                            </Form.Item>
                          </Card>
                        </Col>
                      </Row>
                    </div>
                  ),
                },
                {
                  key: 'shortcuts',
                  label: (
                    <span style={{ fontWeight: 600 }}>
                      <KeyOutlined /> {t('shortcuts', 'Keyboard Shortcuts')}
                    </span>
                  ),
                  children: (
                    <div style={{ paddingTop: 8 }}>
                      <Paragraph type="secondary" style={{ marginBottom: 20 }}>
                        Configure hotkeys for fast hands-on-keyboard register operations. Click any input to modify the shortcut combination.
                      </Paragraph>

                      <Row gutter={[20, 16]}>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item name="focus_add_item" label={t('focus_add_item', 'Focus Barcode Scanner / Search')}>
                            <Input prefix={<KeyOutlined />} size="large" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item name="finalize_sale" label={t('finalize_sale', 'Finalize Sale (Payment Modal)')}>
                            <Input prefix={<KeyOutlined />} size="large" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item name="cancel_sale" label={t('cancel_sale', 'Clear / Cancel Current Cart')}>
                            <Input prefix={<KeyOutlined />} size="large" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item name="suspend_sale" label={t('suspend_sale', 'Suspend / Hold Current Bill')}>
                            <Input prefix={<KeyOutlined />} size="large" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item name="open_hold_bills" label={t('open_hold_bills', 'Open Suspended Hold Bills')}>
                            <Input prefix={<KeyOutlined />} size="large" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item name="today_sale" label={t('today_sale', "Today's Sales Performance")}>
                            <Input prefix={<KeyOutlined />} size="large" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item name="close_register" label={t('close_register', 'Close Cash Register Shift')}>
                            <Input prefix={<KeyOutlined />} size="large" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item name="customer_selection" label={t('customer_selection', 'Select Customer')}>
                            <Input prefix={<KeyOutlined />} size="large" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item name="add_manual_product" label={t('add_manual_product', 'Manual Add Custom Item')}>
                            <Input prefix={<KeyOutlined />} size="large" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Form>
      </Spin>
    </div>
  );
}
