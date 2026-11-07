import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Row,
  Col,
  Typography,
  Modal,
  Form,
  InputNumber,
  message,
  Popconfirm,
  Tooltip,
  Divider,
  Spin
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EditOutlined,
  PrinterOutlined,
  EyeOutlined,
  FilterOutlined,
  DollarOutlined,
  SwapOutlined,
  ThunderboltOutlined,
  DownloadOutlined,
  CopyOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TableActionDropdown from '../../../components/common/TableActionDropdown';
import { useAdminTheme } from '../../../hooks/useAdminTheme';
import { useTranslation } from '../../../contexts/LanguageContext';
import MoneyModuleNav from './MoneyModuleNav';

const { Title, Text } = Typography;
const { Option } = Select;

const API_BASE = '/api/admin/money_exchange';

const formatNum = (val, decimals = 2) => {
  const num = parseFloat(val || 0);
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

const MoneyExchangeListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isDark } = useAdminTheme();

  const [loading, setLoading] = useState(false);
  const [exchanges, setExchanges] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Filters (matching AURA_v1 views/money/index.php #form)
  const [searchText, setSearchText] = useState('');
  const [referenceFilter, setReferenceFilter] = useState('');
  const [saleStatusFilter, setSaleStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [billerFilter, setBillerFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalRecords: 0 });
  const [metrics, setMetrics] = useState({
    totalExchanges: 0,
    totalVolume: 0,
    totalPaid: 0,
    totalBalance: 0
  });

  const [metadata, setMetadata] = useState({
    customers: [],
    billers: [],
    warehouses: [],
    currencies: [],
    exchangeRates: [],
    nextReference: '',
    nextPaymentReference: ''
  });

  // Quick Counter Exchange Modal (replicates AURA_v1 add_exchange_.php & edit_exchange.php)
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [editingQuickRecord, setEditingQuickRecord] = useState(null);
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickForm] = Form.useForm();

  // Detail / Receipt View Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);

  // Payments Modals (View Payments & Add Payment)
  const [viewPaymentsOpen, setViewPaymentsOpen] = useState(false);
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [activeExchangeForPay, setActiveExchangeForPay] = useState(null);
  const [exchangePayments, setExchangePayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentForm] = Form.useForm();

  // Watch Quick Counter Modal fields for live conversion preview
  const qAmount = Form.useWatch('amount', quickForm);
  const qRate = Form.useWatch('exchange_rate', quickForm);
  const qFromCur = Form.useWatch('from_currency', quickForm);
  const qToCur = Form.useWatch('to_currency', quickForm);

  const findPairRate = (fromCode, toCode) => {
    const f = String(fromCode || '').trim().toUpperCase();
    const to = String(toCode || '').trim().toUpperCase();
    if (!f || !to) return 0;
    if (f === to) return 1;
    const match = (metadata.exchangeRates || []).find(
      (r) =>
        String(r.from_currency || '').trim().toUpperCase() === f &&
        String(r.to_currency || '').trim().toUpperCase() === to
    );
    if (match && parseFloat(match.exchange_rate || 0) > 0) {
      return parseFloat(match.exchange_rate);
    }
    const fCur = (metadata.currencies || []).find((c) => String(c.code).toUpperCase() === f);
    const tCur = (metadata.currencies || []).find((c) => String(c.code).toUpperCase() === to);
    if (fCur && tCur && parseFloat(fCur.rate) > 0) {
      return Number((parseFloat(tCur.rate) / parseFloat(fCur.rate)).toFixed(6));
    }
    return 0;
  };

  const fetchMetadata = async () => {
    try {
      const res = await axios.get(`${API_BASE}/meta/options`);
      if (res.data?.status && res.data.data) {
        setMetadata(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load money exchange metadata:', err);
    }
  };

  const fetchExchanges = async (overridePage) => {
    setLoading(true);
    try {
      const res = await axios.get(API_BASE, {
        params: {
          search: searchText,
          reference_no: referenceFilter,
          sale_status: saleStatusFilter,
          payment_status: paymentStatusFilter,
          biller_id: billerFilter,
          warehouse_id: warehouseFilter,
          customer_id: customerFilter,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          page: overridePage || pagination.page,
          limit: pagination.limit
        }
      });
      if (res.data?.status) {
        setExchanges(res.data.data || []);
        if (res.data.pagination) {
          setPagination((prev) => ({
            ...prev,
            page: res.data.pagination.page,
            totalRecords: res.data.pagination.totalRecords
          }));
        }
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        }
      }
    } catch (err) {
      console.error('Failed to fetch money exchanges:', err);
      message.error(t('failed_to_load_exchanges', 'Failed to load money exchange records'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchExchanges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    saleStatusFilter,
    paymentStatusFilter,
    billerFilter,
    warehouseFilter,
    customerFilter,
    pagination.page,
    pagination.limit
  ]);

  const handleApplyFilters = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchExchanges(1);
  };

  const handleResetFilters = () => {
    setSearchText('');
    setReferenceFilter('');
    setSaleStatusFilter('all');
    setPaymentStatusFilter('all');
    setBillerFilter('all');
    setWarehouseFilter('all');
    setCustomerFilter('all');
    setStartDate('');
    setEndDate('');
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(() => fetchExchanges(1), 0);
  };

  // Open Quick Counter Exchange Modal (Add or Edit)
  const openQuickExchangeModal = (record = null) => {
    const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    if (record) {
      setEditingQuickRecord(record);
      const firstItem = record.items?.[0] || {};
      const fromC = firstItem.from_currency || metadata.currencies?.[0]?.code || 'USD';
      const toC =
        firstItem.to_currency ||
        metadata.currencies?.find((c) => c.code !== fromC)?.code ||
        'KHR';
      const recDate = record.date
        ? new Date(new Date(record.date).getTime() - new Date().getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16)
        : nowLocal;

      quickForm.setFieldsValue({
        date: recDate,
        type: 'buy',
        customer_id: record.customer_id || metadata.customers?.[0]?.id,
        biller_id: record.biller_id || metadata.billers?.[0]?.id,
        from_currency: fromC,
        to_currency: toC,
        amount: parseFloat(firstItem.amount || 1),
        exchange_rate: parseFloat(firstItem.exchange_rate || findPairRate(fromC, toC)),
        paid_by: record.payment_method || 'cash',
        note: record.note || ''
      });
    } else {
      setEditingQuickRecord(null);
      const fromC = metadata.currencies?.find((c) => c.code === 'USD')?.code || metadata.currencies?.[0]?.code || 'USD';
      const toC =
        metadata.currencies?.find((c) => c.code === 'KHR' && c.code !== fromC)?.code ||
        metadata.currencies?.find((c) => c.code !== fromC)?.code ||
        'KHR';
      quickForm.setFieldsValue({
        date: nowLocal,
        type: 'buy',
        customer_id: metadata.customers?.[0]?.id || 1,
        biller_id: metadata.billers?.[0]?.id || 1,
        from_currency: fromC,
        to_currency: toC,
        amount: 100,
        exchange_rate: findPairRate(fromC, toC),
        paid_by: 'cash',
        note: ''
      });
    }
    setQuickModalOpen(true);
  };

  const handleSubmitQuickExchange = async (values) => {
    if (values.from_currency === values.to_currency) {
      message.warning(t('same_currency_warning', 'From Currency and To Currency cannot be the same!'));
      return;
    }
    setQuickSubmitting(true);
    try {
      const payload = {
        quick: true,
        date: values.date,
        type: values.type,
        customer_id: values.customer_id,
        biller_id: values.biller_id,
        from_currency: values.from_currency,
        to_currency: values.to_currency,
        amount: parseFloat(values.amount || 0),
        exchange_rate: parseFloat(values.exchange_rate || 0),
        paid_by: values.paid_by || 'cash',
        sale_status: 'completed',
        payment_status: 'paid',
        note: values.note || ''
      };

      if (editingQuickRecord) {
        await axios.put(`${API_BASE}/${editingQuickRecord.id}`, payload);
        message.success(t('exchange_updated_success', 'Money exchange updated successfully'));
      } else {
        await axios.post(API_BASE, payload);
        message.success(t('exchange_created_success', 'Counter currency exchange recorded'));
      }
      setQuickModalOpen(false);
      fetchExchanges();
      fetchMetadata();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to save quick exchange');
    } finally {
      setQuickSubmitting(false);
    }
  };

  // View Details / Printable Receipt
  const handleViewDetails = async (id) => {
    setDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/${id}`);
      if (res.data?.status) {
        setSelectedDetail(res.data.data);
      }
    } catch (err) {
      message.error('Failed to load exchange details');
    } finally {
      setDetailLoading(false);
    }
  };

  // View & Add Payments
  const handleOpenViewPayments = async (record) => {
    setActiveExchangeForPay(record);
    setViewPaymentsOpen(true);
    setLoadingPayments(true);
    try {
      const res = await axios.get(`${API_BASE}/${record.id}/payments`);
      setExchangePayments(res.data?.data || []);
    } catch (_) {
      setExchangePayments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleOpenAddPayment = (record) => {
    setActiveExchangeForPay(record);
    paymentForm.setFieldsValue({
      date: new Date().toISOString().slice(0, 10),
      reference_no: `PAY-${record.reference_no || 'ME'}-${Date.now().toString().slice(-4)}`,
      amount: record.balance > 0 ? record.balance : record.grand_total,
      paid_by: 'cash',
      note: ''
    });
    setAddPaymentOpen(true);
  };

  const handleSubmitPayment = async (values) => {
    if (!activeExchangeForPay) return;
    setSubmittingPayment(true);
    try {
      await axios.post(`${API_BASE}/${activeExchangeForPay.id}/payments`, values);
      message.success(t('payment_added', 'Payment recorded successfully'));
      setAddPaymentOpen(false);
      fetchExchanges();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!activeExchangeForPay) return;
    try {
      const res = await axios.delete(`${API_BASE}/${activeExchangeForPay.id}/payments/${paymentId}`);
      setExchangePayments(res.data?.data?.payments || []);
      message.success('Payment deleted');
      fetchExchanges();
    } catch (err) {
      message.error('Failed to delete payment');
    }
  };

  const handleDeleteExchange = async (id) => {
    try {
      await axios.delete(`${API_BASE}/${id}`);
      message.success(t('exchange_deleted', 'Money exchange deleted successfully'));
      fetchExchanges();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to delete exchange');
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedRowKeys.length) return;
    try {
      await axios.post(`${API_BASE}/bulk-delete`, { ids: selectedRowKeys });
      message.success(`${selectedRowKeys.length} record(s) deleted`);
      setSelectedRowKeys([]);
      fetchExchanges();
    } catch (err) {
      message.error('Bulk delete failed');
    }
  };

  const handleExportCsv = () => {
    if (!exchanges.length) {
      message.info('No records to export');
      return;
    }
    const headers = [
      'Date',
      'Reference No',
      'Biller',
      'Customer',
      'Currency Pairs',
      'Status',
      'Grand Total',
      'Paid',
      'Balance',
      'Payment Status'
    ];
    const csvRows = [
      headers.join(','),
      ...exchanges.map((r) =>
        [
          `"${r.date ? new Date(r.date).toLocaleString() : ''}"`,
          `"${r.reference_no || ''}"`,
          `"${(r.biller || '').replace(/"/g, '""')}"`,
          `"${(r.customer || '').replace(/"/g, '""')}"`,
          `"${(r.pairs_summary || '').replace(/"/g, '""')}"`,
          `"${r.sale_status || ''}"`,
          r.grand_total || 0,
          r.paid || 0,
          r.balance || 0,
          `"${r.payment_status || ''}"`
        ].join(',')
      )
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `money_exchange_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Current page totals for Table.Summary footer
  const pageTotals = useMemo(() => {
    return exchanges.reduce(
      (acc, r) => ({
        grand_total: acc.grand_total + (parseFloat(r.grand_total) || 0),
        paid: acc.paid + (parseFloat(r.paid) || 0),
        balance: acc.balance + (parseFloat(r.balance) || 0)
      }),
      { grand_total: 0, paid: 0, balance: 0 }
    );
  }, [exchanges]);

  const cardStyle = {
    borderRadius: 10,
    background: isDark ? '#0f172a' : '#ffffff',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
    boxShadow: isDark ? '0 4px 14px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(15, 23, 42, 0.04)'
  };

  const columns = [
    {
      title: t('date', 'Date'),
      dataIndex: 'date',
      key: 'date',
      width: 155,
      render: (val) => (
        <span style={{ fontSize: 12, color: isDark ? '#cbd5e1' : '#334155' }}>
          {val ? new Date(val).toLocaleString() : '-'}
        </span>
      )
    },
    {
      title: t('reference_no', 'Reference No'),
      dataIndex: 'reference_no',
      key: 'reference_no',
      width: 145,
      render: (val, record) => (
        <Button
          type="link"
          style={{ padding: 0, fontWeight: 600 }}
          onClick={() => handleViewDetails(record.id)}
        >
          {val}
        </Button>
      )
    },
    {
      title: t('biller', 'Biller'),
      dataIndex: 'biller',
      key: 'biller',
      width: 150,
      ellipsis: true
    },
    {
      title: t('customer', 'Customer'),
      dataIndex: 'customer',
      key: 'customer',
      width: 150,
      render: (val, record) => (
        <div>
          <Text strong style={{ color: isDark ? '#f1f5f9' : '#1e293b', fontSize: 13 }}>
            {val}
          </Text>
          {record.customer_phone && (
            <div style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' }}>
              {record.customer_phone}
            </div>
          )}
        </div>
      )
    },
    {
      title: t('currency_exchange_pair', 'Currency Pair & Rate'),
      key: 'pairs',
      width: 220,
      render: (_, record) => {
        const items = record.items || [];
        if (!items.length) return <Text type="secondary">-</Text>;
        return (
          <Space direction="vertical" size={2}>
            {items.slice(0, 2).map((it) => (
              <div key={it.id} style={{ fontSize: 12 }}>
                {it.from_currency || it.to_currency ? (
                  <Tag color="cyan" style={{ marginRight: 6 }}>
                    {it.from_currency || '?'} → {it.to_currency || '?'}
                  </Tag>
                ) : (
                  <Tag style={{ marginRight: 6 }}>{it.product_name}</Tag>
                )}
                <span style={{ color: isDark ? '#cbd5e1' : '#475569' }}>
                  {formatNum(it.amount)} @ <strong>{formatNum(it.exchange_rate, 2)}</strong>
                </span>
              </div>
            ))}
            {items.length > 2 && (
              <Text style={{ fontSize: 11 }} type="secondary">
                +{items.length - 2} more row(s)
              </Text>
            )}
          </Space>
        );
      }
    },
    {
      title: t('sale_status', 'Status'),
      dataIndex: 'sale_status',
      key: 'sale_status',
      width: 105,
      align: 'center',
      render: (val) => {
        const st = String(val || 'completed').toLowerCase();
        return (
          <Tag color={st === 'completed' ? 'success' : 'warning'} style={{ textTransform: 'capitalize' }}>
            {st}
          </Tag>
        );
      }
    },
    {
      title: t('grand_total', 'Grand Total'),
      dataIndex: 'grand_total',
      key: 'grand_total',
      width: 130,
      align: 'right',
      render: (val) => (
        <Text strong style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
          {formatNum(val)}
        </Text>
      )
    },
    {
      title: t('paid', 'Paid'),
      dataIndex: 'paid',
      key: 'paid',
      width: 120,
      align: 'right',
      render: (val) => (
        <Text style={{ color: isDark ? '#4ade80' : '#15803d', fontWeight: 500 }}>{formatNum(val)}</Text>
      )
    },
    {
      title: t('balance', 'Balance'),
      dataIndex: 'balance',
      key: 'balance',
      width: 120,
      align: 'right',
      render: (val) => (
        <Text
          strong={parseFloat(val) > 0}
          style={{ color: parseFloat(val) > 0 ? (isDark ? '#f87171' : '#dc2626') : isDark ? '#94a3b8' : '#64748b' }}
        >
          {formatNum(val)}
        </Text>
      )
    },
    {
      title: t('payment_status', 'Payment Status'),
      dataIndex: 'payment_status',
      key: 'payment_status',
      width: 120,
      align: 'center',
      render: (val) => {
        const st = String(val || 'pending').toLowerCase();
        const color = st === 'paid' ? 'green' : st === 'partial' ? 'blue' : 'orange';
        return (
          <Tag color={color} style={{ textTransform: 'capitalize' }}>
            {st}
          </Tag>
        );
      }
    },
    {
      title: t('actions', 'Actions'),
      key: 'actions',
      width: 105,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <TableActionDropdown
          items={[
            {
              key: 'details',
              label: t('exchange_details_receipt', 'View Receipt / Details'),
              icon: <EyeOutlined />,
              onClick: () => handleViewDetails(record.id)
            },
            {
              key: 'quick_edit',
              label: t('quick_edit_counter', 'Quick Counter Edit'),
              icon: <ThunderboltOutlined />,
              onClick: () => openQuickExchangeModal(record)
            },
            {
              key: 'edit',
              label: t('edit_exchange', 'Edit Full Exchange'),
              icon: <EditOutlined />,
              onClick: () => navigate(`/admins/money/edit/${record.id}`)
            },
            {
              key: 'duplicate',
              label: t('duplicate_exchange', 'Duplicate Exchange'),
              icon: <CopyOutlined />,
              onClick: () => navigate(`/admins/money/add?duplicate=${record.id}`)
            },
            { type: 'divider' },
            {
              key: 'view_payments',
              label: t('view_payments', 'View Payments'),
              icon: <CreditCardOutlined />,
              onClick: () => handleOpenViewPayments(record)
            },
            {
              key: 'add_payment',
              label: t('add_payment', 'Add Payment'),
              icon: <DollarOutlined />,
              onClick: () => handleOpenAddPayment(record)
            },
            { type: 'divider' },
            {
              key: 'delete',
              danger: true,
              label: t('delete_exchange', 'Delete Exchange'),
              icon: <DeleteOutlined />,
              onClick: () => {
                Modal.confirm({
                  title: t('confirm_delete_exchange', `Delete Money Exchange ${record.reference_no}?`),
                  content: t('cannot_undo_action', 'This will remove the exchange record and its items.'),
                  okText: t('delete', 'Delete'),
                  okType: 'danger',
                  onOk: () => handleDeleteExchange(record.id)
                });
              }
            }
          ]}
        />
      )
    }
  ];

  return (
    <div style={{ padding: '4px 0 32px' }}>
      <MoneyModuleNav activeKey="list" />

      {/* Header Actions */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0, color: isDark ? '#f8fafc' : '#0f172a' }}>
            {t('list_exchange_money', 'Money Exchange Management')}
          </Title>
          <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>
            {t(
              'money_exchange_subtitle',
              'Manage counter foreign currency exchanges, exchange rate boards, and money transfer companies.'
            )}
          </Text>
        </div>

        <Space wrap>
          <Button
            icon={<ThunderboltOutlined />}
            onClick={() => openQuickExchangeModal(null)}
            style={{
              borderRadius: 8,
              borderColor: '#10b981',
              color: isDark ? '#34d399' : '#059669',
              fontWeight: 600
            }}
          >
            {t('quick_counter_exchange', 'Quick Counter Exchange')}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/admins/money/add')}
            style={{ background: '#10b981', borderColor: '#10b981', borderRadius: 8, fontWeight: 600 }}
          >
            {t('add_exchange', 'Add Exchange')}
          </Button>
          <Button
            icon={<FilterOutlined />}
            onClick={() => setShowFilters((v) => !v)}
            style={{ borderRadius: 8 }}
          >
            {t('filters', 'Filters')}
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExportCsv} style={{ borderRadius: 8 }}>
            CSV
          </Button>
          <Button icon={<PrinterOutlined />} onClick={() => window.print()} style={{ borderRadius: 8 }} />
          <Button icon={<ReloadOutlined />} onClick={() => fetchExchanges()} style={{ borderRadius: 8 }} />
          {selectedRowKeys.length > 0 && (
            <Popconfirm
              title={`Delete ${selectedRowKeys.length} selected record(s)?`}
              onConfirm={handleBulkDelete}
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<DeleteOutlined />} style={{ borderRadius: 8 }}>
                {t('delete_selected', `Delete (${selectedRowKeys.length})`)}
              </Button>
            </Popconfirm>
          )}
        </Space>
      </div>

      {/* KPI Metrics Row */}
      <Row gutter={[14, 14]} style={{ marginBottom: 16 }}>
        {[
          {
            label: t('total_exchanges', 'Total Exchanges'),
            value: metrics.totalExchanges,
            isCount: true,
            accent: '#3b82f6',
            icon: <SwapOutlined />
          },
          {
            label: t('total_exchange_volume', 'Exchange Grand Total'),
            value: formatNum(metrics.totalVolume),
            accent: '#10b981',
            icon: <DollarOutlined />
          },
          {
            label: t('total_paid', 'Total Paid / Settled'),
            value: formatNum(metrics.totalPaid),
            accent: '#22c55e',
            icon: <CheckCircleOutlined />
          },
          {
            label: t('outstanding_balance', 'Pending Balance'),
            value: formatNum(metrics.totalBalance),
            accent: '#f59e0b',
            icon: <ClockCircleOutlined />
          }
        ].map((kpi, idx) => (
          <Col xs={24} sm={12} lg={6} key={idx}>
            <Card bordered={false} style={cardStyle} bodyStyle={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>{kpi.label}</Text>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: isDark ? '#f8fafc' : '#0f172a',
                      marginTop: 4
                    }}
                  >
                    {kpi.value}
                  </div>
                </div>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    color: kpi.accent,
                    background: `${kpi.accent}1a`
                  }}
                >
                  {kpi.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Collapsible Advanced Filter Panel (Matches AURA_v1 views/money/index.php #form) */}
      {showFilters && (
        <Card bordered={false} style={{ ...cardStyle, marginBottom: 16 }}>
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} md={6}>
              <Text style={{ fontSize: 12, color: isDark ? '#cbd5e1' : '#475569' }}>
                {t('reference_no', 'Reference No')}
              </Text>
              <Input
                value={referenceFilter}
                onChange={(e) => setReferenceFilter(e.target.value)}
                placeholder="e.g. ME-202611..."
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Text style={{ fontSize: 12, color: isDark ? '#cbd5e1' : '#475569' }}>
                {t('biller', 'Biller')}
              </Text>
              <Select value={billerFilter} onChange={setBillerFilter} style={{ width: '100%' }}>
                <Option value="all">{t('all_billers', 'All Billers')}</Option>
                {(metadata.billers || []).map((b) => (
                  <Option key={b.id} value={b.id}>
                    {b.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Text style={{ fontSize: 12, color: isDark ? '#cbd5e1' : '#475569' }}>
                {t('warehouse', 'Warehouse')}
              </Text>
              <Select value={warehouseFilter} onChange={setWarehouseFilter} style={{ width: '100%' }}>
                <Option value="all">{t('all_warehouses', 'All Warehouses')}</Option>
                {(metadata.warehouses || []).map((w) => (
                  <Option key={w.id} value={w.id}>
                    {w.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Text style={{ fontSize: 12, color: isDark ? '#cbd5e1' : '#475569' }}>
                {t('customer', 'Customer')}
              </Text>
              <Select
                showSearch
                optionFilterProp="children"
                value={customerFilter}
                onChange={setCustomerFilter}
                style={{ width: '100%' }}
              >
                <Option value="all">{t('all_customers', 'All Customers')}</Option>
                {(metadata.customers || []).map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Text style={{ fontSize: 12, color: isDark ? '#cbd5e1' : '#475569' }}>
                {t('payment_status', 'Payment Status')}
              </Text>
              <Select value={paymentStatusFilter} onChange={setPaymentStatusFilter} style={{ width: '100%' }}>
                <Option value="all">{t('all', 'All')}</Option>
                <Option value="paid">{t('paid', 'Paid')}</Option>
                <Option value="partial">{t('partial', 'Partial')}</Option>
                <Option value="pending">{t('pending_due', 'Pending / Due')}</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Text style={{ fontSize: 12, color: isDark ? '#cbd5e1' : '#475569' }}>
                {t('start_date', 'Start Date')}
              </Text>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Text style={{ fontSize: 12, color: isDark ? '#cbd5e1' : '#475569' }}>
                {t('end_date', 'End Date')}
              </Text>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Col>
            <Col xs={24} sm={12} md={6} style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <Button type="primary" onClick={handleApplyFilters} style={{ background: '#10b981', borderColor: '#10b981' }}>
                {t('submit', 'Apply Filters')}
              </Button>
              <Button onClick={handleResetFilters}>{t('reset', 'Reset')}</Button>
            </Col>
          </Row>
        </Card>
      )}

      {/* Main Data Table Card */}
      <Card bordered={false} style={cardStyle}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: isDark ? '#94a3b8' : '#64748b' }} />}
            placeholder={t('search_money_exchanges', 'Search reference, customer, currency (USD, KHR, BAHT)...')}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleApplyFilters}
            style={{ maxWidth: 380 }}
          />
          <Select value={saleStatusFilter} onChange={setSaleStatusFilter} style={{ width: 155 }}>
            <Option value="all">{t('all_statuses', 'All Statuses')}</Option>
            <Option value="completed">{t('completed', 'Completed')}</Option>
            <Option value="pending">{t('pending', 'Pending')}</Option>
          </Select>
          <Button onClick={handleApplyFilters}>{t('search', 'Search')}</Button>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={exchanges}
          scroll={{ x: 1200 }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys
          }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.totalRecords,
            showSizeChanger: true,
            showTotal: (tot) => `Total ${tot} exchanges`,
            onChange: (p, sz) => setPagination((prev) => ({ ...prev, page: p, limit: sz }))
          }}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row
                style={{
                  background: isDark ? 'rgba(30, 41, 59, 0.85)' : '#f8fafc',
                  fontWeight: 700
                }}
              >
                <Table.Summary.Cell index={0} colSpan={7} align="right">
                  <Text strong style={{ color: isDark ? '#e2e8f0' : '#0f172a' }}>
                    {t('page_totals', 'Page Totals')}:
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7} align="right">
                  <Text strong style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
                    {formatNum(pageTotals.grand_total)}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8} align="right">
                  <Text strong style={{ color: isDark ? '#4ade80' : '#15803d' }}>
                    {formatNum(pageTotals.paid)}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={9} align="right">
                  <Text strong style={{ color: isDark ? '#f87171' : '#dc2626' }}>
                    {formatNum(pageTotals.balance)}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={10} colSpan={2} />
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>

      {/* Quick Counter Exchange Modal (Replicates AURA_v1 views/money/add_exchange_.php & edit_exchange.php) */}
      <Modal
        title={
          <Space>
            <ThunderboltOutlined style={{ color: '#10b981' }} />
            <span>
              {editingQuickRecord
                ? t('edit_counter_exchange', `Edit Counter Exchange (${editingQuickRecord.reference_no})`)
                : t('quick_counter_exchange', 'Quick Counter Currency Exchange')}
            </span>
          </Space>
        }
        open={quickModalOpen}
        onCancel={() => setQuickModalOpen(false)}
        onOk={() => quickForm.submit()}
        confirmLoading={quickSubmitting}
        okText={editingQuickRecord ? t('update_exchange', 'Update Exchange') : t('complete_exchange', 'Complete Exchange')}
        okButtonProps={{ style: { background: '#10b981', borderColor: '#10b981' } }}
        width={580}
      >
        <Form form={quickForm} layout="vertical" onFinish={handleSubmitQuickExchange}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="date" label={t('date', 'Date')} rules={[{ required: true }]}>
                <Input type="datetime-local" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label={t('type', 'Transaction Type')} rules={[{ required: true }]}>
                <Select>
                  <Option value="buy">{t('buy_currency', 'Buy Foreign Currency')}</Option>
                  <Option value="sell">{t('sell_currency', 'Sell Foreign Currency')}</Option>
                  <Option value="transfer">{t('money_transfer', 'Money Transfer')}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="biller_id" label={t('biller', 'Biller / Branch')} rules={[{ required: true }]}>
                <Select>
                  {(metadata.billers || []).map((b) => (
                    <Option key={b.id} value={b.id}>
                      {b.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="customer_id" label={t('customer', 'Customer')} rules={[{ required: true }]}>
                <Select showSearch optionFilterProp="children">
                  {(metadata.customers || []).map((c) => (
                    <Option key={c.id} value={c.id}>
                      {c.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={10}>
              <Form.Item
                name="from_currency"
                label={t('from_currency', 'From Currency')}
                rules={[{ required: true }]}
              >
                <Select
                  onChange={(val) => {
                    const toVal = quickForm.getFieldValue('to_currency');
                    quickForm.setFieldValue('exchange_rate', findPairRate(val, toVal));
                  }}
                >
                  {(metadata.currencies || []).map((c) => (
                    <Option key={c.code} value={c.code}>
                      {c.code} ({c.name})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={4} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 6 }}>
              <Tooltip title="Swap Pair">
                <Button
                  shape="circle"
                  icon={<SwapOutlined />}
                  onClick={() => {
                    const f = quickForm.getFieldValue('from_currency');
                    const to = quickForm.getFieldValue('to_currency');
                    quickForm.setFieldsValue({
                      from_currency: to,
                      to_currency: f,
                      exchange_rate: findPairRate(to, f)
                    });
                  }}
                />
              </Tooltip>
            </Col>
            <Col span={10}>
              <Form.Item name="to_currency" label={t('to_currency', 'To Currency')} rules={[{ required: true }]}>
                <Select
                  onChange={(val) => {
                    const fromVal = quickForm.getFieldValue('from_currency');
                    quickForm.setFieldValue('exchange_rate', findPairRate(fromVal, val));
                  }}
                >
                  {(metadata.currencies || []).map((c) => (
                    <Option key={c.code} value={c.code}>
                      {c.code} ({c.name})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="amount" label={t('amount', 'Amount')} rules={[{ required: true }]}>
                <InputNumber min={0.01} style={{ width: '100%' }} addonAfter={qFromCur || ''} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="exchange_rate"
                label={t('exchange_rate', 'Exchange Rate')}
                rules={[{ required: true }]}
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            {/* Live Conversion Display */}
            <Col span={24}>
              <div
                style={{
                  padding: '12px 16px',
                  marginBottom: 14,
                  borderRadius: 8,
                  background: isDark ? 'rgba(16, 185, 129, 0.14)' : '#ecfdf5',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ color: isDark ? '#cbd5e1' : '#065f46', fontWeight: 500 }}>
                  {formatNum(qAmount || 0)} {qFromCur || ''} × {formatNum(qRate || 0, 4)}
                </span>
                <span style={{ fontSize: 18, fontWeight: 700, color: isDark ? '#4ade80' : '#047857' }}>
                  = {formatNum((parseFloat(qAmount) || 0) * (parseFloat(qRate) || 0))} {qToCur || ''}
                </span>
              </div>
            </Col>

            <Col span={12}>
              <Form.Item name="paid_by" label={t('paying_by', 'Paid By')}>
                <Select>
                  <Option value="cash">Cash</Option>
                  <Option value="ABA">ABA / KHQR</Option>
                  <Option value="Wing">Wing</Option>
                  <Option value="TrueMoney">TrueMoney</Option>
                  <Option value="Emoney">eMoney</Option>
                  <Option value="bank_transfer">Bank Transfer</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="note" label={t('note', 'Note')}>
                <Input placeholder="Optional counter note..." />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Printable Exchange Receipt / Details Modal */}
      <Modal
        title={t('exchange_voucher_details', 'Money Exchange Voucher & Receipt')}
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        width={760}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={() => window.print()}>
            {t('print_receipt', 'Print Voucher')}
          </Button>,
          selectedDetail && (
            <Button
              key="edit"
              type="primary"
              icon={<EditOutlined />}
              style={{ background: '#10b981', borderColor: '#10b981' }}
              onClick={() => {
                setDetailModalOpen(false);
                navigate(`/admins/money/edit/${selectedDetail.id}`);
              }}
            >
              {t('edit', 'Edit')}
            </Button>
          ),
          <Button key="close" onClick={() => setDetailModalOpen(false)}>
            {t('close', 'Close')}
          </Button>
        ]}
      >
        <Spin spinning={detailLoading}>
          {selectedDetail && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                  paddingBottom: 12,
                  borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                  marginBottom: 14
                }}
              >
                <div>
                  <Title level={5} style={{ margin: 0 }}>
                    {selectedDetail.biller || 'Aura Money Exchange'}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Ref: <strong>{selectedDetail.reference_no}</strong> | Date:{' '}
                    {selectedDetail.date ? new Date(selectedDetail.date).toLocaleString() : '-'}
                  </Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div>
                    <Text strong>Customer: </Text>
                    <Text>{selectedDetail.customer}</Text>
                  </div>
                  <Space size={6} style={{ marginTop: 4 }}>
                    <Tag color={selectedDetail.sale_status === 'completed' ? 'green' : 'orange'}>
                      {selectedDetail.sale_status}
                    </Tag>
                    <Tag color={selectedDetail.payment_status === 'paid' ? 'green' : 'gold'}>
                      {selectedDetail.payment_status}
                    </Tag>
                  </Space>
                </div>
              </div>

              <Table
                size="small"
                bordered
                pagination={false}
                rowKey="id"
                dataSource={selectedDetail.items || []}
                columns={[
                  { title: 'Service', dataIndex: 'product_name', key: 'product_name' },
                  {
                    title: 'From → To',
                    key: 'pair',
                    render: (_, it) =>
                      it.from_currency || it.to_currency
                        ? `${it.from_currency || '-'} → ${it.to_currency || '-'}`
                        : '-'
                  },
                  {
                    title: 'Amount',
                    dataIndex: 'unit_quantity',
                    align: 'right',
                    render: (v, it) => `${formatNum(v)} ${it.from_currency || ''}`
                  },
                  {
                    title: 'Exchange Rate',
                    dataIndex: 'exchange_rate',
                    align: 'right',
                    render: (v) => formatNum(v, 4)
                  },
                  {
                    title: 'Subtotal',
                    dataIndex: 'subtotal',
                    align: 'right',
                    render: (v, it) => (
                      <strong>
                        {formatNum(v)} {it.to_currency || ''}
                      </strong>
                    )
                  }
                ]}
              />

              <div
                style={{
                  marginTop: 14,
                  display: 'flex',
                  justifyContent: 'flex-end'
                }}
              >
                <div style={{ minWidth: 250 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                    <Text type="secondary">Grand Total:</Text>
                    <Text strong>{formatNum(selectedDetail.grand_total)}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                    <Text type="secondary">Paid:</Text>
                    <Text style={{ color: '#10b981', fontWeight: 600 }}>{formatNum(selectedDetail.paid)}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                    <Text type="secondary">Balance:</Text>
                    <Text strong style={{ color: selectedDetail.balance > 0 ? '#ef4444' : undefined }}>
                      {formatNum(selectedDetail.balance)}
                    </Text>
                  </div>
                </div>
              </div>

              {selectedDetail.note && (
                <div style={{ marginTop: 12 }}>
                  <Text type="secondary">Note: </Text>
                  <Text>{selectedDetail.note}</Text>
                </div>
              )}
            </div>
          )}
        </Spin>
      </Modal>

      {/* View Payments Modal */}
      <Modal
        title={`Payments — ${activeExchangeForPay?.reference_no || ''}`}
        open={viewPaymentsOpen}
        onCancel={() => setViewPaymentsOpen(false)}
        footer={[
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            style={{ background: '#10b981', borderColor: '#10b981' }}
            onClick={() => {
              setViewPaymentsOpen(false);
              if (activeExchangeForPay) handleOpenAddPayment(activeExchangeForPay);
            }}
          >
            Add Payment
          </Button>,
          <Button key="close" onClick={() => setViewPaymentsOpen(false)}>
            Close
          </Button>
        ]}
        width={680}
      >
        <Table
          size="small"
          rowKey="id"
          loading={loadingPayments}
          dataSource={exchangePayments}
          pagination={false}
          columns={[
            {
              title: 'Date',
              dataIndex: 'date',
              render: (v) => (v ? new Date(v).toLocaleString() : '-')
            },
            { title: 'Reference', dataIndex: 'reference_no' },
            { title: 'Paid By', dataIndex: 'paid_by' },
            {
              title: 'Amount',
              dataIndex: 'amount',
              align: 'right',
              render: (v) => <strong>{formatNum(v)}</strong>
            },
            { title: 'Note', dataIndex: 'note' },
            {
              title: '',
              width: 50,
              render: (_, p) => (
                <Popconfirm title="Delete payment?" onConfirm={() => handleDeletePayment(p.id)}>
                  <Button danger type="text" size="small" icon={<DeleteOutlined />} />
                </Popconfirm>
              )
            }
          ]}
        />
      </Modal>

      {/* Add Payment Modal */}
      <Modal
        title={`Record Payment — ${activeExchangeForPay?.reference_no || ''}`}
        open={addPaymentOpen}
        onCancel={() => setAddPaymentOpen(false)}
        onOk={() => paymentForm.submit()}
        confirmLoading={submittingPayment}
        okButtonProps={{ style: { background: '#10b981', borderColor: '#10b981' } }}
      >
        <Form form={paymentForm} layout="vertical" onFinish={handleSubmitPayment}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="date" label="Date" rules={[{ required: true }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="reference_no" label="Payment Reference" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
                <InputNumber min={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="paid_by" label="Paying By" rules={[{ required: true }]}>
                <Select>
                  <Option value="cash">Cash</Option>
                  <Option value="ABA">ABA / KHQR</Option>
                  <Option value="Wing">Wing</Option>
                  <Option value="TrueMoney">TrueMoney</Option>
                  <Option value="Emoney">eMoney</Option>
                  <Option value="bank_transfer">Bank Transfer</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="note" label="Note">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default MoneyExchangeListPage;
