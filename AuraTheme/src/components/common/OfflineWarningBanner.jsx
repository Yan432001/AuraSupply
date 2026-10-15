import React from 'react';
import { Space, Button, Typography, Tag, Tooltip } from 'antd';
import {
  DisconnectOutlined,
  CheckCircleFilled,
  ReloadOutlined,
  WifiOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useNetworkStatus } from '../../contexts/NetworkStatusContext';

const { Text } = Typography;

export default function OfflineWarningBanner({
  variant = 'navbar', // 'navbar' | 'compact' | 'inline'
  className = '',
  style = {},
}) {
  const {
    isOnline,
    realOnline,
    isChecking,
    reconnectNotice,
    simulatedOffline,
    toggleSimulateOffline,
    retryConnection,
  } = useNetworkStatus();

  // If online and not in brief reconnect notice state, don't render anything
  if (isOnline && !reconnectNotice) {
    return null;
  }

  const isReconnecting = isOnline && reconnectNotice;

  // Reconnected State (subtle soft green banner)
  if (isReconnecting) {
    return (
      <div
        className={`navbar-offline-overlay-reconnected ${className}`}
        style={{
          width: '100%',
          background: 'rgba(236, 253, 245, 0.96)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(167, 243, 208, 0.9)',
          color: '#065f46',
          padding: variant === 'inline' ? '8px 14px' : '7px 20px',
          fontSize: 12.5,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)',
          animation: 'navBannerSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 1050,
          ...style,
        }}
      >
        <CheckCircleFilled style={{ color: '#10b981', fontSize: 14 }} />
        <span>
          <strong>Connection Restored:</strong> Online state verified. Order submissions are now re-enabled!
        </span>
      </div>
    );
  }

  // Offline Warning Overlay State (subtle warm amber / frosted banner)
  return (
    <div
      className={`navbar-offline-overlay ${className}`}
      style={{
        width: '100%',
        background: 'rgba(254, 243, 199, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(245, 158, 11, 0.45)',
        color: '#92400e',
        padding: variant === 'inline' ? '9px 14px' : '7px 20px',
        fontSize: 12.5,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
        boxShadow: '0 4px 14px rgba(217, 119, 6, 0.12)',
        animation: 'navBannerSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 1050,
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flexWrap: 'wrap' }}>
        {/* Pulsing Offline Beacon */}
        <span style={{ position: 'relative', display: 'flex', height: 10, width: 10, flexShrink: 0 }}>
          <span
            style={{
              position: 'absolute',
              height: '100%',
              width: '100%',
              borderRadius: '50%',
              background: '#f59e0b',
              opacity: 0.75,
              animation: 'navPulsePing 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
            }}
          />
          <span
            style={{
              position: 'relative',
              display: 'inline-flex',
              borderRadius: '50%',
              height: 10,
              width: 10,
              background: '#d97706',
            }}
          />
        </span>

        <DisconnectOutlined style={{ color: '#d97706', fontSize: 15 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 800, color: '#78350f', letterSpacing: '-0.2px' }}>
            Offline Connection Alert:
          </span>
          <span style={{ color: '#92400e' }}>
            Connection lost. Order submission buttons are disabled until connection returns.
          </span>
        </div>

        {/* Live navigator.onLine tag */}
        <Tag
          style={{
            margin: 0,
            borderRadius: 6,
            fontSize: 10.5,
            fontWeight: 700,
            background: '#fed7aa',
            borderColor: '#fb923c',
            color: '#9a3412',
          }}
        >
          navigator.onLine: false
        </Tag>

        {simulatedOffline && (
          <Tag
            color="orange"
            style={{ margin: 0, borderRadius: 6, fontSize: 10.5, fontWeight: 700 }}
          >
            Simulation Active
          </Tag>
        )}
      </div>

      {/* Action controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {simulatedOffline ? (
          <Button
            size="small"
            onClick={toggleSimulateOffline}
            style={{
              height: 26,
              padding: '0 10px',
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 6,
              background: '#ffffff',
              borderColor: '#f59e0b',
              color: '#b45309',
            }}
          >
            Exit Simulation
          </Button>
        ) : null}

        <Button
          size="small"
          icon={<ReloadOutlined spin={isChecking} />}
          onClick={retryConnection}
          loading={isChecking}
          style={{
            height: 26,
            padding: '0 11px',
            fontSize: 11.5,
            fontWeight: 700,
            borderRadius: 6,
            background: '#ffffff',
            borderColor: '#d97706',
            color: '#b45309',
            boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
          }}
        >
          {isChecking ? 'Checking...' : 'Check Connection'}
        </Button>
      </div>

      <style>{`
        @keyframes navBannerSlideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes navPulsePing {
          75%, 100% {
            transform: scale(2.4);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
