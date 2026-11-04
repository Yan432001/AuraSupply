import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Button,
  Input,
  InputNumber,
  Select,
  Row,
  Col,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  DollarOutlined,
  CreditCardOutlined,
  GiftOutlined,
  QrcodeOutlined,
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { useAdminTheme } from '../../../../hooks/useAdminTheme';

const { Text, Title } = Typography;
const { Option } = Select;

/**
 * PosCheckoutModal - Replicates cyspharma / AURA_v1 Finalize Sale Modal (add.php lines 905-1196)
 * Single unified layout:
 * - Biller, Saleman, Project, Notes
 * - Currency & Total Payable Table (USD, KHR, THB)
 * - Paid Inputs (USD amount_1, KHR amount_kh_1)
 * - Paying By dropdown (Cash, Gift Card, Credit Card, Cheque, Deposit, Other/ABA KHQR)
 * - Add More Payments (multi-tender split)
 * - Summary table: Total Items, Total Paying, Balance / Change (USD & KHR)
 * - Quick Cash vertical keypad on the right (Exact Payable, $10, $20, $50, $100, $500, Clear)
 * - Full-width Submit button
 */
const PosCheckoutModal = ({
  visible,
  onClose,
  grandTotal,
  cartItems = [],
  grossSubtotal = 0,
  totalDiscount = 0,
  orderDiscountId = null,
  khrExchangeRate = 4200,
  thbExchangeRate = 36.5,
  onFinalizePayment,
  isSubmittingSale,
  selectedCustomerName,
  billers = [],
  selectedBillerId = null,
  currentTable = 'Takeaway / Walk-in',
  t,
}) => {
  const adminTheme = useAdminTheme();
  const isDark = Boolean(adminTheme?.isDark);
  const primaryColor = adminTheme?.colorPrimary || '#2F6FED';
  const modalBg = isDark ? (adminTheme?.cardBg || '#1e293b') : '#ffffff';
  const surfaceBg = isDark ? (adminTheme?.cardMuted || '#0f172a') : '#f8fafc';
  const borderColor = isDark ? (adminTheme?.border || 'rgba(255, 255, 255, 0.12)') : '#e2e8f0';
  const textColor = isDark ? (adminTheme?.text || '#f8fafc') : '#0f172a';
  const subtextColor = isDark ? (adminTheme?.subtext || '#94a3b8') : '#64748b';
  const inputBg = isDark ? '#1e293b' : '#ffffff';
  const inputBorder = isDark ? '#334155' : '#cbd5e1';

  const totalUSD = Math.max(0, parseFloat(grandTotal) || 0);
  const totalKHR = Math.round(totalUSD * khrExchangeRate);
  const totalTHB = parseFloat((totalUSD * thbExchangeRate).toFixed(2));
  const totalItemsCount = Array.isArray(cartItems)
    ? cartItems.reduce((acc, item) => acc + (parseFloat(item.quantity) || 1), 0)
    : 0;

  // Header Selectors
  const currentBillerObj = billers.find((b) => b.id === selectedBillerId);
  const [biller, setBiller] = useState(currentBillerObj?.name || currentBillerObj?.company || 'SBC Solutions');
  const [saleman, setSaleman] = useState('Default Cashier');
  const [project, setProject] = useState('Main Project');
  const [saleNote, setSaleNote] = useState('');
  const [staffNote, setStaffNote] = useState('');

  // Primary Payment Row (amount_1, amount_kh_1, paid_by_1)
  const [paidUSD, setPaidUSD] = useState('');
  const [paidKHR, setPaidKHR] = useState('');
  const [paidBy, setPaidBy] = useState('Cash');
  const [paymentNote, setPaymentNote] = useState('');

  // Credit Card fields
  const [ccNo, setCcNo] = useState('');
  const [ccHolder, setCcHolder] = useState('');
  const [ccType, setCcType] = useState('Visa');
  const [ccMonth, setCcMonth] = useState('');
  const [ccYear, setCcYear] = useState('');
  const [ccCvv, setCcCvv] = useState('');

  // Member / Gift Card fields
  const [giftCardNo, setGiftCardNo] = useState('');
  const [giftCardBalance, setGiftCardBalance] = useState(null);
  const [loadingGiftCard, setLoadingGiftCard] = useState(false);

  // Cheque fields
  const [chequeNo, setChequeNo] = useState('');

  // Additional Payment Tenders (Multi-payment: "+ Add More Payments")
  const [additionalPayments, setAdditionalPayments] = useState([]);

  // Reset or preset state when modal opens
  useEffect(() => {
    if (visible) {
      if (currentBillerObj) {
        setBiller(currentBillerObj.name || currentBillerObj.company);
      }
      setPaidUSD(totalUSD > 0 ? totalUSD.toFixed(2) : '0');
      setPaidKHR('');
      setPaidBy('Cash');
      setPaymentNote('');
      setCcNo('');
      setCcHolder('');
      setCcType('Visa');
      setCcMonth('');
      setCcYear('');
      setCcCvv('');
      setGiftCardNo('');
      setGiftCardBalance(null);
      setChequeNo('');
      setAdditionalPayments([]);
      setSaleNote('');
      setStaffNote('');
    }
  }, [visible, totalUSD, currentBillerObj]);

  // Compute Total Paid in USD across primary and additional payments
  const totalPayingUSD = useMemo(() => {
    const primaryUSD = parseFloat(paidUSD) || 0;
    const primaryKHRInUSD = (parseFloat(paidKHR) || 0) / khrExchangeRate;
    const primaryTotal = primaryUSD + primaryKHRInUSD;

    const extraTotal = additionalPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
    return primaryTotal + extraTotal;
  }, [paidUSD, paidKHR, additionalPayments, khrExchangeRate]);

  // Compute Live Balance / Change
  const balanceUSD = totalPayingUSD - totalUSD;
  const balanceKHR = Math.round(balanceUSD * khrExchangeRate);

  // Quick Cash handlers
  const handleQuickPayableExact = () => {
    setPaidUSD(totalUSD.toFixed(2));
    setPaidKHR('');
  };

  const handleAddQuickCash = (amount) => {
    const current = parseFloat(paidUSD) || 0;
    const nextVal = (current + amount).toFixed(2);
    setPaidUSD(nextVal);
  };

  const handleAddQuickCashKHR = (khrAmount) => {
    const current = parseFloat(paidKHR) || 0;
    setPaidKHR(String(current + khrAmount));
  };

  const handleClearCash = () => {
    setPaidUSD('');
    setPaidKHR('');
  };

  // Gift Card Lookup
  const handleCheckGiftCard = async () => {
    if (!giftCardNo.trim()) {
      message.warning('Please enter a gift card or member card number');
      return;
    }
    setLoadingGiftCard(true);
    try {
      const res = await axios.post('/api/admin/pos/member-cards/validate', { card_no: giftCardNo.trim() });
      if (res.data?.success && res.data?.card) {
        setGiftCardBalance(parseFloat(res.data.card.balance) || 0);
        message.success(`Valid Card! Balance: $${parseFloat(res.data.card.balance).toFixed(2)}`);
      } else {
        setGiftCardBalance(null);
        message.error(res.data?.message || 'Invalid or expired card');
      }
    } catch (err) {
      setGiftCardBalance(null);
      message.error(err.response?.data?.message || 'Card lookup failed');
    } finally {
      setLoadingGiftCard(false);
    }
  };

  // Add Additional Split Payment Row
  const handleAddPaymentRow = () => {
    const remainingDue = Math.max(0, totalUSD - totalPayingUSD);
    setAdditionalPayments((prev) => [
      ...prev,
      {
        id: Date.now(),
        amount: remainingDue > 0 ? remainingDue.toFixed(2) : '0.00',
        paid_by: 'CreditCard',
        note: '',
      },
    ]);
  };

  const handleRemovePaymentRow = (id) => {
    setAdditionalPayments((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdatePaymentRow = (id, field, value) => {
    setAdditionalPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  // Submit Sale
  const handleSubmitSale = () => {
    if (totalPayingUSD < totalUSD && totalUSD > 0) {
      const confirmUnderpaid = window.confirm(
        `Total paid ($${totalPayingUSD.toFixed(2)}) is less than total payable ($${totalUSD.toFixed(2)}). Record as partial/due sale?`
      );
      if (!confirmUnderpaid) return;
    }

    const primaryPaymentRecord = {
      amount: parseFloat(paidUSD) || totalUSD,
      paid_by: paidBy,
      note: paymentNote || 'Primary Tender',
      cc_no: paidBy === 'CreditCard' ? ccNo : '',
      cc_holder: paidBy === 'CreditCard' ? ccHolder : '',
      paying_gift_card_no: paidBy === 'gift_card' ? giftCardNo : '',
      cheque_no: paidBy === 'cheque' ? chequeNo : '',
    };

    const allPayments = [primaryPaymentRecord, ...additionalPayments];

    onFinalizePayment({
      paymentMethod: paidBy,
      tenderedUSD: parseFloat(paidUSD) || 0,
      tenderedKHR: parseFloat(paidKHR) || 0,
      changeUSD: Math.max(0, balanceUSD),
      changeKHR: Math.max(0, balanceKHR),
      payments: allPayments,
      biller,
      saleman,
      project,
      sale_note: saleNote,
      staff_note: staffNote,
      paymentNote,
      memberCardNo: giftCardNo,
      chequeNo,
      ccNo,
      ccHolder,
      ccType,
    });
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      width={940}
      className="pos-modal pos-checkout-modal"
      centered
      styles={{
        content: {
          background: modalBg,
          borderRadius: 18,
          boxShadow: isDark ? '0 25px 60px -15px rgba(0, 0, 0, 0.6)' : '0 25px 60px -15px rgba(15, 23, 42, 0.2)',
          border: `1px solid ${borderColor}`,
          padding: '20px 24px',
        },
        header: {
          background: modalBg,
          borderBottom: `1px solid ${borderColor}`,
          paddingBottom: 14,
          marginBottom: 16,
        },
        body: {
          background: modalBg,
          padding: 0,
        },
        footer: {
          background: modalBg,
          borderTop: `1px solid ${borderColor}`,
          paddingTop: 14,
          marginTop: 16,
        },
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: `linear-gradient(135deg, ${primaryColor} 0%, #1D4ED8 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: `0 4px 10px ${primaryColor}40`,
              }}
            >
              <DollarOutlined style={{ fontSize: 18 }} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: textColor, lineHeight: 1.2 }}>
                Finalize Sale
              </div>
              <div style={{ fontSize: 11.5, color: subtextColor, fontWeight: 500 }}>
                Complete payment & print receipt
              </div>
            </div>
            <Tag
              style={{
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 20,
                background: isDark ? 'rgba(47, 111, 237, 0.15)' : '#eff6ff',
                color: primaryColor,
                borderColor: isDark ? 'rgba(47, 111, 237, 0.3)' : '#bfdbfe',
                padding: '2px 10px',
                marginLeft: 6,
              }}
            >
              Customer: {selectedCustomerName || 'Walk-in Customer'}
            </Tag>
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: subtextColor,
              background: surfaceBg,
              padding: '4px 12px',
              borderRadius: 20,
              border: `1px solid ${borderColor}`,
            }}
          >
            {totalItemsCount} {totalItemsCount === 1 ? 'Item' : 'Items'} in Order
          </div>
        </div>
      }
      footer={
        <Button
          type="primary"
          size="large"
          block
          loading={isSubmittingSale}
          onClick={handleSubmitSale}
          icon={<CheckOutlined />}
          style={{
            height: 52,
            fontSize: 17,
            fontWeight: 800,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${primaryColor} 0%, #1D4ED8 100%)`,
            borderColor: primaryColor,
            boxShadow: `0 8px 24px ${primaryColor}55`,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          Submit & Print Receipt (${totalPayingUSD.toFixed(2)})
        </Button>
      }
      destroyOnClose
    >
      <div style={{ display: 'flex', gap: 20, paddingTop: 4 }}>
        {/* LEFT COLUMN: PAYABLE, TENDERS, AND NOTES (cyspharma col-md-10) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 1. TOP HEADER DETAILS: Biller, Saleman, Project, Table */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: currentTable && currentTable !== 'Takeaway / Walk-in' ? '1fr 1fr 1fr auto' : '1fr 1fr 1fr',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              background: surfaceBg,
              borderRadius: 10,
              border: `1px solid ${borderColor}`,
            }}
          >
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: subtextColor, display: 'block', marginBottom: 2 }}>
                Biller:
              </span>
              <Select
                value={biller}
                onChange={setBiller}
                size="middle"
                style={{ width: '100%' }}
                options={
                  billers.length > 0
                    ? billers.map((b) => ({
                        value: b.name || b.company,
                        label: `🏬 ${b.name || b.company}`,
                      }))
                    : [
                        { value: 'SBC Solutions', label: 'SBC Solutions' },
                        { value: 'Main Store', label: 'Main Store' },
                        { value: 'Branch 1', label: 'Branch 1' },
                      ]
                }
              />
            </div>

            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: subtextColor, display: 'block', marginBottom: 2 }}>
                Salesman:
              </span>
              <Select
                value={saleman}
                onChange={setSaleman}
                size="middle"
                style={{ width: '100%' }}
                options={[
                  { value: 'Default Cashier', label: 'Default Cashier' },
                  { value: 'HIAN Yan', label: 'HIAN Yan' },
                  { value: 'POS Operator', label: 'POS Operator' },
                ]}
              />
            </div>

            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: subtextColor, display: 'block', marginBottom: 2 }}>
                Project:
              </span>
              <Select
                value={project}
                onChange={setProject}
                size="middle"
                style={{ width: '100%' }}
                options={[
                  { value: 'Main Project', label: 'Main Project' },
                  { value: 'Retail Sales', label: 'Retail Sales' },
                ]}
              />
            </div>

            {currentTable && currentTable !== 'Takeaway / Walk-in' && (
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: subtextColor, display: 'block', marginBottom: 2 }}>
                  Dining Table:
                </span>
                <Tag color="orange" style={{ fontSize: 13, fontWeight: 900, padding: '3px 10px', borderRadius: 8, margin: 0 }}>
                  🍽️ {currentTable}
                </Tag>
              </div>
            )}
          </div>

          {/* 2. DUAL-CURRENCY PAYABLE & PAID TABLE (cyspharma add.php lines 1000-1039) */}
          <div
            style={{
              border: `1px solid ${borderColor}`,
              borderRadius: 12,
              overflow: 'hidden',
              background: modalBg,
              boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(15, 23, 42, 0.03)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, #1D4ED8 100%)`, color: '#ffffff', fontWeight: 800, fontSize: 13 }}>
                  <th style={{ padding: '10px 14px', width: '30%' }}>Currency</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', width: '35%', borderLeft: '1px solid rgba(255, 255, 255, 0.2)' }}>
                    USD ($)
                  </th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', width: '35%', borderLeft: '1px solid rgba(255, 255, 255, 0.2)' }}>
                    KH (៛ Riel @ {khrExchangeRate.toLocaleString()})
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Total Discount Row (if any) */}
                {totalDiscount > 0 && (
                  <tr style={{ borderBottom: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.25)' : '#fee2e2'}`, background: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fff1f2' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, fontSize: 13, color: '#f43f5e' }}>
                      Discount {orderDiscountId ? `(${orderDiscountId})` : ''}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', borderLeft: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.25)' : '#fee2e2'}` }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#f43f5e' }}>
                        -${totalDiscount.toFixed(2)}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', borderLeft: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.25)' : '#fee2e2'}` }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#f43f5e' }}>
                        -៛{Math.round(totalDiscount * khrExchangeRate).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                )}

                {/* Total Payable Row */}
                <tr style={{ borderBottom: `1px solid ${borderColor}`, background: surfaceBg }}>
                  <td style={{ padding: '10px 14px', fontWeight: 700, fontSize: 13, color: isDark ? '#cbd5e1' : '#334155' }}>
                    Total Payable
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'center', borderLeft: `1px solid ${borderColor}` }}>
                    <span style={{ fontSize: 19, fontWeight: 900, color: textColor }}>
                      ${totalUSD.toFixed(2)}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'center', borderLeft: `1px solid ${borderColor}` }}>
                    <span style={{ fontSize: 19, fontWeight: 900, color: primaryColor }}>
                      ៛{totalKHR.toLocaleString()}
                    </span>
                  </td>
                </tr>

                {/* Paid Input Row */}
                <tr style={{ background: modalBg }}>
                  <td style={{ padding: '10px 14px', fontWeight: 700, fontSize: 13, color: '#10b981' }}>
                    Paid
                  </td>
                  <td style={{ padding: '8px 12px', borderLeft: `1px solid ${borderColor}` }}>
                    <Input
                      size="large"
                      prefix={<span style={{ fontWeight: 800, color: primaryColor }}>$</span>}
                      placeholder="0.00"
                      value={paidUSD}
                      onChange={(e) => setPaidUSD(e.target.value)}
                      style={{
                        fontWeight: 800,
                        fontSize: 16,
                        borderColor: primaryColor,
                        borderRadius: 8,
                        textAlign: 'right',
                        background: inputBg,
                        color: textColor,
                      }}
                      autoFocus
                    />
                  </td>
                  <td style={{ padding: '8px 12px', borderLeft: `1px solid ${borderColor}` }}>
                    <Input
                      size="large"
                      prefix={<span style={{ fontWeight: 800, color: '#5B8DEF' }}>៛</span>}
                      placeholder="0"
                      value={paidKHR}
                      onChange={(e) => setPaidKHR(e.target.value)}
                      style={{
                        fontWeight: 800,
                        fontSize: 16,
                        borderColor: inputBorder,
                        borderRadius: 8,
                        textAlign: 'right',
                        background: inputBg,
                        color: textColor,
                      }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 3. PRIMARY PAYMENT METHOD SELECTION & CONDITIONAL FIELDS */}
          <div
            style={{
              padding: '12px 14px',
              background: surfaceBg,
              borderRadius: 10,
              border: `1px solid ${borderColor}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: subtextColor, display: 'block', marginBottom: 4 }}>
                  Paying By:
                </span>
                <Select
                  value={paidBy}
                  onChange={setPaidBy}
                  size="large"
                  style={{ width: '100%', fontWeight: 700 }}
                  options={[
                    { value: 'Cash', label: '💵 Cash' },
                    { value: 'CreditCard', label: '💳 Credit Card (Visa/Master)' },
                    { value: 'gift_card', label: '🎁 Gift Card / Member Card' },
                    { value: 'other', label: '📱 ABA KHQR / Bank Transfer' },
                    { value: 'deposit', label: '🏦 Customer Deposit' },
                    { value: 'cheque', label: '📄 Cheque' },
                  ]}
                />
              </div>

              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: subtextColor, display: 'block', marginBottom: 4 }}>
                  Payment Note:
                </span>
                <Input
                  size="large"
                  placeholder="Reference number or note..."
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  style={{ background: inputBg, color: textColor, borderColor: inputBorder, borderRadius: 8 }}
                />
              </div>
            </div>

            {/* Credit Card Inputs */}
            {paidBy === 'CreditCard' && (
              <div
                style={{
                  padding: 10,
                  background: modalBg,
                  borderRadius: 8,
                  border: `1px solid ${borderColor}`,
                  display: 'grid',
                  gridTemplateColumns: '2fr 2fr 1fr 1fr',
                  gap: 8,
                }}
              >
                <Input
                  placeholder="Card Number (xxxx-xxxx-xxxx-xxxx)"
                  value={ccNo}
                  onChange={(e) => setCcNo(e.target.value)}
                  style={{ background: inputBg, color: textColor, borderColor: inputBorder }}
                />
                <Input
                  placeholder="Cardholder Name"
                  value={ccHolder}
                  onChange={(e) => setCcHolder(e.target.value)}
                  style={{ background: inputBg, color: textColor, borderColor: inputBorder }}
                />
                <Select value={ccType} onChange={setCcType}>
                  <Option value="Visa">Visa</Option>
                  <Option value="MasterCard">MasterCard</Option>
                  <Option value="UnionPay">UnionPay</Option>
                  <Option value="JCB">JCB</Option>
                </Select>
                <Input
                  placeholder="CVV"
                  maxLength={4}
                  value={ccCvv}
                  onChange={(e) => setCcCvv(e.target.value)}
                  style={{ background: inputBg, color: textColor, borderColor: inputBorder }}
                />
              </div>
            )}

            {/* Gift Card Inputs */}
            {paidBy === 'gift_card' && (
              <div
                style={{
                  padding: 10,
                  background: modalBg,
                  borderRadius: 8,
                  border: `1px solid ${borderColor}`,
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <Input
                  placeholder="Enter Member Card / Gift Card Number"
                  value={giftCardNo}
                  onChange={(e) => setGiftCardNo(e.target.value)}
                  style={{ flex: 1, background: inputBg, color: textColor, borderColor: inputBorder }}
                />
                <Button
                  type="primary"
                  loading={loadingGiftCard}
                  onClick={handleCheckGiftCard}
                  style={{ background: primaryColor, borderColor: primaryColor, borderRadius: 8 }}
                >
                  Verify Balance
                </Button>
                {giftCardBalance !== null && (
                  <Tag color="green" style={{ fontSize: 13, fontWeight: 700, padding: '4px 8px' }}>
                    Available: ${giftCardBalance.toFixed(2)}
                  </Tag>
                )}
              </div>
            )}

            {/* Cheque Inputs */}
            {paidBy === 'cheque' && (
              <div
                style={{
                  padding: 10,
                  background: modalBg,
                  borderRadius: 8,
                  border: `1px solid ${borderColor}`,
                }}
              >
                <Input
                  placeholder="Cheque Number"
                  value={chequeNo}
                  onChange={(e) => setChequeNo(e.target.value)}
                  style={{ background: inputBg, color: textColor, borderColor: inputBorder }}
                />
              </div>
            )}
          </div>

          {/* 4. MULTI-PAYMENT TENDER ROWS (cyspharma "addButton") */}
          {additionalPayments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: subtextColor }}>
                Additional Payment Split:
              </span>
              {additionalPayments.map((p, idx) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    background: modalBg,
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: subtextColor }}>
                    #{idx + 2}
                  </span>
                  <InputNumber
                    prefix="$"
                    value={p.amount}
                    onChange={(val) => handleUpdatePaymentRow(p.id, 'amount', val)}
                    style={{ width: 130 }}
                  />
                  <Select
                    value={p.paid_by}
                    onChange={(val) => handleUpdatePaymentRow(p.id, 'paid_by', val)}
                    style={{ width: 180 }}
                    options={[
                      { value: 'CreditCard', label: '💳 Credit Card' },
                      { value: 'Cash', label: '💵 Cash' },
                      { value: 'other', label: '📱 ABA KHQR' },
                      { value: 'gift_card', label: '🎁 Gift Card' },
                      { value: 'cheque', label: '📄 Cheque' },
                    ]}
                  />
                  <Input
                    placeholder="Note..."
                    value={p.note}
                    onChange={(e) => handleUpdatePaymentRow(p.id, 'note', e.target.value)}
                    style={{ flex: 1, background: inputBg, color: textColor, borderColor: inputBorder }}
                  />
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemovePaymentRow(p.id)}
                  />
                </div>
              ))}
            </div>
          )}

          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleAddPaymentRow}
            style={{ borderRadius: 8, fontWeight: 700, color: primaryColor, borderColor: `${primaryColor}60`, background: isDark ? 'rgba(47, 111, 237, 0.08)' : '#f8faff' }}
          >
            + Add More Payments (Split Bill)
          </Button>

          {/* 5. NOTES (Sale Note & Staff Note) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Input.TextArea
              rows={2}
              placeholder="Sale Note (Printed on Receipt)"
              value={saleNote}
              onChange={(e) => setSaleNote(e.target.value)}
              style={{ borderRadius: 8, background: inputBg, color: textColor, borderColor: inputBorder }}
            />
            <Input.TextArea
              rows={2}
              placeholder="Staff Note (Internal Cashier Log)"
              value={staffNote}
              onChange={(e) => setStaffNote(e.target.value)}
              style={{ borderRadius: 8, background: inputBg, color: textColor, borderColor: inputBorder }}
            />
          </div>

          {/* 6. BOTTOM SUMMARY TABLE: Total Items, Total Paying, Balance (lines 1150-1177) */}
          <div
            style={{
              background: surfaceBg,
              borderRadius: 10,
              border: `1px solid ${borderColor}`,
              padding: '12px 16px',
            }}
          >
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ width: '25%', color: subtextColor, fontWeight: 600 }}>Total Items:</td>
                  <td style={{ width: '25%', fontWeight: 800, color: textColor }}>
                    {totalItemsCount}
                  </td>
                  <td style={{ width: '25%', color: subtextColor, fontWeight: 600 }}>Total Paying:</td>
                  <td style={{ width: '25%', fontWeight: 800, fontSize: 16, color: primaryColor, textAlign: 'right' }}>
                    ${totalPayingUSD.toFixed(2)}
                  </td>
                </tr>
                <tr style={{ height: 10 }} />
                <tr style={{ borderTop: `1px solid ${borderColor}`, paddingTop: 8 }}>
                  <td style={{ color: isDark ? '#cbd5e1' : '#475569', fontWeight: 700, fontSize: 14 }}>Balance / Change:</td>
                  <td colSpan={3} style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontSize: 19,
                        fontWeight: 900,
                        color: balanceUSD >= 0 ? '#10b981' : '#ef4444',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span>${balanceUSD >= 0 ? balanceUSD.toFixed(2) : `(${Math.abs(balanceUSD).toFixed(2)})`}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: subtextColor }}>
                        (៛{Math.abs(balanceKHR).toLocaleString()})
                      </span>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: QUICK CASH KEYPAD (cyspharma col-md-2 text-center lines 1181-1191) */}
        <div
          style={{
            width: 176,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: '12px 10px',
            background: surfaceBg,
            borderRadius: 12,
            border: `1px solid ${borderColor}`,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: textColor, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 2 }}>
            <DollarOutlined style={{ color: primaryColor }} />
            <span>Quick Cash</span>
          </div>

          {/* Exact Payable Quick Button */}
          <button
            type="button"
            onClick={handleQuickPayableExact}
            style={{
              height: 42,
              fontSize: 14,
              fontWeight: 800,
              background: `linear-gradient(135deg, ${primaryColor} 0%, #1D4ED8 100%)`,
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              boxShadow: `0 4px 12px ${primaryColor}40`,
              transition: 'all 0.15s ease',
            }}
          >
            Exact (${totalUSD.toFixed(2)})
          </button>

          {/* Presets in USD */}
          {[10, 20, 50, 100, 500].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => handleAddQuickCash(amt)}
              style={{
                height: 36,
                fontSize: 13.5,
                fontWeight: 700,
                background: isDark ? '#1e293b' : '#ffffff',
                color: textColor,
                border: `1px solid ${inputBorder}`,
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isDark ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = primaryColor;
                e.currentTarget.style.color = primaryColor;
                e.currentTarget.style.background = isDark ? 'rgba(47, 111, 237, 0.15)' : '#eff6ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = inputBorder;
                e.currentTarget.style.color = textColor;
                e.currentTarget.style.background = isDark ? '#1e293b' : '#ffffff';
              }}
            >
              + ${amt}
            </button>
          ))}

          {/* Presets in KHR (Riel) */}
          <button
            type="button"
            onClick={() => handleAddQuickCashKHR(50000)}
            style={{
              height: 34,
              fontSize: 12,
              fontWeight: 700,
              background: isDark ? 'rgba(47, 111, 237, 0.15)' : '#eff6ff',
              color: primaryColor,
              border: `1px solid ${isDark ? 'rgba(47, 111, 237, 0.3)' : '#bfdbfe'}`,
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(47, 111, 237, 0.25)' : '#dbeafe';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(47, 111, 237, 0.15)' : '#eff6ff';
            }}
          >
            + ៛50,000
          </button>

          <button
            type="button"
            onClick={() => handleAddQuickCashKHR(100000)}
            style={{
              height: 34,
              fontSize: 12,
              fontWeight: 700,
              background: isDark ? 'rgba(47, 111, 237, 0.15)' : '#eff6ff',
              color: primaryColor,
              border: `1px solid ${isDark ? 'rgba(47, 111, 237, 0.3)' : '#bfdbfe'}`,
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(47, 111, 237, 0.25)' : '#dbeafe';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(47, 111, 237, 0.15)' : '#eff6ff';
            }}
          >
            + ៛100,000
          </button>

          {/* Clear Button */}
          <button
            type="button"
            onClick={handleClearCash}
            style={{
              height: 34,
              fontSize: 13,
              fontWeight: 700,
              background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fff1f2',
              color: isDark ? '#f87171' : '#e11d48',
              border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecdd3'}`,
              borderRadius: 8,
              cursor: 'pointer',
              marginTop: 2,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(239, 68, 68, 0.25)' : '#ffe4e6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(239, 68, 68, 0.15)' : '#fff1f2';
            }}
          >
            Clear
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PosCheckoutModal;
