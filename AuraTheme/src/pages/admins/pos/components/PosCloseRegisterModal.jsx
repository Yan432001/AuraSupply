import React, { useState } from 'react';
import {
  Modal,
  Button,
  Input,
  Tag,
  Divider,
  Alert,
  Spin,
} from 'antd';
import {
  LockOutlined,
  PrinterOutlined,
  CheckCircleFilled,
  WarningOutlined,
  CloseCircleOutlined,
  DollarOutlined,
} from '@ant-design/icons';

const PosCloseRegisterModal = ({
  visible,
  onClose,
  shiftSummary,
  loadingSummary,
  onConfirmClose,
  isClosing,
  themeMode,
  adminTheme,
  t,
}) => {
  const isDark = themeMode === 'dark';
  const [submittedCash, setSubmittedCash] = useState('');
  const [closingNote, setClosingNote] = useState('');

  if (!shiftSummary && !loadingSummary) return null;

  const cashInHand = parseFloat(shiftSummary?.cash_in_hand || 0);
  const cashSales = parseFloat(shiftSummary?.cash_sales || 0);
  const abaSales = parseFloat(shiftSummary?.aba_sales || 0);
  const acledaSales = parseFloat(shiftSummary?.acleda_sales || 0);
  const ccSales = parseFloat(shiftSummary?.cc_sales || 0);
  const otherSales = parseFloat(shiftSummary?.other_sales || 0);
  const expenses = parseFloat(shiftSummary?.expenses || 0);
  const refunds = parseFloat(shiftSummary?.refunds || 0);

  // Expected cash in drawer = Cash in Hand + Cash Sales - Expenses - Cash Refunds
  const expectedCash = cashInHand + cashSales - expenses - refunds;
  const submittedNum = parseFloat(submittedCash || 0);
  const difference = submittedCash === '' ? 0 : submittedNum - expectedCash;
  const isBalanced = Math.abs(difference) < 0.01;
  const isOver = difference > 0.01;
  const isShort = difference < -0.01;

  const handlePrint = () => {
    window.print();
  };

  const handleCloseSubmit = () => {
    onConfirmClose({
      submittedCash: submittedNum,
      difference,
      closingNote,
    });
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
      destroyOnClose
      style={{ borderRadius: 20, overflow: 'hidden' }}
      styles={{ body: { padding: '24px 28px' } }}
    >
      {loadingSummary ? (
        <div style={{ padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Spin size="large" />
          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Calculating shift summary and cash reconciliation...</span>
        </div>
      ) : (
        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>
                Close Cash Register Shift
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                Shift #{shiftSummary?.register_id || 'Active'} • {shiftSummary?.open_time ? new Date(shiftSummary.open_time).toLocaleString() : 'Now'}
              </div>
            </div>

            <Button icon={<PrinterOutlined />} onClick={handlePrint} size="middle" style={{ borderRadius: 8 }}>
              Print Summary
            </Button>
          </div>

          {/* Tender Breakdown Table (from close_register.php) */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 14,
              background: isDark ? '#1e293b' : '#f8fafc',
              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              marginBottom: 16,
              fontSize: 13,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b' }}>Opening Cash In Hand:</span>
              <span style={{ fontWeight: 700 }}>${cashInHand.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b' }}>Cash Sales:</span>
              <span style={{ fontWeight: 700, color: '#10b981' }}>+${cashSales.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b' }}>ABA / KHQR Sales:</span>
              <span style={{ fontWeight: 600 }}>${abaSales.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b' }}>ACLEDA Sales:</span>
              <span style={{ fontWeight: 600 }}>${acledaSales.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b' }}>Credit Card Sales:</span>
              <span style={{ fontWeight: 600 }}>${ccSales.toFixed(2)}</span>
            </div>
            {otherSales > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Other (Wing / PiPay / Alipay):</span>
                <span style={{ fontWeight: 600 }}>${otherSales.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b' }}>Expenses (Drawer Cash Out):</span>
              <span style={{ fontWeight: 700, color: '#ef4444' }}>-${expenses.toFixed(2)}</span>
            </div>
            {refunds > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Cash Refunds / Returns:</span>
                <span style={{ fontWeight: 700, color: '#ef4444' }}>-${refunds.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 2px', fontSize: 15, fontWeight: 900 }}>
              <span style={{ color: '#2F6FED' }}>Expected Drawer Cash:</span>
              <span style={{ color: '#2F6FED' }}>${expectedCash.toFixed(2)}</span>
            </div>
          </div>

          {/* Cashier Counted Cash Input */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              Total Cash Counted in Drawer (Submitted Amount)
            </label>
            <Input
              size="large"
              prefix={<span style={{ fontWeight: 800, color: '#2F6FED', fontSize: 18 }}>$</span>}
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              value={submittedCash}
              onChange={(e) => setSubmittedCash(e.target.value)}
              style={{
                borderRadius: 12,
                fontSize: 18,
                fontWeight: 800,
                height: 48,
              }}
            />
          </div>

          {/* Cash Difference Indicator */}
          {submittedCash !== '' && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: isBalanced
                  ? 'rgba(16, 185, 129, 0.1)'
                  : isOver
                  ? 'rgba(59, 130, 246, 0.1)'
                  : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${isBalanced ? '#86efac' : isOver ? '#93c5fd' : '#fca5a5'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: isBalanced ? '#15803d' : isOver ? '#2F6FED' : '#b91c1c' }}>
                {isBalanced ? '✓ Balanced: Count matches expected cash' : isOver ? '▲ Cash Over in drawer' : '▼ Cash Short in drawer'}
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: isBalanced ? '#15803d' : isOver ? '#2F6FED' : '#b91c1c' }}>
                {difference > 0 ? `+$${difference.toFixed(2)}` : difference < 0 ? `-$${Math.abs(difference).toFixed(2)}` : '$0.00'}
              </div>
            </div>
          )}

          {/* Closing Shift Note */}
          <div style={{ marginBottom: 20 }}>
            <Input.TextArea
              rows={2}
              placeholder="Closing notes / handover remarks (optional)"
              value={closingNote}
              onChange={(e) => setClosingNote(e.target.value)}
              style={{ borderRadius: 10 }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
            <Button size="large" onClick={onClose} style={{ borderRadius: 12, height: 48, fontWeight: 700 }}>
              Cancel
            </Button>

            <Button
              danger
              type="primary"
              size="large"
              icon={<LockOutlined />}
              onClick={handleCloseSubmit}
              loading={isClosing}
              style={{
                height: 48,
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 800,
                boxShadow: '0 4px 16px rgba(239, 68, 68, 0.35)',
              }}
            >
              CONFIRM & CLOSE REGISTER
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default PosCloseRegisterModal;
