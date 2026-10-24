import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Table,
  InputNumber,
  Row,
  Col,
  Typography,
  Space,
  Tag,
  Alert,
  message,
  Divider,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  BookOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';
import { useTranslation } from '../../../contexts/LanguageContext';

const { Title, Text } = Typography;
const { Option } = Select;

const AddJournalEntryPage = ({ onCancel, onSuccess }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [billers, setBillers] = useState([]);
  const [referenceNo, setReferenceNo] = useState('');

  // Journal line items state: minimum 2 lines
  const [lines, setLines] = useState([
    { key: 1, account_code: null, account_name: '', description: '', debit: null, credit: null },
    { key: 2, account_code: null, account_name: '', description: '', debit: null, credit: null }
  ]);

  // Load accounts and next reference
  useEffect(() => {
    const initData = async () => {
      try {
        const [accRes, refRes, branchRes] = await Promise.all([
          axios.get('/api/admin/accounting/accounts?limit=1000'),
          axios.get('/api/admin/accounting/journals/next-reference'),
          axios.get('/api/admin/branches').catch(() => ({ data: { branches: [] } }))
        ]);

        if (accRes.data?.status) {
          setAccounts(accRes.data.data || []);
        }
        if (refRes.data?.status) {
          setReferenceNo(refRes.data.reference_no);
          form.setFieldsValue({ reference_no: refRes.data.reference_no });
        }
        if (branchRes.data?.branches) {
          setBillers(branchRes.data.branches);
        }
      } catch (err) {
        message.error('Failed to initialize journal voucher form');
      }
    };

    initData();
  }, [form]);

  // Line item manipulation
  const handleAddLine = () => {
    const nextKey = lines.length > 0 ? Math.max(...lines.map(l => l.key)) + 1 : 1;
    setLines([...lines, { key: nextKey, account_code: null, account_name: '', description: '', debit: null, credit: null }]);
  };

  const handleRemoveLine = (key) => {
    if (lines.length <= 2) {
      message.warning(t('minimum_lines_warn', 'A journal entry requires at least 2 lines.'));
      return;
    }
    setLines(lines.filter(l => l.key !== key));
  };

  const handleLineChange = (key, field, value) => {
    setLines(lines.map(line => {
      if (line.key === key) {
        const updated = { ...line, [field]: value };
        if (field === 'account_code') {
          const selected = accounts.find(a => String(a.accountcode) === String(value));
          if (selected) {
            updated.account_name = selected.accountname;
            updated.account_id = selected.id;
          }
        }
        // If entering debit, clear credit and vice versa
        if (field === 'debit' && value > 0) {
          updated.credit = null;
        } else if (field === 'credit' && value > 0) {
          updated.debit = null;
        }
        return updated;
      }
      return line;
    }));
  };

  // Balancing calculations
  const totalDebit = lines.reduce((acc, l) => acc + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((acc, l) => acc + (parseFloat(l.credit) || 0), 0);
  const variance = Math.abs(totalDebit - totalCredit);
  const isBalanced = variance < 0.001 && totalDebit > 0;

  // Submit Handler
  const handleSubmit = async (values) => {
    if (!isBalanced) {
      message.error(t('unbalanced_entry_error', 'Journal voucher is unbalanced! Total Debits must equal Total Credits.'));
      return;
    }

    const validLines = lines.filter(l => l.account_code && ((l.debit && l.debit > 0) || (l.credit && l.credit > 0)));
    if (validLines.length < 2) {
      message.error(t('invalid_lines_error', 'Please complete at least 2 valid debit/credit lines.'));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        reference_no: values.reference_no || referenceNo,
        date: values.date ? values.date.format('YYYY-MM-DD HH:mm:ss') : new Date().toISOString(),
        biller_id: values.biller_id || 1,
        jn_type: values.jn_type || 'journal',
        note: values.note || '',
        items: validLines.map(l => ({
          account_code: l.account_code,
          account_name: l.account_name,
          account_id: l.account_id,
          debit: parseFloat(l.debit) || 0,
          credit: parseFloat(l.credit) || 0,
          description: l.description || values.note || ''
        }))
      };

      const res = await axios.post('/api/admin/accounting/journals', payload);
      if (res.data?.status) {
        message.success(t('journal_posted_success', 'Journal Voucher posted and synchronized to General Ledger successfully!'));
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to post journal entry');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: t('account', 'Account'),
      width: '38%',
      render: (_, r) => (
        <Select
          showSearch
          placeholder={t('select_account', 'Select account...')}
          value={r.account_code}
          onChange={(val) => handleLineChange(r.key, 'account_code', val)}
          filterOption={(input, option) =>
            String(option.children).toLowerCase().includes(input.toLowerCase())
          }
          style={{ width: '100%' }}
        >
          {accounts.map(a => (
            <Option key={a.accountcode} value={a.accountcode}>
              [{a.accountcode}] {a.accountname} ({a.sectionname})
            </Option>
          ))}
        </Select>
      )
    },
    {
      title: t('description', 'Line Description'),
      width: '30%',
      render: (_, r) => (
        <Input
          placeholder={t('line_memo', 'Line description or memo')}
          value={r.description}
          onChange={(e) => handleLineChange(r.key, 'description', e.target.value)}
        />
      )
    },
    {
      title: t('debit', 'Debit ($)'),
      width: '14%',
      render: (_, r) => (
        <InputNumber
          style={{ width: '100%' }}
          min={0}
          step={0.01}
          precision={2}
          placeholder="0.00"
          value={r.debit}
          onChange={(val) => handleLineChange(r.key, 'debit', val)}
        />
      )
    },
    {
      title: t('credit', 'Credit ($)'),
      width: '14%',
      render: (_, r) => (
        <InputNumber
          style={{ width: '100%' }}
          min={0}
          step={0.01}
          precision={2}
          placeholder="0.00"
          value={r.credit}
          onChange={(val) => handleLineChange(r.key, 'credit', val)}
        />
      )
    },
    {
      title: '',
      width: '4%',
      align: 'center',
      render: (_, r) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveLine(r.key)}
        />
      )
    }
  ];

  return (
    <div>
      <Card bordered={false} style={{ borderRadius: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Button icon={<ArrowLeftOutlined />} onClick={onCancel} style={{ marginRight: 12 }}>
              {t('back_to_journals', 'Back to Journals')}
            </Button>
            <Title level={4} style={{ display: 'inline-block', margin: 0 }}>
              {t('new_journal_voucher', 'New General Journal Voucher')}
            </Title>
          </div>
          <Tag color={isBalanced ? 'success' : 'error'} style={{ fontSize: 13, padding: '4px 12px', borderRadius: 12 }}>
            {isBalanced ? <CheckCircleOutlined /> : <CloseCircleOutlined />} {isBalanced ? t('voucher_balanced', 'BALANCED') : `${t('unbalanced', 'UNBALANCED')} (Diff: $${variance.toFixed(2)})`}
          </Tag>
        </div>
      </Card>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          date: dayjs(),
          jn_type: 'journal',
          biller_id: 1
        }}
      >
        {/* Header Information */}
        <Card bordered={false} style={{ borderRadius: 10, marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="reference_no"
                label={t('reference_no', 'Reference Number')}
                rules={[{ required: true, message: 'Reference number is required' }]}
              >
                <Input placeholder="JN-20261024-XXXX" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="date"
                label={t('posting_date', 'Posting Date')}
                rules={[{ required: true, message: 'Date is required' }]}
              >
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="jn_type" label={t('voucher_type', 'Voucher Type')}>
                <Select>
                  <Option value="journal">{t('general_journal', 'General Journal Voucher')}</Option>
                  <Option value="payment">{t('payment_voucher', 'Payment Voucher')}</Option>
                  <Option value="receipt">{t('receipt_voucher', 'Receipt Voucher')}</Option>
                  <Option value="adjustment">{t('adjustment_voucher', 'Adjustment Voucher')}</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="biller_id" label={t('branch_biller', 'Branch / Biller')}>
                <Select placeholder="Select subsidiary">
                  {billers.map(b => (
                    <Option key={b.id} value={b.id}>{b.name || b.company}</Option>
                  ))}
                  {billers.length === 0 && <Option value={1}>Headquarters (Main)</Option>}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="note" label={t('voucher_note', 'Voucher Purpose / Memo')}>
            <Input.TextArea rows={2} placeholder="Explain the business transaction, source documents, or adjustment rationale..." />
          </Form.Item>
        </Card>

        {/* Transaction Lines */}
        <Card
          bordered={false}
          style={{ borderRadius: 10, marginBottom: 16 }}
          title={<span><BookOutlined style={{ marginRight: 8 }} />{t('debit_credit_lines', 'Double-Entry Transaction Lines')}</span>}
          extra={
            <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddLine}>
              {t('add_line', 'Add Transaction Line')}
            </Button>
          }
        >
          <Table
            dataSource={lines}
            columns={columns}
            rowKey="key"
            pagination={false}
            size="small"
          />

          {/* Totals Summary Footer */}
          <div style={{ marginTop: 16, background: '#f8fafc', padding: '16px 20px', borderRadius: 8 }}>
            <Row justify="end" align="middle" gutter={24}>
              <Col>
                <Text type="secondary">{t('total_debits', 'Total Debits')}:</Text>{' '}
                <Text strong style={{ fontSize: 16, color: '#16a34a' }}>${totalDebit.toFixed(2)}</Text>
              </Col>
              <Col>
                <Text type="secondary">{t('total_credits', 'Total Credits')}:</Text>{' '}
                <Text strong style={{ fontSize: 16, color: '#dc2626' }}>${totalCredit.toFixed(2)}</Text>
              </Col>
              <Col>
                <Text type="secondary">{t('difference', 'Variance')}:</Text>{' '}
                <Text strong style={{ fontSize: 16, color: isBalanced ? '#16a34a' : '#dc2626' }}>
                  ${variance.toFixed(2)}
                </Text>
              </Col>
            </Row>
          </div>
        </Card>

        {/* Action Controls */}
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel}>{t('cancel', 'Cancel')}</Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={submitting}
              disabled={!isBalanced}
              style={{
                background: isBalanced ? '#16a34a' : undefined,
                borderColor: isBalanced ? '#16a34a' : undefined
              }}
            >
              {t('post_journal_voucher', 'Post Journal Voucher')}
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
};

export default AddJournalEntryPage;
