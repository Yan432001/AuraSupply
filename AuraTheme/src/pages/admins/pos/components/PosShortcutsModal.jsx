import React from 'react';
import { Modal, Button, Tag, Divider } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

const PosShortcutsModal = ({ visible, onClose, themeMode, t }) => {
  const isDark = themeMode === 'dark';

  const shortcuts = [
    { key: 'F1', desc: 'Display Keyboard Shortcuts Cheatsheet' },
    { key: 'F2', desc: 'Quick Add New Customer' },
    { key: 'F3', desc: 'Add Custom Manual Product to Cart' },
    { key: 'F4 / Space', desc: 'Open Payment / Checkout Modal' },
    { key: 'F6', desc: 'Print Pre-check Table Bill' },
    { key: 'F7', desc: 'Hold / Suspend Current Order' },
    { key: 'F8', desc: 'Void / Clear Entire Cart' },
    { key: 'F9', desc: 'Open POS Hardware & Settings' },
    { key: 'Enter', desc: 'Search Barcode / Confirm Checkout & Print' },
    { key: 'Esc', desc: 'Close any active modal / Exit current dialog' },
  ];

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'rgba(47, 111, 237, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2F6FED',
            fontSize: 20,
          }}
        >
          <QuestionCircleOutlined />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>
            POS Keyboard Shortcuts
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            Speed up your sales checkout workflow with physical keyboard shortcuts
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {shortcuts.map((s, idx) => (
          <div
            key={idx}
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              background: isDark ? '#1e293b' : '#f8fafc',
              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Tag color="blue" style={{ borderRadius: 6, fontWeight: 800, fontSize: 13, padding: '2px 8px', margin: 0 }}>
              {s.key}
            </Tag>
            <span style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#cbd5e1' : '#334155' }}>
              {s.desc}
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, textAlign: 'right' }}>
        <Button type="primary" onClick={onClose} style={{ borderRadius: 10, background: '#2F6FED', borderColor: '#2F6FED', fontWeight: 700 }}>
          Got It
        </Button>
      </div>
    </Modal>
  );
};

export default PosShortcutsModal;
