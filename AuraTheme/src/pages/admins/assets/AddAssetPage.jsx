import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
  Space,
  Typography,
  message,
  Divider,
  Statistic,
  Alert
} from 'antd';
import {
  PlusCircleOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  CalculatorOutlined,
  CheckCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useTranslation } from '../../../contexts/LanguageContext';

const { Title, Text } = Typography;
const { Option } = Select;

const AddAssetPage = ({ onSuccess, onCancel }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [nextCode, setNextCode] = useState('');

  // Live depreciation calculation preview
  const [purchaseCost, setPurchaseCost] = useState(0);
  const [residualValue, setResidualValue] = useState(0);
  const [usefulLifeMonths, setUsefulLifeMonths] = useState(36);

  const depreciableBase = Math.max(0, purchaseCost - residualValue);
  const monthlyDepreciation = usefulLifeMonths > 0 ? (depreciableBase / usefulLifeMonths) : 0;
  const annualDepreciation = monthlyDepreciation * 12;

  // Fetch initial data: next code & categories
  const fetchInitData = async () => {
    try {
      const [codeRes, catRes] = await Promise.all([
        axios.get('/api/admin/assets/next-code'),
        axios.get('/api/admin/assets/categories')
      ]);

      if (codeRes.data?.status && codeRes.data.data?.asset_code) {
        setNextCode(codeRes.data.data.asset_code);
        form.setFieldsValue({ asset_code: codeRes.data.data.asset_code });
      }

      if (catRes.data?.status) {
        setCategories(catRes.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching init data for Add Asset:', err);
    }
  };

  useEffect(() => {
    fetchInitData();
    form.setFieldsValue({
      purchase_date: dayjs(),
      useful_life_months: 36,
      residual_value: 0,
      condition: 'new',
      status: 'available',
      depreciation_method: 'straight_line'
    });
  }, []);

  const handleCategoryChange = (catId) => {
    const cat = categories.find((c) => c.id === catId);
    if (cat && cat.useful_life_months) {
      form.setFieldsValue({ useful_life_months: cat.useful_life_months });
      setUsefulLifeMonths(cat.useful_life_months);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const payload = {
        ...values,
        purchase_date: values.purchase_date ? values.purchase_date.format('YYYY-MM-DD') : null,
        warranty_start: values.warranty_start ? values.warranty_start.format('YYYY-MM-DD') : null,
        warranty_end: values.warranty_end ? values.warranty_end.format('YYYY-MM-DD') : null
      };

      const res = await axios.post('/api/admin/assets', payload);
      if (res.data?.status) {
        message.success(t('asset_created_success', 'Asset registered successfully!'));
        form.resetFields();
        if (onSuccess) {
          onSuccess(res.data.data);
        }
      }
    } catch (err) {
      console.error('Add asset submit error:', err);
      message.error(err.response?.data?.message || err.message || 'Failed to register asset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ borderRadius: 8, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {t('register_capital_asset', 'Register New Capital Fixed Asset')}
          </Title>
          <Text type="secondary">
            {t('register_asset_desc', 'Enter equipment specifications, financial acquisition details, and depreciation amortization baseline.')}
          </Text>
        </div>
        {onCancel && (
          <Button icon={<ArrowLeftOutlined />} onClick={onCancel}>
            {t('back_to_register', 'Back to Register')}
          </Button>
        )}
      </div>

      <Form
        form={form}
        layout="vertical"
        onValuesChange={(changed, all) => {
          if ('purchase_cost' in changed) setPurchaseCost(parseFloat(changed.purchase_cost) || 0);
          if ('residual_value' in changed) setResidualValue(parseFloat(changed.residual_value) || 0);
          if ('useful_life_months' in changed) setUsefulLifeMonths(parseInt(changed.useful_life_months, 10) || 36);
        }}
      >
        {/* Section 1: Asset Identity */}
        <Divider orientation="left" style={{ fontWeight: 600, color: '#2563eb' }}>
          1. {t('asset_identity', 'Equipment Identity & Identification')}
        </Divider>

        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Form.Item
              name="asset_code"
              label={t('asset_code', 'Asset Code / Tag')}
              rules={[{ required: true, message: 'Asset code is required' }]}
            >
              <Input
                placeholder="AST-2026-0001"
                suffix={
                  <ReloadOutlined
                    style={{ cursor: 'pointer', color: '#2563eb' }}
                    onClick={fetchInitData}
                    title="Refresh next code"
                  />
                }
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={12}>
            <Form.Item
              name="name"
              label={t('asset_name', 'Asset Name / Equipment Description')}
              rules={[{ required: true, message: 'Asset name is required' }]}
            >
              <Input placeholder="e.g. MacBook Pro 16 M3 Max, Forklift 3-Ton, Commercial Espresso Machine" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item
              name="category_id"
              label={t('asset_category', 'Asset Category')}
              rules={[{ required: true, message: 'Please select a category' }]}
            >
              <Select placeholder="Select category..." onChange={handleCategoryChange}>
                {categories.map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="brand" label={t('brand_manufacturer', 'Brand / Manufacturer')}>
              <Input placeholder="e.g. Apple, Dell, Toyota, Herman Miller" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="model" label={t('model_number', 'Model / Variant')}>
              <Input placeholder="e.g. A2991, R750xs, Linea PB" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="serial_number" label={t('serial_number', 'Serial Number (Unique)')}>
              <Input placeholder="Hardware S/N" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="barcode" label={t('barcode', 'Barcode / QR Payload')}>
              <Input placeholder="Scan or enter barcode" />
            </Form.Item>
          </Col>
        </Row>

        {/* Section 2: Acquisition & Straight-Line Depreciation Engine */}
        <Divider orientation="left" style={{ fontWeight: 600, color: '#16a34a' }}>
          2. {t('acquisition_depreciation', 'Acquisition & Straight-Line Amortization')}
        </Divider>

        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Form.Item
              name="purchase_date"
              label={t('purchase_date', 'Acquisition / In-Service Date')}
              rules={[{ required: true, message: 'Purchase date is required' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item
              name="purchase_cost"
              label={t('purchase_cost', 'Acquisition Cost ($)')}
              rules={[{ required: true, message: 'Acquisition cost is required' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                precision={2}
                placeholder="0.00"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="residual_value" label={t('salvage_value', 'Salvage / Residual Value ($)')}>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                precision={2}
                placeholder="0.00"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item
              name="useful_life_months"
              label={t('useful_life_months', 'Useful Life (Months)')}
              rules={[{ required: true, message: 'Useful life is required' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                placeholder="e.g. 36 (3 yrs), 60 (5 yrs)"
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Live Calculation Preview Banner */}
        <Card
          size="small"
          style={{
            marginBottom: 20,
            background: '#f0fdf4',
            borderColor: '#bbf7d0',
            borderRadius: 6
          }}
        >
          <Row gutter={16} align="middle">
            <Col xs={24} sm={6}>
              <Statistic
                title={<Text style={{ fontSize: 12 }}>{t('depreciable_base', 'Depreciable Base')}</Text>}
                value={depreciableBase}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#166534', fontSize: 16 }}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic
                title={<Text style={{ fontSize: 12 }}>{t('monthly_depreciation', 'Monthly Expense')}</Text>}
                value={monthlyDepreciation}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#166534', fontSize: 16 }}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic
                title={<Text style={{ fontSize: 12 }}>{t('annual_amortization', 'Annual Amortization')}</Text>}
                value={annualDepreciation}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#166534', fontSize: 16 }}
              />
            </Col>
            <Col xs={24} sm={6}>
              <div style={{ fontSize: 12, color: '#15803d' }}>
                <CalculatorOutlined style={{ marginRight: 4 }} />
                <strong>Straight-Line Amortization:</strong> (Cost &minus; Residual) &divide; Months
              </div>
            </Col>
          </Row>
        </Card>

        {/* Section 3: Custody, Location & Warranty */}
        <Divider orientation="left" style={{ fontWeight: 600, color: '#d97706' }}>
          3. {t('custody_location_warranty', 'Custody, Facility Location & Warranty')}
        </Divider>

        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="location_name" label={t('facility_location', 'Location / Facility')}>
              <Input placeholder="e.g. Floor 3 - Tech Lab, SBC Coffee Bar" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="department_name" label={t('department', 'Department / Cost Center')}>
              <Input placeholder="e.g. IT, Operations, Logistics" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="condition" label={t('physical_condition', 'Initial Physical Condition')}>
              <Select>
                <Option value="new">Brand New</Option>
                <Option value="excellent">Excellent</Option>
                <Option value="good">Good</Option>
                <Option value="fair">Fair</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="status" label={t('initial_status', 'Initial Status')}>
              <Select>
                <Option value="available">Available in Stock</Option>
                <Option value="assigned">Assigned / In Use</Option>
                <Option value="maintenance">Under Inspection</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="assigned_to" label={t('initial_custodian', 'Assigned To (Optional)')}>
              <Input placeholder="Employee name or leave blank" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="warranty_start" label={t('warranty_start', 'Warranty Start')}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="warranty_end" label={t('warranty_end', 'Warranty Expiration')}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="depreciation_method" label={t('depreciation_method', 'Depreciation Model')} initialValue="straight_line">
              <Select>
                <Option value="straight_line">Straight-Line Method (SLM)</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="note" label={t('asset_notes', 'Documentation / Special Remarks')}>
          <Input.TextArea rows={3} placeholder="Vendor invoice details, accessories, maintenance guidelines..." />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
          {onCancel && (
            <Button onClick={onCancel}>
              {t('cancel', 'Cancel')}
            </Button>
          )}
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={loading}
            onClick={handleSubmit}
            style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', paddingLeft: 24, paddingRight: 24 }}
          >
            {t('save_asset', 'Register Capital Asset')}
          </Button>
        </div>
      </Form>
    </Card>
  );
};

export default AddAssetPage;
