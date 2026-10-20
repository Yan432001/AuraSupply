import React, { useState } from 'react';
import {
  Modal,
  Button,
  Segmented,
  Tag,
  Divider,
  QRCode,
  Tooltip,
  Space,
} from 'antd';
import {
  PrinterOutlined,
  DownloadOutlined,
  SwapOutlined,
  CheckCircleFilled,
  PlusOutlined,
  FileTextOutlined,
  BankOutlined,
  BarcodeOutlined,
  BgColorsOutlined,
} from '@ant-design/icons';

// Preset color palette for quick biller color preview / selection
const BILLER_COLOR_PRESETS = [
  { label: 'Royal Blue', value: '#2563eb' },
  { label: 'Teal / CarePoint', value: '#0d9488' },
  { label: 'Orange / Coffee', value: '#ea580c' },
  { label: 'Rose / Bakery', value: '#f43f5e' },
  { label: 'Emerald / Green', value: '#10b981' },
  { label: 'Amber / Bistro', value: '#f59e0b' },
  { label: 'Cyan / Tech', value: '#06b6d4' },
  { label: 'Purple / Books', value: '#7c3aed' },
  { label: 'Slate / Apparel', value: '#475569' },
];

const PosReceiptModal = ({
  visible,
  onClose,
  invoice,
  onNextSale,
  billerColor,
  billerInfo,
  khrExchangeRate = 4200,
  thbExchangeRate = 36.5,
  themeMode,
  adminTheme,
  t,
}) => {
  // Transfer state: 'default' (Default Invoice) vs 'tax' (Tax Invoice) vs 'thermal' (80mm Slip)
  const [invoiceType, setInvoiceType] = useState('default');
  const [selectedColor, setSelectedColor] = useState(null);

  if (!invoice) return null;

  // Active Biller Color: custom selected -> biller prop -> invoice biller_color -> fallback
  const activeBillerColor =
    selectedColor ||
    billerColor ||
    invoice.biller_color ||
    invoice.theme_color ||
    billerInfo?.theme_color ||
    '#2563eb';

  // Toggle / Transfer back and forth button handler
  const handleTransferBackAndForth = () => {
    setInvoiceType((prev) => (prev === 'tax' ? 'default' : 'tax'));
  };

  const totalUSD = parseFloat(invoice.grand_total || invoice.total || 0);
  const totalKHR = Math.round(totalUSD * khrExchangeRate);
  const totalTHB = (totalUSD * thbExchangeRate).toFixed(2);

  // GDT Tax calculations (10% VAT standard)
  const rawTax = parseFloat(invoice.tax_amount || invoice.tax || (totalUSD * 0.1 / 1.1) || 0);
  const rawSubtotalExclTax = Math.max(0, totalUSD - rawTax);
  const subtotalKHR = Math.round(rawSubtotalExclTax * khrExchangeRate);
  const taxKHR = Math.round(rawTax * khrExchangeRate);

  const tenderedUSD = parseFloat(invoice.tendered_usd || invoice.paid || totalUSD);
  const tenderedKHR = parseFloat(invoice.tendered_khr || 0);
  const changeUSD = parseFloat(invoice.change_usd || 0);
  const changeKHR = Math.round(changeUSD * khrExchangeRate);

  const billerName = invoice.biller_name || billerInfo?.name || 'AURA Supply & Retail Co., Ltd.';
  const billerCompany = invoice.biller_company || billerInfo?.company || billerName;
  const billerNameKh = invoice.biller_name_kh || billerInfo?.name_kh || 'អូរ៉ា សឹបផ្លាយ';
  const billerCompanyKh = invoice.biller_company_kh || billerInfo?.company_kh || billerNameKh;
  const billerVatNo = invoice.biller_vat_no || billerInfo?.vat_no || 'K001-929394959';
  const billerAddress = invoice.biller_address || billerInfo?.address || '#128 Monivong Blvd, Phnom Penh, Cambodia';
  const billerAddressKh = invoice.biller_address_kh || billerInfo?.address_kh || 'អគារ ១២៨ មហាវិថីព្រះមុនីវង្ស រាជធានីភ្នំពេញ';
  const billerPhone = invoice.biller_phone || billerInfo?.phone || '+855 12 345 678';
  const billerEmail = invoice.biller_email || billerInfo?.email || 'contact@aurasupply.com';
  const billerLogo = invoice.biller_logo || billerInfo?.logo_url || billerInfo?.logo;

  const customerName = invoice.customer_name || invoice.customer || 'General Customer';
  const customerCompany = invoice.customer_company || customerName;
  const customerVatNo = invoice.customer_vat_no || 'N/A';
  const customerPhone = invoice.customer_phone || '-';
  const customerAddress = invoice.customer_address || 'Phnom Penh, Cambodia';

  const invoiceNo = invoice.reference_no || invoice.id || `POS-${Date.now().toString().slice(-6)}`;
  const invoiceDate = invoice.date ? new Date(invoice.date).toLocaleString('en-GB') : new Date().toLocaleString('en-GB');
  const cashierName = invoice.cashier || invoice.cashier_username || 'Admin / Cashier';

  const items = invoice.items || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={invoiceType === 'thermal' ? 470 : 880}
      centered
      destroyOnClose
      style={{ borderRadius: 20, overflow: 'hidden' }}
      styles={{ body: { padding: '16px 22px' } }}
    >
      {/* Print Stylesheet Injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-invoice-container, #printable-invoice-container * {
            visibility: visible !important;
          }
          #printable-invoice-container {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: ${invoiceType === 'thermal' ? '80mm' : '210mm'} !important;
            margin: 0 auto !important;
            padding: 12px !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* TOP CONTROLS & THEME TOOLBAR (no-print) */}
      {/* ========================================================================= */}
      <div className="no-print" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          {/* 1. TRANSFER BUTTON (Transfers back and forth between Default Invoice & Tax Invoice) */}
          <Button
            type="primary"
            icon={<SwapOutlined />}
            size="middle"
            onClick={handleTransferBackAndForth}
            style={{
              background: activeBillerColor,
              borderColor: activeBillerColor,
              fontWeight: 800,
              borderRadius: 10,
              boxShadow: `0 4px 14px ${activeBillerColor}40`,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {invoiceType === 'tax' ? (
              <span>⇄ Transfer to Default Invoice (វិក្កយបត្រធម្មតា)</span>
            ) : (
              <span>⇄ Transfer to Tax Invoice (វិក្កយបត្រអាករ)</span>
            )}
          </Button>

          {/* 2. Format Segmented Switcher */}
          <Segmented
            value={invoiceType}
            onChange={setInvoiceType}
            options={[
              { label: '📄 Default Invoice', value: 'default' },
              { label: '🏛️ Tax Invoice', value: 'tax' },
              { label: '🧾 Thermal (80mm)', value: 'thermal' },
            ]}
            style={{ fontWeight: 600 }}
          />

          {/* 3. Biller Color Swatches */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Biller Color:</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {BILLER_COLOR_PRESETS.slice(0, 6).map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setSelectedColor(c.value)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: c.value,
                    border: activeBillerColor === c.value ? '2px solid #0f172a' : '2px solid #ffffff',
                    boxShadow: activeBillerColor === c.value ? `0 0 0 2px ${c.value}` : '0 1px 3px rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRINTABLE INVOICE CONTAINER */}
      {/* ========================================================================= */}
      <div
        id="printable-invoice-container"
        style={{
          background: '#ffffff',
          color: '#0f172a',
          fontFamily: "'Inter', system-ui, -apple-system, 'Khmer OS Battambang', sans-serif",
          padding: invoiceType === 'thermal' ? '18px 16px' : '28px 32px',
          borderRadius: 14,
          border: `1.5px solid ${activeBillerColor}25`,
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
          fontSize: 12,
          lineHeight: 1.45,
          position: 'relative',
        }}
      >
        {/* Top Decorative Biller Color Strip */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: `linear-gradient(90deg, ${activeBillerColor} 0%, ${activeBillerColor}99 100%)`,
            borderTopLeftRadius: 14,
            borderTopRightRadius: 14,
          }}
        />

        {/* --------------------------------------------------------------------- */}
        {/* VIEW 1: OFFICIAL TAX INVOICE (វិក្កយបត្រអាករ - GDT CAMBODIA STANDARD) */}
        {/* --------------------------------------------------------------------- */}
        {invoiceType === 'tax' && (
          <div style={{ marginTop: 4 }}>
            {/* Tax Invoice Header: Logo + Biller Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 16 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                {billerLogo ? (
                  <img
                    src={billerLogo}
                    alt={billerName}
                    style={{ width: 68, height: 68, objectFit: 'contain', borderRadius: 10, border: `1.5px solid ${activeBillerColor}30` }}
                  />
                ) : (
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 12,
                      background: activeBillerColor,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 26,
                      fontWeight: 900,
                      boxShadow: `0 4px 14px ${activeBillerColor}40`,
                    }}
                  >
                    {billerName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: activeBillerColor, fontFamily: "'Khmer OS Muol Light', sans-serif" }}>
                    {billerCompanyKh || billerNameKh}
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.2px' }}>
                    {billerCompany}
                  </div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                    📍 {billerAddressKh || billerAddress}
                  </div>
                  <div style={{ fontSize: 11, color: '#475569' }}>
                    Tel: <span style={{ fontWeight: 600 }}>{billerPhone}</span> {billerEmail && `| Email: ${billerEmail}`}
                  </div>
                </div>
              </div>

              {/* VATTIN Box */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'inline-block', border: `1.5px solid ${activeBillerColor}`, borderRadius: 8, padding: '6px 12px', background: `${activeBillerColor}08` }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: activeBillerColor, textTransform: 'uppercase' }}>
                    លេខអត្តសញ្ញាណកម្ម អតប (VATTIN)
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', letterSpacing: '1px' }}>
                    {billerVatNo}
                  </div>
                </div>
              </div>
            </div>

            {/* Official Tax Title Bar */}
            <div style={{ textAlign: 'center', margin: '14px 0 18px', position: 'relative' }}>
              <div style={{ borderBottom: `2px solid ${activeBillerColor}`, position: 'absolute', top: '50%', left: 0, right: 0, zIndex: 1 }} />
              <div
                style={{
                  display: 'inline-block',
                  position: 'relative',
                  zIndex: 2,
                  background: '#ffffff',
                  padding: '4px 24px',
                  border: `2px solid ${activeBillerColor}`,
                  borderRadius: 24,
                  boxShadow: `0 2px 8px ${activeBillerColor}20`,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 900, color: activeBillerColor, fontFamily: "'Khmer OS Muol Light', sans-serif", lineHeight: 1.2 }}>
                  វិក្កយបត្រអាករ
                </div>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', letterSpacing: '2px', textTransform: 'uppercase' }}>
                  TAX INVOICE
                </div>
              </div>
            </div>

            {/* Dual Info Boxes: Customer Details (Left) + Reference Details (Right) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              {/* Customer Box */}
              <div style={{ border: `1.5px solid ${activeBillerColor}40`, borderRadius: 10, padding: '10px 14px', background: '#fafaf9' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: activeBillerColor, borderBottom: `1px solid ${activeBillerColor}25`, paddingBottom: 4, marginBottom: 6 }}>
                  ព័ត៌មានអតិថិជន / CUSTOMER INFO
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11 }}>
                  <div><span style={{ color: '#64748b' }}>ក្រុមហ៊ុន / Company:</span> <strong style={{ color: '#0f172a' }}>{customerCompany}</strong></div>
                  <div><span style={{ color: '#64748b' }}>អ្នកទទួល / Attn To:</span> <strong style={{ color: '#0f172a' }}>{customerName}</strong></div>
                  <div><span style={{ color: '#64748b' }}>លេខ អតប / VATTIN:</span> <strong style={{ color: '#0f172a' }}>{customerVatNo}</strong></div>
                  <div><span style={{ color: '#64748b' }}>ទូរស័ព្ទ / Phone:</span> <span style={{ color: '#0f172a' }}>{customerPhone}</span></div>
                  <div><span style={{ color: '#64748b' }}>អាសយដ្ឋាន / Address:</span> <span style={{ color: '#0f172a' }}>{customerAddress}</span></div>
                </div>
              </div>

              {/* Invoice Meta Box */}
              <div style={{ border: `1.5px solid ${activeBillerColor}40`, borderRadius: 10, padding: '10px 14px', background: '#fafaf9' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: activeBillerColor, borderBottom: `1px solid ${activeBillerColor}25`, paddingBottom: 4, marginBottom: 6 }}>
                  ឯកសារយោង / INVOICE REFERENCE
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11 }}>
                  <div><span style={{ color: '#64748b' }}>លេខវិក្កយបត្រ / Invoice No:</span> <strong style={{ color: activeBillerColor }}>{invoiceNo}</strong></div>
                  <div><span style={{ color: '#64748b' }}>កាលបរិច្ឆេទ / Date:</span> <span style={{ color: '#0f172a', fontWeight: 600 }}>{invoiceDate}</span></div>
                  <div><span style={{ color: '#64748b' }}>អ្នកគិតលុយ / Cashier:</span> <span style={{ color: '#0f172a' }}>{cashierName}</span></div>
                  <div>
                    <span style={{ color: '#64748b' }}>អត្រាប្តូរប្រាក់ / Ex. Rate:</span>{' '}
                    <Tag color="cyan" style={{ borderRadius: 6, margin: 0, fontWeight: 700 }}>
                      1 USD = ៛{khrExchangeRate.toLocaleString()} KHR
                    </Tag>
                  </div>
                </div>
              </div>
            </div>

            {/* Itemized Goods Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 14 }}>
              <thead>
                <tr style={{ background: activeBillerColor, color: '#ffffff', fontSize: 10.5, fontWeight: 800 }}>
                  <th style={{ padding: '8px 10px', textAlign: 'center', width: '5%', border: `1px solid ${activeBillerColor}` }}>ល.រ<br/>No.</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', width: '45%', border: `1px solid ${activeBillerColor}` }}>បរិយាយទំនិញ<br/>Description of Goods</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', width: '10%', border: `1px solid ${activeBillerColor}` }}>បរិមាណ<br/>Qty</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', width: '13%', border: `1px solid ${activeBillerColor}` }}>ថ្លៃឯកតា<br/>Price</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', width: '12%', border: `1px solid ${activeBillerColor}` }}>បញ្ចុះតម្លៃ<br/>Disc</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', width: '15%', border: `1px solid ${activeBillerColor}` }}>ថ្លៃទំនិញ<br/>Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => {
                  const qty = parseFloat(it.quantity || 1);
                  const price = parseFloat(it.unit_price || it.price || 0);
                  const disc = parseFloat(it.item_discount || 0);
                  const lineTotal = (price - disc) * qty;

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', fontSize: 11 }}>
                      <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #cbd5e1', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{it.name || it.product_name}</div>
                        {it.code && <div style={{ fontSize: 9.5, color: '#64748b' }}>Code: {it.code || it.product_code}</div>}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #cbd5e1', fontWeight: 700 }}>{qty}</td>
                      <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #cbd5e1' }}>${price.toFixed(2)}</td>
                      <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #cbd5e1', color: disc > 0 ? '#ef4444' : '#64748b' }}>
                        {disc > 0 ? `-$${disc.toFixed(2)}` : '$0.00'}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #cbd5e1', fontWeight: 800 }}>
                        ${lineTotal.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Official GDT Tax Calculation Totals Block */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, marginBottom: 24 }}>
              {/* Payment Summary / Notes */}
              <div style={{ flex: 1, fontSize: 11, color: '#475569' }}>
                <div style={{ border: '1px dashed #cbd5e1', borderRadius: 8, padding: 10, background: '#f8fafc' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>Payment & Settlement:</div>
                  <div>Method: <strong style={{ color: activeBillerColor }}>{invoice.paid_by || 'Cash / Multi-tender'}</strong></div>
                  <div>Tendered: ${tenderedUSD.toFixed(2)} {tenderedKHR > 0 && `(៛${tenderedKHR.toLocaleString()})`}</div>
                  <div>Change Due: ${changeUSD.toFixed(2)} (៛{changeKHR.toLocaleString()})</div>
                </div>
              </div>

              {/* Tax Computation Summary */}
              <div style={{ width: 340, border: `1.5px solid ${activeBillerColor}`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid #e2e8f0', background: '#fafaf9' }}>
                  <span>សរុបមិនរួមពន្ធ / Total Excl. VAT:</span>
                  <strong>${rawSubtotalExclTax.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid #e2e8f0', background: '#ffffff', color: '#64748b' }}>
                  <span style={{ paddingLeft: 12 }}>ជាប្រាក់រៀល / In KHR:</span>
                  <strong>៛{subtotalKHR.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid #e2e8f0', background: '#fafaf9' }}>
                  <span>អាករលើតម្លៃបន្ថែម ១០% / VAT 10%:</span>
                  <strong style={{ color: activeBillerColor }}>${rawTax.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: `2px solid ${activeBillerColor}`, background: '#ffffff', color: '#64748b' }}>
                  <span style={{ paddingLeft: 12 }}>ជាប្រាក់រៀល / In KHR:</span>
                  <strong style={{ color: activeBillerColor }}>៛{taxKHR.toLocaleString()}</strong>
                </div>
                {/* Grand Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: `${activeBillerColor}10`, fontSize: 14, fontWeight: 900, color: activeBillerColor }}>
                  <span>សរុបរួម / GRAND TOTAL:</span>
                  <span>${totalUSD.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 12px 10px', background: `${activeBillerColor}10`, fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                  <span>សរុបរួមជាប្រាក់រៀល / IN KHR:</span>
                  <span>៛{totalKHR.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Official Signature Lines (Buyer & Seller) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, paddingTop: 10, marginTop: 10, borderTop: '1px dashed #cbd5e1' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', fontFamily: "'Khmer OS Muol Light', sans-serif" }}>
                  ហត្ថលេខា និងឈ្មោះអ្នកទិញ
                </div>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 50 }}>
                  Customer's Signature & Name
                </div>
                <div style={{ borderBottom: '1px dotted #94a3b8', width: '70%', margin: '0 auto 6px' }} />
                <div style={{ fontSize: 10, color: '#94a3b8' }}>កាលបរិច្ឆេទ / Date: _____/_____/2026</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', fontFamily: "'Khmer OS Muol Light', sans-serif" }}>
                  ហត្ថលេខា និងឈ្មោះអ្នកលក់
                </div>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 50 }}>
                  Seller's Signature & Stamp
                </div>
                <div style={{ borderBottom: '1px dotted #94a3b8', width: '70%', margin: '0 auto 6px' }} />
                <div style={{ fontSize: 10, color: '#94a3b8' }}>កាលបរិច្ឆេទ / Date: _____/_____/2026</div>
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* VIEW 2: DEFAULT / STANDARD INVOICE (វិក្កយបត្រ - COMMERCIAL INVOICE) */}
        {/* --------------------------------------------------------------------- */}
        {invoiceType === 'default' && (
          <div style={{ marginTop: 4 }}>
            {/* Header: Brand Logo & Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${activeBillerColor}`, paddingBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {billerLogo ? (
                  <img
                    src={billerLogo}
                    alt={billerName}
                    style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 10, border: `1px solid ${activeBillerColor}30` }}
                  />
                ) : (
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      background: activeBillerColor,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                      fontWeight: 900,
                      boxShadow: `0 4px 14px ${activeBillerColor}40`,
                    }}
                  >
                    {billerName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.3px' }}>
                    {billerName}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{billerCompany}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>📍 {billerAddress}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Tel: {billerPhone} | Email: {billerEmail}</div>
                </div>
              </div>

              {/* Title Badge in Biller Color */}
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '8px 18px',
                    borderRadius: 12,
                    background: `${activeBillerColor}12`,
                    border: `1.5px solid ${activeBillerColor}`,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 900, color: activeBillerColor, letterSpacing: '1px' }}>
                    វិក្កយបត្រ / INVOICE
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                    #{invoiceNo}
                  </div>
                </div>
              </div>
            </div>

            {/* Meta Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, margin: '16px 0', padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Date & Time</span>
                <strong style={{ fontSize: 12, color: '#0f172a' }}>{invoiceDate}</strong>
              </div>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Customer</span>
                <strong style={{ fontSize: 12, color: activeBillerColor }}>{customerName}</strong>
              </div>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Cashier</span>
                <strong style={{ fontSize: 12, color: '#0f172a' }}>{cashierName}</strong>
              </div>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Payment Status</span>
                <Tag color="success" style={{ borderRadius: 6, fontWeight: 700, margin: 0 }}>PAID / COMPLETED</Tag>
              </div>
            </div>

            {/* Itemized Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead>
                <tr style={{ background: `${activeBillerColor}15`, borderBottom: `2px solid ${activeBillerColor}`, color: '#0f172a', fontSize: 11, fontWeight: 800 }}>
                  <th style={{ padding: '9px 12px', textAlign: 'center', width: '5%' }}>#</th>
                  <th style={{ padding: '9px 12px', textAlign: 'left', width: '45%' }}>Item Description</th>
                  <th style={{ padding: '9px 12px', textAlign: 'center', width: '12%' }}>Qty</th>
                  <th style={{ padding: '9px 12px', textAlign: 'right', width: '14%' }}>Unit Price</th>
                  <th style={{ padding: '9px 12px', textAlign: 'right', width: '10%' }}>Discount</th>
                  <th style={{ padding: '9px 12px', textAlign: 'right', width: '14%' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => {
                  const qty = parseFloat(it.quantity || 1);
                  const price = parseFloat(it.unit_price || it.price || 0);
                  const disc = parseFloat(it.item_discount || 0);
                  const lineTotal = (price - disc) * qty;

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', fontSize: 11.5 }}>
                      <td style={{ padding: '8px 12px', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <strong style={{ color: '#0f172a' }}>{it.name || it.product_name}</strong>
                        {it.code && <div style={{ fontSize: 10, color: '#94a3b8' }}>{it.code || it.product_code}</div>}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700 }}>{qty}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#475569' }}>${price.toFixed(2)}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: disc > 0 ? '#ef4444' : '#94a3b8' }}>
                        {disc > 0 ? `-$${disc.toFixed(2)}` : '-'}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                        ${lineTotal.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Totals Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', border: '1px dashed #cbd5e1', padding: 12, borderRadius: 10 }}>
                  <QRCode value={`INV:${invoiceNo}`} size={64} bordered={false} />
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>VERIFIED SALE INVOICE</div>
                    <div>Pay Method: {invoice.paid_by || 'Cash'}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Scan QR Code to verify transaction authentic copy.</div>
                  </div>
                </div>
              </div>

              {/* Totals Box */}
              <div style={{ width: 320, background: '#f8fafc', borderRadius: 12, border: `1.5px solid ${activeBillerColor}30`, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: '#64748b' }}>Subtotal:</span>
                  <strong>${parseFloat(invoice.subtotal || totalUSD).toFixed(2)}</strong>
                </div>
                {parseFloat(invoice.discount_amount || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#ef4444', marginBottom: 4 }}>
                    <span>Order Discount:</span>
                    <span>-${parseFloat(invoice.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                {parseFloat(invoice.tax_amount || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: '#64748b' }}>Tax / VAT (10%):</span>
                    <span>+${parseFloat(invoice.tax_amount).toFixed(2)}</span>
                  </div>
                )}
                {parseFloat(invoice.shipping_amount || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: '#64748b' }}>Shipping / Delivery:</span>
                    <span>+${parseFloat(invoice.shipping_amount).toFixed(2)}</span>
                  </div>
                )}

                <Divider style={{ margin: '8px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>TOTAL PAYABLE:</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: activeBillerColor }}>${totalUSD.toFixed(2)}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>៛{totalKHR.toLocaleString()} KHR</div>
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 6, marginTop: 8, fontSize: 11 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>Tendered:</span>
                    <span>${tenderedUSD.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#10b981', marginTop: 2 }}>
                    <span>Change Due:</span>
                    <span>${changeUSD.toFixed(2)} (៛{changeKHR.toLocaleString()})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 12, borderTop: '1px solid #e2e8f0', fontSize: 11, color: '#64748b' }}>
              <div style={{ fontWeight: 800, color: '#0f172a' }}>THANK YOU FOR CHOOSING {billerName.toUpperCase()}!</div>
              <div style={{ marginTop: 2 }}>អរគុណសម្រាប់ការគាំទ្រ • សូមអញ្ជើញមកម្តងទៀត</div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* VIEW 3: 80MM THERMAL SLIP RECEIPT (វិក្កយបត្រម៉ាស៊ីនគិតលុយ) */}
        {/* --------------------------------------------------------------------- */}
        {invoiceType === 'thermal' && (
          <div style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 12, color: '#000000' }}>
            <div style={{ textAlign: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 900, textTransform: 'uppercase', color: activeBillerColor }}>
                {billerName}
              </div>
              <div style={{ fontSize: 10, color: '#333' }}>{billerAddress}</div>
              <div style={{ fontSize: 10, color: '#333' }}>Tel: {billerPhone}</div>
              <div style={{ fontSize: 11, fontWeight: 800, marginTop: 4, textTransform: 'uppercase' }}>
                *** POS SALE RECEIPT ***
              </div>
            </div>

            <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '6px 0', fontSize: 10.5, lineHeight: 1.4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Invoice: #{invoiceNo}</span>
                <span>Table: {invoice.table || 'Takeaway'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Date: {invoiceDate}</span>
                <span>Cashier: {cashierName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Cust: {customerName}</span>
                <span>Pay: {invoice.paid_by || 'Cash'}</span>
              </div>
            </div>

            {/* Thermal Items List */}
            <div style={{ margin: '8px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, borderBottom: '1px solid #000', paddingBottom: 3, fontSize: 10.5 }}>
                <span style={{ flex: 2 }}>Description</span>
                <span style={{ width: 35, textAlign: 'center' }}>Qty</span>
                <span style={{ width: 50, textAlign: 'right' }}>Price</span>
                <span style={{ width: 60, textAlign: 'right' }}>Total</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 4 }}>
                {items.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ flex: 2, fontWeight: 600 }}>{it.name || it.product_name}</span>
                    <span style={{ width: 35, textAlign: 'center' }}>{it.quantity || 1}</span>
                    <span style={{ width: 50, textAlign: 'right' }}>${parseFloat(it.unit_price || it.price || 0).toFixed(2)}</span>
                    <span style={{ width: 60, textAlign: 'right', fontWeight: 800 }}>
                      ${((parseFloat(it.unit_price || it.price || 0) * (it.quantity || 1)) - (parseFloat(it.item_discount || 0) * (it.quantity || 1))).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Thermal Totals */}
            <div style={{ borderTop: '1px dashed #000', paddingTop: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>${parseFloat(invoice.subtotal || totalUSD).toFixed(2)}</span>
              </div>
              <div style={{ borderTop: '1px solid #000', margin: '4px 0', paddingTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 900 }}>
                  <span>TOTAL (USD):</span>
                  <span>${totalUSD.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800 }}>
                  <span>TOTAL (KHR ៛):</span>
                  <span>៛{totalKHR.toLocaleString()}</span>
                </div>
              </div>
              <div style={{ fontSize: 9.5, textAlign: 'center', color: '#555', margin: '4px 0' }}>
                Rate: 1 USD = ៛{khrExchangeRate} KHR
              </div>
              <div style={{ borderTop: '1px dashed #000', paddingTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Paid:</span>
                  <span>${tenderedUSD.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 12 }}>
                  <span>Change:</span>
                  <span>${changeUSD.toFixed(2)} (៛{changeKHR.toLocaleString()})</span>
                </div>
              </div>
            </div>

            {/* Thermal Footer */}
            <div style={{ textAlign: 'center', marginTop: 12, borderTop: '1px dashed #000', paddingTop: 8 }}>
              <div style={{ fontWeight: 800 }}>THANK YOU! PLEASE COME AGAIN</div>
              <div style={{ margin: '6px auto', display: 'flex', justifyContent: 'center' }}>
                <QRCode value={`INV:${invoiceNo}`} size={56} bordered={false} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL BOTTOM ACTION BAR (no-print) */}
      {/* ========================================================================= */}
      <div className="no-print" style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <Button
          type="primary"
          icon={<PrinterOutlined />}
          onClick={handlePrint}
          size="large"
          style={{
            flex: 2,
            height: 48,
            borderRadius: 12,
            background: activeBillerColor,
            borderColor: activeBillerColor,
            fontWeight: 800,
            fontSize: 15,
            boxShadow: `0 4px 14px ${activeBillerColor}40`,
          }}
        >
          Print Invoice ({invoiceType === 'tax' ? 'Tax Invoice' : invoiceType === 'thermal' ? 'Thermal Slip' : 'Default Invoice'})
        </Button>

        {onNextSale && (
          <Button
            type="default"
            icon={<PlusOutlined />}
            onClick={onNextSale}
            size="large"
            style={{
              flex: 1,
              height: 48,
              borderRadius: 12,
              fontWeight: 800,
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
            }}
          >
            Next Sale (↵)
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default PosReceiptModal;
