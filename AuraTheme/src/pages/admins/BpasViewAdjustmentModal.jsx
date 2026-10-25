import React, { useRef } from 'react';
import { Modal, Button, Table, Tag, Typography, Space, Row, Col, Divider, Card } from 'antd';
import {
  PrinterOutlined,
  CloseOutlined,
  BarcodeOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  ApartmentOutlined,
  UserOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { formatCurrency } from '../../utils/uiTheme';

const { Title, Text, Paragraph } = Typography;

export default function BpasViewAdjustmentModal({ open, onClose, adjustment }) {
  const printRef = useRef(null);

  if (!adjustment) return null;

  const handlePrint = () => {
    window.print();
  };

  const columns = [
    {
      title: '#',
      key: 'index',
      width: 50,
      align: 'center',
      render: (_, __, index) => index + 1
    },
    {
      title: 'Product / Description',
      key: 'description',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 700, color: '#1e293b' }}>
            {r.product_code} - {r.product_name}
          </div>
          {r.variant_name && (
            <div style={{ fontSize: 12, color: '#2563eb' }}>
              Variant: {r.variant_name} {r.variant_sku ? `(${r.variant_sku})` : ''}
            </div>
          )}
          {r.serial_no && (
            <div style={{ fontSize: 11, color: '#64748b' }}>
              Serial No: {r.serial_no}
            </div>
          )}
          {r.expiry && (
            <div style={{ fontSize: 11, color: '#d97706' }}>
              Expiry: {dayjs(r.expiry).format('YYYY-MM-DD')}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Variant',
      dataIndex: 'variant_name',
      key: 'variant',
      width: 140,
      render: (v) => v || '—'
    },
    {
      title: 'Adjustment Type',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (type) => (
        <Tag color={type === 'addition' ? 'green' : 'red'} style={{ fontWeight: 700 }}>
          {type === 'addition' ? '+ ADDITION' : '- SUBTRACTION'}
        </Tag>
      )
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 130,
      align: 'right',
      render: (qty, r) => {
        const isSub = r.type === 'subtraction';
        return (
          <strong style={{ color: isSub ? '#dc2626' : '#16a34a', fontSize: 14 }}>
            {isSub ? `-${Number(qty)}` : `+${Number(qty)}`} {r.unit_name || ''}
          </strong>
        );
      }
    },
    {
      title: 'Unit Cost',
      dataIndex: 'unit_cost',
      key: 'unit_cost',
      width: 120,
      align: 'right',
      render: (c) => (c ? formatCurrency(c) : '—')
    },
    {
      title: 'Subtotal',
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 130,
      align: 'right',
      render: (st) => (st ? formatCurrency(st) : '—')
    }
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" icon={<CloseOutlined />} onClick={onClose}>
          Close
        </Button>,
        <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
          Print Voucher
        </Button>
      ]}
      width={860}
      styles={{ body: { padding: '24px' } }}
    >
      <div ref={printRef} className="print-voucher-area">
        {/* Header Strip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: 16, marginBottom: 20 }}>
          <div>
            <Title level={3} style={{ margin: 0, color: '#1e293b' }}>
              STOCK QUANTITY ADJUSTMENT VOUCHER
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Official Inventory Movement & Cycle Count Audit Voucher
            </Text>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#2563eb' }}>
              {adjustment.reference_no}
            </div>
            <Tag color={adjustment.status === 'completed' ? 'green' : 'blue'}>
              {(adjustment.status || 'COMPLETED').toUpperCase()}
            </Tag>
          </div>
        </div>

        {/* Voucher Metadata Grid */}
        <Card size="small" style={{ background: '#f8fafc', marginBottom: 20, borderColor: '#e2e8f0' }}>
          <Row gutter={[16, 12]}>
            <Col span={8}>
              <Text type="secondary" style={{ fontSize: 12 }}>Adjustment Date</Text>
              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <CalendarOutlined style={{ color: '#2563eb' }} />
                <span>{adjustment.date ? dayjs(adjustment.date).format('YYYY-MM-DD HH:mm') : '—'}</span>
              </div>
            </Col>

            <Col span={8}>
              <Text type="secondary" style={{ fontSize: 12 }}>Warehouse Location</Text>
              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <ApartmentOutlined style={{ color: '#2563eb' }} />
                <span>{adjustment.warehouse_name || 'Main Warehouse'}</span>
              </div>
            </Col>

            <Col span={8}>
              <Text type="secondary" style={{ fontSize: 12 }}>Created By</Text>
              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <UserOutlined style={{ color: '#2563eb' }} />
                <span>{adjustment.creator_fullname || adjustment.creator_username || 'Admin Staff'}</span>
              </div>
            </Col>

            {adjustment.biller_name && (
              <Col span={8}>
                <Text type="secondary" style={{ fontSize: 12 }}>Biller / Branch</Text>
                <div style={{ fontWeight: 700, marginTop: 2 }}>
                  {adjustment.biller_name}
                </div>
              </Col>
            )}

            {adjustment.note && (
              <Col span={16}>
                <Text type="secondary" style={{ fontSize: 12 }}>Reason / Note</Text>
                <div style={{ fontWeight: 600, color: '#334155', marginTop: 2 }}>
                  {adjustment.note}
                </div>
              </Col>
            )}
          </Row>
        </Card>

        {/* Line Items Table */}
        <Table
          rowKey="id"
          dataSource={adjustment.items || []}
          columns={columns}
          pagination={false}
          size="middle"
          bordered
          summary={(pageData) => {
            let totalAdded = 0;
            let totalSub = 0;
            let totalVal = 0;

            pageData.forEach(({ quantity, type, subtotal }) => {
              const q = Number(quantity) || 0;
              if (type === 'addition') totalAdded += q;
              else totalSub += q;
              totalVal += Number(subtotal) || 0;
            });

            return (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ background: '#f8fafc', fontWeight: 700 }}>
                  <Table.Summary.Cell index={0} colSpan={3}>
                    Total Summary ({pageData.length} items)
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <span style={{ color: '#16a34a' }}>+{totalAdded}</span> / <span style={{ color: '#dc2626' }}>-{totalSub}</span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    Net: {totalAdded - totalSub}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} />
                  <Table.Summary.Cell index={4} align="right" style={{ color: '#16a34a' }}>
                    {formatCurrency(totalVal)}
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />

        {/* Signature & Audit Footer */}
        <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px dashed #cbd5e1' }}>
          <Row gutter={24} style={{ textAlign: 'center' }}>
            <Col span={8}>
              <div style={{ borderBottom: '1px solid #94a3b8', height: 40 }} />
              <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700 }}>Stock Auditor / Clerk</div>
            </Col>
            <Col span={8}>
              <div style={{ borderBottom: '1px solid #94a3b8', height: 40 }} />
              <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700 }}>Warehouse Supervisor</div>
            </Col>
            <Col span={8}>
              <div style={{ borderBottom: '1px solid #94a3b8', height: 40 }} />
              <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700 }}>Authorized Signatory</div>
            </Col>
          </Row>
        </div>
      </div>
    </Modal>
  );
}
