import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Row,
  Col,
  Button,
  Tag,
  Divider,
  Space,
  Typography,
  message,
  Tooltip,
  Slider,
  Segmented,
  Alert,
  Spin
} from 'antd';
import {
  SettingOutlined,
  SaveOutlined,
  ReloadOutlined,
  GlobalOutlined,
  ShopOutlined,
  ShoppingOutlined,
  BarcodeOutlined,
  DollarOutlined,
  MailOutlined,
  TrophyOutlined,
  BgColorsOutlined,
  ApartmentOutlined,
  ThunderboltOutlined,
  DesktopOutlined,
  BankOutlined,
  UndoOutlined,
  CheckOutlined,
  LockOutlined,
  BlockOutlined,
  TagsOutlined,
  DeploymentUnitOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage, useTranslation, SUPPORTED_LANGUAGES } from '../../contexts/LanguageContext';
import ThemeSettings from '../../contexts/ThemeSettings';
import { WALLPAPER_PRESETS } from '../../utils/uiTheme';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const presetQuickList = [
  { key: 'default', name: 'Aura Concept Blue', color: '#2F6FED', icon: '💎' },
  { key: 'emeraldFintech', name: 'Emerald Fintech', color: '#059669', icon: '🌿' },
  { key: 'violetPrestige', name: 'Violet Prestige', color: '#7c3aed', icon: '👑' },
  { key: 'amberElegance', name: 'Amber Elegance', color: '#d97706', icon: '☕' },
  { key: 'roseSunset', name: 'Rose Sunset', color: '#e11d48', icon: '🌹' },
  { key: 'slateExecutive', name: 'Slate Executive', color: '#4f46e5', icon: '🏛️' },
  { key: 'cyberCyan', name: 'Cyber Cyan', color: '#0891b2', icon: '⚡' },
  { key: 'darkModern', name: 'Obsidian Midnight', color: '#3b82f6', icon: '🌙' },
];

export default function SystemSettings() {
  const adminTheme = useAdminTheme();
  const { themeMode, setThemeMode, themePreset, changePreset, customSettings, updateTransparentSystem } = useTheme();
  const { currentLanguage, setLanguage, activeLanguage, supportedLanguages: ctxLangs, languages: ctxLangs2 } = useLanguage();
  const supportedLanguages = Array.isArray(ctxLangs) && ctxLangs.length ? ctxLangs : (Array.isArray(ctxLangs2) && ctxLangs2.length ? ctxLangs2 : SUPPORTED_LANGUAGES);
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settingsData, setSettingsData] = useState({});
  const [posSettingsData, setPosSettingsData] = useState({});
  const [lookups, setLookups] = useState({
    warehouses: [],
    billers: [],
    currencies: [],
    taxRates: [],
    customerGroups: [],
    priceGroups: [],
    units: []
  });

  const [form] = Form.useForm();
  const [posForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('site_config');

  // Custom wallpaper input state
  const [customWallpaperInput, setCustomWallpaperInput] = useState(
    customSettings?.transparentSystem?.customWallpaperUrl || ''
  );

  useEffect(() => {
    setCustomWallpaperInput(customSettings?.transparentSystem?.customWallpaperUrl || '');
  }, [customSettings?.transparentSystem?.customWallpaperUrl]);

  // Fetch full system settings from API
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/system-settings');
      if (res.data?.status && res.data.data) {
        const { settings = {}, posSettings = {}, lookups: lks = {} } = res.data.data;
        setSettingsData(settings);
        setPosSettingsData(posSettings);
        setLookups(lks);

        // Populate Form
        form.setFieldsValue({
          // Site config
          site_name: settings.site_name || 'AURA ERP',
          language: settings.language || 'english',
          default_currency: settings.default_currency || 'USD',
          default_warehouse: settings.default_warehouse || 1,
          default_biller: settings.default_biller || 1,
          timezone: settings.timezone || 'Asia/Phnom_Penh',
          rows_per_page: settings.rows_per_page || 25,
          dateformat: settings.dateformat ? String(settings.dateformat) : '1',
          mmode: settings.mmode === 1,
          allow_reg: settings.allow_reg === 1,
          reg_ver: settings.reg_ver === 1,

          // Products
          product_expiry: settings.product_expiry === 1,
          remove_expired: settings.remove_expired === 1,
          auto_detect_barcode: settings.auto_detect_barcode === 1,
          barcode_img: settings.barcode_img || 'Code128',
          barcode_separator: settings.barcode_separator || '-',
          item_addition: settings.item_addition === 1,
          display_all_products: settings.display_all_products === 1,
          iwidth: settings.iwidth || 800,
          iheight: settings.iheight || 800,
          twidth: settings.twidth || 250,
          theight: settings.theight || 250,
          watermark: settings.watermark === 1,
          price_group: settings.price_group || null,

          // Sales
          overselling: settings.overselling === 1,
          tax1: settings.tax1 === 1,
          tax2: settings.tax2 === 1,
          default_tax_rate: settings.default_tax_rate || null,
          customer_group: settings.customer_group || 1,
          invoice_view: settings.invoice_view ? String(settings.invoice_view) : '0',
          restrict_user: settings.restrict_user === 1,
          product_discount: settings.product_discount === 1,

          // Purchase
          update_cost: settings.update_cost === 1,
          qa_prefix: settings.qa_prefix || 'QA',

          // Accounting
          accounting_method: settings.accounting_method !== undefined ? String(settings.accounting_method) : '0',
          boms_method: settings.boms_method !== undefined ? String(settings.boms_method) : '0',
          reference_format: settings.reference_format ? String(settings.reference_format) : '1',
          reference_reset: settings.reference_reset !== undefined ? String(settings.reference_reset) : '0',

          // Prefixes
          sales_order_prefix: settings.sales_order_prefix || 'SO',
          sales_prefix: settings.sales_prefix || 'SALE',
          sales_tax_prefix: settings.sales_tax_prefix || 'ST',
          quote_prefix: settings.quote_prefix || 'QUOTE',
          purchase_order_prefix: settings.purchase_order_prefix || 'PUR',
          purchase_prefix: settings.purchase_prefix || 'PO',
          purchase_request_prefix: settings.purchase_request_prefix || 'PR',
          transfer_prefix: settings.transfer_prefix || 'TR',
          delivery_prefix: settings.delivery_prefix || 'DO',
          payment_prefix: settings.payment_prefix || 'PAY',
          ppayment_prefix: settings.ppayment_prefix || 'PPAY',
          return_prefix: settings.return_prefix || 'RET',
          returnp_prefix: settings.returnp_prefix || 'RETP',
          expense_prefix: settings.expense_prefix || 'EXP',

          // Money formatting
          decimals: settings.decimals !== undefined ? settings.decimals : 2,
          qty_decimals: settings.qty_decimals !== undefined ? settings.qty_decimals : 3,
          decimals_sep: settings.decimals_sep || '.',
          thousands_sep: settings.thousands_sep || ',',
          display_symbol: settings.display_symbol !== undefined ? String(settings.display_symbol) : '1',
          symbol: settings.symbol || '$',

          // Email
          protocol: settings.protocol || 'mail',
          smtp_host: settings.smtp_host || '',
          smtp_port: settings.smtp_port || 587,
          smtp_user: settings.smtp_user || '',
          smtp_pass: settings.smtp_pass || '',
          smtp_crypto: settings.smtp_crypto || 'tls',
          default_email: settings.default_email || 'noreply@aurasupply.com',

          // Loyalty points
          apoint_option: settings.apoint_option === 1,
          each_spent: settings.each_spent || 10,
          ca_point: settings.ca_point || 1,
          each_sale: settings.each_sale || 1,
          sa_point: settings.sa_point || 1,
          each_qty: settings.each_qty || 1,
          qca_point: settings.qca_point || 1,
        });

        posForm.setFieldsValue({
          cat_limit: posSettings.cat_limit || 20,
          pro_limit: posSettings.pro_limit || 30,
          default_category: posSettings.default_category || null,
          default_customer: posSettings.default_customer || 1,
          default_biller: posSettings.default_biller || 1,
          default_warehouse: posSettings.default_warehouse || 1,
          show_category: posSettings.show_category === 1,
          show_qty: posSettings.show_qty === 1,
          display_time: posSettings.display_time === 1,
        });
      }
    } catch (err) {
      console.error('Failed to load system settings:', err);
      message.error(t('error_loading_settings', 'Failed to load system settings'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Save changes
  const handleSaveAll = async () => {
    try {
      const values = await form.validateFields();
      const posValues = await posForm.validateFields();
      setSaving(true);

      // Convert booleans back to 1 / 0 integer flags for MySQL schema compatibility
      const sanitizedSettings = {
        ...values,
        mmode: values.mmode ? 1 : 0,
        allow_reg: values.allow_reg ? 1 : 0,
        reg_ver: values.reg_ver ? 1 : 0,
        product_expiry: values.product_expiry ? 1 : 0,
        remove_expired: values.remove_expired ? 1 : 0,
        auto_detect_barcode: values.auto_detect_barcode ? 1 : 0,
        item_addition: values.item_addition ? 1 : 0,
        display_all_products: values.display_all_products ? 1 : 0,
        watermark: values.watermark ? 1 : 0,
        overselling: values.overselling ? 1 : 0,
        tax1: values.tax1 ? 1 : 0,
        tax2: values.tax2 ? 1 : 0,
        restrict_user: values.restrict_user ? 1 : 0,
        product_discount: values.product_discount ? 1 : 0,
        update_cost: values.update_cost ? 1 : 0,
        apoint_option: values.apoint_option ? 1 : 0,
      };

      const sanitizedPos = {
        ...posValues,
        show_category: posValues.show_category ? 1 : 0,
        show_qty: posValues.show_qty ? 1 : 0,
        display_time: posValues.display_time ? 1 : 0,
      };

      const res = await axios.put('/api/admin/system-settings', {
        settings: sanitizedSettings,
        posSettings: sanitizedPos,
      });

      if (res.data?.status) {
        message.success(t('settings_saved_success', 'System settings saved and applied successfully!'));
        fetchSettings();
      } else {
        message.error(res.data?.message || t('error_saving_settings', 'Failed to save settings'));
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      message.error(t('verify_form_fields', 'Please verify required fields in the active tabs.'));
    } finally {
      setSaving(false);
    }
  };

  // Reset prefixes to ERP defaults
  const handleResetPrefixes = async () => {
    try {
      const res = await axios.post('/api/admin/system-settings/reset-prefixes');
      if (res.data?.status) {
        message.success(t('prefixes_reset_success', 'Reference prefixes reset to standard ERP conventions!'));
        fetchSettings();
      }
    } catch (err) {
      message.error(t('error_resetting_prefixes', 'Failed to reset prefixes'));
    }
  };

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Text style={{ color: adminTheme.subtext, fontSize: 12.5 }}>
            {t('settings', 'Settings')} / {t('general_settings', 'General Settings')} / {t('system_settings', 'System Settings')}
          </Text>
          <Title level={4} style={{ margin: '2px 0 0', color: adminTheme.text }}>
            <SettingOutlined style={{ marginRight: 8, color: '#0284c7' }} />
            {t('system_settings_title', 'System Settings & ERP Configuration')}
          </Title>
          <Paragraph style={{ margin: '4px 0 0', color: adminTheme.subtext, fontSize: 13 }}>
            {t('system_settings_subtitle', 'Comprehensive multi-section architecture fully replicated from AURA_v1.')}
          </Paragraph>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchSettings} loading={loading}>
            {t('reload', 'Reload')}
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveAll}
            loading={saving}
            style={{ background: '#0284c7', borderColor: '#0284c7' }}
          >
            {t('save_all_settings', 'Save All Settings')}
          </Button>
        </Space>
      </div>

      {/* Quick Navigation to Related Settings Sub-Pages */}
      <Card
        style={{
          borderRadius: 14,
          border: `1px solid ${adminTheme.border}`,
          background: adminTheme.card,
          boxShadow: adminTheme.shadow,
        }}
        styles={{ body: { padding: '12px 18px' } }}
      >
        <Space wrap size={[10, 8]}>
          <Text strong style={{ color: adminTheme.text, marginRight: 6 }}>
            {t('settings_modules', 'Settings Hub')}:
          </Text>
          <Button
            type="primary"
            size="small"
            icon={<SettingOutlined />}
            style={{ borderRadius: 6, background: '#0284c7' }}
          >
            {t('system_settings', 'System Settings')}
          </Button>
          <Button
            size="small"
            icon={<BlockOutlined />}
            onClick={() => navigate('/admins?module=settings&menu=units')}
          >
            {t('units', 'Units of Measure')}
          </Button>
          <Button
            size="small"
            icon={<TagsOutlined />}
            onClick={() => navigate('/admins?module=settings&menu=categories')}
          >
            {t('categories', 'Categories')}
          </Button>
          <Button
            size="small"
            icon={<DeploymentUnitOutlined />}
            onClick={() => navigate('/admins?module=settings&menu=brands')}
          >
            {t('brands', 'Brands')}
          </Button>
          <Button
            size="small"
            icon={<DollarOutlined />}
            onClick={() => navigate('/admins?module=settings&menu=currencies')}
          >
            {t('currencies', 'Currencies')}
          </Button>
          <Button
            size="small"
            icon={<ShopOutlined />}
            onClick={() => navigate('/admins?module=settings&menu=warehouses')}
          >
            {t('warehouses', 'Warehouses')}
          </Button>
          <Button
            size="small"
            icon={<LockOutlined />}
            onClick={() => navigate('/admins?module=settings&menu=permissions')}
          >
            {t('permissions', 'Permissions')}
          </Button>
          <Button
            size="small"
            icon={<AppstoreOutlined />}
            onClick={() => navigate('/admins?module=modules')}
            style={{ borderRadius: 6, fontWeight: 600, borderColor: '#2563eb', color: '#2563eb' }}
          >
            {t('modules', 'Modules (Switchboard)')}
          </Button>
        </Space>
      </Card>

      {/* Main Settings Tabs Form */}
      <Spin spinning={loading}>
        <Form form={form} layout="vertical">
          <Card
            style={{
              borderRadius: 18,
              border: `1px solid ${adminTheme.border}`,
              background: adminTheme.card,
              boxShadow: adminTheme.shadow,
            }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              type="card"
              items={[
                // 1. SITE CONFIGURATION
                {
                  key: 'site_config',
                  label: (
                    <span>
                      <GlobalOutlined /> {t('site_config', 'Site Configuration')}
                    </span>
                  ),
                  children: (
                    <div style={{ paddingTop: 10 }}>
                      <Alert
                        message={t('site_config_note', 'Core Enterprise Profile & Defaults')}
                        description={t('site_config_note_desc', 'Set primary brand title, regional default warehouse, biller company, and default settlement currency.')}
                        type="info"
                        showIcon
                        style={{ marginBottom: 20, borderRadius: 10 }}
                      />

                      <Row gutter={[20, 16]}>
                        <Col xs={24} md={12}>
                          <Form.Item
                            name="site_name"
                            label={<span style={{ fontWeight: 600 }}>{t('site_name', 'Site / Company Name')}</span>}
                            rules={[{ required: true }]}
                          >
                            <Input placeholder="AURA ERP" />
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                          <Form.Item
                            name="language"
                            label={<span style={{ fontWeight: 600 }}>{t('default_language', 'Default System Language')}</span>}
                          >
                            <Select>
                              <Option value="english">English (US)</Option>
                              <Option value="khmer">Khmer (ភាសាខ្មែរ)</Option>
                              <Option value="vietnamese">Vietnamese (Tiếng Việt)</Option>
                              <Option value="chinese">Chinese (中文)</Option>
                              <Option value="thai">Thai (ภาษาไทย)</Option>
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                          <Form.Item
                            name="default_currency"
                            label={<span style={{ fontWeight: 600 }}>{t('default_currency', 'Default Currency')}</span>}
                          >
                            <Select placeholder="Select currency">
                              {lookups.currencies.map((c) => (
                                <Option key={c.code} value={c.code}>
                                  {c.name} ({c.symbol || c.code})
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                          <Form.Item
                            name="default_warehouse"
                            label={<span style={{ fontWeight: 600 }}>{t('default_warehouse', 'Default Warehouse')}</span>}
                          >
                            <Select placeholder="Select warehouse">
                              {lookups.warehouses.map((w) => (
                                <Option key={w.id} value={w.id}>
                                  {w.name} ({w.code})
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                          <Form.Item
                            name="default_biller"
                            label={<span style={{ fontWeight: 600 }}>{t('default_biller', 'Default Biller Entity')}</span>}
                          >
                            <Select placeholder="Select biller">
                              {lookups.billers.map((b) => (
                                <Option key={b.id} value={b.id}>
                                  {b.company || b.name}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                          <Form.Item
                            name="timezone"
                            label={<span style={{ fontWeight: 600 }}>{t('timezone', 'Timezone')}</span>}
                          >
                            <Select showSearch>
                              <Option value="Asia/Phnom_Penh">Asia/Phnom_Penh (UTC+7)</Option>
                              <Option value="Asia/Bangkok">Asia/Bangkok (UTC+7)</Option>
                              <Option value="Asia/Singapore">Asia/Singapore (UTC+8)</Option>
                              <Option value="Asia/Hong_Kong">Asia/Hong_Kong (UTC+8)</Option>
                              <Option value="UTC">UTC (Coordinated Universal Time)</Option>
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                          <Form.Item
                            name="rows_per_page"
                            label={<span style={{ fontWeight: 600 }}>{t('rows_per_page', 'Rows Per Page (Data Tables)')}</span>}
                          >
                            <Select>
                              <Option value={10}>10 rows</Option>
                              <Option value={25}>25 rows</Option>
                              <Option value={50}>50 rows</Option>
                              <Option value={100}>100 rows</Option>
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                          <Form.Item
                            name="dateformat"
                            label={<span style={{ fontWeight: 600 }}>{t('date_format', 'Date Format')}</span>}
                          >
                            <Select>
                              <Option value="1">YYYY-MM-DD (2026-10-18)</Option>
                              <Option value="2">DD/MM/YYYY (18/10/2026)</Option>
                              <Option value="3">MM/DD/YYYY (10/18/2026)</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Divider />

                      <Row gutter={[20, 16]}>
                        <Col xs={24} md={8}>
                          <Form.Item
                            name="mmode"
                            valuePropName="checked"
                            label={<span style={{ fontWeight: 600 }}>{t('maintenance_mode', 'Maintenance Mode')}</span>}
                            extra={t('maintenance_mode_extra', 'Temporarily restrict public storefront checkout')}
                          >
                            <Switch />
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                          <Form.Item
                            name="allow_reg"
                            valuePropName="checked"
                            label={<span style={{ fontWeight: 600 }}>{t('allow_registration', 'Allow Customer Registration')}</span>}
                            extra={t('allow_reg_extra', 'Permit new buyers to register on the web storefront')}
                          >
                            <Switch />
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                          <Form.Item
                            name="reg_ver"
                            valuePropName="checked"
                            label={<span style={{ fontWeight: 600 }}>{t('email_verification', 'Require Email Verification')}</span>}
                            extra={t('reg_ver_extra', 'Send confirmation link before activating account')}
                          >
                            <Switch />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ),
                },

                // 2. PRODUCTS & MEASUREMENTS
                {
                  key: 'products',
                  label: (
                    <span>
                      <BarcodeOutlined /> {t('products_measurement', 'Products & Catalog')}
                    </span>
                  ),
                  children: (
                    <div style={{ paddingTop: 10 }}>
                      <Row gutter={[20, 16]}>
                        <Col xs={24} md={8}>
                          <Form.Item
                            name="barcode_img"
                            label={<span style={{ fontWeight: 600 }}>{t('barcode_symbology', 'Barcode Symbology')}</span>}
                          >
                            <Select>
                              <Option value="Code128">Code 128 (Standard)</Option>
                              <Option value="Code39">Code 39</Option>
                              <Option value="EAN8">EAN-8</Option>
                              <Option value="EAN13">EAN-13 (GS1 Retail)</Option>
                              <Option value="UPCA">UPC-A</Option>
                              <Option value="QR">QR Code 2D</Option>
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                          <Form.Item
                            name="barcode_separator"
                            label={<span style={{ fontWeight: 600 }}>{t('barcode_separator', 'Barcode Separator')}</span>}
                          >
                            <Input placeholder="-" style={{ maxWidth: 100 }} />
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                          <Form.Item
                            name="price_group"
                            label={<span style={{ fontWeight: 600 }}>{t('default_price_group', 'Default Price Group')}</span>}
                          >
                            <Select placeholder="Select price group" allowClear>
                              {lookups.priceGroups.map((pg) => (
                                <Option key={pg.id} value={pg.id}>
                                  {pg.name}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                          <Form.Item
                            name="auto_detect_barcode"
                            valuePropName="checked"
                            label={<span style={{ fontWeight: 600 }}>{t('auto_detect_barcode', 'Auto-Detect Barcode Scanner')}</span>}
                            extra={t('auto_detect_extra', 'Listen to HID hardware laser scanners in POS and catalog')}
                          >
                            <Switch />
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                          <Form.Item
                            name="product_expiry"
                            valuePropName="checked"
                            label={<span style={{ fontWeight: 600 }}>{t('track_product_expiry', 'Track Product Expiry')}</span>}
                            extra={t('expiry_extra', 'Enforce expiration date capture for perishable batches')}
                          >
                            <Switch />
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                          <Form.Item
                            name="display_all_products"
                            valuePropName="checked"
                            label={<span style={{ fontWeight: 600 }}>{t('display_all_products', 'Show Zero-Stock Products')}</span>}
                            extra={t('display_all_extra', 'Keep products with 0 stock visible across registers')}
                          >
                            <Switch />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Divider orientation="left">{t('image_dimensions', 'Catalog Image Geometry (Pixels)')}</Divider>

                      <Row gutter={[20, 16]}>
                        <Col xs={12} md={6}>
                          <Form.Item
                            name="iwidth"
                            label={<span style={{ fontWeight: 600 }}>{t('image_width', 'Image Width (px)')}</span>}
                          >
                            <InputNumber min={200} max={2000} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={6}>
                          <Form.Item
                            name="iheight"
                            label={<span style={{ fontWeight: 600 }}>{t('image_height', 'Image Height (px)')}</span>}
                          >
                            <InputNumber min={200} max={2000} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={6}>
                          <Form.Item
                            name="twidth"
                            label={<span style={{ fontWeight: 600 }}>{t('thumb_width', 'Thumbnail Width (px)')}</span>}
                          >
                            <InputNumber min={50} max={600} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={6}>
                          <Form.Item
                            name="theight"
                            label={<span style={{ fontWeight: 600 }}>{t('thumb_height', 'Thumbnail Height (px)')}</span>}
                          >
                            <InputNumber min={50} max={600} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ),
                },

                // 3. SALES & COMMERCIAL POLICIES
                {
                  key: 'sales',
                  label: (
                    <span>
                      <ShoppingOutlined /> {t('sales_policies', 'Sales & Invoicing')}
                    </span>
                  ),
                  children: (
                    <div style={{ paddingTop: 10 }}>
                      <Row gutter={[20, 16]}>
                        <Col xs={24} md={8}>
                          <Form.Item
                            name="overselling"
                            valuePropName="checked"
                            label={<span style={{ fontWeight: 600 }}>{t('overselling', 'Allow Overselling (Stock <= 0)')}</span>}
                            extra={t('overselling_desc', 'Permit cashiers to invoice goods even when ledger quantity is 0 or negative.')}
                          >
                            <Switch style={{ background: form.getFieldValue('overselling') ? '#16a34a' : undefined }} />
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                          <Form.Item
                            name="invoice_view"
                            label={<span style={{ fontWeight: 600 }}>{t('invoice_view_format', 'Invoice Print Format')}</span>}
                          >
                            <Select>
                              <Option value="0">Standard Invoice (Receipt / Thermal)</Option>
                              <Option value="1">Tax Invoice (Official General Dept of Taxation)</Option>
                              <Option value="2">Indian GST Format</Option>
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                          <Form.Item
                            name="default_tax_rate"
                            label={<span style={{ fontWeight: 600 }}>{t('default_sales_tax', 'Default Sales Tax Rate')}</span>}
                          >
                            <Select placeholder="Select tax rate" allowClear>
                              {lookups.taxRates.map((tr) => (
                                <Option key={tr.id} value={tr.id}>
                                  {tr.name} ({tr.rate}%)
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                          <Form.Item
                            name="customer_group"
                            label={<span style={{ fontWeight: 600 }}>{t('default_customer_group', 'Default Customer Group')}</span>}
                          >
                            <Select placeholder="Select customer group">
                              {lookups.customerGroups.map((cg) => (
                                <Option key={cg.id} value={cg.id}>
                                  {cg.name} ({cg.percent}%)
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                          <Form.Item
                            name="product_discount"
                            valuePropName="checked"
                            label={<span style={{ fontWeight: 600 }}>{t('enable_line_discounts', 'Line-Item Discounts')}</span>}
                            extra={t('discount_desc', 'Allow applying percentage or fixed discount per item in order')}
                          >
                            <Switch />
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                          <Form.Item
                            name="restrict_user"
                            valuePropName="checked"
                            label={<span style={{ fontWeight: 600 }}>{t('restrict_warehouse', 'Restrict Staff to Warehouse')}</span>}
                            extra={t('restrict_desc', 'Operators can only browse and bill inventory at their assigned store')}
                          >
                            <Switch />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ),
                },

                // 4. PURCHASES & INVENTORY
                {
                  key: 'purchase',
                  label: (
                    <span>
                      <ShopOutlined /> {t('purchasing_inventory', 'Purchasing & Costing')}
                    </span>
                  ),
                  children: (
                    <div style={{ paddingTop: 10 }}>
                      <Row gutter={[20, 16]}>
                        <Col xs={24} md={12}>
                          <Form.Item
                            name="update_cost"
                            valuePropName="checked"
                            label={<span style={{ fontWeight: 600 }}>{t('auto_update_cost', 'Auto-Update Cost Price on Receiving')}</span>}
                            extra={t('update_cost_desc', 'Automatically update standard product cost when purchase order items are marked received.')}
                          >
                            <Switch />
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                          <Form.Item
                            name="qa_prefix"
                            label={<span style={{ fontWeight: 600 }}>{t('qa_prefix', 'Quality Assurance (QA) Inspection Prefix')}</span>}
                          >
                            <Input placeholder="QA" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ),
                },

                // 5. ACCOUNTING & VALUATION METHOD
                {
                  key: 'accounting',
                  label: (
                    <span>
                      <BankOutlined /> {t('accounting_costing', 'Accounting & Costing')}
                    </span>
                  ),
                  children: (
                    <div style={{ paddingTop: 10 }}>
                      <Alert
                        message={t('valuation_methods', 'Inventory Valuation Algorithms (AURA_v1 Site::costing)')}
                        description={t(
                          'valuation_desc',
                          'AVCO computes Weighted Moving Average Cost across stock receipts. FIFO consumes oldest batches first. LIFO matches latest procurement batches.'
                        )}
                        type="warning"
                        showIcon
                        style={{ marginBottom: 20, borderRadius: 10 }}
                      />

                      <Row gutter={[20, 16]}>
                        <Col xs={24} md={12}>
                          <Form.Item
                            name="accounting_method"
                            label={<span style={{ fontWeight: 600 }}>{t('inventory_costing_method', 'Inventory Costing Method')}</span>}
                          >
                            <Select>
                              <Option value="0">
                                <strong>AVCO</strong> - Weighted Average Costing (Standard ERP)
                              </Option>
                              <Option value="1">
                                <strong>FIFO</strong> - First In, First Out
                              </Option>
                              <Option value="2">
                                <strong>LIFO</strong> - Last In, First Out
                              </Option>
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                          <Form.Item
                            name="boms_method"
                            label={<span style={{ fontWeight: 600 }}>{t('bom_costing_method', 'Bill of Materials (BOM) Costing')}</span>}
                          >
                            <Select>
                              <Option value="0">AVCO - Weighted Moving Average of Ingredients</Option>
                              <Option value="1">FIFO - First In Raw Batch Ingredients</Option>
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                          <Form.Item
                            name="reference_format"
                            label={<span style={{ fontWeight: 600 }}>{t('reference_format', 'Reference Sequence Format')}</span>}
                          >
                            <Select>
                              <Option value="1">Sequential Number (e.g. SALE-0001)</Option>
                              <Option value="2">Year / Sequential (e.g. SALE-2026-0001)</Option>
                              <Option value="3">Timestamp / Cryptographic Random</Option>
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                          <Form.Item
                            name="reference_reset"
                            label={<span style={{ fontWeight: 600 }}>{t('reference_reset', 'Sequence Reset Frequency')}</span>}
                          >
                            <Select>
                              <Option value="0">Never (Continuous numbering across years)</Option>
                              <Option value="1">Yearly (Reset to 1 on January 1st)</Option>
                              <Option value="2">Monthly (Reset to 1 on 1st of each month)</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ),
                },

                // 6. DOCUMENT REFERENCE PREFIXES
                {
                  key: 'prefix',
                  label: (
                    <span>
                      <ApartmentOutlined /> {t('reference_prefixes', 'Document Prefixes')}
                    </span>
                  ),
                  children: (
                    <div style={{ paddingTop: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text style={{ color: adminTheme.subtext, fontSize: 13 }}>
                          {t('prefix_instructions', 'Configure unique reference prefixes generated for transactions across all ERP modules.')}
                        </Text>
                        <Button icon={<UndoOutlined />} size="small" onClick={handleResetPrefixes}>
                          {t('reset_defaults', 'Reset to ERP Defaults')}
                        </Button>
                      </div>

                      <Row gutter={[20, 16]}>
                        <Col xs={12} md={6}>
                          <Form.Item
                            name="sales_order_prefix"
                            label={<span style={{ fontWeight: 600 }}>{t('sales_order_prefix', 'Sales Order (SO)')}</span>}
                          >
                            <Input placeholder="SO" />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={6}>
                          <Form.Item
                            name="sales_prefix"
                            label={<span style={{ fontWeight: 600 }}>{t('sales_invoice_prefix', 'Sales Invoice')}</span>}
                          >
                            <Input placeholder="SALE" />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={6}>
                          <Form.Item
                            name="quote_prefix"
                            label={<span style={{ fontWeight: 600 }}>{t('quote_prefix', 'Quotation')}</span>}
                          >
                            <Input placeholder="QUOTE" />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={6}>
                          <Form.Item
                            name="purchase_order_prefix"
                            label={<span style={{ fontWeight: 600 }}>{t('po_prefix', 'Purchase Order (PO)')}</span>}
                          >
                            <Input placeholder="PUR" />
                          </Form.Item>
                        </Col>

                        <Col xs={12} md={6}>
                          <Form.Item
                            name="purchase_prefix"
                            label={<span style={{ fontWeight: 600 }}>{t('purchase_invoice_prefix', 'Purchase Invoice')}</span>}
                          >
                            <Input placeholder="PO" />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={6}>
                          <Form.Item
                            name="purchase_request_prefix"
                            label={<span style={{ fontWeight: 600 }}>{t('pr_prefix', 'Purchase Request (PR)')}</span>}
                          >
                            <Input placeholder="PR" />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={6}>
                          <Form.Item
                            name="transfer_prefix"
                            label={<span style={{ fontWeight: 600 }}>{t('transfer_prefix', 'Stock Transfer (TR)')}</span>}
                          >
                            <Input placeholder="TR" />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={6}>
                          <Form.Item
                            name="delivery_prefix"
                            label={<span style={{ fontWeight: 600 }}>{t('delivery_prefix', 'Delivery Order (DO)')}</span>}
                          >
                            <Input placeholder="DO" />
                          </Form.Item>
                        </Col>

                        <Col xs={12} md={6}>
                          <Form.Item
                            name="payment_prefix"
                            label={<span style={{ fontWeight: 600 }}>{t('payment_prefix', 'Sales Receipt (PAY)')}</span>}
                          >
                            <Input placeholder="PAY" />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={6}>
                          <Form.Item
                            name="ppayment_prefix"
                            label={<span style={{ fontWeight: 600 }}>{t('ppayment_prefix', 'Purchase Payment (PPAY)')}</span>}
                          >
                            <Input placeholder="PPAY" />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={6}>
                          <Form.Item
                            name="return_prefix"
                            label={<span style={{ fontWeight: 600 }}>{t('return_prefix', 'Sales Return (RET)')}</span>}
                          >
                            <Input placeholder="RET" />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={6}>
                          <Form.Item
                            name="expense_prefix"
                            label={<span style={{ fontWeight: 600 }}>{t('expense_prefix', 'Expense Voucher (EXP)')}</span>}
                          >
                            <Input placeholder="EXP" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ),
                },

                // 7. MONEY & NUMBER FORMATTING
                {
                  key: 'money_number_format',
                  label: (
                    <span>
                      <DollarOutlined /> {t('money_number_format', 'Money & Numbers')}
                    </span>
                  ),
                  children: (
                    <div style={{ paddingTop: 10 }}>
                      <Row gutter={[20, 16]}>
                        <Col xs={24} md={8}>
                          <Form.Item
                            name="decimals"
                            label={<span style={{ fontWeight: 600 }}>{t('price_decimals', 'Price Decimals')}</span>}
                          >
                            <Select>
                              <Option value={0}>0 (100)</Option>
                              <Option value={2}>2 (100.00)</Option>
                              <Option value={3}>3 (100.000)</Option>
                              <Option value={4}>4 (100.0000)</Option>
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                          <Form.Item
                            name="qty_decimals"
                            label={<span style={{ fontWeight: 600 }}>{t('quantity_decimals', 'Quantity Decimals')}</span>}
                          >
                            <Select>
                              <Option value={0}>0 (Whole integers)</Option>
                              <Option value={1}>1 (0.5)</Option>
                              <Option value={2}>2 (0.25)</Option>
                              <Option value={3}>3 (0.125)</Option>
                              <Option value={4}>4 (0.0001)</Option>
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                          <Form.Item
                            name="symbol"
                            label={<span style={{ fontWeight: 600 }}>{t('currency_symbol', 'Currency Symbol')}</span>}
                          >
                            <Input placeholder="$" style={{ maxWidth: 120 }} />
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                          <Form.Item
                            name="decimals_sep"
                            label={<span style={{ fontWeight: 600 }}>{t('decimal_separator', 'Decimal Separator')}</span>}
                          >
                            <Select>
                              <Option value=".">Dot (.) [e.g. 1,250.50]</Option>
                              <Option value=",">Comma (,) [e.g. 1.250,50]</Option>
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                          <Form.Item
                            name="thousands_sep"
                            label={<span style={{ fontWeight: 600 }}>{t('thousands_separator', 'Thousands Separator')}</span>}
                          >
                            <Select>
                              <Option value=",">Comma (,) [e.g. 10,000]</Option>
                              <Option value=".">Dot (.) [e.g. 10.000]</Option>
                              <Option value=" ">Space ( ) [e.g. 10 000]</Option>
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                          <Form.Item
                            name="display_symbol"
                            label={<span style={{ fontWeight: 600 }}>{t('symbol_placement', 'Currency Symbol Placement')}</span>}
                          >
                            <Select>
                              <Option value="1">Before Price (e.g. $100.00)</Option>
                              <Option value="2">After Price (e.g. 100.00$ / 400,000៛)</Option>
                              <Option value="0">Do Not Display</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ),
                },

                // 8. EMAIL & DISPATCH
                {
                  key: 'email',
                  label: (
                    <span>
                      <MailOutlined /> {t('email_smtp', 'Email & Dispatch')}
                    </span>
                  ),
                  children: (
                    <div style={{ paddingTop: 10 }}>
                      <Row gutter={[20, 16]}>
                        <Col xs={24} md={8}>
                          <Form.Item
                            name="protocol"
                            label={<span style={{ fontWeight: 600 }}>{t('mail_protocol', 'Mail Protocol')}</span>}
                          >
                            <Select>
                              <Option value="mail">PHP Native mail()</Option>
                              <Option value="sendmail">Sendmail</Option>
                              <Option value="smtp">SMTP (Authenticated Relay)</Option>
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                          <Form.Item
                            name="smtp_host"
                            label={<span style={{ fontWeight: 600 }}>{t('smtp_host', 'SMTP Host')}</span>}
                          >
                            <Input placeholder="smtp.gmail.com or mail.aurasupply.com" />
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                          <Form.Item
                            name="smtp_port"
                            label={<span style={{ fontWeight: 600 }}>{t('smtp_port', 'SMTP Port')}</span>}
                          >
                            <InputNumber style={{ width: '100%' }} placeholder="587" />
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                          <Form.Item
                            name="smtp_user"
                            label={<span style={{ fontWeight: 600 }}>{t('smtp_user', 'SMTP Username')}</span>}
                          >
                            <Input placeholder="notifications@aurasupply.com" />
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                          <Form.Item
                            name="smtp_pass"
                            label={<span style={{ fontWeight: 600 }}>{t('smtp_pass', 'SMTP Password / App Key')}</span>}
                          >
                            <Input.Password placeholder="••••••••" />
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                          <Form.Item
                            name="smtp_crypto"
                            label={<span style={{ fontWeight: 600 }}>{t('smtp_encryption', 'Encryption Protocol')}</span>}
                          >
                            <Select>
                              <Option value="tls">TLS (Transport Layer Security)</Option>
                              <Option value="ssl">SSL</Option>
                              <Option value="none">None / Unencrypted</Option>
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                          <Form.Item
                            name="default_email"
                            label={<span style={{ fontWeight: 600 }}>{t('sender_email', 'Sender Display Email')}</span>}
                          >
                            <Input placeholder="orders@aurasupply.com" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ),
                },

                // 9. AWARD POINTS & LOYALTY
                {
                  key: 'award_points',
                  label: (
                    <span>
                      <TrophyOutlined /> {t('award_points', 'Award Points & Loyalty')}
                    </span>
                  ),
                  children: (
                    <div style={{ paddingTop: 10 }}>
                      <Row gutter={[20, 16]}>
                        <Col xs={24}>
                          <Form.Item
                            name="apoint_option"
                            valuePropName="checked"
                            label={<span style={{ fontWeight: 600 }}>{t('enable_loyalty_points', 'Enable Customer Loyalty Program')}</span>}
                            extra={t('points_extra', 'Automatically accumulate points during checkout to redeem discounts')}
                          >
                            <Switch />
                          </Form.Item>
                        </Col>

                        <Col xs={12} md={6}>
                          <Form.Item
                            name="each_spent"
                            label={<span style={{ fontWeight: 600 }}>{t('amount_spent', 'Amount Spent ($)')}</span>}
                          >
                            <InputNumber min={1} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={6}>
                          <Form.Item
                            name="ca_point"
                            label={<span style={{ fontWeight: 600 }}>{t('points_earned_spent', 'Earns Points')}</span>}
                          >
                            <InputNumber min={1} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>

                        <Col xs={12} md={6}>
                          <Form.Item
                            name="each_sale"
                            label={<span style={{ fontWeight: 600 }}>{t('each_sale_count', 'Each Order Count')}</span>}
                          >
                            <InputNumber min={1} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={6}>
                          <Form.Item
                            name="sa_point"
                            label={<span style={{ fontWeight: 600 }}>{t('points_earned_order', 'Earns Points')}</span>}
                          >
                            <InputNumber min={1} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ),
                },

                // 10. POS SETTINGS
                {
                  key: 'pos_settings',
                  label: (
                    <span>
                      <DesktopOutlined /> {t('pos_settings', 'POS Terminal')}
                    </span>
                  ),
                  children: (
                    <Form form={posForm} layout="vertical" style={{ paddingTop: 10 }}>
                      <Row gutter={[20, 16]}>
                        <Col xs={12} md={6}>
                          <Form.Item
                            name="pro_limit"
                            label={<span style={{ fontWeight: 600 }}>{t('pos_pro_limit', 'Product Grid Limit')}</span>}
                          >
                            <InputNumber min={5} max={100} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>

                        <Col xs={12} md={6}>
                          <Form.Item
                            name="cat_limit"
                            label={<span style={{ fontWeight: 600 }}>{t('pos_cat_limit', 'Category Bar Limit')}</span>}
                          >
                            <InputNumber min={3} max={50} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={6}>
                          <Form.Item
                            name="default_customer"
                            label={<span style={{ fontWeight: 600 }}>{t('pos_default_customer', 'Default Walk-in Customer')}</span>}
                          >
                            <Select placeholder="Walk-in customer">
                              <Option value={1}>General Walk-in Customer</Option>
                              <Option value={2}>Retail Guest</Option>
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={6}>
                          <Form.Item
                            name="display_time"
                            valuePropName="checked"
                            label={<span style={{ fontWeight: 600 }}>{t('display_clock', 'Display Live Clock on POS')}</span>}
                          >
                            <Switch />
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                          <Form.Item
                            name="show_category"
                            valuePropName="checked"
                            label={<span style={{ fontWeight: 600 }}>{t('show_category_tiles', 'Display Category Image Tiles')}</span>}
                          >
                            <Switch />
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                          <Form.Item
                            name="show_qty"
                            valuePropName="checked"
                            label={<span style={{ fontWeight: 600 }}>{t('show_stock_badge', 'Display In-Stock Badges on Items')}</span>}
                          >
                            <Switch />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Form>
                  ),
                },

                // 11. THEME & TRANSPARENT WALLPAPER (Retained and enhanced!)
                {
                  key: 'theme_wallpaper',
                  label: (
                    <span>
                      <BgColorsOutlined /> {t('theme_and_wallpaper', 'Theme & Wallpaper')}
                    </span>
                  ),
                  children: (
                    <div style={{ paddingTop: 10 }}>
                      <Row gutter={[24, 20]} align="middle">
                        <Col xs={24} lg={12}>
                          <Text strong style={{ display: 'block', fontSize: 14, color: adminTheme.text, marginBottom: 8 }}>
                            {t('color_presets', 'Color & Atmospheric Presets')}
                          </Text>
                          <Row gutter={[10, 10]}>
                            {presetQuickList.map((preset) => {
                              const isSelected = themePreset === preset.key;
                              return (
                                <Col xs={12} sm={6} key={preset.key}>
                                  <div
                                    onClick={() => changePreset(preset.key)}
                                    style={{
                                      padding: '10px 8px',
                                      borderRadius: 12,
                                      border: isSelected ? '2px solid #0284c7' : `1px solid ${adminTheme.border}`,
                                      background: isSelected ? '#0284c715' : adminTheme.subtle,
                                      cursor: 'pointer',
                                      textAlign: 'center',
                                      transition: 'all 0.2s',
                                    }}
                                  >
                                    <div style={{ fontSize: 20 }}>{preset.icon}</div>
                                    <Text style={{ fontSize: 11.5, fontWeight: isSelected ? 700 : 500, color: adminTheme.text, display: 'block' }}>
                                      {preset.name}
                                    </Text>
                                    <div
                                      style={{
                                        width: 14,
                                        height: 14,
                                        borderRadius: '50%',
                                        background: preset.color,
                                        margin: '4px auto 0',
                                      }}
                                    />
                                  </div>
                                </Col>
                              );
                            })}
                          </Row>
                        </Col>

                        <Col xs={24} lg={12}>
                          <Text strong style={{ display: 'block', fontSize: 14, color: adminTheme.text, marginBottom: 8 }}>
                            {t('custom_wallpaper_url', 'Custom Wallpaper Background')}
                          </Text>
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Input
                              placeholder="Paste high-res image URL (e.g. Unsplash or corporate wallpaper)"
                              value={customWallpaperInput}
                              onChange={(e) => setCustomWallpaperInput(e.target.value)}
                              addonAfter={
                                <Button
                                  type="primary"
                                  size="small"
                                  onClick={() => {
                                    updateTransparentSystem({
                                      enabled: true,
                                      preset: 'custom',
                                      customWallpaperUrl: customWallpaperInput,
                                    });
                                    message.success(t('wallpaper_applied', 'Wallpaper updated!'));
                                  }}
                                >
                                  {t('apply', 'Apply')}
                                </Button>
                              }
                            />
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {Object.entries(WALLPAPER_PRESETS).slice(0, 5).map(([k, p]) => (
                                <Tag
                                  key={k}
                                  style={{ cursor: 'pointer' }}
                                  color={customSettings?.transparentSystem?.preset === k ? 'blue' : 'default'}
                                  onClick={() => {
                                    updateTransparentSystem({
                                      enabled: true,
                                      preset: k,
                                      customWallpaperUrl: p.url,
                                    });
                                  }}
                                >
                                  {p.name}
                                </Tag>
                              ))}
                            </div>
                          </Space>
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
    </Space>
  );
}
