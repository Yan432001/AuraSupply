import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  Button,
  Select,
  Input,
  InputNumber,
  Table,
  Space,
  Row,
  Col,
  Tag,
  Checkbox,
  Typography,
  Divider,
  message,
  Modal,
  Tooltip,
  Popconfirm,
  Spin,
  Alert,
  Drawer,
  Badge,
  Breadcrumb,
  Switch,
  Statistic,
  Segmented
} from 'antd';
import {
  PrinterOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  BarcodeOutlined,
  SearchOutlined,
  ReloadOutlined,
  SettingOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  EyeOutlined,
  CheckSquareOutlined,
  BorderOutlined,
  DollarOutlined,
  TagOutlined,
  HistoryOutlined,
  ThunderboltOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined,
  ImportOutlined,
  LoadingOutlined,
  BarsOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import JsBarcode from 'jsbarcode';
import axios from 'axios';
import { formatCurrency } from '../../utils/uiTheme';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { useTranslation } from '../../contexts/LanguageContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// Single SVG Barcode Renderer using JsBarcode
const SvgBarcode = ({ value, format = 'CODE128', width = 1.3, height = 36, displayValue = true, fontSize = 10 }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        let bFormat = format ? format.toUpperCase() : 'CODE128';
        if (!['CODE128', 'CODE39', 'EAN13', 'UPC'].includes(bFormat)) {
          bFormat = 'CODE128';
        }

        JsBarcode(svgRef.current, String(value), {
          format: bFormat,
          width,
          height,
          displayValue,
          fontSize,
          margin: 2,
          textMargin: 1,
          background: 'transparent'
        });
      } catch (err) {
        try {
          JsBarcode(svgRef.current, String(value), {
            format: 'CODE128',
            width,
            height,
            displayValue,
            fontSize,
            margin: 2,
            textMargin: 1,
            background: 'transparent'
          });
        } catch (e) {
          console.warn('Barcode render fallback error:', e);
        }
      }
    }
  }, [value, format, width, height, displayValue, fontSize]);

  return <svg ref={svgRef} className="bcimg" style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto' }} />;
};

export default function BpasPrintBarcodesPage({ onBack, preselectedItems = [] }) {
  const adminTheme = useAdminTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Search parameters for ?purchase=ID or ?transfer=ID or ?product_id=ID
  const searchParams = new URLSearchParams(location.search);
  const purchaseParam = searchParams.get('purchase');
  const transferParam = searchParams.get('transfer');
  const productIdParam = searchParams.get('product_id');

  // Barcode & Store Settings
  const [settings, setSettings] = useState({
    site_name: 'AURA',
    default_currency: 'USD',
    barcode_separator: '_',
    currencies: [
      { id: 1, code: 'USD', name: 'DOLLAR', rate: '1.00', symbol: '$' },
      { id: 2, code: 'KHR', name: 'RIEL', rate: '4100.00', symbol: '៛' },
      { id: 3, code: 'BAHT', name: 'BAHT', rate: '33.00', symbol: '฿' }
    ],
    paper_styles: [],
    categories: [],
    brands: [],
    missing_barcodes_count: 0
  });

  // Print Configuration Options
  const isRollStyle = (style) => ['1', '4025', '50', 'jewellery'].includes(String(style));
  const [selectedPaperStyle, setSelectedPaperStyle] = useState(() => localStorage.getItem('bcstyle') || '4025');
  const [previewViewMode, setPreviewViewMode] = useState(() => {
    const saved = localStorage.getItem('bcstyle') || '4025';
    return isRollStyle(saved) ? 'rows' : 'rows';
  });
  const [customWidth, setCustomWidth] = useState(() => localStorage.getItem('cf_width') || '4');
  const [customHeight, setCustomHeight] = useState(() => localStorage.getItem('cf_height') || '2');
  const [customOrientation, setCustomOrientation] = useState(() => localStorage.getItem('cf_orientation') || '0');

  // Toggles for information to display
  const [printSiteName, setPrintSiteName] = useState(() => localStorage.getItem('bcsite_name') !== '0');
  const [printProductName, setPrintProductName] = useState(() => localStorage.getItem('bcproduct_name') !== '0');
  const [printPrice, setPrintPrice] = useState(() => localStorage.getItem('bcprice') !== '0');
  const [printCurrencies, setPrintCurrencies] = useState(() => localStorage.getItem('bccurrencies') === '1');
  const [printUnit, setPrintUnit] = useState(() => localStorage.getItem('bcunit') === '1');
  const [printCategory, setPrintCategory] = useState(() => localStorage.getItem('bccategory') === '1');
  const [printVariants, setPrintVariants] = useState(() => localStorage.getItem('bcvariants') === '1');
  const [printImage, setPrintImage] = useState(() => localStorage.getItem('bcimage') === '1');
  const [printWeight, setPrintWeight] = useState(() => localStorage.getItem('bcweight') === '1');
  const [checkPromo, setCheckPromo] = useState(() => localStorage.getItem('bc_check_promo') !== '0');
  const [barcodeSymbology, setBarcodeSymbology] = useState('CODE128');

  // Items in Print Table
  const [itemsToPrint, setItemsToPrint] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter Bar state
  const [filterSearch, setFilterSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [onlyMissingBarcode, setOnlyMissingBarcode] = useState(false);

  // Live Autocomplete / Scanner Search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Catalog Modal state
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [selectedCatalogKeys, setSelectedCatalogKeys] = useState([]);
  const [selectedCatalogMap, setSelectedCatalogMap] = useState(new Map());
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalogPagination, setCatalogPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const isFirstCatalogRender = useRef(true);

  // Generate Missing Barcodes Modal
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [generateSymbology, setGenerateSymbology] = useState('CODE128');
  const [generatePrefix, setGeneratePrefix] = useState('AUR');
  const [generating, setGenerating] = useState(false);

  // Print History Drawer
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [printLogs, setPrintLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsPagination, setLogsPagination] = useState({ current: 1, pageSize: 15, total: 0 });

  // Template Management Modal
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);
  const [templatesList, setTemplatesList] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Import Modals (Purchase & Transfer)
  const [importPurchaseModalOpen, setImportPurchaseModalOpen] = useState(false);
  const [importPurchaseId, setImportPurchaseId] = useState('');
  const [importTransferModalOpen, setImportTransferModalOpen] = useState(false);
  const [importTransferId, setImportTransferId] = useState('');

  // 1. Fetch Barcode Settings
  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/admin/products/barcode/settings');
      if (res.data?.status && res.data?.data) {
        setSettings(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching barcode settings:', err);
    }
  };

  // 2. Fetch Initial Items
  const initializeItems = async () => {
    setLoading(true);
    try {
      if (purchaseParam) {
        const res = await axios.get(`/api/admin/products/barcode/purchase/${purchaseParam}`);
        if (res.data?.status && res.data?.data && res.data.data.length > 0) {
          setItemsToPrint(res.data.data);
          message.success(`Loaded ${res.data.data.length} products from Purchase #${purchaseParam}`);
          setLoading(false);
          return;
        }
      }

      if (transferParam) {
        const res = await axios.get(`/api/admin/products/barcode/transfer/${transferParam}`);
        if (res.data?.status && res.data?.data && res.data.data.length > 0) {
          setItemsToPrint(res.data.data);
          message.success(`Loaded ${res.data.data.length} products from Transfer #${transferParam}`);
          setLoading(false);
          return;
        }
      }

      if (productIdParam) {
        const res = await axios.get(`/api/admin/products/barcode/product/${productIdParam}`);
        if (res.data?.status && res.data?.data) {
          setItemsToPrint([res.data.data]);
          setLoading(false);
          return;
        }
      }

      if (preselectedItems && preselectedItems.length > 0) {
        const enriched = await Promise.all(
          preselectedItems.map(async (item) => {
            try {
              const res = await axios.get(`/api/admin/products/barcode/product/${item.id}`);
              if (res.data?.status && res.data?.data) {
                return { ...res.data.data, quantity: item.quantity || 1 };
              }
            } catch (e) {
              // fallback
            }
            return {
              ...item,
              quantity: item.quantity || 1,
              selected_variants: item.selected_variants || {},
              variants: item.variants || []
            };
          })
        );
        setItemsToPrint(enriched);
        setLoading(false);
        return;
      }

      const cached = localStorage.getItem('bcitems');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setItemsToPrint(parsed);
            setLoading(false);
            return;
          }
        } catch (e) {
          // ignore cache error
        }
      }

      // Default fallback
      const res = await axios.get('/api/admin/products/barcode/suggestions?limit=6');
      if (res.data?.status && res.data?.data) {
        setItemsToPrint(res.data.data);
      }
    } catch (err) {
      console.error('Error initializing barcode items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    initializeItems();
  }, []);

  // Save items in localStorage on change
  useEffect(() => {
    if (itemsToPrint.length > 0) {
      localStorage.setItem('bcitems', JSON.stringify(itemsToPrint));
    }
  }, [itemsToPrint]);

  // Save config options to localStorage
  useEffect(() => {
    localStorage.setItem('bcstyle', selectedPaperStyle);
    localStorage.setItem('cf_width', customWidth);
    localStorage.setItem('cf_height', customHeight);
    localStorage.setItem('cf_orientation', customOrientation);
    localStorage.setItem('bcsite_name', printSiteName ? '1' : '0');
    localStorage.setItem('bcproduct_name', printProductName ? '1' : '0');
    localStorage.setItem('bcprice', printPrice ? '1' : '0');
    localStorage.setItem('bccurrencies', printCurrencies ? '1' : '0');
    localStorage.setItem('bcunit', printUnit ? '1' : '0');
    localStorage.setItem('bccategory', printCategory ? '1' : '0');
    localStorage.setItem('bcvariants', printVariants ? '1' : '0');
    localStorage.setItem('bcimage', printImage ? '1' : '0');
    localStorage.setItem('bcweight', printWeight ? '1' : '0');
    localStorage.setItem('bc_check_promo', checkPromo ? '1' : '0');
  }, [
    selectedPaperStyle,
    customWidth,
    customHeight,
    customOrientation,
    printSiteName,
    printProductName,
    printPrice,
    printCurrencies,
    printUnit,
    printCategory,
    printVariants,
    printImage,
    printWeight,
    checkPromo
  ]);

  // Live Product Autocomplete Search
  const handleSearch = async (val) => {
    setSearchTerm(val);
    if (!val || !val.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await axios.get('/api/admin/products/barcode/suggestions', {
        params: { term: val.trim() }
      });
      if (res.data?.status) {
        setSearchResults(res.data.data || []);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  // Add Item to Print List
  const handleAddProduct = (product) => {
    if (!product) return;
    setItemsToPrint((prev) => {
      const existingIndex = prev.findIndex((p) => p.id === product.id);
      if (existingIndex > -1) {
        message.info(`Increased quantity for "${product.name}"`);
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: (updated[existingIndex].quantity || 1) + 1
        };
        return updated;
      }
      message.success(`Added "${product.name}" to barcode list`);
      return [...prev, { ...product, quantity: product.quantity || 1 }];
    });
    setSearchTerm('');
    setSearchResults([]);
  };

  // Update item quantity
  const handleUpdateQty = (id, newQty) => {
    const safeQty = Math.max(1, parseInt(newQty, 10) || 1);
    setItemsToPrint((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: safeQty } : item))
    );
  };

  // Toggle individual variant checkbox
  const handleToggleVariant = (productId, variantId, checked) => {
    setItemsToPrint((prev) =>
      prev.map((item) => {
        if (item.id !== productId) return item;
        const selected = { ...(item.selected_variants || {}) };
        selected[variantId] = checked;
        return { ...item, selected_variants: selected };
      })
    );
  };

  // Remove item from table
  const handleRemoveItem = (id) => {
    setItemsToPrint((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      localStorage.setItem('bcitems', JSON.stringify(filtered));
      return filtered;
    });
  };

  // Reset entire list
  const handleResetList = () => {
    setItemsToPrint([]);
    localStorage.removeItem('bcitems');
    message.success(t('barcode_list_cleared', 'Barcode label print list reset.'));
  };

  // Single Product Auto-Generate Barcode
  const handleGenerateSingleBarcode = async (productId) => {
    try {
      const res = await axios.post('/api/admin/products/barcode/generate', {
        product_ids: [productId],
        barcode_type: barcodeSymbology || 'CODE128',
        prefix: generatePrefix || 'AUR'
      });
      if (res.data?.status && res.data.data?.[0]?.success) {
        const newCode = res.data.data[0].barcode;
        message.success(`Barcode generated: ${newCode}`);
        setItemsToPrint((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, barcode: newCode, code: newCode } : p))
        );
        fetchSettings();
      } else {
        message.error('Failed to generate barcode');
      }
    } catch (err) {
      message.error(err.response?.data?.message || err.message);
    }
  };

  // Batch Generate Missing Barcodes
  const handleBatchGenerate = async () => {
    setGenerating(true);
    try {
      // Find product IDs missing barcodes from catalog
      const listRes = await axios.get('/api/admin/products/barcode/list', {
        params: { only_missing_barcode: true, limit: 100 }
      });
      const missingProducts = listRes.data?.data || [];
      if (missingProducts.length === 0) {
        message.info('All products currently have barcodes assigned.');
        setGenerating(false);
        setGenerateModalOpen(false);
        return;
      }

      const pids = missingProducts.map((p) => p.id);
      const genRes = await axios.post('/api/admin/products/barcode/generate', {
        product_ids: pids,
        barcode_type: generateSymbology,
        prefix: generatePrefix
      });

      if (genRes.data?.status) {
        message.success(genRes.data.message || `Generated ${pids.length} barcodes!`);
        fetchSettings();
        initializeItems();
        setGenerateModalOpen(false);
      }
    } catch (err) {
      message.error(err.response?.data?.message || err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Fetch Print Logs
  const fetchPrintLogs = async (page = 1) => {
    setLoadingLogs(true);
    try {
      const res = await axios.get('/api/admin/products/barcode/logs', {
        params: { page, limit: logsPagination.pageSize }
      });
      if (res.data?.status && res.data?.data) {
        setPrintLogs(res.data.data);
        setLogsPagination((prev) => ({
          ...prev,
          current: res.data.pagination.page,
          total: res.data.pagination.total
        }));
      }
    } catch (err) {
      console.error('Error fetching print logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Open History Drawer
  const openHistoryDrawer = () => {
    setHistoryDrawerOpen(true);
    fetchPrintLogs(1);
  };

  // Fetch Templates
  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await axios.get('/api/admin/products/barcode/templates');
      if (res.data?.status && res.data?.data) {
        setTemplatesList(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Open Templates Modal
  const openTemplatesModal = () => {
    setTemplatesModalOpen(true);
    fetchTemplates();
  };

  // Fetch Catalog Products with live filters & pagination
  const fetchCatalogProducts = useCallback(async ({
    page = 1,
    search = filterSearch,
    category_id = filterCategory,
    brand_id = filterBrand,
    status = filterStatus,
    missing = onlyMissingBarcode,
    pageSize = catalogPagination.pageSize
  } = {}) => {
    setLoadingCatalog(true);
    try {
      const res = await axios.get('/api/admin/products/barcode/list', {
        params: {
          search: search && search.trim() ? search.trim() : undefined,
          category_id: category_id !== 'all' ? category_id : undefined,
          brand_id: brand_id !== 'all' ? brand_id : undefined,
          status: status !== 'all' ? status : undefined,
          only_missing_barcode: missing ? 1 : undefined,
          page,
          limit: pageSize
        }
      });
      if (res.data?.status && res.data?.data) {
        setCatalogProducts(res.data.data);
        setCatalogPagination((prev) => ({
          ...prev,
          current: res.data.pagination?.page || page,
          total: res.data.pagination?.total || 0,
          pageSize: res.data.pagination?.limit || pageSize
        }));
      }
    } catch (err) {
      console.error('Catalog load error:', err);
    } finally {
      setLoadingCatalog(false);
    }
  }, [filterSearch, filterCategory, filterBrand, filterStatus, onlyMissingBarcode, catalogPagination.pageSize]);

  // Open Catalog Modal
  const openCatalogModal = (page = 1) => {
    setCatalogModalOpen(true);
    fetchCatalogProducts({ page });
  };

  // Live debounced search & filter sync when Catalog Modal is active
  useEffect(() => {
    if (!catalogModalOpen) {
      isFirstCatalogRender.current = true;
      return;
    }

    // Skip redundant initial fetch if openCatalogModal just triggered it
    if (isFirstCatalogRender.current) {
      isFirstCatalogRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      fetchCatalogProducts({
        page: 1,
        search: filterSearch,
        category_id: filterCategory,
        brand_id: filterBrand,
        status: filterStatus,
        missing: onlyMissingBarcode
      });
    }, 280);

    return () => clearTimeout(timer);
  }, [catalogModalOpen, filterSearch, filterCategory, filterBrand, filterStatus, onlyMissingBarcode, fetchCatalogProducts]);

  // Confirm Catalog Selection
  const handleConfirmCatalogSelection = () => {
    const selected = selectedCatalogKeys
      .map((k) => selectedCatalogMap.get(k) || catalogProducts.find((p) => p.id === k))
      .filter(Boolean);

    if (selected.length === 0) {
      message.warning('Please select at least one product.');
      return;
    }
    setItemsToPrint((prev) => {
      const newItems = [...prev];
      selected.forEach((p) => {
        if (!newItems.some((item) => item.id === p.id)) {
          newItems.push({ ...p, quantity: 1 });
        }
      });
      return newItems;
    });
    setCatalogModalOpen(false);
    setSelectedCatalogKeys([]);
    setSelectedCatalogMap(new Map());
    message.success(`Added ${selected.length} products to print queue`);
  };

  // Import from Purchase Order
  const handleImportPurchase = async () => {
    if (!importPurchaseId || !importPurchaseId.trim()) {
      message.warning('Please enter a Purchase ID');
      return;
    }
    try {
      const res = await axios.get(`/api/admin/products/barcode/purchase/${importPurchaseId.trim()}`);
      if (res.data?.status && res.data?.data && res.data.data.length > 0) {
        setItemsToPrint(res.data.data);
        message.success(`Imported ${res.data.data.length} products from Purchase #${importPurchaseId}`);
        setImportPurchaseModalOpen(false);
        setImportPurchaseId('');
      } else {
        message.error('No items found in this purchase order.');
      }
    } catch (err) {
      message.error(err.response?.data?.message || err.message);
    }
  };

  // Import from Transfer
  const handleImportTransfer = async () => {
    if (!importTransferId || !importTransferId.trim()) {
      message.warning('Please enter a Transfer ID');
      return;
    }
    try {
      const res = await axios.get(`/api/admin/products/barcode/transfer/${importTransferId.trim()}`);
      if (res.data?.status && res.data?.data && res.data.data.length > 0) {
        setItemsToPrint(res.data.data);
        message.success(`Imported ${res.data.data.length} products from Transfer #${importTransferId}`);
        setImportTransferModalOpen(false);
        setImportTransferId('');
      } else {
        message.error('No items found in this transfer record.');
      }
    } catch (err) {
      message.error(err.response?.data?.message || err.message);
    }
  };

  // Calculate generated labels list for sheet preview & printing
  const generatedLabels = [];
  const separator = settings.barcode_separator || '_';

  itemsToPrint.forEach((item) => {
    const qty = parseInt(item.quantity, 10) || 1;
    const effectivePrice = checkPromo && item.promotion && item.promo_price ? item.promo_price : item.price;
    const hasVariants = item.variants && item.variants.length > 0;

    if (hasVariants) {
      item.variants.forEach((variant) => {
        const isSelected = item.selected_variants ? Boolean(item.selected_variants[variant.id]) : true;
        if (!isSelected) return;

        const vBarcode = variant.barcode || variant.sku || `${item.code || item.barcode}${separator}${variant.id}`;
        const vPrice = parseFloat(variant.price) > 0 ? parseFloat(variant.price) : effectivePrice;

        for (let i = 0; i < qty; i++) {
          generatedLabels.push({
            uniqueKey: `${item.id}-${variant.id}-${i}`,
            productId: item.id,
            variantId: variant.id,
            site: printSiteName ? settings.site_name : null,
            name: printProductName ? `${item.name} - ${variant.name}` : null,
            shortName: item.name ? (item.name.length > 25 ? `${item.name.slice(0, 24)}...` : item.name) : '',
            price: printPrice ? vPrice : null,
            currencies: printCurrencies ? settings.currencies : null,
            unit: printUnit ? (item.unit_name || item.unit) : null,
            category: printCategory ? (item.category_name || item.category) : null,
            weight: printWeight && item.weight ? item.weight : null,
            image: printImage && item.image ? item.image : null,
            barcode: vBarcode,
            barcode_symbology: item.barcode_type || item.barcode_symbology || barcodeSymbology || 'CODE128',
            variantName: variant.name
          });
        }
      });
    } else {
      const pBarcode = item.barcode || item.code || `8858${String(item.id).padStart(6, '0')}`;
      for (let i = 0; i < qty; i++) {
        generatedLabels.push({
          uniqueKey: `${item.id}-${i}`,
          productId: item.id,
          variantId: null,
          site: printSiteName ? settings.site_name : null,
          name: printProductName ? item.name : null,
          shortName: item.name ? (item.name.length > 25 ? `${item.name.slice(0, 24)}...` : item.name) : '',
          price: printPrice ? effectivePrice : null,
          currencies: printCurrencies ? settings.currencies : null,
          unit: printUnit ? (item.unit_name || item.unit) : null,
          category: printCategory ? (item.category_name || item.category) : null,
          weight: printWeight && item.weight ? item.weight : null,
          image: printImage && item.image ? item.image : null,
          barcode: pBarcode,
          barcode_symbology: item.barcode_type || item.barcode_symbology || barcodeSymbology || 'CODE128',
          variantName: null
        });
      }
    }
  });

  // Calculate paper style dimensions & grid
  const getStyleConfig = () => {
    switch (selectedPaperStyle) {
      case '4025':
        return {
          key: '4025',
          name: '1 per sheet (40 x 25mm)',
          width: '40mm',
          height: '24.8mm',
          itemWidthPx: 200,
          itemHeightPx: 120,
          barcodeHeight: 28,
          barcodeWidth: 1.1,
          isRoll: true,
          labelPerSheet: 1
        };
      case '1':
        return {
          key: '1',
          name: '1 per sheet (50 x 30mm)',
          width: '50mm',
          height: '29.5mm',
          itemWidthPx: 230,
          itemHeightPx: 135,
          barcodeHeight: 32,
          barcodeWidth: 1.15,
          isRoll: true,
          labelPerSheet: 1
        };
      case '50':
        return {
          key: '50',
          name: 'Continuous Feed (Custom Dimensions)',
          width: `${customWidth}in`,
          height: `${customHeight}in`,
          itemWidthPx: 240,
          itemHeightPx: 140,
          barcodeHeight: 32,
          barcodeWidth: 1.2,
          isCustom: true,
          isRoll: true,
          labelPerSheet: 1
        };
      case 'jewellery':
        return {
          key: 'jewellery',
          name: 'Jewellery Label (Dual Tail Tag with Weight)',
          width: '300px',
          height: '90px',
          itemWidthPx: 300,
          itemHeightPx: 95,
          barcodeHeight: 26,
          barcodeWidth: 1.0,
          isJewellery: true,
          isRoll: true,
          labelPerSheet: 1
        };
      case '84':
        return {
          key: '84',
          name: '84 per sheet (16 x 21mm, A4 7x12 - Mini)',
          width: '16mm',
          height: '21mm',
          itemWidthPx: 140,
          itemHeightPx: 95,
          gridCols: 'repeat(auto-fill, minmax(135px, 1fr))',
          barcodeHeight: 20,
          barcodeWidth: 0.9,
          isA4: true,
          labelPerSheet: 84
        };
      case '40':
        return {
          key: '40',
          name: '40 per sheet (48.5 x 25.4mm, A4 4x10)',
          width: '48.5mm',
          height: '25.4mm',
          itemWidthPx: 210,
          itemHeightPx: 115,
          gridCols: 'repeat(auto-fill, minmax(190px, 1fr))',
          barcodeHeight: 26,
          barcodeWidth: 1.05,
          isA4: true,
          labelPerSheet: 40
        };
      case '30':
        return {
          key: '30',
          name: '30 per sheet (70 x 29.7mm, A4 3x10)',
          width: '70mm',
          height: '29.7mm',
          itemWidthPx: 230,
          itemHeightPx: 120,
          gridCols: 'repeat(auto-fill, minmax(210px, 1fr))',
          barcodeHeight: 28,
          barcodeWidth: 1.15,
          isA4: true,
          labelPerSheet: 30
        };
      case '24':
      default:
        return {
          key: '24',
          name: '24 per sheet (70 x 37mm, A4 3x8)',
          width: '70mm',
          height: '37mm',
          itemWidthPx: 230,
          itemHeightPx: 130,
          gridCols: 'repeat(auto-fill, minmax(210px, 1fr))',
          barcodeHeight: 28,
          barcodeWidth: 1.15,
          isA4: true,
          labelPerSheet: 24
        };
      case '20':
        return {
          key: '20',
          name: '20 per sheet (101.6 x 25.4mm, A4 2x10)',
          width: '101.6mm',
          height: '25.4mm',
          itemWidthPx: 280,
          itemHeightPx: 115,
          gridCols: 'repeat(auto-fill, minmax(260px, 1fr))',
          barcodeHeight: 28,
          barcodeWidth: 1.2,
          isA4: true,
          labelPerSheet: 20
        };
      case '18':
        return {
          key: '18',
          name: '18 per sheet (70 x 48.5mm, A4 3x6)',
          width: '70mm',
          height: '48.5mm',
          itemWidthPx: 240,
          itemHeightPx: 140,
          gridCols: 'repeat(auto-fill, minmax(220px, 1fr))',
          barcodeHeight: 32,
          barcodeWidth: 1.2,
          isA4: true,
          labelPerSheet: 18
        };
      case '14':
        return {
          key: '14',
          name: '14 per sheet (101.6 x 38.1mm, A4 2x7)',
          width: '101.6mm',
          height: '38.1mm',
          itemWidthPx: 280,
          itemHeightPx: 135,
          gridCols: 'repeat(auto-fill, minmax(260px, 1fr))',
          barcodeHeight: 30,
          barcodeWidth: 1.2,
          isA4: true,
          labelPerSheet: 14
        };
      case '12':
        return {
          key: '12',
          name: '12 per sheet (101.6 x 48mm, A4 2x6)',
          width: '101.6mm',
          height: '48mm',
          itemWidthPx: 280,
          itemHeightPx: 150,
          gridCols: 'repeat(auto-fill, minmax(260px, 1fr))',
          barcodeHeight: 32,
          barcodeWidth: 1.2,
          isA4: true,
          labelPerSheet: 12
        };
      case '10':
        return {
          key: '10',
          name: '10 per sheet (101.6 x 50.8mm, A4 2x5)',
          width: '101.6mm',
          height: '50.8mm',
          itemWidthPx: 290,
          itemHeightPx: 160,
          gridCols: 'repeat(auto-fill, minmax(260px, 1fr))',
          barcodeHeight: 34,
          barcodeWidth: 1.25,
          isA4: true,
          labelPerSheet: 10
        };
      case '2':
        return {
          key: '2',
          name: '2 per sheet (190 x 130mm, A4 Half Sheet)',
          width: '190mm',
          height: '130mm',
          itemWidthPx: 450,
          itemHeightPx: 260,
          gridCols: 'repeat(auto-fill, minmax(380px, 1fr))',
          barcodeHeight: 50,
          barcodeWidth: 1.6,
          isA4: true,
          labelPerSheet: 2
        };
      case 'shelf':
        return {
          key: 'shelf',
          name: 'Shelf Edge Tag (3.8in x 1.5in)',
          width: '3.8in',
          height: '1.5in',
          itemWidthPx: 320,
          itemHeightPx: 140,
          gridCols: 'repeat(auto-fill, minmax(300px, 1fr))',
          barcodeHeight: 34,
          barcodeWidth: 1.2,
          isShelf: true,
          labelPerSheet: 14
        };
    }
  };

  const styleConfig = getStyleConfig();

  // Render Barcode Label Item (matches AURA_v1 layout & hierarchy)
  const renderBarcodeLabel = (lbl, isSingleSample = false) => {
    const isRowLayout = (styleConfig.isRoll || previewViewMode === 'rows' || isSingleSample);

    return (
      <div
        key={lbl.uniqueKey || 'sample'}
        className={`barcode-single-item ${
          styleConfig.key === '4025' ? 'barcode1_40x25' : styleConfig.key === '1' ? 'barcode1_50x30' : ''
        } ${isRowLayout ? 'barcode-roll-item' : ''} ${styleConfig.isRoll && !isSingleSample ? 'page-break' : ''}`}
        style={{
          width: isSingleSample ? '185px' : (isRowLayout ? `${styleConfig.itemWidthPx || 200}px` : '100%'),
          maxWidth: isRowLayout ? `${styleConfig.itemWidthPx || 210}px` : `${(styleConfig.itemWidthPx || 220) + 40}px`,
          minHeight: `${styleConfig.itemHeightPx || 120}px`,
          margin: '0 auto',
          padding: '6px 8px',
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: 4,
          boxShadow: isRowLayout ? '0 1px 3px rgba(0,0,0,0.08)' : '0 1px 2px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}
      >
        {/* 1. Site Name (Centered at top like AURA_v1 VSR) */}
        {printSiteName && (lbl.site || settings.site_name) && (
          <div
            className="barcode_site"
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#334155',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              lineHeight: 1.1,
              marginBottom: 2
            }}
          >
            {lbl.site || settings.site_name}
          </div>
        )}

        {/* 2. Price ($2.00 centered and prominent like AURA_v1) */}
        {printPrice && lbl.price !== null && (
          <div
            className="barcode_price"
            style={{
              fontSize: 12.5,
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.1,
              marginBottom: 2
            }}
          >
            {formatCurrency(lbl.price)}
          </div>
        )}

        {/* 3. Product Name (LAYS centered clean uppercase/bold text) */}
        {printProductName && (lbl.name || lbl.shortName) && (
          <div
            className="barcode_name"
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              color: '#0f172a',
              textTransform: 'uppercase',
              textAlign: 'center',
              lineHeight: 1.15,
              marginBottom: 3,
              maxWidth: '96%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            title={lbl.name}
          >
            {lbl.shortName || lbl.name}
          </div>
        )}

        {/* 4. Multi-Currencies / Exchange Rates (if checked) */}
        {printCurrencies && lbl.currencies && (
          <div
            style={{
              fontSize: 8,
              color: '#64748b',
              display: 'flex',
              gap: 4,
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginBottom: 2
            }}
          >
            {lbl.currencies.map((c) => (
              <span key={c.id}>
                {c.code}: {c.symbol}{(lbl.price * parseFloat(c.rate)).toFixed(2)}
              </span>
            ))}
          </div>
        )}

        {/* 5. Barcode SVG with Barcode value underneath (86337976 style) */}
        <div style={{ margin: '1px 0', width: '100%', display: 'flex', justifyContent: 'center' }}>
          <SvgBarcode
            value={lbl.barcode}
            format={lbl.barcode_symbology}
            height={styleConfig.barcodeHeight || 26}
            width={styleConfig.barcodeWidth || 1.1}
            fontSize={8.5}
            displayValue={true}
          />
        </div>

        {/* 6. Product Unit (if checked) */}
        {printUnit && (lbl.unit_name || lbl.unit) && (
          <div style={{ fontSize: 8.5, color: '#475569', fontWeight: 600, marginTop: 1 }}>
            Unit: {lbl.unit_name || lbl.unit}
          </div>
        )}

        {/* 7. Category (if checked) */}
        {printCategory && (lbl.category_name || lbl.category) && (
          <div style={{ fontSize: 8, color: '#64748b', marginTop: 1 }}>
            Category: {lbl.category_name || lbl.category}
          </div>
        )}

        {/* 8. Weight (if checked) */}
        {printWeight && lbl.weight && (
          <div style={{ fontSize: 8, color: '#475569', marginTop: 1 }}>
            Weight: {lbl.weight}g
          </div>
        )}
      </div>
    );
  };

  // Print Execution: saves print log to database audit trail, then executes window.print()
  const handlePrint = async () => {
    if (itemsToPrint.length === 0) {
      message.warning('No barcode labels in list to print.');
      return;
    }

    try {
      await axios.post('/api/admin/products/barcode/print', {
        items: itemsToPrint.map((item) => ({
          product_id: item.id,
          quantity: item.quantity || 1,
          barcode_type: item.barcode_type || item.barcode_symbology || barcodeSymbology || 'CODE128',
          label_size: selectedPaperStyle,
          template: selectedPaperStyle
        })),
        label_size: selectedPaperStyle,
        template: selectedPaperStyle,
        barcode_type: barcodeSymbology || 'CODE128'
      });
      message.success('Print job saved to audit trail.');
    } catch (e) {
      console.warn('Logging print error:', e);
    }

    window.print();
  };

  return (
    <div className="barcode-page-root" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 
        =========================================================================
        PRINT MEDIA STYLESHEET (matches AURA_v1 helpers/print.css)
        =========================================================================
      */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .barcode-print-canvas, .barcode-print-canvas * {
            visibility: visible !important;
          }
          .barcode-print-canvas {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            border: none !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
          .barcode-single-item {
            border: none !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
          }
          .barcode-roll-container {
            padding: 0 !important;
            gap: 0 !important;
            background: #fff !important;
            border: none !important;
          }
          .barcode1_40x25 {
            width: 40mm !important;
            height: 24.8mm !important;
            margin: 0 auto !important;
            page-break-after: always !important;
            break-after: page !important;
            padding: 1.5mm 0 !important;
          }
          .barcode1_50x30 {
            width: 50mm !important;
            height: 29.5mm !important;
            margin: 0 auto !important;
            page-break-after: always !important;
            break-after: page !important;
            padding: 2mm 0 !important;
          }
        }
        .barcode-single-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          box-sizing: border-box;
          background: #fff;
          border: 1px solid #cbd5e1;
          padding: 6px 8px;
          overflow: hidden;
          position: relative;
          transition: all 0.2s ease;
        }
        .barcode-single-item:hover {
          border-color: #2563eb;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        .barcode-roll-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 20px 10px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px dashed #cbd5e1;
        }
        .barcode-roll-item {
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          border-radius: 4px;
        }
      `}</style>

      {/* 
        =========================================================================
        HEADER & BREADCRUMB
        =========================================================================
      */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          padding: '12px 20px',
          background: adminTheme.surface,
          borderRadius: 8,
          border: `1px solid ${adminTheme.border}`
        }}
      >
        <Space direction="vertical" size={2}>
          <Breadcrumb
            items={[
              { title: <span style={{ color: adminTheme.subtext, cursor: 'pointer' }} onClick={onBack}>Inventory</span> },
              { title: <span style={{ color: adminTheme.subtext }}>Products</span> },
              { title: <strong style={{ color: adminTheme.text }}>Print Barcode Labels</strong> }
            ]}
          />
          <Title level={4} style={{ margin: 0, color: adminTheme.text, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarcodeOutlined style={{ color: '#2563eb' }} />
            Print Barcode Labels
            <Tag color="blue" style={{ fontSize: 12, marginLeft: 6 }}>AURA_v1 Engine</Tag>
          </Title>
        </Space>

        <Space wrap>
          {onBack && (
            <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
              {t('back_to_products', 'Back to List')}
            </Button>
          )}

          <Button
            icon={<ThunderboltOutlined />}
            onClick={() => setGenerateModalOpen(true)}
            style={{ borderColor: '#f59e0b', color: '#d97706' }}
          >
            Missing Barcodes ({settings.missing_barcodes_count || 0})
          </Button>

          <Button icon={<HistoryOutlined />} onClick={openHistoryDrawer}>
            Print History
          </Button>

          <Button icon={<SettingOutlined />} onClick={openTemplatesModal}>
            Templates
          </Button>

          <Button
            type="primary"
            icon={<PrinterOutlined />}
            size="large"
            onClick={handlePrint}
            disabled={itemsToPrint.length === 0}
            style={{ background: '#16a34a', borderColor: '#16a34a', fontWeight: 600 }}
          >
            Print Labels ({generatedLabels.length})
          </Button>
        </Space>
      </div>

      {/* 
        =========================================================================
        FILTER & SEARCH TOOLBAR
        =========================================================================
      */}
      <Card className="no-print" size="small" style={{ background: adminTheme.surface, borderColor: adminTheme.border }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={8}>
            <div style={{ position: 'relative' }}>
              <Input
                placeholder="Scan barcode or type product name / SKU..."
                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                onPressEnter={() => {
                  if (searchResults.length > 0) {
                    handleAddProduct(searchResults[0]);
                  }
                }}
                allowClear
                size="large"
              />
              {/* Autocomplete Dropdown */}
              {searchResults.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: adminTheme.surface,
                    border: `1px solid ${adminTheme.border}`,
                    boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                    borderRadius: 6,
                    zIndex: 1050,
                    maxHeight: 280,
                    overflowY: 'auto',
                    marginTop: 4
                  }}
                >
                  {searchResults.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => handleAddProduct(prod)}
                      style={{
                        padding: '8px 12px',
                        borderBottom: `1px solid ${adminTheme.border}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Space>
                        <Tag color="blue">{prod.code || prod.barcode || 'NO CODE'}</Tag>
                        <span style={{ fontWeight: 600, color: adminTheme.text }}>{prod.name}</span>
                        {prod.variants && prod.variants.length > 0 && (
                          <Tag color="purple">{prod.variants.length} Variants</Tag>
                        )}
                      </Space>
                      <strong style={{ color: '#16a34a' }}>{formatCurrency(prod.price)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Col>

          <Col xs={24} md={16}>
            <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button icon={<AppstoreOutlined />} onClick={() => openCatalogModal(1)}>
                Browse Catalog
              </Button>
              <Button icon={<ImportOutlined />} onClick={() => setImportPurchaseModalOpen(true)}>
                Import Purchase
              </Button>
              <Button icon={<ImportOutlined />} onClick={() => setImportTransferModalOpen(true)}>
                Import Transfer
              </Button>
              <Popconfirm
                title="Reset barcode print list?"
                description="This will clear all products from the queue."
                onConfirm={handleResetList}
                okText="Yes, Clear"
                cancelText="Cancel"
              >
                <Button danger icon={<DeleteOutlined />}>
                  Clear All
                </Button>
              </Popconfirm>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 
        =========================================================================
        MAIN WORKSPACE: LEFT (TABLE) + RIGHT (SETTINGS & PREVIEW)
        =========================================================================
      */}
      <Row gutter={[16, 16]}>
        {/* Left Column: Interactive Product Selection Table */}
        <Col xs={24} lg={15} className="no-print">
          <Card
            title={
              <Space>
                <FileTextOutlined style={{ color: '#2563eb' }} />
                <span>Print Queue ({itemsToPrint.length} products, {generatedLabels.length} labels)</span>
              </Space>
            }
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                Edit quantities or toggle variant checkboxes below
              </Text>
            }
            style={{ background: adminTheme.surface, borderColor: adminTheme.border }}
          >
            <Table
              dataSource={itemsToPrint}
              rowKey="id"
              pagination={false}
              size="middle"
              loading={loading}
              columns={[
                {
                  title: 'Product (Code / SKU)',
                  key: 'product',
                  render: (_, r) => (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ fontWeight: 600, color: adminTheme.text, fontSize: 13 }}>
                        {r.name}
                      </div>
                      <Space wrap size={4}>
                        <Tag color="cyan">Code: {r.code || 'N/A'}</Tag>
                        {r.sku && <Tag color="geekblue">SKU: {r.sku}</Tag>}
                        {r.barcode ? (
                          <Tag color="blue">
                            <BarcodeOutlined style={{ marginRight: 4 }} />
                            {r.barcode}
                          </Tag>
                        ) : (
                          <Space size={4}>
                            <Tag color="volcano" icon={<ExclamationCircleOutlined />}>
                              Missing Barcode
                            </Tag>
                            <Button
                              size="small"
                              type="link"
                              style={{ padding: 0, height: 'auto', fontSize: 11 }}
                              onClick={() => handleGenerateSingleBarcode(r.id)}
                            >
                              Auto-Generate
                            </Button>
                          </Space>
                        )}
                        <Tag>{r.unit_name || r.unit || 'PCS'}</Tag>
                      </Space>
                    </div>
                  )
                },
                {
                  title: 'Variants',
                  key: 'variants',
                  render: (_, r) => {
                    if (!r.variants || r.variants.length === 0) {
                      return <span style={{ color: '#94a3b8', fontSize: 12 }}>No variants</span>;
                    }
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {r.variants.map((v) => {
                          const isChecked = r.selected_variants ? Boolean(r.selected_variants[v.id]) : true;
                          return (
                            <Checkbox
                              key={v.id}
                              checked={isChecked}
                              onChange={(e) => handleToggleVariant(r.id, v.id, e.target.checked)}
                              style={{ fontSize: 11 }}
                            >
                              {v.name} ({formatCurrency(v.price || r.price)})
                            </Checkbox>
                          );
                        })}
                      </div>
                    );
                  }
                },
                {
                  title: 'Price',
                  key: 'price',
                  width: 90,
                  render: (_, r) => (
                    <div>
                      <strong style={{ color: '#16a34a' }}>{formatCurrency(r.price)}</strong>
                      {checkPromo && r.promotion && r.promo_price && (
                        <div style={{ fontSize: 11, color: '#d97706' }}>
                          Promo: {formatCurrency(r.promo_price)}
                        </div>
                      )}
                    </div>
                  )
                },
                {
                  title: 'Quantity',
                  key: 'quantity',
                  width: 130,
                  render: (_, r) => (
                    <Space size={2}>
                      <Button
                        size="small"
                        onClick={() => handleUpdateQty(r.id, (r.quantity || 1) - 1)}
                        disabled={(r.quantity || 1) <= 1}
                      >
                        -
                      </Button>
                      <InputNumber
                        min={1}
                        max={9999}
                        size="small"
                        value={r.quantity || 1}
                        onChange={(val) => handleUpdateQty(r.id, val)}
                        style={{ width: 55, textAlign: 'center' }}
                      />
                      <Button
                        size="small"
                        onClick={() => handleUpdateQty(r.id, (r.quantity || 1) + 1)}
                      >
                        +
                      </Button>
                    </Space>
                  )
                },
                {
                  title: '',
                  key: 'actions',
                  width: 50,
                  render: (_, r) => (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveItem(r.id)}
                    />
                  )
                }
              ]}
              locale={{
                emptyText: (
                  <div style={{ padding: '30px 0', textAlign: 'center' }}>
                    <BarcodeOutlined style={{ fontSize: 42, color: '#94a3b8', marginBottom: 8 }} />
                    <Paragraph style={{ color: adminTheme.subtext, margin: 0 }}>
                      No products added to the print queue yet.
                    </Paragraph>
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => openCatalogModal(1)}
                      style={{ marginTop: 10 }}
                    >
                      Browse Product Catalog
                    </Button>
                  </div>
                )
              }}
            />
          </Card>
        </Col>

        {/* Right Column: Settings & Live Preview */}
        <Col xs={24} lg={9} className="no-print">
          <Card
            title={
              <Space>
                <SettingOutlined style={{ color: '#2563eb' }} />
                <span>Label Configuration</span>
              </Space>
            }
            style={{ background: adminTheme.surface, borderColor: adminTheme.border, marginBottom: 16 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Paper Style Selector */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: adminTheme.text, display: 'block', marginBottom: 6 }}>
                  Paper Style / Label Dimensions:
                </label>
                <Select
                  value={selectedPaperStyle}
                  onChange={(val) => {
                    setSelectedPaperStyle(val);
                    if (isRollStyle(val)) {
                      setPreviewViewMode('rows');
                    }
                  }}
                  style={{ width: '100%' }}
                >
                  <Option value="4025">1 per sheet (40 x 25mm)</Option>
                  <Option value="1">1 per sheet (50 x 30mm)</Option>
                  <Option value="24">24 per sheet (70mm x 37mm, A4 3x8)</Option>
                  <Option value="40">40 per sheet (48.5mm x 25.4mm, A4 4x10)</Option>
                  <Option value="30">30 per sheet (70mm x 29.7mm, A4 3x10)</Option>
                  <Option value="20">20 per sheet (101.6mm x 25.4mm, A4 2x10)</Option>
                  <Option value="18">18 per sheet (70mm x 48.5mm, A4 3x6)</Option>
                  <Option value="14">14 per sheet (101.6mm x 38.1mm, A4 2x7)</Option>
                  <Option value="12">12 per sheet (101.6mm x 48mm, A4 2x6)</Option>
                  <Option value="10">10 per sheet (101.6mm x 50.8mm, A4 2x5)</Option>
                  <Option value="84">84 per sheet (16mm x 21mm, A4 7x12 - Mini)</Option>
                  <Option value="2">2 per sheet (190mm x 130mm, A4 Half Sheet)</Option>
                  <Option value="shelf">Shelf Edge Tag (Retail Price & Multi-Currency)</Option>
                  <Option value="jewellery">Jewellery Label (Dual Tail Tag with Weight)</Option>
                  <Option value="50">Continuous Feed (Custom Width x Height)</Option>
                </Select>
              </div>

              {/* Custom Continuous Dimensions */}
              {selectedPaperStyle === '50' && (
                <Row gutter={8}>
                  <Col span={12}>
                    <label style={{ fontSize: 11, fontWeight: 600 }}>Width (Inches):</label>
                    <Input
                      value={customWidth}
                      onChange={(e) => setCustomWidth(e.target.value)}
                      placeholder="e.g. 4"
                    />
                  </Col>
                  <Col span={12}>
                    <label style={{ fontSize: 11, fontWeight: 600 }}>Height (Inches):</label>
                    <Input
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      placeholder="e.g. 2"
                    />
                  </Col>
                </Row>
              )}

              {/* Barcode Symbology */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: adminTheme.text, display: 'block', marginBottom: 6 }}>
                  Default Symbology:
                </label>
                <Select
                  value={barcodeSymbology}
                  onChange={(val) => setBarcodeSymbology(val)}
                  style={{ width: '100%' }}
                >
                  <Option value="CODE128">Code 128 (Standard Alphanumeric)</Option>
                  <Option value="EAN13">EAN-13 (13 Digits International)</Option>
                  <Option value="UPC">UPC-A (12 Digits Retail)</Option>
                  <Option value="CODE39">Code 39</Option>
                </Select>
              </div>

              <Divider style={{ margin: '8px 0' }} />

              {/* Information to Display Toggles */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: adminTheme.text, display: 'block', marginBottom: 8 }}>
                  Information to Display:
                </label>
                <Row gutter={[8, 8]}>
                  <Col span={12}>
                    <Checkbox checked={printSiteName} onChange={(e) => setPrintSiteName(e.target.checked)}>
                      Site Name
                    </Checkbox>
                  </Col>
                  <Col span={12}>
                    <Checkbox checked={printProductName} onChange={(e) => setPrintProductName(e.target.checked)}>
                      Product Name
                    </Checkbox>
                  </Col>
                  <Col span={12}>
                    <Checkbox checked={printPrice} onChange={(e) => setPrintPrice(e.target.checked)}>
                      Price
                    </Checkbox>
                  </Col>
                  <Col span={12}>
                    <Checkbox checked={checkPromo} onChange={(e) => setCheckPromo(e.target.checked)}>
                      Promotional Price
                    </Checkbox>
                  </Col>
                  <Col span={12}>
                    <Checkbox checked={printCurrencies} onChange={(e) => setPrintCurrencies(e.target.checked)}>
                      Exchange Rates
                    </Checkbox>
                  </Col>
                  <Col span={12}>
                    <Checkbox checked={printUnit} onChange={(e) => setPrintUnit(e.target.checked)}>
                      Product Unit
                    </Checkbox>
                  </Col>
                  <Col span={12}>
                    <Checkbox checked={printCategory} onChange={(e) => setPrintCategory(e.target.checked)}>
                      Category
                    </Checkbox>
                  </Col>
                  <Col span={12}>
                    <Checkbox checked={printVariants} onChange={(e) => setPrintVariants(e.target.checked)}>
                      Variant Breakdown
                    </Checkbox>
                  </Col>
                  <Col span={12}>
                    <Checkbox checked={printWeight} onChange={(e) => setPrintWeight(e.target.checked)}>
                      Product Weight
                    </Checkbox>
                  </Col>
                  <Col span={12}>
                    <Checkbox checked={printImage} onChange={(e) => setPrintImage(e.target.checked)}>
                      Product Image
                    </Checkbox>
                  </Col>
                </Row>
              </div>

              <Divider style={{ margin: '8px 0' }} />

              {/* Live Preview Card */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: adminTheme.text, display: 'block', marginBottom: 6 }}>
                  Live Sample Label Preview:
                </label>
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    padding: 12,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  {generatedLabels.length > 0 ? (
                    renderBarcodeLabel(generatedLabels[0], true)
                  ) : (
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Add items to view preview
                    </Text>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 
        =========================================================================
        PRINT CANVAS (Visible on screen and during window.print())
        =========================================================================
      */}
      <Card
        title={
          <Space>
            <EyeOutlined style={{ color: '#2563eb' }} />
            <span>Complete Sheet Preview ({generatedLabels.length} total labels ready for printer)</span>
          </Space>
        }
        extra={
          <Space>
            <span style={{ fontSize: 12, color: adminTheme.subtext }}>View:</span>
            <Segmented
              size="small"
              value={previewViewMode}
              onChange={(val) => setPreviewViewMode(val)}
              options={[
                { label: 'Vertical Rows (Roll)', value: 'rows', icon: <BarsOutlined /> },
                { label: 'Sheet Grid', value: 'grid', icon: <AppstoreOutlined /> }
              ]}
            />
          </Space>
        }
        className="barcode-preview-card"
        style={{ background: adminTheme.surface, borderColor: adminTheme.border }}
      >
        {generatedLabels.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: adminTheme.subtext }}>
            No labels in print queue. Use "Browse Catalog" or search products to begin.
          </div>
        ) : (previewViewMode === 'rows' || styleConfig.isRoll) ? (
          <div
            className="barcode-print-canvas barcode-roll-container"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '24px 12px',
              background: '#f8fafc',
              borderRadius: 8,
              border: '1px dashed #cbd5e1'
            }}
          >
            {generatedLabels.map((lbl) => renderBarcodeLabel(lbl, false))}
          </div>
        ) : (
          <div
            className="barcode-print-canvas"
            style={{
              display: 'grid',
              gridTemplateColumns: styleConfig.gridCols,
              gap: 10,
              padding: 12,
              background: '#fff'
            }}
          >
            {generatedLabels.map((lbl) => renderBarcodeLabel(lbl, false))}
          </div>
        )}
      </Card>

      {/* 
        =========================================================================
        CATALOG MULTI-SELECT MODAL WITH ADVANCED FILTERS
        =========================================================================
      */}
      <Modal
        title="Product Catalog Browser"
        open={catalogModalOpen}
        onCancel={() => {
          setCatalogModalOpen(false);
          setSelectedCatalogKeys([]);
          setSelectedCatalogMap(new Map());
        }}
        width={850}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setCatalogModalOpen(false);
              setSelectedCatalogKeys([]);
              setSelectedCatalogMap(new Map());
            }}
          >
            Cancel
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handleConfirmCatalogSelection}
            disabled={selectedCatalogKeys.length === 0}
          >
            Add Selected ({selectedCatalogKeys.length}) to Print List
          </Button>
        ]}
      >
        <Space direction="vertical" style={{ width: '100%', marginBottom: 12 }} size={10}>
          {/* Filter Bar inside modal */}
          <Row gutter={[8, 8]}>
            <Col xs={24} sm={8}>
              <Input
                placeholder="Search name, SKU, or barcode..."
                prefix={loadingCatalog ? <LoadingOutlined spin style={{ color: '#2563eb' }} /> : <SearchOutlined style={{ color: '#94a3b8' }} />}
                value={filterSearch}
                allowClear
                onChange={(e) => setFilterSearch(e.target.value)}
                onPressEnter={() => fetchCatalogProducts({ page: 1, search: filterSearch })}
              />
            </Col>
            <Col xs={12} sm={5}>
              <Select
                value={filterCategory}
                onChange={(val) => {
                  setFilterCategory(val);
                }}
                style={{ width: '100%' }}
                placeholder="Category"
              >
                <Option value="all">All Categories</Option>
                {settings.categories?.map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} sm={5}>
              <Select
                value={filterBrand}
                onChange={(val) => setFilterBrand(val)}
                style={{ width: '100%' }}
                placeholder="Brand"
              >
                <Option value="all">All Brands</Option>
                {settings.brands?.map((b) => (
                  <Option key={b.id} value={b.id}>
                    {b.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={6}>
              <Space>
                <Button
                  type="primary"
                  icon={<FilterOutlined />}
                  onClick={() => fetchCatalogProducts({ page: 1, search: filterSearch })}
                >
                  Filter
                </Button>
                <Button
                  onClick={() => {
                    setFilterSearch('');
                    setFilterCategory('all');
                    setFilterBrand('all');
                    setOnlyMissingBarcode(false);
                    fetchCatalogProducts({
                      page: 1,
                      search: '',
                      category_id: 'all',
                      brand_id: 'all',
                      missing: false
                    });
                  }}
                >
                  Reset
                </Button>
              </Space>
            </Col>
          </Row>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Switch
              checked={onlyMissingBarcode}
              onChange={(checked) => {
                setOnlyMissingBarcode(checked);
              }}
            />
            <span style={{ fontSize: 12, color: adminTheme.text }}>
              Show only products without barcode
            </span>
          </div>
        </Space>

        <Table
          dataSource={catalogProducts}
          rowKey="id"
          size="small"
          loading={loadingCatalog}
          rowSelection={{
            selectedRowKeys: selectedCatalogKeys,
            onChange: (keys, selectedRows) => {
              setSelectedCatalogKeys(keys);
              setSelectedCatalogMap((prev) => {
                const next = new Map(prev);
                selectedRows.forEach((row) => {
                  if (row && row.id) next.set(row.id, row);
                });
                const keySet = new Set(keys);
                for (const id of next.keys()) {
                  if (!keySet.has(id)) next.delete(id);
                }
                return next;
              });
            }
          }}
          pagination={{
            current: catalogPagination.current,
            pageSize: catalogPagination.pageSize,
            total: catalogPagination.total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: (p, size) => fetchCatalogProducts({ page: p, pageSize: size })
          }}
          columns={[
            {
              title: 'Product Name',
              dataIndex: 'name',
              key: 'name',
              render: (t, r) => (
                <div>
                  <strong>{t}</strong>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    {r.category_name} {r.brand_name ? `• ${r.brand_name}` : ''}
                  </div>
                </div>
              )
            },
            {
              title: 'Code / SKU',
              key: 'code',
              render: (_, r) => r.sku || r.code || '-'
            },
            {
              title: 'Barcode',
              key: 'barcode',
              render: (_, r) =>
                r.barcode ? (
                  <Tag color="blue">{r.barcode}</Tag>
                ) : (
                  <Tag color="volcano">Missing</Tag>
                )
            },
            {
              title: 'Price',
              dataIndex: 'price',
              key: 'price',
              render: (p) => formatCurrency(p)
            }
          ]}
        />
      </Modal>

      {/* 
        =========================================================================
        GENERATE MISSING BARCODES MODAL
        =========================================================================
      */}
      <Modal
        title={
          <Space>
            <ThunderboltOutlined style={{ color: '#f59e0b' }} />
            <span>Batch Generate Missing Barcodes</span>
          </Space>
        }
        open={generateModalOpen}
        onCancel={() => setGenerateModalOpen(false)}
        onOk={handleBatchGenerate}
        confirmLoading={generating}
        okText="Generate Barcodes Now"
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Alert
            type="warning"
            showIcon
            message="Automatic Collision-Free Barcode Generation"
            description={`Currently, there are approximately ${settings.missing_barcodes_count || 0} products missing barcodes in your catalog. Generating barcodes will assign unique, validated numbers based on the selected symbology.`}
          />

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>
              Barcode Symbology:
            </label>
            <Select
              value={generateSymbology}
              onChange={(val) => setGenerateSymbology(val)}
              style={{ width: '100%' }}
            >
              <Option value="CODE128">CODE128 (Recommended - Alphanumeric standard)</Option>
              <Option value="EAN13">EAN-13 (13 Digits with Modulo 10 Checksum)</Option>
              <Option value="UPC">UPC-A (12 Digits Retail Standard)</Option>
              <Option value="QR">QR Code (2D Data Matrix)</Option>
            </Select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>
              Prefix (for CODE128 / QR):
            </label>
            <Input
              value={generatePrefix}
              onChange={(e) => setGeneratePrefix(e.target.value.toUpperCase())}
              placeholder="e.g. AUR"
            />
          </div>
        </Space>
      </Modal>

      {/* 
        =========================================================================
        PRINT HISTORY DRAWER
        =========================================================================
      */}
      <Drawer
        title={
          <Space>
            <HistoryOutlined style={{ color: '#2563eb' }} />
            <span>Barcode Print History & Audit Log</span>
          </Space>
        }
        open={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        width={620}
      >
        <Table
          dataSource={printLogs}
          rowKey="id"
          size="small"
          loading={loadingLogs}
          pagination={{
            current: logsPagination.current,
            pageSize: logsPagination.pageSize,
            total: logsPagination.total,
            onChange: (p) => fetchPrintLogs(p)
          }}
          columns={[
            {
              title: 'Printed At',
              dataIndex: 'printed_at',
              key: 'printed_at',
              render: (d) => new Date(d).toLocaleString()
            },
            {
              title: 'Product',
              key: 'product',
              render: (_, r) => (
                <div>
                  <div style={{ fontWeight: 600 }}>{r.product?.name || `Product #${r.product_id}`}</div>
                  <Tag color="blue" style={{ fontSize: 10 }}>
                    {r.product?.barcode || r.product?.code || '-'}
                  </Tag>
                </div>
              )
            },
            {
              title: 'Qty',
              dataIndex: 'quantity',
              key: 'quantity',
              width: 50,
              render: (q) => <strong>{q}</strong>
            },
            {
              title: 'Format',
              key: 'format',
              render: (_, r) => (
                <div style={{ fontSize: 11 }}>
                  <div>{r.label_size}</div>
                  <Tag color="cyan">{r.barcode_type}</Tag>
                </div>
              )
            },
            {
              title: 'Admin',
              key: 'admin',
              render: (_, r) => r.printed_by_user?.name || `Admin #${r.printed_by}`
            },
            {
              title: '',
              key: 'reprint',
              render: (_, r) => (
                <Button
                  size="small"
                  type="link"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    if (r.product) {
                      handleAddProduct({ ...r.product, quantity: r.quantity });
                      setHistoryDrawerOpen(false);
                    }
                  }}
                >
                  Queue
                </Button>
              )
            }
          ]}
        />
      </Drawer>

      {/* 
        =========================================================================
        LABEL TEMPLATES MANAGER MODAL
        =========================================================================
      */}
      <Modal
        title={
          <Space>
            <SettingOutlined style={{ color: '#2563eb' }} />
            <span>Label Templates Manager</span>
          </Space>
        }
        open={templatesModalOpen}
        onCancel={() => setTemplatesModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setTemplatesModalOpen(false)}>
            Close
          </Button>
        ]}
        width={750}
      >
        <Table
          dataSource={templatesList}
          rowKey="id"
          size="small"
          loading={loadingTemplates}
          pagination={false}
          columns={[
            {
              title: 'Template Name',
              dataIndex: 'name',
              key: 'name',
              render: (t, r) => (
                <Space>
                  <strong>{t}</strong>
                  {r.is_default && <Tag color="green">Default</Tag>}
                </Space>
              )
            },
            {
              title: 'Dimensions',
              key: 'dimensions',
              render: (_, r) => `${r.width_mm}mm × ${r.height_mm}mm`
            },
            {
              title: 'Columns',
              dataIndex: 'columns',
              key: 'columns'
            },
            {
              title: 'Elements',
              key: 'elements',
              render: (_, r) => (
                <Space wrap size={2}>
                  {r.show_name && <Tag>Name</Tag>}
                  {r.show_price && <Tag>Price</Tag>}
                  {r.show_sku && <Tag>SKU</Tag>}
                  {r.show_barcode_text && <Tag>Code</Tag>}
                </Space>
              )
            }
          ]}
        />
      </Modal>

      {/* 
        =========================================================================
        PURCHASE IMPORT MODAL
        =========================================================================
      */}
      <Modal
        title="Import from Purchase Order"
        open={importPurchaseModalOpen}
        onCancel={() => setImportPurchaseModalOpen(false)}
        onOk={handleImportPurchase}
        okText="Import Items"
      >
        <Space direction="vertical" orientation="left" style={{ width: '100%' }}>
          <Text>Enter the Purchase Reference or Order ID to automatically import received items and quantities:</Text>
          <Input
            placeholder="e.g. 1"
            value={importPurchaseId}
            onChange={(e) => setImportPurchaseId(e.target.value)}
            onPressEnter={handleImportPurchase}
          />
        </Space>
      </Modal>

      {/* 
        =========================================================================
        TRANSFER IMPORT MODAL
        =========================================================================
      */}
      <Modal
        title="Import from Stock Transfer"
        open={importTransferModalOpen}
        onCancel={() => setImportTransferModalOpen(false)}
        onOk={handleImportTransfer}
        okText="Import Items"
      >
        <Space direction="vertical" orientation="left" style={{ width: '100%' }}>
          <Text>Enter the Transfer ID to automatically import transfer items and quantities:</Text>
          <Input
            placeholder="e.g. 1"
            value={importTransferId}
            onChange={(e) => setImportTransferId(e.target.value)}
            onPressEnter={handleImportTransfer}
          />
        </Space>
      </Modal>
    </div>
  );
}
