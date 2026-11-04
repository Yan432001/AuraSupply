import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Row,
  Col,
  Typography,
  Divider,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Spin,
  Tabs,
  Popconfirm,
  Alert
} from 'antd';
import {
  ArrowLeftOutlined,
  PrinterOutlined,
  DollarOutlined,
  EditOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  DropboxOutlined,
  CreditCardOutlined,
  DeleteOutlined,
  CarOutlined,
  BarcodeOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { formatCurrency } from '../../../utils/uiTheme';
import { useAdminTheme } from '../../../hooks/useAdminTheme';
import { useTranslation } from '../../../contexts/LanguageContext';

const { Title, Text } = Typography;
const { Option } = Select;

const API_BASE = '/api/admin/sales';

const SaleDetailPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const adminTheme = useAdminTheme();
  const themeTokens = adminTheme?.themeTokens || adminTheme;
  const isDark = adminTheme?.isDark;

  const [loading, setLoading] = useState(true);
  const [sale, setSale] = useState(null);

  // Add Payment Modal State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentForm] = Form.useForm();

  // Cancel Sale State
  const [cancellingSale, setCancellingSale] = useState(false);

  // Deliveries State
  const [deliveries, setDeliveries] = useState([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [deliveryModalVisible, setDeliveryModalVisible] = useState(false);
  const [deliveryForm] = Form.useForm();
  const [submittingDelivery, setSubmittingDelivery] = useState(false);

  // 80mm POS Receipt Modal
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);

  // Fetch single sale details
  const fetchSale = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/${id}`);
      if (res.data?.status && res.data.data) {
        setSale(res.data.data);
      } else {
        message.error(t('sale_not_found', 'Sale record not found.'));
        navigate('/admins/sales');
      }
    } catch (err) {
      console.error('Failed to load sale details:', err);
      message.error(t('error_loading_sale', 'Failed to load sale details.'));
    } finally {
      setLoading(false);
    }
  };

  // Fetch Deliveries
  const fetchDeliveries = async () => {
    setLoadingDeliveries(true);
    try {
      const res = await axios.get(`${API_BASE}/${id}/deliveries`);
      if (res.data?.status && Array.isArray(res.data.data)) {
        setDeliveries(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load deliveries:', err);
    } finally {
      setLoadingDeliveries(false);
    }
  };

  useEffect(() => {
    fetchSale();
    fetchDeliveries();
  }, [id]);

  // Open Payment Modal
  const handleOpenPayment = () => {
    if (!sale) return;
    paymentForm.setFieldsValue({
      amount: sale.balance > 0 ? sale.balance : 0,
      paid_by: 'cash',
      date: new Date().toISOString().slice(0, 10),
      reference_no: `PAY-${sale.referenceNo}-${Date.now().toString().slice(-4)}`,
      note: ''
    });
    setPaymentModalVisible(true);
  };

  // Submit Payment
  const handleSubmitPayment = async (values) => {
    setSubmittingPayment(true);
    try {
      const res = await axios.post(`${API_BASE}/${id}/payments`, values);
      if (res.data?.status) {
        message.success(t('payment_added_success', 'Payment recorded successfully.'));
        setPaymentModalVisible(false);
        fetchSale();
      } else {
        message.error(res.data?.message || t('payment_add_failed', 'Failed to record payment.'));
      }
    } catch (err) {
      console.error('Error adding payment:', err);
      message.error(err.response?.data?.message || t('payment_add_failed', 'Failed to record payment.'));
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Delete Payment
  const handleDeletePayment = async (paymentId) => {
    try {
      const res = await axios.delete(`${API_BASE}/${id}/payments/${paymentId}`);
      if (res.data?.status) {
        message.success(t('payment_deleted_success', 'Payment record deleted.'));
        fetchSale();
      } else {
        message.error(res.data?.message || t('payment_delete_failed', 'Failed to delete payment.'));
      }
    } catch (err) {
      console.error('Error deleting payment:', err);
      message.error(err.response?.data?.message || t('payment_delete_failed', 'Failed to delete payment.'));
    }
  };

  // Open Add Delivery Modal
  const handleOpenDeliveryModal = () => {
    deliveryForm.resetFields();
    deliveryForm.setFieldsValue({
      do_reference_no: `DO-${sale.referenceNo}`,
      date: new Date().toISOString().slice(0, 10),
      address: sale.customerDetails?.address || '',
      status: 'delivering',
      delivered_by: '',
      note: ''
    });
    setDeliveryModalVisible(true);
  };

  // Submit Delivery
  const handleSubmitDelivery = async (values) => {
    setSubmittingDelivery(true);
    try {
      const res = await axios.post(`${API_BASE}/${id}/deliveries`, values);
      if (res.data?.status) {
        message.success(t('delivery_dispatched_success', 'Delivery order dispatched successfully!'));
        setDeliveryModalVisible(false);
        fetchDeliveries();
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to dispatch delivery');
    } finally {
      setSubmittingDelivery(false);
    }
  };

  // Cancel Sale (Stock Reversal)
  const handleCancelSale = async () => {
    setCancellingSale(true);
    try {
      const res = await axios.put(`${API_BASE}/${id}/status`, {
        sale_status: 'cancelled',
        note: 'Cancelled by administrator. Stock restored.'
      });
      if (res.data?.status) {
        message.success(t('sale_cancelled_stock_restored', 'Sale has been cancelled and inventory restored.'));
        fetchSale();
      } else {
        message.error(res.data?.message || t('cancel_failed', 'Failed to cancel sale.'));
      }
    } catch (err) {
      console.error('Error cancelling sale:', err);
      message.error(err.response?.data?.message || t('cancel_failed', 'Failed to cancel sale.'));
    } finally {
      setCancellingSale(false);
    }
  };

  // Print Handlers
  const handlePrintA4 = () => {
    window.print();
  };

  const handlePrintReceipt = () => {
    const printContent = document.getElementById('pos-thermal-receipt-container');
    if (!printContent) return;
    const printWindow = window.open('', '', 'width=400,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>POS Receipt - ${sale.referenceNo}</title>
          <style>
            body { font-family: monospace, sans-serif; font-size: 12px; margin: 0; padding: 10px; width: 80mm; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #333; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { padding: 3px 0; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: '#64748b', fontSize: 13 }}>
          {t('loading_sale_details', 'Loading sale details...')}
        </div>
      </div>
    );
  }

  if (!sale) return null;

  const isCancelled = sale.saleStatus === 'cancelled';

  // Item Table Columns
  const itemColumns = [
    {
      title: '#',
      dataIndex: 'index',
      key: 'index',
      width: 45,
      render: (_, __, idx) => idx + 1
    },
    {
      title: t('product_name', 'Product Name'),
      dataIndex: 'productName',
      key: 'productName',
      render: (name, record) => (
        <div>
          <Text strong style={{ fontSize: '13px' }}>{name}</Text>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            {record.productCode && <span style={{ marginRight: 8 }}>SKU: {record.productCode}</span>}
            {record.variantName && (
              <Tag color="cyan" style={{ fontSize: '11px', padding: '0 4px', margin: 0 }}>
                {record.variantName}
              </Tag>
            )}
            {record.unitName && (
              <Tag color="blue" style={{ fontSize: '11px', padding: '0 4px', marginLeft: 4 }}>
                {record.unitName}
              </Tag>
            )}
          </div>
          {record.comment && (
            <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>{record.comment}</div>
          )}
        </div>
      )
    },
    {
      title: t('unit', 'Unit'),
      dataIndex: 'unitCode',
      key: 'unitCode',
      width: 90,
      render: (val) => val || 'Unit'
    },
    {
      title: t('quantity', 'Quantity'),
      dataIndex: 'unitQuantity',
      key: 'quantity',
      width: 90,
      align: 'right',
      render: (val, r) => <strong>{(parseFloat(val || r.quantity) || 1).toLocaleString()}</strong>
    },
    {
      title: t('unit_price', 'Unit Price'),
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 110,
      align: 'right',
      render: (val) => formatCurrency(val)
    },
    {
      title: t('discount', 'Discount'),
      dataIndex: 'itemDiscount',
      key: 'itemDiscount',
      width: 100,
      align: 'right',
      render: (val) => parseFloat(val) > 0 ? formatCurrency(val) : '-'
    },
    {
      title: t('tax', 'Tax'),
      dataIndex: 'itemTax',
      key: 'itemTax',
      width: 90,
      align: 'right',
      render: (val) => parseFloat(val) > 0 ? formatCurrency(val) : '-'
    },
    {
      title: t('subtotal', 'Subtotal'),
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 120,
      align: 'right',
      render: (val) => (
        <Text strong style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
          {formatCurrency(val)}
        </Text>
      )
    }
  ];

  // Payment Table Columns
  const paymentColumns = [
    {
      title: t('date', 'Date'),
      dataIndex: 'date',
      key: 'date',
      render: (val) => val ? new Date(val).toLocaleDateString() : '-'
    },
    {
      title: t('reference', 'Reference No'),
      dataIndex: 'referenceNo',
      key: 'referenceNo',
      render: (val) => <Text strong>{val || '-'}</Text>
    },
    {
      title: t('method', 'Payment Method'),
      dataIndex: 'paidBy',
      key: 'paidBy',
      render: (val) => {
        const methodMap = {
          cash: { label: 'Cash', color: 'green' },
          bank_transfer: { label: 'Bank / ABA', color: 'blue' },
          card: { label: 'Card', color: 'purple' },
          cheque: { label: 'Cheque', color: 'orange' }
        };
        const m = methodMap[val] || { label: String(val).toUpperCase(), color: 'default' };
        return <Tag color={m.color}>{m.label}</Tag>;
      }
    },
    {
      title: t('amount', 'Amount'),
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (val) => (
        <Text strong style={{ color: '#16a34a' }}>
          {formatCurrency(val)}
        </Text>
      )
    },
    {
      title: t('note', 'Note'),
      dataIndex: 'note',
      key: 'note',
      render: (val) => val || '-'
    },
    {
      title: '',
      key: 'action',
      width: 60,
      align: 'center',
      render: (_, record) => (
        <Popconfirm
          title={t('confirm_delete_payment', 'Delete this payment record?')}
          onConfirm={() => handleDeletePayment(record.id)}
          okText={t('yes', 'Yes')}
          cancelText={t('no', 'No')}
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      )
    }
  ];

  // Stock Movement Columns
  const movementColumns = [
    {
      title: t('date', 'Date'),
      dataIndex: 'date',
      key: 'date',
      render: (val) => val ? new Date(val).toLocaleString() : '-'
    },
    {
      title: t('transaction', 'Transaction'),
      dataIndex: 'transaction',
      key: 'transaction',
      render: (val) => {
        const isRev = val === 'Sale Reversal';
        return <Tag color={isRev ? 'magenta' : 'blue'}>{val}</Tag>;
      }
    },
    {
      title: t('product', 'Product & SKU'),
      key: 'prod',
      render: (_, record) => (
        <div>
          <span>{record.productName}</span>
          {record.productCode && (
            <span style={{ fontSize: '11px', color: '#64748b', marginLeft: 6 }}>
              ({record.productCode})
            </span>
          )}
        </div>
      )
    },
    {
      title: t('quantity_change', 'Quantity Change'),
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
      render: (val, record) => {
        const qty = parseFloat(val);
        const isNeg = qty < 0;
        return (
          <span style={{ color: isNeg ? '#ef4444' : '#16a34a', fontWeight: 600 }}>
            {isNeg ? qty : `+${qty}`} {record.unitCode || 'Unit'}
          </span>
        );
      }
    }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Header Actions (Hidden in Print) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Space direction="horizontal" align="center" size="middle">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admins/sales')}
            style={{ borderRadius: '8px' }}
          >
            {t('back_to_sales', 'Back to Sales')}
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Title level={4} style={{ margin: 0, fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>
                {t('sale', 'Sale')} #{sale.referenceNo}
              </Title>
              <Tag color={sale.pos ? 'orange' : 'blue'}>
                {sale.pos ? 'POS Terminal Counter' : 'Commercial Invoice'}
              </Tag>
              <Tag color={sale.saleStatus === 'completed' ? 'green' : sale.saleStatus === 'pending' ? 'orange' : 'red'}>
                {sale.saleStatus.toUpperCase()}
              </Tag>
              <Tag color={sale.paymentStatus === 'paid' ? 'green' : sale.paymentStatus === 'partial' ? 'blue' : 'red'}>
                {sale.paymentStatus.toUpperCase()}
              </Tag>
            </div>
            <Text type="secondary" style={{ fontSize: '13px' }}>
              {t('cashier', 'Cashier')}: {sale.cashier} | {new Date(sale.date).toLocaleDateString()}
            </Text>
          </div>
        </Space>

        <Space>
          <Button
            icon={<PrinterOutlined />}
            onClick={handlePrintA4}
            style={{ borderRadius: '8px' }}
          >
            {t('print_invoice_a4', 'Print A4 Invoice')}
          </Button>

          <Button
            icon={<BarcodeOutlined />}
            onClick={() => setReceiptModalVisible(true)}
            style={{ borderRadius: '8px' }}
          >
            {t('print_receipt_pos', '80mm POS Receipt')}
          </Button>

          {!isCancelled && sale.balance > 0 && (
            <Button
              type="primary"
              icon={<DollarOutlined />}
              onClick={handleOpenPayment}
              style={{
                background: '#16a34a',
                borderColor: '#16a34a',
                borderRadius: '8px',
                fontWeight: 600
              }}
            >
              {t('add_payment', 'Add Payment')}
            </Button>
          )}

          {!isCancelled && (
            <Button
              icon={<EditOutlined />}
              onClick={() => navigate(`/admins/sales/edit/${id}`)}
              style={{ borderRadius: '8px' }}
            >
              {t('edit_sale', 'Edit Sale')}
            </Button>
          )}

          {!isCancelled && (
            <Popconfirm
              title={t('confirm_cancel_sale_title', 'Cancel this sale?')}
              description={t('confirm_cancel_sale_desc', 'This will safely restore all deducted warehouse inventory and mark the sale as Cancelled.')}
              onConfirm={handleCancelSale}
              okText={t('yes_cancel', 'Yes, Cancel Sale')}
              cancelText={t('no', 'No')}
              okButtonProps={{ danger: true, loading: cancellingSale }}
            >
              <Button danger icon={<CloseCircleOutlined />} style={{ borderRadius: '8px' }}>
                {t('cancel_sale', 'Cancel Sale')}
              </Button>
            </Popconfirm>
          )}
        </Space>
      </div>

      {isCancelled && (
        <Alert
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message={t('cancelled_sale_alert', 'This sale transaction is CANCELLED')}
          description={t('cancelled_sale_alert_desc', 'All stock deductions have been reversed back into the inventory ledger.')}
          style={{ marginBottom: 20, borderRadius: '8px' }}
          className="no-print"
        />
      )}

      {/* Printable Invoice Container (A4) */}
      <Card
        id="printable-sale-invoice"
        bordered={false}
        style={{
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginBottom: '24px',
          padding: '12px 16px'
        }}
      >
        {/* Printable Header */}
        <Row gutter={24} style={{ marginBottom: 24, borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
          <Col span={12}>
            <Title level={3} style={{ margin: '0 0 6px 0', color: '#1e40af', fontWeight: 800 }}>
              {sale.billerDetails?.company || sale.biller || 'Aura Supply HQ'}
            </Title>
            <div style={{ color: '#475569', fontSize: '13px', lineHeight: '1.6' }}>
              <div>{sale.billerDetails?.address || 'Commercial Operations'}</div>
              {sale.billerDetails?.phone && <div>Tel: {sale.billerDetails.phone}</div>}
              {sale.billerDetails?.email && <div>Email: {sale.billerDetails.email}</div>}
            </div>
          </Col>

          <Col span={12} style={{ textAlign: 'right' }}>
            <Title level={4} style={{ margin: '0 0 4px 0', color: isDark ? '#f8fafc' : '#0f172a' }}>
              TAX INVOICE
            </Title>
            <div style={{ fontSize: '14px', fontWeight: 700, color: isDark ? '#93c5fd' : '#334155' }}>
              #{sale.referenceNo}
            </div>
            <div style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '12px', marginTop: 4 }}>
              <div>{t('date', 'Date')}: <strong>{new Date(sale.date).toLocaleDateString()}</strong></div>
              {sale.dueDate && <div>{t('due_date', 'Due Date')}: {new Date(sale.dueDate).toLocaleDateString()}</div>}
              <div>{t('warehouse', 'Warehouse')}: {sale.warehouseName}</div>
            </div>
          </Col>
        </Row>

        {/* Customer & Billing Address */}
        <Row gutter={24} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <div style={{
              background: isDark ? 'rgba(30, 41, 59, 0.7)' : '#f8fafc',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
              padding: '14px',
              borderRadius: '8px'
            }}>
              <Text strong style={{ fontSize: '12px', textTransform: 'uppercase', color: isDark ? '#94a3b8' : '#64748b' }}>
                {t('billed_to', 'Billed To (Customer)')}:
              </Text>
              <div style={{ fontSize: '15px', fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', marginTop: 4 }}>
                {sale.customerDetails?.name || sale.customer}
              </div>
              <div style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: '13px', marginTop: 4, lineHeight: '1.5' }}>
                {sale.customerDetails?.company && <div>{sale.customerDetails.company}</div>}
                {sale.customerDetails?.address && <div>{sale.customerDetails.address}</div>}
                {sale.customerDetails?.phone && <div>Tel: {sale.customerDetails.phone}</div>}
                {sale.customerDetails?.email && <div>Email: {sale.customerDetails.email}</div>}
                {sale.customerDetails?.vatNo && <div>VAT No: {sale.customerDetails.vatNo}</div>}
              </div>
            </div>
          </Col>

          <Col span={12}>
            <div style={{
              background: isDark ? 'rgba(30, 41, 59, 0.7)' : '#f8fafc',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
              padding: '14px',
              borderRadius: '8px'
            }}>
              <Text strong style={{ fontSize: '12px', textTransform: 'uppercase', color: isDark ? '#94a3b8' : '#64748b' }}>
                {t('payment_status_summary', 'Payment & Status')}:
              </Text>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text style={{ color: isDark ? '#94a3b8' : '#64748b' }}>{t('order_status', 'Order Status')}:</Text>
                  <Tag color={sale.saleStatus === 'completed' ? 'green' : 'orange'}>
                    {sale.saleStatus.toUpperCase()}
                  </Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text style={{ color: isDark ? '#94a3b8' : '#64748b' }}>{t('payment_status', 'Payment Status')}:</Text>
                  <Tag color={sale.paymentStatus === 'paid' ? 'green' : sale.paymentStatus === 'partial' ? 'blue' : 'red'}>
                    {sale.paymentStatus.toUpperCase()}
                  </Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text style={{ color: isDark ? '#94a3b8' : '#64748b' }}>{t('cashier', 'Cashier / Issued By')}:</Text>
                  <Text strong style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>{sale.cashier}</Text>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Invoice Items Table */}
        <Table
          dataSource={sale.items || []}
          columns={itemColumns}
          pagination={false}
          rowKey="id"
          style={{ marginBottom: 20 }}
        />

        {/* Financial Summary & Breakdown */}
        <Row gutter={24}>
          <Col span={14}>
            {sale.note && (
              <div style={{
                background: isDark ? 'rgba(30, 41, 59, 0.65)' : '#f8fafc',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: 12
              }}>
                <Text strong style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase' }}>
                  {t('invoice_notes', 'Invoice Notes')}:
                </Text>
                <div style={{ color: isDark ? '#cbd5e1' : '#334155', fontSize: '13px', marginTop: 4 }}>
                  {sale.note}
                </div>
              </div>
            )}
            {sale.staffNote && (
              <div className="no-print" style={{
                background: isDark ? 'rgba(245, 158, 11, 0.12)' : '#fffbeb',
                border: isDark ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid #fef3c7',
                padding: '12px 16px',
                borderRadius: '8px'
              }}>
                <Text strong style={{ fontSize: '12px', color: isDark ? '#fbbf24' : '#b45309', textTransform: 'uppercase' }}>
                  {t('internal_staff_note', 'Internal Staff Note')}:
                </Text>
                <div style={{ color: isDark ? '#fde68a' : '#92400e', fontSize: '13px', marginTop: 4 }}>
                  {sale.staffNote}
                </div>
              </div>
            )}
          </Col>

          <Col span={10}>
            <div style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)'
                : '#f8fafc',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e2e8f0',
              boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : 'none',
              padding: '16px',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: isDark ? '#94a3b8' : '#64748b' }}>{t('items_subtotal', 'Items Subtotal')}:</Text>
                <Text strong style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>{formatCurrency(sale.total)}</Text>
              </div>

              {sale.orderDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: isDark ? '#94a3b8' : '#64748b' }}>{t('order_discount', 'Order Discount')}:</Text>
                  <Text type="danger">-{formatCurrency(sale.orderDiscount)}</Text>
                </div>
              )}

              {sale.orderTax > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: isDark ? '#94a3b8' : '#64748b' }}>{t('order_tax', 'Order Tax')}:</Text>
                  <Text style={{ color: isDark ? '#60a5fa' : '#2563eb' }}>+{formatCurrency(sale.orderTax)}</Text>
                </div>
              )}

              {sale.shipping > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: isDark ? '#94a3b8' : '#64748b' }}>{t('shipping', 'Shipping')}:</Text>
                  <Text style={{ color: isDark ? '#fbbf24' : '#d97706' }}>+{formatCurrency(sale.shipping)}</Text>
                </div>
              )}

              <Divider style={{ margin: '10px 0', borderColor: isDark ? 'rgba(255,255,255,0.1)' : undefined }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                <Text strong style={{ fontSize: '15px', color: isDark ? '#f8fafc' : '#0f172a' }}>{t('grand_total', 'Grand Total')}:</Text>
                <Text strong style={{ fontSize: '18px', color: isDark ? '#60a5fa' : '#1e40af' }}>
                  {formatCurrency(sale.grandTotal)}
                </Text>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                <Text style={{ color: '#64748b' }}>{t('total_paid', 'Total Paid')}:</Text>
                <Text strong style={{ color: '#16a34a', fontSize: '15px' }}>
                  {formatCurrency(sale.paid)}
                </Text>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong style={{ color: sale.balance > 0 ? '#ef4444' : '#10b981' }}>
                  {t('balance_due', 'Balance Due')}:
                </Text>
                <Text strong style={{ fontSize: '16px', color: sale.balance > 0 ? '#ef4444' : '#10b981' }}>
                  {formatCurrency(sale.balance)}
                </Text>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Tabs for Payments, Deliveries & Stock Ledger (Hidden in Print) */}
      <div className="no-print">
        <Tabs
          defaultActiveKey="payments"
          items={[
            {
              key: 'payments',
              label: (
                <span>
                  <CreditCardOutlined style={{ marginRight: 6 }} />
                  {t('payments_ledger', 'Payment Records')} ({sale.payments?.length || 0})
                </span>
              ),
              children: (
                <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <Text strong style={{ fontSize: '14px' }}>
                      {t('payment_history', 'Transaction Payment History')}
                    </Text>
                    {!isCancelled && sale.balance > 0 && (
                      <Button
                        type="primary"
                        icon={<DollarOutlined />}
                        size="small"
                        onClick={handleOpenPayment}
                        style={{ background: '#16a34a', borderColor: '#16a34a' }}
                      >
                        {t('record_payment', 'Record Payment')}
                      </Button>
                    )}
                  </div>
                  <Table
                    dataSource={sale.payments || []}
                    columns={paymentColumns}
                    pagination={false}
                    rowKey="id"
                  />
                </Card>
              )
            },
            {
              key: 'deliveries',
              label: (
                <span>
                  <CarOutlined style={{ marginRight: 6 }} />
                  {t('deliveries_dispatch', 'Deliveries & Logistics')} ({deliveries.length})
                </span>
              ),
              children: (
                <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <Text strong style={{ fontSize: '14px' }}>
                      {t('deliveries_list', 'Delivery Orders History')}
                    </Text>
                    {!isCancelled && (
                      <Button
                        type="primary"
                        icon={<CarOutlined />}
                        size="small"
                        onClick={handleOpenDeliveryModal}
                        style={{ background: '#337ab7', borderColor: '#2e6da4' }}
                      >
                        {t('dispatch_delivery', 'Dispatch Delivery')}
                      </Button>
                    )}
                  </div>
                  <Table
                    dataSource={deliveries}
                    pagination={false}
                    rowKey="id"
                    loading={loadingDeliveries}
                    locale={{ emptyText: t('no_deliveries', 'No delivery orders created for this sale.') }}
                    columns={[
                      {
                        title: t('do_ref', 'DO Ref No'),
                        dataIndex: 'doReferenceNo',
                        key: 'doReferenceNo',
                        render: (val) => <Text strong>{val}</Text>
                      },
                      {
                        title: t('date', 'Date'),
                        dataIndex: 'date',
                        key: 'date',
                        render: (val) => val ? new Date(val).toLocaleDateString() : '-'
                      },
                      {
                        title: t('destination_address', 'Address'),
                        dataIndex: 'address',
                        key: 'address'
                      },
                      {
                        title: t('courier', 'Delivered By'),
                        dataIndex: 'deliveredBy',
                        key: 'deliveredBy',
                        render: (val) => val || '-'
                      },
                      {
                        title: t('status', 'Status'),
                        dataIndex: 'status',
                        key: 'status',
                        render: (val) => {
                          const color = val === 'delivered' ? 'green' : val === 'delivering' ? 'blue' : 'orange';
                          return <Tag color={color}>{String(val).toUpperCase()}</Tag>;
                        }
                      },
                      {
                        title: t('note', 'Note'),
                        dataIndex: 'note',
                        key: 'note',
                        render: (n) => n || '-'
                      }
                    ]}
                  />
                </Card>
              )
            },
            {
              key: 'inventory',
              label: (
                <span>
                  <DropboxOutlined style={{ marginRight: 6 }} />
                  {t('stock_movements', 'Stock Ledger Movements')} ({sale.stockMovements?.length || 0})
                </span>
              ),
              children: (
                <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: '13px' }}>
                      {t('stock_movement_audit_desc', 'Native MySQL ledger entries automatically synchronized with warehouse bins via triggers.')}
                    </Text>
                  </div>
                  <Table
                    dataSource={sale.stockMovements || []}
                    columns={movementColumns}
                    pagination={false}
                    rowKey="id"
                  />
                </Card>
              )
            }
          ]}
        />
      </div>

      {/* Add Payment Modal */}
      <Modal
        title={
          <div>
            <DollarOutlined style={{ marginRight: 8, color: '#16a34a' }} />
            <span>{t('add_payment_for', 'Record Payment for')} #{sale.referenceNo}</span>
          </div>
        }
        open={paymentModalVisible}
        onCancel={() => setPaymentModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={paymentForm}
          layout="vertical"
          onFinish={handleSubmitPayment}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="amount"
            label={t('payment_amount', 'Payment Amount ($)')}
            rules={[{ required: true, message: 'Please enter payment amount' }]}
          >
            <InputNumber
              min={0.01}
              step={0.01}
              max={sale.balance > 0 ? sale.balance : undefined}
              style={{ width: '100%' }}
              prefix="$"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="paid_by"
                label={t('payment_method', 'Payment Method')}
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="cash">{t('cash', 'Cash')}</Option>
                  <Option value="bank_transfer">{t('bank_transfer', 'Bank / ABA KHQR')}</Option>
                  <Option value="card">{t('card', 'Credit / Debit Card')}</Option>
                  <Option value="cheque">{t('cheque', 'Cheque')}</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="date"
                label={t('payment_date', 'Payment Date')}
                rules={[{ required: true }]}
              >
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="reference_no" label={t('reference_no', 'Payment Receipt Reference')}>
            <Input placeholder="PAY-SALE-XXXX" />
          </Form.Item>

          <Form.Item name="note" label={t('payment_note', 'Payment Note / Reference')}>
            <Input.TextArea rows={2} placeholder="Transaction reference or memo..." />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Button onClick={() => setPaymentModalVisible(false)}>
              {t('cancel', 'Cancel')}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submittingPayment}
              style={{ background: '#16a34a', borderColor: '#16a34a' }}
            >
              {t('confirm_payment', 'Confirm Payment')}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Add Delivery Modal */}
      <Modal
        title={
          <Space>
            <CarOutlined style={{ color: '#d97706' }} />
            <span>{t('dispatch_delivery', 'Dispatch Delivery Order')} - {sale.referenceNo}</span>
          </Space>
        }
        open={deliveryModalVisible}
        onCancel={() => setDeliveryModalVisible(false)}
        footer={null}
      >
        <Form
          form={deliveryForm}
          layout="vertical"
          onFinish={handleSubmitDelivery}
        >
          <Form.Item
            name="do_reference_no"
            label={t('do_reference_no', 'DO Reference No')}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date" label={t('delivery_date', 'Dispatch Date')} rules={[{ required: true }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label={t('status', 'Delivery Status')} rules={[{ required: true }]}>
                <Select>
                  <Option value="packing">{t('packing', 'Packing')}</Option>
                  <Option value="delivering">{t('delivering', 'Delivering / On the Way')}</Option>
                  <Option value="delivered">{t('delivered', 'Delivered to Customer')}</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label={t('delivery_address', 'Delivery Address')}>
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item name="delivered_by" label={t('delivered_by', 'Driver / Logistics Courier')}>
            <Input placeholder="Courier name..." />
          </Form.Item>

          <Form.Item name="note" label={t('delivery_note', 'Delivery Note')}>
            <Input />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setDeliveryModalVisible(false)}>
              {t('cancel', 'Cancel')}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submittingDelivery}
              style={{ background: '#337ab7', borderColor: '#2e6da4' }}
            >
              {t('dispatch', 'Dispatch Order')}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 80mm POS Thermal Receipt Preview Modal */}
      <Modal
        title={<span>80mm POS Thermal Receipt Preview</span>}
        open={receiptModalVisible}
        onCancel={() => setReceiptModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setReceiptModalVisible(false)}>
            Close
          </Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrintReceipt}>
            Print Receipt
          </Button>
        ]}
        width={380}
      >
        <div
          id="pos-thermal-receipt-container"
          style={{
            background: '#ffffff',
            padding: '16px',
            fontFamily: 'monospace, Courier New, sans-serif',
            fontSize: '12px',
            color: '#111827',
            lineHeight: 1.4
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 800, fontSize: '15px' }}>
              {sale.billerDetails?.company || sale.biller || 'AURA SUPPLY'}
            </div>
            <div style={{ fontSize: '11px', color: '#4b5563' }}>
              {sale.billerDetails?.address || 'Phnom Penh, Cambodia'}
            </div>
            {sale.billerDetails?.phone && (
              <div style={{ fontSize: '11px', color: '#4b5563' }}>Tel: {sale.billerDetails.phone}</div>
            )}
            <div style={{ borderTop: '1px dashed #9ca3af', margin: '8px 0' }} />
            <div style={{ fontWeight: 700 }}>RECEIPT / INVOICE</div>
          </div>

          <div style={{ fontSize: '11px', marginBottom: 8 }}>
            <div>Inv #: <strong>{sale.referenceNo}</strong></div>
            <div>Date: {new Date(sale.date).toLocaleString()}</div>
            <div>Cashier: {sale.cashier}</div>
            <div>Customer: {sale.customer}</div>
          </div>

          <div style={{ borderTop: '1px dashed #9ca3af', margin: '6px 0' }} />

          {/* Items */}
          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px dashed #9ca3af' }}>
                <th style={{ textAlign: 'left', paddingBottom: 4 }}>Item</th>
                <th style={{ textAlign: 'center', paddingBottom: 4 }}>Qty</th>
                <th style={{ textAlign: 'right', paddingBottom: 4 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items?.map((it, idx) => (
                <tr key={idx}>
                  <td style={{ padding: '3px 0' }}>
                    {it.productName}
                    {it.variantName && ` (${it.variantName})`}
                  </td>
                  <td style={{ textAlign: 'center', padding: '3px 0' }}>{it.unitQuantity || it.quantity}</td>
                  <td style={{ textAlign: 'right', padding: '3px 0' }}>${(it.subtotal || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: '1px dashed #9ca3af', margin: '8px 0' }} />

          {/* Totals */}
          <div style={{ fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal:</span>
              <span>${sale.total.toFixed(2)}</span>
            </div>
            {sale.orderDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                <span>Discount:</span>
                <span>-${sale.orderDiscount.toFixed(2)}</span>
              </div>
            )}
            {sale.orderTax > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Tax:</span>
                <span>+${sale.orderTax.toFixed(2)}</span>
              </div>
            )}
            {sale.shipping > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Shipping:</span>
                <span>+${sale.shipping.toFixed(2)}</span>
              </div>
            )}
            <div style={{ borderTop: '1px solid #111827', margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '13px' }}>
              <span>Grand Total:</span>
              <span>${sale.grandTotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span>Paid:</span>
              <span>${sale.paid.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: sale.balance > 0 ? '#dc2626' : '#16a34a' }}>
              <span>Balance Due:</span>
              <span>${sale.balance.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #9ca3af', margin: '12px 0 8px 0' }} />
          <div style={{ textAlign: 'center', fontSize: '11px', color: '#4b5563' }}>
            <div>Thank you for your business!</div>
            <div style={{ fontSize: '10px', marginTop: 2 }}>Please keep this receipt for warranty and returns.</div>
            <div style={{ marginTop: 8, fontSize: '16px', letterSpacing: '4px' }}>||||| | |||| || |||</div>
          </div>
        </div>
      </Modal>

      {/* Print CSS styling */}
      <style>{`
        @media print {
          body {
            background: white !important;
          }
          .no-print, header, aside, .ant-layout-sider, .ant-layout-header {
            display: none !important;
          }
          #printable-sale-invoice {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .ant-card-body {
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SaleDetailPage;
