import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Select,
  Input,
  InputNumber,
  Table,
  Space,
  Row,
  Col,
  Tag,
  Checkbox,
  Typography,
  Divider,
  message,
  Flex,
} from 'antd';
import {
  PrinterOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  BarcodeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/uiTheme';
import { useAdminTheme } from '../../hooks/useAdminTheme';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const LIVE_PRODUCTS_KEY = 'aura_admin_live_products_v2';
const getLiveProducts = () => {
  try {
    const raw = localStorage.getItem(LIVE_PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export default function BpasPrintBarcodesPage({ onBack, preselectedItems = [] }) {
  const adminTheme = useAdminTheme();
  const navigate = useNavigate();

  const [productsList, setProductsList] = useState(() => getLiveProducts());
  const [selectedPaperStyle, setSelectedPaperStyle] = useState('24');
  const [printProductName, setPrintProductName] = useState(true);
  const [printProductPrice, setPrintProductPrice] = useState(true);
  const [printCurrencies, setPrintCurrencies] = useState(true);
  const [printCompany, setPrintCompany] = useState(false);

  // Selected items to print
  const [itemsToPrint, setItemsToPrint] = useState(() => {
    if (preselectedItems && preselectedItems.length > 0) {
      return preselectedItems.map((p) => ({ ...p, printQty: 10 }));
    }
    const initial = getLiveProducts();
    return initial.slice(0, 6).map((p) => ({ ...p, printQty: 10 }));
  });

  const [searchToAdd, setSearchToAdd] = useState('');

  // Handle add item
  const handleAddItem = (productId) => {
    const found = productsList.find((p) => String(p.id) === String(productId));
    if (!found) return;
    if (itemsToPrint.some((item) => item.id === found.id)) {
      message.info('Product is already in print table. Increased quantity.');
      setItemsToPrint((prev) =>
        prev.map((item) =>
          item.id === found.id ? { ...item, printQty: (item.printQty || 1) + 5 } : item
        )
      );
      return;
    }
    setItemsToPrint((prev) => [...prev, { ...found, printQty: 10 }]);
    message.success(`Added "${found.name}" to barcode list`);
  };

  const handleRemoveItem = (id) => {
    setItemsToPrint((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateQty = (id, newQty) => {
    setItemsToPrint((prev) =>
      prev.map((item) => (item.id === id ? { ...item, printQty: Math.max(1, newQty || 1) } : item))
    );
  };

  // Generate preview label items
  const labelCards = [];
  itemsToPrint.forEach((item) => {
    const count = item.printQty || 1;
    for (let i = 0; i < count; i++) {
      labelCards.push({
        ...item,
        uniqueKey: `${item.id}-${i}`,
      });
    }
  });

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. BPAS Breadcrumb Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 20px',
          background: adminTheme.card,
          border: `1px solid ${adminTheme.border}`,
          borderRadius: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              if (onBack) onBack();
              else navigate('/admins/products');
            }}
            style={{ fontWeight: 700 }}
          >
            Back to Products
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarcodeOutlined style={{ color: '#2563eb', fontSize: 18 }} />
            <span style={{ fontSize: 18, fontWeight: 800, color: '#2563eb' }}>
              Print Barcode Label
            </span>
          </div>
        </div>

        <Button
          type="primary"
          icon={<PrinterOutlined />}
          onClick={() => window.print()}
          style={{
            fontWeight: 800,
            background: '#2563eb',
            paddingInline: 24,
          }}
        >
          Print Barcodes ({labelCards.length} Labels)
        </Button>
      </div>

      {/* 2. Top Controls & Items Table (Exact BPAS style) */}
      <Card
        style={{ borderRadius: 14, border: `1px solid ${adminTheme.border}` }}
        styles={{ body: { padding: '24px' } }}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>
            Add Product to Print:
          </label>
          <Select
            showSearch
            placeholder="Search catalog product to add..."
            style={{ width: '100%' }}
            onChange={handleAddItem}
            value={null}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={productsList.map((p) => ({
              value: p.id,
              label: `${p.name} (${p.code || 'NO-CODE'}) - ${formatCurrency(p.price)}`,
            }))}
          />
        </div>

        {/* Table of products */}
        <Table
          rowKey="id"
          dataSource={itemsToPrint}
          columns={[
            {
              title: 'Product Name (Product Code)',
              dataIndex: 'name',
              key: 'name',
              render: (name, record) => (
                <div>
                  <strong>{name}</strong>
                  <div style={{ fontSize: 11, color: adminTheme.subtext, fontFamily: 'monospace' }}>
                    {record.code}
                  </div>
                </div>
              ),
            },
            {
              title: 'Print Quantity',
              dataIndex: 'printQty',
              key: 'printQty',
              width: 160,
              render: (qty, record) => (
                <InputNumber
                  min={1}
                  max={500}
                  value={qty}
                  onChange={(val) => handleUpdateQty(record.id, val)}
                  style={{ width: 120 }}
                />
              ),
            },
            {
              title: 'Selling Price',
              dataIndex: 'price',
              key: 'price',
              width: 140,
              render: (p) => <strong style={{ color: '#16a34a' }}>{formatCurrency(p)}</strong>,
            },
            {
              title: 'Action',
              key: 'action',
              width: 80,
              align: 'center',
              render: (_, record) => (
                <Button
                  danger
                  size="small"
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveItem(record.id)}
                />
              ),
            },
          ]}
          pagination={false}
          style={{ marginBottom: 20 }}
        />

        {/* Paper style & print options */}
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12}>
            <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>
              Barcode Paper Style / Size:
            </label>
            <Select
              value={selectedPaperStyle}
              onChange={setSelectedPaperStyle}
              style={{ width: '100%' }}
            >
              <Option value="40">40 per sheet (A4) (48.5mm x 25.4mm)</Option>
              <Option value="30">30 per sheet (A4) (70mm x 29.7mm)</Option>
              <Option value="24">24 per sheet (A4) (70mm x 37mm)</Option>
              <Option value="1">1 per sheet (50 x 30mm) (Continuous Roll)</Option>
              <Option value="jewellery">Jewellery Label (Dual Tail)</Option>
              <Option value="shelf">Shelf Edge Label (Large Price)</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12}>
            <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>
              Information to Display:
            </label>
            <Space wrap>
              <Checkbox checked={printProductName} onChange={(e) => setPrintProductName(e.target.checked)}>
                Product Name
              </Checkbox>
              <Checkbox checked={printProductPrice} onChange={(e) => setPrintProductPrice(e.target.checked)}>
                Price
              </Checkbox>
              <Checkbox checked={printCurrencies} onChange={(e) => setPrintCurrencies(e.target.checked)}>
                Currencies (USD)
              </Checkbox>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 3. Live Sheet Preview Area (Printable) */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <PrinterOutlined style={{ color: '#0284c7' }} />
            <span style={{ fontWeight: 800 }}>
              Live Barcode Sheet Preview ({labelCards.length} Labels Ready)
            </span>
          </div>
        }
        style={{ borderRadius: 14, border: `1px solid ${adminTheme.border}` }}
        styles={{ body: { padding: '24px', background: '#f8fafc' } }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              selectedPaperStyle === '1'
                ? 'repeat(auto-fill, minmax(240px, 1fr))'
                : selectedPaperStyle === '40'
                ? 'repeat(4, 1fr)'
                : selectedPaperStyle === '30'
                ? 'repeat(3, 1fr)'
                : 'repeat(3, 1fr)',
            gap: 12,
            background: '#fff',
            padding: 20,
            borderRadius: 10,
            border: `1px solid ${adminTheme.border}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          }}
        >
          {labelCards.slice(0, 48).map((label) => (
            <div
              key={label.uniqueKey}
              style={{
                border: '1px dashed #cbd5e1',
                borderRadius: 6,
                padding: '10px 12px',
                textAlign: 'center',
                background: '#fff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {printProductName && (
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#1e293b',
                    maxWidth: 180,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {label.name}
                </div>
              )}

              {printProductPrice && (
                <div style={{ fontSize: 13, fontWeight: 900, color: '#16a34a', margin: '2px 0' }}>
                  {formatCurrency(label.price)}
                </div>
              )}

              {/* Barcode Mock Bars */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 2,
                  height: 32,
                  margin: '4px 0',
                }}
              >
                {[2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 2, 1, 3, 2, 1, 4, 2].map((w, idx) => (
                  <div key={idx} style={{ width: w, height: '100%', background: '#0f172a' }} />
                ))}
              </div>

              <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#64748b' }}>
                {label.code || `8858${label.id}`}
              </div>
            </div>
          ))}
        </div>

        {labelCards.length > 48 && (
          <div style={{ textAlign: 'center', marginTop: 14, color: adminTheme.subtext, fontSize: 12 }}>
            Showing first 48 labels of {labelCards.length}. All labels will print when clicking "Print Barcodes".
          </div>
        )}
      </Card>
    </div>
  );
}
