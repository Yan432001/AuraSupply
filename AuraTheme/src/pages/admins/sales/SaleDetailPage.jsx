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
  const { themeTokens } = useAdminTheme();

  const [loading, setLoading] = useState(true);
  const [sale, setSale] = useState(null);

  // Add Payment Modal State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentForm] = Form.useForm();

  // Cancel Sale State
  const [cancellingSale, setCancellingSale] = useState(false);

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

  useEffect(() => {
    fetchSale();
  }, [id]);

  // Open Payment Modal
  const handleOpenPayment = () => {
    if (!sale) return;
    paymentForm.setFieldsValue({
      amount: sale.balance > 0 ? sale.balance : 0,
      paid_by: 'cash',
      date: new Date().toISOString().slice(0, 10),
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

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip={t('loading_sale_details', 'Loading sale details...')} />
      </div>
    );
  }

  if (!sale) return null;

  const isCancelled = sale.saleStatus === 'cancelled';
  const isCompleted = sale.saleStatus === 'completed';
  const isPaid = sale.paymentStatus === 'paid';

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
          </div>
        </div>
      )
    },
    {
      title: t('unit', 'Unit'),
      dataIndex: 'productUnitCode',
      key: 'productUnitCode',
      width: 90,
      render: (val) => val || 'Unit'
    },
    {
      title: t('quantity', 'Quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 90,
      align: 'right',
      render: (val) => <strong>{parseFloat(val).toLocaleString()}</strong>
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
        <Text strong style={{ color: themeTokens.colorPrimary }}>
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
      dataIndex: 'reference_no',
      key: 'reference_no',
      render: (val) => val || '-'
    },
    {
      title: t('method', 'Payment Method'),
      dataIndex: 'paid_by',
      key: 'paid_by',
      render: (val) => {
        const methodMap = {
          cash: { label: 'Cash', color: 'green' },
          bank_transfer: { label: 'Bank / ABA', color: 'blue' },
          card: { label: 'Card', color: 'purple' },
          cheque: { label: 'Cheque', color: 'orange' }
        };
        const m = methodMap[val] || { label: val?.toUpperCase(), color: 'default' };
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
          <span>{record.product_name}</span>
          {record.product_code && (
            <span style={{ fontSize: '11px', color: '#64748b', marginLeft: 6 }}>
              ({record.product_code})
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
            {isNeg ? qty : `+${qty}`} {record.unit_code || 'Unit'}
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
              <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
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
              {t('created_by', 'Created by')}: {sale.cashier} | {new Date(sale.date).toLocaleDateString()}
            </Text>
          </div>
        </Space>

        <Space>
          <Button
            icon={<PrinterOutlined />}
            onClick={handlePrint}
            style={{ borderRadius: '8px' }}
          >
            {t('print_invoice', 'Print Invoice')}
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

      {/* Printable Invoice Container */}
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
            <Title level={3} style={{ margin: '0 0 6px 0', color: themeTokens.colorPrimary, fontWeight: 800 }}>
              {sale.billerDetails?.company || sale.biller || 'Aura Supply HQ'}
            </Title>
            <div style={{ color: '#475569', fontSize: '13px', lineHeight: '1.6' }}>
              <div>{sale.billerDetails?.address || 'Main Commercial Headquarters'}</div>
              {sale.billerDetails?.phone && <div>Tel: {sale.billerDetails.phone}</div>}
              {sale.billerDetails?.email && <div>Email: {sale.billerDetails.email}</div>}
            </div>
          </Col>

          <Col span={12} style={{ textAlign: 'right' }}>
            <Title level={4} style={{ margin: '0 0 4px 0', color: '#0f172a' }}>
              TAX INVOICE
            </Title>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>
              #{sale.referenceNo}
            </div>
            <div style={{ color: '#64748b', fontSize: '12px', marginTop: 4 }}>
              <div>{t('date', 'Date')}: <strong>{new Date(sale.date).toLocaleDateString()}</strong></div>
              {sale.dueDate && <div>{t('due_date', 'Due Date')}: {new Date(sale.dueDate).toLocaleDateString()}</div>}
              <div>{t('warehouse', 'Warehouse')}: {sale.warehouseName}</div>
            </div>
          </Col>
        </Row>

        {/* Customer & Billing Address */}
        <Row gutter={24} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px' }}>
              <Text strong style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b' }}>
                {t('billed_to', 'Billed To (Customer)')}:
              </Text>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                {sale.customerDetails?.name || sale.customer}
              </div>
              <div style={{ color: '#475569', fontSize: '13px', marginTop: 4, lineHeight: '1.5' }}>
                {sale.customerDetails?.company && <div>{sale.customerDetails.company}</div>}
                {sale.customerDetails?.address && <div>{sale.customerDetails.address}</div>}
                {sale.customerDetails?.phone && <div>Tel: {sale.customerDetails.phone}</div>}
                {sale.customerDetails?.email && <div>Email: {sale.customerDetails.email}</div>}
                {sale.customerDetails?.vatNo && <div>VAT No: {sale.customerDetails.vatNo}</div>}
              </div>
            </div>
          </Col>

          <Col span={12}>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px' }}>
              <Text strong style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b' }}>
                {t('payment_status_summary', 'Payment & Status')}:
              </Text>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#64748b' }}>{t('order_status', 'Order Status')}:</Text>
                  <Tag color={sale.saleStatus === 'completed' ? 'green' : 'orange'}>
                    {sale.saleStatus.toUpperCase()}
                  </Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#64748b' }}>{t('payment_status', 'Payment Status')}:</Text>
                  <Tag color={sale.paymentStatus === 'paid' ? 'green' : sale.paymentStatus === 'partial' ? 'blue' : 'red'}>
                    {sale.paymentStatus.toUpperCase()}
                  </Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#64748b' }}>{t('cashier', 'Cashier / Issued By')}:</Text>
                  <Text strong>{sale.cashier}</Text>
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
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', marginBottom: 12 }}>
                <Text strong style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>
                  {t('invoice_notes', 'Invoice Notes')}:
                </Text>
                <div style={{ color: '#334155', fontSize: '13px', marginTop: 4 }}>
                  {sale.note}
                </div>
              </div>
            )}
            {sale.staffNote && (
              <div className="no-print" style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '12px 16px', borderRadius: '8px' }}>
                <Text strong style={{ fontSize: '12px', color: '#b45309', textTransform: 'uppercase' }}>
                  {t('internal_staff_note', 'Internal Staff Note')}:
                </Text>
                <div style={{ color: '#92400e', fontSize: '13px', marginTop: 4 }}>
                  {sale.staffNote}
                </div>
              </div>
            )}
          </Col>

          <Col span={10}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#64748b' }}>{t('items_subtotal', 'Items Subtotal')}:</Text>
                <Text strong>{formatCurrency(sale.total)}</Text>
              </div>

              {sale.orderDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: '#64748b' }}>{t('order_discount', 'Order Discount')}:</Text>
                  <Text type="danger">-{formatCurrency(sale.orderDiscount)}</Text>
                </div>
              )}

              {sale.orderTax > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: '#64748b' }}>{t('order_tax', 'Order Tax')}:</Text>
                  <Text>+{formatCurrency(sale.orderTax)}</Text>
                </div>
              )}

              {sale.shipping > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: '#64748b' }}>{t('shipping', 'Shipping')}:</Text>
                  <Text>+{formatCurrency(sale.shipping)}</Text>
                </div>
              )}

              <Divider style={{ margin: '10px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                <Text strong style={{ fontSize: '15px' }}>{t('grand_total', 'Grand Total')}:</Text>
                <Text strong style={{ fontSize: '18px', color: themeTokens.colorPrimary }}>
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

      {/* Tabs for Payments & Stock Movements (Hidden in Print) */}
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
                  <Option value="cash">Cash</Option>
                  <Option value="bank_transfer">Bank / ABA</Option>
                  <Option value="card">Credit / Debit Card</Option>
                  <Option value="cheque">Cheque</Option>
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
