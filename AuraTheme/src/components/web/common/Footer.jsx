import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Space, Input, Button, Tag, message } from 'antd';
import { Link } from 'react-router-dom';
import {
  SafetyCertificateFilled,
  ThunderboltFilled,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  SendOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { publicTheme } from '../../../utils/webTheme';
import AuraLogo from '../../common/AuraLogo';
import { submitNewsletter, fetchShopSettings, fetchBranches } from '../../../utils/apiconfig';
import { useTranslation } from '../../../contexts/LanguageContext';
import { useAuth } from '../../../contexts/AuthContext';

const { Text, Title } = Typography;

export default function Footer() {
  const { t } = useTranslation();
  const { canAccessOperationsPortal } = useAuth();
  const [rfqEmail, setRfqEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState(null);
  const [hubs, setHubs] = useState([]);

  const footerSolutions = [
    { label: t('wholesale_catalog', 'Wholesale Catalog'), to: '/products' },
    { label: t('verified_suppliers_directory', 'Verified Suppliers Directory'), to: '/shops' },
    { label: t('telegram_mini_app_emenu', 'Telegram Mini App E-Menu'), to: '/service' },
    { label: t('specialty_coffee_wholesale', 'Specialty Coffee Wholesale'), to: '/service' },
    { label: t('artisan_bakery_distribution', 'Artisan Bakery Distribution'), to: '/service' },
    { label: t('pos_kds_setup', 'POS & Kitchen Display Setup'), to: '/service' },
  ];

  const footerOperations = [
    { label: t('b2b_procurement_workspace', 'B2B Procurement Workspace'), to: '/cart' },
    { label: t('client_account_order_sync', 'Client Account & Order Sync'), to: '/profile' },
    { label: t('erp_operations_portal', 'ERP Operations Portal'), to: '/admins/dashboard' },
    { label: t('inventory_stock_analytics', 'Inventory & Stock Analytics'), to: '/admins/reports/inventory' },
    { label: t('qr_code_generator', 'QR Code Generator'), to: '/admins/qrcode' },
    { label: t('sales_revenue_reports', 'Sales & Revenue Reports'), to: '/admins/analytics/sales' },
  ];

  useEffect(() => {
    let isMounted = true;
    Promise.all([fetchShopSettings(), fetchBranches()])
      .then(([sRes, bRes]) => {
        if (!isMounted) return;
        if (sRes?.success && sRes.data) setSettings(sRes.data);
        if (bRes?.success && Array.isArray(bRes.data)) setHubs(bRes.data);
      })
      .catch((e) => console.warn('Footer settings load error:', e));
    return () => { isMounted = false; };
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!rfqEmail || !rfqEmail.includes('@')) {
      message.error('Please enter a valid business email.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitNewsletter(rfqEmail);
      if (res?.success) {
        message.success('Thank you! Your inquiry has been saved to the database. Sourcing desk will contact you.');
        setRfqEmail('');
      } else {
        message.error(res?.error || 'Failed to submit newsletter');
      }
    } catch (err) {
      message.error(err.message || 'Error subscribing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer style={{ padding: '0 16px 24px', width: '100%', boxSizing: 'border-box' }}>
      <div
        style={{
          padding: '40px 36px 24px',
          background: '#ffffff',
          borderRadius: 24,
          color: '#0f172a',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.02)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
        }}
      >
        {/* Top Procurement Newsletter / RFQ Strip */}
        <div
          style={{
            padding: '28px 30px',
            marginBottom: 36,
            background: '#f8fafc',
            borderRadius: 18,
            border: '1px solid #e2e8f0',
          }}
        >
          <Row gutter={[24, 20]} align="middle" justify="space-between">
            <Col xs={24} md={13}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2f6fed' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#2f6fed', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {t('enterprise_sourcing_desk', 'Enterprise Sourcing Desk')}
                </span>
              </div>
              <Title level={3} style={{ color: '#0f172a', margin: 0, fontWeight: 800, fontSize: 'clamp(20px, 2.5vw, 24px)' }}>
                {t('need_bulk_pricing', 'Need Bulk Pricing or Custom OEM Manufacturing?')}
              </Title>
              <Text style={{ color: '#64748b', fontSize: 13, display: 'block', marginTop: 4 }}>
                {t('bulk_pricing_subtitle', 'Submit your business inquiry for verified wholesale quotes, factory audits, and guaranteed freight delivery.')}
              </Text>
            </Col>
            <Col xs={24} md={10}>
              <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: 8, maxWidth: 440 }}>
                <Input
                  value={rfqEmail}
                  onChange={(e) => setRfqEmail(e.target.value)}
                  placeholder={t('enter_corporate_email', 'Enter your corporate email...')}
                  style={{
                    height: 42,
                    borderRadius: 12,
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#0f172a',
                    fontSize: 13,
                  }}
                />
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SendOutlined />}
                  style={{
                    height: 42,
                    paddingInline: 22,
                    borderRadius: 12,
                    background: '#2f6fed',
                    border: 'none',
                    fontWeight: 700,
                    color: '#ffffff',
                    boxShadow: '0 4px 14px rgba(47, 111, 237, 0.28)',
                  }}
                >
                  {t('request_quote', 'Request Quote')}
                </Button>
              </form>
            </Col>
          </Row>
        </div>

        {/* Main Columns Grid */}
        <Row gutter={[32, 32]}>
          {/* Brand Info & Trust Seals */}
          <Col xs={24} lg={8}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <AuraLogo size={42} showText={true} subtitle={t('aura_supply_b2b_retail', 'AURA SUPPLY B2B & RETAIL')} textColor="#0f172a" />
              <Text style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6, display: 'block' }}>
                {t('aura_supply_footer_desc', 'Aura Supply is a premier B2B procurement network and multi-store digital commerce ecosystem connecting commercial buyers with vetted regional manufacturers, specialty roasters, artisan bakeries, and automated Telegram kitchen dispatch.')}
              </Text>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#0f172a' }}>
                  <PhoneOutlined style={{ color: '#2f6fed' }} />
                  <span>{t('procurement_hotline', 'Procurement Hotline')}: <strong>{settings?.phone || '+855 12 345 678'}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#0f172a' }}>
                  <MailOutlined style={{ color: '#2f6fed' }} />
                  <span>{t('wholesale_desk', 'Wholesale Desk')}: <strong>{settings?.email || 'procurement@auraglobal.com'}</strong></span>
                </div>
              </div>

              {/* Compliance Trust Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                <Tag style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 11, padding: '2px 8px' }}>
                  🛡️ {t('iso_certified', 'ISO 9001:2015 Quality')}
                </Tag>
                <Tag style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 11, padding: '2px 8px' }}>
                  ☕ {t('direct_trade_certified', 'Direct-Trade Certified')}
                </Tag>
                <Tag style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 11, padding: '2px 8px' }}>
                  🔒 {t('escrow_protection', 'Escrow Protection')}
                </Tag>
              </div>
            </Space>
          </Col>

          {/* Solutions Column */}
          <Col xs={12} sm={8} lg={5}>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14, marginBottom: 16, letterSpacing: '0.02em' }}>
              {t('b2b_sourcing', 'B2B Sourcing')}
            </div>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              {footerSolutions.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  style={{ color: '#64748b', fontSize: 13, transition: 'color 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#2f6fed')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                >
                  {item.label}
                </Link>
              ))}
            </Space>
          </Col>

          {/* Operations & ERP Column */}
          <Col xs={12} sm={8} lg={5}>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14, marginBottom: 16, letterSpacing: '0.02em' }}>
              {t('operations_erp', 'Operations & ERP')}
            </div>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              {footerOperations
                .filter((item) => !item.to.startsWith('/admins') || canAccessOperationsPortal)
                .map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    style={{ color: '#64748b', fontSize: 13, transition: 'color 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#2f6fed')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                >
                  {item.label}
                </Link>
              ))}
            </Space>
          </Col>

          {/* Regional Hubs & Warehouses */}
          <Col xs={24} sm={8} lg={6}>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14, marginBottom: 16, letterSpacing: '0.02em' }}>
              {t('logistics_hubs', 'Logistics & Hubs')}
            </div>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {(hubs.length > 0 ? hubs : [
                { name: t('phnom_penh_flagship_hub', 'Phnom Penh Flagship Hub'), address: 'No. 128 Norodom Blvd, Daun Penh' },
                { name: t('bangkok_fulfillment_center', 'Bangkok Fulfillment Center'), address: 'Sathorn Industrial Logistics Park' },
                { name: t('rayong_cross_border_yard', 'Rayong Cross-Border Yard'), address: 'Eastern Seaboard Freight Terminal' },
              ]).map((hub, idx) => (
                <div key={hub.id || hub.name || idx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <EnvironmentOutlined style={{ color: '#2f6fed', marginTop: 3, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>{hub.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{hub.address || hub.desc || t('fulfillment_terminal', 'Fulfillment Terminal')}</div>
                  </div>
                </div>
              ))}
            </Space>
          </Col>
        </Row>

        {/* Bottom Bar: Copyright & Payment Badges */}
        <div
          style={{
            marginTop: 36,
            paddingTop: 20,
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <Text style={{ color: '#64748b', fontSize: 12 }}>
            {t('footer_copyright', '© 2026 Aura Global Inc. All rights reserved. B2B Supply Platform, Multi-Store E-Menu & Logistics Architecture.')}
          </Text>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{t('accepted_b2b_settlement', 'Accepted B2B Settlement')}:</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#334155', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: 6 }}>
              {t('khqr_instant', 'KHQR Instant')}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#334155', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: 6 }}>
              {t('net_30_corporate', 'Net-30 Corporate')}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#334155', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: 6 }}>
              Visa / Mastercard
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#334155', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: 6 }}>
              {t('bank_wire_usd', 'Bank Wire (USD)')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
