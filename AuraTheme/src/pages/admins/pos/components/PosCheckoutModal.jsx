import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Input,
  Tag,
  Divider,
  Alert,
  Tabs,
  Space,
  QRCode,
} from 'antd';
import {
  CreditCardOutlined,
  DollarOutlined,
  QrcodeOutlined,
  GiftOutlined,
  BankOutlined,
  FileTextOutlined,
  CheckCircleFilled,
  PrinterOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const PosCheckoutModal = ({
  visible,
  onClose,
  grandTotal,
  khrExchangeRate = 4200,
  thbExchangeRate = 36.5,
  onFinalizePayment,
  isSubmittingSale,
  selectedCustomerName,
  themeMode,
  adminTheme,
  t,
}) => {
  const isDark = themeMode === 'dark';
  const totalKHR = Math.round(grandTotal * khrExchangeRate);
  const totalTHB = (grandTotal * thbExchangeRate).toFixed(2);

  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [tenderedUSD, setTenderedUSD] = useState('');
  const [tenderedKHR, setTenderedKHR] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [memberCardNo, setMemberCardNo] = useState('');
  const [memberCardData, setMemberCardData] = useState(null);
  const [memberCardError, setMemberCardError] = useState(null);
  const [paymentNote, setPaymentNote] = useState('');

  // Reset or set default tendered when modal opens
  useEffect(() => {
    if (visible) {
      setPaymentMethod('Cash');
      setTenderedUSD(grandTotal > 0 ? grandTotal.toFixed(2) : '');
      setTenderedKHR('');
      setCouponCode('');
      setCouponDiscount(0);
      setMemberCardNo('');
      setMemberCardData(null);
      setMemberCardError(null);
      setPaymentNote('');
    }
  }, [visible, grandTotal]);

  // Net payable after coupon
  const payableUSD = Math.max(0, grandTotal - couponDiscount);
  const payableKHR = Math.round(payableUSD * khrExchangeRate);

  // Total amount tendered converted to USD
  const tenderedUSDNum = parseFloat(tenderedUSD || 0);
  const tenderedKHRNum = parseFloat(tenderedKHR || 0);
  const totalTenderedInUSD = tenderedUSDNum + (tenderedKHRNum / khrExchangeRate);

  // Change Due calculation
  const changeUSD = totalTenderedInUSD - payableUSD;
  const isFullyPaid = totalTenderedInUSD >= (payableUSD - 0.001);
  const changeKHR = Math.round(Math.max(0, changeUSD) * khrExchangeRate);

  // Handle Quick Cash Presets
  const handleQuickUSD = (amount) => {
    setTenderedUSD(parseFloat(amount).toFixed(2));
    setTenderedKHR('');
  };

  const handleQuickKHR = (amount) => {
    setTenderedKHR(amount.toString());
    setTenderedUSD('0.00');
  };

  // Validate Member Card
  const handleCheckMemberCard = async () => {
    if (!memberCardNo.trim()) return;
    try {
      const res = await axios.post('/api/admin/pos/member-cards/validate', { card_no: memberCardNo.trim() });
      if (res.data?.success) {
        setMemberCardData(res.data.card);
        setMemberCardError(null);
      } else {
        setMemberCardData(null);
        setMemberCardError(res.data?.message || 'Member card not found');
      }
    } catch (err) {
      setMemberCardData(null);
      setMemberCardError(err.response?.data?.message || 'Invalid or expired card');
    }
  };

  // Validate Coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await axios.post('/api/admin/pos/coupons/validate', { code: couponCode.trim() });
      if (res.data?.success) {
        setCouponDiscount(res.data.discount_value || 0);
      } else {
        setCouponDiscount(0);
      }
    } catch (err) {
      setCouponDiscount(0);
    }
  };

  // Submit Final Sale
  const handleSubmitSale = () => {
    onFinalizePayment({
      paymentMethod,
      tenderedUSD: tenderedUSDNum,
      tenderedKHR: tenderedKHRNum,
      changeUSD: Math.max(0, changeUSD),
      changeKHR: Math.max(0, changeKHR),
      couponDiscount,
      couponCode,
      memberCardNo,
      paymentNote,
    });
  };

  const paymentTabs = [
    {
      key: 'Cash',
      label: (
        <span>
          <DollarOutlined /> Cash
        </span>
      ),
    },
    {
      key: 'ABA_KHQR',
      label: (
        <span>
          <QrcodeOutlined /> ABA / KHQR
        </span>
      ),
    },
    {
      key: 'CreditCard',
      label: (
        <span>
          <CreditCardOutlined /> Credit Card
        </span>
      ),
    },
    {
      key: 'MemberCard',
      label: (
        <span>
          <GiftOutlined /> Member Card
        </span>
      ),
    },
    {
      key: 'BankTransfer',
      label: (
        <span>
          <BankOutlined /> Bank Transfer
        </span>
      ),
    },
  ];

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={680}
      centered
      destroyOnClose
      style={{ borderRadius: 20, overflow: 'hidden' }}
      styles={{ body: { padding: '24px 28px' } }}
    >
      {/* 1. MODAL HEADER: Payable in 3 Currencies */}
      <div
        style={{
          borderRadius: 16,
          padding: '16px 20px',
          background: isDark ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
          border: `1px solid ${isDark ? '#334155' : '#bfdbfe'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>
            Total Amount Payable ({selectedCustomerName || 'Walk-in'})
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981', marginTop: 2 }}>
            ៛{payableKHR.toLocaleString()} KHR <span style={{ fontSize: 12, color: '#64748b' }}>• ฿{totalTHB} THB</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#2563eb', lineHeight: 1 }}>
            ${payableUSD.toFixed(2)}
          </div>
          {couponDiscount > 0 && (
            <Tag color="red" style={{ fontSize: 10, borderRadius: 4, marginTop: 4, margin: 0 }}>
              -${couponDiscount.toFixed(2)} Coupon applied
            </Tag>
          )}
        </div>
      </div>

      {/* 2. PAYMENT METHOD TABS */}
      <Tabs
        activeKey={paymentMethod}
        onChange={setPaymentMethod}
        items={paymentTabs}
        style={{ marginBottom: 16 }}
      />

      {/* 3. CONDITIONAL TENDER INTERFACES */}
      {paymentMethod === 'Cash' && (
        <div>
          {/* Quick USD Buttons */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
              Quick USD ($):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
              {[payableUSD, 1, 5, 10, 20, 50, 100].slice(0, 6).map((val, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickUSD(val)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    background: tenderedUSDNum === val ? '#2563eb' : isDark ? '#1e293b' : '#ffffff',
                    color: tenderedUSDNum === val ? '#ffffff' : isDark ? '#cbd5e1' : '#1e293b',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {idx === 0 ? `Exact ($${val.toFixed(2)})` : `$${val}`}
                </button>
              ))}
            </div>
          </div>

          {/* Quick KHR Buttons */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
              Quick Riel (៛):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {[5000, 10000, 20000, 50000, 100000].map((khrVal, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickKHR(khrVal)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    background: tenderedKHRNum === khrVal ? '#10b981' : isDark ? '#1e293b' : '#ffffff',
                    color: tenderedKHRNum === khrVal ? '#ffffff' : isDark ? '#cbd5e1' : '#1e293b',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  ៛{khrVal.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Dual Currency Tender Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                Cash Tendered (USD $)
              </label>
              <Input
                size="large"
                prefix={<span style={{ fontWeight: 800, color: '#2563eb' }}>$</span>}
                type="number"
                step="any"
                min="0"
                value={tenderedUSD}
                onChange={(e) => setTenderedUSD(e.target.value)}
                style={{ borderRadius: 10, fontSize: 18, fontWeight: 800 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                Cash Tendered (Khmer Riel ៛)
              </label>
              <Input
                size="large"
                prefix={<span style={{ fontWeight: 800, color: '#10b981' }}>៛</span>}
                type="number"
                step="100"
                min="0"
                value={tenderedKHR}
                onChange={(e) => setTenderedKHR(e.target.value)}
                style={{ borderRadius: 10, fontSize: 18, fontWeight: 800 }}
              />
            </div>
          </div>

          {/* Change Calculation Box */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 12,
              background: isFullyPaid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${isFullyPaid ? '#86efac' : '#fca5a5'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: isFullyPaid ? '#15803d' : '#b91c1c' }}>
                {isFullyPaid ? 'Change to Return' : 'Underpaid / Remaining'}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: isFullyPaid ? '#16a34a' : '#dc2626' }}>
                {isFullyPaid ? `៛${changeKHR.toLocaleString()} KHR` : 'Please tender full amount'}
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: isFullyPaid ? '#16a34a' : '#dc2626' }}>
              ${Math.abs(changeUSD).toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {paymentMethod === 'ABA_KHQR' && (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div
            style={{
              width: 200,
              height: 200,
              margin: '0 auto 12px',
              padding: 10,
              background: '#ffffff',
              borderRadius: 16,
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              border: '2px solid #ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <QRCode
              value={`KHQR:AURA-ERP:AMOUNT=${payableUSD}:CUR=USD:REF=${Date.now()}`}
              size={180}
              bordered={false}
            />
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#ef4444' }}>
            KHQR • Scan to Pay ${payableUSD.toFixed(2)} (៛{payableKHR.toLocaleString()})
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Accepts ABA Mobile, ACLEDA, Wing, Canadia, and all Bakong member banking apps
          </div>
        </div>
      )}

      {paymentMethod === 'MemberCard' && (
        <div style={{ padding: '8px 0' }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
              Swipe or Enter Member / VIP Card Number:
            </label>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                size="large"
                placeholder="Scan or enter 16-digit card number"
                value={memberCardNo}
                onChange={(e) => setMemberCardNo(e.target.value)}
                onPressEnter={handleCheckMemberCard}
              />
              <Button type="primary" size="large" onClick={handleCheckMemberCard} style={{ background: '#2563eb' }}>
                Verify Card
              </Button>
            </Space.Compact>
          </div>

          {memberCardError && (
            <Alert message={memberCardError} type="error" showIcon style={{ marginBottom: 12, borderRadius: 8 }} />
          )}

          {memberCardData && (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
                border: '1px solid #fbcfe8',
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#be185d' }}>
                    VIP Card: {memberCardData.card_no}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    Card Holder: {memberCardData.customer_name || 'VIP Member'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#9d174d', fontWeight: 600 }}>Available Balance</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#be185d' }}>
                    ${parseFloat(memberCardData.balance || 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. COUPON / PROMO VOUCHER ACCORDION */}
      <div style={{ marginBottom: 14 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            size="middle"
            placeholder="Coupon or Voucher Code (Optional)"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            style={{ borderRadius: '8px 0 0 8px' }}
          />
          <Button onClick={handleApplyCoupon} style={{ borderRadius: '0 8px 8px 0' }}>
            Apply Code
          </Button>
        </Space.Compact>
      </div>

      {/* 5. PAYMENT NOTE */}
      <div style={{ marginBottom: 20 }}>
        <Input
          size="middle"
          placeholder="Payment remarks / invoice note (optional)"
          value={paymentNote}
          onChange={(e) => setPaymentNote(e.target.value)}
          style={{ borderRadius: 8 }}
        />
      </div>

      {/* 6. SUBMIT BUTTON */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
        <Button size="large" onClick={onClose} style={{ borderRadius: 12, height: 48, fontWeight: 700 }}>
          Cancel (Esc)
        </Button>

        <Button
          type="primary"
          size="large"
          icon={<PrinterOutlined />}
          onClick={handleSubmitSale}
          loading={isSubmittingSale}
          disabled={paymentMethod === 'Cash' && !isFullyPaid}
          style={{
            height: 48,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #0284c7 100%)',
            fontSize: 15,
            fontWeight: 800,
            border: 'none',
            boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)',
          }}
        >
          CONFIRM & PRINT RECEIPT (↵)
        </Button>
      </div>
    </Modal>
  );
};

export default PosCheckoutModal;
