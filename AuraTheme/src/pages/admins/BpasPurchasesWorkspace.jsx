import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Statistic,
  Typography,
  Modal,
  Form,
  InputNumber,
  message,
  Popconfirm,
  Tooltip,
  Badge,
  Divider,
  Dropdown,
  Tabs,
  DatePicker,
  Alert,
  Spin,
  Descriptions,
  Empty
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
  CheckCircleOutlined,
  WarningOutlined,
  InboxOutlined,
  DollarOutlined,
  SwapOutlined,
  DownOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  CloseCircleOutlined,
  CreditCardOutlined,
  FieldTimeOutlined,
  SendOutlined,
  UndoOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatCurrency } from '../../utils/uiTheme';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { useTranslation } from '../../contexts/LanguageContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const API_BASE = '/api/admin/purchases';

const BpasPurchasesWorkspace = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { themeTokens } = useAdminTheme();

  // Navigation search params
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') || 'list';

  // State management
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [purchases, setPurchases] = useState([]);
  const [metrics, setMetrics] = useState({
    totalPurchases: 0,
    totalSpend: 0,
    totalPaid: 0,
    totalBalance: 0,
    received: 0,
    partial: 0,
    ordered: 0,
    pending: 0,
    draft: 0,
    cancelled: 0,
    paidCount: 0,
    partialPaidCount: 0,
    unpaidCount: 0
  });

  // Filters
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalRecords: 0 });

  // Metadata (Suppliers, Warehouses, Units, Next Ref)
  const [metadata, setMetadata] = useState({
    suppliers: [],
    warehouses: [],
    units: [],
    nextReference: ''
  });

  // Modals state
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Receiving Modal state
  const [receiveModalVisible, setReceiveModalVisible] = useState(false);
  const [receiveItems, setReceiveItems] = useState([]);
  const [submittingReceive, setSubmittingReceive] = useState(false);

  // Payment Modal state
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentForm] = Form.useForm();
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Add/Edit Purchase Form state
  const [editingPurchaseId, setEditingPurchaseId] = useState(null);
  const [purchaseForm] = Form.useForm();
  const [formItems, setFormItems] = useState([]);
  const [submittingPurchase, setSubmittingPurchase] = useState(false);

  // Live products for item picker
  const [availableProducts, setAvailableProducts] = useState([]);
  const [productSearchLoading, setProductSearchLoading] = useState(false);

  // Fetch Metadata
  const fetchMetadata = async () => {
    try {
      const res = await axios.get(`${API_BASE}/meta/options`);
      if (res.data && res.data.status) {
        setMetadata(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load purchase metadata:', err);
    }
  };

  // Fetch Available Products with variants for Item Selector
  const fetchProductsForPicker = async (query = '') => {
    try {
      setProductSearchLoading(true);
      const res = await axios.get('/api/admin/products', {
        params: { search: query, limit: 30 }
      });
      if (res.data && res.data.data) {
        setAvailableProducts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to search products:', err);
    } finally {
      setProductSearchLoading(false);
    }
  };

  // Fetch Purchases List
  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_BASE, {
        params: {
          search: searchText,
          status: statusFilter,
          payment_status: paymentStatusFilter,
          supplier_id: supplierFilter,
          warehouse_id: warehouseFilter,
          page: pagination.page,
          limit: pagination.limit
        }
      });

      if (res.data && res.data.status) {
        setPurchases(res.data.data || []);
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        }
        if (res.data.pagination) {
          setPagination(prev => ({
            ...prev,
            totalRecords: res.data.pagination.totalRecords,
            page: res.data.pagination.page
          }));
        }
      }
    } catch (err) {
      message.error(t('failed_to_load_purchases', 'Failed to load purchases'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
    fetchProductsForPicker('');
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [statusFilter, paymentStatusFilter, supplierFilter, warehouseFilter, pagination.page, pagination.limit]);

  // Handle Search submit
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchPurchases();
  };

  // Open Details Modal
  const handleViewPurchase = async (id) => {
    setViewLoading(true);
    setViewModalVisible(true);
    try {
      const res = await axios.get(`${API_BASE}/${id}`);
      if (res.data && res.data.status) {
        setSelectedPurchase(res.data.data);
      }
    } catch (err) {
      message.error(t('failed_to_load_purchase_details', 'Failed to load purchase details'));
    } finally {
      setViewLoading(false);
    }
  };

  // Open Goods Receiving Modal
  const handleOpenReceiveModal = async (purchase) => {
    try {
      setViewLoading(true);
      const res = await axios.get(`${API_BASE}/${purchase.id}`);
      if (res.data && res.data.status) {
        const fullPurchase = res.data.data;
        setSelectedPurchase(fullPurchase);
        // Initialize receive items with remaining balance
        const initialReceive = fullPurchase.items.map(it => ({
          item_id: it.id,
          productId: it.productId,
          productCode: it.productCode,
          productName: it.productName,
          variantName: it.variantName,
          unitCode: it.unitCode,
          quantity: it.quantity,
          quantityReceived: it.quantityReceived,
          quantityBalance: it.quantityBalance,
          quantity_to_receive: it.quantityBalance // Default to receive remaining
        }));
        setReceiveItems(initialReceive);
        setReceiveModalVisible(true);
      }
    } catch (err) {
      message.error(t('failed_to_open_receive', 'Failed to open goods receipt'));
    } finally {
      setViewLoading(false);
    }
  };

  // Submit Goods Receipt
  const handleSubmitReceive = async () => {
    if (!selectedPurchase) return;
    const itemsToSubmit = receiveItems
      .filter(it => parseFloat(it.quantity_to_receive) > 0)
      .map(it => ({
        item_id: it.item_id,
        quantity_to_receive: parseFloat(it.quantity_to_receive)
      }));

    if (itemsToSubmit.length === 0) {
      message.warning(t('no_items_to_receive', 'Please enter a quantity greater than 0 to receive.'));
      return;
    }

    setSubmittingReceive(true);
    try {
      const res = await axios.post(`${API_BASE}/${selectedPurchase.id}/receive`, {
        items: itemsToSubmit
      });

      if (res.data && res.data.status) {
        message.success(t('goods_received_successfully', 'Goods received and inventory updated successfully!'));
        setReceiveModalVisible(false);
        fetchPurchases();
        if (viewModalVisible && selectedPurchase?.id) {
          handleViewPurchase(selectedPurchase.id);
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      message.error(errorMsg);
    } finally {
      setSubmittingReceive(false);
    }
  };

  // Open Payment Modal
  const handleOpenPaymentModal = (purchase) => {
    setSelectedPurchase(purchase);
    paymentForm.resetFields();
    paymentForm.setFieldsValue({
      amount: purchase.balance > 0 ? purchase.balance : 0,
      paid_by: 'cash',
      date: new Date().toISOString().slice(0, 10),
      reference_no: `PAY-${purchase.referenceNo}-${Date.now().toString().slice(-4)}`
    });
    setPaymentModalVisible(true);
  };

  // Submit Payment
  const handleSubmitPayment = async (values) => {
    if (!selectedPurchase) return;
    setSubmittingPayment(true);
    try {
      const res = await axios.post(`${API_BASE}/${selectedPurchase.id}/payments`, values);
      if (res.data && res.data.status) {
        message.success(t('payment_recorded_success', 'Supplier payment recorded successfully!'));
        setPaymentModalVisible(false);
        fetchPurchases();
        if (viewModalVisible && selectedPurchase?.id) {
          handleViewPurchase(selectedPurchase.id);
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      message.error(errorMsg);
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Delete Payment
  const handleDeletePayment = async (purchaseId, paymentId) => {
    try {
      const res = await axios.delete(`${API_BASE}/${purchaseId}/payments/${paymentId}`);
      if (res.data && res.data.status) {
        message.success(t('payment_deleted', 'Payment removed and balance recalculated'));
        handleViewPurchase(purchaseId);
        fetchPurchases();
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to remove payment');
    }
  };

  // Transition Workflow Status
  const handleStatusChange = async (purchaseId, newStatus) => {
    try {
      const res = await axios.put(`${API_BASE}/${purchaseId}/status`, { status: newStatus });
      if (res.data && res.data.status) {
        message.success(t('status_updated', `Purchase status transitioned to ${newStatus}`));
        fetchPurchases();
        if (viewModalVisible) {
          handleViewPurchase(purchaseId);
        }
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Safe Delete Purchase
  const handleDeletePurchase = async (purchaseId) => {
    try {
      const res = await axios.delete(`${API_BASE}/${purchaseId}`);
      if (res.data && res.data.status) {
        message.success(res.data.message || t('purchase_deleted', 'Purchase deleted successfully'));
        fetchPurchases();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      Modal.error({
        title: t('cannot_delete_purchase', 'Cannot Delete Purchase Order'),
        content: errorMsg,
        okText: t('close', 'Close')
      });
    }
  };

  // Open Add/Edit Tab
  const handleOpenAddForm = (purchaseToEdit = null) => {
    if (purchaseToEdit) {
      setEditingPurchaseId(purchaseToEdit.id);
      purchaseForm.setFieldsValue({
        reference_no: purchaseToEdit.referenceNo,
        supplier_id: purchaseToEdit.supplierId,
        warehouse_id: purchaseToEdit.warehouseId,
        date: purchaseToEdit.date ? purchaseToEdit.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
        due_date: purchaseToEdit.dueDate ? purchaseToEdit.dueDate.slice(0, 10) : null,
        status: purchaseToEdit.status,
        note: purchaseToEdit.note,
        order_discount: purchaseToEdit.orderDiscount || 0,
        order_tax: purchaseToEdit.orderTax || 0,
        shipping: purchaseToEdit.shipping || 0,
        paid: purchaseToEdit.paid || 0,
        paid_by: 'cash'
      });
      // Load detailed items
      axios.get(`${API_BASE}/${purchaseToEdit.id}`).then(res => {
        if (res.data?.data?.items) {
          setFormItems(res.data.data.items.map(it => ({
            key: it.id || Math.random(),
            product_id: it.productId,
            product_code: it.productCode,
            product_name: it.productName,
            option_id: it.optionId,
            variant_name: it.variantName,
            product_unit_id: it.unitId,
            product_unit_code: it.unitCode,
            quantity: it.quantity,
            unit_cost: it.unitCost,
            item_discount: it.itemDiscount || 0,
            item_tax: it.itemTax || 0,
            subtotal: it.subtotal
          })));
        }
      });
    } else {
      setEditingPurchaseId(null);
      purchaseForm.resetFields();
      purchaseForm.setFieldsValue({
        reference_no: metadata.nextReference,
        supplier_id: metadata.suppliers[0]?.id || 1,
        warehouse_id: metadata.warehouses[0]?.id || 1,
        date: new Date().toISOString().slice(0, 10),
        status: 'received',
        order_discount: 0,
        order_tax: 0,
        shipping: 0,
        paid: 0,
        paid_by: 'cash'
      });
      setFormItems([]);
    }
    setActiveTab('form');
  };

  // Add Item to Form
  const handleAddItemToForm = (product, variant = null) => {
    const existingIndex = formItems.findIndex(
      it => it.product_id === product.id && (variant ? it.option_id === variant.id : !it.option_id)
    );

    if (existingIndex >= 0) {
      // Increment quantity
      const updated = [...formItems];
      updated[existingIndex].quantity = (parseFloat(updated[existingIndex].quantity) || 1) + 1;
      const unitCost = parseFloat(updated[existingIndex].unit_cost) || 0;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * unitCost;
      setFormItems(updated);
    } else {
      const cost = variant ? parseFloat(variant.cost || product.cost || 0) : parseFloat(product.cost || 0);
      const newItem = {
        key: Date.now() + Math.random(),
        product_id: product.id,
        product_code: product.code || '',
        product_name: product.name,
        option_id: variant ? variant.id : null,
        variant_name: variant ? variant.name : null,
        product_unit_id: product.purchase_unit || product.unit || 1,
        product_unit_code: product.unit_name || 'Unit',
        quantity: 1,
        unit_cost: cost,
        item_discount: 0,
        item_tax: 0,
        subtotal: cost
      };
      setFormItems([...formItems, newItem]);
    }
  };

  // Remove Item from Form
  const handleRemoveFormItem = (key) => {
    setFormItems(formItems.filter(it => it.key !== key));
  };

  // Update item field in Form
  const handleUpdateFormItem = (key, field, value) => {
    const updated = formItems.map(it => {
      if (it.key === key) {
        const item = { ...it, [field]: value };
        const qty = parseFloat(field === 'quantity' ? value : item.quantity) || 0;
        const cost = parseFloat(field === 'unit_cost' ? value : item.unit_cost) || 0;
        const disc = parseFloat(field === 'item_discount' ? value : item.item_discount) || 0;
        const tax = parseFloat(field === 'item_tax' ? value : item.item_tax) || 0;
        item.subtotal = Math.max(0, (qty * cost) - disc + tax);
        return item;
      }
      return it;
    });
    setFormItems(updated);
  };

  // Calculate Form Totals
  const formCalculations = useMemo(() => {
    const itemsSubtotal = formItems.reduce((acc, it) => acc + (parseFloat(it.subtotal) || 0), 0);
    const orderDiscount = parseFloat(purchaseForm.getFieldValue('order_discount') || 0);
    const orderTax = parseFloat(purchaseForm.getFieldValue('order_tax') || 0);
    const shipping = parseFloat(purchaseForm.getFieldValue('shipping') || 0);
    const grandTotal = Math.max(0, (itemsSubtotal - orderDiscount) + orderTax + shipping);
    const paid = parseFloat(purchaseForm.getFieldValue('paid') || 0);
    const balance = Math.max(0, grandTotal - paid);

    return {
      itemsSubtotal,
      orderDiscount,
      orderTax,
      shipping,
      grandTotal,
      paid,
      balance
    };
  }, [formItems, Form.useWatch('order_discount', purchaseForm), Form.useWatch('order_tax', purchaseForm), Form.useWatch('shipping', purchaseForm), Form.useWatch('paid', purchaseForm)]);

  // Submit Purchase Form (Create or Update)
  const handleSubmitPurchaseForm = async (values) => {
    if (formItems.length === 0) {
      message.error(t('please_add_at_least_one_item', 'Please add at least one product item to the purchase order.'));
      return;
    }

    setSubmittingPurchase(true);
    try {
      const payload = {
        ...values,
        items: formItems.map(it => ({
          product_id: it.product_id,
          product_code: it.product_code,
          product_name: it.product_name,
          option_id: it.option_id,
          product_unit_id: it.product_unit_id,
          quantity: it.quantity,
          unit_cost: it.unit_cost,
          item_discount: it.item_discount,
          item_tax: it.item_tax,
          subtotal: it.subtotal
        }))
      };

      if (editingPurchaseId) {
        await axios.put(`${API_BASE}/${editingPurchaseId}`, payload);
        message.success(t('purchase_updated_successfully', 'Purchase updated successfully!'));
      } else {
        await axios.post(API_BASE, payload);
        message.success(t('purchase_created_successfully', 'Purchase order created successfully!'));
      }

      setActiveTab('list');
      fetchPurchases();
      fetchMetadata();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      message.error(errorMsg);
    } finally {
      setSubmittingPurchase(false);
    }
  };

  // Status Badge Helper
  const getStatusTag = (status) => {
    switch (status) {
      case 'received':
        return <Tag color="green" icon={<CheckCircleOutlined />}>{t('received', 'Received')}</Tag>;
      case 'partial':
        return <Tag color="orange" icon={<FieldTimeOutlined />}>{t('partial', 'Partial')}</Tag>;
      case 'ordered':
        return <Tag color="blue" icon={<ShoppingOutlined />}>{t('ordered', 'Ordered')}</Tag>;
      case 'pending':
        return <Tag color="gold" icon={<WarningOutlined />}>{t('pending', 'Pending Approval')}</Tag>;
      case 'draft':
        return <Tag color="default">{t('draft', 'Draft')}</Tag>;
      case 'cancelled':
        return <Tag color="error" icon={<CloseCircleOutlined />}>{t('cancelled', 'Cancelled')}</Tag>;
      default:
        return <Tag color="blue">{status}</Tag>;
    }
  };

  // Payment Status Badge Helper
  const getPaymentStatusTag = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid':
        return <Tag color="green" icon={<CheckCircleOutlined />}>{t('paid', 'Paid')}</Tag>;
      case 'partial':
        return <Tag color="orange">{t('partial', 'Partial')}</Tag>;
      case 'due':
      case 'unpaid':
        return <Tag color="red">{t('due', 'Due')}</Tag>;
      default:
        return <Tag color="default">{paymentStatus || 'Due'}</Tag>;
    }
  };

  // Table Columns Definition
  const columns = [
    {
      title: t('date', 'Date'),
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (val) => val ? new Date(val).toLocaleDateString() : '-'
    },
    {
      title: t('reference_no', 'Reference No'),
      dataIndex: 'referenceNo',
      key: 'referenceNo',
      width: 160,
      render: (text, record) => (
        <a onClick={() => handleViewPurchase(record.id)} style={{ fontWeight: 600, color: themeTokens.colorPrimary }}>
          {text}
        </a>
      )
    },
    {
      title: t('supplier', 'Supplier'),
      dataIndex: 'supplier',
      key: 'supplier',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          {record.supplierPhone && (
            <div><Text type="secondary" style={{ fontSize: 12 }}>{record.supplierPhone}</Text></div>
          )}
        </div>
      )
    },
    {
      title: t('warehouse', 'Warehouse'),
      dataIndex: 'warehouseName',
      key: 'warehouseName',
      width: 150,
      render: (text) => <Tag color="purple">{text}</Tag>
    },
    {
      title: t('purchase_status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (val) => getStatusTag(val)
    },
    {
      title: t('grand_total', 'Grand Total'),
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      align: 'right',
      width: 130,
      render: (val) => <Text strong style={{ fontSize: 14 }}>{formatCurrency(val)}</Text>
    },
    {
      title: t('paid', 'Paid'),
      dataIndex: 'paid',
      key: 'paid',
      align: 'right',
      width: 120,
      render: (val) => <Text style={{ color: '#16a34a' }}>{formatCurrency(val)}</Text>
    },
    {
      title: t('balance', 'Balance Due'),
      dataIndex: 'balance',
      key: 'balance',
      align: 'right',
      width: 120,
      render: (val) => (
        <Text style={{ color: val > 0 ? '#dc2626' : '#16a34a', fontWeight: val > 0 ? 600 : 400 }}>
          {formatCurrency(val)}
        </Text>
      )
    },
    {
      title: t('payment_status', 'Payment'),
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 110,
      render: (val) => getPaymentStatusTag(val)
    },
    {
      title: t('actions', 'Actions'),
      key: 'actions',
      align: 'center',
      width: 160,
      render: (_, record) => {
        const isReceived = record.status === 'received';
        const isCancelled = record.status === 'cancelled';
        const isFullyPaid = record.paymentStatus === 'paid';

        const actionMenuItems = [
          {
            key: 'view',
            icon: <EyeOutlined />,
            label: t('view_details', 'View Details'),
            onClick: () => handleViewPurchase(record.id)
          },
          {
            key: 'receive',
            icon: <InboxOutlined />,
            label: t('receive_goods', 'Receive Goods'),
            disabled: isReceived || isCancelled,
            onClick: () => handleOpenReceiveModal(record)
          },
          {
            key: 'payment',
            icon: <DollarOutlined />,
            label: t('add_payment', 'Add Payment'),
            disabled: isFullyPaid || isCancelled,
            onClick: () => handleOpenPaymentModal(record)
          },
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: t('edit_purchase', 'Edit Purchase'),
            disabled: isReceived || record.status === 'partial',
            onClick: () => handleOpenAddForm(record)
          },
          {
            type: 'divider'
          },
          {
            key: 'status_order',
            icon: <ShoppingOutlined />,
            label: t('mark_as_ordered', 'Mark as Ordered'),
            disabled: record.status !== 'draft' && record.status !== 'pending',
            onClick: () => handleStatusChange(record.id, 'ordered')
          },
          {
            key: 'status_cancel',
            icon: <CloseCircleOutlined />,
            label: t('cancel_purchase', 'Cancel Purchase Order'),
            danger: true,
            disabled: isCancelled,
            onClick: () => {
              Modal.confirm({
                title: t('confirm_cancel_po', 'Cancel Purchase Order?'),
                content: t('cancel_po_warning', 'Cancelling will mark the order as cancelled and reverse any warehouse stock previously received.'),
                okText: t('yes_cancel', 'Yes, Cancel Order'),
                okType: 'danger',
                onOk: () => handleStatusChange(record.id, 'cancelled')
              });
            }
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: t('delete', 'Delete'),
            danger: true,
            disabled: isReceived || record.status === 'partial' || record.paid > 0,
            onClick: () => {
              Modal.confirm({
                title: t('confirm_delete', 'Delete Purchase Order?'),
                content: t('delete_po_desc', 'This will permanently remove the purchase order. Only draft or unpaid/unreceived orders can be deleted.'),
                okText: t('delete', 'Delete'),
                okType: 'danger',
                onOk: () => handleDeletePurchase(record.id)
              });
            }
          }
        ];

        return (
          <Space orientation="horizontal" size="small">
            <Tooltip title={t('view', 'View')}>
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined style={{ color: themeTokens.colorPrimary }} />}
                onClick={() => handleViewPurchase(record.id)}
              />
            </Tooltip>
            {!isReceived && !isCancelled && (
              <Tooltip title={t('receive_goods', 'Receive Goods')}>
                <Button
                  type="text"
                  size="small"
                  icon={<InboxOutlined style={{ color: '#16a34a' }} />}
                  onClick={() => handleOpenReceiveModal(record)}
                />
              </Tooltip>
            )}
            {!isFullyPaid && !isCancelled && (
              <Tooltip title={t('add_payment', 'Add Payment')}>
                <Button
                  type="text"
                  size="small"
                  icon={<DollarOutlined style={{ color: '#d97706' }} />}
                  onClick={() => handleOpenPaymentModal(record)}
                />
              </Tooltip>
            )}
            <Dropdown menu={{ items: actionMenuItems }} trigger={['click']}>
              <Button type="text" size="small" icon={<DownOutlined style={{ fontSize: 10 }} />} />
            </Dropdown>
          </Space>
        );
      }
    }
  ];

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: themeTokens.colorBgLayout || '#f8fafc' }}>
      {/* Header and Action Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: themeTokens.colorTextHeading }}>
            {t('procurement_workspace', 'Purchases & Procurement Management')}
          </Title>
          <Text type="secondary">
            {t('procurement_desc', 'Manage supplier purchase orders, vendor invoices, multi-unit receiving, and supplier payments.')}
          </Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => { fetchPurchases(); fetchMetadata(); }}
            loading={loading}
          >
            {t('refresh', 'Refresh')}
          </Button>
          {activeTab === 'list' ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenAddForm(null)}
              style={{ background: themeTokens.colorPrimary }}
            >
              {t('add_purchase', 'Add Purchase')}
            </Button>
          ) : (
            <Button onClick={() => setActiveTab('list')}>
              {t('back_to_list', 'Back to Purchases List')}
            </Button>
          )}
        </Space>
      </div>

      {/* Top Metrics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={t('total_purchases', 'Total Purchases')}
              value={metrics.totalPurchases}
              prefix={<ShoppingOutlined style={{ color: themeTokens.colorPrimary }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={5}>
          <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={t('total_spend', 'Total Spend')}
              value={metrics.totalSpend}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#2563eb' }} />}
              formatter={(val) => formatCurrency(val)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={5}>
          <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={t('total_paid', 'Total Paid')}
              value={metrics.totalPaid}
              precision={2}
              prefix={<CheckCircleOutlined style={{ color: '#16a34a' }} />}
              formatter={(val) => formatCurrency(val)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={5}>
          <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={t('outstanding_due', 'Outstanding Due')}
              value={metrics.totalBalance}
              precision={2}
              prefix={<WarningOutlined style={{ color: '#dc2626' }} />}
              formatter={(val) => formatCurrency(val)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={5}>
          <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={t('received_orders', 'Fully Received')}
              value={metrics.received}
              suffix={`/ ${metrics.totalPurchases}`}
              prefix={<InboxOutlined style={{ color: '#16a34a' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content Area */}
      {activeTab === 'list' ? (
        <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          {/* Filters Bar */}
          <div style={{ marginBottom: 16 }}>
            <Row gutter={[12, 12]} align="middle">
              <Col xs={24} sm={12} md={6}>
                <Input
                  placeholder={t('search_po_placeholder', 'Search by PO #, supplier, notes...')}
                  prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onPressEnter={handleSearch}
                  allowClear
                />
              </Col>
              <Col xs={12} sm={6} md={4}>
                <Select
                  value={statusFilter}
                  onChange={(val) => { setStatusFilter(val); setPagination(p => ({ ...p, page: 1 })); }}
                  style={{ width: '100%' }}
                >
                  <Option value="all">{t('all_statuses', 'All Statuses')}</Option>
                  <Option value="received">{t('received', 'Received')}</Option>
                  <Option value="partial">{t('partial', 'Partial')}</Option>
                  <Option value="ordered">{t('ordered', 'Ordered')}</Option>
                  <Option value="pending">{t('pending', 'Pending Approval')}</Option>
                  <Option value="draft">{t('draft', 'Draft')}</Option>
                  <Option value="cancelled">{t('cancelled', 'Cancelled')}</Option>
                </Select>
              </Col>
              <Col xs={12} sm={6} md={4}>
                <Select
                  value={paymentStatusFilter}
                  onChange={(val) => { setPaymentStatusFilter(val); setPagination(p => ({ ...p, page: 1 })); }}
                  style={{ width: '100%' }}
                >
                  <Option value="all">{t('all_payments', 'All Payments')}</Option>
                  <Option value="paid">{t('paid', 'Paid')}</Option>
                  <Option value="partial">{t('partial', 'Partial Paid')}</Option>
                  <Option value="due">{t('due', 'Due / Unpaid')}</Option>
                </Select>
              </Col>
              <Col xs={12} sm={6} md={4}>
                <Select
                  value={supplierFilter}
                  onChange={(val) => { setSupplierFilter(val); setPagination(p => ({ ...p, page: 1 })); }}
                  style={{ width: '100%' }}
                  showSearch
                  optionFilterProp="children"
                >
                  <Option value="all">{t('all_suppliers', 'All Suppliers')}</Option>
                  {metadata.suppliers.map(s => (
                    <Option key={s.id} value={s.id}>{s.name}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={12} sm={6} md={4}>
                <Select
                  value={warehouseFilter}
                  onChange={(val) => { setWarehouseFilter(val); setPagination(p => ({ ...p, page: 1 })); }}
                  style={{ width: '100%' }}
                >
                  <Option value="all">{t('all_warehouses', 'All Warehouses')}</Option>
                  {metadata.warehouses.map(w => (
                    <Option key={w.id} value={w.id}>{w.name}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={6} md={2}>
                <Button type="primary" onClick={handleSearch} icon={<FilterOutlined />}>
                  {t('filter', 'Filter')}
                </Button>
              </Col>
            </Row>
          </div>

          {/* Purchases Table */}
          <Table
            columns={columns}
            dataSource={purchases}
            rowKey="id"
            loading={loading}
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: pagination.totalRecords,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (page, limit) => setPagination({ ...pagination, page, limit })
            }}
            scroll={{ x: 1200 }}
          />
        </Card>
      ) : (
        /* Add / Edit Purchase Form */
        <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ marginBottom: 20 }}>
            <Title level={4} style={{ margin: 0 }}>
              {editingPurchaseId ? t('edit_purchase', 'Edit Purchase Order') : t('new_purchase_order', 'Create New Purchase Order')}
            </Title>
            <Text type="secondary">
              {t('purchase_form_help', 'Select supplier, receiving warehouse, and pick products with specific variant attributes.')}
            </Text>
          </div>

          <Form
            form={purchaseForm}
            layout="vertical"
            onFinish={handleSubmitPurchaseForm}
          >
            <Row gutter={16}>
              <Col xs={24} md={6}>
                <Form.Item
                  name="reference_no"
                  label={t('reference_no', 'Reference No')}
                  rules={[{ required: true, message: 'Please provide reference no' }]}
                >
                  <Input placeholder="PO-YYYYMM-XXXX" />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item
                  name="supplier_id"
                  label={t('supplier', 'Supplier')}
                  rules={[{ required: true, message: 'Please select a supplier' }]}
                >
                  <Select placeholder="Select supplier" showSearch optionFilterProp="children">
                    {metadata.suppliers.map(s => (
                      <Option key={s.id} value={s.id}>{s.name} ({s.company || '-'})</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item
                  name="warehouse_id"
                  label={t('receiving_warehouse', 'Receiving Warehouse')}
                  rules={[{ required: true, message: 'Please select a warehouse' }]}
                >
                  <Select placeholder="Select warehouse">
                    {metadata.warehouses.map(w => (
                      <Option key={w.id} value={w.id}>{w.name} ({w.code})</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item
                  name="status"
                  label={t('purchase_status', 'Purchase Status')}
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Option value="received">{t('status_received_desc', 'Received (Stock added immediately)')}</Option>
                    <Option value="ordered">{t('status_ordered_desc', 'Ordered (Awaiting shipment)')}</Option>
                    <Option value="pending">{t('status_pending_desc', 'Pending Approval')}</Option>
                    <Option value="draft">{t('status_draft_desc', 'Draft')}</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={6}>
                <Form.Item name="date" label={t('date', 'Date')} rules={[{ required: true }]}>
                  <Input type="date" />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item name="due_date" label={t('due_date', 'Due Date')}>
                  <Input type="date" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="note" label={t('note', 'Note / Instructions')}>
                  <Input placeholder="Supplier notes, purchase order instructions..." />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left" style={{ margin: '16px 0' }}>
              <Space>
                <ShoppingOutlined style={{ color: themeTokens.colorPrimary }} />
                <Text strong>{t('purchase_items', 'Purchase Items & Product Variants')}</Text>
              </Space>
            </Divider>

            {/* Product Quick-Add Search Bar */}
            <div style={{ marginBottom: 16, background: '#f1f5f9', padding: 12, borderRadius: 6 }}>
              <Row gutter={12} align="middle">
                <Col xs={24} md={18}>
                  <Select
                    showSearch
                    placeholder={t('search_products_to_add', 'Type product name or SKU to search and add to order...')}
                    style={{ width: '100%' }}
                    loading={productSearchLoading}
                    filterOption={false}
                    onSearch={(val) => fetchProductsForPicker(val)}
                    onChange={(val) => {
                      const prod = availableProducts.find(p => p.id === val);
                      if (prod) {
                        handleAddItemToForm(prod, null);
                      }
                    }}
                  >
                    {availableProducts.map(p => (
                      <Option key={p.id} value={p.id}>
                        {p.code} - {p.name} (Cost: {formatCurrency(p.cost || 0)})
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col xs={24} md={6}>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {availableProducts.length} {t('products_available', 'products available in catalog')}
                  </Text>
                </Col>
              </Row>
            </div>

            {/* Items Table */}
            <Table
              dataSource={formItems}
              rowKey="key"
              pagination={false}
              bordered
              size="middle"
              locale={{
                emptyText: <Empty description={t('no_items_in_po', 'No items added. Use the product selector above to add products to this purchase order.')} />
              }}
              columns={[
                {
                  title: t('product', 'Product'),
                  key: 'product',
                  render: (_, item) => (
                    <div>
                      <Text strong>{item.product_name}</Text>
                      {item.variant_name && (
                        <div><Tag color="cyan">{item.variant_name}</Tag></div>
                      )}
                      <div><Text type="secondary" style={{ fontSize: 11 }}>SKU: {item.product_code}</Text></div>
                    </div>
                  )
                },
                {
                  title: t('unit', 'Unit'),
                  dataIndex: 'product_unit_code',
                  key: 'unit',
                  width: 100,
                  render: (val) => <Tag color="blue">{val || 'Unit'}</Tag>
                },
                {
                  title: t('quantity', 'Quantity'),
                  dataIndex: 'quantity',
                  key: 'quantity',
                  width: 130,
                  render: (val, item) => (
                    <InputNumber
                      min={0.01}
                      step={1}
                      value={val}
                      onChange={(newVal) => handleUpdateFormItem(item.key, 'quantity', newVal)}
                      style={{ width: '100%' }}
                    />
                  )
                },
                {
                  title: t('unit_cost', 'Unit Cost ($)'),
                  dataIndex: 'unit_cost',
                  key: 'unit_cost',
                  width: 140,
                  render: (val, item) => (
                    <InputNumber
                      min={0}
                      step={0.01}
                      precision={2}
                      value={val}
                      onChange={(newVal) => handleUpdateFormItem(item.key, 'unit_cost', newVal)}
                      style={{ width: '100%' }}
                    />
                  )
                },
                {
                  title: t('discount', 'Discount ($)'),
                  dataIndex: 'item_discount',
                  key: 'item_discount',
                  width: 120,
                  render: (val, item) => (
                    <InputNumber
                      min={0}
                      step={0.5}
                      value={val}
                      onChange={(newVal) => handleUpdateFormItem(item.key, 'item_discount', newVal)}
                      style={{ width: '100%' }}
                    />
                  )
                },
                {
                  title: t('subtotal', 'Subtotal ($)'),
                  dataIndex: 'subtotal',
                  key: 'subtotal',
                  align: 'right',
                  width: 140,
                  render: (val) => <Text strong>{formatCurrency(val)}</Text>
                },
                {
                  title: '',
                  key: 'remove',
                  width: 60,
                  align: 'center',
                  render: (_, item) => (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveFormItem(item.key)}
                    />
                  )
                }
              ]}
            />

            {/* Calculations Summary Section */}
            <div style={{ marginTop: 24, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item name="order_discount" label={t('order_discount', 'Order Discount ($)')}>
                        <InputNumber min={0} step={1} precision={2} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="order_tax" label={t('order_tax', 'Order Tax ($)')}>
                        <InputNumber min={0} step={1} precision={2} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="shipping" label={t('shipping', 'Shipping ($)')}>
                        <InputNumber min={0} step={1} precision={2} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="paid" label={t('initial_payment', 'Initial Payment ($)')}>
                        <InputNumber min={0} step={1} precision={2} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="paid_by" label={t('payment_method', 'Payment Method')}>
                        <Select>
                          <Option value="cash">{t('cash', 'Cash')}</Option>
                          <Option value="bank_transfer">{t('bank_transfer', 'Bank Transfer')}</Option>
                          <Option value="khqr">{t('khqr', 'ABA KHQR')}</Option>
                          <Option value="cheque">{t('cheque', 'Cheque')}</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>

                <Col xs={24} md={12}>
                  <Card size="small" style={{ background: '#fff', borderRadius: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text type="secondary">{t('items_subtotal', 'Items Subtotal')}:</Text>
                      <Text strong>{formatCurrency(formCalculations.itemsSubtotal)}</Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text type="secondary">{t('order_discount', 'Order Discount')}:</Text>
                      <Text style={{ color: '#dc2626' }}>- {formatCurrency(formCalculations.orderDiscount)}</Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text type="secondary">{t('order_tax', 'Order Tax')}:</Text>
                      <Text>+ {formatCurrency(formCalculations.orderTax)}</Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text type="secondary">{t('shipping', 'Shipping')}:</Text>
                      <Text>+ {formatCurrency(formCalculations.shipping)}</Text>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Title level={4} style={{ margin: 0 }}>{t('grand_total', 'Grand Total')}:</Title>
                      <Title level={4} style={{ margin: 0, color: themeTokens.colorPrimary }}>
                        {formatCurrency(formCalculations.grandTotal)}
                      </Title>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text type="secondary">{t('paid', 'Paid')}:</Text>
                      <Text style={{ color: '#16a34a' }}>{formatCurrency(formCalculations.paid)}</Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text strong>{t('balance_due', 'Balance Due')}:</Text>
                      <Text strong style={{ color: formCalculations.balance > 0 ? '#dc2626' : '#16a34a' }}>
                        {formatCurrency(formCalculations.balance)}
                      </Text>
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button onClick={() => setActiveTab('list')}>
                {t('cancel', 'Cancel')}
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submittingPurchase}
                style={{ background: themeTokens.colorPrimary }}
              >
                {editingPurchaseId ? t('update_purchase', 'Update Purchase') : t('create_purchase', 'Create Purchase Order')}
              </Button>
            </div>
          </Form>
        </Card>
      )}

      {/* View Purchase Details Modal / Printable Invoice */}
      <Modal
        title={null}
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        width={900}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={() => window.print()}>
            {t('print', 'Print Purchase Voucher')}
          </Button>,
          selectedPurchase?.status !== 'received' && selectedPurchase?.status !== 'cancelled' && (
            <Button
              key="rcv"
              type="primary"
              icon={<InboxOutlined />}
              onClick={() => {
                setViewModalVisible(false);
                handleOpenReceiveModal(selectedPurchase);
              }}
              style={{ background: '#16a34a' }}
            >
              {t('receive_goods', 'Receive Goods')}
            </Button>
          ),
          selectedPurchase?.paymentStatus !== 'paid' && selectedPurchase?.status !== 'cancelled' && (
            <Button
              key="pay"
              type="primary"
              icon={<DollarOutlined />}
              onClick={() => {
                setViewModalVisible(false);
                handleOpenPaymentModal(selectedPurchase);
              }}
              style={{ background: '#d97706' }}
            >
              {t('add_payment', 'Add Payment')}
            </Button>
          ),
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            {t('close', 'Close')}
          </Button>
        ]}
      >
        {viewLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>
        ) : selectedPurchase ? (
          <div className="printable-purchase-voucher" style={{ padding: '10px 0' }}>
            {/* Voucher Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: 16, marginBottom: 16 }}>
              <div>
                <Title level={4} style={{ margin: 0, color: themeTokens.colorPrimary }}>AURA SUPPLY ERP</Title>
                <Text type="secondary">Procurement & Inventory Intake Voucher</Text>
                <div style={{ marginTop: 8 }}>
                  <Text strong>{t('warehouse', 'Warehouse')}: </Text>
                  <Text>{selectedPurchase.warehouseName} ({selectedPurchase.warehouseCode})</Text>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Title level={3} style={{ margin: 0 }}>{selectedPurchase.referenceNo}</Title>
                <div><Text type="secondary">{t('date', 'Date')}: {new Date(selectedPurchase.date).toLocaleDateString()}</Text></div>
                <div style={{ marginTop: 4 }}>
                  {getStatusTag(selectedPurchase.status)} {getPaymentStatusTag(selectedPurchase.paymentStatus)}
                </div>
              </div>
            </div>

            {/* Supplier and Order Meta */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Card size="small" title={t('supplier_info', 'Supplier Information')} bordered>
                  <Text strong>{selectedPurchase.supplierDetails?.name}</Text>
                  {selectedPurchase.supplierDetails?.company && <div><Text>{selectedPurchase.supplierDetails.company}</Text></div>}
                  {selectedPurchase.supplierDetails?.phone && <div><Text type="secondary">{t('phone', 'Phone')}: {selectedPurchase.supplierDetails.phone}</Text></div>}
                  {selectedPurchase.supplierDetails?.email && <div><Text type="secondary">{t('email', 'Email')}: {selectedPurchase.supplierDetails.email}</Text></div>}
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title={t('order_meta', 'Order Details')} bordered>
                  <div><Text type="secondary">{t('order_ref', 'Order Ref')}: </Text><Text>{selectedPurchase.orderRef || '-'}</Text></div>
                  <div><Text type="secondary">{t('due_date', 'Due Date')}: </Text><Text>{selectedPurchase.dueDate ? new Date(selectedPurchase.dueDate).toLocaleDateString() : '-'}</Text></div>
                  <div><Text type="secondary">{t('note', 'Note')}: </Text><Text>{selectedPurchase.note || '-'}</Text></div>
                </Card>
              </Col>
            </Row>

            {/* Items Table */}
            <Table
              dataSource={selectedPurchase.items || []}
              rowKey="id"
              pagination={false}
              size="small"
              bordered
              columns={[
                {
                  title: t('product', 'Product / Variant'),
                  render: (_, it) => (
                    <div>
                      <Text strong>{it.productName}</Text>
                      {it.variantName && <div><Tag color="cyan">{it.variantName}</Tag></div>}
                      <div><Text type="secondary" style={{ fontSize: 11 }}>SKU: {it.productCode}</Text></div>
                    </div>
                  )
                },
                {
                  title: t('ordered_qty', 'Ordered Qty'),
                  dataIndex: 'quantity',
                  align: 'right',
                  render: (val, it) => `${val} ${it.unitCode || 'Unit'}`
                },
                {
                  title: t('received_qty', 'Received'),
                  dataIndex: 'quantityReceived',
                  align: 'right',
                  render: (val) => <Text style={{ color: '#16a34a' }}>{val}</Text>
                },
                {
                  title: t('balance_qty', 'Remaining'),
                  dataIndex: 'quantityBalance',
                  align: 'right',
                  render: (val) => <Text style={{ color: val > 0 ? '#dc2626' : '#64748b' }}>{val}</Text>
                },
                {
                  title: t('unit_cost', 'Unit Cost'),
                  dataIndex: 'unitCost',
                  align: 'right',
                  render: (val) => formatCurrency(val)
                },
                {
                  title: t('subtotal', 'Subtotal'),
                  dataIndex: 'subtotal',
                  align: 'right',
                  render: (val) => <Text strong>{formatCurrency(val)}</Text>
                }
              ]}
            />

            {/* Financial Summary */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <div style={{ width: 320 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text>{t('subtotal', 'Subtotal')}:</Text>
                  <Text>{formatCurrency(selectedPurchase.total)}</Text>
                </div>
                {selectedPurchase.orderDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text>{t('order_discount', 'Order Discount')}:</Text>
                    <Text style={{ color: '#dc2626' }}>- {formatCurrency(selectedPurchase.orderDiscount)}</Text>
                  </div>
                )}
                {selectedPurchase.orderTax > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text>{t('tax', 'Order Tax')}:</Text>
                    <Text>+ {formatCurrency(selectedPurchase.orderTax)}</Text>
                  </div>
                )}
                {selectedPurchase.shipping > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text>{t('shipping', 'Shipping')}:</Text>
                    <Text>+ {formatCurrency(selectedPurchase.shipping)}</Text>
                  </div>
                )}
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text strong style={{ fontSize: 16 }}>{t('grand_total', 'Grand Total')}:</Text>
                  <Text strong style={{ fontSize: 16, color: themeTokens.colorPrimary }}>{formatCurrency(selectedPurchase.grandTotal)}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: '#16a34a' }}>{t('paid', 'Paid')}:</Text>
                  <Text style={{ color: '#16a34a', fontWeight: 600 }}>{formatCurrency(selectedPurchase.paid)}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong>{t('balance_due', 'Balance Due')}:</Text>
                  <Text strong style={{ color: selectedPurchase.balance > 0 ? '#dc2626' : '#16a34a' }}>
                    {formatCurrency(selectedPurchase.balance)}
                  </Text>
                </div>
              </div>
            </div>

            {/* Payment Records Section */}
            {selectedPurchase.payments && selectedPurchase.payments.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <Divider orientation="left"><CreditCardOutlined /> {t('payment_history', 'Payment History')}</Divider>
                <Table
                  dataSource={selectedPurchase.payments}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  columns={[
                    { title: t('date', 'Date'), dataIndex: 'date', render: (val) => new Date(val).toLocaleDateString() },
                    { title: t('reference', 'Reference'), dataIndex: 'referenceNo' },
                    { title: t('paid_by', 'Paid By'), dataIndex: 'paidBy', render: (val) => <Tag>{val}</Tag> },
                    { title: t('amount', 'Amount'), dataIndex: 'amount', align: 'right', render: (val) => <Text strong style={{ color: '#16a34a' }}>{formatCurrency(val)}</Text> },
                    { title: t('note', 'Note'), dataIndex: 'note' },
                    {
                      title: '',
                      key: 'del',
                      align: 'center',
                      render: (_, pay) => (
                        <Popconfirm
                          title={t('delete_payment_confirm', 'Delete this payment record?')}
                          onConfirm={() => handleDeletePayment(selectedPurchase.id, pay.id)}
                        >
                          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                        </Popconfirm>
                      )
                    }
                  ]}
                />
              </div>
            )}

            {/* Stock Movement Goods Receipt History */}
            {selectedPurchase.stockMovements && selectedPurchase.stockMovements.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <Divider orientation="left"><InboxOutlined /> {t('goods_receipt_history', 'Goods Receipt History (Stock Movement Ledger)')}</Divider>
                <Table
                  dataSource={selectedPurchase.stockMovements}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  columns={[
                    { title: t('date', 'Date'), dataIndex: 'date', render: (val) => new Date(val).toLocaleString() },
                    { title: t('reference', 'Ref'), dataIndex: 'referenceNo' },
                    { title: t('product', 'Product'), dataIndex: 'productName' },
                    { title: t('quantity_received', 'Qty Received'), dataIndex: 'quantity', align: 'right', render: (val, sm) => <Tag color="green">+{val} {sm.unitCode || 'Unit'}</Tag> },
                    { title: t('unit_cost', 'Cost'), dataIndex: 'realUnitCost', align: 'right', render: (val) => formatCurrency(val) }
                  ]}
                />
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Goods Receiving Modal */}
      <Modal
        title={
          <Space>
            <InboxOutlined style={{ color: '#16a34a' }} />
            <span>{t('receive_goods_title', 'Receive Goods Into Warehouse')} - {selectedPurchase?.referenceNo}</span>
          </Space>
        }
        open={receiveModalVisible}
        onCancel={() => setReceiveModalVisible(false)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setReceiveModalVisible(false)}>
            {t('cancel', 'Cancel')}
          </Button>,
          <Button
            key="fill_all"
            onClick={() => {
              setReceiveItems(receiveItems.map(it => ({ ...it, quantity_to_receive: it.quantityBalance })));
            }}
          >
            {t('receive_all_remaining', 'Receive All Remaining')}
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={submittingReceive}
            onClick={handleSubmitReceive}
            style={{ background: '#16a34a' }}
          >
            {t('confirm_receipt', 'Confirm & Update Stock')}
          </Button>
        ]}
      >
        <Alert
          message={t('receiving_alert_title', 'Inventory Stock Intake')}
          description={t('receiving_alert_desc', 'Entering quantities here will immediately update warehouse stock and variant inventory levels via the stock movement ledger.')}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Table
          dataSource={receiveItems}
          rowKey="item_id"
          pagination={false}
          size="middle"
          bordered
          columns={[
            {
              title: t('product', 'Product / Variant'),
              render: (_, it) => (
                <div>
                  <Text strong>{it.productName}</Text>
                  {it.variantName && <div><Tag color="cyan">{it.variantName}</Tag></div>}
                  <div><Text type="secondary" style={{ fontSize: 11 }}>SKU: {it.productCode}</Text></div>
                </div>
              )
            },
            {
              title: t('ordered', 'Ordered'),
              dataIndex: 'quantity',
              align: 'right',
              width: 90
            },
            {
              title: t('already_received', 'Already Rcvd'),
              dataIndex: 'quantityReceived',
              align: 'right',
              width: 110,
              render: (val) => <Text style={{ color: '#16a34a' }}>{val}</Text>
            },
            {
              title: t('remaining_balance', 'Remaining'),
              dataIndex: 'quantityBalance',
              align: 'right',
              width: 110,
              render: (val) => <Text strong style={{ color: val > 0 ? '#dc2626' : '#64748b' }}>{val}</Text>
            },
            {
              title: t('quantity_to_receive', 'Quantity to Receive'),
              dataIndex: 'quantity_to_receive',
              width: 170,
              render: (val, it) => (
                <InputNumber
                  min={0}
                  max={it.quantityBalance}
                  step={1}
                  value={val}
                  onChange={(newVal) => {
                    const updated = receiveItems.map(item =>
                      item.item_id === it.item_id ? { ...item, quantity_to_receive: newVal } : item
                    );
                    setReceiveItems(updated);
                  }}
                  style={{ width: '100%' }}
                />
              )
            }
          ]}
        />
      </Modal>

      {/* Add Payment Modal */}
      <Modal
        title={
          <Space>
            <DollarOutlined style={{ color: '#d97706' }} />
            <span>{t('add_supplier_payment', 'Record Supplier Payment')} - {selectedPurchase?.referenceNo}</span>
          </Space>
        }
        open={paymentModalVisible}
        onCancel={() => setPaymentModalVisible(false)}
        footer={null}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">{t('total_amount', 'Total Amount')}: </Text>
          <Text strong>{formatCurrency(selectedPurchase?.grandTotal || 0)}</Text>
          <span style={{ margin: '0 8px' }}>|</span>
          <Text type="secondary">{t('already_paid', 'Already Paid')}: </Text>
          <Text style={{ color: '#16a34a' }}>{formatCurrency(selectedPurchase?.paid || 0)}</Text>
          <span style={{ margin: '0 8px' }}>|</span>
          <Text type="secondary">{t('balance_due', 'Balance Due')}: </Text>
          <Text strong style={{ color: '#dc2626' }}>{formatCurrency(selectedPurchase?.balance || 0)}</Text>
        </div>

        <Form
          form={paymentForm}
          layout="vertical"
          onFinish={handleSubmitPayment}
        >
          <Form.Item
            name="amount"
            label={t('payment_amount', 'Payment Amount ($)')}
            rules={[{ required: true, message: 'Please enter payment amount' }]}
          >
            <InputNumber min={0.01} step={1} precision={2} style={{ width: '100%' }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="paid_by"
                label={t('paid_by', 'Payment Method')}
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="cash">{t('cash', 'Cash')}</Option>
                  <Option value="bank_transfer">{t('bank_transfer', 'Bank Transfer')}</Option>
                  <Option value="khqr">{t('khqr', 'ABA KHQR')}</Option>
                  <Option value="cheque">{t('cheque', 'Cheque')}</Option>
                  <Option value="credit_card">{t('credit_card', 'Credit Card')}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="date" label={t('payment_date', 'Payment Date')} rules={[{ required: true }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="reference_no" label={t('payment_reference', 'Payment Reference')}>
            <Input placeholder="PAY-PO-XXXX" />
          </Form.Item>

          <Form.Item name="cheque_no" label={t('cheque_or_bank_ref', 'Cheque / Bank Reference No')}>
            <Input placeholder="e.g. TR-92849184" />
          </Form.Item>

          <Form.Item name="note" label={t('note', 'Note')}>
            <Input.TextArea rows={2} placeholder="Optional payment remarks..." />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setPaymentModalVisible(false)}>
              {t('cancel', 'Cancel')}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submittingPayment}
              style={{ background: '#d97706' }}
            >
              {t('save_payment', 'Save Payment')}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default BpasPurchasesWorkspace;
