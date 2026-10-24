import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  DatePicker,
  Select,
  Tag,
  Space,
  Modal,
  Popconfirm,
  Typography,
  Row,
  Col,
  Descriptions,
  Divider,
  message,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  DeleteOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BookOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';
import { useTranslation } from '../../../contexts/LanguageContext';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const JournalEntriesPage = ({ onAddNewJournal }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [journals, setJournals] = useState([]);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  // Detail Modal
  const [detailVisible, setDetailVisible] = useState(false);
  const [activeJournal, setActiveJournal] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchJournals = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.pageSize,
        search: search.trim() || undefined,
        jn_type: selectedType || undefined,
        start_date: dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : undefined,
        end_date: dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : undefined
      };
      const res = await axios.get('/api/admin/accounting/journals', { params });
      if (res.data?.status) {
        setJournals(res.data.data || []);
        setPagination({
          current: res.data.pagination?.page || 1,
          pageSize: res.data.pagination?.limit || 20,
          total: res.data.pagination?.total || 0
        });
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to fetch journal entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJournals(1);
  }, [selectedType, dateRange]);

  const handleSearch = () => {
    fetchJournals(1);
  };

  const handleViewDetail = async (id) => {
    setDetailVisible(true);
    setDetailLoading(true);
    try {
      const res = await axios.get(`/api/admin/accounting/journals/${id}`);
      if (res.data?.status) {
        setActiveJournal(res.data.data);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to load journal details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteJournal = async (id) => {
    try {
      const res = await axios.delete(`/api/admin/accounting/journals/${id}`);
      if (res.data?.status) {
        message.success(t('journal_cancelled', 'Journal entry cancelled and reversed from General Ledger!'));
        fetchJournals(pagination.current);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to cancel journal entry');
    }
  };

  const columns = [
    {
      title: t('date', 'Posting Date'),
      dataIndex: 'date',
      width: 140,
      render: (d) => d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: t('reference_no', 'Reference Number'),
      dataIndex: 'reference_no',
      width: 180,
      render: (ref, r) => (
        <a onClick={() => handleViewDetail(r.id)} style={{ fontWeight: 600, color: '#2563eb' }}>
          {ref}
        </a>
      )
    },
    {
      title: t('voucher_type', 'Type'),
      dataIndex: 'jn_type',
      width: 130,
      render: (tp) => {
        let color = 'blue';
        if (tp === 'payment') color = 'orange';
        if (tp === 'receipt') color = 'green';
        if (tp === 'adjustment') color = 'purple';
        return <Tag color={color}>{tp?.toUpperCase() || 'JOURNAL'}</Tag>;
      }
    },
    {
      title: t('memo_note', 'Memo / Description'),
      dataIndex: 'note',
      render: (note) => <Text ellipsis={{ tooltip: note }} style={{ maxWidth: 280 }}>{note || '-'}</Text>
    },
    {
      title: t('lines', 'Lines'),
      dataIndex: 'item_count',
      width: 80,
      align: 'center',
      render: (cnt) => <Tag>{cnt || 0}</Tag>
    },
    {
      title: t('total_amount', 'Total Amount ($)'),
      dataIndex: 'total_debit',
      width: 160,
      align: 'right',
      render: (amt, r) => (
        <div>
          <Text strong style={{ color: '#16a34a' }}>
            ${parseFloat(amt || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </Text>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            {r.is_balanced ? (
              <span style={{ color: '#16a34a' }}>● Balanced</span>
            ) : (
              <span style={{ color: '#dc2626' }}>● Unbalanced</span>
            )}
          </div>
        </div>
      )
    },
    {
      title: t('created_by', 'Created By'),
      dataIndex: 'created_by_name',
      width: 140,
      render: (name) => <span style={{ fontSize: 12 }}>{name || 'System'}</span>
    },
    {
      title: t('actions', 'Actions'),
      key: 'actions',
      width: 120,
      align: 'center',
      render: (_, r) => (
        <Space size="small">
          <Tooltip title={t('view_voucher', 'View Voucher')}>
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(r.id)}
            />
          </Tooltip>

          <Tooltip title={t('cancel_reverse', 'Cancel & Reverse Entry')}>
            <Popconfirm
              title={t('confirm_cancel_voucher', 'Cancel & Reverse Voucher?')}
              description={t('reverse_voucher_warn', 'This will reverse the double-entry postings from the General Ledger.')}
              onConfirm={() => handleDeleteJournal(r.id)}
              okText={t('yes_cancel', 'Yes, Reverse')}
              cancelText={t('no', 'No')}
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card bordered={false} style={{ marginBottom: 16, borderRadius: 10 }}>
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} md={16} lg={18}>
            <Space wrap>
              <Input
                placeholder={t('search_reference_note', 'Search reference or note...')}
                prefix={<SearchOutlined />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 220 }}
                allowClear
              />
              <Select
                placeholder={t('voucher_type', 'Voucher Type')}
                value={selectedType}
                onChange={setSelectedType}
                style={{ width: 160 }}
                allowClear
              >
                <Option value="journal">{t('general_journal', 'General Journal')}</Option>
                <Option value="payment">{t('payment_voucher', 'Payment')}</Option>
                <Option value="receipt">{t('receipt_voucher', 'Receipt')}</Option>
                <Option value="adjustment">{t('adjustment_voucher', 'Adjustment')}</Option>
              </Select>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                style={{ width: 250 }}
              />
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                {t('filter', 'Filter')}
              </Button>
              <Button icon={<ReloadOutlined />} onClick={() => fetchJournals(1)}>
                {t('refresh', 'Refresh')}
              </Button>
            </Space>
          </Col>

          <Col xs={24} md={8} lg={6} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ background: '#16a34a', borderColor: '#16a34a' }}
              onClick={onAddNewJournal}
            >
              {t('new_journal_voucher', 'New Journal Voucher')}
            </Button>
          </Col>
        </Row>
      </Card>

      <Card bordered={false} style={{ borderRadius: 10 }}>
        <Table
          dataSource={journals}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            onChange: (p) => fetchJournals(p)
          }}
          size="middle"
        />
      </Card>

      {/* View Journal Voucher Modal */}
      <Modal
        title={<span><BookOutlined style={{ marginRight: 8, color: '#2563eb' }} />{t('journal_voucher_details', 'Journal Voucher Details')}</span>}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={() => window.print()}>
            {t('print', 'Print Voucher')}
          </Button>,
          <Button key="close" type="primary" onClick={() => setDetailVisible(false)}>
            {t('close', 'Close')}
          </Button>
        ]}
        width={800}
        destroyOnClose
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Table loading /></div>
        ) : activeJournal && (
          <div>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label={t('reference_no', 'Reference Number')}>
                <Text strong style={{ color: '#2563eb', fontSize: 14 }}>{activeJournal.reference_no}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t('posting_date', 'Posting Date')}>
                {activeJournal.date ? dayjs(activeJournal.date).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('type', 'Voucher Type')}>
                <Tag color="blue">{activeJournal.jn_type?.toUpperCase()}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('biller_branch', 'Subsidiary')}>
                {activeJournal.biller_name || 'Headquarters'}
              </Descriptions.Item>
              <Descriptions.Item label={t('created_by', 'Created By')} span={2}>
                {activeJournal.created_by_name || 'System'}
              </Descriptions.Item>
              <Descriptions.Item label={t('memo', 'Memo / Note')} span={2}>
                {activeJournal.note || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Table
              dataSource={activeJournal.items || []}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: t('account_code', 'Account Code'),
                  dataIndex: 'account_code',
                  width: 130,
                  render: (c) => <Text code>{c}</Text>
                },
                {
                  title: t('account_name', 'Account Name'),
                  dataIndex: 'account_name',
                  render: (name) => <span style={{ fontWeight: 600 }}>{name}</span>
                },
                {
                  title: t('description', 'Description'),
                  dataIndex: 'description'
                },
                {
                  title: t('debit', 'Debit ($)'),
                  dataIndex: 'debit',
                  align: 'right',
                  width: 130,
                  render: (d) => d > 0 ? (
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>${parseFloat(d).toFixed(2)}</span>
                  ) : '-'
                },
                {
                  title: t('credit', 'Credit ($)'),
                  dataIndex: 'credit',
                  align: 'right',
                  width: 130,
                  render: (c) => c > 0 ? (
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>${parseFloat(c).toFixed(2)}</span>
                  ) : '-'
                }
              ]}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row style={{ background: '#f8fafc', fontWeight: 700 }}>
                    <Table.Summary.Cell index={0} colSpan={3} align="right">
                      {t('total', 'Total')}:
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right" style={{ color: '#16a34a', fontSize: 14 }}>
                      ${activeJournal.total_debit?.toFixed(2)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="right" style={{ color: '#dc2626', fontSize: 14 }}>
                      ${activeJournal.total_credit?.toFixed(2)}
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default JournalEntriesPage;
