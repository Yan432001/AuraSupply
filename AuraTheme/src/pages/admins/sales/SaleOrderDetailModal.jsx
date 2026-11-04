import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Spin,
  Row,
  Col,
  Typography,
  Table,
  Tag,
  Divider,
  Space,
  message,
  Popconfirm
} from 'antd';
import {
  PrinterOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  CloseCircleOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { formatCurrency } from '../../../utils/uiTheme';
import { useAdminTheme } from '../../../hooks/useAdminTheme';

const { Title, Text } = Typography;

export default function SaleOrderDetailModal({ orderId, isOpen, onClose, onConvertToSale }) {
  const adminTheme = useAdminTheme();
  const isDark = adminTheme?.isDark;

  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (orderId && isOpen) {
      fetchOrderDetails(orderId);
    }
  }, [orderId, isOpen]);

  const fetchOrderDetails = async (id) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/admin/sales_orders/${id}`);
      if (res.data?.status && res.data?.data) {
        setOrder(res.data.data);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to load sale order details');
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!order) return;
    setConverting(true);
    try {
      const res = await axios.post(`/api/admin/sales_orders/${order.id}/convert-to-sale`);
      if (res.data?.status) {
        message.success(res.data.message || 'Sale Order successfully converted to Sale!');
        if (onConvertToSale) onConvertToSale();
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to convert sale order');
    } finally {
      setConverting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const itemColumns = [
    {
      title: '#',
      render: (_, __, idx) => idx + 1,
      width: 45,
      align: 'center'
    },
    {
      title: 'Product (Code - Name)',
      key: 'product',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, color: isDark ? '#f8fafc' : '#1e293b' }}>{r.product_name}</div>
          <div style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>
            <span>{r.product_code}</span>
            {r.product_unit_code && <Tag color="blue" style={{ marginLeft: 6 }}>{r.product_unit_code}</Tag>}
          </div>
          {r.comment && <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>{r.comment}</div>}
        </div>
      )
    },
    {
      title: 'Unit Price',
      dataIndex: 'net_unit_price',
      key: 'net_unit_price',
      width: 110,
      align: 'right',
      render: (val, r) => formatCurrency(val || r.unit_price)
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      align: 'center',
      render: (val) => <Text strong>{parseFloat(val).toLocaleString()}</Text>
    },
    {
      title: 'Discount',
      dataIndex: 'item_discount',
      key: 'item_discount',
      width: 95,
      align: 'right',
      render: (val) => parseFloat(val) > 0 ? <span style={{ color: '#ef4444' }}>-{formatCurrency(val)}</span> : '—'
    },
    {
      title: 'Tax',
      dataIndex: 'item_tax',
      key: 'item_tax',
      width: 85,
      align: 'right',
      render: (val) => parseFloat(val) > 0 ? <span style={{ color: '#3b82f6' }}>+{formatCurrency(val)}</span> : '—'
    },
    {
      title: 'Subtotal',
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 120,
      align: 'right',
      render: (val) => <Text strong style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>{formatCurrency(val)}</Text>
    }
  ];

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      width={850}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShoppingCartOutlined style={{ color: '#2563eb', fontSize: 20 }} />
          <span>Sale Order Details: #{order?.reference_no || orderId}</span>
        </div>
      }
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Button key="print" icon={<PrinterOutlined />} onClick={handlePrint}>
          Print Order
        </Button>,
        order?.sale_status !== 'completed' && (
          <Popconfirm
            key="convert"
            title="Convert Sale Order to Invoice?"
            description="This will create a commercial sale record, deduct inventory, and mark this order completed."
            okText="Yes, Convert"
            cancelText="Cancel"
            onConfirm={handleConvert}
          >
            <Button type="primary" icon={<ArrowRightOutlined />} loading={converting} style={{ background: '#16a34a' }}>
              Convert to Sale
            </Button>
          </Popconfirm>
        )
      ]}
      styles={{
        content: {
          background: isDark ? '#1e293b' : '#ffffff',
          color: isDark ? '#f8fafc' : '#0f172a'
        }
      }}
    >
      {loading || !order ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <Spin size="large" />
        </div>
      ) : (
        <div style={{ padding: '4px 0' }}>
          {/* Header Biller & Voucher Info */}
          <Row gutter={24} style={{ marginBottom: 20, borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1f5f9', paddingBottom: 14 }}>
            <Col span={12}>
              <Title level={4} style={{ margin: '0 0 4px 0', color: isDark ? '#93c5fd' : '#1e40af', fontWeight: 800 }}>
                {order.billerDetails?.company || order.biller || 'Aura Supply HQ'}
              </Title>
              <div style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: 13, lineHeight: '1.5' }}>
                <div>{order.billerDetails?.address || 'Commercial Operations'}</div>
                {order.billerDetails?.phone && <div>Tel: {order.billerDetails.phone}</div>}
                {order.billerDetails?.email && <div>Email: {order.billerDetails.email}</div>}
              </div>
            </Col>
            <Col span={12} style={{ textAlign: 'right' }}>
              <Title level={4} style={{ margin: '0 0 4px 0', color: isDark ? '#f8fafc' : '#0f172a' }}>
                SALES ORDER
              </Title>
              <div style={{ fontSize: 15, fontWeight: 700, color: isDark ? '#60a5fa' : '#2563eb' }}>
                #{order.reference_no}
              </div>
              <div style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 12, marginTop: 4 }}>
                <div>Date: <strong>{dayjs(order.date).format('DD/MM/YYYY')}</strong></div>
                {order.due_date && <div>Due Date: {dayjs(order.due_date).format('DD/MM/YYYY')}</div>}
                <div>Warehouse: <strong>{order.warehouse_name || 'Main Warehouse'}</strong></div>
              </div>
            </Col>
          </Row>

          {/* Customer & Status Bar */}
          <Row gutter={16} style={{ marginBottom: 20 }}>
            <Col span={12}>
              <div style={{
                background: isDark ? 'rgba(30, 41, 59, 0.7)' : '#f8fafc',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                padding: '12px 16px',
                borderRadius: 8
              }}>
                <Text strong style={{ fontSize: 11, textTransform: 'uppercase', color: isDark ? '#94a3b8' : '#64748b' }}>
                  CUSTOMER INFORMATION
                </Text>
                <div style={{ fontSize: 15, fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', marginTop: 4 }}>
                  {order.customerDetails?.name || order.customer}
                </div>
                <div style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: 12, marginTop: 2 }}>
                  {order.customerDetails?.company && <div>{order.customerDetails.company}</div>}
                  {order.customerDetails?.phone && <div>Tel: {order.customerDetails.phone}</div>}
                  {order.customerDetails?.email && <div>Email: {order.customerDetails.email}</div>}
                </div>
              </div>
            </Col>
            <Col span={12}>
              <div style={{
                background: isDark ? 'rgba(30, 41, 59, 0.7)' : '#f8fafc',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                padding: '12px 16px',
                borderRadius: 8
              }}>
                <Text strong style={{ fontSize: 11, textTransform: 'uppercase', color: isDark ? '#94a3b8' : '#64748b' }}>
                  ORDER WORKFLOW STATUS
                </Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}>Approval Status:</span>
                    <Tag color={order.order_status === 'approved' ? 'green' : order.order_status === 'rejected' ? 'red' : 'orange'}>
                      {(order.order_status || 'pending').toUpperCase()}
                    </Tag>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}>Sales Order Status:</span>
                    <Tag color={order.sale_status === 'completed' ? 'geekblue' : 'purple'}>
                      {(order.sale_status || 'order').toUpperCase()}
                    </Tag>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}>Created By:</span>
                    <Text strong style={{ fontSize: 12 }}>{order.created_by_name || 'System Admin'}</Text>
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          {/* Line Items Table */}
          <Table
            dataSource={order.items || []}
            columns={itemColumns}
            rowKey="id"
            pagination={false}
            size="small"
            style={{ marginBottom: 16 }}
          />

          {/* Totals & Notes */}
          <Row gutter={16}>
            <Col span={13}>
              {order.note && (
                <div style={{
                  background: isDark ? 'rgba(30, 41, 59, 0.65)' : '#f8fafc',
                  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                  padding: '12px 14px',
                  borderRadius: 8,
                  marginBottom: 10
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase' }}>
                    Customer / Order Note:
                  </div>
                  <div style={{ color: isDark ? '#cbd5e1' : '#334155', fontSize: 12.5, marginTop: 4 }}>
                    {order.note}
                  </div>
                </div>
              )}
              {order.staff_note && (
                <div style={{
                  background: isDark ? 'rgba(245, 158, 11, 0.12)' : '#fffbeb',
                  border: isDark ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid #fef3c7',
                  padding: '10px 14px',
                  borderRadius: 8
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#fbbf24' : '#b45309', textTransform: 'uppercase' }}>
                    Staff Private Note:
                  </div>
                  <div style={{ color: isDark ? '#fde68a' : '#92400e', fontSize: 12, marginTop: 4 }}>
                    {order.staff_note}
                  </div>
                </div>
              )}
            </Col>

            <Col span={11}>
              <div style={{
                background: isDark ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)' : '#f8fafc',
                border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #e2e8f0',
                padding: '14px 16px',
                borderRadius: 8
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Items Subtotal:</span>
                  <Text strong>{formatCurrency(order.total)}</Text>
                </div>
                {parseFloat(order.total_discount || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                    <span style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Order Discount:</span>
                    <Text type="danger">-{formatCurrency(order.total_discount)}</Text>
                  </div>
                )}
                {parseFloat(order.total_tax || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                    <span style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Order Tax:</span>
                    <Text style={{ color: '#3b82f6' }}>+{formatCurrency(order.total_tax)}</Text>
                  </div>
                )}
                {parseFloat(order.shipping || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                    <span style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Shipping:</span>
                    <Text style={{ color: '#d97706' }}>+{formatCurrency(order.shipping)}</Text>
                  </div>
                )}
                <Divider style={{ margin: '8px 0', borderColor: isDark ? 'rgba(255,255,255,0.1)' : undefined }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text strong style={{ fontSize: 14 }}>Grand Total:</Text>
                  <Text strong style={{ fontSize: 18, color: isDark ? '#4ade80' : '#15803d' }}>
                    {formatCurrency(order.grand_total)}
                  </Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Paid / Advance Deposit:</span>
                  <Text strong style={{ color: '#0284c7' }}>{formatCurrency(order.paid)}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong style={{ color: (order.grand_total - order.paid) > 0 ? '#ef4444' : '#10b981' }}>
                    Balance Outstanding:
                  </Text>
                  <Text strong style={{ fontSize: 15, color: (order.grand_total - order.paid) > 0 ? '#ef4444' : '#10b981' }}>
                    {formatCurrency(order.grand_total - order.paid)}
                  </Text>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      )}
    </Modal>
  );
}
