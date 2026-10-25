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
  Alert,
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
  TagsOutlined,
  HistoryOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatCurrency } from '../../utils/uiTheme';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { useTranslation } from '../../contexts/LanguageContext';
import BpasAddProductPage from './BpasAddProductPage';
import BpasImportExcelPage from './BpasImportExcelPage';
import BpasPrintBarcodesPage from './BpasPrintBarcodesPage';
import BpasUsingStockWorkspace from './BpasUsingStockWorkspace';
import BpasQuantityAdjustmentsWorkspace from './BpasQuantityAdjustmentsWorkspace';
import BpasStockCountsWorkspace from './BpasStockCountsWorkspace';
import BpasTransfersWorkspace from './BpasTransfersWorkspace';

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

const getAuthHeaders = () => {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token') || localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function BpasInventoryWorkspace() {
  const adminTheme = useAdminTheme();
  const { t } = useTranslation();
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

  // Active Tab: products | attributes | warehouse-stock | movements | stock-counts | quantity-adjustments | cost-adjustments | using-stock | transfers | consignments
  const initialTab =
    searchParams.get('tab') ||
    searchParams.get('menu') ||
    (location.pathname.includes('using_stock') || location.pathname.includes('using-stock')
      ? 'using-stock'
      : location.pathname.includes('quantity_adjustments') || location.pathname.includes('quantity-adjustments')
      ? 'quantity-adjustments'
      : location.pathname.includes('stock_counts') || location.pathname.includes('stock-counts')
      ? 'stock-counts'
      : 'products');
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
      if (location.pathname.includes('using_stock') || location.pathname.includes('using-stock')) {
        setActiveTab('using-stock');
      } else if (location.pathname.includes('quantity_adjustments') || location.pathname.includes('quantity-adjustments')) {
        setActiveTab('quantity-adjustments');
      } else if (location.pathname.includes('stock_counts') || location.pathname.includes('stock-counts')) {
        setActiveTab('stock-counts');
      } else if (currentTab && currentTab !== 'inventory') {
        setActiveTab(currentTab);
      }
    }
  }, [location.pathname, location.search]);

  // Main Data States
  const [productsList, setProductsList] = useState(() => getLiveProducts());
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filters
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterWarehouse, setFilterWarehouse] = useState('all');
  const [filterStockStatus, setFilterStockStatus] = useState('all');

  // Metadata
  const [warehousesList, setWarehousesList] = useState([
    { id: 1, name: 'Warehouse 1 (Main Storage)', code: 'WH01' },
    { id: 8, name: 'Warehouse 2 (Printing / Transit)', code: 'WH08' },
  ]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [unitsList, setUnitsList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [billersList, setBillersList] = useState([]);

  // Modals & Forms
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);

  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [barcodePaperSize, setBarcodePaperSize] = useState('40_per_sheet');
  const [barcodeItemsToPrint, setBarcodeItemsToPrint] = useState([]);

  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);
  const [bulkPriceAction, setBulkPriceAction] = useState('percent_discount');
  const [bulkPriceValue, setBulkPriceValue] = useState(10);

  // Operational targets
  const [operationTargetProduct, setOperationTargetProduct] = useState(null);
  const [operationTargetVariant, setOperationTargetVariant] = useState(null);

  // Forms
  const [receiveForm] = Form.useForm();
  const [issueForm] = Form.useForm();
  const [adjustmentForm] = Form.useForm();
  const [transferForm] = Form.useForm();

  // Tab: Attributes & Values Data
  const [attributesList, setAttributesList] = useState([]);
  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [attributeValuesList, setAttributeValuesList] = useState([]);
  const [isAddAttrModalOpen, setIsAddAttrModalOpen] = useState(false);
  const [isAddAttrValModalOpen, setIsAddAttrValModalOpen] = useState(false);
  const [attrForm] = Form.useForm();
  const [attrValForm] = Form.useForm();

  // Tab: Warehouse Stock Overview Data
  const [warehouseStockData, setWarehouseStockData] = useState([]);
  const [isWarehouseStockLoading, setIsWarehouseStockLoading] = useState(false);

  // Tab: Stock Movements Data
  const [movementsData, setMovementsData] = useState([]);
  const [isMovementsLoading, setIsMovementsLoading] = useState(false);

  // Fetch Metadata
  const fetchMetadata = async () => {
    try {
      const [whRes, catRes, unitsRes, brandsRes, billersRes] = await Promise.allSettled([
        axios.get('/api/warehouses', { headers: getAuthHeaders() }),
        axios.get('/api/categories', { headers: getAuthHeaders() }),
        axios.get('/api/units', { headers: getAuthHeaders() }),
        axios.get('/api/brands', { headers: getAuthHeaders() }),
        axios.get('/api/billers', { headers: getAuthHeaders() }),
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

  // Fetch Live Products from backend
  const fetchLiveProducts = async () => {
    setIsSyncing(true);
    try {
      const params = new URLSearchParams();
      if (filterSearch) params.append('search', filterSearch);
      if (filterCategory && filterCategory !== 'all') params.append('category_id', filterCategory);
      if (filterWarehouse && filterWarehouse !== 'all') params.append('warehouse_id', filterWarehouse);
      if (filterStockStatus && filterStockStatus !== 'all') params.append('stock_status', filterStockStatus);
      params.append('limit', '500');

      let prods = [];
      try {
        const res = await axios.get(`/api/admin/products?${params.toString()}`, { headers: getAuthHeaders() });
        if ((res.data?.status || res.data?.success) && Array.isArray(res.data?.data)) {
          prods = res.data.data;
        }
      } catch (_) {}

      if (!prods.length && !filterSearch && filterCategory === 'all') {
        const pubRes = await axios.get('/api/products?limit=500', { headers: getAuthHeaders() });
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

  // Fetch Attributes & Values
  const fetchAttributes = async () => {
    try {
      const res = await axios.get('/api/admin/attributes', { headers: getAuthHeaders() });
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setAttributesList(res.data.data);
        if (!selectedAttribute && res.data.data.length > 0) {
          setSelectedAttribute(res.data.data[0]);
          fetchAttributeValues(res.data.data[0].id);
        }
      }
    } catch (err) {
      console.warn('Fetch attributes note:', err.message);
    }
  };

  const fetchAttributeValues = async (attributeId) => {
    if (!attributeId) return;
    try {
      const res = await axios.get(`/api/admin/attributes/${attributeId}/values`, { headers: getAuthHeaders() });
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setAttributeValuesList(res.data.data);
      }
    } catch (err) {
      console.warn('Fetch attribute values note:', err.message);
    }
  };

  // Fetch Warehouse Stock Overview
  const fetchWarehouseStock = async () => {
    setIsWarehouseStockLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterWarehouse && filterWarehouse !== 'all') params.append('warehouse_id', filterWarehouse);
      const res = await axios.get(`/api/admin/inventory/warehouse-stock?${params.toString()}`, { headers: getAuthHeaders() });
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setWarehouseStockData(res.data.data);
      }
    } catch (err) {
      console.warn('Warehouse stock fetch note:', err.message);
    } finally {
      setIsWarehouseStockLoading(false);
    }
  };

  // Fetch Movements Ledger
  const fetchMovements = async () => {
    setIsMovementsLoading(true);
    try {
      const res = await axios.get('/api/admin/inventory/movements?limit=100', { headers: getAuthHeaders() });
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setMovementsData(res.data.data);
      }
    } catch (err) {
      console.warn('Movements fetch note:', err.message);
    } finally {
      setIsMovementsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
    fetchLiveProducts();
  }, []);

  useEffect(() => {
    if (activeTab === 'attributes') {
      fetchAttributes();
    } else if (activeTab === 'warehouse-stock') {
      fetchWarehouseStock();
    } else if (activeTab === 'movements') {
      fetchMovements();
    }
  }, [activeTab, filterWarehouse]);

  // Client-side Filtered Products fallback
  const filteredProducts = useMemo(() => {
    const list = Array.isArray(productsList) ? productsList : [];
    return list.filter((item) => {
      const matchSearch =
        !filterSearch ||
        (item.name && item.name.toLowerCase().includes(filterSearch.toLowerCase())) ||
        (item.second_name && item.second_name.toLowerCase().includes(filterSearch.toLowerCase())) ||
        (item.code && item.code.toLowerCase().includes(filterSearch.toLowerCase())) ||
        (item.barcode && item.barcode.toLowerCase().includes(filterSearch.toLowerCase())) ||
        (item.sku && item.sku.toLowerCase().includes(filterSearch.toLowerCase())) ||
        (item.brand_name && item.brand_name.toLowerCase().includes(filterSearch.toLowerCase())) ||
        (item.brand && String(item.brand).toLowerCase().includes(filterSearch.toLowerCase()));

      const matchCategory =
        filterCategory === 'all' ||
        item.category === filterCategory ||
        item.category_name === filterCategory ||
        String(item.category_id) === String(filterCategory);

      const matchBrand =
        filterBrand === 'all' ||
        String(item.brand_id) === String(filterBrand) ||
        String(item.brand) === String(filterBrand) ||
        (item.brand_name && item.brand_name.toLowerCase() === String(filterBrand).toLowerCase());

      const matchType =
        filterType === 'all' ||
        (item.type && item.type.toLowerCase() === filterType.toLowerCase()) ||
        (filterType === 'active' && item.status !== 0) ||
        (filterType === 'inactive' && item.status === 0);

      const qty = item.quantity ?? item.stockCount ?? 0;
      const alertQty = item.alert_quantity ?? item.alertQuantity ?? 10;
      const matchStockStatus =
        filterStockStatus === 'all' ||
        (filterStockStatus === 'in_stock' && qty > alertQty) ||
        (filterStockStatus === 'low_stock' && qty > 0 && qty <= alertQty) ||
        (filterStockStatus === 'out_of_stock' && qty <= 0);

      const matchWarehouse =
        filterWarehouse === 'all' ||
        (Array.isArray(item.warehouse_stock) && item.warehouse_stock.some((w) => String(w.warehouse_id) === String(filterWarehouse)));

      return matchSearch && matchCategory && matchBrand && matchType && matchStockStatus && matchWarehouse;
    });
  }, [productsList, filterSearch, filterCategory, filterBrand, filterType, filterStockStatus, filterWarehouse]);

  // Catalog Metrics
  const metrics = useMemo(() => {
    const list = Array.isArray(productsList) ? productsList : [];
    const total = list.length;
    const inStock = list.filter((p) => (p.quantity ?? p.stockCount ?? 0) > 0).length;
    const lowStock = list.filter((p) => {
      const q = p.quantity ?? p.stockCount ?? 0;
      const a = p.alert_quantity ?? p.alertQuantity ?? 10;
      return q <= a;
    }).length;
    const totalValuation = list.reduce((acc, p) => acc + (Number(p.price) || 0) * (p.quantity ?? p.stockCount ?? 40), 0);

    return {
      total,
      inStock,
      lowStock,
      totalValuation,
    };
  }, [productsList]);

  // Navigation handlers
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

  const handleDuplicateProduct = async (id) => {
    try {
      const res = await axios.post(`/api/admin/products/${id}/duplicate`, {}, { headers: getAuthHeaders() });
      if (res.data?.success || res.data?.status) {
        message.success(res.data.message || 'Product duplicated successfully');
        fetchLiveProducts();
      }
    } catch (err) {
      message.error('Failed to duplicate product: ' + (err.response?.data?.message || err.message));
    }
  };

  // Safe Deletion Handler (checks backend reference & archival protection)
  const handleDeleteProduct = async (id) => {
    try {
      const res = await axios.delete(`/api/admin/products/${id}`, { headers: getAuthHeaders() });
      if (res.data?.archived) {
        message.info(res.data.message || 'Product referenced by transactions has been safely archived (marked inactive).');
      } else {
        message.success(res.data?.message || 'Product deleted successfully');
      }
      fetchLiveProducts();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedRowKeys.length) {
      message.warning('Please select at least one product.');
      return;
    }
    let successCount = 0;
    let archivedCount = 0;
    for (const id of selectedRowKeys) {
      try {
        const res = await axios.delete(`/api/admin/products/${id}`, { headers: getAuthHeaders() });
        if (res.data?.archived) archivedCount++;
        else successCount++;
      } catch (_) {}
    }
    setSelectedRowKeys([]);
    message.success(`Processed deletion: ${successCount} deleted, ${archivedCount} safely archived.`);
    fetchLiveProducts();
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

  // Stock Operation Modal Openers
  const handleOpenReceive = (product = null, variant = null) => {
    setOperationTargetProduct(product);
    setOperationTargetVariant(variant);
    receiveForm.resetFields();
    receiveForm.setFieldsValue({
      warehouse_id: warehousesList[0]?.id || 1,
      product_id: product?.id,
      option_id: variant?.id || null,
      quantity: 10,
      unit_cost: variant?.cost ?? product?.cost ?? 1.5,
      reference_no: `RCV-${Date.now().toString().slice(-6)}`,
      note: 'Stock batch receipt into warehouse',
    });
    setIsReceiveModalOpen(true);
  };

  const handleOpenIssue = (product = null, variant = null) => {
    setOperationTargetProduct(product);
    setOperationTargetVariant(variant);
    issueForm.resetFields();
    issueForm.setFieldsValue({
      warehouse_id: warehousesList[0]?.id || 1,
      product_id: product?.id,
      option_id: variant?.id || null,
      quantity: 5,
      reference_no: `ISS-${Date.now().toString().slice(-6)}`,
      note: 'Dispatched for operational delivery',
    });
    setIsIssueModalOpen(true);
  };

  const handleOpenAdjustment = (product = null, variant = null) => {
    setOperationTargetProduct(product);
    setOperationTargetVariant(variant);
    adjustmentForm.resetFields();
    adjustmentForm.setFieldsValue({
      date: new Date().toISOString().slice(0, 10),
      reference_no: `ADJ-${Date.now().toString().slice(-6)}`,
      warehouse_id: warehousesList[0]?.id || 1,
      type: 'addition',
      reason: 'inventory_count',
      product_id: product?.id,
      option_id: variant?.id || null,
      quantity: 5,
      note: 'Cycle count physical adjustment',
    });
    setIsAdjustmentModalOpen(true);
  };

  const handleOpenTransfer = (product = null, variant = null) => {
    setOperationTargetProduct(product);
    setOperationTargetVariant(variant);
    transferForm.resetFields();
    transferForm.setFieldsValue({
      date: new Date().toISOString().slice(0, 10),
      reference_no: `TR-${Date.now().toString().slice(-6)}`,
      from_warehouse_id: warehousesList[0]?.id || 1,
      to_warehouse_id: warehousesList[1]?.id || warehousesList[0]?.id || 1,
      product_id: product?.id,
      option_id: variant?.id || null,
      quantity: 10,
      shipping: 5.0,
      status: 'completed',
      note: 'Inter-warehouse inventory relocation',
    });
    setIsTransferModalOpen(true);
  };

  // Stock Operation Submissions
  const handleSubmitReceive = async () => {
    try {
      const vals = await receiveForm.validateFields();
      const res = await axios.post('/api/admin/inventory/receive', vals, { headers: getAuthHeaders() });
      if (res.data?.success) {
        message.success(res.data.message || 'Stock successfully received into warehouse');
        setIsReceiveModalOpen(false);
        fetchLiveProducts();
        if (activeTab === 'warehouse-stock') fetchWarehouseStock();
        if (activeTab === 'movements') fetchMovements();
      } else {
        message.error(res.data?.message || 'Failed to receive stock');
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Validation error or server error');
    }
  };

  const handleSubmitIssue = async () => {
    try {
      const vals = await issueForm.validateFields();
      const res = await axios.post('/api/admin/inventory/issue', vals, { headers: getAuthHeaders() });
      if (res.data?.success) {
        message.success(res.data.message || 'Stock successfully issued');
        setIsIssueModalOpen(false);
        fetchLiveProducts();
        if (activeTab === 'warehouse-stock') fetchWarehouseStock();
        if (activeTab === 'movements') fetchMovements();
      } else {
        message.error(res.data?.message || 'Failed to issue stock');
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Stock balance insufficient or request invalid');
    }
  };

  const handleSubmitAdjustment = async () => {
    try {
      const vals = await adjustmentForm.validateFields();
      const payload = {
        warehouse_id: vals.warehouse_id,
        type: vals.type,
        reason: vals.reason,
        reference_no: vals.reference_no,
        note: vals.note,
        items: [
          {
            product_id: vals.product_id,
            option_id: vals.option_id || null,
            quantity: vals.quantity,
          },
        ],
      };
      const res = await axios.post('/api/admin/inventory/adjust', payload, { headers: getAuthHeaders() });
      if (res.data?.success) {
        message.success(res.data.message || 'Stock quantity adjustment recorded successfully');
        setIsAdjustmentModalOpen(false);
        fetchLiveProducts();
        if (activeTab === 'warehouse-stock') fetchWarehouseStock();
        if (activeTab === 'movements') fetchMovements();
      } else {
        message.error(res.data?.message || 'Failed to record adjustment');
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Validation error or server error');
    }
  };

  const handleSubmitTransfer = async () => {
    try {
      const vals = await transferForm.validateFields();
      const payload = {
        from_warehouse_id: vals.from_warehouse_id,
        to_warehouse_id: vals.to_warehouse_id,
        shipping_charge: vals.shipping || 0,
        status: vals.status || 'completed',
        reference_no: vals.reference_no,
        note: vals.note,
        items: [
          {
            product_id: vals.product_id,
            option_id: vals.option_id || null,
            quantity: vals.quantity,
          },
        ],
      };
      const res = await axios.post('/api/admin/inventory/transfer', payload, { headers: getAuthHeaders() });
      if (res.data?.success) {
        message.success(res.data.message || 'Warehouse stock transfer executed successfully');
        setIsTransferModalOpen(false);
        fetchLiveProducts();
        if (activeTab === 'warehouse-stock') fetchWarehouseStock();
        if (activeTab === 'movements') fetchMovements();
      } else {
        message.error(res.data?.message || 'Failed to transfer stock');
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Source warehouse has insufficient balance or request failed');
    }
  };

  // Export to CSV
  const handleExportExcel = () => {
    const targetItems = selectedRowKeys.length
      ? productsList.filter((p) => selectedRowKeys.includes(p.id))
      : filteredProducts;

    const headers = ['ID', 'Code', 'Name', 'Type', 'Category', 'Unit', 'Cost', 'Price', 'Stock Quantity', 'Variants Count', 'Alert Qty'];
    const rows = targetItems.map((p) => [
      p.id,
      `"${p.code || ''}"`,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      p.type || 'standard',
      `"${p.category_name || p.category || 'General'}"`,
      p.unit_name || p.unit || 'Pcs',
      p.cost || 0,
      p.price || 0,
      p.quantity ?? p.stockCount ?? 0,
      p.variant_count ?? (p.variants ? p.variants.length : 0),
      p.alert_quantity ?? p.alertQuantity ?? 10,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aura_products_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success(`Exported ${targetItems.length} products to Excel (CSV)`);
  };

  // Expandable Row: Displays Child Product Variants
  const expandedRowRender = (parentProduct) => {
    const variants = parentProduct.variants || [];
    if (!variants.length) {
      return (
        <div style={{ padding: '8px 16px', color: adminTheme.subtext, fontSize: 12 }}>
          <em>No product variants configured. This is a single SKU product.</em>
        </div>
      );
    }

    const variantColumns = [
      {
        title: 'Variant Name',
        dataIndex: 'name',
        key: 'name',
        render: (name) => <strong style={{ color: '#1e293b' }}>{name}</strong>,
      },
      {
        title: 'SKU',
        dataIndex: 'sku',
        key: 'sku',
        render: (sku) => (
          <Tag color="geekblue" style={{ fontFamily: 'monospace', fontWeight: 700 }}>
            {sku || 'N/A'}
          </Tag>
        ),
      },
      {
        title: 'Barcode',
        dataIndex: 'barcode',
        key: 'barcode',
        render: (barcode) => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{barcode || '—'}</span>,
      },
      {
        title: 'Attributes',
        key: 'attributes',
        render: (_, record) => {
          let attrs = record.attributes;
          if (typeof attrs === 'string') {
            try {
              attrs = JSON.parse(attrs);
            } catch (_) {
              attrs = {};
            }
          }
          if (!attrs || typeof attrs !== 'object' || Object.keys(attrs).length === 0) {
            return <span style={{ color: '#94a3b8' }}>—</span>;
          }
          return (
            <Space size={4} wrap>
              {Object.entries(attrs).map(([k, val]) => (
                <Tag key={k} color="cyan" style={{ fontSize: 11, borderRadius: 4 }}>
                  <strong>{k}:</strong> {String(val)}
                </Tag>
              ))}
            </Space>
          );
        },
      },
      {
        title: 'Cost',
        dataIndex: 'cost',
        key: 'cost',
        align: 'right',
        render: (c) => <span style={{ color: adminTheme.subtext, fontSize: 12 }}>{formatCurrency(c || 0)}</span>,
      },
      {
        title: 'Selling Price',
        dataIndex: 'price',
        key: 'price',
        align: 'right',
        render: (p) => <strong style={{ color: '#16a34a', fontSize: 13 }}>{formatCurrency(p || 0)}</strong>,
      },
      {
        title: 'Variant Stock',
        dataIndex: 'quantity',
        key: 'quantity',
        align: 'right',
        render: (qty) => {
          const count = Number(qty) || 0;
          const isOut = count <= 0;
          return (
            <Tag color={isOut ? 'red' : count <= 5 ? 'orange' : 'green'} style={{ fontWeight: 800, borderRadius: 4 }}>
              {count} {parentProduct.unit_name || parentProduct.unit || 'Pcs'}
            </Tag>
          );
        },
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        align: 'center',
        render: (status) => (
          <Tag color={status !== 0 ? 'success' : 'default'} style={{ borderRadius: 4 }}>
            {status !== 0 ? 'Active' : 'Inactive'}
          </Tag>
        ),
      },
      {
        title: 'Stock Operations',
        key: 'quick_actions',
        align: 'center',
        render: (_, variant) => (
          <Space size={4}>
            <Tooltip title="Receive stock for this variant">
              <Button
                size="small"
                type="link"
                icon={<ArrowDownOutlined style={{ color: '#16a34a' }} />}
                onClick={() => handleOpenReceive(parentProduct, variant)}
              >
                Receive
              </Button>
            </Tooltip>
            <Tooltip title="Adjust stock for this variant">
              <Button
                size="small"
                type="link"
                icon={<ToolOutlined style={{ color: '#ea580c' }} />}
                onClick={() => handleOpenAdjustment(parentProduct, variant)}
              >
                Adjust
              </Button>
            </Tooltip>
          </Space>
        ),
      },
    ];

    return (
      <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', margin: '6px 0' }}>
        <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
          <Text strong style={{ color: '#1e293b', fontSize: 12 }}>
            <TagsOutlined style={{ color: '#2563eb', marginRight: 6 }} />
            Configured Product Variants ({variants.length})
          </Text>
          <Space size={6}>
            <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => handleEditProduct(parentProduct)}>
              Manage Variants in Editor
            </Button>
          </Space>
        </Flex>
        <Table
          rowKey="id"
          columns={variantColumns}
          dataSource={variants}
          pagination={false}
          size="small"
          bordered
        />
      </div>
    );
  };

  // Main Products Table Columns
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
      title: t('code', 'Code / SKU'),
      dataIndex: 'code',
      key: 'code',
      width: 130,
      sorter: (a, b) => (a.code || '').localeCompare(b.code || ''),
      render: (code, record) => (
        <div>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
            {code || 'N/A'}
          </span>
          {record.barcode && record.barcode !== code && (
            <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
              BC: {record.barcode}
            </div>
          )}
        </div>
      ),
    },
    {
      title: t('name', 'Product Name'),
      dataIndex: 'name',
      key: 'name',
      width: 250,
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
      render: (name, record) => {
        const variantCount = record.variant_count ?? (record.variants ? record.variants.length : 0);
        return (
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
            {record.second_name && (
              <div style={{ fontSize: 11, color: '#64748b' }}>{record.second_name}</div>
            )}
            <div style={{ marginTop: 2, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <Tag color="blue" style={{ fontSize: 10, borderRadius: 4, padding: '0 4px', textTransform: 'capitalize' }}>
                {record.type || 'Standard'}
              </Tag>
              {variantCount > 0 ? (
                <Tag color="purple" style={{ fontSize: 10, borderRadius: 4, padding: '0 4px' }}>
                  {variantCount} Variants
                </Tag>
              ) : (
                <Tag color="default" style={{ fontSize: 10, borderRadius: 4, padding: '0 4px' }}>
                  Single SKU
                </Tag>
              )}
              {record.badge && (
                <Tag color="volcano" style={{ fontSize: 10, borderRadius: 4, padding: '0 4px' }}>
                  {record.badge}
                </Tag>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: t('category', 'Category'),
      dataIndex: 'category_name',
      key: 'category_name',
      width: 130,
      render: (cat, record) => <span style={{ fontWeight: 600 }}>{cat || record.category || 'General'}</span>,
    },
    {
      title: 'Brand',
      dataIndex: 'brand_name',
      key: 'brand_name',
      width: 110,
      render: (brand, record) => <span style={{ color: adminTheme.subtext, fontWeight: 600 }}>{brand || record.brand || '—'}</span>,
    },
    {
      title: t('unit', 'Unit'),
      dataIndex: 'unit_name',
      key: 'unit_name',
      width: 80,
      align: 'center',
      render: (unit, record) => <Tag style={{ borderRadius: 4 }}>{unit || record.unit || 'Pcs'}</Tag>,
    },
    {
      title: t('cost', 'Cost'),
      dataIndex: 'cost',
      key: 'cost',
      width: 100,
      align: 'right',
      sorter: (a, b) => (Number(a.cost) || 0) - (Number(b.cost) || 0),
      render: (cost, record) => (
        <span style={{ color: adminTheme.subtext, fontSize: 12 }}>
          {formatCurrency(cost || record.price * 0.6)}
        </span>
      ),
    },
    {
      title: t('price', 'Price'),
      dataIndex: 'price',
      key: 'price',
      width: 120,
      align: 'right',
      sorter: (a, b) => (Number(a.price) || 0) - (Number(b.price) || 0),
      render: (price, record) => {
        const isPromo = Boolean(record.promotion && record.promo_price);
        return (
          <div style={{ textAlign: 'right' }}>
            {isPromo ? (
              <div>
                <span style={{ fontWeight: 800, color: '#d97706', fontSize: 13.5 }}>
                  {formatCurrency(record.promo_price)}
                </span>
                <div style={{ fontSize: 10, color: '#94a3b8', textDecoration: 'line-through' }}>
                  {formatCurrency(price || 0)}
                </div>
              </div>
            ) : (
              <span style={{ fontWeight: 800, color: '#16a34a', fontSize: 13.5 }}>
                {formatCurrency(price || 0)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: t('quantity', 'Total Stock'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      align: 'right',
      sorter: (a, b) => (a.quantity ?? a.stockCount ?? 0) - (b.quantity ?? b.stockCount ?? 0),
      render: (qty, record) => {
        const count = Number(qty ?? record.stockCount ?? 0);
        const alertQty = Number(record.alert_quantity ?? record.alertQuantity ?? 10);
        const isOut = count <= 0;
        const isLow = count > 0 && count <= alertQty;

        return (
          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                fontWeight: 800,
                fontSize: 13,
                color: isOut ? '#dc2626' : isLow ? '#ea580c' : '#16a34a',
                padding: '2px 6px',
                borderRadius: 4,
                background: isOut ? '#fee2e2' : isLow ? '#ffedd5' : 'transparent',
              }}
            >
              {count}
            </span>
            {isOut ? (
              <div style={{ fontSize: 10, color: '#dc2626', fontWeight: 700, marginTop: 2 }}>
                Out of Stock
              </div>
            ) : isLow ? (
              <div style={{ fontSize: 10, color: '#ea580c', fontWeight: 700, marginTop: 2 }}>
                ⚠️ Low Stock
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      title: 'Warehouse Distribution',
      key: 'warehouse_breakdown',
      width: 170,
      render: (_, record) => {
        const breakdown = record.warehouse_stock;
        if (Array.isArray(breakdown) && breakdown.length > 0) {
          return (
            <div style={{ fontSize: 11, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {breakdown.map((w) => (
                <div key={w.warehouse_id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>{w.warehouse_name || `WH ${w.warehouse_id}`}:</span>
                  <strong style={{ color: '#0284c7' }}>{w.quantity}</strong>
                </div>
              ))}
            </div>
          );
        }
        return <span style={{ color: '#94a3b8', fontSize: 11 }}>Aggregated Stock</span>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      align: 'center',
      render: (status) => (
        <Tag color={status !== 0 ? 'success' : 'error'} style={{ borderRadius: 4 }}>
          {status !== 0 ? 'Active' : 'Archived'}
        </Tag>
      ),
    },
    {
      title: t('actions', 'Actions'),
      key: 'actions',
      width: 100,
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
            label: 'Edit Product & Variants',
            onClick: () => handleEditProduct(record),
          },
          {
            key: 'duplicate',
            icon: <CopyOutlined style={{ color: '#d97706' }} />,
            label: 'Duplicate Product',
            onClick: () => handleDuplicateProduct(record.id),
          },
          {
            key: 'receive',
            icon: <ArrowDownOutlined style={{ color: '#16a34a' }} />,
            label: 'Receive Stock',
            onClick: () => handleOpenReceive(record),
          },
          {
            key: 'issue',
            icon: <ArrowUpOutlined style={{ color: '#dc2626' }} />,
            label: 'Issue Stock',
            onClick: () => handleOpenIssue(record),
          },
          {
            key: 'adjust',
            icon: <SettingOutlined style={{ color: '#f59e0b' }} />,
            label: 'Stock Adjustment',
            onClick: () => handleOpenAdjustment(record),
          },
          {
            key: 'transfer',
            icon: <SwapOutlined style={{ color: '#7c3aed' }} />,
            label: 'Transfer Stock',
            onClick: () => handleOpenTransfer(record),
          },
          {
            key: 'barcode',
            icon: <BarcodeOutlined style={{ color: '#059669' }} />,
            label: 'Print Barcode Label',
            onClick: () => handleOpenBarcodePrint([record]),
          },
          {
            type: 'divider',
          },
          {
            key: 'delete',
            icon: <DeleteOutlined style={{ color: '#dc2626' }} />,
            danger: true,
            label: 'Delete / Archive Product',
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

  // Actions menu for the top-right Tasks icon
  const taskMenuItems = [
    {
      key: 'add',
      icon: <PlusOutlined style={{ color: '#16a34a' }} />,
      label: t('add_product', 'Add Product with Variants'),
      onClick: handleOpenAddProduct,
    },
    {
      key: 'import_excel',
      icon: <UploadOutlined style={{ color: '#059669' }} />,
      label: t('import_products', 'Import Products (Excel/CSV)'),
      onClick: () => setPageMode('import'),
    },
    {
      key: 'receive_stock',
      icon: <ArrowDownOutlined style={{ color: '#16a34a' }} />,
      label: 'Receive Stock Voucher',
      onClick: () => handleOpenReceive(),
    },
    {
      key: 'transfer_stock',
      icon: <SwapOutlined style={{ color: '#7c3aed' }} />,
      label: 'Transfer Between Warehouses',
      onClick: () => handleOpenTransfer(),
    },
    {
      key: 'adjust_stock',
      icon: <ToolOutlined style={{ color: '#f59e0b' }} />,
      label: 'Stock Quantity Adjustment',
      onClick: () => handleOpenAdjustment(),
    },
    {
      key: 'update_price',
      icon: <FileExcelOutlined style={{ color: '#2563eb' }} />,
      label: t('update_price_bulk', 'Update Price (Bulk)'),
      onClick: () => setIsBulkPriceModalOpen(true),
    },
    {
      key: 'print_barcodes',
      icon: <PrinterOutlined style={{ color: '#0284c7' }} />,
      label: t('print_barcodes', 'Print Barcode Labels'),
      onClick: () => handleOpenBarcodePrint(),
    },
    {
      key: 'export_excel',
      icon: <FileExcelOutlined style={{ color: '#16a34a' }} />,
      label: t('export_excel', 'Export to Excel (CSV)'),
      onClick: handleExportExcel,
    },
    {
      type: 'divider',
    },
    {
      key: 'delete_bulk',
      icon: <DeleteOutlined style={{ color: '#dc2626' }} />,
      danger: true,
      label: t('delete_selected_products', 'Delete Selected Products'),
      onClick: handleBulkDelete,
    },
  ];

  // Warehouses dropdown menu
  const warehouseMenuItems = [
    {
      key: 'all',
      icon: <ApartmentOutlined />,
      label: t('all_warehouses', 'All Warehouses'),
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
      {/* 1. Top Metrics Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card
            bordered
            style={{ borderRadius: 12, background: adminTheme.card, border: `1px solid ${adminTheme.border}` }}
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Statistic
              title={<span style={{ fontWeight: 700, fontSize: 12, color: adminTheme.subtext }}>{t('total_catalog_items', 'TOTAL CATALOG ITEMS')}</span>}
              value={metrics.total}
              prefix={<BarcodeOutlined style={{ color: '#2563eb' }} />}
              suffix={<span style={{ fontSize: 13, color: adminTheme.subtext }}>Products</span>}
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
              title={<span style={{ fontWeight: 700, fontSize: 12, color: adminTheme.subtext }}>{t('available_in_stock', 'IN STOCK')}</span>}
              value={metrics.inStock}
              prefix={<CheckCircleOutlined style={{ color: '#16a34a' }} />}
              suffix={<span style={{ fontSize: 13, color: '#16a34a' }}>Available</span>}
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
              title={<span style={{ fontWeight: 700, fontSize: 12, color: adminTheme.subtext }}>{t('low_stock_warnings', 'LOW STOCK WARNINGS')}</span>}
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
              title={<span style={{ fontWeight: 700, fontSize: 12, color: adminTheme.subtext }}>{t('total_stock_valuation', 'TOTAL STOCK VALUATION')}</span>}
              value={metrics.totalValuation}
              formatter={(v) => formatCurrency(v)}
              prefix={<DollarOutlined style={{ color: '#059669' }} />}
              valueStyle={{ fontWeight: 900, color: '#059669' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 2. Sub-Navigation Tabs across the top */}
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
              {t('products', 'List Products')}
            </Button>
            <Button
              type={activeTab === 'attributes' ? 'primary' : 'default'}
              icon={<TagsOutlined />}
              onClick={() => setActiveTab('attributes')}
              style={{ fontWeight: 700 }}
            >
              Product Attributes & Values
            </Button>
            <Button
              type={activeTab === 'warehouse-stock' ? 'primary' : 'default'}
              icon={<ApartmentOutlined />}
              onClick={() => setActiveTab('warehouse-stock')}
              style={{ fontWeight: 700 }}
            >
              Warehouse Stock Breakdown
            </Button>
            <Button
              type={activeTab === 'movements' ? 'primary' : 'default'}
              icon={<HistoryOutlined />}
              onClick={() => setActiveTab('movements')}
              style={{ fontWeight: 700 }}
            >
              Stock Movements Ledger
            </Button>
            <Button
              type={activeTab === 'quantity-adjustments' || activeTab === 'quantity_adjustments' ? 'primary' : 'default'}
              icon={<ToolOutlined />}
              onClick={() => {
                setPageMode('list');
                setActiveTab('quantity-adjustments');
                navigate('/admins/products?tab=quantity-adjustments');
              }}
              style={{ fontWeight: 700 }}
            >
              Adjustments
            </Button>
            <Button
              type={activeTab === 'stock-counts' || activeTab === 'stock_counts' ? 'primary' : 'default'}
              icon={<CheckSquareOutlined />}
              onClick={() => {
                setPageMode('list');
                setActiveTab('stock-counts');
                navigate('/admins/products?tab=stock-counts');
              }}
              style={{ fontWeight: 700 }}
            >
              Stock Counts
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
              type={activeTab === 'using-stock' || activeTab === 'using_stock' ? 'primary' : 'default'}
              icon={<FileTextOutlined />}
              onClick={() => {
                setPageMode('list');
                setActiveTab('using-stock');
                navigate('/admins/products?tab=using-stock');
              }}
              style={{ fontWeight: 700 }}
            >
              Stock Usage
            </Button>
          </Space>

          <Space size={8}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenAddProduct}
              style={{ fontWeight: 700, background: '#16a34a', borderColor: '#16a34a' }}
            >
              {t('add_product', 'Add Product')}
            </Button>
            <Button
              icon={<SyncOutlined spin={isSyncing} />}
              onClick={fetchLiveProducts}
              style={{ fontWeight: 700 }}
            >
              {t('sync_db', 'Sync DB')}
            </Button>
          </Space>
        </Flex>
      </Card>

      {/* 3. Main Workspace Container */}
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
            {activeTab === 'products' && <BarcodeOutlined style={{ color: '#2563eb', fontSize: 20 }} />}
            {activeTab === 'attributes' && <TagsOutlined style={{ color: '#2563eb', fontSize: 20 }} />}
            {activeTab === 'warehouse-stock' && <ApartmentOutlined style={{ color: '#2563eb', fontSize: 20 }} />}
            {activeTab === 'movements' && <HistoryOutlined style={{ color: '#2563eb', fontSize: 20 }} />}
            {activeTab === 'quantity-adjustments' && <ToolOutlined style={{ color: '#2563eb', fontSize: 20 }} />}
            {(activeTab === 'stock-counts' || activeTab === 'stock_counts') && <CheckSquareOutlined style={{ color: '#2563eb', fontSize: 20 }} />}
            {activeTab === 'transfers' && <SwapOutlined style={{ color: '#2563eb', fontSize: 20 }} />}
            {(activeTab === 'using-stock' || activeTab === 'using_stock') && <FileTextOutlined style={{ color: '#2563eb', fontSize: 20 }} />}

            <span style={{ fontSize: 17, fontWeight: 800, color: '#2563eb' }}>
              {activeTab === 'products' && `Products Inventory (${filterWarehouse === 'all' ? 'All Warehouses' : warehousesList.find((w) => String(w.id) === filterWarehouse)?.name || 'Selected Warehouse'})`}
              {activeTab === 'attributes' && 'Reusable Product Attributes & Values Manager'}
              {activeTab === 'warehouse-stock' && 'Live Warehouse Stock Balance by Variant'}
              {activeTab === 'movements' && 'Stock Movement Audit Ledger'}
              {activeTab === 'quantity-adjustments' && 'Inventory Quantity Adjustments'}
              {(activeTab === 'stock-counts' || activeTab === 'stock_counts') && 'Stock Counts & Physical Inventory Audits'}
              {activeTab === 'transfers' && 'Warehouse Stock Transfers'}
              {(activeTab === 'using-stock' || activeTab === 'using_stock') && 'Using Stock Management (Material & Internal Consumption)'}
            </span>
          </div>
        }
        extra={
          <Space size={10}>
            {activeTab === 'products' && (
              <Tooltip title={showFilterDrawer ? t('hide_filters', 'Hide Filters') : t('show_advanced_filters', 'Show Advanced Filters')}>
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
                  {showFilterDrawer ? t('collapse_filters', 'Collapse Filters') : t('filter_products', 'Filter Products')}
                </Button>
              </Tooltip>
            )}

            <Dropdown menu={{ items: warehouseMenuItems }} trigger={['click']}>
              <Button style={{ fontWeight: 700, borderRadius: 8 }} icon={<ApartmentOutlined />}>
                {t('warehouses', 'Warehouses')} <DownOutlined style={{ fontSize: 10 }} />
              </Button>
            </Dropdown>

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
                {t('actions', 'Actions')} <DownOutlined style={{ fontSize: 10 }} />
              </Button>
            </Dropdown>
          </Space>
        }
      >
        {/* Collapsible Filter Bar */}
        {showFilterDrawer && activeTab === 'products' && (
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
                    Product Name / SKU / Barcode:
                  </label>
                  <Input
                    placeholder="Search name, code, sku..."
                    prefix={<SearchOutlined />}
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    allowClear
                  />
                </div>
              </Col>
              <Col xs={12} sm={6} md={4}>
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
                      <Option key={cat.id || cat.name} value={cat.id || cat.name}>
                        {cat.name}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>
              <Col xs={12} sm={6} md={4}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: adminTheme.text, display: 'block', marginBottom: 6 }}>
                    Brand:
                  </label>
                  <Select
                    value={filterBrand}
                    onChange={setFilterBrand}
                    style={{ width: '100%' }}
                  >
                    <Option value="all">All Brands</Option>
                    {brandsList.map((b) => (
                      <Option key={b.id || b.name} value={b.id || b.name}>
                        {b.name}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>
              <Col xs={12} sm={6} md={3}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: adminTheme.text, display: 'block', marginBottom: 6 }}>
                    Type:
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
                  </Select>
                </div>
              </Col>
              <Col xs={12} sm={6} md={4}>
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
              <Col xs={12} sm={6} md={3}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: adminTheme.text, display: 'block', marginBottom: 6 }}>
                    Warehouse:
                  </label>
                  <Select
                    value={filterWarehouse}
                    onChange={setFilterWarehouse}
                    style={{ width: '100%' }}
                  >
                    <Option value="all">All Warehouses</Option>
                    {warehousesList.map((wh) => (
                      <Option key={wh.id} value={String(wh.id)}>
                        {wh.name}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>
            </Row>

            <Flex justify="flex-end" style={{ marginTop: 14 }} gap={10}>
              <Button
                onClick={() => {
                  setFilterSearch('');
                  setFilterCategory('all');
                  setFilterBrand('all');
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
                onClick={() => {
                  setShowFilterDrawer(false);
                  fetchLiveProducts();
                }}
                style={{ fontWeight: 700 }}
              >
                Apply Filters ({filteredProducts.length} Results)
              </Button>
            </Flex>
          </div>
        )}

        {/* TAB 1: Products Table with Expandable Variants */}
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
                    description="Products referenced by transactions will be safely archived instead of deleted."
                    onConfirm={handleBulkDelete}
                    okText="Yes, delete / archive"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                  >
                    <Button size="small" danger icon={<DeleteOutlined />}>
                      Delete / Archive ({selectedRowKeys.length})
                    </Button>
                  </Popconfirm>
                </Space>
              )}
            </div>

            <Table
              rowKey="id"
              columns={columns}
              dataSource={filteredProducts}
              expandable={{
                expandedRowRender,
                rowExpandable: (record) => (record.variants && record.variants.length > 0) || (record.variant_count && record.variant_count > 0),
              }}
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

        {/* TAB 2: Reusable Attributes & Values Manager */}
        {activeTab === 'attributes' && (
          <div>
            <Alert
              type="info"
              showIcon
              message="Manage reusable product attributes (e.g. Color, Size, Material, Style) and their valid options. These attributes are used by the Cartesian Variant Combination Generator when creating or editing products."
              style={{ marginBottom: 16 }}
            />
            <Row gutter={[20, 20]}>
              <Col xs={24} md={8}>
                <Card
                  title={<span style={{ fontWeight: 800 }}>Product Attributes</span>}
                  extra={
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        attrForm.resetFields();
                        setIsAddAttrModalOpen(true);
                      }}
                    >
                      Add Attribute
                    </Button>
                  }
                  style={{ borderRadius: 10, border: `1px solid ${adminTheme.border}` }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {attributesList.map((attr) => {
                      const isSelected = selectedAttribute?.id === attr.id;
                      return (
                        <div
                          key={attr.id}
                          onClick={() => {
                            setSelectedAttribute(attr);
                            fetchAttributeValues(attr.id);
                          }}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            background: isSelected ? '#eff6ff' : '#f8fafc',
                            border: `1px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <strong style={{ color: isSelected ? '#1d4ed8' : '#1e293b' }}>{attr.name}</strong>
                            <div style={{ fontSize: 11, color: '#64748b' }}>Code: {attr.code || attr.name.toLowerCase()}</div>
                          </div>
                          <Tag color={isSelected ? 'blue' : 'default'}>
                            {attr.values_count ?? 'Options'}
                          </Tag>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </Col>

              <Col xs={24} md={16}>
                <Card
                  title={
                    <span style={{ fontWeight: 800 }}>
                      Attribute Values for: <span style={{ color: '#2563eb' }}>{selectedAttribute?.name || 'Select an Attribute'}</span>
                    </span>
                  }
                  extra={
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlusOutlined />}
                      disabled={!selectedAttribute}
                      onClick={() => {
                        attrValForm.resetFields();
                        setIsAddAttrValModalOpen(true);
                      }}
                    >
                      Add Value Option
                    </Button>
                  }
                  style={{ borderRadius: 10, border: `1px solid ${adminTheme.border}` }}
                >
                  <Table
                    rowKey="id"
                    dataSource={attributeValuesList}
                    pagination={false}
                    size="small"
                    columns={[
                      {
                        title: 'Value Name',
                        dataIndex: 'value',
                        key: 'value',
                        render: (val, r) => (
                          <Space>
                            {r.color_code && (
                              <span
                                style={{
                                  display: 'inline-block',
                                  width: 14,
                                  height: 14,
                                  borderRadius: '50%',
                                  background: r.color_code,
                                  border: '1px solid #cbd5e1',
                                }}
                              />
                            )}
                            <strong>{val || r.name}</strong>
                          </Space>
                        ),
                      },
                      {
                        title: 'Color / Hex Code',
                        dataIndex: 'color_code',
                        key: 'color_code',
                        render: (c) => (c ? <Tag color="default">{c}</Tag> : '—'),
                      },
                      {
                        title: 'Sort Order',
                        dataIndex: 'sort_order',
                        key: 'sort_order',
                        align: 'center',
                        render: (s) => s ?? 0,
                      },
                      {
                        title: 'Action',
                        key: 'action',
                        align: 'center',
                        width: 90,
                        render: (_, r) => (
                          <Popconfirm
                            title="Delete this attribute value?"
                            onConfirm={async () => {
                              try {
                                await axios.delete(`/api/admin/attributes/${selectedAttribute.id}/values/${r.id}`, { headers: getAuthHeaders() });
                                message.success('Attribute value deleted');
                                fetchAttributeValues(selectedAttribute.id);
                              } catch (err) {
                                message.error('Failed to delete value');
                              }
                            }}
                          >
                            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                          </Popconfirm>
                        ),
                      },
                    ]}
                  />
                </Card>
              </Col>
            </Row>
          </div>
        )}

        {/* TAB 3: Warehouse Stock Breakdown */}
        {activeTab === 'warehouse-stock' && (
          <div>
            <Flex justify="space-between" align="center" style={{ marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: adminTheme.subtext }}>
                Real-time stock balances across warehouses and product variants
              </span>
              <Button icon={<SyncOutlined spin={isWarehouseStockLoading} />} onClick={fetchWarehouseStock}>
                Refresh Balances
              </Button>
            </Flex>
            <Table
              rowKey={(r) => r.unique_row_key || `${r.warehouse_id}_${r.product_id}_${r.variant_id || r.option_id || 0}_${r.wp_id || r.id || 'wh_p'}`}
              loading={isWarehouseStockLoading}
              dataSource={warehouseStockData}
              columns={[
                {
                  title: 'Warehouse',
                  dataIndex: 'warehouse_name',
                  key: 'warehouse_name',
                  render: (w) => <strong style={{ color: '#0284c7' }}>{w}</strong>,
                },
                {
                  title: 'Product',
                  dataIndex: 'product_name',
                  key: 'product_name',
                  render: (p) => <span style={{ fontWeight: 700 }}>{p}</span>,
                },
                {
                  title: 'Variant Name',
                  dataIndex: 'variant_name',
                  key: 'variant_name',
                  render: (v) => (v ? <Tag color="purple">{v}</Tag> : <span style={{ color: '#94a3b8' }}>Parent SKU</span>),
                },
                {
                  title: 'SKU / Barcode',
                  key: 'sku',
                  render: (_, r) => (
                    <span style={{ fontFamily: 'monospace', fontSize: 11 }}>
                      {r.variant_sku || r.product_code || '—'}
                    </span>
                  ),
                },
                {
                  title: 'Available Quantity',
                  dataIndex: 'quantity',
                  key: 'quantity',
                  align: 'right',
                  sorter: (a, b) => (a.quantity || 0) - (b.quantity || 0),
                  render: (qty, r) => {
                    const count = Number(qty) || 0;
                    const alertQty = Number(r.alert_quantity || 10);
                    const isLow = count <= alertQty;
                    return (
                      <strong style={{ color: isLow ? '#dc2626' : '#16a34a', fontSize: 13 }}>
                        {count} {r.unit_name || 'Pcs'}
                      </strong>
                    );
                  },
                },
                {
                  title: 'Alert Qty',
                  dataIndex: 'alert_quantity',
                  key: 'alert_quantity',
                  align: 'center',
                  render: (a) => <Tag color="warning">{a ?? 10}</Tag>,
                },
                {
                  title: 'Stock Health',
                  key: 'health',
                  align: 'center',
                  render: (_, r) => {
                    const count = Number(r.quantity) || 0;
                    const alertQty = Number(r.alert_quantity || 10);
                    if (count <= 0) return <Tag color="error">Out of Stock</Tag>;
                    if (count <= alertQty) return <Tag color="warning">Low Stock</Tag>;
                    return <Tag color="success">Healthy</Tag>;
                  },
                },
                {
                  title: 'Quick Operations',
                  key: 'ops',
                  align: 'center',
                  render: (_, r) => (
                    <Space size={4}>
                      <Button
                        size="small"
                        type="link"
                        onClick={() => handleOpenReceive({ id: r.product_id, name: r.product_name }, r.option_id ? { id: r.option_id, name: r.variant_name } : null)}
                      >
                        Receive
                      </Button>
                      <Button
                        size="small"
                        type="link"
                        onClick={() => handleOpenTransfer({ id: r.product_id, name: r.product_name }, r.option_id ? { id: r.option_id, name: r.variant_name } : null)}
                      >
                        Transfer
                      </Button>
                    </Space>
                  ),
                },
              ]}
              pagination={{ pageSize: 20 }}
            />
          </div>
        )}

        {/* TAB 4: Stock Movement Audit Ledger */}
        {activeTab === 'movements' && (
          <div>
            <Flex justify="space-between" align="center" style={{ marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: adminTheme.subtext }}>
                Complete immutable ledger trail of stock changes (receipts, issues, adjustments, transfers, sales)
              </span>
              <Button icon={<SyncOutlined spin={isMovementsLoading} />} onClick={fetchMovements}>
                Refresh Ledger
              </Button>
            </Flex>
            <Table
              rowKey="id"
              loading={isMovementsLoading}
              dataSource={movementsData}
              columns={[
                {
                  title: 'Date & Time',
                  dataIndex: 'created_at',
                  key: 'created_at',
                  width: 160,
                  render: (dt) => <span style={{ fontSize: 12 }}>{dt ? new Date(dt).toLocaleString() : '—'}</span>,
                },
                {
                  title: 'Reference No',
                  dataIndex: 'reference_no',
                  key: 'reference_no',
                  width: 150,
                  render: (ref) => <strong style={{ color: '#2563eb', fontFamily: 'monospace' }}>{ref || '—'}</strong>,
                },
                {
                  title: 'Movement Type',
                  dataIndex: 'type',
                  key: 'type',
                  width: 160,
                  render: (type) => {
                    const tStr = (type || '').toLowerCase();
                    if (tStr.includes('receive') || tStr.includes('purchase')) {
                      return <Tag color="green" icon={<ArrowDownOutlined />}>{type}</Tag>;
                    }
                    if (tStr.includes('issue') || tStr.includes('sale')) {
                      return <Tag color="red" icon={<ArrowUpOutlined />}>{type}</Tag>;
                    }
                    if (tStr.includes('transfer')) {
                      return <Tag color="purple" icon={<SwapOutlined />}>{type}</Tag>;
                    }
                    return <Tag color="orange" icon={<ToolOutlined />}>{type}</Tag>;
                  },
                },
                {
                  title: 'Warehouse',
                  dataIndex: 'warehouse_name',
                  key: 'warehouse_name',
                  width: 160,
                  render: (w) => <span>{w || 'Default Storage'}</span>,
                },
                {
                  title: 'Product',
                  dataIndex: 'product_name',
                  key: 'product_name',
                  render: (p) => <span style={{ fontWeight: 600 }}>{p}</span>,
                },
                {
                  title: 'Variant',
                  dataIndex: 'variant_name',
                  key: 'variant_name',
                  render: (v) => (v ? <Tag color="purple">{v}</Tag> : <span style={{ color: '#94a3b8' }}>—</span>),
                },
                {
                  title: 'Quantity Change',
                  dataIndex: 'quantity',
                  key: 'quantity',
                  align: 'right',
                  render: (qty, r) => {
                    const q = Number(qty) || 0;
                    const isNeg = r.type === 'stock_issued' || r.type === 'transfer_out' || r.type === 'adjustment_sub' || r.type === 'sale';
                    return (
                      <strong style={{ color: isNeg ? '#dc2626' : '#16a34a', fontSize: 13 }}>
                        {isNeg ? `-${q}` : `+${q}`}
                      </strong>
                    );
                  },
                },
                {
                  title: 'Unit Cost',
                  dataIndex: 'unit_cost',
                  key: 'unit_cost',
                  align: 'right',
                  render: (c) => (c ? formatCurrency(c) : '—'),
                },
              ]}
              pagination={{ pageSize: 25 }}
            />
          </div>
        )}

        {/* TAB 5: Stock Quantity Adjustments */}
        {(activeTab === 'quantity-adjustments' || activeTab === 'quantity_adjustments') && (
          <BpasQuantityAdjustmentsWorkspace embedded={true} />
        )}

        {/* TAB 6: Warehouse Transfers */}
        {activeTab === 'transfers' && (
          <BpasTransfersWorkspace embedded={true} />
        )}

        {/* TAB 7: Stock Usage / Using Stock */}
        {(activeTab === 'using-stock' || activeTab === 'using_stock') && (
          <BpasUsingStockWorkspace embedded={true} />
        )}

        {/* TAB 8: Stock Counts & Audits */}
        {(activeTab === 'stock-counts' || activeTab === 'stock_counts') && (
          <BpasStockCountsWorkspace
            embedded={true}
            onNavigateAdjustment={() => {
              setActiveTab('quantity-adjustments');
              navigate('/admins/products?tab=quantity-adjustments');
            }}
          />
        )}
      </Card>

      {/* MODAL: Receive Stock */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ArrowDownOutlined style={{ color: '#16a34a', fontSize: 20 }} />
            <span style={{ fontSize: 17, fontWeight: 800 }}>Receive Stock into Warehouse</span>
          </div>
        }
        open={isReceiveModalOpen}
        onCancel={() => setIsReceiveModalOpen(false)}
        onOk={handleSubmitReceive}
        width={560}
      >
        <Form form={receiveForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="warehouse_id" label="Warehouse" rules={[{ required: true }]}>
                <Select placeholder="Select warehouse">
                  {warehousesList.map((wh) => (
                    <Option key={wh.id} value={wh.id}>{wh.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="reference_no" label="Reference No" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="product_id" label="Product" rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder="Select product"
              optionFilterProp="children"
              onChange={(pid) => {
                const prod = productsList.find((p) => p.id === pid);
                setOperationTargetProduct(prod);
                receiveForm.setFieldsValue({ option_id: null });
              }}
            >
              {productsList.map((p) => (
                <Option key={p.id} value={p.id}>{p.name} ({p.code})</Option>
              ))}
            </Select>
          </Form.Item>

          {operationTargetProduct?.variants && operationTargetProduct.variants.length > 0 && (
            <Form.Item name="option_id" label="Target Variant">
              <Select placeholder="Select variant (or leave blank for all)">
                {operationTargetProduct.variants.map((v) => (
                  <Option key={v.id} value={v.id}>{v.name} ({v.sku})</Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="quantity" label="Quantity to Receive" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unit_cost" label="Unit Cost ($)">
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="note" label="Receipt Note">
            <Input.TextArea rows={2} placeholder="Supplier invoice, shipping details..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL: Issue Stock */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ArrowUpOutlined style={{ color: '#dc2626', fontSize: 20 }} />
            <span style={{ fontSize: 17, fontWeight: 800 }}>Issue Stock from Warehouse</span>
          </div>
        }
        open={isIssueModalOpen}
        onCancel={() => setIsIssueModalOpen(false)}
        onOk={handleSubmitIssue}
        width={560}
      >
        <Form form={issueForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="warehouse_id" label="Warehouse" rules={[{ required: true }]}>
                <Select placeholder="Select warehouse">
                  {warehousesList.map((wh) => (
                    <Option key={wh.id} value={wh.id}>{wh.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="reference_no" label="Reference No" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="product_id" label="Product" rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder="Select product"
              optionFilterProp="children"
              onChange={(pid) => {
                const prod = productsList.find((p) => p.id === pid);
                setOperationTargetProduct(prod);
                issueForm.setFieldsValue({ option_id: null });
              }}
            >
              {productsList.map((p) => (
                <Option key={p.id} value={p.id}>{p.name} ({p.code})</Option>
              ))}
            </Select>
          </Form.Item>

          {operationTargetProduct?.variants && operationTargetProduct.variants.length > 0 && (
            <Form.Item name="option_id" label="Target Variant">
              <Select placeholder="Select variant (or leave blank for all)">
                {operationTargetProduct.variants.map((v) => (
                  <Option key={v.id} value={v.id}>{v.name} ({v.sku})</Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item name="quantity" label="Quantity to Issue" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="note" label="Discharge Note">
            <Input.TextArea rows={2} placeholder="Reason for issue, destination, authorization..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL: Stock Quantity Adjustment */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ToolOutlined style={{ color: '#ea580c', fontSize: 20 }} />
            <span style={{ fontSize: 17, fontWeight: 800 }}>Record Stock Quantity Adjustment</span>
          </div>
        }
        open={isAdjustmentModalOpen}
        onCancel={() => setIsAdjustmentModalOpen(false)}
        onOk={handleSubmitAdjustment}
        width={560}
      >
        <Form form={adjustmentForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="warehouse_id" label="Warehouse" rules={[{ required: true }]}>
                <Select placeholder="Select warehouse">
                  {warehousesList.map((wh) => (
                    <Option key={wh.id} value={wh.id}>{wh.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="reference_no" label="Reference No" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="Adjustment Type" rules={[{ required: true }]}>
                <Select>
                  <Option value="addition">Addition (+ Increase Stock)</Option>
                  <Option value="subtraction">Subtraction (- Decrease Stock)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="reason" label="Audit Reason" rules={[{ required: true }]}>
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

          <Form.Item name="product_id" label="Product" rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder="Select product"
              optionFilterProp="children"
              onChange={(pid) => {
                const prod = productsList.find((p) => p.id === pid);
                setOperationTargetProduct(prod);
                adjustmentForm.setFieldsValue({ option_id: null });
              }}
            >
              {productsList.map((p) => (
                <Option key={p.id} value={p.id}>{p.name} ({p.code})</Option>
              ))}
            </Select>
          </Form.Item>

          {operationTargetProduct?.variants && operationTargetProduct.variants.length > 0 && (
            <Form.Item name="option_id" label="Target Variant">
              <Select placeholder="Select variant (or leave blank for all)">
                {operationTargetProduct.variants.map((v) => (
                  <Option key={v.id} value={v.id}>{v.name} ({v.sku})</Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item name="quantity" label="Quantity to Adjust" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="note" label="Adjustment Note">
            <Input.TextArea rows={2} placeholder="Explain reason for discrepancy..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL: Warehouse Transfer */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SwapOutlined style={{ color: '#7c3aed', fontSize: 20 }} />
            <span style={{ fontSize: 17, fontWeight: 800 }}>Create Inter-Warehouse Transfer</span>
          </div>
        }
        open={isTransferModalOpen}
        onCancel={() => setIsTransferModalOpen(false)}
        onOk={handleSubmitTransfer}
        width={580}
      >
        <Form form={transferForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="from_warehouse_id" label="Source Warehouse (From)" rules={[{ required: true }]}>
                <Select placeholder="Source">
                  {warehousesList.map((wh) => (
                    <Option key={wh.id} value={wh.id}>{wh.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="to_warehouse_id" label="Destination Warehouse (To)" rules={[{ required: true }]}>
                <Select placeholder="Destination">
                  {warehousesList.map((wh) => (
                    <Option key={wh.id} value={wh.id}>{wh.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="reference_no" label="Transfer Reference No" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="shipping" label="Shipping Charge ($)">
                <InputNumber min={0} step={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="product_id" label="Product" rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder="Select product"
              optionFilterProp="children"
              onChange={(pid) => {
                const prod = productsList.find((p) => p.id === pid);
                setOperationTargetProduct(prod);
                transferForm.setFieldsValue({ option_id: null });
              }}
            >
              {productsList.map((p) => (
                <Option key={p.id} value={p.id}>{p.name} ({p.code})</Option>
              ))}
            </Select>
          </Form.Item>

          {operationTargetProduct?.variants && operationTargetProduct.variants.length > 0 && (
            <Form.Item name="option_id" label="Target Variant">
              <Select placeholder="Select variant (or leave blank for all)">
                {operationTargetProduct.variants.map((v) => (
                  <Option key={v.id} value={v.id}>{v.name} ({v.sku})</Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item name="quantity" label="Quantity to Transfer" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="note" label="Transfer Note">
            <Input.TextArea rows={2} placeholder="Vehicle plate, driver name, transit details..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL: Add Attribute */}
      <Modal
        title="Add Reusable Attribute"
        open={isAddAttrModalOpen}
        onCancel={() => setIsAddAttrModalOpen(false)}
        onOk={async () => {
          try {
            const vals = await attrForm.validateFields();
            const res = await axios.post('/api/admin/attributes', vals, { headers: getAuthHeaders() });
            if (res.data?.success) {
              message.success('Attribute created successfully');
              setIsAddAttrModalOpen(false);
              fetchAttributes();
            }
          } catch (err) {
            message.error('Failed to create attribute');
          }
        }}
      >
        <Form form={attrForm} layout="vertical">
          <Form.Item name="name" label="Attribute Name" rules={[{ required: true, message: 'Please enter attribute name' }]}>
            <Input placeholder="e.g. Color, Size, Material, Capacity" />
          </Form.Item>
          <Form.Item name="code" label="Code (Optional)">
            <Input placeholder="e.g. color, size, material" />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL: Add Attribute Value */}
      <Modal
        title={`Add Value for "${selectedAttribute?.name}"`}
        open={isAddAttrValModalOpen}
        onCancel={() => setIsAddAttrValModalOpen(false)}
        onOk={async () => {
          try {
            const vals = await attrValForm.validateFields();
            const res = await axios.post(`/api/admin/attributes/${selectedAttribute.id}/values`, vals, { headers: getAuthHeaders() });
            if (res.data?.success) {
              message.success('Attribute value option added');
              setIsAddAttrValModalOpen(false);
              fetchAttributeValues(selectedAttribute.id);
            }
          } catch (err) {
            message.error('Failed to add attribute value');
          }
        }}
      >
        <Form form={attrValForm} layout="vertical" initialValues={{ sort_order: 0 }}>
          <Form.Item name="value" label="Value / Option Name" rules={[{ required: true, message: 'Please enter value' }]}>
            <Input placeholder="e.g. Red, XL, 100% Cotton, 256GB" />
          </Form.Item>
          <Form.Item name="color_code" label="Color Hex Code (Optional)">
            <Input placeholder="e.g. #ef4444 or #3b82f6" />
          </Form.Item>
          <Form.Item name="sort_order" label="Sort Order" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL: Product Details */}
      <Modal
        title={detailProduct ? `${detailProduct.name} (${detailProduct.code})` : 'Product Details'}
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={() => window.print()}>
            Print Details
          </Button>,
          <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => {
            setIsDetailModalOpen(false);
            handleEditProduct(detailProduct);
          }}>
            Edit Product
          </Button>,
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
            Close
          </Button>,
        ]}
        width={760}
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
                  <Tag color="cyan">{detailProduct.category_name || detailProduct.category || 'General'}</Tag>
                  <Tag color={(detailProduct.quantity ?? detailProduct.stockCount ?? 0) > 0 ? 'green' : 'red'}>
                    {(detailProduct.quantity ?? detailProduct.stockCount ?? 0) > 0 ? 'In Stock' : 'Out of Stock'}
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
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#2563eb' }}>
                      {detailProduct.quantity ?? detailProduct.stockCount ?? 0} {detailProduct.unit_name || detailProduct.unit || 'Pcs'}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>

            {detailProduct.variants && detailProduct.variants.length > 0 && (
              <div>
                <Divider style={{ margin: '12px 0' }} />
                <Text strong>Product Variants ({detailProduct.variants.length}):</Text>
                <Table
                  size="small"
                  style={{ marginTop: 8 }}
                  pagination={false}
                  dataSource={detailProduct.variants}
                  columns={[
                    { title: 'Variant', dataIndex: 'name', key: 'name' },
                    { title: 'SKU', dataIndex: 'sku', key: 'sku', render: (s) => <Tag color="geekblue">{s}</Tag> },
                    { title: 'Barcode', dataIndex: 'barcode', key: 'barcode' },
                    { title: 'Cost', dataIndex: 'cost', key: 'cost', align: 'right', render: (c) => formatCurrency(c || 0) },
                    { title: 'Price', dataIndex: 'price', key: 'price', align: 'right', render: (p) => <strong style={{ color: '#16a34a' }}>{formatCurrency(p || 0)}</strong> },
                    { title: 'Stock', dataIndex: 'quantity', key: 'quantity', align: 'right', render: (q) => <strong>{q}</strong> },
                  ]}
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* MODAL: Bulk Price Update */}
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
