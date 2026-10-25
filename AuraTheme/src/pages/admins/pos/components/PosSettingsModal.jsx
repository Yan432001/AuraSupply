import React, { useState } from 'react';
import {
  Modal,
  Button,
  Form,
  Input,
  Select,
  Switch,
  Divider,
  message,
} from 'antd';
import { SettingOutlined, SaveOutlined } from '@ant-design/icons';
import axios from 'axios';

const PosSettingsModal = ({
  visible,
  onClose,
  posSettingsData,
  onSaveSettings,
  themeMode,
  t,
}) => {
  const isDark = themeMode === 'dark';
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const handleFinish = async (values) => {
    setSaving(true);
    try {
      if (onSaveSettings) {
        await onSaveSettings(values);
      }
      message.success('POS Settings updated successfully');
      onClose();
    } catch (err) {
      message.error('Failed saving settings');
    } finally {
      setSaving(false);
    }
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
          <SettingOutlined />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>
            POS Terminal Settings
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            Exchange rates, hardware receipt configurations, sound effects, and defaults
          </div>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={posSettingsData}
        onFinish={handleFinish}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Form.Item label="USD / KHR Exchange Rate" name="exchange_rate">
            <Input type="number" step="50" prefix="៛" placeholder="4200" />
          </Form.Item>

          <Form.Item label="Default Warehouse" name="default_warehouse">
            <Select
              options={[
                { label: 'HQ Warehouse', value: 'HQ Warehouse' },
                { label: 'Branch 1', value: 'Branch 1' },
                { label: 'Main Store', value: 'Main Store' },
              ]}
            />
          </Form.Item>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Form.Item label="Default Customer" name="default_customer">
            <Input placeholder="General Customer" />
          </Form.Item>

          <Form.Item label="Default Receipt Format" name="receipt_width">
            <Select
              options={[
                { label: 'Dual Currency 80mm ($ + ៛)', value: 'dual_currency' },
                { label: 'Standard 80mm ($)', value: '80mm' },
                { label: 'Tri-Currency 80mm ($ + ៛ + ฿)', value: 'tri_currency' },
                { label: 'Compact 58mm Mobile', value: '58mm' },
              ]}
            />
          </Form.Item>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Auto Print Receipt on Sale Finalize</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Automatically trigger thermal printer upon completing sale</div>
            </div>
            <Form.Item name="auto_print" valuePropName="checked" noStyle>
              <Switch />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Audio Beep Feedback</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Play sound on barcode scan, error, and payment success</div>
            </div>
            <Form.Item name="sound_effects" valuePropName="checked" noStyle>
              <Switch />
            </Form.Item>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <Button onClick={onClose} style={{ marginRight: 8, borderRadius: 10 }}>
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={saving}
            style={{ borderRadius: 10, background: '#2F6FED', borderColor: '#2F6FED', fontWeight: 700 }}
          >
            Save Settings
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default PosSettingsModal;
