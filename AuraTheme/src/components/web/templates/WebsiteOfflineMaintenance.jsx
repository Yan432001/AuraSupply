import React from 'react';
import { Button, Card, Flex, Space, Tag, Typography } from 'antd';
import {
  ToolOutlined,
  DashboardOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  GlobalOutlined,
  PhoneOutlined,
  LockOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../contexts/LanguageContext';
import { useAdminModules } from '../../../contexts/AdminModulesContext';
import AuraLogo from '../../common/AuraLogo';

const { Title, Text, Paragraph } = Typography;

export default function WebsiteOfflineMaintenance() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isWebsiteOnline, setAllModuleStates } = useAdminModules();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0b0f19 0%, #1e293b 50%, #0f172a 100%)',
        padding: '32px 16px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Decorative Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '10%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          right: '15%',
          width: 450,
          height: 450,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(234, 88, 12, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />

      <Card
        style={{
          maxWidth: 620,
          width: '100%',
          borderRadius: 24,
          background: 'rgba(30, 41, 59, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}
        styles={{ body: { padding: '40px 32px' } }}
      >
        {/* Logo and Status Tag */}
        <Flex justify="center" align="center" style={{ marginBottom: 24 }}>
          <AuraLogo height={44} />
        </Flex>

        <Tag
          color="warning"
          icon={<ToolOutlined />}
          style={{
            borderRadius: 20,
            padding: '4px 14px',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.5,
            marginBottom: 20
          }}
        >
          {t('website_offline_maintenance_mode', 'WEBSITE OFFLINE • MAINTENANCE MODE')}
        </Tag>

        <Title level={2} style={{ color: '#f8fafc', fontWeight: 800, margin: '0 0 12px' }}>
          {t('storefront_currently_offline', 'Storefront is Currently Offline')}
        </Title>

        <Paragraph style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
          {t(
            'storefront_offline_desc',
            'The public customer storefront and E-commerce catalog have been temporarily disabled in the Admin Modules Switchboard. Backend operations, warehouse fulfillment, and administrative systems remain operational.'
          )}
        </Paragraph>

        {/* Feature status badges */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 14,
            padding: '16px 20px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            marginBottom: 28,
            textAlign: 'left'
          }}
        >
          <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
            <Text style={{ color: '#cbd5e1', fontSize: 13 }}>
              <GlobalOutlined style={{ marginRight: 8, color: '#f59e0b' }} />
              {t('public_web_catalog', 'Public Web Catalog & Storefront')}
            </Text>
            <Tag color="error" style={{ borderRadius: 6, margin: 0, fontWeight: 700 }}>
              {t('offline', 'OFFLINE')}
            </Tag>
          </Flex>

          <Flex justify="space-between" align="center">
            <Text style={{ color: '#cbd5e1', fontSize: 13 }}>
              <DashboardOutlined style={{ marginRight: 8, color: '#10b981' }} />
              {t('admin_erp_portal', 'Aura ERP Operations Portal')}
            </Text>
            <Tag color="success" style={{ borderRadius: 6, margin: 0, fontWeight: 700 }}>
              {t('active_online', 'OPERATIONAL')}
            </Tag>
          </Flex>
        </div>

        {/* Call to Actions */}
        <Space orientation="vertical" size={12} style={{ width: '100%' }}>
          <Button
            type="primary"
            size="large"
            icon={<DashboardOutlined />}
            onClick={() => navigate('/admins/login')}
            style={{
              width: '100%',
              height: 46,
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              borderColor: '#2563eb',
              boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)'
            }}
          >
            {t('access_operations_portal', 'Sign in to Operations Portal (Staff & Admin)')}
          </Button>

          <Flex orientation="horizontal" gap={10}>
            <Button
              size="middle"
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              style={{
                flex: 1,
                borderRadius: 10,
                color: '#e2e8f0',
                background: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                fontWeight: 600
              }}
            >
              {t('check_status', 'Check Status')}
            </Button>
            <Button
              size="middle"
              icon={<SafetyCertificateOutlined />}
              onClick={() => navigate('/admins/modules')}
              style={{
                flex: 1,
                borderRadius: 10,
                color: '#e2e8f0',
                background: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                fontWeight: 600
              }}
            >
              {t('admin_modules', 'Manage Modules')}
            </Button>
          </Flex>
        </Space>

        <div style={{ marginTop: 24 }}>
          <Text style={{ color: '#64748b', fontSize: 11.5 }}>
            {t('system_id', 'Aura Enterprise B2B Engine')} • {t('contact_admin_notice', 'To restore public access, enable E-commerce in /admins/modules.')}
          </Text>
        </div>
      </Card>
    </div>
  );
}
