import React from 'react';
import { Modal, Button, Divider, Table } from 'antd';
import { PrinterOutlined, DollarCircleOutlined } from '@ant-design/icons';

const PosRegisterDetailsModal = ({
  visible,
  onClose,
  shiftSummary,
  currentRegister,
  themeMode,
  t,
}) => {
  const isDark = themeMode === 'dark';

  const cashInHand = parseFloat(shiftSummary?.cash_in_hand || currentRegister?.cash_in_hand || 0);
  const cashSales = parseFloat(shiftSummary?.cash_sales || 0);
  const ccSales = parseFloat(shiftSummary?.cc_sales || 0);
  const chSales = parseFloat(shiftSummary?.ch_sales || 0);
  const gcSales = parseFloat(shiftSummary?.gc_sales || 0);
  const abaSales = parseFloat(shiftSummary?.aba_sales || 0);
  const acledaSales = parseFloat(shiftSummary?.acleda_sales || 0);
  const otherSales = parseFloat(shiftSummary?.other_sales || 0);
  const refunds = parseFloat(shiftSummary?.refunds || 0);
  const returns = parseFloat(shiftSummary?.returns || 0);
  const expenses = parseFloat(shiftSummary?.expenses || 0);

  const totalSales = cashSales + ccSales + chSales + gcSales + abaSales + acledaSales + otherSales;
  const totalCashInDrawer = cashInHand + cashSales - expenses - refunds - returns;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={520}
      centered
      destroyOnClose
      style={{ borderRadius: 20, overflow: 'hidden' }}
      styles={{ body: { padding: '24px 28px' } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>
            Register Shift Details
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            Shift #{currentRegister?.id || 'Active'} • {currentRegister?.date ? new Date(currentRegister.date).toLocaleString() : 'Now'}
          </div>
        </div>

        <Button icon={<PrinterOutlined />} onClick={handlePrint} size="middle" style={{ borderRadius: 8 }}>
          Print Details
        </Button>
      </div>

      <div
        style={{
          padding: '14px 18px',
          borderRadius: 14,
          background: isDark ? '#1e293b' : '#f8fafc',
          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          fontSize: 13,
          lineHeight: 1.8,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
          <span>Cash in Hand (Opening):</span>
          <span style={{ fontWeight: 700 }}>${cashInHand.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
          <span>Cash Sales:</span>
          <span style={{ fontWeight: 700, color: '#10b981' }}>+${cashSales.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
          <span>Credit Card Sales:</span>
          <span style={{ fontWeight: 600 }}>${ccSales.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
          <span>Cheque Sales:</span>
          <span style={{ fontWeight: 600 }}>${chSales.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
          <span>Gift Card / Member Card Sales:</span>
          <span style={{ fontWeight: 600 }}>${gcSales.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
          <span>ABA / KHQR Sales:</span>
          <span style={{ fontWeight: 600 }}>${abaSales.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
          <span>ACLEDA Sales:</span>
          <span style={{ fontWeight: 600 }}>${acledaSales.toFixed(2)}</span>
        </div>
        {otherSales > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
            <span>Other Sales:</span>
            <span style={{ fontWeight: 600 }}>${otherSales.toFixed(2)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 14, color: '#2563eb', borderBottom: '1px solid #e2e8f0' }}>
          <span>Total Gross Sales:</span>
          <span>${totalSales.toFixed(2)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', color: '#ef4444' }}>
          <span>Refunds & Returns:</span>
          <span>-${(refunds + returns).toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', color: '#ef4444' }}>
          <span>Drawer Expenses:</span>
          <span>-${expenses.toFixed(2)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 16, color: '#10b981', paddingTop: 6 }}>
          <span>Total Expected Cash:</span>
          <span>${totalCashInDrawer.toFixed(2)}</span>
        </div>
      </div>

      <div style={{ marginTop: 20, textAlign: 'right' }}>
        <Button size="large" onClick={onClose} style={{ borderRadius: 10, fontWeight: 700 }}>
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default PosRegisterDetailsModal;
