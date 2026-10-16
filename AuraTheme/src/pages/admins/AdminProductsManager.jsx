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
  Alert,
  Flex,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  WarningOutlined,
  EyeOutlined,
  FilterOutlined,
  DownloadOutlined,
  ThunderboltFilled,
  FireOutlined,
  RiseOutlined,
  SyncOutlined,
  CheckSquareOutlined,
  ShopOutlined,
  UploadOutlined,
  PictureOutlined,
  BranchesOutlined,
  ProjectOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import axios from 'axios';

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
const resetLiveProducts = () => {
  try {
    localStorage.removeItem(LIVE_PRODUCTS_KEY);
  } catch (_) {}
};
import { formatCurrency } from '../../utils/uiTheme';
import { useAdminTheme } from '../../hooks/useAdminTheme';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function AdminProductsManager() {
  const adminTheme = useAdminTheme();
  const [productsList, setProductsList] = useState(() => getLiveProducts());
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStock, setSelectedStock] = useState('all');
  const [selectedShop, setSelectedShop] = useState('all');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('all');

  // Metadata from Database
  const [billersList, setBillersList] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [modalProjects, setModalProjects] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [unitsList, setUnitsList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [warehousesList, setWarehousesList] = useState([]);

  // Modals & Forms
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [modalActiveTab, setModalActiveTab] = useState('required');
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Bulk Price Modal
  const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);
  const [bulkAdjustmentType, setBulkAdjustmentType] = useState('percent_discount');
  const [bulkAdjustmentValue, setBulkAdjustmentValue] = useState(10);
  const [bulkBadgeValue, setBulkBadgeValue] = useState('🔥 Hot Deal');
  const [isSyncing, setIsSyncing] = useState(false);

  // Image Controls State
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryUrlInput, setGalleryUrlInput] = useState('');
  const coverFileInputRef = useRef(null);
  const galleryFileInputRef = useRef(null);

  // Variants State
  const [hasVariants, setHasVariants] = useState(false);
  const [variantAttributeTags, setVariantAttributeTags] = useState(['Color: Blue', 'Size: M']);
  const [newVariantTag, setNewVariantTag] = useState('');
  const [variantRows, setVariantRows] = useState([
    { id: 1, name: 'Standard - Blue', warehouse_id: 1, priceAddition: 0, quantity: 20 },
    { id: 2, name: 'Standard - Black', warehouse_id: 1, priceAddition: 0.5, quantity: 15 },
  ]);

  const [productForm] = Form.useForm();

  // 1. Fetch Metadata (Billers, Projects, Categories, Units, Brands, Warehouses)
  const fetchMetadata = async () => {
    try {
      const [billersRes, projectsRes, categoriesRes, unitsRes, brandsRes, warehousesRes] = await Promise.allSettled([
        axios.get('/api/billers'),
        axios.get('/api/projects'),
        axios.get('/api/categories'),
        axios.get('/api/units'),
        axios.get('/api/brands'),
        axios.get('/api/warehouses'),
      ]);

      if (billersRes.status === 'fulfilled' && billersRes.value.data?.data) {
        setBillersList(billersRes.value.data.data);
      }
      if (projectsRes.status === 'fulfilled' && projectsRes.value.data?.data) {
        setProjectsList(projectsRes.value.data.data);
      }
      if (categoriesRes.status === 'fulfilled') {
        const rawCats = categoriesRes.value.data?.data || categoriesRes.value.data;
        if (Array.isArray(rawCats)) setCategoriesList(rawCats);
      }
      if (unitsRes.status === 'fulfilled' && unitsRes.value.data?.data) {
        setUnitsList(unitsRes.value.data.data);
      }
      if (brandsRes.status === 'fulfilled') {
        const rawBrands = brandsRes.value.data?.data || brandsRes.value.data;
        if (Array.isArray(rawBrands)) setBrandsList(rawBrands);
      }
      if (warehousesRes.status === 'fulfilled' && warehousesRes.value.data?.data) {
        setWarehousesList(warehousesRes.value.data.data);
      }
    } catch (err) {
      console.warn('Metadata loading note:', err.message);
    }
  };

  // 2. Fetch Live Products Catalog
  const fetchLiveCatalog = async () => {
    setIsSyncing(true);
    try {
      let prods = [];
      try {
        const res = await axios.get('/api/admin/products?limit=250');
        if ((res.data?.status || res.data?.success) && Array.isArray(res.data?.data) && res.data.data.length > 0) {
          prods = res.data.data;
        }
      } catch (_) {}

      if (!prods.length) {
        const publicRes = await axios.get('/api/products?limit=250');
        if (publicRes.data?.success && Array.isArray(publicRes.data?.data?.products)) {
          prods = publicRes.data.data.products;
        }
      }

      if (prods.length > 0) {
        setProductsList(prods);
        saveLiveProducts(prods);
      }
    } catch (err) {
      console.warn('Backend product fetch note:', err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
    fetchLiveCatalog();
  }, []);

  // Listen to external product updates
  useEffect(() => {
    const handleSync = () => {
      setProductsList(getLiveProducts());
    };
    window.addEventListener('aura_live_products_updated', handleSync);
    return () => window.removeEventListener('aura_live_products_updated', handleSync);
  }, []);

  // Handle dynamic project filtering by selected Biller / Store
  const handleBillerChange = (billerId) => {
    productForm.setFieldsValue({ biller_id: billerId, project_id: undefined });
    const related = projectsList.filter((p) => Number(p.biller_id) === Number(billerId));
    setModalProjects(related);
    if (related.length > 0) {
      productForm.setFieldsValue({ project_id: related[0].project_id });
    }
  };

  // Barcode generator (realistic 8-digit EAN/Barcode)
  const handleGenerateBarcode = () => {
    const prefix = '8858';
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const newBarcode = `${prefix}${randSuffix}`;
    productForm.setFieldsValue({ barcode: newBarcode });
    message.success(`Generated barcode: ${newBarcode}`);
  };

  // Cover Image File Upload (Base64 Preview)
  const handleCoverFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setCoverImageUrl(dataUrl);
      productForm.setFieldsValue({ image: dataUrl });
      message.success('Cover photo loaded');
    };
    reader.readAsDataURL(file);
  };

  // Gallery Images Multi-File Upload
  const handleGalleryFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setGalleryImages((prev) => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });
    message.success(`Added ${files.length} gallery image(s)`);
  };

  // Add Variant Tag
  const handleAddVariantTag = () => {
    if (newVariantTag.trim()) {
      setVariantAttributeTags((prev) => [...prev, newVariantTag.trim()]);
      setNewVariantTag('');
    }
  };

  // Add Variant Row
  const handleAddVariantRow = () => {
    const newId = Date.now();
    setVariantRows((prev) => [
      ...prev,
      {
        id: newId,
        name: `Option ${prev.length + 1}`,
        warehouse_id: warehousesList[0]?.id || 1,
        priceAddition: 0,
        quantity: 10,
      },
    ]);
  };

  const handleUpdateVariantRow = (index, field, value) => {
    setVariantRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleDeleteVariantRow = (index) => {
    setVariantRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setIsEditingMode(false);
    setCurrentEditId(null);
    setModalActiveTab('required');
    setCoverImageUrl('');
    setGalleryImages([]);
    setHasVariants(false);

    // Initial biller & related project
    const initialBiller = billersList[0]?.id || 3;
    const related = projectsList.filter((p) => Number(p.biller_id) === Number(initialBiller));
    setModalProjects(related);

    productForm.resetFields();
    productForm.setFieldsValue({
      type: 'standard',
      name: '',
      unit: unitsList[0]?.id || 1,
      purchase_unit: unitsList[0]?.id || 1,
      sale_unit: unitsList[0]?.id || 1,
      price: 0.20,
      cost: 0.10,
      currency: 'USD',
      biller_id: initialBiller,
      project_id: related[0]?.project_id || null,
      barcode: `8858${Math.floor(1000 + Math.random() * 9000)}`,
      category_id: categoriesList[0]?.id || 201,
      barcode_symbology: 'Code128',
      tax_rate: '0',
      tax_method: 'exclusive',
      alert_quantity: 5,
      expiry_alert_days: 30,
      stock_type: 'standard',
      inStock: true,
      stockCount: 50,
      details: '',
      product_details: '',
    });

    setIsProductModalOpen(true);
  };

  // Open Edit Modal
  const handleEditClick = (product) => {
    setIsEditingMode(true);
    setCurrentEditId(product.id);
    setModalActiveTab('required');

    const effectiveBiller = product.biller_id || 3;
    const related = projectsList.filter((p) => Number(p.biller_id) === Number(effectiveBiller));
    setModalProjects(related);

    setCoverImageUrl(product.image || '');
    setGalleryImages(Array.isArray(product.gallery) && product.gallery.length > 0 ? product.gallery : [product.image || '']);

    productForm.setFieldsValue({
      name: product.name,
      type: product.type || 'standard',
      code: product.code,
      barcode: product.barcode || product.code,
      price: product.price,
      cost: product.cost || 0.10,
      category_id: product.category_id || categoriesList[0]?.id || 201,
      biller_id: effectiveBiller,
      project_id: product.project_id || related[0]?.project_id || null,
      unit: product.unit || 1,
      purchase_unit: product.purchase_unit || product.unit || 1,
      sale_unit: product.sale_unit || product.unit || 1,
      currency: product.currency || 'USD',
      barcode_symbology: product.barcode_symbology || 'Code128',
      item_code: product.item_code || '',
      serial_no: product.serial_no || '',
      max_serial: product.max_serial || '',
      batch_numer: product.batch_numer || '',
      second_name: product.second_name || '',
      weight: product.weight || '',
      brand: product.brand || '',
      tax_rate: String(product.tax_rate ?? '0'),
      tax_method: product.tax_method || 'exclusive',
      alert_quantity: product.alert_quantity || 5,
      expiry_alert_days: product.expiry_alert_days || 30,
      stock_type: product.stock_type || 'standard',
      inStock: product.inStock ?? true,
      stockCount: product.stockCount ?? 50,
      details: product.details || product.description || '',
      product_details: product.product_details || '',
      supplier1: product.supplier1 || '',
      supplier1price: product.supplier1price || 0,
      supplier1_part_no: product.supplier1_part_no || '',
      promotion: product.promotion ? 1 : 0,
      promo_price: product.promo_price || null,
    });

    setIsProductModalOpen(true);
  };

  // Submit Add or Edit Product
  const handleSaveProduct = async () => {
    try {
      const values = await productForm.validateFields();
      setIsSavingProduct(true);

      const assignedStore = billersList.find((b) => Number(b.id) === Number(values.biller_id));
      const assignedProject = projectsList.find((p) => Number(p.project_id) === Number(values.project_id));
      const assignedCat = categoriesList.find((c) => Number(c.id) === Number(values.category_id));

      const payload = {
        ...values,
        image: coverImageUrl || values.image || '',
        gallery: galleryImages,
        variants: hasVariants ? variantRows : [],
        quantity: Number(values.stockCount || 50),
        biller_id: values.biller_id,
        project_id: values.project_id,
      };

      if (isEditingMode && currentEditId) {
        // PUT update
        await axios.put(`/api/admin/products/${currentEditId}`, payload);
        message.success(`Saved changes for "${values.name}"`);
      } else {
        // POST create
        const res = await axios.post('/api/admin/products', payload);
        message.success(`Product "${values.name}" created successfully!`);
      }

      setIsProductModalOpen(false);
      productForm.resetFields();
      fetchLiveCatalog();
    } catch (err) {
      if (err.errorFields) {
        message.error('Please verify all required fields in the Required tab');
        setModalActiveTab('required');
      } else {
        console.error('Save product error:', err);
        message.error(err.response?.data?.message || err.message || 'Failed to save product');
      }
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Toggle single product stock
  const handleToggleSingleStock = async (id, currentVal) => {
    const nextVal = !currentVal;
    const updated = productsList.map((p) => (p.id === id ? { ...p, inStock: nextVal } : p));
    setProductsList(updated);
    saveLiveProducts(updated);
    message.success(`Updated status to ${nextVal ? 'In Stock' : 'Out of Stock'}`);
    try {
      await axios.put(`/api/admin/products/${id}`, {
        quantity: nextVal ? 50 : 0,
      });
    } catch (_) {}
  };

  // Delete single product
  const handleDeleteSingle = async (id) => {
    const updated = productsList.filter((p) => p.id !== id);
    setSelectedRowKeys((prev) => prev.filter((k) => k !== id));
    setProductsList(updated);
    saveLiveProducts(updated);
    message.success('Product deleted successfully');
    try {
      await axios.delete(`/api/admin/products/${id}`);
    } catch (_) {}
  };

  // Bulk Availability
  const handleBulkToggleAvailability = (targetStatus) => {
    if (selectedRowKeys.length === 0) return;
    const updated = productsList.map((p) => {
      if (selectedRowKeys.includes(p.id)) {
        return { ...p, inStock: targetStatus };
      }
      return p;
    });
    setProductsList(updated);
    saveLiveProducts(updated);
    message.success(`Updated availability for ${selectedRowKeys.length} products`);
    setSelectedRowKeys([]);
  };

  // Bulk Delete
  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) return;
    const count = selectedRowKeys.length;
    const updated = productsList.filter((p) => !selectedRowKeys.includes(p.id));
    selectedRowKeys.forEach((id) => {
      axios.delete(`/api/admin/products/${id}`).catch(() => {});
    });
    setProductsList(updated);
    saveLiveProducts(updated);
    setSelectedRowKeys([]);
    message.success(`Deleted ${count} products from catalog`);
  };

  // Bulk Price Update
  const handleApplyBulkPricing = async () => {
    if (selectedRowKeys.length === 0) return;
    const updated = productsList.map((p) => {
      if (!selectedRowKeys.includes(p.id)) return p;

      let newPrice = p.price;
      let newOriginalPrice = p.originalPrice || p.price;
      let newBadge = p.badge;

      if (bulkAdjustmentType === 'percent_discount') {
        const factor = (100 - bulkAdjustmentValue) / 100;
        newOriginalPrice = Math.max(newOriginalPrice, p.price);
        newPrice = Math.round(p.price * factor * 100) / 100;
        newBadge = '⚡ Price Drop';
      } else if (bulkAdjustmentType === 'percent_increase') {
        const factor = (100 + bulkAdjustmentValue) / 100;
        newPrice = Math.round(p.price * factor * 100) / 100;
      } else if (bulkAdjustmentType === 'fixed_discount') {
        newOriginalPrice = Math.max(newOriginalPrice, p.price);
        newPrice = Math.max(0.1, Math.round((p.price - bulkAdjustmentValue) * 100) / 100);
        newBadge = '🔥 Hot Deal';
      } else if (bulkAdjustmentType === 'set_badge') {
        newBadge = bulkBadgeValue === 'None' ? null : bulkBadgeValue;
      }

      return {
        ...p,
        price: newPrice,
        originalPrice: newOriginalPrice,
        badge: newBadge,
      };
    });

    setProductsList(updated);
    saveLiveProducts(updated);
    message.success(`Updated pricing & badges for ${selectedRowKeys.length} items`);
    try {
      await axios.post('/api/admin/products/bulk-price', {
        productIds: selectedRowKeys,
        type: bulkAdjustmentType,
        value: bulkAdjustmentValue,
      });
    } catch (_) {}
    setIsBulkPriceModalOpen(false);
    setSelectedRowKeys([]);
  };

  // Export CSV
  const handleExportCsv = () => {
    const targetItems =
      selectedRowKeys.length > 0
        ? productsList.filter((p) => selectedRowKeys.includes(p.id))
        : filteredProducts;

    const headers = ['ID', 'Code', 'Name', 'Category', 'Store', 'Project', 'Price', 'InStock', 'StockCount'];
    const rows = targetItems.map((p) => [
      p.id,
      `"${p.code || ''}"`,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${p.category || ''}"`,
      `"${(p.shopName || p.billerName || '').replace(/"/g, '""')}"`,
      `"${(p.projectName || '').replace(/"/g, '""')}"`,
      p.price,
      p.inStock ? 'Yes' : 'No',
      p.stockCount ?? 50,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aura_inventory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success(`Exported ${targetItems.length} products to CSV`);
  };

  // Metrics
  const metrics = useMemo(() => {
    const list = Array.isArray(productsList) ? productsList : [];
    const total = list.length;
    const inStockCount = list.filter((p) => p.inStock).length;
    const outOfStockCount = total - inStockCount;
    const lowStockCount = list.filter((p) => (p.stockCount ?? 15) < 10).length;
    const totalValue = list.reduce((acc, p) => acc + (p.price || 0) * (p.stockCount ?? 50), 0);

    return {
      total,
      inStockCount,
      outOfStockCount,
      lowStockCount,
      totalValue,
      storesCount: billersList.length || 21,
      projectsCount: projectsList.length || 25,
    };
  }, [productsList, billersList, projectsList]);

  // Filtering
  const filteredProducts = useMemo(() => {
    const list = Array.isArray(productsList) ? productsList : [];
    return list.filter((item) => {
      const matchSearch =
        !searchText ||
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (item.code && item.code.toLowerCase().includes(searchText.toLowerCase())) ||
        (item.brand && item.brand.toLowerCase().includes(searchText.toLowerCase())) ||
        (item.shopName && item.shopName.toLowerCase().includes(searchText.toLowerCase())) ||
        (item.billerName && item.billerName.toLowerCase().includes(searchText.toLowerCase())) ||
        (item.projectName && item.projectName.toLowerCase().includes(searchText.toLowerCase()));

      const matchCategory =
        selectedCategory === 'all' ||
        item.category === selectedCategory ||
        String(item.category_id) === String(selectedCategory);

      const matchStock =
        selectedStock === 'all' ||
        (selectedStock === 'in_stock' && item.inStock) ||
        (selectedStock === 'out_of_stock' && !item.inStock);

      const matchShop =
        selectedShop === 'all' ||
        String(item.biller_id) === String(selectedShop) ||
        item.shopId === selectedShop ||
        item.seller === selectedShop;

      const matchProject =
        selectedProjectFilter === 'all' ||
        String(item.project_id) === String(selectedProjectFilter);

      return matchSearch && matchCategory && matchStock && matchShop && matchProject;
    });
  }, [productsList, searchText, selectedCategory, selectedStock, selectedShop, selectedProjectFilter]);

  // Table Columns Definition
  const columns = [
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'name',
      width: 290,
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 10,
              overflow: 'hidden',
              background: adminTheme.cardMuted,
              flexShrink: 0,
              border: `1px solid ${adminTheme.border}`,
            }}
          >
            <img
              src={record.image}
              alt={text}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/assets/uploads/no_image.png';
              }}
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                color: adminTheme.text,
                fontSize: 13.5,
                lineHeight: 1.3,
                marginBottom: 2,
              }}
            >
              {text}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: adminTheme.subtext, fontFamily: 'monospace' }}>
                {record.code || `ID: ${record.id}`}
              </span>
              {record.badge && (
                <Tag
                  color="volcano"
                  style={{
                    fontSize: 10,
                    lineHeight: '16px',
                    paddingInline: 5,
                    borderRadius: 999,
                    border: 'none',
                    fontWeight: 700,
                  }}
                >
                  {record.badge}
                </Tag>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Store & Project',
      key: 'store_project',
      width: 210,
      render: (_, record) => {
        const storeLabel = record.shopName || record.billerName || `Store #${record.biller_id || 1}`;
        const projectLabel = record.projectName || (record.project_id ? `Project #${record.project_id}` : 'General Catalog');

        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <ShopOutlined style={{ color: '#2563eb', fontSize: 13 }} />
              <span style={{ fontWeight: 700, fontSize: 12.5, color: adminTheme.text }}>
                {storeLabel}
              </span>
            </div>
            <Tag
              icon={<FolderOutlined />}
              color="cyan"
              style={{
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                maxWidth: 180,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {projectLabel}
            </Tag>
          </div>
        );
      },
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 140,
      render: (cat) => (
        <Tag
          color="blue"
          style={{
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'capitalize',
          }}
        >
          {cat || 'General'}
        </Tag>
      ),
    },
    {
      title: 'Price & Cost',
      dataIndex: 'price',
      key: 'price',
      width: 130,
      sorter: (a, b) => a.price - b.price,
      render: (price, record) => (
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#16a34a' }}>
            {formatCurrency(price)}
          </div>
          {record.cost > 0 && (
            <div style={{ fontSize: 11, color: adminTheme.subtext }}>
              Cost: {formatCurrency(record.cost)}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Live Status',
      dataIndex: 'inStock',
      key: 'inStock',
      width: 125,
      render: (inStock, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Switch
            checked={inStock}
            size="small"
            onChange={() => handleToggleSingleStock(record.id, inStock)}
            style={{
              backgroundColor: inStock ? '#16a34a' : '#cbd5e1',
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: inStock ? '#16a34a' : '#dc2626',
            }}
          >
            {inStock ? 'Available' : 'Out of Stock'}
          </span>
        </div>
      ),
    },
    {
      title: 'Stock Qty',
      dataIndex: 'stockCount',
      key: 'stockCount',
      width: 110,
      sorter: (a, b) => (a.stockCount ?? 50) - (b.stockCount ?? 50),
      render: (qty) => {
        const count = qty ?? 45;
        const isLow = count < 10;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 700, color: isLow ? '#dc2626' : adminTheme.text }}>
              {count} units
            </span>
            {isLow && (
              <Tooltip title="Stock is running low">
                <WarningOutlined style={{ color: '#ea580c', fontSize: 13 }} />
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size={6}>
          <Tooltip title="Edit Product">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#2563eb' }} />}
              onClick={() => handleEditClick(record)}
            />
          </Tooltip>
          <Tooltip title="View on Store Website">
            <Link to={`/products#${record.id}`} target="_blank" rel="noopener noreferrer">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined style={{ color: '#059669' }} />}
              />
            </Link>
          </Tooltip>
          <Tooltip title="Delete Product">
            <Popconfirm
              title="Delete this product?"
              description={`Are you sure you want to remove "${record.name}" from the store catalog?`}
              onConfirm={() => handleDeleteSingle(record.id)}
              okText="Yes, delete"
              cancelText="Cancel"
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
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  const modalTabs = [
    { key: 'required', label: 'Required' },
    { key: 'details', label: 'Details' },
    { key: 'variants', label: 'Variants' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'promotion', label: 'Promotion' },
    { key: 'addon', label: 'Add On' },
    { key: 'racks', label: 'Racks' },
  ];

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* 1. Header Banner & Quick Controls */}
      <Card
        style={{
          borderRadius: 20,
          border: `1px solid ${adminTheme.border}`,
          background: `linear-gradient(135deg, ${adminTheme.card} 0%, rgba(37, 99, 235, 0.04) 100%)`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <Tag
                color="blue"
                style={{
                  borderRadius: 999,
                  fontWeight: 800,
                  fontSize: 11,
                  padding: '2px 10px',
                  border: 'none',
                }}
              >
                LIVE ERP & STORE INVENTORY
              </Tag>
              <span style={{ fontSize: 12, color: adminTheme.subtext }}>
                Store & Projects linked by Biller ID (aura_companies)
              </span>
            </div>
            <Title level={3} style={{ margin: 0, color: adminTheme.text, fontWeight: 900 }}>
              Inventory & Products Controller
            </Title>
          </div>

          <Space size={10} wrap>
            <Button
              icon={<SyncOutlined spin={isSyncing} />}
              onClick={() => {
                fetchLiveCatalog();
                fetchMetadata();
                message.success('Synchronized catalog and store metadata with database');
              }}
              style={{ fontWeight: 700 }}
            >
              Sync Database
            </Button>

            <Popconfirm
              title="Reset Catalog to Defaults?"
              description="This will reload all products directly from the database."
              onConfirm={() => {
                resetLiveProducts();
                fetchLiveCatalog();
                setSelectedRowKeys([]);
                message.success('Catalog refreshed from database');
              }}
              okText="Yes, reset"
              cancelText="Cancel"
            >
              <Button style={{ fontWeight: 600 }}>Reset Defaults</Button>
            </Popconfirm>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenCreateModal}
              style={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #1677ff, #0958d9)',
                boxShadow: '0 4px 14px rgba(22, 119, 255, 0.3)',
                borderRadius: 10,
              }}
            >
              + Add Product
            </Button>
          </Space>
        </Flex>
      </Card>

      {/* 2. Quick Metrics Dashboard Widget at Top */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: 18,
              border: `1px solid ${adminTheme.border}`,
              background: adminTheme.card,
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            }}
            styles={{ body: { padding: 18 } }}
          >
            <Flex justify="space-between" align="start">
              <div>
                <Text style={{ color: adminTheme.subtext, fontSize: 12, fontWeight: 600 }}>
                  ACTIVE PRODUCTS
                </Text>
                <Title level={3} style={{ margin: '6px 0 2px', color: adminTheme.text, fontWeight: 900 }}>
                  {metrics.total} Items
                </Title>
                <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>
                  {metrics.inStockCount} in stock ({Math.round((metrics.inStockCount / (metrics.total || 1)) * 100)}%)
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(22, 163, 74, 0.1)',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                }}
              >
                <ShoppingCartOutlined />
              </div>
            </Flex>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: 18,
              border: `1px solid ${adminTheme.border}`,
              background: adminTheme.card,
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            }}
            styles={{ body: { padding: 18 } }}
          >
            <Flex justify="space-between" align="start">
              <div>
                <Text style={{ color: adminTheme.subtext, fontSize: 12, fontWeight: 600 }}>
                  ACTIVE STORES / BILLERS
                </Text>
                <Title level={3} style={{ margin: '6px 0 2px', color: '#2563eb', fontWeight: 900 }}>
                  {metrics.storesCount} Stores
                </Title>
                <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 700 }}>
                  Linked via aura_companies (biller)
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(37, 99, 235, 0.1)',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                }}
              >
                <ShopOutlined />
              </div>
            </Flex>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: 18,
              border: `1px solid ${adminTheme.border}`,
              background: adminTheme.card,
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            }}
            styles={{ body: { padding: 18 } }}
          >
            <Flex justify="space-between" align="start">
              <div>
                <Text style={{ color: adminTheme.subtext, fontSize: 12, fontWeight: 600 }}>
                  STORE PROJECTS
                </Text>
                <Title level={3} style={{ margin: '6px 0 2px', color: '#7c3aed', fontWeight: 900 }}>
                  {metrics.projectsCount} Projects
                </Title>
                <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700 }}>
                  Filtered by store biller_id
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(124, 58, 237, 0.1)',
                  color: '#7c3aed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                }}
              >
                <ProjectOutlined />
              </div>
            </Flex>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: 18,
              border: `1px solid ${adminTheme.border}`,
              background: adminTheme.card,
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            }}
            styles={{ body: { padding: 18 } }}
          >
            <Flex justify="space-between" align="start">
              <div>
                <Text style={{ color: adminTheme.subtext, fontSize: 12, fontWeight: 600 }}>
                  INVENTORY ALERT
                </Text>
                <Title level={3} style={{ margin: '6px 0 2px', color: '#dc2626', fontWeight: 900 }}>
                  {metrics.outOfStockCount + metrics.lowStockCount} Items
                </Title>
                <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 700 }}>
                  {metrics.outOfStockCount} out of stock, {metrics.lowStockCount} low
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(220, 38, 38, 0.1)',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                }}
              >
                <WarningOutlined />
              </div>
            </Flex>
          </Card>
        </Col>
      </Row>

      {/* 3. Search & Multi-Column Filters Toolbar */}
      <Card
        style={{
          borderRadius: 16,
          border: `1px solid ${adminTheme.border}`,
          background: adminTheme.card,
        }}
        styles={{ body: { padding: '16px 20px' } }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={6}>
            <Input
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Search product name, code, store, project..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              size="middle"
              style={{ borderRadius: 10 }}
            />
          </Col>

          {/* Filter by Store / Biller */}
          <Col xs={12} sm={6} md={4}>
            <Select
              value={selectedShop}
              onChange={(val) => {
                setSelectedShop(val);
                setSelectedProjectFilter('all');
              }}
              style={{ width: '100%' }}
              size="middle"
              showSearch
              optionFilterProp="children"
            >
              <Option value="all">🏪 All Stores</Option>
              {billersList.map((b) => (
                <Option key={b.id} value={b.id}>
                  {b.name || b.company}
                </Option>
              ))}
            </Select>
          </Col>

          {/* Filter by Project */}
          <Col xs={12} sm={6} md={4}>
            <Select
              value={selectedProjectFilter}
              onChange={setSelectedProjectFilter}
              style={{ width: '100%' }}
              size="middle"
              showSearch
              optionFilterProp="children"
            >
              <Option value="all">📁 All Projects</Option>
              {projectsList
                .filter((p) => selectedShop === 'all' || Number(p.biller_id) === Number(selectedShop))
                .map((p) => (
                  <Option key={p.project_id} value={p.project_id}>
                    {p.project_name}
                  </Option>
                ))}
            </Select>
          </Col>

          {/* Filter by Category */}
          <Col xs={12} sm={6} md={3}>
            <Select
              value={selectedCategory}
              onChange={setSelectedCategory}
              style={{ width: '100%' }}
              size="middle"
              showSearch
              optionFilterProp="children"
            >
              <Option value="all">All Categories</Option>
              {categoriesList.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.name}
                </Option>
              ))}
            </Select>
          </Col>

          {/* Filter by Stock */}
          <Col xs={12} sm={6} md={3}>
            <Select
              value={selectedStock}
              onChange={setSelectedStock}
              style={{ width: '100%' }}
              size="middle"
            >
              <Option value="all">All Stock</Option>
              <Option value="in_stock">Available</Option>
              <Option value="out_of_stock">Out of Stock</Option>
            </Select>
          </Col>

          {/* Export CSV */}
          <Col xs={24} sm={6} md={4} style={{ textAlign: 'right' }}>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportCsv}
              style={{ fontWeight: 600, width: '100%' }}
            >
              Export CSV
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 4. Bulk Actions Toolbar (Appears when rows selected) */}
      {selectedRowKeys.length > 0 && (
        <div
          style={{
            background: adminTheme.isDark
              ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
              : 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            padding: '12px 20px',
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            boxShadow: adminTheme.isDark
              ? '0 10px 25px rgba(0, 0, 0, 0.45)'
              : '0 10px 25px rgba(15, 23, 42, 0.2)',
            border: `1px solid ${adminTheme.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Badge count={selectedRowKeys.length} style={{ backgroundColor: '#2563eb' }} />
            <span style={{ color: '#ffffff', fontWeight: 800, fontSize: 13 }}>
              Products Selected
            </span>
            <Button
              type="link"
              size="small"
              onClick={() => setSelectedRowKeys([])}
              style={{ color: '#94a3b8', padding: 0 }}
            >
              Clear selection
            </Button>
          </div>

          <Space size={8} wrap>
            <Button
              size="small"
              icon={<CheckCircleOutlined style={{ color: '#22c55e' }} />}
              onClick={() => handleBulkToggleAvailability(true)}
              style={{ fontWeight: 700 }}
            >
              Mark In Stock
            </Button>

            <Button
              size="small"
              icon={<CloseCircleOutlined style={{ color: '#ef4444' }} />}
              onClick={() => handleBulkToggleAvailability(false)}
              style={{ fontWeight: 700 }}
            >
              Mark Out of Stock
            </Button>

            <Button
              size="small"
              type="primary"
              icon={<DollarOutlined />}
              onClick={() => setIsBulkPriceModalOpen(true)}
              style={{ fontWeight: 700, background: '#f59e0b' }}
            >
              Update Pricing in Bulk
            </Button>

            <Popconfirm
              title={`Delete ${selectedRowKeys.length} selected products?`}
              description="This will permanently delete the selected items from the online store catalog."
              onConfirm={handleBulkDelete}
              okText="Yes, delete all"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger icon={<DeleteOutlined />} style={{ fontWeight: 700 }}>
                Delete Selected
              </Button>
            </Popconfirm>
          </Space>
        </div>
      )}

      {/* 5. Main Products Table */}
      <Card
        style={{
          borderRadius: 18,
          border: `1px solid ${adminTheme.border}`,
          background: adminTheme.card,
          boxShadow: '0 4px 18px rgba(0,0,0,0.02)',
        }}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredProducts}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} products`,
            style: { padding: '16px 20px' },
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 6. Multi-Tab Product Add/Edit Modal (Matching ERP Screenshots) */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#1677ff',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
            >
              {isEditingMode ? <EditOutlined /> : <PlusOutlined />}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: adminTheme.text }}>
                {isEditingMode ? 'Edit Inventory Product' : 'Add Product'}
              </div>
              <div style={{ fontSize: 11, color: adminTheme.subtext, fontWeight: 500 }}>
                Inventory catalog item with Store, Project & Image controls
              </div>
            </div>
          </div>
        }
        open={isProductModalOpen}
        onCancel={() => {
          setIsProductModalOpen(false);
          productForm.resetFields();
        }}
        width={1080}
        destroyOnHidden
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Button
              type="primary"
              size="large"
              style={{
                background: '#1677ff',
                borderColor: '#1677ff',
                fontWeight: 700,
                borderRadius: 8,
                minWidth: 160,
              }}
              onClick={handleSaveProduct}
              loading={isSavingProduct}
              icon={isEditingMode ? <CheckCircleOutlined /> : <PlusOutlined />}
            >
              {isEditingMode ? 'Save Product Changes' : 'Add Product'}
            </Button>
            <Space>
              <Button onClick={() => productForm.resetFields()}>Reset</Button>
              <Button onClick={() => setIsProductModalOpen(false)}>Cancel</Button>
            </Space>
          </div>
        }
      >
        <div style={{ marginTop: 12 }}>
          {/* Top 7 Tabs Bar (Image 1, 2, 3) */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              borderBottom: `2px solid ${adminTheme.border}`,
              marginBottom: 20,
              paddingBottom: 4,
              overflowX: 'auto',
            }}
          >
            {modalTabs.map((tab) => {
              const isActive = modalActiveTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setModalActiveTab(tab.key)}
                  style={{
                    padding: '8px 16px',
                    fontWeight: 700,
                    fontSize: 13,
                    borderRadius: '8px 8px 0 0',
                    border: 'none',
                    background: isActive
                      ? '#1677ff'
                      : adminTheme.isDark
                      ? '#1e293b'
                      : '#f1f5f9',
                    color: isActive ? '#ffffff' : adminTheme.subtext,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  [ {tab.label} ]
                </button>
              );
            })}
          </div>

          <Form form={productForm} layout="vertical">
            {/* TAB 1: [ Required ] (Image 1) */}
            <div style={{ display: modalActiveTab === 'required' ? 'block' : 'none' }}>
              <Row gutter={16}>
                {/* Column 1: Left */}
                <Col xs={24} md={8}>
                  <Form.Item name="type" label="Type *" rules={[{ required: true, message: 'Select type' }]}>
                    <Select placeholder="Select type">
                      <Option value="standard">Standard</Option>
                      <Option value="combo">Combo</Option>
                      <Option value="digital">Digital</Option>
                      <Option value="service">Service</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item name="name" label="Name *" rules={[{ required: true, message: 'Enter product name' }]}>
                    <Input placeholder="e.g. Spoon plastic" />
                  </Form.Item>

                  <Form.Item name="unit" label="Unit *" rules={[{ required: true, message: 'Select unit' }]}>
                    <Select placeholder="Select unit">
                      {unitsList.map((u) => (
                        <Option key={u.id} value={u.id}>
                          {u.name || u.code}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item name="purchase_unit" label="Purchase Unit *" rules={[{ required: true, message: 'Select purchase unit' }]}>
                    <Select placeholder="Select purchase unit">
                      {unitsList.map((u) => (
                        <Option key={u.id} value={u.id}>
                          {u.name || u.code}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item name="price" label="Price *" rules={[{ required: true, message: 'Enter sales price' }]}>
                    <InputNumber min={0.01} step={0.01} precision={2} style={{ width: '100%' }} placeholder="0.20" />
                  </Form.Item>

                  {/* Store / Biller (aura_companies where group_name = 'biller') */}
                  <Form.Item name="biller_id" label="Store / Biller *" rules={[{ required: true, message: 'Select store' }]}>
                    <Select
                      placeholder="Select Store / Biller"
                      onChange={handleBillerChange}
                      showSearch
                      optionFilterProp="children"
                    >
                      {billersList.map((b) => (
                        <Option key={b.id} value={b.id}>
                          🏪 {b.name || b.company} (ID: {b.id})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                {/* Column 2: Center */}
                <Col xs={24} md={8}>
                  <Form.Item
                    name="barcode"
                    label="Barcode Symbology / Barcode *"
                    rules={[{ required: true, message: 'Enter or generate barcode' }]}
                  >
                    <Input
                      placeholder="e.g. 885888"
                      addonAfter={
                        <Tooltip title="Generate Random Barcode">
                          <SyncOutlined
                            style={{ cursor: 'pointer', color: '#1677ff' }}
                            onClick={handleGenerateBarcode}
                          />
                        </Tooltip>
                      }
                    />
                  </Form.Item>

                  <Form.Item name="category_id" label="Category *" rules={[{ required: true, message: 'Select category' }]}>
                    <Select placeholder="Select category" showSearch optionFilterProp="children">
                      {categoriesList.map((c) => (
                        <Option key={c.id} value={c.id}>
                          {c.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item name="sale_unit" label="Sale Unit *" rules={[{ required: true, message: 'Select sale unit' }]}>
                    <Select placeholder="Select sale unit">
                      {unitsList.map((u) => (
                        <Option key={u.id} value={u.id}>
                          {u.name || u.code}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item name="currency" label="Currency *" rules={[{ required: true, message: 'Select currency' }]}>
                    <Select placeholder="Select currency">
                      <Option value="USD">USD ($)</Option>
                      <Option value="KHR">KHR (៛)</Option>
                      <Option value="EUR">EUR (€)</Option>
                      <Option value="DOLLAR">DOLLAR ($)</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item name="cost" label="Cost *" rules={[{ required: true, message: 'Enter cost' }]}>
                    <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%' }} placeholder="0.10" />
                  </Form.Item>

                  {/* Project of Store (Filtered by biller_id) */}
                  <Form.Item
                    name="project_id"
                    label="Project of Store *"
                    rules={[{ required: true, message: 'Select project of store' }]}
                    extra={
                      modalProjects.length === 0 ? (
                        <span style={{ color: '#ea580c', fontSize: 11 }}>
                          No active projects found for this store.
                        </span>
                      ) : (
                        <span style={{ color: '#16a34a', fontSize: 11 }}>
                          Showing {modalProjects.length} projects linked to this store biller_id
                        </span>
                      )
                    }
                  >
                    <Select
                      placeholder={modalProjects.length ? 'Select project of store' : 'No projects for this store'}
                      showSearch
                      optionFilterProp="children"
                    >
                      {modalProjects.map((p) => (
                        <Option key={p.project_id} value={p.project_id}>
                          📁 {p.project_name} ({p.project_code || `PRJ-${p.project_id}`})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                {/* Column 3: Right (Image Controls & Gallery) */}
                <Col xs={24} md={8}>
                  {/* Single Cover Photo */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: adminTheme.text, fontSize: 13 }}>
                      Product Image (Cover)
                    </label>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input
                        type="file"
                        ref={coverFileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleCoverFileUpload}
                      />
                      <Button
                        icon={<DownloadOutlined style={{ transform: 'rotate(180deg)' }} />}
                        onClick={() => coverFileInputRef.current?.click()}
                        style={{ fontWeight: 600 }}
                      >
                        Browse ...
                      </Button>
                      <Input
                        placeholder="Or paste image URL"
                        value={coverImageUrl}
                        onChange={(e) => {
                          setCoverImageUrl(e.target.value);
                          productForm.setFieldsValue({ image: e.target.value });
                        }}
                        style={{ flex: 1 }}
                      />
                    </div>

                    {/* Cover Image Preview */}
                    <div
                      style={{
                        width: '100%',
                        height: 120,
                        borderRadius: 8,
                        border: `1.5px dashed ${adminTheme.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: adminTheme.cardMuted,
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      {coverImageUrl ? (
                        <>
                          <img
                            src={coverImageUrl}
                            alt="Cover Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                          <Button
                            type="primary"
                            danger
                            size="small"
                            shape="circle"
                            icon={<DeleteOutlined />}
                            style={{ position: 'absolute', top: 6, right: 6 }}
                            onClick={() => {
                              setCoverImageUrl('');
                              productForm.setFieldsValue({ image: '' });
                            }}
                          />
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', color: adminTheme.subtext, fontSize: 12 }}>
                          <PictureOutlined style={{ fontSize: 24, marginBottom: 4, display: 'block' }} />
                          No cover image selected
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Gallery Images (Tap More / Multi) */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: adminTheme.text, fontSize: 13 }}>
                      Product Gallery Images (Tap More / Multi)
                    </label>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input
                        type="file"
                        ref={galleryFileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        multiple
                        onChange={handleGalleryFileUpload}
                      />
                      <Button
                        icon={<PlusOutlined />}
                        onClick={() => galleryFileInputRef.current?.click()}
                        style={{ fontWeight: 600 }}
                      >
                        Browse ...
                      </Button>
                      <Button
                        onClick={() => {
                          if (galleryUrlInput.trim()) {
                            setGalleryImages((prev) => [...prev, galleryUrlInput.trim()]);
                            setGalleryUrlInput('');
                          }
                        }}
                      >
                        + Add URL
                      </Button>
                    </div>
                    <Input
                      placeholder="Paste gallery image URL"
                      value={galleryUrlInput}
                      onChange={(e) => setGalleryUrlInput(e.target.value)}
                      onPressEnter={() => {
                        if (galleryUrlInput.trim()) {
                          setGalleryImages((prev) => [...prev, galleryUrlInput.trim()]);
                          setGalleryUrlInput('');
                        }
                      }}
                      style={{ marginBottom: 8 }}
                    />

                    {/* Gallery Thumbnails List */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 8,
                        maxHeight: 110,
                        overflowY: 'auto',
                        padding: 6,
                        background: adminTheme.cardMuted,
                        borderRadius: 8,
                        border: `1px solid ${adminTheme.border}`,
                      }}
                    >
                      {galleryImages.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          style={{
                            height: 60,
                            borderRadius: 6,
                            overflow: 'hidden',
                            position: 'relative',
                            border: `1px solid ${adminTheme.border}`,
                            background: '#fff',
                          }}
                        >
                          <img
                            src={imgUrl}
                            alt={`Gallery ${idx}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <button
                            type="button"
                            onClick={() => setGalleryImages((prev) => prev.filter((_, i) => i !== idx))}
                            style={{
                              position: 'absolute',
                              top: 2,
                              right: 2,
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              background: 'rgba(239, 68, 68, 0.95)',
                              color: '#fff',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 10,
                              fontWeight: 900,
                              lineHeight: 1,
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {galleryImages.length === 0 && (
                        <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '16px 0' }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            No gallery images added yet
                          </Text>
                        </div>
                      )}
                    </div>
                  </div>
                </Col>
              </Row>
            </div>

            {/* TAB 2: [ Details ] (Image 2) */}
            <div style={{ display: modalActiveTab === 'details' ? 'block' : 'none' }}>
              <Row gutter={12}>
                <Col xs={24} sm={8}>
                  <Form.Item name="item_code" label="Item code">
                    <Input placeholder="e.g. ITM-001" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="serial_no" label="Serial">
                    <Input placeholder="e.g. SN-88902" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="max_serial" label="Max serial">
                    <Input placeholder="e.g. 50" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={8}>
                  <Form.Item name="batch_numer" label="Batch number">
                    <Input placeholder="e.g. BATCH-2026-A" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="second_name" label="Secondary Name (Khmer)">
                    <Input placeholder="ឈ្មោះផលិតផលជាភាសាខ្មែរ" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="weight" label="Weight">
                    <Input placeholder="e.g. 0.25 kg" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={8}>
                  <Form.Item name="barcode_symbology" label="Barcode Symbology">
                    <Select defaultValue="Code128">
                      <Option value="Code128">Code 128</Option>
                      <Option value="Code39">Code 39</Option>
                      <Option value="EAN13">EAN-13</Option>
                      <Option value="EAN8">EAN-8</Option>
                      <Option value="UPCA">UPC-A</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="brand" label="Brand">
                    <Select placeholder="Select brand" allowClear showSearch optionFilterProp="children">
                      {brandsList.map((b) => (
                        <Option key={b.id || b.name} value={b.name}>
                          {b.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="tax_rate" label="Tax">
                    <Select defaultValue="0">
                      <Option value="0">No Tax (0%)</Option>
                      <Option value="10">VAT (10%)</Option>
                      <Option value="7">Standard Tax (7%)</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={8}>
                  <Form.Item name="tax_method" label="Tax Method">
                    <Select defaultValue="exclusive">
                      <Option value="exclusive">Exclusive</Option>
                      <Option value="inclusive">Inclusive</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="alert_quantity" label="Alert Qty">
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="5" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="expiry_alert_days" label="Expiry Days">
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="30" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={8}>
                  <Form.Item name="stock_type" label="Stock Type">
                    <Select defaultValue="standard">
                      <Option value="standard">Standard Inventory</Option>
                      <Option value="serial">Serialized</Option>
                      <Option value="batch">Batch / Lot Tracking</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="multi_option" label="Multi option" valuePropName="checked">
                    <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="inStock" label="Active Status" valuePropName="checked">
                    <Switch defaultChecked checkedChildren="Active" unCheckedChildren="Inactive" />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name="details" label="Product Details">
                    <Input.TextArea rows={3} placeholder="Full product specifications, materials, and description..." />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="product_details" label="Invoice details">
                    <Input.TextArea rows={3} placeholder="Short details printed on customer invoice and receipt..." />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* TAB 3: [ Variants ] (Image 3) */}
            <div style={{ display: modalActiveTab === 'variants' ? 'block' : 'none' }}>
              <div style={{ marginBottom: 16 }}>
                <Switch
                  checked={hasVariants}
                  onChange={setHasVariants}
                  style={{ marginRight: 10 }}
                />
                <Text strong style={{ color: adminTheme.text, fontSize: 14 }}>
                  This product has multiple variants and/or attributes
                </Text>
              </div>

              {hasVariants && (
                <>
                  {/* Variant Tag Attribute Pills */}
                  <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Text strong style={{ fontSize: 13, color: adminTheme.subtext }}>
                      Variant Attributes:
                    </Text>
                    {variantAttributeTags.map((tag, i) => (
                      <Tag
                        key={i}
                        closable
                        onClose={() => setVariantAttributeTags((prev) => prev.filter((_, idx) => idx !== i))}
                        color="blue"
                        style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}
                      >
                        {tag}
                      </Tag>
                    ))}
                    <Space.Compact style={{ width: 220 }}>
                      <Input
                        placeholder="e.g. Color: Red"
                        size="small"
                        value={newVariantTag}
                        onChange={(e) => setNewVariantTag(e.target.value)}
                        onPressEnter={handleAddVariantTag}
                      />
                      <Button size="small" type="primary" onClick={handleAddVariantTag}>
                        + Add
                      </Button>
                    </Space.Compact>
                  </div>

                  {/* Variants Table */}
                  <div style={{ border: `1px solid ${adminTheme.border}`, borderRadius: 8, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: adminTheme.cardMuted, textAlign: 'left', borderBottom: `1px solid ${adminTheme.border}` }}>
                          <th style={{ padding: '10px 14px', fontSize: 12 }}>Name</th>
                          <th style={{ padding: '10px 14px', fontSize: 12 }}>Warehouse / Location</th>
                          <th style={{ padding: '10px 14px', fontSize: 12 }}>Price Addition ($)</th>
                          <th style={{ padding: '10px 14px', fontSize: 12 }}>Stock Qty</th>
                          <th style={{ padding: '10px 14px', fontSize: 12, textAlign: 'center' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variantRows.map((row, idx) => (
                          <tr key={row.id || idx} style={{ borderBottom: `1px solid ${adminTheme.border}` }}>
                            <td style={{ padding: '8px 12px' }}>
                              <Input
                                size="middle"
                                value={row.name}
                                onChange={(e) => handleUpdateVariantRow(idx, 'name', e.target.value)}
                                placeholder="e.g. Standard - Blue"
                              />
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <Select
                                size="middle"
                                value={row.warehouse_id}
                                onChange={(val) => handleUpdateVariantRow(idx, 'warehouse_id', val)}
                                style={{ width: '100%' }}
                              >
                                {warehousesList.map((w) => (
                                  <Option key={w.id} value={w.id}>
                                    {w.name || w.code}
                                  </Option>
                                ))}
                              </Select>
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <InputNumber
                                size="middle"
                                value={row.priceAddition}
                                onChange={(val) => handleUpdateVariantRow(idx, 'priceAddition', val)}
                                style={{ width: '100%' }}
                                placeholder="0.00"
                              />
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <InputNumber
                                size="middle"
                                value={row.quantity}
                                onChange={(val) => handleUpdateVariantRow(idx, 'quantity', val)}
                                style={{ width: '100%' }}
                                placeholder="10"
                              />
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <Button
                                type="text"
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => handleDeleteVariantRow(idx)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ padding: 10, background: adminTheme.cardMuted, borderTop: `1px solid ${adminTheme.border}` }}>
                      <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={handleAddVariantRow}>
                        + Add Variant Row
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* TAB 4: [ Supplier ] */}
            <div style={{ display: modalActiveTab === 'supplier' ? 'block' : 'none' }}>
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item name="supplier1" label="Primary Supplier">
                    <Input placeholder="e.g. Aura Direct Global Sourcing" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="supplier1price" label="Supplier Unit Price ($)">
                    <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%' }} placeholder="0.10" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="supplier1_part_no" label="Supplier Part / Catalog Number">
                    <Input placeholder="e.g. SUP-PRT-9002" />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* TAB 5: [ Promotion ] */}
            <div style={{ display: modalActiveTab === 'promotion' ? 'block' : 'none' }}>
              <Row gutter={12}>
                <Col span={6}>
                  <Form.Item name="promotion" label="Enable Promotion" valuePropName="checked">
                    <Switch checkedChildren="Active Promo" unCheckedChildren="Standard Price" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="promo_price" label="Promotional Sale Price ($)">
                    <InputNumber min={0.01} step={0.01} precision={2} style={{ width: '100%' }} placeholder="0.15" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="start_date" label="Promotion Start Date">
                    <Input type="date" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="end_date" label="Promotion End Date">
                    <Input type="date" />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* TAB 6: [ Add On ] */}
            <div style={{ display: modalActiveTab === 'addon' ? 'block' : 'none' }}>
              <Alert
                message="Complementary Add-on Products"
                description="Select optional accessories, warranty bundles, or complementary products offered to customers upon checkout."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Form.Item name="addon_items" label="Add-on Products Selection">
                <Select mode="multiple" placeholder="Select complementary products from live catalog">
                  {productsList.slice(0, 30).map((p) => (
                    <Option key={p.id} value={p.id}>
                      {p.name} ({formatCurrency(p.price)})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>

            {/* TAB 7: [ Racks ] */}
            <div style={{ display: modalActiveTab === 'racks' ? 'block' : 'none' }}>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="rack_location" label="Warehouse Rack Location">
                    <Input placeholder="e.g. Rack A-12, Shelf 04, Bin 2" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="warehouse_id" label="Primary Storage Warehouse">
                    <Select placeholder="Select warehouse">
                      {warehousesList.map((w) => (
                        <Option key={w.id} value={w.id}>
                          {w.name || w.code}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </Form>
        </div>
      </Modal>

      {/* 7. Bulk Price Adjustment Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarOutlined style={{ color: '#f59e0b' }} />
            <span>Update Pricing & Badges in Bulk ({selectedRowKeys.length} items)</span>
          </div>
        }
        open={isBulkPriceModalOpen}
        onCancel={() => setIsBulkPriceModalOpen(false)}
        onOk={handleApplyBulkPricing}
        okText="Apply to Selected Products"
        cancelText="Cancel"
      >
        <div style={{ padding: '10px 0' }}>
          <Alert
            message={`You have selected ${selectedRowKeys.length} products.`}
            description="Adjusting pricing in bulk will immediately calculate new live prices and push them to the public website."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <div style={{ marginBottom: 14 }}>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>
              Adjustment Type:
            </Text>
            <Select
              value={bulkAdjustmentType}
              onChange={setBulkAdjustmentType}
              style={{ width: '100%' }}
            >
              <Option value="percent_discount">Apply Percentage Discount (e.g. -15%)</Option>
              <Option value="percent_increase">Apply Percentage Price Increase (e.g. +10%)</Option>
              <Option value="fixed_discount">Subtract Fixed Amount (e.g. -$5.00)</Option>
              <Option value="set_badge">Set Promotional Badge Only</Option>
            </Select>
          </div>

          {bulkAdjustmentType !== 'set_badge' && (
            <div style={{ marginBottom: 14 }}>
              <Text strong style={{ display: 'block', marginBottom: 6 }}>
                Adjustment Value ({bulkAdjustmentType.startsWith('percent') ? '%' : '$'}):
              </Text>
              <InputNumber
                value={bulkAdjustmentValue}
                onChange={setBulkAdjustmentValue}
                min={1}
                max={bulkAdjustmentType.startsWith('percent') ? 95 : 1000}
                style={{ width: '100%' }}
              />
            </div>
          )}

          {bulkAdjustmentType === 'set_badge' && (
            <div style={{ marginBottom: 14 }}>
              <Text strong style={{ display: 'block', marginBottom: 6 }}>
                Select Promotional Badge:
              </Text>
              <Select
                value={bulkBadgeValue}
                onChange={setBulkBadgeValue}
                style={{ width: '100%' }}
              >
                <Option value="None">None (Remove Badge)</Option>
                <Option value="🔥 Hot Deal">🔥 Hot Deal</Option>
                <Option value="⚡ Price Drop">⚡ Price Drop</Option>
                <Option value="⭐ Updated Price">⭐ Updated Price</Option>
                <Option value="✨ New Arrival">✨ New Arrival</Option>
                <Option value="Best Seller">Best Seller</Option>
              </Select>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
