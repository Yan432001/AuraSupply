import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  App,
  Drawer,
  Spin,
  message,
  Grid,
  ConfigProvider,
} from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

// Contexts & Hooks
import { useAuth } from '../../../contexts/AuthContext';
import { useTranslation } from '../../../contexts/LanguageContext';
import { publicTheme } from '../../../utils/webTheme';

// Fixed, immutable website color theme configuration for POS Terminal
const websitePosThemeConfig = {
  token: {
    colorPrimary: publicTheme.primary, // #2f6fed
    colorLink: publicTheme.primary,
    colorSuccess: publicTheme.success, // #10b981
    colorWarning: publicTheme.warning, // #f59e0b
    colorError: publicTheme.danger, // #ef4444
    colorInfo: publicTheme.secondary, // #5b8def
    colorTextBase: '#0f172a',
    colorTextSecondary: '#64748b',
    colorBgBase: '#ffffff',
    colorBgLayout: '#f8fafc',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBorder: 'rgba(226, 232, 240, 0.85)',
    borderRadius: 12,
    fontFamily: '"Plus Jakarta Sans", "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  components: {
    Modal: {
      contentBg: '#ffffff',
      headerBg: '#ffffff',
      footerBg: '#ffffff',
      titleColor: '#0f172a',
      borderRadiusLG: 18,
    },
    Button: {
      colorPrimary: publicTheme.primary,
      borderRadius: 10,
    },
    Card: {
      colorBgContainer: '#ffffff',
      borderRadiusLG: 14,
    },
    Input: {
      colorBgContainer: '#ffffff',
      activeBorderColor: publicTheme.primary,
      hoverBorderColor: publicTheme.secondary,
      borderRadius: 10,
    },
    Select: {
      colorBgContainer: '#ffffff',
      colorPrimary: publicTheme.primary,
      borderRadius: 10,
    },
    Table: {
      colorBgContainer: '#ffffff',
      headerBg: '#f8fafc',
      headerColor: '#475569',
    },
    Drawer: {
      colorBgElevated: '#ffffff',
    },
  },
};

// Modular Creative POS Components matching cyspharma & AURA_v1
import PosHeader from './components/PosHeader';
import PosCart from './components/PosCart';
import PosCatalog from './components/PosCatalog';
import PosOpenRegisterView from './components/PosOpenRegisterView';
import PosCheckoutModal from './components/PosCheckoutModal';
import PosReceiptModal from './components/PosReceiptModal';
import PosCloseRegisterModal from './components/PosCloseRegisterModal';
import PosRegisterDetailsModal from './components/PosRegisterDetailsModal';
import PosTodaySaleModal from './components/PosTodaySaleModal';
import PosRegistersListModal from './components/PosRegistersListModal';
import PosSalesHistoryModal from './components/PosSalesHistoryModal';
import PosMemberCardModal from './components/PosMemberCardModal';
import PosCouponModal from './components/PosCouponModal';
import PosCustomerStockModal from './components/PosCustomerStockModal';
import PosPrintersModal from './components/PosPrintersModal';
import PosAddExpenseModal from './components/PosAddExpenseModal';
import PosShortcutsModal from './components/PosShortcutsModal';
import PosCalculatorModal from './components/PosCalculatorModal';
import {
  EditItemModal,
  ItemCommentModal,
  OrderDiscountModal,
  OrderTaxModal,
  DeliveryFeeModal,
  QuickAddCustomerModal,
  CustomerDetailsModal,
  ManualAddProductModal,
} from './components/PosCartModals';

const { useBreakpoint } = Grid;
const KHR_EXCHANGE_RATE = 4200;
const THB_EXCHANGE_RATE = 36.5;

// Web Audio API Sound Feedback
const playPosAudio = (type = 'beep', soundEnabled = true) => {
  if (!soundEnabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'beep') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(1750, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'success') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'error') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (_) {}
};

// Default Sample Catalog
const DEFAULT_SAMPLE_CATEGORIES = [
  { id: 'all', name: 'All Items' },
  { id: 'mart', name: 'Mart' },
  { id: 'coffee', name: 'Coffee *' },
  { id: 'car', name: 'Car' },
  { id: 'water', name: 'Water' },
  { id: 'skincare', name: 'Skincare' },
  { id: 'snack', name: 'Snack & Drink' },
  { id: 'shoe', name: 'Shoe' },
];

const DEFAULT_SAMPLE_PRODUCTS = [
  { id: 1, code: 'BYD-01', name: 'BYD Seal', price: 20000.0, category_id: 'car', category_name: 'Car', quantity: 5, barcode: '8850001001' },
  { id: 2, code: 'AV-12', name: 'Avatar 12', price: 3.0, category_id: 'coffee', category_name: 'Coffee *', quantity: 80, barcode: '8850001002' },
  { id: 3, code: 'FM-01', name: 'Fresh Milk', price: 2.0, category_id: 'water', category_name: 'Water', quantity: 120, barcode: '8850001003' },
  { id: 4, code: 'ABC-01', name: 'ABC', price: 0.0, category_id: 'mart', category_name: 'Mart', quantity: 10, barcode: '8850001004' },
  { id: 5, code: 'ABC-T', name: 'ABC TEST', price: 1.5, category_id: 'mart', category_name: 'Mart', quantity: 25, barcode: '8850001005' },
  { id: 6, code: 'JIN-01', name: 'jin', price: 6.0, category_id: 'snack', category_name: 'Snack & Drink', quantity: 50, barcode: '8850001006' },
  { id: 7, code: 'LAY-01', name: 'Lays', price: 2.0, category_id: 'snack', category_name: 'Snack & Drink', quantity: 100, barcode: '8850001007' },
  { id: 8, code: 'SH-01', name: 'Shirts / Tops', price: 1.0, category_id: 'shoe', category_name: 'Shoe', quantity: 30, barcode: '8850001008' },
  { id: 9, code: 'TST-01', name: 'Test', price: 10.0, category_id: 'mart', category_name: 'Mart', quantity: 15, barcode: '8850001009' },
  { id: 10, code: 'ISI-01', name: 'ISI Steel', price: 6.0, category_id: 'mart', category_name: 'Mart', quantity: 40, barcode: '8850001010' },
];

export default function PosTerminal() {
  const screens = useBreakpoint();
  const isDesktop = screens.lg ?? (typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();

  // 1. Clock, Sound & Fullscreen
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // 2. Strict Register Gatekeeper Lifecycle State
  const [loadingRegister, setLoadingRegister] = useState(true);
  const [currentRegister, setCurrentRegister] = useState(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [openRegisterCashInHand, setOpenRegisterCashInHand] = useState('');
  const [openRegisterNote, setOpenRegisterNote] = useState('');

  // 3. Close Register Modal & Shift Audit State
  const [closeRegisterModalVisible, setCloseRegisterModalVisible] = useState(false);
  const [shiftSummary, setShiftSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [isClosingRegister, setIsClosingRegister] = useState(false);
  const [registerDetailsVisible, setRegisterDetailsVisible] = useState(false);
  const [todaySaleModalVisible, setTodaySaleModalVisible] = useState(false);
  const [listRegistersModalVisible, setListRegistersModalVisible] = useState(false);

  // 4. Products & Catalog State
  const [products, setProducts] = useState(DEFAULT_SAMPLE_PRODUCTS);
  const [categories, setCategories] = useState(DEFAULT_SAMPLE_CATEGORIES);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchProductKeyword, setSearchProductKeyword] = useState('');
  const [catalogViewMode, setCatalogViewMode] = useState('grid');
  const [allowOverselling, setAllowOverselling] = useState(false);
  const searchInputRef = useRef(null);

  // 5. Cart, Customers, Table & Orders State (Persisted across in-app navigation)
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_pos_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return [
      {
        id: 1,
        code: 'BYD-01',
        name: 'BYD Seal',
        unit_price: 20000.0,
        quantity: 1,
        unit_name: 'Unit',
        item_discount: 0,
        item_note: '',
      },
      {
        id: 2,
        code: 'AV-12',
        name: 'Avatar 12',
        unit_price: 3.0,
        quantity: 1,
        unit_name: 'Unit',
        item_discount: 0,
        item_note: '',
      },
    ];
  });

  // Keep cart in sync with localStorage for seamless navigation between POS, Kitchen, and Settings
  useEffect(() => {
    try {
      localStorage.setItem('aura_pos_cart', JSON.stringify(cart));
    } catch (_) {}
  }, [cart]);
  const [currentWarehouse, setCurrentWarehouse] = useState('HQ Warehouse');
  const [currentTable, setCurrentTable] = useState('Takeaway / Walk-in');
  const [selectedCustomerId, setSelectedCustomerId] = useState(1);
  const [selectedCustomerName, setSelectedCustomerName] = useState('General Customer');
  const [customers, setCustomers] = useState([
    { id: 1, name: 'General Customer', phone: '012 888 999', email: 'customer@aura.com', points: 250, deposit: 50.0 },
    { id: 2, name: 'Walk-in Customer', phone: '098 765 432', email: '', points: 0, deposit: 0.0 },
    { id: 3, name: 'VIP Diamond Member', phone: '010 333 444', email: 'vip@aura.com', points: 1540, deposit: 120.0 },
  ]);

  // Master Biller & Warehouse Scoping (Matching AURA_v1 permissions)
  const [billers, setBillers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedBillerId, setSelectedBillerId] = useState(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);

  const isSuperAdmin = useMemo(() => {
    return Boolean(
      user?.Owner ||
      user?.Admin ||
      user?.isOwner ||
      user?.isAdmin ||
      Number(user?.group_id) === 1 ||
      Number(user?.group_id) === 2 ||
      user?.role === 'owner' ||
      user?.role === 'admin' ||
      user?.role === 'developer'
    );
  }, [user]);

  // Order Adjustments
  const [orderDiscountValue, setOrderDiscountValue] = useState(0);
  const [orderDiscountType, setOrderDiscountType] = useState('fixed');
  const [orderTaxRate, setOrderTaxRate] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);

  // Held Orders (Hold Bills)
  const [heldOrders, setHeldOrders] = useState([]);
  const [mobileCartDrawerOpen, setMobileCartDrawerOpen] = useState(false);

  // 6. Checkout & Receipt State (Matching cyspharma Finalize Sale)
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState(null);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);

  // 7. Auxiliary Feature Modals
  const [memberCardModalVisible, setMemberCardModalVisible] = useState(false);
  const [couponModalVisible, setCouponModalVisible] = useState(false);
  const [customerStockModalVisible, setCustomerStockModalVisible] = useState(false);
  const [printersModalVisible, setPrintersModalVisible] = useState(false);
  const [salesHistoryModalVisible, setSalesHistoryModalVisible] = useState(false);
  const [addExpenseModalVisible, setAddExpenseModalVisible] = useState(false);
  const [shortcutsModalVisible, setShortcutsModalVisible] = useState(false);
  const [calculatorModalVisible, setCalculatorModalVisible] = useState(false);

  // 8. In-Cart Adjustments Dialogs
  const [editingItem, setEditingItem] = useState(null);
  const [editItemModalVisible, setEditItemModalVisible] = useState(false);
  const [commentingItem, setCommentingItem] = useState(null);
  const [itemCommentModalVisible, setItemCommentModalVisible] = useState(false);
  const [orderDiscountModalVisible, setOrderDiscountModalVisible] = useState(false);
  const [orderTaxModalVisible, setOrderTaxModalVisible] = useState(false);
  const [deliveryFeeModalVisible, setDeliveryFeeModalVisible] = useState(false);
  const [quickAddCustomerVisible, setQuickAddCustomerVisible] = useState(false);
  const [viewCustomerModalVisible, setViewCustomerModalVisible] = useState(false);
  const [manualAddProductModalVisible, setManualAddProductModalVisible] = useState(false);

  // Configuration defaults loaded from aura_pos_settings
  const [posSettingsData, setPosSettingsData] = useState({
    exchange_rate: KHR_EXCHANGE_RATE,
    default_warehouse: 1,
    default_customer: 1,
    default_biller: 1,
    receipt_width: '80mm',
    auto_print: true,
    sound_effects: true,
    pro_limit: 30,
  });

  // Fetch POS Settings, Billers, Warehouses & Customer directory on mount
  useEffect(() => {
    axios
      .get('/api/admin/pos/settings')
      .then((res) => {
        if (res.data?.success) {
          const s = res.data.settings || {};
          const bList = res.data.billers || [];
          const wList = res.data.warehouses || [];
          setBillers(bList);
          setWarehouses(wList);
          setPosSettingsData((prev) => ({ ...prev, ...s }));
          if (res.data?.overselling !== undefined) {
            setAllowOverselling(Number(res.data.overselling) === 1);
          }

          if (res.data.customers && res.data.customers.length > 0) {
            setCustomers(res.data.customers);
          }

          // Initial Biller: Restricted for standard biller user, selectable for Super Admin
          let initialBillerId = null;
          if (!isSuperAdmin && user?.biller_id) {
            initialBillerId = Number(user.biller_id);
          } else if (s.default_biller) {
            initialBillerId = Number(s.default_biller);
          } else if (bList.length > 0) {
            initialBillerId = bList[0].id;
          }
          setSelectedBillerId(initialBillerId);

          // Initial Warehouse: Linked store warehouse
          let initialWarehouseId = null;
          if (!isSuperAdmin && user?.warehouse_id) {
            initialWarehouseId = Number(user.warehouse_id);
          } else {
            const matchedBiller = bList.find((b) => b.id === initialBillerId);
            if (matchedBiller?.warehouse_id) {
              initialWarehouseId = Number(matchedBiller.warehouse_id);
            } else if (s.default_warehouse) {
              initialWarehouseId = Number(s.default_warehouse);
            } else if (wList.length > 0) {
              initialWarehouseId = wList[0].id;
            }
          }
          setSelectedWarehouseId(initialWarehouseId);
          const wObj = wList.find((w) => w.id === initialWarehouseId);
          if (wObj) setCurrentWarehouse(wObj.name);
        }
      })
      .catch((err) => console.warn('[POS] Failed to load POS settings:', err));
  }, [user, isSuperAdmin]);

  const handleSelectBiller = (billerId) => {
    setSelectedBillerId(billerId);
    const matched = billers.find((b) => b.id === billerId);
    if (matched && matched.warehouse_id) {
      const wid = Number(matched.warehouse_id);
      setSelectedWarehouseId(wid);
      const wObj = warehouses.find((w) => w.id === wid);
      if (wObj) setCurrentWarehouse(wObj.name);
    }
  };

  const handleSelectWarehouse = (warehouseId) => {
    setSelectedWarehouseId(warehouseId);
    const wObj = warehouses.find((w) => w.id === warehouseId);
    if (wObj) setCurrentWarehouse(wObj.name);
  };

  // Real-time Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Update selected customer name when customer ID changes
  useEffect(() => {
    const found = customers.find((c) => c.id === selectedCustomerId);
    if (found) {
      setSelectedCustomerName(found.name);
    }
  }, [selectedCustomerId, customers]);

  // Load held orders from storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('aura_pos_held_orders');
      if (saved) {
        setHeldOrders(JSON.parse(saved));
      }
    } catch (_) {}
  }, []);

  // Sync URL tab params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'sales') setSalesHistoryModalVisible(true);
    else if (tab === 'registers') setListRegistersModalVisible(true);
    else if (tab === 'today-sale') setTodaySaleModalVisible(true);
  }, [location.search]);

  // =========================================================================
  // STRICT GATEKEEPER: Check Register Status on Load
  // =========================================================================
  const checkRegisterStatus = useCallback(async () => {
    setLoadingRegister(true);
    try {
      const currentUserId = user?.id || 1;
      const billerParam = selectedBillerId ? `&biller_id=${selectedBillerId}` : '';
      const res = await axios.get(`/api/admin/pos/register/current?user_id=${currentUserId}${billerParam}`);
      if (res.data?.success && res.data?.isOpen && res.data?.register) {
        setCurrentRegister(res.data.register);
        setIsRegisterOpen(true);
        localStorage.setItem('aura_pos_register_session', JSON.stringify(res.data.register));
      } else {
        setCurrentRegister(null);
        setIsRegisterOpen(false);
        localStorage.removeItem('aura_pos_register_session');
      }
    } catch (err) {
      console.warn('[POS] Backend register check fallback:', err);
      setCurrentRegister(null);
      setIsRegisterOpen(false);
      localStorage.removeItem('aura_pos_register_session');
    } finally {
      setLoadingRegister(false);
    }
  }, [user, selectedBillerId]);

  useEffect(() => {
    checkRegisterStatus();
  }, [checkRegisterStatus]);

  // Handle Opening Register
  const handleOpenRegisterSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const rawVal = openRegisterCashInHand === '' ? '0' : openRegisterCashInHand;
    const cashVal = parseFloat(rawVal);
    if (isNaN(cashVal) || cashVal < 0) {
      message.error(t('invalid_cash_amount', 'Please enter a valid Cash on Hand amount (>= 0).'));
      return;
    }

    try {
      const payload = {
        cash_in_hand: cashVal,
        user_id: user?.id || 1,
        biller_id: selectedBillerId || 1,
        warehouse_id: selectedWarehouseId || 1,
        note: openRegisterNote || 'Shift opened from Creative POS Terminal',
      };

      const res = await axios.post('/api/admin/pos/register/open', payload);
      if (res.data?.success) {
        message.success(t('register_opened', 'Cash register opened successfully! Welcome to POS Terminal.'));
        const reg = res.data.register || {
          id: res.data.register_id || Date.now(),
          date: new Date().toISOString(),
          user_id: user?.id || 1,
          biller_id: selectedBillerId || 1,
          warehouse_id: selectedWarehouseId || 1,
          cash_in_hand: cashVal,
          status: 'open',
          note: openRegisterNote || '',
        };
        setCurrentRegister(reg);
        setIsRegisterOpen(true);
        localStorage.setItem('aura_pos_register_session', JSON.stringify(reg));
        playPosAudio('success', soundEnabled);
        fetchCatalog();
      } else {
        message.error(res.data?.message || 'Failed to open register');
      }
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Failed to open register');
    }
  };

  // Open Shift Close Modal & Fetch Live Summary
  const handleInitiateCloseRegister = async () => {
    setLoadingSummary(true);
    setCloseRegisterModalVisible(true);
    try {
      const regId = currentRegister?.id;
      const res = await axios.get(`/api/admin/pos/register/summary?register_id=${regId || ''}&user_id=${user?.id || 1}`);
      if (res.data?.success) {
        setShiftSummary(res.data.summary);
      }
    } catch (err) {
      const openCash = parseFloat(currentRegister?.cash_in_hand) || 0;
      setShiftSummary({
        register_id: currentRegister?.id || 1,
        opened_at: currentRegister?.date || new Date().toISOString(),
        cash_in_hand: openCash,
        total_bills: 0,
        total_sales: 0,
        cash_sales: 0,
        card_sales: 0,
        khqr_sales: 0,
        expected_cash: openCash,
      });
    } finally {
      setLoadingSummary(false);
    }
  };

  // Submit Shift Close
  const handleConfirmCloseRegister = async (values) => {
    setIsClosingRegister(true);
    try {
      const payload = {
        register_id: currentRegister?.id || null,
        total_cash_submitted: parseFloat(values.total_cash_submitted) || 0,
        total_cc_slips_submitted: 0,
        total_cheques_submitted: 0,
        note: values.note || '',
        closed_by: user?.id || 1,
      };

      const res = await axios.post('/api/admin/pos/register/close', payload);
      if (res.data?.success) {
        message.success(t('register_closed_successfully', 'Shift register successfully closed and reconciled!'));
      }
      localStorage.removeItem('aura_pos_register_session');
      setCurrentRegister(null);
      setIsRegisterOpen(false);
      setCloseRegisterModalVisible(false);
      navigate('/admins');
    } catch (err) {
      localStorage.removeItem('aura_pos_register_session');
      setCurrentRegister(null);
      setIsRegisterOpen(false);
      setCloseRegisterModalVisible(false);
      message.info('Register closed.');
      navigate('/admins');
    } finally {
      setIsClosingRegister(false);
    }
  };

  // Catalog Fetching (Warehouse & Biller scoped matching AURA_v1)
  const fetchCatalog = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        axios.get('/api/admin/pos/products', {
          params: {
            warehouse_id: selectedWarehouseId,
            biller_id: selectedBillerId,
            limit: posSettingsData?.pro_limit || 30,
          },
        }),
        axios.get('/api/admin/pos/categories'),
      ]);

      if (prodRes.data?.success && Array.isArray(prodRes.data.products) && prodRes.data.products.length > 0) {
        setProducts(prodRes.data.products);
      }
      if (prodRes.data?.overselling !== undefined) {
        setAllowOverselling(Number(prodRes.data.overselling) === 1);
      }
      if (catRes.data?.success && Array.isArray(catRes.data.categories) && catRes.data.categories.length > 0) {
        const cats = catRes.data.categories;
        if (!cats.some((c) => c.id === 'all')) {
          cats.unshift({ id: 'all', name: 'All Items' });
        }
        setCategories(cats);
      }
    } catch (_) {
      // Fallback to sample catalog
    } finally {
      setLoadingProducts(false);
    }
  }, [selectedWarehouseId, selectedBillerId, posSettingsData?.pro_limit]);

  useEffect(() => {
    if (isRegisterOpen) {
      fetchCatalog();
    }
  }, [isRegisterOpen, fetchCatalog]);

  // Add Item to Cart
  const handleAddToCart = (product) => {
    playPosAudio('beep', soundEnabled);
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === product.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + 1,
        };
        return next;
      }
      return [
        ...prev,
        {
          id: product.id,
          product_id: product.id,
          code: product.code || `PRD-${product.id}`,
          name: product.name,
          unit_price: parseFloat(product.price || product.unit_price || 0),
          quantity: 1,
          unit_name: product.unit_name || product.unit || 'Unit',
          unit_id: product.unit_id || product.unit || 1,
          unit_code: product.unit_code || 'pcs',
          operation_value: product.operation_value || 1,
          product_type: product.type || 'standard',
          option_id: product.option_id || null,
          cost: parseFloat(product.cost || 0),
          item_discount: 0,
          item_note: '',
          image_url: product.image_url,
        },
      ];
    });
  };

  // Barcode Scan Handler
  const handleBarcodeScanSubmit = (scannedCode) => {
    if (!scannedCode || !scannedCode.trim()) return;
    const cleanCode = scannedCode.trim().toLowerCase();
    const matched = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === cleanCode) ||
        (p.code && p.code.toLowerCase() === cleanCode) ||
        (p.name && p.name.toLowerCase() === cleanCode)
    );

    if (matched) {
      handleAddToCart(matched);
      setSearchProductKeyword('');
      message.success(`Added: ${matched.name}`);
    } else {
      playPosAudio('error', soundEnabled);
      message.warning(`No product found for barcode: "${scannedCode}"`);
    }
  };

  // Cart Operations
  const updateItemQuantity = (idOrIndex, newQtyOrDelta) => {
    setCart((prev) =>
      prev
        .map((item, idx) => {
          if (item.id === idOrIndex || idx === idOrIndex) {
            const nextQty = Math.max(0, typeof newQtyOrDelta === 'number' ? newQtyOrDelta : (item.quantity || 1) + 1);
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const handleUpdateCartItem = (idOrIndex, updatedFields) => {
    setCart((prev) =>
      prev.map((item, idx) => {
        if (item.id === idOrIndex || idx === idOrIndex) {
          return { ...item, ...updatedFields };
        }
        return item;
      })
    );
  };

  const removeItemFromCart = (idOrIndex) => {
    setCart((prev) => prev.filter((item, idx) => item.id !== idOrIndex && idx !== idOrIndex));
  };

  const clearCart = () => {
    setCart([]);
    try {
      localStorage.removeItem('aura_pos_cart');
    } catch (_) {}
    setOrderDiscountValue(0);
    setOrderTaxRate(0);
    setShippingFee(0);
  };

  // Totals Calculations: Gross Subtotal, Product Discounts, Order Discounts, Taxes, Grand Total
  const grossSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const price = parseFloat(item.unit_price || 0);
      const qty = parseFloat(item.quantity || 1);
      return acc + (price * qty);
    }, 0);
  }, [cart]);

  const productDiscountTotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const price = parseFloat(item.unit_price || 0);
      const qty = parseFloat(item.quantity || 1);
      const isPercent = item.discount_type === 'percent';
      const val = parseFloat(item.discount_val !== undefined ? item.discount_val : (item.item_discount || 0)) || 0;
      const unitDiscount = isPercent
        ? (price * Math.min(100, Math.max(0, val))) / 100
        : Math.min(price, Math.max(0, val));
      return acc + (unitDiscount * qty);
    }, 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return Math.max(0, grossSubtotal - productDiscountTotal);
  }, [grossSubtotal, productDiscountTotal]);

  const orderDiscountAmount = useMemo(() => {
    const isPercent = orderDiscountType === 'percent' || orderDiscountType === 'percentage';
    if (isPercent) {
      return (cartSubtotal * Math.min(100, Math.max(0, parseFloat(orderDiscountValue) || 0))) / 100;
    }
    return Math.min(cartSubtotal, Math.max(0, parseFloat(orderDiscountValue) || 0));
  }, [cartSubtotal, orderDiscountType, orderDiscountValue]);

  const totalDiscount = useMemo(() => {
    return productDiscountTotal + orderDiscountAmount;
  }, [productDiscountTotal, orderDiscountAmount]);

  const taxAmount = useMemo(() => {
    return ((cartSubtotal - orderDiscountAmount) * orderTaxRate) / 100;
  }, [cartSubtotal, orderDiscountAmount, orderTaxRate]);

  const grandTotalUSD = useMemo(() => {
    const total = cartSubtotal - orderDiscountAmount + taxAmount + (parseFloat(shippingFee) || 0);
    return Math.max(0, total);
  }, [cartSubtotal, orderDiscountAmount, taxAmount, shippingFee]);

  // Synchronize Live Cart state for Customer Pole Display (View Bill Screen)
  useEffect(() => {
    const displayPayload = {
      items: cart,
      customer_name: selectedCustomerName,
      table_name: currentTable,
      grossSubtotal,
      productDiscountTotal,
      orderDiscountAmount,
      totalDiscount,
      taxAmount,
      shippingFee,
      grandTotalUSD,
      grandTotalKHR: Math.round(grandTotalUSD * (posSettingsData?.exchange_rate || KHR_EXCHANGE_RATE)),
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem('aura_pos_customer_display', JSON.stringify(displayPayload));
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('aura_pos_cart');
        bc.postMessage(displayPayload);
        bc.close();
      }
    } catch (_) {}
  }, [
    cart,
    selectedCustomerName,
    currentTable,
    grossSubtotal,
    productDiscountTotal,
    orderDiscountAmount,
    totalDiscount,
    taxAmount,
    shippingFee,
    grandTotalUSD,
    posSettingsData?.exchange_rate,
  ]);

  // Hold Order (Hold Bill & Kitchen Dispatch)
  const handleHoldOrder = async () => {
    if (cart.length === 0) {
      message.warning('Cart is empty, nothing to hold.');
      return;
    }

    const newHold = {
      id: Date.now(),
      reference: `HOLD-${new Date().toLocaleTimeString('en-GB')}`,
      date: new Date().toISOString(),
      customer_id: selectedCustomerId,
      customer_name: selectedCustomerName,
      table: currentTable,
      table_name: currentTable,
      cart: [...cart],
      total: grandTotalUSD,
      orderDiscountValue,
      orderDiscountType,
      orderTaxRate,
      shippingFee,
    };

    const nextHolds = [newHold, ...heldOrders];
    setHeldOrders(nextHolds);
    localStorage.setItem('aura_pos_held_orders', JSON.stringify(nextHolds));

    // Persist to backend for Kitchen Display System (KDS) & other cashier terminals
    try {
      await axios.post('/api/admin/pos/suspend', {
        customer_id: selectedCustomerId,
        customer: selectedCustomerName,
        table_name: currentTable,
        suspend_note: currentTable,
        items: cart,
        total: grandTotalUSD,
        biller_id: selectedBillerId,
        warehouse_id: selectedWarehouseId,
        user_id: user?.id || 1,
      });
    } catch (_) {}

    clearCart();
    playPosAudio('success', soundEnabled);
    message.success(`Sale placed on hold (#${newHold.reference}) for ${currentTable}`);
  };

  const resumeHeldOrder = (holdId) => {
    const found = heldOrders.find((h) => h.id === holdId);
    if (!found) return;

    if (cart.length > 0) {
      const confirmSwap = window.confirm('Current cart will be replaced with this held order. Proceed?');
      if (!confirmSwap) return;
    }

    setCart(found.cart || []);
    setSelectedCustomerId(found.customer_id || 1);
    setSelectedCustomerName(found.customer_name || 'General Customer');
    setCurrentTable(found.table || 'Takeaway / Walk-in');
    setOrderDiscountValue(found.orderDiscountValue || 0);
    setOrderDiscountType(found.orderDiscountType || 'fixed');
    setOrderTaxRate(found.orderTaxRate || 0);
    setShippingFee(found.shippingFee || 0);

    const remaining = heldOrders.filter((h) => h.id !== holdId);
    setHeldOrders(remaining);
    localStorage.setItem('aura_pos_held_orders', JSON.stringify(remaining));
    message.success(`Held order resumed: ${found.reference}`);
  };

  // Print Bill (Pre-check table receipt)
  const handlePrintBill = () => {
    if (cart.length === 0) {
      message.warning('Cannot print bill: Cart is empty');
      return;
    }

    const currentBiller = billers.find((b) => b.id === selectedBillerId);
    const currentWh = warehouses.find((w) => w.id === selectedWarehouseId);

    const billInvoice = {
      isBillPreview: true,
      reference_no: `BILL-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      customer_name: selectedCustomerName,
      customer: selectedCustomerName,
      biller_id: selectedBillerId,
      biller_name: currentBiller?.name || currentBiller?.company || posSettingsData.default_biller || 'SBC Solutions',
      biller_company: currentBiller?.company || currentBiller?.name || 'AURA Supply Co., Ltd.',
      biller_name_kh: currentBiller?.name_kh || '',
      biller_company_kh: currentBiller?.company_kh || '',
      biller_address: currentBiller?.address || 'Phnom Penh, Cambodia',
      biller_address_kh: currentBiller?.address_kh || '',
      biller_phone: currentBiller?.phone || '012 345 678',
      biller_email: currentBiller?.email || '',
      biller_vat_no: currentBiller?.vat_no || '',
      biller_color: currentBiller?.theme_color || '#2F6FED',
      biller_logo: currentBiller?.logo_url || currentBiller?.logo || '',
      warehouse_name: currentWh?.name || currentWarehouse,
      items: cart,
      subtotal: cartSubtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      shipping_amount: shippingFee,
      grand_total: grandTotalUSD,
      paid: 0,
      tendered_usd: 0,
      tendered_khr: 0,
      change_usd: 0,
    };

    setCompletedInvoice(billInvoice);
    setReceiptModalVisible(true);
  };

  // Finalize Checkout & Create Sale (Matching cyspharma / AURA_v1 Finalize Sale)
  const handleFinalizePayment = async (checkoutData) => {
    setIsSubmittingSale(true);
    try {
      const totalPaidSum =
        checkoutData.payments && checkoutData.payments.length > 0
          ? checkoutData.payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
          : checkoutData.tenderedUSD || grandTotalUSD;

      const currentBiller = billers.find((b) => b.id === selectedBillerId);
      const currentWh = warehouses.find((w) => w.id === selectedWarehouseId);

      const payload = {
        customer_id: selectedCustomerId,
        customer_name: selectedCustomerName,
        biller_id: selectedBillerId || 1,
        warehouse_id: selectedWarehouseId || 1,
        items: cart,
        subtotal: grossSubtotal,
        product_discount: productDiscountTotal,
        order_discount: orderDiscountAmount,
        order_discount_id: orderDiscountType === 'percent' ? `${orderDiscountValue}%` : `$${orderDiscountValue}`,
        total_discount: totalDiscount,
        discount_amount: totalDiscount,
        tax_amount: taxAmount,
        shipping_amount: shippingFee,
        grand_total: grandTotalUSD,
        paid_amount: totalPaidSum,
        paid_by: checkoutData.paymentMethod || 'Cash',
        tendered_usd: checkoutData.tenderedUSD,
        tendered_khr: checkoutData.tenderedKHR,
        change_usd: checkoutData.changeUSD,
        change_khr: checkoutData.changeKHR,
        payments: checkoutData.payments,
        sale_note: checkoutData.sale_note || '',
        staff_note: checkoutData.staff_note || '',
        payment_note: checkoutData.paymentNote || '',
        member_card_no: checkoutData.memberCardNo || '',
        cheque_no: checkoutData.chequeNo || '',
        cc_no: checkoutData.ccNo || '',
        cc_holder: checkoutData.ccHolder || '',
        cc_type: checkoutData.ccType || '',
        table_name: currentTable,
        table_id: null,
        suspend_note: currentTable,
        user_id: user?.id || 1,
      };

      const res = await axios.post('/api/admin/pos/sales/checkout', payload);
      const baseInvoice = res.data?.invoice || {
        reference_no: res.data?.reference_no || `POS-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        customer_name: selectedCustomerName,
        customer: selectedCustomerName,
        table_name: currentTable,
        items: cart,
        subtotal: cartSubtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        shipping_amount: shippingFee,
        grand_total: grandTotalUSD,
        paid: totalPaidSum,
        paid_amount: totalPaidSum,
        tendered_usd: checkoutData.tenderedUSD,
        tendered_khr: checkoutData.tenderedKHR,
        change_usd: checkoutData.changeUSD,
        change_khr: checkoutData.changeKHR,
        paid_by: checkoutData.paymentMethod,
        payments: checkoutData.payments,
      };

      const invoiceData = {
        ...baseInvoice,
        biller_id: selectedBillerId,
        biller_name: currentBiller?.name || currentBiller?.company || baseInvoice.biller_name || 'AURA Supply',
        biller_company: currentBiller?.company || currentBiller?.name || baseInvoice.biller_company || 'AURA Supply Co., Ltd.',
        biller_name_kh: currentBiller?.name_kh || baseInvoice.biller_name_kh || '',
        biller_company_kh: currentBiller?.company_kh || baseInvoice.biller_company_kh || '',
        biller_address: currentBiller?.address || baseInvoice.biller_address || 'Phnom Penh, Cambodia',
        biller_address_kh: currentBiller?.address_kh || baseInvoice.biller_address_kh || '',
        biller_phone: currentBiller?.phone || baseInvoice.biller_phone || '012 345 678',
        biller_email: currentBiller?.email || baseInvoice.biller_email || '',
        biller_vat_no: currentBiller?.vat_no || baseInvoice.biller_vat_no || '',
        biller_color: currentBiller?.theme_color || baseInvoice.biller_color || '#2F6FED',
        biller_logo: currentBiller?.logo_url || currentBiller?.logo || baseInvoice.biller_logo || '',
        warehouse_name: currentWh?.name || currentWarehouse,
      };

      setCompletedInvoice(invoiceData);
      setCheckoutModalVisible(false);
      setReceiptModalVisible(true);
      
      // Capture items before clearing cart for optimistic stock decrement
      const completedCart = [...cart];
      clearCart();
      playPosAudio('success', soundEnabled);
      message.success('Sale completed successfully!');

      // 1. Optimistically decrement stock quantities on screen for responsive UX
      if (completedCart.length > 0) {
        setProducts((prev) =>
          prev.map((p) => {
            const soldItem = completedCart.find((c) => c.id === p.id || c.product_id === p.id);
            if (soldItem) {
              const qtyDeducted = (parseFloat(soldItem.quantity) || 1) * (parseFloat(soldItem.operation_value) || 1);
              return {
                ...p,
                quantity: Math.max(0, (parseFloat(p.quantity) || 0) - qtyDeducted),
              };
            }
            return p;
          })
        );
      }

      // 2. Re-fetch fresh catalog from server to ensure 100% sync with database triggers
      fetchCatalog();
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Checkout failed');
    } finally {
      setIsSubmittingSale(false);
    }
  };

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.key === 'F1') {
        e.preventDefault();
        setShortcutsModalVisible((prev) => !prev);
      } else if (e.key === 'F2') {
        e.preventDefault();
        setQuickAddCustomerVisible(true);
      } else if (e.key === 'F3') {
        e.preventDefault();
        setManualAddProductModalVisible(true);
      } else if (e.key === 'F4' || (e.code === 'Space' && !isInput)) {
        e.preventDefault();
        if (cart.length > 0) setCheckoutModalVisible(true);
      } else if (e.key === 'F6') {
        e.preventDefault();
        handlePrintBill();
      } else if (e.key === 'F7') {
        e.preventDefault();
        handleHoldOrder();
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0 && window.confirm('Clear all items in cart?')) {
          clearCart();
        }
      } else if (e.key === 'F9') {
        e.preventDefault();
        navigate('/admins/pos/settings');
      } else if (e.key === 'F10') {
        e.preventDefault();
        setCalculatorModalVisible((prev) => !prev);
      } else if (!isInput && e.key === 'Enter') {
        if (cart.length > 0 && !checkoutModalVisible) {
          e.preventDefault();
          setCheckoutModalVisible(true);
        }
      } else if (e.key === 'Escape') {
        setCheckoutModalVisible(false);
        setReceiptModalVisible(false);
        setCloseRegisterModalVisible(false);
        setRegisterDetailsVisible(false);
        setTodaySaleModalVisible(false);
        setListRegistersModalVisible(false);
        setSalesHistoryModalVisible(false);
        setMemberCardModalVisible(false);
        setCouponModalVisible(false);
        setCustomerStockModalVisible(false);
        setPrintersModalVisible(false);
        setAddExpenseModalVisible(false);
        setShortcutsModalVisible(false);
        setCalculatorModalVisible(false);
        setEditItemModalVisible(false);
        setItemCommentModalVisible(false);
        setOrderDiscountModalVisible(false);
        setOrderTaxModalVisible(false);
        setDeliveryFeeModalVisible(false);
        setQuickAddCustomerVisible(false);
        setViewCustomerModalVisible(false);
        setManualAddProductModalVisible(false);
      } else if (!isInput && e.key.length === 1 && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, grandTotalUSD]);

  // Loading Screen for Initial Gatekeeper Check
  if (loadingRegister) {
    return (
      <ConfigProvider theme={websitePosThemeConfig}>
        <div
          style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: publicTheme.pageBackground || '#f8fafc',
            color: publicTheme.text,
            gap: 16,
          }}
        >
          <Spin size="large" />
          <span style={{ fontSize: 15, fontWeight: 700, color: publicTheme.text }}>Loading POS Cash Register session...</span>
        </div>
      </ConfigProvider>
    );
  }

  // =========================================================================
  // STRICT GATEKEEPER VIEW: If no register is open, render Cash on Hand View
  // =========================================================================
  if (!isRegisterOpen) {
    return (
      <ConfigProvider theme={websitePosThemeConfig}>
        <PosOpenRegisterView
          user={user}
          openRegisterCashInHand={openRegisterCashInHand}
          setOpenRegisterCashInHand={setOpenRegisterCashInHand}
          openRegisterNote={openRegisterNote}
          setOpenRegisterNote={setOpenRegisterNote}
          handleOpenRegisterSubmit={handleOpenRegisterSubmit}
          khrExchangeRate={posSettingsData.exchange_rate || KHR_EXCHANGE_RATE}
          billerName={billers.find((b) => b.id === selectedBillerId)?.name || user?.biller_name || 'Main Store'}
          warehouseName={warehouses.find((w) => w.id === selectedWarehouseId)?.name || currentWarehouse}
          onExit={() => navigate('/admins')}
          t={t}
        />
      </ConfigProvider>
    );
  }

  // =========================================================================
  // CREATIVE POS TERMINAL MAIN VIEW (Website Default Theme Style)
  // =========================================================================
  return (
    <ConfigProvider theme={websitePosThemeConfig}>
      <div
        style={{
          width: '100vw',
          height: '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: 'radial-gradient(circle at 10% 8%, rgba(47, 111, 237, 0.04), transparent 30%), radial-gradient(circle at 90% 4%, rgba(255, 122, 61, 0.03), transparent 26%), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
          color: publicTheme.text,
          fontFamily: '"Plus Jakarta Sans", "Inter", system-ui, -apple-system, sans-serif',
        }}
      >
        {/* 1. PROFESSIONAL POS TOP HEADER (Website Default Theme Style) */}
        <PosHeader
          user={user}
          currentRegister={currentRegister}
          currentTime={currentTime}
          isFullscreen={isFullscreen}
          toggleFullscreen={toggleFullscreen}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          currentWarehouse={currentWarehouse}
          setCurrentWarehouse={setCurrentWarehouse}
          billers={billers}
          selectedBillerId={selectedBillerId}
          onSelectBiller={handleSelectBiller}
          warehouses={warehouses}
          selectedWarehouseId={selectedWarehouseId}
          onSelectWarehouse={handleSelectWarehouse}
          isSuperAdmin={isSuperAdmin}
          onOpenPosSettings={() => navigate('/admins/pos/settings')}
          onOpenShortcuts={() => setShortcutsModalVisible(true)}
          onOpenCalculator={() => setCalculatorModalVisible(true)}
          onOpenExpense={() => setAddExpenseModalVisible(true)}
          onOpenTodaySale={() => setTodaySaleModalVisible(true)}
          onOpenTodayProfit={() => setTodaySaleModalVisible(true)}
          onOpenListRegisters={() => setListRegistersModalVisible(true)}
          onOpenRegisterDetails={() => setRegisterDetailsVisible(true)}
          onOpenSalesHistory={() => setSalesHistoryModalVisible(true)}
          onOpenMemberCards={() => setMemberCardModalVisible(true)}
          onOpenCoupons={() => setCouponModalVisible(true)}
          onOpenCustomerStocks={() => setCustomerStockModalVisible(true)}
          onOpenPrinters={() => setPrintersModalVisible(true)}
          onOpenKitchen={() => navigate('/admins/pos/kitchen')}
          onInitiateCloseRegister={handleInitiateCloseRegister}
          onExit={() => navigate('/admins')}
          t={t}
        />

        {/* 2. MAIN POS WORKSPACE: ITEM DISPLAY (LEFT) & ORDER DISPLAY (RIGHT) */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* LEFT: ITEM DISPLAY AREA (PRODUCT CATALOG & CATEGORIES) */}
          <div
            style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <PosCatalog
              products={products}
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              searchProductKeyword={searchProductKeyword}
              setSearchProductKeyword={setSearchProductKeyword}
              searchInputRef={searchInputRef}
              onBarcodeScanSubmit={handleBarcodeScanSubmit}
              onAddToCart={handleAddToCart}
              loadingProducts={loadingProducts}
              onOpenManualAddProduct={() => setManualAddProductModalVisible(true)}
              catalogViewMode={catalogViewMode}
              setCatalogViewMode={setCatalogViewMode}
              khrExchangeRate={posSettingsData.exchange_rate || KHR_EXCHANGE_RATE}
              allowOverselling={allowOverselling}
              t={t}
            />
          </div>

          {/* RIGHT: ORDER DISPLAY AREA (CART, TOTALS, AND CHECKOUT) - PROPORTIONAL 38% SPLIT */}
          {isDesktop && (
            <div
              style={{
                width: '38%',
                minWidth: 460,
                maxWidth: 600,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderLeft: '1px solid rgba(226, 232, 240, 0.85)',
                background: '#ffffff',
                boxShadow: '-4px 0 24px rgba(15, 23, 42, 0.03)',
                zIndex: 10,
              }}
            >
              <PosCart
              cart={cart}
              updateItemQuantity={updateItemQuantity}
              onUpdateCartItem={handleUpdateCartItem}
              removeItemFromCart={removeItemFromCart}
              clearCart={clearCart}
              selectedCustomerId={selectedCustomerId}
              setSelectedCustomerId={setSelectedCustomerId}
              customers={customers}
              onOpenQuickAddCustomer={() => setQuickAddCustomerVisible(true)}
              onOpenViewCustomer={() => setViewCustomerModalVisible(true)}
              currentTable={currentTable}
              setCurrentTable={setCurrentTable}
              heldOrders={heldOrders}
              resumeHeldOrder={resumeHeldOrder}
              onHoldOrder={handleHoldOrder}
              onPrintBill={handlePrintBill}
              onOpenCheckout={() => setCheckoutModalVisible(true)}
              onEditItem={(item) => {
                setEditingItem(item);
                setEditItemModalVisible(true);
              }}
              onCommentItem={(item) => {
                setCommentingItem(item);
                setItemCommentModalVisible(true);
              }}
              onOpenOrderDiscount={() => setOrderDiscountModalVisible(true)}
              onOpenOrderTax={() => setOrderTaxModalVisible(true)}
              onOpenDeliveryFee={() => setDeliveryFeeModalVisible(true)}
              orderDiscountValue={orderDiscountValue}
              orderDiscountType={orderDiscountType}
              orderDiscountAmount={orderDiscountAmount}
              productDiscountTotal={productDiscountTotal}
              orderTaxRate={orderTaxRate}
              shippingFee={shippingFee}
              grossSubtotal={grossSubtotal}
              subtotal={cartSubtotal}
              totalDiscount={totalDiscount}
              taxAmount={taxAmount}
              grandTotal={grandTotalUSD}
              khrExchangeRate={posSettingsData.exchange_rate || KHR_EXCHANGE_RATE}
              thbExchangeRate={THB_EXCHANGE_RATE}
              t={t}
            />
          </div>
        )}

        {/* MOBILE BOTTOM CART FLOATING BAR */}
        {!isDesktop && (
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '10px 16px',
              background: '#ffffff',
              borderTop: '1px solid #cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 100,
              boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#2F6FED' }}>
                ${grandTotalUSD.toFixed(2)}{' '}
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                  (៛{(grandTotalUSD * (posSettingsData.exchange_rate || KHR_EXCHANGE_RATE)).toLocaleString()})
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setMobileCartDrawerOpen(true)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #2F6FED 0%, #1D4ED8 100%)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(47, 111, 237, 0.35)',
                }}
              >
                View Cart & Pay
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE CART DRAWER */}
      <Drawer
        title="Current Cart & Checkout"
        placement="bottom"
        height="90vh"
        onClose={() => setMobileCartDrawerOpen(false)}
        open={mobileCartDrawerOpen && !isDesktop}
        bodyStyle={{ padding: 0 }}
      >
        <PosCart
          cart={cart}
          updateItemQuantity={updateItemQuantity}
          onUpdateCartItem={handleUpdateCartItem}
          removeItemFromCart={removeItemFromCart}
          clearCart={clearCart}
          selectedCustomerId={selectedCustomerId}
          setSelectedCustomerId={setSelectedCustomerId}
          customers={customers}
          onOpenQuickAddCustomer={() => setQuickAddCustomerVisible(true)}
          onOpenViewCustomer={() => setViewCustomerModalVisible(true)}
          currentTable={currentTable}
          setCurrentTable={setCurrentTable}
          heldOrders={heldOrders}
          resumeHeldOrder={resumeHeldOrder}
          onHoldOrder={handleHoldOrder}
          onPrintBill={handlePrintBill}
          onOpenCheckout={() => {
            setMobileCartDrawerOpen(false);
            setCheckoutModalVisible(true);
          }}
          onEditItem={(item) => {
            setEditingItem(item);
            setEditItemModalVisible(true);
          }}
          onCommentItem={(item) => {
            setCommentingItem(item);
            setItemCommentModalVisible(true);
          }}
          onOpenOrderDiscount={() => setOrderDiscountModalVisible(true)}
          onOpenOrderTax={() => setOrderTaxModalVisible(true)}
          onOpenDeliveryFee={() => setDeliveryFeeModalVisible(true)}
          orderDiscountValue={orderDiscountValue}
          orderDiscountType={orderDiscountType}
          orderDiscountAmount={orderDiscountAmount}
          productDiscountTotal={productDiscountTotal}
          orderTaxRate={orderTaxRate}
          shippingFee={shippingFee}
          grossSubtotal={grossSubtotal}
          subtotal={cartSubtotal}
          totalDiscount={totalDiscount}
          taxAmount={taxAmount}
          grandTotal={grandTotalUSD}
          khrExchangeRate={posSettingsData.exchange_rate || KHR_EXCHANGE_RATE}
          thbExchangeRate={THB_EXCHANGE_RATE}
          t={t}
        />
      </Drawer>

      {/* ========================================================================= */}
      {/* ALL MODALS & DIALOGS FROM AURA_V1 POS VIEWS */}
      {/* ========================================================================= */}

      {/* 1. CHECKOUT PAYMENT MODAL (cyspharma / AURA_v1 Finalize Sale layout) */}
      <PosCheckoutModal
        visible={checkoutModalVisible}
        onClose={() => setCheckoutModalVisible(false)}
        grandTotal={grandTotalUSD}
        cartItems={cart}
        grossSubtotal={grossSubtotal}
        totalDiscount={totalDiscount}
        orderDiscountId={orderDiscountType === 'percent' ? `${orderDiscountValue}%` : (orderDiscountValue > 0 ? `$${parseFloat(orderDiscountValue).toFixed(2)}` : null)}
        khrExchangeRate={posSettingsData.exchange_rate || KHR_EXCHANGE_RATE}
        thbExchangeRate={THB_EXCHANGE_RATE}
        onFinalizePayment={handleFinalizePayment}
        isSubmittingSale={isSubmittingSale}
        selectedCustomerName={selectedCustomerName}
        billers={billers}
        selectedBillerId={selectedBillerId}
        t={t}
      />

      {/* 2. RECEIPT & INVOICE MODAL (Default Invoice, Tax Invoice, Thermal Slip with Transfer Button) */}
      <PosReceiptModal
        visible={receiptModalVisible}
        onClose={() => setReceiptModalVisible(false)}
        invoice={completedInvoice}
        billerColor={billers.find((b) => b.id === selectedBillerId)?.theme_color || completedInvoice?.biller_color || '#2F6FED'}
        billerInfo={billers.find((b) => b.id === selectedBillerId)}
        onNextSale={() => {
          setReceiptModalVisible(false);
          setCompletedInvoice(null);
        }}
        khrExchangeRate={posSettingsData.exchange_rate || KHR_EXCHANGE_RATE}
        thbExchangeRate={THB_EXCHANGE_RATE}
        t={t}
      />

      {/* 3. CLOSE REGISTER RECONCILIATION MODAL (close_register.php) */}
      <PosCloseRegisterModal
        visible={closeRegisterModalVisible}
        onClose={() => setCloseRegisterModalVisible(false)}
        shiftSummary={shiftSummary}
        loadingSummary={loadingSummary}
        onConfirmClose={handleConfirmCloseRegister}
        isClosing={isClosingRegister}
        t={t}
      />

      {/* 4. REGISTER LIVE DETAILS AUDIT MODAL (register_details.php) */}
      <PosRegisterDetailsModal
        visible={registerDetailsVisible}
        onClose={() => setRegisterDetailsVisible(false)}
        shiftSummary={shiftSummary}
        currentRegister={currentRegister}
        t={t}
      />

      {/* 5. TODAY'S SALES & CASH BREAKDOWN MODAL (today_sale.php) */}
      <PosTodaySaleModal
        visible={todaySaleModalVisible}
        onClose={() => setTodaySaleModalVisible(false)}
        khrExchangeRate={posSettingsData.exchange_rate || KHR_EXCHANGE_RATE}
        t={t}
      />

      {/* 6. REGISTERS ARCHIVE & HISTORY MODAL (registers.php) */}
      <PosRegistersListModal
        visible={listRegistersModalVisible}
        onClose={() => setListRegistersModalVisible(false)}
        onViewShiftSummary={(reg) => {
          setCurrentRegister(reg);
          setRegisterDetailsVisible(true);
        }}
        t={t}
      />

      {/* 7. SALES HISTORY & INVOICE REPRINT MODAL (sales.php) */}
      <PosSalesHistoryModal
        visible={salesHistoryModalVisible}
        onClose={() => setSalesHistoryModalVisible(false)}
        onReprintReceipt={async (sale) => {
          try {
            const res = await axios.get(`/api/admin/pos/sales/${sale.id}/receipt`);
            if (res.data?.success) {
              const inv = res.data.invoice || (res.data.sale ? { ...res.data.sale, items: res.data.items, payments: res.data.payments } : sale);
              setCompletedInvoice(inv);
              setReceiptModalVisible(true);
            } else {
              setCompletedInvoice(sale);
              setReceiptModalVisible(true);
            }
          } catch (_) {
            setCompletedInvoice(sale);
            setReceiptModalVisible(true);
          }
        }}
        t={t}
      />

      {/* 8. MEMBER & VIP CARDS MODAL (member_cards.php) */}
      <PosMemberCardModal
        visible={memberCardModalVisible}
        onClose={() => setMemberCardModalVisible(false)}
        onSelectCardForSale={(card) => {
          message.success(`Card #${card.card_no} selected for sale!`);
        }}
        t={t}
      />

      {/* 9. PROMOTIONS & COUPONS MODAL (coupon.php) */}
      <PosCouponModal
        visible={couponModalVisible}
        onClose={() => setCouponModalVisible(false)}
        onApplyCouponToCart={(coupon) => {
          setOrderDiscountValue(parseFloat(coupon.value) || 0);
          setOrderDiscountType('fixed');
          message.success(`Coupon applied: $${coupon.value} off`);
        }}
        t={t}
      />

      {/* 10. CUSTOMER STOCKS DEPOSIT & REDEMPTION (customer_stocks.php) */}
      <PosCustomerStockModal
        visible={customerStockModalVisible}
        onClose={() => setCustomerStockModalVisible(false)}
        selectedCustomerId={selectedCustomerId}
        selectedCustomerName={selectedCustomerName}
        cart={cart}
        onRedeemStockToCart={(item) => {
          handleAddToCart({
            id: `redeem_${Date.now()}`,
            name: `[REDEEM] ${item.product_name || 'Stock Item'}`,
            price: 0,
            unit_price: 0,
            quantity: 1,
            unit_name: item.unit_name || 'Unit',
          });
          message.success('Stock deposit item added to cart for redemption ($0)!');
        }}
        t={t}
      />

      {/* 11. PRINTERS CONFIGURATION MODAL (printers.php) */}
      <PosPrintersModal
        visible={printersModalVisible}
        onClose={() => setPrintersModalVisible(false)}
        t={t}
      />

      {/* 12. DRAWER EXPENSE MODAL */}
      <PosAddExpenseModal
        visible={addExpenseModalVisible}
        onClose={() => setAddExpenseModalVisible(false)}
        onAddExpense={(expense) => {
          message.success(`Drawer cash expense of $${expense.amount} recorded!`);
        }}
        t={t}
      />

      {/* 13. SHORTCUTS CHEATSHEET MODAL */}
      <PosShortcutsModal
        visible={shortcutsModalVisible}
        onClose={() => setShortcutsModalVisible(false)}
        t={t}
      />

      {/* 14. CALCULATOR MODAL */}
      <PosCalculatorModal
        visible={calculatorModalVisible}
        onClose={() => setCalculatorModalVisible(false)}
        t={t}
      />

      {/* 15. IN-CART EDIT ITEM MODAL */}
      <EditItemModal
        visible={editItemModalVisible}
        onClose={() => {
          setEditItemModalVisible(false);
          setEditingItem(null);
        }}
        item={editingItem}
        onSave={(updated) => {
          setCart((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
          message.success('Item details updated');
        }}
      />

      {/* 16. IN-CART ITEM COMMENT MODAL */}
      <ItemCommentModal
        visible={itemCommentModalVisible}
        onClose={() => {
          setItemCommentModalVisible(false);
          setCommentingItem(null);
        }}
        item={commentingItem}
        onSave={(itemId, note) => {
          setCart((prev) => prev.map((item) => (item.id === itemId ? { ...item, item_note: note } : item)));
          message.success('Item instruction saved');
        }}
      />

      {/* 17. ORDER DISCOUNT MODAL */}
      <OrderDiscountModal
        visible={orderDiscountModalVisible}
        onClose={() => setOrderDiscountModalVisible(false)}
        discountValue={orderDiscountValue}
        discountType={orderDiscountType}
        cartSubtotal={cartSubtotal}
        khrExchangeRate={posSettingsData.exchange_rate || KHR_EXCHANGE_RATE}
        onApply={(val, type) => {
          setOrderDiscountValue(val);
          setOrderDiscountType(type);
        }}
      />

      {/* 18. ORDER TAX MODAL */}
      <OrderTaxModal
        visible={orderTaxModalVisible}
        onClose={() => setOrderTaxModalVisible(false)}
        taxRate={orderTaxRate}
        onApply={(rate) => {
          setOrderTaxRate(rate);
        }}
      />

      {/* 19. DELIVERY FEE MODAL */}
      <DeliveryFeeModal
        visible={deliveryFeeModalVisible}
        onClose={() => setDeliveryFeeModalVisible(false)}
        shippingFee={shippingFee}
        onApply={(fee) => {
          setShippingFee(fee);
        }}
      />

      {/* 20. QUICK ADD CUSTOMER MODAL */}
      <QuickAddCustomerModal
        visible={quickAddCustomerVisible}
        onClose={() => setQuickAddCustomerVisible(false)}
        onAddCustomer={(newCust) => {
          setCustomers((prev) => [newCust, ...prev]);
          setSelectedCustomerId(newCust.id);
          setSelectedCustomerName(newCust.name);
          message.success(`Customer "${newCust.name}" added and selected`);
        }}
      />

      {/* 21. VIEW CUSTOMER DETAILS MODAL */}
      <CustomerDetailsModal
        visible={viewCustomerModalVisible}
        onClose={() => setViewCustomerModalVisible(false)}
        customer={customers.find((c) => c.id === selectedCustomerId)}
      />

      {/* 22. QUICK ADD NON-CATALOG PRODUCT */}
      <ManualAddProductModal
        visible={manualAddProductModalVisible}
        onClose={() => setManualAddProductModalVisible(false)}
        onAddProduct={(customItem) => {
          handleAddToCart(customItem);
          message.success(`Added custom item: ${customItem.name}`);
        }}
      />
    </div>
    </ConfigProvider>
  );
}
