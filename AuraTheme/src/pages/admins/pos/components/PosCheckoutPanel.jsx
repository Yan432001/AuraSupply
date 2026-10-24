import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Select,
  Button,
  Input,
  InputNumber,
  Tag,
  Typography,
  Divider,
  Space,
  Row,
  Col,
  Tooltip,
  Badge,
  Popconfirm
} from 'antd';
import {
  UserOutlined,
  UserAddOutlined,
  ShopOutlined,
  DollarOutlined,
  CreditCardOutlined,
  QrcodeOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  ClearOutlined,
  PauseCircleOutlined,
  ThunderboltFilled,
  PercentageOutlined,
  CarOutlined,
  BankOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { formatCurrency } from '../../../../utils/uiTheme';

const { Text, Title } = Typography;
const { Option } = Select;

const PosCheckoutPanel = ({
  cart = [],
  customers = [],
  selectedCustomerId,
  setSelectedCustomerId,
  onOpenQuickAddCustomer,
  warehouses = [],
  selectedWarehouseId,
  setSelectedWarehouseId,
  billers = [],
  selectedBillerId,
  setSelectedBillerId,
  grossSubtotal = 0,
  cartSubtotal = 0,
  productDiscountTotal = 0,
  orderDiscountAmount = 0,
  totalDiscount = 0,
  taxAmount = 0,
  shippingFee = 0,
  grandTotalUSD = 0,
  khrExchangeRate = 4200,
  onOpenOrderDiscount,
  onOpenOrderTax,
  onOpenDeliveryFee,
  onFinalizePayment,
  isSubmittingSale = false,
  onPrintBill,
  onHoldOrder,
  onClearCart,
  onOpenSplitPayment,
  themeMode,
  adminTheme = {},
  t = (k, def) => def || k,
}) => {
  const isDark = themeMode === 'dark';

  // Tender Method (Cash, bank_transfer, card, cheque, gift_card)
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [tenderUSD, setTenderUSD] = useState(grandTotalUSD > 0 ? grandTotalUSD.toFixed(2) : '0.00');
  const [tenderKHR, setTenderKHR] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  // Auto-sync tenderUSD when grand total changes and tender equals previous total
  useEffect(() => {
    if (grandTotalUSD > 0) {
      setTenderUSD(grandTotalUSD.toFixed(2));
      setTenderKHR('');
    } else {
      setTenderUSD('0.00');
      setTenderKHR('');
    }
  }, [grandTotalUSD]);

  // Conversions & Change
  const totalKHR = Math.round(grandTotalUSD * khrExchangeRate);
  const parsedTenderUSD = parseFloat(tenderUSD) || 0;
  const parsedTenderKHR = parseFloat(tenderKHR) || 0;
  const totalTenderedUSD = parsedTenderUSD + (parsedTenderKHR / khrExchangeRate);

  const isExactOrOverpaid = totalTenderedUSD >= grandTotalUSD && grandTotalUSD > 0;
  const changeUSD = Math.max(0, totalTenderedUSD - grandTotalUSD);
  const changeKHR = Math.round(changeUSD * khrExchangeRate);
  const balanceDueUSD = Math.max(0, grandTotalUSD - totalTenderedUSD);

  const selectedCustomerObj = customers.find(c => c.id === selectedCustomerId);
  const totalItemCount = cart.reduce((sum, it) => sum + (parseFloat(it.quantity) || 1), 0);

  // Quick Cash Denomination Buttons
  const handleQuickCash = (amount) => {
    setTenderUSD(Number(amount).toFixed(2));
    setTenderKHR('');
  };

  const handleQuickKhr = (amountKhr) => {
    setTenderKHR(String(amountKhr));
    setTenderUSD('0.00');
  };

  const handleExactCash = () => {
    setTenderUSD(grandTotalUSD.toFixed(2));
    setTenderKHR('');
  };

  // Submit Direct Payment
  const handleCheckoutSubmit = () => {
    if (cart.length === 0) return;

    onFinalizePayment({
      paymentMethod,
      tenderedUSD: parsedTenderUSD,
      tenderedKHR: parsedTenderKHR,
      changeUSD,
      changeKHR,
      paymentNote,
      payments: [
        {
          amount: Math.min(grandTotalUSD, totalTenderedUSD > 0 ? totalTenderedUSD : grandTotalUSD),
          paid_by: paymentMethod,
          note: paymentNote || `${paymentMethod} POS Tender`
        }
      ]
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: isDark ? (adminTheme.card || '#0f172a') : '#ffffff',
        borderLeft: `1px solid ${isDark ? 'rgba(51, 65, 85, 0.4)' : '#e2e8f0'}`,
        overflowY: 'auto',
      }}
    >
      {/* 1. Header: Customer & Store Selectors */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${isDark ? 'rgba(51, 65, 85, 0.4)' : '#f1f5f9'}`,
          background: isDark ? 'rgba(15, 23, 42, 0.7)' : '#f8fafc',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text strong style={{ fontSize: '13px', color: isDark ? '#f8fafc' : '#0f172a' }}>
            <UserOutlined style={{ marginRight: 6, color: '#2563eb' }} />
            {t('customer', 'Customer')}
          </Text>
          <Button
            type="link"
            size="small"
            icon={<UserAddOutlined />}
            onClick={onOpenQuickAddCustomer}
            style={{ padding: 0, height: 'auto', fontSize: '12px' }}
          >
            {t('new_customer', '+ New')}
          </Button>
        </div>

        <Select
          showSearch
          value={selectedCustomerId}
          onChange={setSelectedCustomerId}
          placeholder="Select or Search Customer"
          style={{ width: '100%', marginBottom: 10 }}
          filterOption={(input, option) =>
            (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
          }
        >
          {customers.map((c) => (
            <Option key={c.id} value={c.id}>
              {c.name || c.company || 'Customer'} {c.phone ? `(${c.phone})` : ''}
            </Option>
          ))}
        </Select>

        {/* Warehouse & Biller Quick Info */}
        <Row gutter={8}>
          <Col span={12}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: 2 }}>{t('warehouse', 'Warehouse')}:</div>
            <Select
              size="small"
              value={selectedWarehouseId}
              onChange={setSelectedWarehouseId}
              style={{ width: '100%', fontSize: '11px' }}
            >
              {warehouses.map(w => (
                <Option key={w.id} value={w.id}>{w.name || w.code}</Option>
              ))}
            </Select>
          </Col>
          <Col span={12}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: 2 }}>{t('branch_biller', 'Branch')}:</div>
            <Select
              size="small"
              value={selectedBillerId}
              onChange={setSelectedBillerId}
              style={{ width: '100%', fontSize: '11px' }}
            >
              {billers.map(b => (
                <Option key={b.id} value={b.id}>{b.company || b.name}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      </div>

      {/* 2. Middle Content: Financial Summary & Tender Station */}
      <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        
        {/* Financial Breakdown Table */}
        <div
          style={{
            background: isDark ? '#1e293b' : '#f8fafc',
            borderRadius: 12,
            padding: '12px 14px',
            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontSize: 12, color: '#64748b' }}>
              {t('items_subtotal', 'Items Subtotal')} ({totalItemCount} pcs):
            </Text>
            <Text strong style={{ fontSize: 13, color: isDark ? '#f8fafc' : '#1e293b' }}>
              {formatCurrency(grossSubtotal)}
            </Text>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              {t('discounts', 'Discounts')}:
              <Button type="link" size="small" onClick={onOpenOrderDiscount} style={{ padding: '0 4px', height: 'auto', fontSize: 11 }}>
                <PercentageOutlined />
              </Button>
            </span>
            <Text style={{ fontSize: 12, color: totalDiscount > 0 ? '#ef4444' : '#64748b', fontWeight: 600 }}>
              {totalDiscount > 0 ? `-${formatCurrency(totalDiscount)}` : '$0.00'}
            </Text>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              {t('order_tax', 'Tax')}:
              <Button type="link" size="small" onClick={onOpenOrderTax} style={{ padding: '0 4px', height: 'auto', fontSize: 11 }}>
                <DollarOutlined />
              </Button>
            </span>
            <Text style={{ fontSize: 12, color: isDark ? '#cbd5e1' : '#475569' }}>
              +{formatCurrency(taxAmount)}
            </Text>
          </div>

          {shippingFee > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                {t('shipping', 'Delivery')}:
                <Button type="link" size="small" onClick={onOpenDeliveryFee} style={{ padding: '0 4px', height: 'auto', fontSize: 11 }}>
                  <CarOutlined />
                </Button>
              </span>
              <Text style={{ fontSize: 12, color: isDark ? '#cbd5e1' : '#475569' }}>
                +{formatCurrency(shippingFee)}
              </Text>
            </div>
          )}

          <Divider style={{ margin: '8px 0' }} />

          {/* Prominent Payable Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>
                {t('total_payable', 'Total Payable')}
              </div>
              <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>
                ៛{totalKHR.toLocaleString()} KHR
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#2563eb' }}>
              {formatCurrency(grandTotalUSD)}
            </div>
          </div>
        </div>

        {/* Payment Method Selector Grid */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#64748b', textTransform: 'uppercase' }}>
            {t('payment_method', 'Payment Method')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {[
              { key: 'Cash', label: 'Cash', icon: <DollarOutlined />, color: '#16a34a' },
              { key: 'bank_transfer', label: 'ABA / QR', icon: <QrcodeOutlined />, color: '#0284c7' },
              { key: 'CreditCard', label: 'Card', icon: <CreditCardOutlined />, color: '#8b5cf6' },
              { key: 'cheque', label: 'Cheque', icon: <BankOutlined />, color: '#f59e0b' },
            ].map(m => {
              const isSelected = paymentMethod === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setPaymentMethod(m.key)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: 8,
                    border: `1.5px solid ${isSelected ? m.color : isDark ? '#334155' : '#e2e8f0'}`,
                    background: isSelected ? (isDark ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.08)') : isDark ? '#1e293b' : '#ffffff',
                    color: isSelected ? m.color : isDark ? '#cbd5e1' : '#475569',
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: 15, color: isSelected ? m.color : 'inherit' }}>{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Tender Keypad */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>
              {t('tendered_amount', 'Amount Tendered ($)')}:
            </span>
            <Button
              type="link"
              size="small"
              onClick={handleExactCash}
              style={{ fontSize: 11, padding: 0, height: 'auto', fontWeight: 700, color: '#16a34a' }}
            >
              Exact ($ {grandTotalUSD.toFixed(2)})
            </Button>
          </div>

          <InputNumber
            value={tenderUSD}
            onChange={(val) => setTenderUSD(val !== null ? String(val) : '0')}
            min={0}
            step={0.5}
            prefix="$"
            style={{ width: '100%', fontSize: 16, fontWeight: 700, marginBottom: 8 }}
          />

          {/* Quick Cash Chips */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginBottom: 8 }}>
            {['5', '10', '20', '50', '100'].map(amt => (
              <Button
                key={amt}
                size="small"
                onClick={() => handleQuickCash(amt)}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 6,
                  background: isDark ? '#1e293b' : '#f1f5f9',
                  borderColor: isDark ? '#334155' : '#cbd5e1',
                  color: isDark ? '#cbd5e1' : '#334155'
                }}
              >
                ${amt}
              </Button>
            ))}
          </div>

          {/* KHR Quick Tender Chips */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
            {[
              { val: 10000, label: '៛10K' },
              { val: 50000, label: '៛50K' },
              { val: 100000, label: '៛100K' }
            ].map(k => (
              <Button
                key={k.val}
                size="small"
                onClick={() => handleQuickKhr(k.val)}
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  borderRadius: 6,
                  background: isDark ? '#1e293b' : '#f8fafc',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  color: '#64748b'
                }}
              >
                {k.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Change or Balance Due Display */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            background: isExactOrOverpaid
              ? (isDark ? 'rgba(22, 163, 74, 0.15)' : '#f0fdf4')
              : (isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2'),
            border: `1px solid ${isExactOrOverpaid ? '#86efac' : '#fca5a5'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: isExactOrOverpaid ? '#15803d' : '#b91c1c' }}>
              {isExactOrOverpaid ? t('change_return', 'Change to Return') : t('balance_due', 'Outstanding Due')}
            </div>
            {isExactOrOverpaid && (
              <div style={{ fontSize: 11, color: '#16a34a' }}>
                ៛{changeKHR.toLocaleString()} KHR
              </div>
            )}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: isExactOrOverpaid ? '#16a34a' : '#ef4444' }}>
            {formatCurrency(isExactOrOverpaid ? changeUSD : balanceDueUSD)}
          </div>
        </div>
      </div>

      {/* 3. Bottom Sticky Action Station */}
      <div
        style={{
          padding: '14px 16px',
          borderTop: `1px solid ${isDark ? 'rgba(51, 65, 85, 0.4)' : '#e2e8f0'}`,
          background: isDark ? 'rgba(15, 23, 42, 0.85)' : '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {/* Main Pay / Checkout Button */}
        <Button
          type="primary"
          size="large"
          loading={isSubmittingSale}
          disabled={cart.length === 0}
          onClick={handleCheckoutSubmit}
          icon={<CheckCircleOutlined />}
          style={{
            height: 48,
            fontSize: 16,
            fontWeight: 800,
            borderRadius: 10,
            background: cart.length > 0 ? '#16a34a' : undefined,
            borderColor: cart.length > 0 ? '#16a34a' : undefined,
            boxShadow: cart.length > 0 ? '0 4px 12px rgba(22, 163, 74, 0.35)' : 'none',
          }}
        >
          {t('complete_sale_print', 'COMPLETE SALE & PRINT')}
        </Button>

        {/* Secondary Utility Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Button
            icon={<PrinterOutlined />}
            onClick={onPrintBill}
            disabled={cart.length === 0}
            style={{ borderRadius: 8, fontSize: 12, fontWeight: 600 }}
          >
            {t('print_bill', 'Print Bill')}
          </Button>

          <Button
            icon={<PauseCircleOutlined />}
            onClick={onHoldOrder}
            disabled={cart.length === 0}
            style={{ borderRadius: 8, fontSize: 12, fontWeight: 600 }}
          >
            {t('hold_bill', 'Hold Bill')}
          </Button>
        </div>

        {/* Advanced Split Tender Link */}
        <div style={{ textAlign: 'center', marginTop: 2 }}>
          <Button
            type="link"
            size="small"
            onClick={onOpenSplitPayment}
            style={{ fontSize: 11.5, color: '#2563eb', padding: 0, height: 'auto' }}
          >
            {t('split_tender_advanced', 'Multi-Tender / Split Payments →')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PosCheckoutPanel;
