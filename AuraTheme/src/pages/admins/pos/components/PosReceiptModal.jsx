import React, { useState } from 'react';
import {
  Modal,
  Button,
  Segmented,
  Tag,
  Divider,
  QRCode,
} from 'antd';
import {
  PrinterOutlined,
  DownloadOutlined,
  MailOutlined,
  CheckCircleFilled,
  PlusOutlined,
} from '@ant-design/icons';

const PosReceiptModal = ({
  visible,
  onClose,
  invoice,
  onNextSale,
  khrExchangeRate = 4200,
  thbExchangeRate = 36.5,
  themeMode,
  adminTheme,
  t,
}) => {
  const [receiptFormat, setReceiptFormat] = useState('dual_currency');

  if (!invoice) return null;

  const totalUSD = parseFloat(invoice.grand_total || invoice.total || 0);
  const totalKHR = Math.round(totalUSD * khrExchangeRate);
  const totalTHB = (totalUSD * thbExchangeRate).toFixed(2);

  const tenderedUSD = parseFloat(invoice.tendered_usd || invoice.paid || totalUSD);
  const tenderedKHR = parseFloat(invoice.tendered_khr || 0);
  const changeUSD = parseFloat(invoice.change_usd || 0);
  const changeKHR = Math.round(changeUSD * khrExchangeRate);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={460}
      centered
      destroyOnClose
      style={{ borderRadius: 20, overflow: 'hidden' }}
      styles={{ body: { padding: '20px 24px' } }}
    >
      {/* 1. TOP FORMAT SELECTOR */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <Segmented
          value={receiptFormat}
          onChange={setReceiptFormat}
          options={[
            { label: 'Dual Currency ($ + ៛)', value: 'dual_currency' },
            { label: 'Standard 80mm', value: 'standard' },
            { label: 'Tri-Currency (฿)', value: 'tri_currency' },
            { label: 'Kitchen Ticket', value: 'kitchen' },
          ]}
          style={{ width: '100%' }}
        />
      </div>

      {/* 2. RECEIPT THERMAL PREVIEW CONTAINER */}
      <div
        id="pos-thermal-receipt"
        style={{
          background: '#ffffff',
          color: '#000000',
          fontFamily: "'Courier New', Courier, monospace, 'Khmer OS Battambang'",
          padding: '24px 20px',
          borderRadius: 8,
          border: '1px dashed #cbd5e1',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          fontSize: 13,
          lineHeight: 1.4,
        }}
      >
        {/* Header: Store Info */}
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {invoice.biller_name || 'AURA GLOBAL MART & CAFE'}
          </div>
          <div style={{ fontSize: 11, color: '#333333' }}>
            {invoice.biller_address || '#128 Monivong Blvd, Phnom Penh, Cambodia'}
          </div>
          <div style={{ fontSize: 11, color: '#333333' }}>
            Tel: {invoice.biller_phone || '012 345 678 / 098 765 432'}
          </div>

          {receiptFormat === 'kitchen' ? (
            <div style={{ margin: '8px 0', padding: '4px', background: '#000000', color: '#ffffff', fontWeight: 900, fontSize: 15 }}>
              *** KITCHEN ORDER TICKET ***
            </div>
          ) : (
            <div style={{ fontSize: 13, fontWeight: 800, marginTop: 4, textTransform: 'uppercase' }}>
              Tax Invoice / វិក្កយបត្រ
            </div>
          )}
        </div>

        {/* Invoice Meta */}
        <div style={{ borderTop: '1px dashed #000000', borderBottom: '1px dashed #000000', padding: '6px 0', fontSize: 11 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Invoice: #{invoice.reference_no || invoice.id || 'INV-2026-001'}</span>
            <span>Table: {invoice.table || 'Takeaway'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Date: {invoice.date || new Date().toLocaleString()}</span>
            <span>Cashier: {invoice.cashier || 'Admin'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Customer: {invoice.customer || 'General Customer'}</span>
            {invoice.payment_method && <span>Pay: {invoice.payment_method}</span>}
          </div>
        </div>

        {/* Items Table */}
        <div style={{ margin: '10px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, borderBottom: '1px solid #000000', paddingBottom: 4, fontSize: 11 }}>
            <span style={{ flex: 2 }}>Item Description</span>
            <span style={{ width: 40, textAlign: 'center' }}>Qty</span>
            <span style={{ width: 55, textAlign: 'right' }}>Price</span>
            <span style={{ width: 65, textAlign: 'right' }}>Total</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 6 }}>
            {(invoice.items || []).map((it, idx) => (
              <div key={idx} style={{ fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ flex: 2, fontWeight: 700 }}>{it.name}</span>
                  <span style={{ width: 40, textAlign: 'center' }}>{it.quantity || 1}</span>
                  <span style={{ width: 55, textAlign: 'right' }}>${parseFloat(it.unit_price || 0).toFixed(2)}</span>
                  <span style={{ width: 65, textAlign: 'right', fontWeight: 800 }}>
                    ${((parseFloat(it.unit_price || 0) * (it.quantity || 1)) - (parseFloat(it.item_discount || 0) * (it.quantity || 1))).toFixed(2)}
                  </span>
                </div>
                {it.item_note && (
                  <div style={{ fontSize: 10, color: '#444444', fontStyle: 'italic', paddingLeft: 8 }}>
                    * {it.item_note}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Totals Section */}
        {receiptFormat !== 'kitchen' && (
          <div style={{ borderTop: '1px dashed #000000', paddingTop: 6, fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal:</span>
              <span>${parseFloat(invoice.subtotal || totalUSD).toFixed(2)}</span>
            </div>

            {parseFloat(invoice.discount || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Discount:</span>
                <span>-${parseFloat(invoice.discount).toFixed(2)}</span>
              </div>
            )}

            {parseFloat(invoice.tax || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Tax:</span>
                <span>+${parseFloat(invoice.tax).toFixed(2)}</span>
              </div>
            )}

            {/* Grand Total Highlight */}
            <div style={{ borderTop: '1px solid #000000', margin: '4px 0', paddingTop: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 900 }}>
                <span>TOTAL (USD):</span>
                <span>${totalUSD.toFixed(2)}</span>
              </div>

              {(receiptFormat === 'dual_currency' || receiptFormat === 'tri_currency') && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: '#000000' }}>
                  <span>TOTAL (KHR ៛):</span>
                  <span>៛{totalKHR.toLocaleString()}</span>
                </div>
              )}

              {receiptFormat === 'tri_currency' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
                  <span>TOTAL (THB ฿):</span>
                  <span>฿{totalTHB}</span>
                </div>
              )}
            </div>

            {/* Exchange Rate Notice */}
            <div style={{ fontSize: 10, textAlign: 'center', color: '#555555', margin: '4px 0' }}>
              Exchange Rate: 1 USD = ៛{khrExchangeRate} KHR = ฿{thbExchangeRate} THB
            </div>

            {/* Tendered & Change */}
            <div style={{ borderTop: '1px dashed #000000', paddingTop: 4, marginTop: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Paid USD:</span>
                <span>${tenderedUSD.toFixed(2)}</span>
              </div>
              {tenderedKHR > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Paid KHR:</span>
                  <span>៛{tenderedKHR.toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 13, marginTop: 2 }}>
                <span>Change Due:</span>
                <span>${changeUSD.toFixed(2)} (៛{changeKHR.toLocaleString()})</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer: Thank You & QR Code */}
        <div style={{ textAlign: 'center', marginTop: 14, borderTop: '1px dashed #000000', paddingTop: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 800 }}>
            THANK YOU FOR SHOPPING WITH US!
          </div>
          <div style={{ fontSize: 10, color: '#555555', marginTop: 2 }}>
            អរគុណសម្រាប់ការគាំទ្រ • សូមអញ្ជើញមកម្តងទៀត
          </div>

          <div style={{ margin: '8px auto', display: 'flex', justifyContent: 'center' }}>
            <QRCode value={`INV:${invoice.id || invoice.reference_no || '1001'}`} size={64} bordered={false} />
          </div>
          <div style={{ fontSize: 9, color: '#777777' }}>
            Powered by Aura Core ERP • www.aurasupply.com
          </div>
        </div>
      </div>

      {/* 3. MODAL ACTIONS: Print, Download, Email, Next Sale */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <Button
          type="primary"
          icon={<PrinterOutlined />}
          onClick={handlePrint}
          size="large"
          style={{
            flex: 1,
            height: 46,
            borderRadius: 12,
            background: '#2563eb',
            fontWeight: 700,
          }}
        >
          Print Receipt
        </Button>

        <Button
          type="default"
          icon={<PlusOutlined />}
          onClick={onNextSale}
          size="large"
          style={{
            flex: 1,
            height: 46,
            borderRadius: 12,
            fontWeight: 800,
            background: '#10b981',
            color: '#ffffff',
            border: 'none',
          }}
        >
          Next Sale (↵)
        </Button>
      </div>
    </Modal>
  );
};

export default PosReceiptModal;
