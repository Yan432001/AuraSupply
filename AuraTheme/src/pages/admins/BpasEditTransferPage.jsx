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
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
  BarcodeOutlined,
  SaveOutlined,
  RollbackOutlined,
  ApartmentOutlined,
  EditOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useParams, useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/uiTheme';
import { useAdminTheme } from '../../hooks/useAdminTheme';

const { Title, Text } = Typography;
const { Option } = Select;

export default function BpasEditTransferPage({ editId = null, onBack = null, onSuccess = null }) {
  const adminTheme = useAdminTheme();
  const navigate = useNavigate();
  const routeParams = useParams();
  const transferId = editId || routeParams.id;

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [transfer, setTransfer] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [billers, setBillers] = useState([]);
  const [fromWarehouseId, setFromWarehouseId] = useState(null);

  // Search & Items
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [productOptions, setProductOptions] = useState([]);
  const [items, setItems] = useState([]);
  const [shippingCost, setShippingCost] = useState(0);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('aura_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Load Transfer Data & Metadata
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [metaRes, transferRes] = await Promise.all([
          axios.get('/api/admin/transfers/meta/options', { headers: getAuthHeaders() }),
          axios.get(`/api/admin/transfers/${transferId}`, { headers: getAuthHeaders() }),
        ]);

        if (metaRes.data?.success) {
          setWarehouses(metaRes.data.data.warehouses || []);
          setBillers(metaRes.data.data.billers || []);
        }

        if (transferRes.data?.success && transferRes.data?.data) {
          const t = transferRes.data.data;
          setTransfer(t);
          setFromWarehouseId(t.from_warehouse_id);
          setShippingCost(parseFloat(t.shipping || 0));

          form.setFieldsValue({
            date: t.date ? dayjs(t.date) : dayjs(),
            transfer_no: t.transfer_no,
            from_warehouse_id: t.from_warehouse_id,
            to_warehouse_id: t.to_warehouse_id,
            from_biller: t.from_biller || null,
            to_biller: t.to_biller || null,
            status: t.status,
            shipping: parseFloat(t.shipping || 0),
            note: t.note || '',
          });

          // Map items
          const mappedItems = (t.items || []).map((i) => ({
            key: `${i.product_id}_${i.option_id || 0}_${i.id}`,
            id: i.id,
            product_id: i.product_id,
            product_code: i.product_code,
            product_name: i.product_name,
            display_name: i.variant_name ? `${i.product_name} (${i.variant_name})` : i.product_name,
            option_id: i.option_id,
            variant_name: i.variant_name,
            unit_code: i.product_unit_code || 'ea',
            unit_id: i.product_unit_id,
            available_quantity: parseFloat(i.from_wh_stock || 0),
            quantity: parseFloat(i.quantity || 1),
            unit_cost: parseFloat(i.unit_cost || 0),
            subtotal: parseFloat(i.subtotal || i.unit_cost * i.quantity),
          }));
          setItems(mappedItems);
        }
      } catch (err) {
        message.error('Failed to load transfer for editing');
      } finally {
        setLoading(false);
      }
    };

    if (transferId) {
      loadData();
    }
  }, [transferId, form]);

  // Product AutoComplete Search
  useEffect(() => {
    if (!fromWarehouseId || !searchQuery.trim()) {
      setProductOptions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingProducts(true);
      try {
        const res = await axios.get('/api/admin/transfers/products', {
          params: { warehouse_id: fromWarehouseId, term: searchQuery, limit: 15 },
          headers: getAuthHeaders(),
        });
        if (res.data?.success) {
          const formatted = (res.data.data || []).map((p) => ({
            value: `${p.product_id}_${p.option_id || 0}`,
            label: (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                <div>
                  <Text strong>{p.display_name}</Text>
                  <div style={{ fontSize: 12, color: adminTheme.subtext }}>
                    Code: {p.product_code} | Unit: {p.unit_code}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Tag color={p.available_quantity > 0 ? 'green' : 'red'}>
                    Stock: {Number(p.available_quantity).toLocaleString()}
                  </Tag>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0284c7' }}>
                    {formatCurrency(p.unit_cost)}
                  </div>
                </div>
              </div>
            ),
            product: p,
          }));
          setProductOptions(formatted);
        }
      } catch (err) {
        console.error('Failed to search warehouse products:', err);
      } finally {
        setSearchingProducts(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, fromWarehouseId, adminTheme.subtext]);

  const handleSelectProduct = (value, option) => {
    const prod = option.product;
    if (!prod) return;

    const existingIndex = items.findIndex(
      (item) => item.product_id === prod.product_id && (item.option_id || null) === (prod.option_id || null)
    );

    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * updated[existingIndex].unit_cost;
      setItems(updated);
    } else {
      const newItem = {
        key: `${prod.product_id}_${prod.option_id || 0}_${Date.now()}`,
        product_id: prod.product_id,
        product_code: prod.product_code,
        product_name: prod.product_name,
        display_name: prod.display_name,
        option_id: prod.option_id || null,
        variant_name: prod.variant_name || null,
        unit_code: prod.unit_code || 'ea',
        unit_id: prod.unit_id,
        available_quantity: prod.available_quantity,
        quantity: 1,
        unit_cost: prod.unit_cost,
        subtotal: prod.unit_cost * 1,
      };
      setItems([...items, newItem]);
    }

    setSearchQuery('');
  };

  const handleQuantityChange = (key, val) => {
    const qty = Math.max(0.01, parseFloat(val) || 1);
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, quantity: qty, subtotal: qty * item.unit_cost } : item))
    );
  };

  const handleRemoveItem = (key) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  const totalItemsCount = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
  const totalItemsCost = items.reduce((sum, item) => sum + (parseFloat(item.subtotal) || 0), 0);
  const grandTotal = totalItemsCost + (parseFloat(shippingCost) || 0);

  const handleSubmit = async (values) => {
    if (parseInt(values.from_warehouse_id, 10) === parseInt(values.to_warehouse_id, 10)) {
      message.error('Source warehouse and destination warehouse cannot be the same!');
      return;
    }

    if (!items.length) {
      message.warning('Please add at least one product item to the transfer');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        transfer_no: values.transfer_no,
        date: values.date ? values.date.format('YYYY-MM-DD HH:mm:ss') : dayjs().format('YYYY-MM-DD HH:mm:ss'),
        from_warehouse_id: values.from_warehouse_id,
        to_warehouse_id: values.to_warehouse_id,
        from_biller: values.from_biller || null,
        to_biller: values.to_biller || null,
        status: values.status,
        shipping: values.shipping || 0,
        note: values.note || '',
        items: items.map((i) => ({
          product_id: i.product_id,
          product_code: i.product_code,
          product_name: i.product_name,
          option_id: i.option_id,
          quantity: i.quantity,
          unit_cost: i.unit_cost,
          unit_quantity: 1,
          product_unit_code: i.unit_code,
          product_unit_id: i.unit_id,
          subtotal: i.subtotal,
        })),
      };

      const res = await axios.put(`/api/admin/transfers/${transferId}`, payload, { headers: getAuthHeaders() });
      if (res.data?.success) {
        message.success('Transfer updated successfully!');
        if (onSuccess) {
          onSuccess(res.data.data);
        } else {
          navigate('/admins/products?tab=transfers');
        }
      }
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Failed to update transfer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackNavigation = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: adminTheme.subtext }}>Loading transfer details...</div>
      </div>
    );
  }

  const isEditable = !['in_transit', 'sent', 'completed', 'cancelled'].includes(transfer?.status);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '16px 8px' }}>
      {/* Top Banner */}
      <Card
        style={{
          marginBottom: 16,
          background: adminTheme.surface,
          borderColor: adminTheme.border,
        }}
        bodyStyle={{ padding: '16px 20px' }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} sm={16}>
            <Space align="center" size={14}>
              <Button icon={<RollbackOutlined />} onClick={handleBackNavigation}>
                Back
              </Button>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 22,
                }}
              >
                <EditOutlined />
              </div>
              <div>
                <Title level={4} style={{ margin: 0, color: adminTheme.text }}>
                  Edit Transfer: {transfer?.transfer_no}
                </Title>
                <Text style={{ fontSize: 13, color: adminTheme.subtext }}>
                  Current Status: <Tag color="blue">{transfer?.status}</Tag>
                </Text>
              </div>
            </Space>
          </Col>
          <Col xs={24} sm={8} style={{ textAlign: 'right' }}>
            {isEditable && (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={submitting}
                onClick={() => form.submit()}
                style={{ background: '#16a34a', borderColor: '#16a34a', fontWeight: 700 }}
              >
                Save Changes
              </Button>
            )}
          </Col>
        </Row>
      </Card>

      {!isEditable && (
        <Alert
          message="Read-Only Notice"
          description={`This transfer is currently "${transfer?.status}". In-transit, completed, or cancelled transfers cannot have items modified directly. Use workflow status actions to dispatch, receive, or cancel.`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Main Form */}
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={17}>
            <Card
              title={
                <Space>
                  <ApartmentOutlined style={{ color: '#0284c7' }} />
                  <span>Transfer Information</span>
                </Space>
              }
              style={{
                marginBottom: 16,
                background: adminTheme.surface,
                borderColor: adminTheme.border,
              }}
            >
              <Row gutter={[16, 8]}>
                <Col xs={24} sm={8}>
                  <Form.Item name="date" label={<strong>Date</strong>}>
                    <DatePicker showTime style={{ width: '100%' }} disabled={!isEditable} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={8}>
                  <Form.Item name="transfer_no" label={<strong>Reference No</strong>}>
                    <Input disabled={!isEditable} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={8}>
                  <Form.Item name="status" label={<strong>Status</strong>}>
                    <Select disabled={!isEditable}>
                      <Option value="draft">Draft</Option>
                      <Option value="pending">Pending (Request)</Option>
                      <Option value="approved">Approved (Order)</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item name="from_warehouse_id" label={<strong>From Warehouse *</strong>}>
                    <Select disabled={!isEditable}>
                      {warehouses.map((wh) => (
                        <Option key={wh.id} value={wh.id}>
                          <strong>{wh.name}</strong> ({wh.code})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item name="to_warehouse_id" label={<strong>To Warehouse *</strong>}>
                    <Select disabled={!isEditable}>
                      {warehouses.map((wh) => (
                        <Option key={wh.id} value={wh.id} disabled={wh.id === fromWarehouseId}>
                          <strong>{wh.name}</strong> ({wh.code})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {isEditable && (
              <Card
                style={{
                  marginBottom: 16,
                  background: adminTheme.surface,
                  borderColor: adminTheme.border,
                }}
                bodyStyle={{ padding: '16px' }}
              >
                <AutoComplete
                  options={productOptions}
                  onSelect={handleSelectProduct}
                  style={{ width: '100%' }}
                  value={searchQuery}
                  onChange={(val) => setSearchQuery(val)}
                >
                  <Input
                    size="large"
                    placeholder="Scan barcode or add more products to transfer..."
                    prefix={<BarcodeOutlined style={{ color: '#0284c7', fontSize: 20 }} />}
                    suffix={searchingProducts ? <Spin size="small" /> : <SearchOutlined />}
                  />
                </AutoComplete>
              </Card>
            )}

            <Card
              title={<span>Transfer Items ({items.length})</span>}
              style={{
                background: adminTheme.surface,
                borderColor: adminTheme.border,
              }}
            >
              <Table
                dataSource={items}
                rowKey="key"
                pagination={false}
                columns={[
                  {
                    title: 'Product (Code - Name)',
                    key: 'product',
                    render: (_, r) => (
                      <div>
                        <strong>{r.product_name}</strong>
                        {r.variant_name && <Tag color="blue" style={{ marginLeft: 6 }}>{r.variant_name}</Tag>}
                        <div style={{ fontSize: 12, color: adminTheme.subtext }}>
                          Code: {r.product_code} | Unit: {r.unit_code}
                        </div>
                      </div>
                    ),
                  },
                  {
                    title: 'On-Hand Stock',
                    dataIndex: 'available_quantity',
                    key: 'available_quantity',
                    align: 'center',
                    width: 130,
                    render: (q) => (
                      <Tag color={q > 0 ? 'green' : 'red'}>
                        {Number(q).toLocaleString()}
                      </Tag>
                    ),
                  },
                  {
                    title: 'Transfer Qty',
                    key: 'quantity',
                    width: 140,
                    align: 'center',
                    render: (_, r) =>
                      isEditable ? (
                        <InputNumber
                          min={0.01}
                          value={r.quantity}
                          onChange={(val) => handleQuantityChange(r.key, val)}
                          style={{ width: '100%' }}
                        />
                      ) : (
                        <strong>{r.quantity}</strong>
                      ),
                  },
                  {
                    title: 'Unit Cost',
                    dataIndex: 'unit_cost',
                    key: 'unit_cost',
                    align: 'right',
                    width: 120,
                    render: (c) => formatCurrency(c),
                  },
                  {
                    title: 'Subtotal',
                    dataIndex: 'subtotal',
                    key: 'subtotal',
                    align: 'right',
                    width: 130,
                    render: (s) => <strong style={{ color: '#0284c7' }}>{formatCurrency(s)}</strong>,
                  },
                  {
                    title: '',
                    key: 'action',
                    width: 60,
                    align: 'center',
                    render: (_, r) =>
                      isEditable && (
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveItem(r.key)}
                        />
                      ),
                  },
                ]}
              />
            </Card>
          </Col>

          <Col xs={24} lg={7}>
            <Card
              title={<strong>Summary & Totals</strong>}
              style={{
                marginBottom: 16,
                background: adminTheme.surface,
                borderColor: adminTheme.border,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Total Line Items:</Text>
                  <strong>{totalItemsCount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Total Transfer Units:</Text>
                  <strong>{totalQuantity.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Items Total Cost:</Text>
                  <strong>{formatCurrency(totalItemsCost)}</strong>
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <div>
                  <Form.Item name="shipping" label="Shipping Charge">
                    <InputNumber
                      min={0}
                      disabled={!isEditable}
                      style={{ width: '100%' }}
                      onChange={(val) => setShippingCost(val || 0)}
                    />
                  </Form.Item>
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#f8fafc',
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <Text strong style={{ fontSize: 15 }}>
                    Grand Total:
                  </Text>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>
            </Card>

            <Card
              title={<strong>Notes & Remarks</strong>}
              style={{
                background: adminTheme.surface,
                borderColor: adminTheme.border,
              }}
            >
              <Form.Item name="note" label="Transfer Memo">
                <Input.TextArea rows={4} placeholder="Add instructions or remarks..." />
              </Form.Item>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
