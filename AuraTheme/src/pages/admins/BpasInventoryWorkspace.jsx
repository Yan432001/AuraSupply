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
  Switch,
  message,
  Popconfirm,
  Tooltip,
  Badge,
  Divider,
  Dropdown,
  Tabs,
  Radio,
  DatePicker,
  Flex,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EditOutlined,
  BarcodeOutlined,
  PrinterOutlined,
  FileExcelOutlined,
  DollarOutlined,
  EyeOutlined,
  FilterOutlined,
  DownOutlined,
  UpOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  SwapOutlined,
  ApartmentOutlined,
  InboxOutlined,
  FolderOutlined,
  ShopOutlined,
  SyncOutlined,
  CopyOutlined,
  CheckSquareOutlined,
  SettingOutlined,
  UploadOutlined,
  GiftOutlined,
  FieldTimeOutlined,
  FileTextOutlined,
  ToolOutlined,
  MoreOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatCurrency } from '../../utils/uiTheme';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import BpasAddProductPage from './BpasAddProductPage';
import BpasImportExcelPage from './BpasImportExcelPage';
import BpasPrintBarcodesPage from './BpasPrintBarcodesPage';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const LIVE_PRODUCTS_KEY = 'aura_admin_live_products_v2';
const getLiveProducts = () => {
  try {
    const raw = localStorage.getItem(LIVE_PRODUCTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.products)) return parsed.products;
    return [];
  } catch {
    return [];
  }
};
const saveLiveProducts = (prods) => {
  try {
    const list = Array.isArray(prods) ? prods : Array.isArray(prods?.products) ? prods.products : [];
    localStorage.setItem(LIVE_PRODUCTS_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('aura_live_products_updated', { detail: list }));
  } catch (_) {}
};

export default function BpasInventoryWorkspace() {
  const adminTheme = useAdminTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  // Determine initial page mode: 'list' | 'add' | 'import' | 'barcode'
  const isAddRoute =
    location.pathname.endsWith('/add') ||
    searchParams.get('action') === 'add' ||
    searchParams.get('tab') === 'add-product' ||
    searchParams.get('menu') === 'add-product';

  const isImportRoute =
    location.pathname.endsWith('/import') ||
    searchParams.get('action') === 'import' ||
    searchParams.get('tab') === 'import-products' ||
    searchParams.get('menu') === 'import-products';

  const isBarcodeRoute =
    location.pathname.endsWith('/print_barcodes') ||
    searchParams.get('action') === 'barcode' ||
    searchParams.get('tab') === 'print-barcodes' ||
    searchParams.get('menu') === 'print-barcodes';

  const initialMode = isAddRoute ? 'add' : isImportRoute ? 'import' : isBarcodeRoute ? 'barcode' : 'list';
  const [pageMode, setPageMode] = useState(initialMode);
  const [editingRecord, setEditingRecord] = useState(null);
  const [barcodeSelectedItems, setBarcodeSelectedItems] = useState([]);

  // Active Tab: products | stock-counts | quantity-adjustments | cost-adjustments | using-stock | stock-received | transfers | consignments
  const initialTab = searchParams.get('tab') || searchParams.get('menu') || 'products';
  const [activeTab, setActiveTab] = useState(initialTab === 'inventory' ? 'products' : initialTab);

  // Sync tab with URL if changed externally
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const currentTab = params.get('tab') || params.get('menu');
    const currentAction = params.get('action');

    if (location.pathname.endsWith('/add') || currentAction === 'add' || currentTab === 'add-product') {
      setPageMode('add');
    } else if (location.pathname.endsWith('/import') || currentAction === 'import' || currentTab === 'import-products') {
      setPageMode('import');
    } else if (location.pathname.endsWith('/print_barcodes') || currentAction === 'barcode' || currentTab === 'print-barcodes') {
      setPageMode('barcode');
    } else {
      setPageMode('list');
      if (currentTab && currentTab !== 'inventory') {
        setActiveTab(currentTab);
      }
    }
  }, [location.pathname, location.search]);

  // Main Data States
  const [productsList, setProductsList] = useState(() => getLiveProducts());
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filter Drawer State (matches BPAS toggle_up / toggle_down)
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterWarehouse, setFilterWarehouse] = useState('all');
  const [filterStockStatus, setFilterStockStatus] = useState('all');

  // Metadata
  const [warehousesList, setWarehousesList] = useState([
    { id: 1, name: 'Warehouse 1 (Main Storage)', code: 'WH01' },
    { id: 2, name: 'Warehouse 2 (Transit Depot)', code: 'WH02' },
    { id: 3, name: 'Store Counter (Retail)', code: 'WH03' },
  ]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [unitsList, setUnitsList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [billersList, setBillersList] = useState([]);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [currentEditRecord, setCurrentEditRecord] = useState(null);
  const [productModalActiveTab, setProductModalActiveTab] = useState('required');

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);

  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [barcodePaperSize, setBarcodePaperSize] = useState('40_per_sheet');
  const [barcodeItemsToPrint, setBarcodeItemsToPrint] = useState([]);

  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);
  const [bulkPriceAction, setBulkPriceAction] = useState('percent_discount');
  const [bulkPriceValue, setBulkPriceValue] = useState(10);

  // Forms
  const [productForm] = Form.useForm();
  const [adjustmentForm] = Form.useForm();
  const [transferForm] = Form.useForm();

  // Stock Movement Mock / DB Datasets for sub-views
  const [stockCountsList, setStockCountsList] = useState([
    { id: 1, date: '2026-10-15', reference: 'STC-2026-001', warehouse: 'Warehouse 1', type: 'Full Count', counted_by: 'Inventory Team A', variance: '-2 items', status: 'Finalized' },
    { id: 2, date: '2026-10-16', reference: 'STC-2026-002', warehouse: 'Store Counter', type: 'Partial (Beverages)', counted_by: 'Staff John', variance: '0 items', status: 'Pending Review' },
  ]);

  const [adjustmentsList, setAdjustmentsList] = useState([
    { id: 1, date: '2026-10-14', reference: 'ADJ-2026-001', warehouse: 'Warehouse 1', type: 'Subtraction', reason: 'Damaged during transit', items_count: 3, created_by: 'Admin' },
    { id: 2, date: '2026-10-15', reference: 'ADJ-2026-002', warehouse: 'Warehouse 2', type: 'Addition', reason: 'Found stock during audit', items_count: 5, created_by: 'Warehouse Mgr' },
  ]);

  const [transfersList, setTransfersList] = useState([
    { id: 1, date: '2026-10-13', reference: 'TR-2026-001', from_warehouse: 'Warehouse 1', to_warehouse: 'Store Counter', items_count: 45, shipping: '$5.00', status: 'Completed' },
    { id: 2, date: '2026-10-16', reference: 'TR-2026-002', from_warehouse: 'Warehouse 1', to_warehouse: 'Warehouse 2', items_count: 120, shipping: '$15.00', status: 'In Transit' },
  ]);

  const [usingStockList, setUsingStockList] = useState([
    { id: 1, date: '2026-10-14', reference: 'USE-2026-001', warehouse: 'Warehouse 1', department: 'Kitchen & Bar', employee: 'Sokha Rith', items_count: 12, note: 'Store daily tasting & operational supply' },
    { id: 2, date: '2026-10-15', reference: 'USE-2026-002', warehouse: 'Store Counter', department: 'Marketing', employee: 'Dara Chan', items_count: 4, note: 'Event promotional tasting samples' },
  ]);

  const [consignmentsList, setConsignmentsList] = useState([
    { id: 1, date: '2026-10-10', reference: 'CSG-2026-001', party: 'Angkor Organic Farm (Supplier)', type: 'Consignment In', total_qty: 200, sold_qty: 140, balance_qty: 60, status: 'Active' },
    { id: 2, date: '2026-10-12', reference: 'CSG-2026-002', party: 'Lucky Supermarket Group (Client)', type: 'Consignment Out', total_qty: 500, sold_qty: 380, balance_qty: 120, status: 'Active' },
  ]);

  // Fetch Metadata & Products from backend
  const fetchMetadata = async () => {
    try {
      const [whRes, catRes, unitsRes, brandsRes, billersRes] = await Promise.allSettled([
        axios.get('/api/warehouses'),
        axios.get('/api/categories'),
        axios.get('/api/units'),
        axios.get('/api/brands'),
        axios.get('/api/billers'),
      ]);

      if (whRes.status === 'fulfilled' && Array.isArray(whRes.value.data?.data)) {
        if (whRes.value.data.data.length > 0) setWarehousesList(whRes.value.data.data);
      }
      if (catRes.status === 'fulfilled') {
        const raw = catRes.value.data?.data || catRes.value.data;
        if (Array.isArray(raw)) setCategoriesList(raw);
      }
      if (unitsRes.status === 'fulfilled' && Array.isArray(unitsRes.value.data?.data)) {
        setUnitsList(unitsRes.value.data.data);
      }
      if (brandsRes.status === 'fulfilled') {
        const raw = brandsRes.value.data?.data || brandsRes.value.data;
        if (Array.isArray(raw)) setBrandsList(raw);
      }
      if (billersRes.status === 'fulfilled' && Array.isArray(billersRes.value.data?.data)) {
        setBillersList(billersRes.value.data.data);
      }
    } catch (err) {
      console.warn('Metadata fetch note:', err.message);
    }
  };

  const fetchLiveProducts = async () => {
    setIsSyncing(true);
    try {
      let prods = [];
      try {
        const res = await axios.get('/api/admin/products?limit=300');
        if ((res.data?.status || res.data?.success) && Array.isArray(res.data?.data)) {
          prods = res.data.data;
        }
      } catch (_) {}

      if (!prods.length) {
        const pubRes = await axios.get('/api/products?limit=300');
        if (pubRes.data?.success && Array.isArray(pubRes.data?.data?.products)) {
          prods = pubRes.data.data.products;
        }
      }

      if (prods.length > 0) {
        setProductsList(prods);
        saveLiveProducts(prods);
      }
    } catch (err) {
      console.warn('Live products fetch note:', err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
    fetchLiveProducts();
  }, []);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const list = Array.isArray(productsList) ? productsList : [];
    return list.filter((item) => {
      const matchSearch =
        !filterSearch ||
        (item.name && item.name.toLowerCase().includes(filterSearch.toLowerCase())) ||
        (item.code && item.code.toLowerCase().includes(filterSearch.toLowerCase())) ||
        (item.brand && item.brand.toLowerCase().includes(filterSearch.toLowerCase()));

      const matchCategory =
        filterCategory === 'all' ||
        item.category === filterCategory ||
        String(item.category_id) === String(filterCategory);

      const matchType =
        filterType === 'all' ||
        (item.type && item.type.toLowerCase() === filterType.toLowerCase()) ||
        (filterType === 'active' && item.inStock) ||
        (filterType === 'inactive' && !item.inStock);

      const matchStockStatus =
        filterStockStatus === 'all' ||
        (filterStockStatus === 'in_stock' && item.inStock) ||
        (filterStockStatus === 'low_stock' && (item.stockCount ?? 20) <= (item.alertQuantity ?? 10)) ||
        (filterStockStatus === 'out_of_stock' && !item.inStock);

      return matchSearch && matchCategory && matchType && matchStockStatus;
    });
  }, [productsList, filterSearch, filterCategory, filterType, filterStockStatus]);

  // Metrics
  const metrics = useMemo(() => {
    const list = Array.isArray(productsList) ? productsList : [];
    const total = list.length;
    const inStock = list.filter((p) => p.inStock).length;
    const lowStock = list.filter((p) => (p.stockCount ?? 20) <= (p.alertQuantity ?? 10)).length;
    const totalValuation = list.reduce((acc, p) => acc + (p.price || 0) * (p.stockCount ?? 40), 0);
    const totalCostValuation = list.reduce((acc, p) => acc + (p.cost || p.price * 0.6) * (p.stockCount ?? 40), 0);

    return {
      total,
      inStock,
      lowStock,
      totalValuation,
      totalCostValuation,
      marginPercent: totalValuation > 0 ? Math.round(((totalValuation - totalCostValuation) / totalValuation) * 100) : 40,
    };
  }, [productsList]);

  // Handlers
  const handleOpenAddProduct = () => {
    setEditingRecord(null);
    setPageMode('add');
    navigate('/admins/products?action=add', { replace: true });
  };

  const handleEditProduct = (record) => {
    setEditingRecord(record);
    setPageMode('add');
    navigate('/admins/products?action=add', { replace: true });
  };

  const handleOpenImport = () => {
    setPageMode('import');
    navigate('/admins/products?action=import', { replace: true });
  };

  const handleSaveProduct = async () => {
    try {
      const values = await productForm.validateFields();
      const updatedList = isEditingMode
        ? productsList.map((p) =>
            p.id === currentEditRecord.id
              ? {
                  ...p,
                  name: values.name,
                  code: values.barcode || values.code || p.code,
                  type: values.type || 'standard',
                  category: values.category,
                  unit: values.unit,
                  cost: Number(values.cost) || p.cost,
                  price: Number(values.price) || p.price,
                  alertQuantity: Number(values.alert_quantity) || 10,
                  inStock: values.inStock,
                  rack: values.rack,
                  details: values.details,
                }
              : p
          )
        : [
            {
              id: Date.now(),
              name: values.name,
              code: values.barcode || `P${Math.floor(1000 + Math.random() * 9000)}`,
              type: values.type || 'standard',
              category: values.category || 'General',
              unit: values.unit || 'Pcs',
              cost: Number(values.cost) || 1.5,
              price: Number(values.price) || 3.0,
              stockCount: 50,
              alertQuantity: Number(values.alert_quantity) || 10,
              inStock: values.inStock !== false,
              rack: values.rack || 'A-01',
              image: '/assets/uploads/no_image.png',
              billerName: billersList[0]?.company || 'Main Store',
            },
            ...productsList,
          ];

      setProductsList(updatedList);
      saveLiveProducts(updatedList);
      message.success(isEditingMode ? 'Product updated successfully' : 'New product created');
      setIsProductModalOpen(false);
    } catch (err) {
      message.error('Please complete all required fields.');
    }
  };

  const handleDeleteProduct = (id) => {
    const next = productsList.filter((p) => p.id !== id);
    setProductsList(next);
    saveLiveProducts(next);
    message.success('Product deleted');
  };

  const handleBulkDelete = () => {
    if (!selectedRowKeys.length) {
      message.warning('Please select at least one product.');
      return;
    }
    const next = productsList.filter((p) => !selectedRowKeys.includes(p.id));
    setProductsList(next);
    saveLiveProducts(next);
    setSelectedRowKeys([]);
    message.success(`Deleted ${selectedRowKeys.length} products`);
  };

  const handleOpenBarcodePrint = (items = []) => {
    const targets = items.length
      ? items
      : selectedRowKeys.length
      ? productsList.filter((p) => selectedRowKeys.includes(p.id))
      : productsList.slice(0, 10);
    setBarcodeSelectedItems(targets);
    setPageMode('barcode');
    navigate('/admins/products?action=barcode', { replace: true });
  };

  const handleOpenAdjustment = (product = null) => {
    adjustmentForm.resetFields();
    adjustmentForm.setFieldsValue({
      date: '2026-10-16',
      reference_no: `ADJ-${Date.now().toString().slice(-4)}`,
      warehouse_id: warehousesList[0]?.id || 1,
      type: 'addition',
      reason: 'inventory_count',
      product_id: product?.id,
      quantity: 5,
    });
    setIsAdjustmentModalOpen(true);
  };

  const handleOpenTransfer = () => {
    transferForm.resetFields();
    transferForm.setFieldsValue({
      date: '2026-10-16',
      reference_no: `TR-${Date.now().toString().slice(-4)}`,
      from_warehouse_id: warehousesList[0]?.id || 1,
      to_warehouse_id: warehousesList[1]?.id || 2,
      shipping: 5.0,
      status: 'pending',
    });
    setIsTransferModalOpen(true);
  };

  const handleExportExcel = () => {
    const targetItems = selectedRowKeys.length
      ? productsList.filter((p) => selectedRowKeys.includes(p.id))
      : filteredProducts;

    const headers = ['ID', 'Code', 'Name', 'Type', 'Category', 'Unit', 'Cost', 'Price', 'Stock Quantity', 'Alert Qty', 'Rack'];
    const rows = targetItems.map((p) => [
      p.id,
      `"${p.code || ''}"`,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      p.type || 'standard',
      `"${p.category || 'General'}"`,
      p.unit || 'Pcs',
      p.cost || 0,
      p.price || 0,
      p.stockCount ?? 40,
      p.alertQuantity ?? 10,
      p.rack || 'A-01',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bpas_products_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success(`Exported ${targetItems.length} products to Excel (CSV)`);
  };

  // Main Products Table Columns (Accurately mirrors BPAS products/index.php)
  const columns = [
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      width: 65,
      align: 'center',
      render: (img, record) => (
        <div
          onClick={() => {
            setDetailProduct(record);
            setIsDetailModalOpen(true);
          }}
          style={{
            width: 44,
            height: 44,
            borderRadius: 6,
            overflow: 'hidden',
            cursor: 'pointer',
            border: `1px solid ${adminTheme.border}`,
            margin: '0 auto',
            background: '#f8fafc',
          }}
        >
          <img
            src={img || '/assets/uploads/no_image.png'}
            alt={record.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/assets/uploads/no_image.png';
            }}
          />
        </div>
      ),
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      sorter: (a, b) => (a.code || '').localeCompare(b.code || ''),
      render: (code) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
          {code || 'N/A'}
        </span>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 240,
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
      render: (name, record) => (
        <div>
          <a
            onClick={() => {
              setDetailProduct(record);
              setIsDetailModalOpen(true);
            }}
            style={{ fontWeight: 700, color: adminTheme.text, fontSize: 13 }}
          >
            {name}
          </a>
          {record.badge && (
            <Tag color="volcano" style={{ marginLeft: 6, fontSize: 10, borderRadius: 4, padding: '0 4px' }}>
              {record.badge}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => {
        const t = (type || 'standard').toLowerCase();
        const color = t === 'combo' ? 'purple' : t === 'service' ? 'orange' : t === 'digital' ? 'cyan' : 'blue';
        return <Tag color={color} style={{ textTransform: 'capitalize', fontWeight: 600 }}>{t}</Tag>;
      },
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 130,
      render: (cat) => <span style={{ fontWeight: 600 }}>{cat || 'General'}</span>,
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
      align: 'center',
      render: (unit) => <Tag style={{ borderRadius: 4 }}>{unit || 'Pcs'}</Tag>,
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      key: 'cost',
      width: 100,
      align: 'right',
      sorter: (a, b) => (a.cost || 0) - (b.cost || 0),
      render: (cost, record) => (
        <span style={{ color: adminTheme.subtext, fontSize: 12 }}>
          {formatCurrency(cost || record.price * 0.6)}
        </span>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 110,
      align: 'right',
      sorter: (a, b) => (a.price || 0) - (b.price || 0),
      render: (price) => (
        <span style={{ fontWeight: 800, color: '#16a34a', fontSize: 13.5 }}>
          {formatCurrency(price || 0)}
        </span>
      ),
    },
    {
      title: 'Warehouse Breakdown',
      key: 'warehouse_breakdown',
      width: 180,
      render: (_, record) => {
        const qty = record.stockCount ?? 45;
        const wh1 = Math.round(qty * 0.6);
        const wh2 = Math.round(qty * 0.3);
        const wh3 = qty - wh1 - wh2;
        return (
          <div style={{ fontSize: 11, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ color: '#0284c7' }}>WH1: <strong>{wh1}</strong></span>
            <span style={{ color: '#7c3aed' }}>WH2: <strong>{wh2}</strong></span>
            <span style={{ color: '#059669' }}>Counter: <strong>{wh3}</strong></span>
          </div>
        );
      },
    },
    {
      title: 'Quantity',
      dataIndex: 'stockCount',
      key: 'stockCount',
      width: 110,
      align: 'right',
      sorter: (a, b) => (a.stockCount ?? 40) - (b.stockCount ?? 40),
      render: (qty, record) => {
        const count = qty ?? 40;
        const alertQty = record.alertQuantity ?? 10;
        const isLow = count <= alertQty;
        return (
          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                fontWeight: 800,
                fontSize: 13,
                color: isLow ? '#dc2626' : '#16a34a',
                padding: '2px 6px',
                borderRadius: 4,
                background: isLow ? '#fee2e2' : 'transparent',
              }}
            >
              {count}
            </span>
            {isLow && (
              <div style={{ fontSize: 10, color: '#dc2626', fontWeight: 700, marginTop: 2 }}>
                ⚠️ Low Stock
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Rack',
      dataIndex: 'rack',
      key: 'rack',
      width: 85,
      align: 'center',
      render: (rack) => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{rack || 'A-01'}</span>,
    },
    {
      title: 'Alert Qty',
      dataIndex: 'alertQuantity',
      key: 'alertQuantity',
      width: 90,
      align: 'center',
      render: (alert) => <Tag color="warning" style={{ borderRadius: 4 }}>{alert ?? 10}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 90,
      align: 'center',
      render: (_, record) => {
        const actionItems = [
          {
            key: 'view',
            icon: <EyeOutlined />,
            label: 'Product Details',
            onClick: () => {
              setDetailProduct(record);
              setIsDetailModalOpen(true);
            },
          },
          {
            key: 'edit',
            icon: <EditOutlined style={{ color: '#2563eb' }} />,
            label: 'Edit Product',
            onClick: () => handleEditProduct(record),
          },
          {
            key: 'barcode',
            icon: <BarcodeOutlined style={{ color: '#059669' }} />,
            label: 'Print Barcode Label',
            onClick: () => handleOpenBarcodePrint([record]),
          },
          {
            key: 'adjust',
            icon: <SettingOutlined style={{ color: '#f59e0b' }} />,
            label: 'Stock Adjustment',
            onClick: () => handleOpenAdjustment(record),
          },
          {
            type: 'divider',
          },
          {
            key: 'delete',
            icon: <DeleteOutlined style={{ color: '#dc2626' }} />,
            danger: true,
            label: 'Delete Product',
            onClick: () => handleDeleteProduct(record.id),
          },
        ];

        return (
          <Dropdown menu={{ items: actionItems }} trigger={['click']} placement="bottomRight">
            <Button size="small" type="default" icon={<MoreOutlined />} style={{ borderRadius: 6 }}>
              Action
            </Button>
          </Dropdown>
        );
      },
    },
  ];

  // Actions menu for the top-right Tasks icon (Exact BPAS functionality)
  const taskMenuItems = [
    {
      key: 'add',
      icon: <PlusOutlined style={{ color: '#16a34a' }} />,
      label: 'Add Product',
      onClick: handleOpenAddProduct,
    },
    {
      key: 'import_excel',
      icon: <UploadOutlined style={{ color: '#059669' }} />,
      label: 'Import Products (Excel/CSV)',
      onClick: () => setPageMode('import'),
    },
    {
      key: 'update_price',
      icon: <FileExcelOutlined style={{ color: '#2563eb' }} />,
      label: 'Update Price (Bulk)',
      onClick: () => setIsBulkPriceModalOpen(true),
    },
    {
      key: 'print_barcodes',
      icon: <PrinterOutlined style={{ color: '#0284c7' }} />,
      label: 'Print Barcode Label',
      onClick: () => handleOpenBarcodePrint(),
    },
    {
      key: 'price_list',
      icon: <DollarOutlined style={{ color: '#f59e0b' }} />,
      label: 'Price List',
      onClick: () => window.print(),
    },
    {
      key: 'export_excel',
      icon: <FileExcelOutlined style={{ color: '#16a34a' }} />,
      label: 'Export to Excel (CSV)',
      onClick: handleExportExcel,
    },
    {
      type: 'divider',
    },
    {
      key: 'delete_bulk',
      icon: <DeleteOutlined style={{ color: '#dc2626' }} />,
      danger: true,
      label: 'Delete Selected Products',
      onClick: handleBulkDelete,
    },
  ];

  // Warehouses dropdown menu
  const warehouseMenuItems = [
    {
      key: 'all',
      icon: <ApartmentOutlined />,
      label: 'All Warehouses',
      onClick: () => setFilterWarehouse('all'),
    },
    { type: 'divider' },
    ...warehousesList.map((wh) => ({
      key: String(wh.id),
      icon: <ShopOutlined />,
      label: wh.name,
      onClick: () => setFilterWarehouse(String(wh.id)),
    })),
  ];

  if (pageMode === 'add') {
    return (
      <BpasAddProductPage
        onBack={() => {
          setPageMode('list');
          setEditingRecord(null);
          navigate('/admins/products', { replace: true });
          fetchLiveProducts();
        }}
        editProduct={editingRecord}
      />
    );
  }

  if (pageMode === 'import') {
    return (
      <BpasImportExcelPage
        onBack={() => {
          setPageMode('list');
          navigate('/admins/products', { replace: true });
          fetchLiveProducts();
        }}
      />
    );
  }

  if (pageMode === 'barcode') {
    return (
      <BpasPrintBarcodesPage
        onBack={() => {
          setPageMode('list');
          navigate('/admins/products', { replace: true });
        }}
        preselectedItems={barcodeSelectedItems}
      />
    );
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. BPAS Top Metric Ribbon */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card
            bordered
            style={{ borderRadius: 12, background: adminTheme.card, border: `1px solid ${adminTheme.border}` }}
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Statistic
              title={<span style={{ fontWeight: 700, fontSize: 12, color: adminTheme.subtext }}>TOTAL CATALOG ITEMS</span>}
              value={metrics.total}
              prefix={<BarcodeOutlined style={{ color: '#2563eb' }} />}
              suffix={<span style={{ fontSize: 13, color: adminTheme.subtext }}>SKUs</span>}
              valueStyle={{ fontWeight: 900, color: adminTheme.text }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            bordered
            style={{ borderRadius: 12, background: adminTheme.card, border: `1px solid ${adminTheme.border}` }}
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Statistic
              title={<span style={{ fontWeight: 700, fontSize: 12, color: adminTheme.subtext }}>AVAILABLE IN STOCK</span>}
              value={metrics.inStock}
              prefix={<CheckCircleOutlined style={{ color: '#16a34a' }} />}
              suffix={<span style={{ fontSize: 13, color: '#16a34a' }}>Active</span>}
              valueStyle={{ fontWeight: 900, color: '#16a34a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            bordered
            style={{ borderRadius: 12, background: adminTheme.card, border: `1px solid ${adminTheme.border}` }}
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Statistic
              title={<span style={{ fontWeight: 700, fontSize: 12, color: adminTheme.subtext }}>LOW STOCK WARNINGS</span>}
              value={metrics.lowStock}
              prefix={<WarningOutlined style={{ color: '#ea580c' }} />}
              suffix={<span style={{ fontSize: 13, color: '#ea580c' }}>Under Alert</span>}
              valueStyle={{ fontWeight: 900, color: '#ea580c' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            bordered
            style={{ borderRadius: 12, background: adminTheme.card, border: `1px solid ${adminTheme.border}` }}
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Statistic
              title={<span style={{ fontWeight: 700, fontSize: 12, color: adminTheme.subtext }}>TOTAL STOCK VALUATION</span>}
              value={metrics.totalValuation}
              formatter={(v) => formatCurrency(v)}
              prefix={<DollarOutlined style={{ color: '#059669' }} />}
              valueStyle={{ fontWeight: 900, color: '#059669' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 2. Sub-Navigation Tabs across the top (BPAS Products Menus) */}
      <Card
        style={{ borderRadius: 12, border: `1px solid ${adminTheme.border}` }}
        styles={{ body: { padding: '10px 16px' } }}
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap={10}>
          <Space size={6} wrap>
            <Button
              type={activeTab === 'products' ? 'primary' : 'default'}
              icon={<BarcodeOutlined />}
              onClick={() => {
                setPageMode('list');
                setActiveTab('products');
              }}
              style={{ fontWeight: 700 }}
            >
              List Products
            </Button>
            <Button
              type="default"
              icon={<PlusOutlined />}
              onClick={handleOpenAddProduct}
              style={{ fontWeight: 700, borderColor: '#16a34a', color: '#16a34a' }}
            >
              Add Product
            </Button>
            <Button
              type="default"
              icon={<UploadOutlined />}
              onClick={() => setPageMode('import')}
              style={{ fontWeight: 700 }}
            >
              Import Products
            </Button>
            <Button
              type="default"
              icon={<PrinterOutlined />}
              onClick={() => handleOpenBarcodePrint()}
              style={{ fontWeight: 700 }}
            >
              Print Barcode Label
            </Button>
            <Button
              type={activeTab === 'stock-counts' ? 'primary' : 'default'}
              icon={<CheckSquareOutlined />}
              onClick={() => {
                setPageMode('list');
                setActiveTab('stock-counts');
              }}
              style={{ fontWeight: 700 }}
            >
              Stock Counts
            </Button>
            <Button
              type={activeTab === 'quantity-adjustments' ? 'primary' : 'default'}
              icon={<ToolOutlined />}
              onClick={() => setActiveTab('quantity-adjustments')}
              style={{ fontWeight: 700 }}
            >
              Quantity Adjustments
            </Button>
            <Button
              type={activeTab === 'cost-adjustments' ? 'primary' : 'default'}
              icon={<DollarOutlined />}
              onClick={() => setActiveTab('cost-adjustments')}
              style={{ fontWeight: 700 }}
            >
              Cost Adjustments
            </Button>
            <Button
              type={activeTab === 'using-stock' ? 'primary' : 'default'}
              icon={<InboxOutlined />}
              onClick={() => setActiveTab('using-stock')}
              style={{ fontWeight: 700 }}
            >
              Stock Using
            </Button>
            <Button
              type={activeTab === 'transfers' ? 'primary' : 'default'}
              icon={<SwapOutlined />}
              onClick={() => setActiveTab('transfers')}
              style={{ fontWeight: 700 }}
            >
              Transfers
            </Button>
            <Button
              type={activeTab === 'consignments' ? 'primary' : 'default'}
              icon={<FileTextOutlined />}
              onClick={() => setActiveTab('consignments')}
              style={{ fontWeight: 700 }}
            >
              Consignments
            </Button>
          </Space>

          <Space size={8}>
            <Button
              icon={<SyncOutlined spin={isSyncing} />}
              onClick={fetchLiveProducts}
              style={{ fontWeight: 700 }}
            >
              Sync DB
            </Button>
            <Button
              icon={<PrinterOutlined />}
              onClick={() => handleOpenBarcodePrint()}
              style={{ fontWeight: 700 }}
            >
              Barcodes
            </Button>
          </Space>
        </Flex>
      </Card>

      {/* 3. Main Box Container matching BPAS .box and .box-header */}
      <Card
        style={{
          borderRadius: 14,
          border: `1px solid ${adminTheme.border}`,
          boxShadow: '0 4px 18px rgba(0,0,0,0.03)',
        }}
        styles={{
          header: {
            background: adminTheme.cardMuted,
            borderBottom: `1px solid ${adminTheme.border}`,
            padding: '14px 20px',
          },
          body: {
            padding: '20px',
          },
        }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarcodeOutlined style={{ color: '#2563eb', fontSize: 20 }} />
            <span style={{ fontSize: 17, fontWeight: 800, color: '#2563eb' }}>
              Products ({filterWarehouse === 'all' ? 'All Warehouses' : warehousesList.find((w) => String(w.id) === filterWarehouse)?.name || 'Selected Warehouse'})
            </span>
          </div>
        }
        extra={
          <Space size={10}>
            {/* Toggle Search Filter Button (toggle_up / toggle_down in BPAS) */}
            <Tooltip title={showFilterDrawer ? 'Hide Filters' : 'Show Advanced Filters'}>
              <Button
                type="text"
                icon={showFilterDrawer ? <UpOutlined /> : <DownOutlined />}
                onClick={() => setShowFilterDrawer(!showFilterDrawer)}
                style={{
                  fontWeight: 700,
                  color: showFilterDrawer ? '#2563eb' : adminTheme.subtext,
                  border: `1px solid ${adminTheme.border}`,
                  borderRadius: 8,
                }}
              >
                {showFilterDrawer ? 'Collapse Filters' : 'Filter Products'}
              </Button>
            </Tooltip>

            {/* Warehouse Dropdown Selector */}
            <Dropdown menu={{ items: warehouseMenuItems }} trigger={['click']}>
              <Button style={{ fontWeight: 700, borderRadius: 8 }} icon={<ApartmentOutlined />}>
                Warehouses <DownOutlined style={{ fontSize: 10 }} />
              </Button>
            </Dropdown>

            {/* Tasks Actions Menu Dropdown (Exact BPAS tasks-menus) */}
            <Dropdown menu={{ items: taskMenuItems }} trigger={['click']} placement="bottomRight">
              <Button
                type="primary"
                style={{
                  fontWeight: 800,
                  borderRadius: 8,
                  background: '#2563eb',
                }}
                icon={<SettingOutlined />}
              >
                Actions <DownOutlined style={{ fontSize: 10 }} />
              </Button>
            </Dropdown>
          </Space>
        }
      >
        {/* Collapsible Advanced Filter Bar (Sliding drawer matching BPAS) */}
        {showFilterDrawer && (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 12,
              background: adminTheme.cardMuted,
              border: `1px solid ${adminTheme.border}`,
              marginBottom: 20,
            }}
          >
            <Row gutter={[16, 16]} align="bottom">
              <Col xs={24} sm={12} md={6}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: adminTheme.text, display: 'block', marginBottom: 6 }}>
                    Product Name / Code:
                  </label>
                  <Input
                    placeholder="Search by code or title..."
                    prefix={<SearchOutlined />}
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    allowClear
                  />
                </div>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: adminTheme.text, display: 'block', marginBottom: 6 }}>
                    Category:
                  </label>
                  <Select
                    value={filterCategory}
                    onChange={setFilterCategory}
                    style={{ width: '100%' }}
                  >
                    <Option value="all">All Categories</Option>
                    {categoriesList.map((cat) => (
                      <Option key={cat.id || cat.name} value={cat.name || cat.id}>
                        {cat.name}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: adminTheme.text, display: 'block', marginBottom: 6 }}>
                    Product Type:
                  </label>
                  <Select
                    value={filterType}
                    onChange={setFilterType}
                    style={{ width: '100%' }}
                  >
                    <Option value="all">All Types</Option>
                    <Option value="standard">Standard</Option>
                    <Option value="combo">Combo</Option>
                    <Option value="digital">Digital</Option>
                    <Option value="service">Service</Option>
                    <Option value="active">Active (In Stock)</Option>
                    <Option value="inactive">Inactive</Option>
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: adminTheme.text, display: 'block', marginBottom: 6 }}>
                    Stock Status:
                  </label>
                  <Select
                    value={filterStockStatus}
                    onChange={setFilterStockStatus}
                    style={{ width: '100%' }}
                  >
                    <Option value="all">All Inventory</Option>
                    <Option value="in_stock">Healthy Stock</Option>
                    <Option value="low_stock">Low Stock (Under Alert)</Option>
                    <Option value="out_of_stock">Out of Stock</Option>
                  </Select>
                </div>
              </Col>
            </Row>

            <Flex justify="flex-end" style={{ marginTop: 14 }} gap={10}>
              <Button
                onClick={() => {
                  setFilterSearch('');
                  setFilterCategory('all');
                  setFilterType('all');
                  setFilterWarehouse('all');
                  setFilterStockStatus('all');
                }}
              >
                Reset Filters
              </Button>
              <Button
                type="primary"
                icon={<FilterOutlined />}
                onClick={() => setShowFilterDrawer(false)}
                style={{ fontWeight: 700 }}
              >
                Apply Filters ({filteredProducts.length} Results)
              </Button>
            </Flex>
          </div>
        )}

        {/* Dynamic Content Based on Active Sub-view */}
        {activeTab === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: adminTheme.subtext }}>
                Showing <strong>{filteredProducts.length}</strong> products in catalog
                {selectedRowKeys.length > 0 && ` (${selectedRowKeys.length} selected)`}
              </span>

              {selectedRowKeys.length > 0 && (
                <Space size={8}>
                  <Button
                    size="small"
                    icon={<PrinterOutlined />}
                    onClick={() => handleOpenBarcodePrint()}
                  >
                    Print Labels ({selectedRowKeys.length})
                  </Button>
                  <Button
                    size="small"
                    icon={<FileExcelOutlined />}
                    onClick={handleExportExcel}
                  >
                    Export Selected
                  </Button>
                  <Popconfirm
                    title="Delete selected products?"
                    onConfirm={handleBulkDelete}
                    okText="Yes, delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                  >
                    <Button size="small" danger icon={<DeleteOutlined />}>
                      Delete ({selectedRowKeys.length})
                    </Button>
                  </Popconfirm>
                </Space>
              )}
            </div>

            <Table
              rowKey="id"
              columns={columns}
              dataSource={filteredProducts}
              rowSelection={{
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys),
              }}
              pagination={{
                pageSize: 15,
                showSizeChanger: true,
                pageSizeOptions: ['10', '15', '25', '50', '100'],
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
              }}
              scroll={{ x: 1350 }}
              size="middle"
            />
          </div>
        )}

        {/* Sub-view: Stock Counts */}
        {activeTab === 'stock-counts' && (
          <div>
            <Flex justify="space-between" align="center" style={{ marginBottom: 14 }}>
              <Title level={4} style={{ margin: 0 }}>Stock Counts (Physical Inventory Audits)</Title>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => message.info('Initiating new stock count batch...')}>
                Start New Stock Count
              </Button>
            </Flex>
            <Table
              rowKey="id"
              dataSource={stockCountsList}
              columns={[
                { title: 'Date', dataIndex: 'date', key: 'date', width: 120 },
                { title: 'Reference No', dataIndex: 'reference', key: 'reference', width: 160, render: (t) => <strong style={{ color: '#2563eb' }}>{t}</strong> },
                { title: 'Warehouse', dataIndex: 'warehouse', key: 'warehouse', width: 180 },
                { title: 'Count Type', dataIndex: 'type', key: 'type', width: 160 },
                { title: 'Counted By', dataIndex: 'counted_by', key: 'counted_by', width: 160 },
                { title: 'Variance', dataIndex: 'variance', key: 'variance', width: 120, render: (v) => <Tag color={v === '0 items' ? 'green' : 'orange'}>{v}</Tag> },
                { title: 'Status', dataIndex: 'status', key: 'status', width: 130, render: (s) => <Tag color={s === 'Finalized' ? 'blue' : 'warning'}>{s}</Tag> },
                {
                  title: 'Actions',
                  key: 'actions',
                  width: 120,
                  render: () => (
                    <Space size={6}>
                      <Button size="small" type="text" icon={<EyeOutlined />} />
                      <Button size="small" type="text" icon={<PrinterOutlined />} />
                    </Space>
                  ),
                },
              ]}
              pagination={false}
            />
          </div>
        )}

        {/* Sub-view: Quantity Adjustments */}
        {activeTab === 'quantity-adjustments' && (
          <div>
            <Flex justify="space-between" align="center" style={{ marginBottom: 14 }}>
              <Title level={4} style={{ margin: 0 }}>Quantity Adjustments (Damage, Loss, Surplus)</Title>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenAdjustment()}>
                Add Quantity Adjustment
              </Button>
            </Flex>
            <Table
              rowKey="id"
              dataSource={adjustmentsList}
              columns={[
                { title: 'Date', dataIndex: 'date', key: 'date', width: 120 },
                { title: 'Reference No', dataIndex: 'reference', key: 'reference', width: 160, render: (t) => <strong style={{ color: '#2563eb' }}>{t}</strong> },
                { title: 'Warehouse', dataIndex: 'warehouse', key: 'warehouse', width: 180 },
                { title: 'Adjustment Type', dataIndex: 'type', key: 'type', width: 140, render: (t) => <Tag color={t === 'Addition' ? 'green' : 'red'}>{t}</Tag> },
                { title: 'Reason', dataIndex: 'reason', key: 'reason', width: 220 },
                { title: 'Items Affected', dataIndex: 'items_count', key: 'items_count', width: 120, align: 'right' },
                { title: 'Created By', dataIndex: 'created_by', key: 'created_by', width: 140 },
                {
                  title: 'Actions',
                  key: 'actions',
                  width: 100,
                  render: () => <Button size="small" type="text" icon={<EyeOutlined />} />,
                },
              ]}
              pagination={false}
            />
          </div>
        )}

        {/* Sub-view: Cost Adjustments */}
        {activeTab === 'cost-adjustments' && (
          <div>
            <Flex justify="space-between" align="center" style={{ marginBottom: 14 }}>
              <Title level={4} style={{ margin: 0 }}>Cost Adjustments & Revaluation</Title>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => message.info('Opening cost revaluation form...')}>
                Add Cost Adjustment
              </Button>
            </Flex>
            <Table
              rowKey="id"
              dataSource={[
                { id: 1, date: '2026-10-14', reference: 'CADJ-2026-001', product: 'Arabica Coffee Beans 500g', old_cost: '$8.50', new_cost: '$9.20', reason: 'Supplier import tariff hike' },
                { id: 2, date: '2026-10-15', reference: 'CADJ-2026-002', product: 'Takeaway Cup 16oz (Pack of 50)', old_cost: '$2.10', new_cost: '$1.95', reason: 'Bulk vendor volume rebate' },
              ]}
              columns={[
                { title: 'Date', dataIndex: 'date', key: 'date', width: 120 },
                { title: 'Reference No', dataIndex: 'reference', key: 'reference', width: 160, render: (t) => <strong style={{ color: '#2563eb' }}>{t}</strong> },
                { title: 'Product', dataIndex: 'product', key: 'product', width: 260 },
                { title: 'Previous Cost', dataIndex: 'old_cost', key: 'old_cost', width: 130 },
                { title: 'New Unit Cost', dataIndex: 'new_cost', key: 'new_cost', width: 130, render: (c) => <strong style={{ color: '#16a34a' }}>{c}</strong> },
                { title: 'Reason / Note', dataIndex: 'reason', key: 'reason' },
              ]}
              pagination={false}
            />
          </div>
        )}

        {/* Sub-view: Using Stock */}
        {activeTab === 'using-stock' && (
          <div>
            <Flex justify="space-between" align="center" style={{ marginBottom: 14 }}>
              <Title level={4} style={{ margin: 0 }}>Stock Using (Internal Store Operational Consumption)</Title>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => message.info('Opening stock using requisition...')}>
                Add Stock Using Entry
              </Button>
            </Flex>
            <Table
              rowKey="id"
              dataSource={usingStockList}
              columns={[
                { title: 'Date', dataIndex: 'date', key: 'date', width: 120 },
                { title: 'Reference No', dataIndex: 'reference', key: 'reference', width: 160, render: (t) => <strong style={{ color: '#2563eb' }}>{t}</strong> },
                { title: 'Warehouse', dataIndex: 'warehouse', key: 'warehouse', width: 160 },
                { title: 'Department', dataIndex: 'department', key: 'department', width: 160 },
                { title: 'Employee', dataIndex: 'employee', key: 'employee', width: 160 },
                { title: 'Items Qty', dataIndex: 'items_count', key: 'items_count', width: 100, align: 'right' },
                { title: 'Operational Purpose / Note', dataIndex: 'note', key: 'note' },
              ]}
              pagination={false}
            />
          </div>
        )}

        {/* Sub-view: Transfers */}
        {activeTab === 'transfers' && (
          <div>
            <Flex justify="space-between" align="center" style={{ marginBottom: 14 }}>
              <Title level={4} style={{ margin: 0 }}>Warehouse Transfers</Title>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenTransfer}>
                Create Transfer
              </Button>
            </Flex>
            <Table
              rowKey="id"
              dataSource={transfersList}
              columns={[
                { title: 'Date', dataIndex: 'date', key: 'date', width: 120 },
                { title: 'Transfer No', dataIndex: 'reference', key: 'reference', width: 160, render: (t) => <strong style={{ color: '#2563eb' }}>{t}</strong> },
                { title: 'From Warehouse', dataIndex: 'from_warehouse', key: 'from_warehouse', width: 180 },
                { title: 'To Warehouse', dataIndex: 'to_warehouse', key: 'to_warehouse', width: 180 },
                { title: 'Total Items', dataIndex: 'items_count', key: 'items_count', width: 120, align: 'right' },
                { title: 'Shipping Charge', dataIndex: 'shipping', key: 'shipping', width: 130, align: 'right' },
                { title: 'Status', dataIndex: 'status', key: 'status', width: 130, render: (s) => <Tag color={s === 'Completed' ? 'green' : 'orange'}>{s}</Tag> },
                {
                  title: 'Actions',
                  key: 'actions',
                  width: 100,
                  render: () => <Button size="small" type="text" icon={<EyeOutlined />} />,
                },
              ]}
              pagination={false}
            />
          </div>
        )}

        {/* Sub-view: Consignments */}
        {activeTab === 'consignments' && (
          <div>
            <Flex justify="space-between" align="center" style={{ marginBottom: 14 }}>
              <Title level={4} style={{ margin: 0 }}>Consignments (Supplier & Customer)</Title>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => message.info('Opening consignment agreement entry...')}>
                Add Consignment
              </Button>
            </Flex>
            <Table
              rowKey="id"
              dataSource={consignmentsList}
              columns={[
                { title: 'Date', dataIndex: 'date', key: 'date', width: 120 },
                { title: 'Reference No', dataIndex: 'reference', key: 'reference', width: 160, render: (t) => <strong style={{ color: '#2563eb' }}>{t}</strong> },
                { title: 'Party / Partner', dataIndex: 'party', key: 'party', width: 240 },
                { title: 'Agreement Type', dataIndex: 'type', key: 'type', width: 150, render: (t) => <Tag color={t === 'Consignment In' ? 'blue' : 'purple'}>{t}</Tag> },
                { title: 'Consigned Qty', dataIndex: 'total_qty', key: 'total_qty', width: 120, align: 'right' },
                { title: 'Sold / Reconciled', dataIndex: 'sold_qty', key: 'sold_qty', width: 130, align: 'right' },
                { title: 'Current Balance', dataIndex: 'balance_qty', key: 'balance_qty', width: 130, align: 'right', render: (b) => <strong style={{ color: '#2563eb' }}>{b}</strong> },
                { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: (s) => <Tag color="green">{s}</Tag> },
              ]}
              pagination={false}
            />
          </div>
        )}
      </Card>

      {/* MODAL 1: Add / Edit Product (Exact BPAS Tabs: Required, Details, Variants, Supplier, Promotion, Addon, Racks) */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarcodeOutlined style={{ color: '#2563eb', fontSize: 20 }} />
            <span style={{ fontSize: 17, fontWeight: 800 }}>
              {isEditingMode ? `Edit Product: ${currentEditRecord?.name}` : 'Add New Product'}
            </span>
          </div>
        }
        open={isProductModalOpen}
        onCancel={() => setIsProductModalOpen(false)}
        width={850}
        footer={[
          <Button key="cancel" onClick={() => setIsProductModalOpen(false)}>
            Cancel
          </Button>,
          <Button key="save" type="primary" onClick={handleSaveProduct} style={{ fontWeight: 800 }}>
            {isEditingMode ? 'Save Changes' : 'Create Product'}
          </Button>,
        ]}
      >
        <Tabs
          activeKey={productModalActiveTab}
          onChange={setProductModalActiveTab}
          items={[
            {
              key: 'required',
              label: 'Required Fields',
              children: (
                <Form form={productForm} layout="vertical">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="type" label="Product Type" rules={[{ required: true }]}>
                        <Select>
                          <Option value="standard">Standard</Option>
                          <Option value="combo">Combo</Option>
                          <Option value="digital">Digital</Option>
                          <Option value="service">Service</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="name" label="Product Name" rules={[{ required: true, message: 'Please enter product name' }]}>
                        <Input placeholder="e.g. Specialty Roasted Coffee" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="barcode" label="Barcode / Product Code" rules={[{ required: true }]}>
                        <Input
                          placeholder="e.g. 88581023"
                          suffix={
                            <Button
                              size="small"
                              type="link"
                              onClick={() => {
                                const newCode = `8858${Math.floor(1000 + Math.random() * 9000)}`;
                                productForm.setFieldsValue({ barcode: newCode });
                                message.success(`Generated: ${newCode}`);
                              }}
                            >
                              Generate
                            </Button>
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                        <Select placeholder="Select category">
                          {categoriesList.map((c) => (
                            <Option key={c.id || c.name} value={c.name || c.id}>
                              {c.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item name="unit" label="Product Unit" rules={[{ required: true }]}>
                        <Select placeholder="Select unit">
                          {unitsList.length > 0 ? (
                            unitsList.map((u) => (
                              <Option key={u.id || u.name} value={u.name || u.code}>
                                {u.name}
                              </Option>
                            ))
                          ) : (
                            <>
                              <Option value="Pcs">Pcs</Option>
                              <Option value="Box">Box</Option>
                              <Option value="Pack">Pack</Option>
                              <Option value="Kg">Kg</Option>
                              <Option value="Bottle">Bottle</Option>
                            </>
                          )}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="cost" label="Product Cost ($)" rules={[{ required: true }]}>
                        <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="price" label="Product Price ($)" rules={[{ required: true }]}>
                        <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="alert_quantity" label="Alert Quantity (Low stock threshold)">
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="rack" label="Rack Location">
                        <Input placeholder="e.g. A-01, SHELF-2" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="inStock" label="Live Availability Status" valuePropName="checked">
                    <Switch checkedChildren="Available (In Stock)" unCheckedChildren="Out of Stock" />
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'details',
              label: 'Details & Description',
              children: (
                <Form form={productForm} layout="vertical">
                  <Form.Item name="details" label="Product Description / Specification">
                    <Input.TextArea rows={4} placeholder="Enter full product description, ingredients, brewing guides, or warranty info..." />
                  </Form.Item>
                  <Form.Item label="Product Image">
                    <Input placeholder="Image URL (e.g. /assets/uploads/sample.png)" />
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'variants',
              label: 'Variants & Options',
              children: (
                <div>
                  <Paragraph type="secondary">
                    Configure SKU product variants like Size, Color, Volume, or Flavor attributes.
                  </Paragraph>
                  <Space style={{ marginBottom: 12 }}>
                    <Input placeholder="Variant attribute e.g. Size: Large" />
                    <Button type="dashed" icon={<PlusOutlined />}>Add Variant Option</Button>
                  </Space>
                  <Table
                    size="small"
                    dataSource={[
                      { id: 1, name: 'Option 1 - 250g Pack', price: '$5.00', qty: 30 },
                      { id: 2, name: 'Option 2 - 500g Pack', price: '$9.00', qty: 20 },
                    ]}
                    columns={[
                      { title: 'Variant Name', dataIndex: 'name', key: 'name' },
                      { title: 'Price', dataIndex: 'price', key: 'price' },
                      { title: 'Stock Quantity', dataIndex: 'qty', key: 'qty' },
                    ]}
                    pagination={false}
                  />
                </div>
              ),
            },
            {
              key: 'racks',
              label: 'Warehouse Racks',
              children: (
                <div>
                  <Paragraph type="secondary">
                    Set specific aisle and bin racks for each warehouse location.
                  </Paragraph>
                  {warehousesList.map((wh) => (
                    <Row key={wh.id} gutter={16} align="middle" style={{ marginBottom: 12 }}>
                      <Col span={10}>
                        <strong>{wh.name}</strong>
                      </Col>
                      <Col span={14}>
                        <Input placeholder={`Rack bin in ${wh.name} (e.g. RACK-B2)`} defaultValue="A-01" />
                      </Col>
                    </Row>
                  ))}
                </div>
              ),
            },
          ]}
        />
      </Modal>

      {/* MODAL 2: Product Detail Modal (BPAS modal_view.php) */}
      <Modal
        title={detailProduct ? `${detailProduct.name} (${detailProduct.code})` : 'Product Details'}
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={() => window.print()}>
            Print Details
          </Button>,
          <Button key="close" type="primary" onClick={() => setIsDetailModalOpen(false)}>
            Close
          </Button>,
        ]}
        width={720}
      >
        {detailProduct && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Row gutter={24} align="middle">
              <Col span={8}>
                <div style={{ width: '100%', height: 180, borderRadius: 10, overflow: 'hidden', border: `1px solid ${adminTheme.border}` }}>
                  <img
                    src={detailProduct.image || '/assets/uploads/no_image.png'}
                    alt={detailProduct.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/assets/uploads/no_image.png';
                    }}
                  />
                </div>
              </Col>
              <Col span={16}>
                <Title level={4} style={{ margin: 0, color: '#2563eb' }}>{detailProduct.name}</Title>
                <div style={{ fontSize: 13, color: adminTheme.subtext, marginTop: 4 }}>
                  Barcode / Code: <strong>{detailProduct.code}</strong>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <Tag color="blue">{detailProduct.type || 'Standard'}</Tag>
                  <Tag color="cyan">{detailProduct.category || 'General'}</Tag>
                  <Tag color={detailProduct.inStock ? 'green' : 'red'}>
                    {detailProduct.inStock ? 'In Stock' : 'Out of Stock'}
                  </Tag>
                </div>
                <div style={{ display: 'flex', gap: 24, marginTop: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, color: adminTheme.subtext }}>COST PRICE</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{formatCurrency(detailProduct.cost || detailProduct.price * 0.6)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: adminTheme.subtext }}>RETAIL SELLING PRICE</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#16a34a' }}>{formatCurrency(detailProduct.price)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: adminTheme.subtext }}>TOTAL QUANTITY</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#2563eb' }}>{detailProduct.stockCount ?? 45} {detailProduct.unit || 'Pcs'}</div>
                  </div>
                </div>
              </Col>
            </Row>

            <Divider style={{ margin: '8px 0' }} />

            <div>
              <Text strong>Warehouse Stock Breakdown:</Text>
              <Table
                size="small"
                style={{ marginTop: 8 }}
                pagination={false}
                dataSource={warehousesList.map((wh, idx) => ({
                  key: wh.id,
                  warehouse: wh.name,
                  rack: 'A-01',
                  quantity: idx === 0 ? Math.round((detailProduct.stockCount ?? 45) * 0.6) : idx === 1 ? Math.round((detailProduct.stockCount ?? 45) * 0.3) : Math.round((detailProduct.stockCount ?? 45) * 0.1),
                }))}
                columns={[
                  { title: 'Warehouse Location', dataIndex: 'warehouse', key: 'warehouse' },
                  { title: 'Rack', dataIndex: 'rack', key: 'rack', width: 120 },
                  { title: 'Available Quantity', dataIndex: 'quantity', key: 'quantity', width: 150, align: 'right', render: (q) => <strong>{q} {detailProduct.unit || 'Pcs'}</strong> },
                ]}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 3: Print Barcodes (BPAS print_barcodes.php) */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <PrinterOutlined style={{ color: '#0284c7', fontSize: 20 }} />
            <span style={{ fontSize: 17, fontWeight: 800 }}>Print Barcode Labels</span>
          </div>
        }
        open={isBarcodeModalOpen}
        onCancel={() => setIsBarcodeModalOpen(false)}
        width={780}
        footer={[
          <Button key="close" onClick={() => setIsBarcodeModalOpen(false)}>
            Cancel
          </Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => window.print()} style={{ fontWeight: 800 }}>
            Print Labels Now
          </Button>,
        ]}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Paper Size / Style:</label>
              <Select value={barcodePaperSize} onChange={setBarcodePaperSize} style={{ width: '100%' }}>
                <Option value="40_per_sheet">A4 Sheet (40 per sheet, 48.5mm x 25.4mm)</Option>
                <Option value="30_per_sheet">A4 Sheet (30 per sheet, 70mm x 29.7mm)</Option>
                <Option value="24_per_sheet">A4 Sheet (24 per sheet, 70mm x 37mm)</Option>
                <Option value="continuous_thermal">Continuous Thermal Roll (50mm x 30mm)</Option>
              </Select>
            </Col>
            <Col span={12}>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Print Options:</label>
              <Space wrap>
                <Tag color="blue">Show Product Name</Tag>
                <Tag color="blue">Show Price</Tag>
                <Tag color="blue">Show Currencies (USD)</Tag>
              </Space>
            </Col>
          </Row>

          <Divider style={{ margin: '8px 0' }} />

          <div>
            <Text strong>Selected Items to Print ({barcodeItemsToPrint.length}):</Text>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 12,
                marginTop: 12,
                maxHeight: 340,
                overflowY: 'auto',
                padding: 10,
                background: '#f8fafc',
                borderRadius: 8,
                border: `1px solid ${adminTheme.border}`,
              }}
            >
              {barcodeItemsToPrint.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: '#fff',
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: '1px dashed #cbd5e1',
                    textAlign: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#16a34a', margin: '4px 0' }}>
                    {formatCurrency(item.price)}
                  </div>
                  {/* Visual barcode mockup bars */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, height: 32, margin: '6px 0' }}>
                    {[2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 2, 1, 3, 2, 1, 4, 2].map((w, idx) => (
                      <div key={idx} style={{ width: w, height: '100%', background: '#0f172a' }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#64748b' }}>
                    {item.code || `8858${item.id}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL 4: Quantity Adjustment (BPAS add_adjustment.php) */}
      <Modal
        title="Add Quantity Adjustment"
        open={isAdjustmentModalOpen}
        onCancel={() => setIsAdjustmentModalOpen(false)}
        onOk={() => {
          message.success('Stock quantity adjustment recorded');
          setIsAdjustmentModalOpen(false);
        }}
        width={540}
      >
        <Form form={adjustmentForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date" label="Date" rules={[{ required: true }]}>
                <Input defaultValue="2026-10-16" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="reference_no" label="Reference No" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="warehouse_id" label="Warehouse" rules={[{ required: true }]}>
            <Select>
              {warehousesList.map((wh) => (
                <Option key={wh.id} value={wh.id}>{wh.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="Adjustment Type">
                <Select>
                  <Option value="addition">Addition (+)</Option>
                  <Option value="subtraction">Subtraction (-)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="reason" label="Reason">
                <Select>
                  <Option value="inventory_count">Inventory Cycle Count</Option>
                  <Option value="damaged">Damaged in Handling</Option>
                  <Option value="expired">Expired Goods</Option>
                  <Option value="loss">Loss / Missing</Option>
                  <Option value="found">Found Surplus</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="quantity" label="Quantity to Adjust">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="note" label="Adjustment Note">
            <Input.TextArea rows={2} placeholder="Explain reason for discrepancy..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL 5: Stock Transfer (BPAS transfers/add.php) */}
      <Modal
        title="Create Warehouse Stock Transfer"
        open={isTransferModalOpen}
        onCancel={() => setIsTransferModalOpen(false)}
        onOk={() => {
          message.success('Transfer voucher created and items dispatched');
          setIsTransferModalOpen(false);
        }}
        width={580}
      >
        <Form form={transferForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date" label="Date" rules={[{ required: true }]}>
                <Input defaultValue="2026-10-16" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="reference_no" label="Transfer Reference No">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="from_warehouse_id" label="From Warehouse (Source)">
                <Select>
                  {warehousesList.map((wh) => (
                    <Option key={wh.id} value={wh.id}>{wh.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="to_warehouse_id" label="To Warehouse (Destination)">
                <Select>
                  {warehousesList.map((wh) => (
                    <Option key={wh.id} value={wh.id}>{wh.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="shipping" label="Shipping Charge ($)">
                <InputNumber min={0} step={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Transfer Status">
                <Select>
                  <Option value="pending">Pending</Option>
                  <Option value="in_transit">In Transit</Option>
                  <Option value="completed">Completed</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Transfer Note">
            <Input.TextArea rows={2} placeholder="Transit details, vehicle license plate, driver..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL 6: Bulk Price Update (BPAS update_price.php) */}
      <Modal
        title="Update Prices & Badges in Bulk"
        open={isBulkPriceModalOpen}
        onCancel={() => setIsBulkPriceModalOpen(false)}
        onOk={() => {
          const factor = bulkPriceAction === 'percent_discount' ? (100 - bulkPriceValue) / 100 : (100 + bulkPriceValue) / 100;
          const updated = productsList.map((p) => ({
            ...p,
            price: Math.round(p.price * factor * 100) / 100,
            badge: bulkPriceAction === 'percent_discount' ? '⚡ Sale' : p.badge,
          }));
          setProductsList(updated);
          saveLiveProducts(updated);
          message.success(`Updated pricing for all products by ${bulkPriceValue}%`);
          setIsBulkPriceModalOpen(false);
        }}
        width={480}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Paragraph type="secondary">
            Apply bulk percentage adjustments to retail prices across all or selected items.
          </Paragraph>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Adjustment Mode:</label>
            <Radio.Group value={bulkPriceAction} onChange={(e) => setBulkPriceAction(e.target.value)}>
              <Radio value="percent_discount">Apply Discount (%)</Radio>
              <Radio value="percent_increase">Increase Price (%)</Radio>
            </Radio.Group>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Percentage Value (%):</label>
            <InputNumber min={1} max={90} value={bulkPriceValue} onChange={setBulkPriceValue} style={{ width: '100%' }} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
