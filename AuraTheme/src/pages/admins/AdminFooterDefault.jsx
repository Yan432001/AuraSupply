import React from 'react';
import { Layout, Typography, Space, Divider } from "antd";
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { useTranslation } from '../../contexts/LanguageContext';

const { Footer } = Layout;
const { Text, Link } = Typography;

const FooterDefault = () => {
  const adminTheme = useAdminTheme();
  const { t } = useTranslation();
  
  const footerStyle = {
    textAlign: 'center',
    padding: '18px 24px',
    background: adminTheme.card,
    borderTop: `1px solid ${adminTheme.border}`,
    boxShadow: adminTheme.isDark ? '0 -2px 10px rgba(0,0,0,0.25)' : '0 -2px 8px rgba(0,0,0,0.03)',
    transition: 'background 0.22s ease, border-color 0.22s ease',
  };

  return (
    <Footer style={footerStyle}>
      <Space split={<Divider type="vertical" style={{ borderColor: adminTheme.border }} />} size={12} wrap>
        <Text style={{ fontSize: 12.5, color: adminTheme.subtext }}>
          2014-2026 © Aura ERP
        </Text>
        <Link href="/privacy" style={{ fontSize: 12.5, color: adminTheme.primary }}>
          {t('privacy_policy', 'Privacy Policy')}
        </Link>
        <Link href="/terms" style={{ fontSize: 12.5, color: adminTheme.primary }}>
          {t('terms_of_service', 'Terms of Service')}
        </Link>
        <Link href="/support" style={{ fontSize: 12.5, color: adminTheme.primary }}>
          {t('support', 'Support')}
        </Link>
      </Space>
    </Footer>
  );
};

export default FooterDefault;