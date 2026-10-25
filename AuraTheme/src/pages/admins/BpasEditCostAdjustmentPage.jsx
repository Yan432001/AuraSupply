import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Table,
  Row,
  Col,
  Space,
  Typography,
  Tag,
  InputNumber,
  message,
  Divider,
  Alert,
  AutoComplete,
  Spin,
  Tooltip,
  Statistic,
  Popconfirm,
  Switch
} from 'antd';
import {
  SaveOutlined,
  RollbackOutlined,
  ReloadOutlined,
  SearchOutlined,
  BarcodeOutlined,
  DeleteOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  ThunderboltOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { formatCurrency } from '../../utils/uiTheme';
import { useAdminTheme } from '../../hooks/useAdminTheme';

const { Title, Text } = Typography;
const { Option } = Select;

export default function BpasEditCostAdjustmentPage({ adjustmentId = null, onBack = null, onSuccess = null }) {
  const adminTheme = useAdminTheme();
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const targetId = adjustmentId || routeId;

  const [form] = Form.useForm();

  // State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [billers, setBillers] = useState([]);
  const [standardReasons, setStandardReasons] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [adjustmentRecord, setAdjustmentRecord] = useState(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(1);

  // Search & Items
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [productOptions, setProductOptions] = useState([]);
  const [items, setItems] = useState([]);
  const [batchPercent, setBatchPercent] = useState(0);

  // Auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || localStorage.getItem('aura_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // 1. Fetch Metadata and Adjustment Details
  useEffect(() => {
    if (!targetId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [metaRes, adjRes] = await Promise.all([
          axios.get('/api/admin/products/cost_adjustments/meta/options', { headers: getAuthHeaders() }),
          axios.get(`/api/admin/products/cost_adjustments/${targetId}`, { headers: getAuthHeaders() })
        ]);

        if (metaRes.data?.success && metaRes.data?.data) {
          const meta = metaRes.data.data;
          setWarehouses(meta.warehouses || []);
          setBillers(meta.billers || []);
          setStandardReasons(meta.standardReasons || []);
          setStatuses(meta.statuses || []);
        }

        if (adjRes.data?.success && adjRes.data?.data) {
          const adj = adjRes.data.data;
          setAdjustmentRecord(adj);
          setSelectedWarehouseId(adj.warehouse_id);

          form.setFieldsValue({
            date: adj.date ? dayjs(adj.date) : dayjs(),
            reference_no: adj.reference_no,
            warehouse_id: adj.warehouse_id,
            biller_id: adj.biller_id,
            reason: adj.reason,
            status: adj.status || 'completed',
            note: adj.note || ''
          });

          // Format items
          if (Array.isArray(adj.items)) {
            const formattedItems = adj.items.map((item, idx) => ({
              key: `${item.product_id}_${item.option_id || 0}_${item.id || idx}`,
              item_id: item.id,
              product_id: item.product_id,
              product_code: item.product_code,
              product_barcode: item.product_barcode,
              product_name: item.product_name,
              display_name: item.product_name,
              option_id: item.option_id || null,
              variant_name: item.variant_name || null,
              unit_code: item.unit_code || 'Unit',
              unit_name: item.unit_name || '',
              old_cost: Number(item.old_cost || 0),
              new_cost: Number(item.new_cost || 0),
              cost_difference: Number(item.cost_difference || 0),
              on_hand_quantity: Number(item.on_hand_quantity || 0),
              valuation_change: Number(item.valuation_change || 0),
              reason: item.reason || adj.reason || '',
              item_note: item.item_note || ''
            }));
            setItems(formattedItems);
          }
        } else {
          message.error('Cost adjustment record not found');
        }
      } catch (err) {
        console.error(err);
        message.error('Failed to load cost adjustment details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [targetId, form]);

  // 2. Search Products for current warehouse
  const handleSearchProducts = async (value) => {
    setSearchQuery(value);
    if (!value || value.trim().length === 0) {
      setProductOptions([]);
      return;
    }

    setSearchingProducts(true);
    try {
      const res = await axios.get('/api/admin/products/cost_adjustments/products', {
        params: {
          warehouse_id: selectedWarehouseId,
          term: value.trim(),
          limit: 15
        },
        headers: getAuthHeaders()
      });

      if (res.data?.success && Array.isArray(res.data.data)) {
        const options = res.data.data.map((prod) => {
          const isAdded = items.some(
            (i) => i.product_id === prod.product_id && (i.option_id || null) === (prod.option_id || null)
          );
          return {
            value: `${prod.product_id}_${prod.option_id || 0}`,
            label: (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                <div>
                  <strong style={{ color: '#2563eb' }}>{prod.product_code}</strong> - {prod.display_name}
                  {prod.variant_name && <Tag color="blue" style={{ marginLeft: 6 }}>{prod.variant_name}</Tag>}
                </div>
                <div>
                  <span style={{ fontSize: 12, color: '#64748b', marginRight: 12 }}>
                    Stock: <strong>{Number(prod.on_hand_quantity || 0).toLocaleString()}</strong> {prod.unit_code}
                  </span>
                  <Tag color="cyan">Cost: {formatCurrency(prod.current_cost || 0)}</Tag>
                  {isAdded && <Tag color="orange">Added</Tag>}
                </div>
              </div>
            ),
            product: prod
          };
        });
        setProductOptions(options);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingProducts(false);
    }
  };

  // 3. Select Product from dropdown
  const handleSelectProduct = (value, option) => {
    const prod = option.product;
    if (!prod) return;

    const exists = items.some(
      (i) => i.product_id === prod.product_id && (i.option_id || null) === (prod.option_id || null)
    );

    if (exists) {
      message.info(`"${prod.display_name}" is already in the adjustment list`);
      setSearchQuery('');
      setProductOptions([]);
      return;
    }

    const currentCost = Number(prod.current_cost) || 0;
    const newItem = {
      key: `${prod.product_id}_${prod.option_id || 0}_${Date.now()}`,
      product_id: prod.product_id,
      product_code: prod.product_code,
      product_barcode: prod.product_barcode,
      product_name: prod.product_name,
      display_name: prod.display_name,
      option_id: prod.option_id || null,
      variant_name: prod.variant_name || null,
      unit_code: prod.unit_code || 'Unit',
      unit_name: prod.unit_name || '',
      old_cost: currentCost,
      new_cost: currentCost,
      cost_difference: 0,
      on_hand_quantity: Number(prod.on_hand_quantity) || 0,
      valuation_change: 0,
      reason: form.getFieldValue('reason') || '',
      item_note: ''
    };

    setItems((prev) => [newItem, ...prev]);
    setSearchQuery('');
    setProductOptions([]);
  };

  // 4. Update Cost
  const handleCostChange = (key, newCostVal) => {
    const val = Number(newCostVal) || 0;
    setItems((prev) =>
      prev.map((item) => {
        if (item.key === key) {
          const diff = Number((val - Number(item.old_cost || 0)).toFixed(4));
          const valChange = Number((diff * Number(item.on_hand_quantity || 0)).toFixed(4));
          return {
            ...item,
            new_cost: val,
            cost_difference: diff,
            valuation_change: valChange
          };
        }
        return item;
      })
    );
  };

  // 5. Update Item Note
  const handleItemFieldChange = (key, field, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.key === key) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // 6. Remove item
  const handleRemoveItem = (key) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  };

  // 7. Batch Percentage Adjustment
  const handleApplyBatchPercent = () => {
    if (items.length === 0) return;
    const factor = 1 + Number(batchPercent) / 100;
    setItems((prev) =>
      prev.map((item) => {
        const calculatedNewCost = Number((Number(item.old_cost || 0) * factor).toFixed(4));
        const diff = Number((calculatedNewCost - Number(item.old_cost || 0)).toFixed(4));
        const valChange = Number((diff * Number(item.on_hand_quantity || 0)).toFixed(4));
        return {
          ...item,
          new_cost: calculatedNewCost,
          cost_difference: diff,
          valuation_change: valChange
        };
      })
    );
    message.success(`Applied ${batchPercent > 0 ? `+${batchPercent}%` : `${batchPercent}%`} to all items`);
  };

  // 8. Totals Calculation
  const totals = items.reduce(
    (acc, curr) => {
      const valImpact = Number(curr.valuation_change) || 0;
      acc.totalItems += 1;
      acc.totalStockQty += Number(curr.on_hand_quantity) || 0;
      if (valImpact > 0) acc.positiveValuation += valImpact;
      if (valImpact < 0) acc.negativeValuation += Math.abs(valImpact);
      acc.netValuationChange += valImpact;
      return acc;
    },
    { totalItems: 0, totalStockQty: 0, positiveValuation: 0, negativeValuation: 0, netValuationChange: 0 }
  );

  // 9. Submit PUT
  const handleSubmit = async (values) => {
    if (items.length === 0) {
      message.error('Please specify at least one product in the cost adjustment');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        date: values.date ? values.date.format('YYYY-MM-DD HH:mm:ss') : dayjs().format('YYYY-MM-DD HH:mm:ss'),
        reference_no: values.reference_no,
        warehouse_id: values.warehouse_id,
        biller_id: values.biller_id,
        reason: values.reason,
        status: values.status || 'completed',
        apply_all_warehouses: values.apply_all_warehouses !== false,
        note: values.note || '',
        items: items.map((i) => ({
          id: i.item_id || null,
          product_id: i.product_id,
          product_code: i.product_code,
          product_name: i.product_name,
          option_id: i.option_id,
          variant_name: i.variant_name,
          old_cost: i.old_cost,
          new_cost: i.new_cost,
          cost_difference: i.cost_difference,
          on_hand_quantity: i.on_hand_quantity,
          valuation_change: i.valuation_change,
          reason: i.reason || values.reason,
          item_note: i.item_note
        }))
      };

      const res = await axios.put(`/api/admin/products/cost_adjustments/${targetId}`, payload, {
        headers: getAuthHeaders()
      });

      if (res.data?.success) {
        message.success(res.data.message || 'Cost adjustment updated successfully!');
        try {
          localStorage.removeItem('aura_admin_live_products_v2');
        } catch (_) {}
        if (onSuccess) {
          onSuccess(res.data.data);
        } else if (onBack) {
          onBack();
        } else {
          navigate('/admins/products?tab=cost-adjustments');
        }
      } else {
        message.error(res.data?.message || 'Failed to update cost adjustment');
      }
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || 'Error updating cost adjustment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/admins/products?tab=cost-adjustments');
    }
  };

  const itemColumns = [
    {
      title: '#',
      key: 'index',
      width: 50,
      align: 'center',
      render: (_, __, idx) => <span style={{ color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</span>
    },
    {
      title: 'Product Details',
      key: 'product',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 700, color: adminTheme.text }}>{r.display_name}</div>
          <Space size={6} style={{ marginTop: 2 }}>
            <Tag color="blue" style={{ fontSize: 11 }}>{r.product_code}</Tag>
            {r.variant_name && <Tag color="purple" style={{ fontSize: 11 }}>{r.variant_name}</Tag>}
          </Space>
        </div>
      )
    },
    {
      title: 'Stock Quantity',
      key: 'on_hand_quantity',
      width: 130,
      align: 'right',
      render: (_, r) => (
        <div>
          <strong>{Number(r.on_hand_quantity || 0).toLocaleString()}</strong>{' '}
          <span style={{ fontSize: 11, color: '#64748b' }}>{r.unit_code}</span>
        </div>
      )
    },
    {
      title: 'Original Cost',
      dataIndex: 'old_cost',
      key: 'old_cost',
      width: 120,
      align: 'right',
      render: (val) => formatCurrency(val || 0)
    },
    {
      title: 'Adjusted Cost *',
      key: 'new_cost',
      width: 160,
      render: (_, r) => (
        <InputNumber
          min={0}
          step={0.01}
          precision={4}
          value={r.new_cost}
          onChange={(val) => handleCostChange(r.key, val)}
          prefix="$"
          style={{ width: '100%', fontWeight: 700, borderColor: r.cost_difference !== 0 ? '#2563eb' : undefined }}
        />
      )
    },
    {
      title: 'Cost Delta',
      key: 'diff',
      width: 130,
      align: 'right',
      render: (_, r) => {
        const diff = Number(r.cost_difference) || 0;
        const pct = r.old_cost > 0 ? ((diff / r.old_cost) * 100).toFixed(1) : 0;
        if (diff > 0) {
          return (
            <div>
              <Tag color="green" icon={<RiseOutlined />} style={{ fontWeight: 700 }}>
                +{formatCurrency(diff)}
              </Tag>
              <div style={{ fontSize: 10, color: '#16a34a' }}>+{pct}%</div>
            </div>
          );
        } else if (diff < 0) {
          return (
            <div>
              <Tag color="red" icon={<FallOutlined />} style={{ fontWeight: 700 }}>
                {formatCurrency(diff)}
              </Tag>
              <div style={{ fontSize: 10, color: '#dc2626' }}>{pct}%</div>
            </div>
          );
        }
        return <Tag color="default">0.00</Tag>;
      }
    },
    {
      title: 'Valuation Impact',
      key: 'valuation_change',
      width: 140,
      align: 'right',
      render: (_, r) => {
        const val = Number(r.valuation_change) || 0;
        if (val > 0) return <strong style={{ color: '#16a34a' }}>+{formatCurrency(val)}</strong>;
        if (val < 0) return <strong style={{ color: '#dc2626' }}>-{formatCurrency(Math.abs(val))}</strong>;
        return <span style={{ color: '#94a3b8' }}>$0.00</span>;
      }
    },
    {
      title: 'Line Note',
      key: 'item_note',
      width: 170,
      render: (_, r) => (
        <Input
          placeholder="Note..."
          value={r.item_note}
          onChange={(e) => handleItemFieldChange(r.key, 'item_note', e.target.value)}
          size="small"
        />
      )
    },
    {
      title: '',
      key: 'action',
      width: 50,
      align: 'center',
      render: (_, r) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveItem(r.key)}
        />
      )
    }
  ];

  return (
    <div style={{ padding: '4px 0 24px 0' }}>
      <Spin spinning={loading}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* Header Action Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: 12
            }}
          >
            <div>
              <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <DollarOutlined style={{ color: '#2563eb' }} />
                <span>Edit Cost Adjustment: {adjustmentRecord?.reference_no}</span>
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Modify unit costs and update valuation ledger records.
              </Text>
            </div>
            <Space>
              <Button icon={<RollbackOutlined />} onClick={handleGoBack}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={submitting}
                style={{ background: '#2563eb', fontWeight: 700 }}
              >
                Update Cost Adjustment
              </Button>
            </Space>
          </div>

          {/* Form Header Info Card */}
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              marginBottom: 16,
              border: `1px solid ${adminTheme.border}`,
              background: adminTheme.cardBg
            }}
            styles={{ body: { padding: '20px 24px 8px 24px' } }}
          >
            <Row gutter={20}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  name="date"
                  label={<strong style={{ fontSize: 13 }}>Adjustment Date & Time</strong>}
                  rules={[{ required: true }]}
                >
                  <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm:ss" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  name="reference_no"
                  label={<strong style={{ fontSize: 13 }}>Reference No</strong>}
                  rules={[{ required: true }]}
                >
                  <Input style={{ fontWeight: 700, color: '#2563eb' }} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  name="warehouse_id"
                  label={<strong style={{ fontSize: 13 }}>Warehouse</strong>}
                  rules={[{ required: true }]}
                >
                  <Select
                    placeholder="Select Warehouse"
                    onChange={(val) => setSelectedWarehouseId(val)}
                  >
                    {warehouses.map((w) => (
                      <Option key={w.id} value={w.id}>
                        <ApartmentOutlined style={{ marginRight: 6, color: '#2563eb' }} />
                        {w.name} ({w.code})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  name="biller_id"
                  label={<strong style={{ fontSize: 13 }}>Biller / Company</strong>}
                >
                  <Select placeholder="Select Biller" allowClear>
                    {billers.map((b) => (
                      <Option key={b.id} value={b.id}>
                        {b.name} {b.company ? `(${b.company})` : ''}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  name="reason"
                  label={<strong style={{ fontSize: 13 }}>Adjustment Reason</strong>}
                  rules={[{ required: true }]}
                >
                  <Select showSearch allowClear>
                    {standardReasons.map((r) => (
                      <Option key={r} value={r}>
                        {r}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  name="status"
                  label={<strong style={{ fontSize: 13 }}>Status</strong>}
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Option value="completed">
                      <Tag color="green">Completed (Apply Costs Now)</Tag>
                    </Option>
                    <Option value="pending">
                      <Tag color="orange">Pending Review</Tag>
                    </Option>
                    <Option value="draft">
                      <Tag color="default">Draft</Tag>
                    </Option>
                    <Option value="cancelled">
                      <Tag color="red">Cancelled / Reverted</Tag>
                    </Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={24} md={12}>
                <Form.Item
                  name="note"
                  label={<strong style={{ fontSize: 13 }}>General Notes</strong>}
                >
                  <Input placeholder="Adjustment justification..." />
                </Form.Item>
              </Col>

              <Col xs={24} sm={24} md={12}>
                <Form.Item
                  name="apply_all_warehouses"
                  valuePropName="checked"
                  label={<strong style={{ fontSize: 13 }}>Multi-Level Cost Sync</strong>}
                >
                  <Space align="center" style={{ marginTop: 4 }}>
                    <Switch defaultChecked />
                    <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
                      Sync adjusted costs across all warehouses & update unit conversion price lists
                    </span>
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Product Search & Quick Add Section */}
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              marginBottom: 16,
              border: `1px solid ${adminTheme.border}`,
              background: adminTheme.cardBg
            }}
            styles={{ body: { padding: '16px 24px' } }}
          >
            <Row gutter={16} align="middle">
              <Col xs={24} md={14}>
                <div style={{ marginBottom: 6 }}>
                  <Text strong style={{ fontSize: 13 }}>
                    <SearchOutlined style={{ marginRight: 6, color: '#2563eb' }} />
                    Add More Products to this Cost Adjustment:
                  </Text>
                </div>
                <AutoComplete
                  style={{ width: '100%' }}
                  options={productOptions}
                  onSearch={handleSearchProducts}
                  onSelect={handleSelectProduct}
                  value={searchQuery}
                >
                  <Input
                    size="large"
                    placeholder="Scan barcode or type product name / code / SKU..."
                    prefix={searchingProducts ? <Spin size="small" /> : <BarcodeOutlined style={{ color: '#2563eb' }} />}
                    allowClear
                  />
                </AutoComplete>
              </Col>

              <Col xs={24} md={10}>
                <div style={{ marginBottom: 6 }}>
                  <Text strong style={{ fontSize: 13 }}>
                    <ThunderboltOutlined style={{ marginRight: 6, color: '#f59e0b' }} />
                    Batch Percentage Cost Modifier:
                  </Text>
                </div>
                <Space.Compact style={{ width: '100%' }}>
                  <InputNumber
                    size="large"
                    style={{ width: '60%' }}
                    placeholder="+/- %"
                    value={batchPercent}
                    onChange={(val) => setBatchPercent(val || 0)}
                    addonAfter="%"
                  />
                  <Button
                    size="large"
                    style={{ width: '40%', fontWeight: 600 }}
                    onClick={handleApplyBatchPercent}
                    disabled={items.length === 0}
                  >
                    Apply to All
                  </Button>
                </Space.Compact>
              </Col>
            </Row>
          </Card>

          {/* Items Table */}
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              marginBottom: 16,
              border: `1px solid ${adminTheme.border}`,
              background: adminTheme.cardBg
            }}
            styles={{
              header: {
                borderBottom: `1px solid ${adminTheme.border}`,
                padding: '12px 24px'
              },
              body: { padding: '0px' }
            }}
            title={
              <Space>
                <strong style={{ fontSize: 15 }}>Adjusted Products ({items.length})</strong>
                {items.length > 0 && <Tag color="blue">{totals.totalStockQty.toLocaleString()} Total Stock Units Impacted</Tag>}
              </Space>
            }
          >
            <Table
              dataSource={items}
              columns={itemColumns}
              pagination={false}
              rowKey="key"
              size="middle"
            />
          </Card>

          {/* Financial Valuation Summary Card */}
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              marginBottom: 20,
              border: `1px solid ${adminTheme.border}`,
              background: '#f8fafc'
            }}
            styles={{ body: { padding: '16px 24px' } }}
          >
            <Row gutter={24}>
              <Col xs={12} sm={6}>
                <Statistic
                  title={<span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>TOTAL PRODUCTS</span>}
                  value={totals.totalItems}
                  valueStyle={{ fontWeight: 800, color: '#0f172a' }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title={<span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>UPWARD REVALUATION</span>}
                  value={totals.positiveValuation}
                  precision={2}
                  prefix="+$"
                  valueStyle={{ fontWeight: 800, color: '#16a34a' }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title={<span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>DOWNWARD WRITE-DOWN</span>}
                  value={totals.negativeValuation}
                  precision={2}
                  prefix="-$"
                  valueStyle={{ fontWeight: 800, color: '#dc2626' }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title={<span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb' }}>NET VALUATION IMPACT</span>}
                  value={Math.abs(totals.netValuationChange)}
                  precision={2}
                  prefix={totals.netValuationChange >= 0 ? '+$' : '-$'}
                  valueStyle={{
                    fontWeight: 900,
                    color: totals.netValuationChange >= 0 ? '#16a34a' : '#dc2626'
                  }}
                />
              </Col>
            </Row>
          </Card>

          {/* Audit History Log if present */}
          {adjustmentRecord?.history && adjustmentRecord.history.length > 0 && (
            <Card
              title={
                <Space>
                  <HistoryOutlined style={{ color: '#2563eb' }} />
                  <span style={{ fontSize: 14, fontWeight: 700 }}>Audit History Trail</span>
                </Space>
              }
              style={{ borderRadius: 12, marginBottom: 20, border: `1px solid ${adminTheme.border}` }}
              styles={{ body: { padding: '12px 24px' } }}
            >
              <Table
                dataSource={adjustmentRecord.history}
                pagination={false}
                rowKey="id"
                size="small"
                columns={[
                  {
                    title: 'Timestamp',
                    dataIndex: 'created_at',
                    width: 170,
                    render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm:ss')
                  },
                  {
                    title: 'Action',
                    dataIndex: 'action_type',
                    width: 120,
                    render: (act) => <Tag color={act === 'created' ? 'green' : act === 'updated' ? 'blue' : 'red'}>{act?.toUpperCase()}</Tag>
                  },
                  {
                    title: 'Description',
                    dataIndex: 'description',
                    render: (d) => <span>{d}</span>
                  },
                  {
                    title: 'User',
                    dataIndex: 'user_id',
                    width: 140,
                    render: (u, r) => r.creator_name || `User #${u}`
                  }
                ]}
              />
            </Card>
          )}

          {/* Bottom Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button size="large" onClick={handleGoBack}>
              Cancel
            </Button>
            <Button
              size="large"
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={submitting}
              style={{ background: '#2563eb', fontWeight: 700, minWidth: 200 }}
            >
              Update Cost Adjustment
            </Button>
          </div>
        </Form>
      </Spin>
    </div>
  );
}
