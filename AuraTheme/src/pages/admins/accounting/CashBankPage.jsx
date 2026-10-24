import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Modal,
  Form,
  Select,
  Input,
  InputNumber,
  DatePicker,
  Typography,
  Space,
  Tag,
  message,
  Divider
} from 'antd';
import {
  BankOutlined,
  SwapOutlined,
  PlusOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';
import { useTranslation } from '../../../contexts/LanguageContext';

const { Title, Text } = Typography;
const { Option } = Select;

const CashBankPage = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [cashAccounts, setCashAccounts] = useState([]);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/accounting/cash-accounts');
      if (res.data?.status) {
        setCashAccounts(res.data.data || []);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to load cash & bank accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const totalCashBank = cashAccounts.reduce((acc, c) => acc + (parseFloat(c.current_balance) || 0), 0);

  const handleTransferSubmit = async (values) => {
    if (values.from_account_code === values.to_account_code) {
      message.error(t('same_account_error', 'Source and destination accounts must be different.'));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        from_account_code: values.from_account_code,
        to_account_code: values.to_account_code,
        amount: parseFloat(values.amount),
        fee_amount: parseFloat(values.fee_amount) || 0,
        fee_account_code: values.fee_account_code || null,
        date: values.date ? values.date.format('YYYY-MM-DD HH:mm:ss') : new Date().toISOString(),
        note: values.note || 'Cash / Bank Transfer'
      };

      const res = await axios.post('/api/admin/accounting/transfers', payload);
      if (res.data?.status) {
        message.success(t('transfer_completed', 'Funds transferred and General Ledger updated successfully!'));
        setTransferModalVisible(false);
        form.resetFields();
        fetchAccounts();
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to execute transfer');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: t('account_code', 'GL Code'),
      dataIndex: 'account_code',
      width: 140,
      render: (code) => <Text strong style={{ color: '#2563eb', fontFamily: 'monospace' }}>{code}</Text>
    },
    {
      title: t('account_name', 'Account Name'),
      dataIndex: 'name',
      render: (name, r) => (
        <div>
          <span style={{ fontWeight: 600 }}>{name}</span>
          {r.accountname && <div style={{ fontSize: 12, color: '#64748b' }}>GL: {r.accountname}</div>}
        </div>
      )
    },
    {
      title: t('register_type', 'Register Type'),
      dataIndex: 'type',
      width: 140,
      render: (tp) => <Tag color={tp === 'bank' ? 'cyan' : 'green'}>{tp?.toUpperCase() || 'CASH'}</Tag>
    },
    {
      title: t('current_balance', 'Current Balance ($)'),
      dataIndex: 'current_balance',
      align: 'right',
      width: 180,
      render: (bal) => (
        <span style={{ fontSize: 15, fontWeight: 700, color: parseFloat(bal) < 0 ? '#dc2626' : '#16a34a' }}>
          ${parseFloat(bal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      )
    }
  ];

  return (
    <div>
      {/* Overview Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card bordered={false} style={{ borderRadius: 10 }}>
            <Statistic
              title={<span style={{ fontWeight: 600 }}>{t('total_liquid_funds', 'Total Liquid Cash & Bank Reserves')}</span>}
              value={totalCashBank}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#2563eb', fontWeight: 700 }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {cashAccounts.length} {t('registered_accounts', 'Registered Bank & Teller Accounts')}
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={16} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchAccounts}>
              {t('refresh_balances', 'Refresh Balances')}
            </Button>
            <Button
              type="primary"
              icon={<SwapOutlined />}
              style={{ background: '#16a34a', borderColor: '#16a34a' }}
              onClick={() => {
                form.resetFields();
                setTransferModalVisible(true);
              }}
            >
              {t('transfer_funds', 'Transfer Between Accounts')}
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Cash Accounts Table */}
      <Card bordered={false} style={{ borderRadius: 10 }}>
        <Table
          dataSource={cashAccounts}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
        />
      </Card>

      {/* Transfer Modal */}
      <Modal
        title={<span><SwapOutlined style={{ marginRight: 8, color: '#16a34a' }} />{t('internal_account_transfer', 'Internal Account Transfer')}</span>}
        open={transferModalVisible}
        onCancel={() => setTransferModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleTransferSubmit}
          initialValues={{
            date: dayjs(),
            fee_amount: 0
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="from_account_code"
                label={t('from_account', 'From Account (Source)')}
                rules={[{ required: true, message: 'Select source account' }]}
              >
                <Select placeholder="Disburse from...">
                  {cashAccounts.map(c => (
                    <Option key={c.account_code} value={c.account_code}>
                      [{c.account_code}] {c.name} (${parseFloat(c.current_balance || 0).toFixed(2)})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="to_account_code"
                label={t('to_account', 'To Account (Destination)')}
                rules={[{ required: true, message: 'Select destination account' }]}
              >
                <Select placeholder="Deposit to...">
                  {cashAccounts.map(c => (
                    <Option key={c.account_code} value={c.account_code}>
                      [{c.account_code}] {c.name} (${parseFloat(c.current_balance || 0).toFixed(2)})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="amount"
                label={t('transfer_amount', 'Transfer Amount ($)')}
                rules={[
                  { required: true, message: 'Enter transfer amount' },
                  { type: 'number', min: 0.01, message: 'Amount must be > 0' }
                ]}
              >
                <InputNumber style={{ width: '100%' }} precision={2} placeholder="0.00" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="date"
                label={t('transfer_date', 'Transfer Date')}
                rules={[{ required: true }]}
              >
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fee_amount" label={t('bank_fee_charge', 'Bank Fee / Charge (Optional)')}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="fee_account_code" label={t('fee_expense_account', 'Fee Expense Account')}>
                <Select placeholder="Default Bank Charge (600100)" allowClear>
                  <Option value="600100">[600100] Bank Charges & Fees</Option>
                  <Option value="600101">[600101] Wire Transfer Expense</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="note" label={t('transfer_memo', 'Transfer Purpose / Memo')}>
            <Input.TextArea rows={2} placeholder="e.g. Deposit daily POS cash intake to ABA checking account" />
          </Form.Item>

          <Divider style={{ margin: '12px 0 20px 0' }} />

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setTransferModalVisible(false)}>{t('cancel', 'Cancel')}</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                style={{ background: '#16a34a', borderColor: '#16a34a' }}
              >
                {t('execute_transfer', 'Execute Transfer & Post to GL')}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default CashBankPage;
