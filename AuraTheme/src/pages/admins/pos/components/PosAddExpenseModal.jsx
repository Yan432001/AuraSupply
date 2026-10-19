import React, { useState } from 'react';
import {
  Modal,
  Button,
  Form,
  Input,
  message,
} from 'antd';
import { PlusCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const PosAddExpenseModal = ({
  visible,
  onClose,
  currentRegisterId,
  onExpenseAdded,
  themeMode,
  t,
}) => {
  const isDark = themeMode === 'dark';
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        amount: parseFloat(values.amount),
        note: values.note || 'POS Drawer Cash Out',
        register_id: currentRegisterId,
      };
      const res = await axios.post('/api/admin/pos/expenses', payload);
      if (res.data?.success) {
        message.success('Petty cash expense recorded');
        form.resetFields();
        if (onExpenseAdded) onExpenseAdded(payload);
        onClose();
      } else {
        message.error(res.data?.message || 'Failed recording expense');
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed recording expense');
    } finally {
      setSubmitting(false);
    }
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
      styles={{ body: { padding: '24px 28px' } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
            fontSize: 20,
          }}
        >
          <PlusCircleOutlined />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>
            Quick Cash Expense (Drawer Out)
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            Record cash paid out from drawer for supplies, courier or petty expenses
          </div>
        </div>
      </div>

      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          label="Expense Amount ($)"
          name="amount"
          rules={[{ required: true, message: 'Please enter amount' }]}
        >
          <Input
            size="large"
            type="number"
            step="any"
            min="0.01"
            prefix={<span style={{ fontWeight: 800, color: '#ef4444' }}>$</span>}
            placeholder="0.00"
            style={{ borderRadius: 10, fontSize: 18, fontWeight: 800 }}
          />
        </Form.Item>

        <Form.Item label="Reason / Memo" name="note" rules={[{ required: true, message: 'Please enter reason' }]}>
          <Input.TextArea rows={3} placeholder="e.g. Purchased drinking water, Ice delivery, Courier fee" style={{ borderRadius: 10 }} />
        </Form.Item>

        <div style={{ textAlign: 'right', marginTop: 12 }}>
          <Button onClick={onClose} style={{ marginRight: 8, borderRadius: 10 }}>
            Cancel
          </Button>
          <Button
            danger
            type="primary"
            htmlType="submit"
            loading={submitting}
            style={{ borderRadius: 10, fontWeight: 700 }}
          >
            Record Cash Out
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default PosAddExpenseModal;
