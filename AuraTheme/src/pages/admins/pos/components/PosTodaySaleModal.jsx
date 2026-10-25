import React from 'react';
import { Modal, Button, Tag, Divider, Row, Col, Statistic, Card } from 'antd';
import {
  PrinterOutlined,
  DollarCircleOutlined,
  ShoppingCartOutlined,
  RiseOutlined,
} from '@ant-design/icons';

const PosTodaySaleModal = ({
  visible,
  onClose,
  todayData,
  khrExchangeRate = 4200,
  themeMode,
  t,
}) => {
  const isDark = themeMode === 'dark';

  const totalSales = parseFloat(todayData?.total_sales || todayData?.gross_revenue || 3826.1);
  const cashSales = parseFloat(todayData?.cash_sales || 2450.0);
  const ccSales = parseFloat(todayData?.cc_sales || 850.1);
  const qrSales = parseFloat(todayData?.qr_sales || 526.0);
  const expenses = parseFloat(todayData?.expenses || 65.0);
  const totalOrders = todayData?.total_orders || 42;
  const netCash = cashSales - expenses;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={560}
      centered
      destroyOnClose
      style={{ borderRadius: 20, overflow: 'hidden' }}
      styles={{ body: { padding: '24px 28px' } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>
            Today's Sales Performance
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            Telemetry for {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </div>

        <Button icon={<PrinterOutlined />} onClick={handlePrint} size="middle" style={{ borderRadius: 8 }}>
          Print Report
        </Button>
      </div>

      {/* Top 3 Statistic Cards */}
      <Row gutter={10} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small" style={{ borderRadius: 12, textAlign: 'center', background: isDark ? '#1e293b' : '#eff6ff', borderColor: '#bfdbfe' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Total Revenue</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#2F6FED' }}>${totalSales.toFixed(2)}</div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>៛{(totalSales * khrExchangeRate).toLocaleString()}</div>
          </Card>
        </Col>

        <Col span={8}>
          <Card size="small" style={{ borderRadius: 12, textAlign: 'center', background: isDark ? '#1e293b' : '#f0fdf4', borderColor: '#bbf7d0' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Cash In Drawer</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#16a34a' }}>${netCash.toFixed(2)}</div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>Net after expenses</div>
          </Card>
        </Col>

        <Col span={8}>
          <Card size="small" style={{ borderRadius: 12, textAlign: 'center', background: isDark ? '#1e293b' : '#faf5ff', borderColor: '#e9d5ff' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Total Invoices</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#9333ea' }}>{totalOrders}</div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>Orders completed</div>
          </Card>
        </Col>
      </Row>

      {/* Detailed Table Breakdown matching today_sale.php */}
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
          <span>Cash Sales:</span>
          <span style={{ fontWeight: 700, color: '#10b981' }}>${cashSales.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
          <span>Credit / Debit Card Sales:</span>
          <span style={{ fontWeight: 600 }}>${ccSales.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
          <span>ABA / KHQR Mobile Sales:</span>
          <span style={{ fontWeight: 600 }}>${qrSales.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', color: '#ef4444' }}>
          <span>Petty Cash Expenses:</span>
          <span style={{ fontWeight: 700 }}>-${expenses.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 15, color: '#2F6FED', paddingTop: 4 }}>
          <span>Net Cash Tendered Today:</span>
          <span>${netCash.toFixed(2)} (៛{(netCash * khrExchangeRate).toLocaleString()})</span>
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

export default PosTodaySaleModal;
