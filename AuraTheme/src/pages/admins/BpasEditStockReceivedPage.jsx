import React, { useState, useEffect, useRef } from 'react';
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
} from 'antd';
import {
  SaveOutlined,
  RollbackOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  InboxOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  DeleteOutlined,
  SearchOutlined,
  BarcodeOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { formatCurrency } from '../../utils/uiTheme';
import { useAdminTheme } from '../../hooks/useAdminTheme';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function BpasEditStockReceivedPage({ onBack = null, onSuccess = null }) {
  const adminTheme = useAdminTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();

  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Metadata options
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [billers, setBillers] = useState([]);
  const [purchases, setPurchases] = useState([]);

  // Existing receipt record
  const [receiptRecord, setReceiptRecord] = useState(null);

  // Items
  const [items, setItems] = useState([]);

  // Product Search / Autocomplete
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOptions, setSearchOptions] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Load Metadata and Receipt Record
  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      try {
        const [metaRes, detailRes] = await Promise.all([
          axios.get('/api/admin/stock_received/meta/options'),
          axios.get(`/api/admin/stock_received/${id}`)
        ]);

        if (metaRes.data?.success && metaRes.data.data) {
          const d = metaRes.data.data;
          setWarehouses(d.warehouses || []);
          setSuppliers(d.suppliers || []);
          setBillers(d.billers || []);
          setPurchases(d.purchases || []);
        }

        if (detailRes.data?.success && detailRes.data.data) {
          const rec = detailRes.data.data;
          setReceiptRecord(rec);

          form.setFieldsValue({
            date: rec.date ? dayjs(rec.date) : dayjs(),
            re_reference_no: rec.re_reference_no,
            warehouse_id: rec.warehouse_id,
            supplier_id: rec.supplier_id,
            biller_id: rec.biller_id,
            purchase_id: rec.purchase_id,
            pu_reference_no: rec.pu_reference_no,
            si_reference_no: rec.si_reference_no,
            dn_reference: rec.dn_reference,
            truck: rec.truck,
            address: rec.address,
            note: rec.note,
            status: rec.status,
            received_by: rec.received_by,
          });

          const mappedItems = (rec.items || []).map((it, idx) => ({
            key: `item_${it.id || idx}_${Date.now()}`,
            id: it.id,
            purchase_item_id: it.purchase_item_id,
            product_id: it.product_id,
            product_code: it.product_code,
            product_name: it.product_name,
            product_type: it.product_type || 'standard',
            product_unit_id: it.product_unit_id,
            product_unit_code: it.product_unit_code || 'Unit',
            option_id: it.option_id || null,
            unit_cost: parseFloat(it.unit_cost || 0),
            real_unit_cost: parseFloat(it.real_unit_cost || it.unit_cost || 0),
            net_unit_cost: parseFloat(it.net_unit_cost || it.unit_cost || 0),
            quantity: parseFloat(it.quantity || 0),
            quantity_ordered: parseFloat(it.quantity_ordered || it.po_ordered_quantity || it.quantity || 0),
            quantity_previously_received: parseFloat(it.po_received_quantity || 0),
            quantity_rejected: parseFloat(it.quantity_rejected || 0),
            batch_no: it.batch_no || '',
            expiry: it.expiry ? dayjs(it.expiry).format('YYYY-MM-DD') : null,
            current_warehouse_stock: it.current_warehouse_stock || 0,
          }));

          setItems(mappedItems);
        }
      } catch (err) {
        message.error(err.response?.data?.message || 'Failed to load stock receipt record');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, form]);

  // Search Products for addition
  const handleProductSearch = (value) => {
    setSearchTerm(value);
    if (!value || value.trim().length < 1) {
      setSearchOptions([]);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      setSearchingProducts(true);
      try {
        const whId = form.getFieldValue('warehouse_id') || 'all';
        const res = await axios.get('/api/admin/stock_received/products', {
          params: { warehouse_id: whId, term: value, limit: 15 }
        });
        if (res.data?.success && res.data.data) {
          const opts = res.data.data.map((p) => ({
            value: String(p.product_id),
            label: (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{p.product_name}</span>
                  <span style={{ fontSize: 12, color: adminTheme.subtext, marginLeft: 8 }}>
                    ({p.product_code})
                  </span>
                </div>
                <div style={{ fontSize: 12, textAlign: 'right' }}>
                  <span style={{ color: '#059669', fontWeight: 600 }}>
                    Stock: {parseFloat(p.current_warehouse_stock || 0)} {p.product_unit_code || 'Unit'}
                  </span>
                  <span style={{ marginLeft: 10, color: '#2563eb' }}>
                    Cost: {formatCurrency(p.unit_cost || 0)}
                  </span>
                </div>
              </div>
            ),
            product: p,
          }));
          setSearchOptions(opts);
        }
      } catch (err) {
        console.warn('Failed to search products:', err.message);
      } finally {
        setSearchingProducts(false);
      }
    }, 300);
  };

  // Add Product to Items Table
  const handleSelectProduct = (value, option) => {
    const prod = option.product;
    if (!prod) return;

    const existingIndex = items.findIndex(it => it.product_id === prod.product_id && !it.purchase_item_id);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity = (parseFloat(updated[existingIndex].quantity) || 0) + 1;
      setItems(updated);
      message.info(`Increased quantity for ${prod.product_name}`);
    } else {
      const newItem = {
        key: `prod_${prod.product_id}_${Date.now()}`,
        purchase_item_id: null,
        product_id: prod.product_id,
        product_code: prod.product_code,
        product_name: prod.product_name,
        product_type: prod.product_type || 'standard',
        product_unit_id: prod.product_unit_id,
        product_unit_code: prod.product_unit_code || 'Unit',
        option_id: null,
        unit_cost: parseFloat(prod.unit_cost || 0),
        real_unit_cost: parseFloat(prod.unit_cost || 0),
        net_unit_cost: parseFloat(prod.unit_cost || 0),
        quantity_ordered: 1,
        quantity_previously_received: 0,
        quantity_balance: 1,
        quantity: 1,
        quantity_rejected: 0,
        batch_no: '',
        expiry: null,
        current_warehouse_stock: prod.current_warehouse_stock || 0,
      };
      setItems([...items, newItem]);
      message.success(`Added ${prod.product_name}`);
    }

    setSearchTerm('');
    setSearchOptions([]);
  };

  // Update Item Property
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  // Remove Item
  const handleRemoveItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  // Calculate Totals
  const totalUnits = items.reduce((sum, it) => sum + (parseFloat(it.quantity) || 0), 0);
  const totalRejected = items.reduce((sum, it) => sum + (parseFloat(it.quantity_rejected) || 0), 0);
  const totalAmount = items.reduce((sum, it) => sum + ((parseFloat(it.quantity) || 0) * (parseFloat(it.unit_cost) || 0)), 0);

  // Submit Handler
  const handleSubmit = async (values) => {
    if (items.length === 0) {
      message.error('Please add at least one product item to receive.');
      return;
    }

    for (const it of items) {
      const qty = parseFloat(it.quantity || 0);
      if (qty <= 0) {
        message.error(`Received quantity for "${it.product_name}" must be greater than 0.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        date: values.date ? values.date.format('YYYY-MM-DD HH:mm:ss') : dayjs().format('YYYY-MM-DD HH:mm:ss'),
        re_reference_no: values.re_reference_no,
        warehouse_id: values.warehouse_id,
        supplier_id: values.supplier_id,
        biller_id: values.biller_id,
        purchase_id: values.purchase_id || null,
        pu_reference_no: values.pu_reference_no || null,
        si_reference_no: values.si_reference_no || '',
        dn_reference: values.dn_reference || '',
        truck: values.truck || '',
        address: values.address || '',
        note: values.note || '',
        status: values.status || 'completed',
        received_by: values.received_by || 'Admin',
        items: items.map(it => ({
          id: it.id || null,
          purchase_item_id: it.purchase_item_id || null,
          product_id: it.product_id,
          product_code: it.product_code,
          product_name: it.product_name,
          product_type: it.product_type || 'standard',
          product_unit_id: it.product_unit_id,
          product_unit_code: it.product_unit_code,
          option_id: it.option_id || null,
          unit_cost: parseFloat(it.unit_cost || 0),
          real_unit_cost: parseFloat(it.real_unit_cost || it.unit_cost || 0),
          net_unit_cost: parseFloat(it.net_unit_cost || it.unit_cost || 0),
          quantity: parseFloat(it.quantity || 0),
          quantity_ordered: parseFloat(it.quantity_ordered || it.quantity || 0),
          quantity_rejected: parseFloat(it.quantity_rejected || 0),
          batch_no: it.batch_no || '',
          expiry: it.expiry || null,
        })),
      };

      const res = await axios.put(`/api/admin/stock_received/${id}`, payload);
      if (res.data?.success) {
        message.success('Stock received voucher updated successfully and stock re-synced!');
        if (onSuccess) {
          onSuccess(res.data.data);
        } else {
          navigate('/admins/products?tab=stock-received');
        }
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to update stock received voucher');
    } finally {
      setSubmitting(false);
    }
  };

  // Back navigation
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/admins/products?tab=stock-received');
    }
  };

  // Table Columns
  const columns = [
    {
      title: '#',
      key: 'idx',
      width: 45,
      render: (_, __, i) => i + 1,
    },
    {
      title: 'Product (Code & Name)',
      key: 'product',
      render: (_, it) => (
        <div>
          <div style={{ fontWeight: 600 }}>{it.product_name}</div>
          <div style={{ fontSize: 12, color: adminTheme.subtext }}>
            SKU: {it.product_code} | Unit: {it.product_unit_code}
          </div>
          <div style={{ fontSize: 11, color: '#059669' }}>
            Current Warehouse Stock: {parseFloat(it.current_warehouse_stock || 0)}
          </div>
        </div>
      ),
    },
    {
      title: 'PO Ordered',
      dataIndex: 'quantity_ordered',
      key: 'quantity_ordered',
      width: 90,
      align: 'right',
      render: (q) => q ? <Tag color="default">{parseFloat(q).toLocaleString()}</Tag> : '-',
    },
    {
      title: 'Receiving Qty *',
      key: 'quantity',
      width: 125,
      render: (_, it, index) => (
        <InputNumber
          min={0.01}
          step={1}
          value={it.quantity}
          onChange={(val) => handleItemChange(index, 'quantity', val)}
          style={{ width: '100%', borderColor: '#2563eb' }}
        />
      ),
    },
    {
      title: 'Rejected / Short',
      key: 'quantity_rejected',
      width: 115,
      render: (_, it, index) => (
        <InputNumber
          min={0}
          step={1}
          value={it.quantity_rejected}
          onChange={(val) => handleItemChange(index, 'quantity_rejected', val)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Unit Cost ($)',
      key: 'unit_cost',
      width: 115,
      render: (_, it, index) => (
        <InputNumber
          min={0}
          step={0.01}
          value={it.unit_cost}
          onChange={(val) => handleItemChange(index, 'unit_cost', val)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Batch / Lot #',
      key: 'batch_no',
      width: 130,
      render: (_, it, index) => (
        <Input
          placeholder="Lot / Batch"
          value={it.batch_no}
          onChange={(e) => handleItemChange(index, 'batch_no', e.target.value)}
        />
      ),
    },
    {
      title: 'Expiry Date',
      key: 'expiry',
      width: 140,
      render: (_, it, index) => (
        <DatePicker
          placeholder="YYYY-MM-DD"
          value={it.expiry ? dayjs(it.expiry) : null}
          onChange={(date) => handleItemChange(index, 'expiry', date ? date.format('YYYY-MM-DD') : null)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Subtotal',
      key: 'subtotal',
      width: 110,
      align: 'right',
      render: (_, it) => (
        <span style={{ fontWeight: 700, color: '#1e293b' }}>
          {formatCurrency((parseFloat(it.quantity) || 0) * (parseFloat(it.unit_cost) || 0))}
        </span>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 50,
      align: 'center',
      render: (_, __, index) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveItem(index)}
        />
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spin size="large" tip="Loading Stock Receipt Record..." />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Header Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <InboxOutlined style={{ color: '#2563eb' }} />
            Edit Stock Received - {receiptRecord?.re_reference_no || `#${id}`}
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Modify delivery receipt details, inspect quantities, adjust batch details, and safely update warehouse stock.
          </Text>
        </div>
        <Space>
          <Button icon={<RollbackOutlined />} onClick={handleBack}>
            Back to List
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={submitting}
            onClick={() => form.submit()}
            style={{ fontWeight: 600, background: '#2563eb' }}
          >
            Update & Resync Stock
          </Button>
        </Space>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        {/* 2. Voucher Header Information */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileTextOutlined style={{ color: '#2563eb' }} />
              <span>Receipt Header & Delivery Information</span>
            </div>
          }
          bordered={false}
          style={{ background: adminTheme.surface, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          <Row gutter={[16, 12]}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="Received Date & Time"
                name="date"
                rules={[{ required: true, message: 'Received date is required' }]}
              >
                <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="Receipt Reference"
                name="re_reference_no"
                rules={[{ required: true, message: 'Receipt reference is required' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="Destination Warehouse"
                name="warehouse_id"
                rules={[{ required: true, message: 'Destination warehouse is required' }]}
              >
                <Select placeholder="Select warehouse">
                  {warehouses.map((wh) => (
                    <Option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="Supplier"
                name="supplier_id"
                rules={[{ required: true, message: 'Supplier is required' }]}
              >
                <Select
                  placeholder="Select supplier"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {suppliers.map((s) => (
                    <Option key={s.id} value={s.id}>
                      {s.company && s.company !== '-' ? s.company : s.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Linked Purchase Order" name="purchase_id">
                <Select placeholder="Direct Receipt (None)" allowClear showSearch disabled>
                  {purchases.map((po) => (
                    <Option key={po.id} value={po.id}>
                      {po.reference_no} ({po.supplier})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Supplier Invoice Ref (SI)" name="si_reference_no">
                <Input placeholder="Supplier Invoice Number" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Delivery Note Ref (DN)" name="dn_reference">
                <Input placeholder="Delivery Note Number" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Truck / Vehicle #" name="truck">
                <Input placeholder="Vehicle / License Plate" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Receipt Status" name="status" rules={[{ required: true }]}>
                <Select>
                  <Option value="completed">Completed (Post to Stock)</Option>
                  <Option value="received">Received (Post to Stock)</Option>
                  <Option value="partial">Partial Shipment</Option>
                  <Option value="pending">Pending Inspection (No Stock Post)</Option>
                  <Option value="cancelled">Cancelled (Revert Stock)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Received By" name="received_by">
                <Input placeholder="Inspector / Warehouse Staff" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12}>
              <Form.Item label="Delivery / Unloading Address" name="address">
                <Input placeholder="Supplier address or warehouse dock" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 3. Items Selection & Receiving Table */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingOutlined style={{ color: '#2563eb' }} />
                <span>Receiving Items & Inventory Breakdown ({items.length} items)</span>
              </div>
              <Space>
                <Tag color="green" style={{ fontSize: 13, padding: '3px 10px' }}>
                  Total Receiving Units: <strong>{totalUnits.toLocaleString()}</strong>
                </Tag>
                {totalRejected > 0 && (
                  <Tag color="red" style={{ fontSize: 13, padding: '3px 10px' }}>
                    Rejected Units: <strong>{totalRejected.toLocaleString()}</strong>
                  </Tag>
                )}
                <Tag color="blue" style={{ fontSize: 13, padding: '3px 10px' }}>
                  Total Value: <strong>{formatCurrency(totalAmount)}</strong>
                </Tag>
              </Space>
            </div>
          }
          bordered={false}
          style={{ background: adminTheme.surface, borderRadius: 8, marginTop: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          {/* Direct Product Search Bar */}
          <div style={{ marginBottom: 16 }}>
            <AutoComplete
              style={{ width: '100%' }}
              options={searchOptions}
              onSearch={handleProductSearch}
              onSelect={handleSelectProduct}
              value={searchTerm}
            >
              <Input
                size="large"
                placeholder="Type product name, SKU code, or scan barcode to add item..."
                prefix={<SearchOutlined style={{ color: '#2563eb' }} />}
                suffix={searchingProducts ? <Spin size="small" /> : <BarcodeOutlined style={{ color: adminTheme.subtext }} />}
                allowClear
              />
            </AutoComplete>
          </div>

          {/* Table */}
          <Table
            dataSource={items}
            columns={columns}
            pagination={false}
            scroll={{ x: 1000 }}
            size="middle"
          />

          <Divider style={{ margin: '16px 0' }} />

          {/* Bottom Notes & Submit Bar */}
          <Row gutter={[16, 16]}>
            <Col xs={24} md={14}>
              <Form.Item label="Receipt Notes / Discrepancy Remarks" name="note">
                <TextArea rows={3} placeholder="Inspection results, damage remarks, driver signature notes..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={10}>
              <Card
                bordered
                style={{ background: '#f8fafc', borderColor: '#e2e8f0', borderRadius: 8 }}
                bodyStyle={{ padding: 16 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text type="secondary">Total Line Items:</Text>
                  <strong>{items.length}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text type="secondary">Total Units Accepted:</Text>
                  <strong style={{ color: '#059669', fontSize: 15 }}>{totalUnits.toLocaleString()}</strong>
                </div>
                {totalRejected > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text type="secondary">Total Units Rejected:</Text>
                    <strong style={{ color: '#dc2626' }}>{totalRejected.toLocaleString()}</strong>
                  </div>
                )}
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                  <Text strong style={{ fontSize: 15 }}>Total Stock Value:</Text>
                  <strong style={{ fontSize: 17, color: '#2563eb' }}>{formatCurrency(totalAmount)}</strong>
                </div>
                <Button
                  type="primary"
                  block
                  size="large"
                  icon={<SaveOutlined />}
                  loading={submitting}
                  onClick={() => form.submit()}
                  style={{ background: '#2563eb', fontWeight: 700 }}
                >
                  Update & Resync Stock
                </Button>
              </Card>
            </Col>
          </Row>
        </Card>
      </Form>
    </div>
  );
}
