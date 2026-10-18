import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  App,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Drawer,
  Dropdown,
  Flex,
  Form,
  Grid,
  Input,
  InputNumber,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  BarcodeOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  ClearOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CreditCardOutlined,
  DeleteOutlined,
  DollarCircleOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  ExpandOutlined,
  ExportOutlined,
  EyeOutlined,
  FolderOpenOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  InboxOutlined,
  InfoCircleOutlined,
  LockOutlined,
  MinusOutlined,
  MoonOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  PrinterOutlined,
  QrcodeOutlined,
  RedoOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
  SearchOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  SoundOutlined,
  SunOutlined,
  SyncOutlined,
  ThunderboltFilled,
  UnlockOutlined,
  UserAddOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useLanguage, useTranslation } from '../../../contexts/LanguageContext';
import { useAdminTheme } from '../../../hooks/useAdminTheme';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;
const { Option } = Select;

const KHR_EXCHANGE_RATE = 4100; // 1 USD = 4,100 KHR

// Web Audio API Synthesizer for Clean POS Sound Effects
const playPosAudio = (type = 'beep', soundEnabled = true) => {
  if (!soundEnabled || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'beep') {
      // Pleasant item scan chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'success') {
      // Cash register drawer chime
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'error') {
      // Low alert
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (_) {}
};

const PosTerminal = () => {
  const screens = useBreakpoint();
  const { modal } = App.useApp ? App.useApp() : {};
  const navigate = useNavigate();
  const { user } = useAuth();
  const { themeMode, toggleThemeMode } = useTheme();
  const { t } = useTranslation();
  const adminTheme = useAdminTheme();

  // Responsive device checks
  const isDesktop = screens.lg ?? (typeof window !== 'undefined' ? window.innerWidth >= 992 : true);
  const isMobile = !isDesktop;

  // Real-time Clock State
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fullscreen & Sound State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // =========================================================================
  // 1. REGISTER SHIFT LIFECYCLE STATE (Open & Close Register)
  // =========================================================================
  const [loadingRegister, setLoadingRegister] = useState(true);
  const [currentRegister, setCurrentRegister] = useState(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [openRegisterModalVisible, setOpenRegisterModalVisible] = useState(false);
  const [closeRegisterModalVisible, setCloseRegisterModalVisible] = useState(false);
  const [shiftSummary, setShiftSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Forms
  const [openRegisterForm] = Form.useForm();
  const [closeRegisterForm] = Form.useForm();

  // Check if register is active on load
  const checkRegisterStatus = async () => {
    setLoadingRegister(true);
    try {
      const res = await axios.get(`/api/admin/pos/register/current?user_id=${user?.id || 1}`);
      if (res.data?.success && res.data?.isOpen && res.data?.register) {
        setCurrentRegister(res.data.register);
        setIsRegisterOpen(true);
        setOpenRegisterModalVisible(false);
      } else {
        setCurrentRegister(null);
        setIsRegisterOpen(false);
        setOpenRegisterModalVisible(true); // Prompt open register
      }
    } catch (err) {
      console.warn('[POS] Failed checking register, falling back to local session:', err);
      // Fallback local session if offline
      const localReg = localStorage.getItem('aura_pos_register_session');
      if (localReg) {
        try {
          const parsed = JSON.parse(localReg);
          setCurrentRegister(parsed);
          setIsRegisterOpen(true);
          setOpenRegisterModalVisible(false);
        } catch (_) {
          setIsRegisterOpen(false);
          setOpenRegisterModalVisible(true);
        }
      } else {
        setIsRegisterOpen(false);
        setOpenRegisterModalVisible(true);
      }
    } finally {
      setLoadingRegister(false);
    }
  };

  useEffect(() => {
    checkRegisterStatus();
  }, [user]);

  // Handle Opening Register
  const handleOpenRegister = async (values) => {
    try {
      const payload = {
        cash_in_hand: parseFloat(values.cash_in_hand) || 0,
        user_id: user?.id || 1,
        note: values.note || '',
      };

      const res = await axios.post('/api/admin/pos/register/open', payload);
      if (res.data?.success) {
        message.success(t('register_opened', 'Cash register opened successfully! POS Terminal unlocked.'));
        setCurrentRegister(res.data.register);
        setIsRegisterOpen(true);
        setOpenRegisterModalVisible(false);
        localStorage.setItem('aura_pos_register_session', JSON.stringify(res.data.register));
        playPosAudio('success', soundEnabled);
      }
    } catch (err) {
      console.error('[POS] Open register error:', err);
      // Local fallback
      const mockReg = {
        id: Date.now(),
        date: new Date().toISOString(),
        user_id: user?.id || 1,
        cash_in_hand: parseFloat(values.cash_in_hand) || 0,
        status: 'open',
      };
      setCurrentRegister(mockReg);
      setIsRegisterOpen(true);
      setOpenRegisterModalVisible(false);
      localStorage.setItem('aura_pos_register_session', JSON.stringify(mockReg));
      message.success('Register opened in offline/local mode');
    }
  };

  // Open Close Register Dialog and Load Shift Summary
  const handleInitiateCloseRegister = async () => {
    setLoadingSummary(true);
    setCloseRegisterModalVisible(true);
    try {
      const regId = currentRegister?.id;
      const res = await axios.get(`/api/admin/pos/register/summary?register_id=${regId || ''}&user_id=${user?.id || 1}`);
      if (res.data?.success) {
        setShiftSummary(res.data.summary);
        closeRegisterForm.setFieldsValue({
          total_cash_submitted: res.data.summary.expected_cash || res.data.summary.cash_in_hand,
          total_cc_slips_submitted: res.data.summary.card_sales > 0 ? 1 : 0,
          total_cheques_submitted: 0,
          note: '',
        });
      }
    } catch (err) {
      console.warn('[POS] Failed fetching summary, using local calculations:', err);
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
      closeRegisterForm.setFieldsValue({
        total_cash_submitted: openCash,
        total_cc_slips_submitted: 0,
        total_cheques_submitted: 0,
        note: '',
      });
    } finally {
      setLoadingSummary(false);
    }
  };

  // Submit Close Register
  const handleSubmitCloseRegister = async (values) => {
    try {
      const payload = {
        register_id: currentRegister?.id,
        total_cash_submitted: parseFloat(values.total_cash_submitted) || 0,
        total_cc_slips_submitted: parseInt(values.total_cc_slips_submitted, 10) || 0,
        total_cheques_submitted: parseInt(values.total_cheques_submitted, 10) || 0,
        note: values.note || '',
        closed_by: user?.id || 1,
      };

      await axios.post('/api/admin/pos/register/close', payload);
      message.success(t('register_closed_successfully', 'Cash register closed successfully! Returning to Admin.'));
      localStorage.removeItem('aura_pos_register_session');
      setIsRegisterOpen(false);
      setCloseRegisterModalVisible(false);
      navigate('/admins/dashboard');
    } catch (err) {
      console.error('[POS] Close register error:', err);
      localStorage.removeItem('aura_pos_register_session');
      message.info('Register closed locally');
      navigate('/admins/dashboard');
    }
  };

  // =========================================================================
  // 2. PRODUCT CATALOG & SEARCH & CATEGORIES STATE
  // =========================================================================
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const searchInputRef = useRef(null);

  // Fetch Products & Categories
  const fetchProductsAndCategories = async () => {
    setLoadingProducts(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        axios.get('/api/admin/pos/products'),
        axios.get('/api/admin/pos/categories'),
      ]);

      if (prodRes.data?.success) {
        setProducts(prodRes.data.products || []);
      }
      if (catRes.data?.success) {
        setCategories(catRes.data.categories || []);
      }
    } catch (err) {
      console.error('[POS] Failed fetching catalog:', err);
      message.warning('Using cached catalog items');
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProductsAndCategories();
  }, []);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (selectedCategory && selectedCategory !== 'all') {
      list = list.filter((p) => String(p.category_id) === String(selectedCategory));
    }

    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          (p.category_name && p.category_name.toLowerCase().includes(q))
      );
    }

    return list;
  }, [products, selectedCategory, searchKeyword]);

  // Barcode / Fast Scan Auto-submit
  const handleBarcodeScan = (e) => {
    if (e.key === 'Enter') {
      const scannedCode = searchKeyword.trim();
      if (!scannedCode) return;

      const exactMatch = products.find(
        (p) => p.code.toLowerCase() === scannedCode.toLowerCase()
      );

      if (exactMatch) {
        addToCart(exactMatch);
        setSearchKeyword('');
        playPosAudio('beep', soundEnabled);
      } else if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
        setSearchKeyword('');
        playPosAudio('beep', soundEnabled);
      }
    }
  };

  // =========================================================================
  // 3. CART & ORDER STATE & MULTI-UNIT LOGIC
  // =========================================================================
  const [cart, setCart] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(1);
  const [selectedCustomerName, setSelectedCustomerName] = useState('Walk-in Customer');
  const [customers, setCustomers] = useState([]);
  const [orderDiscountType, setOrderDiscountType] = useState('percent'); // 'percent' | 'fixed'
  const [orderDiscountValue, setOrderDiscountValue] = useState(0);
  const [orderTaxRate, setOrderTaxRate] = useState(0); // e.g. 10%
  const [shippingFee, setShippingFee] = useState(0);

  // Quick Customer Add Modal
  const [quickAddCustomerVisible, setQuickAddCustomerVisible] = useState(false);
  const [quickCustomerForm] = Form.useForm();

  // Held Orders State
  const [heldOrders, setHeldOrders] = useState([]);
  const [heldOrdersDrawerVisible, setHeldOrdersDrawerVisible] = useState(false);

  // Mobile Cart Drawer State
  const [mobileCartDrawerOpen, setMobileCartDrawerOpen] = useState(false);

  // Fetch Customers
  useEffect(() => {
    axios
      .get('/api/admin/pos/customers')
      .then((res) => {
        if (res.data?.success) {
          setCustomers(res.data.customers || []);
        }
      })
      .catch(() => {});
  }, []);

  // Add Item to Cart
  const addToCart = (product) => {
    if (product.quantity <= 0) {
      message.warning(`${product.name} is out of stock!`);
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === product.id);

      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].quantity += 1;
        return next;
      }

      // Default unit
      const defaultUnit = product.units?.[0] || {
        unit_id: 1,
        unit_name: 'Piece',
        unit_code: 'pcs',
        unit_price: product.price,
        operation_value: 1,
      };

      return [
        ...prev,
        {
          id: product.id,
          code: product.code,
          name: product.name,
          image_url: product.image_url,
          price: product.price,
          unit_price: defaultUnit.unit_price,
          unit_id: defaultUnit.unit_id,
          unit_name: defaultUnit.unit_name,
          unit_code: defaultUnit.unit_code,
          operation_value: defaultUnit.operation_value || 1,
          quantity: 1,
          available_units: product.units || [defaultUnit],
          item_discount: 0,
        },
      ];
    });

    playPosAudio('beep', soundEnabled);
  };

  // Change Item Quantity
  const updateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity: newQty } : item))
    );
  };

  // Switch Unit for Item (matching AURA_v1 multi-unit conversion)
  const handleUnitChange = (productId, newUnitId) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          const selectedUnit = item.available_units.find((u) => u.unit_id === newUnitId);
          if (selectedUnit) {
            return {
              ...item,
              unit_id: selectedUnit.unit_id,
              unit_name: selectedUnit.unit_name,
              unit_code: selectedUnit.unit_code,
              unit_price: selectedUnit.unit_price,
              operation_value: selectedUnit.operation_value || 1,
            };
          }
        }
        return item;
      })
    );
  };

  // Remove Item from Cart
  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  // Clear Entire Cart
  const clearCart = () => {
    if (cart.length === 0) return;
    const confirmFn = modal?.confirm || Modal.confirm;
    confirmFn({
      title: t('clear_cart', 'Clear Current POS Cart?'),
      content: t('confirm_clear_cart', 'Are you sure you want to discard all items from the active order?'),
      okText: t('yes_clear', 'Yes, Discard Cart'),
      okType: 'danger',
      cancelText: t('cancel', 'Cancel'),
      onOk: () => {
        setCart([]);
        setOrderDiscountValue(0);
        setShippingFee(0);
        message.info(t('cart_cleared', 'Cart cleared'));
      },
    });
  };

  // Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity * item.unit_price, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (!orderDiscountValue || orderDiscountValue <= 0) return 0;
    if (orderDiscountType === 'percent') {
      return (cartSubtotal * Math.min(100, orderDiscountValue)) / 100;
    }
    return Math.min(cartSubtotal, orderDiscountValue);
  }, [cartSubtotal, orderDiscountType, orderDiscountValue]);

  const taxAmount = useMemo(() => {
    if (!orderTaxRate || orderTaxRate <= 0) return 0;
    return ((cartSubtotal - discountAmount) * orderTaxRate) / 100;
  }, [cartSubtotal, discountAmount, orderTaxRate]);

  const grandTotalUSD = useMemo(() => {
    const total = cartSubtotal - discountAmount + taxAmount + (parseFloat(shippingFee) || 0);
    return Math.max(0, total);
  }, [cartSubtotal, discountAmount, taxAmount, shippingFee]);

  const grandTotalKHR = useMemo(() => {
    return Math.round(grandTotalUSD * KHR_EXCHANGE_RATE);
  }, [grandTotalUSD]);

  const totalItemCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  // =========================================================================
  // 4. SUSPEND / HOLD ORDERS
  // =========================================================================
  const handleHoldOrder = () => {
    if (cart.length === 0) {
      message.warning('Cart is empty. Add items before holding order.');
      return;
    }

    const holdEntry = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      customerName: selectedCustomerName,
      customerId: selectedCustomerId,
      items: [...cart],
      grandTotalUSD,
      discountValue: orderDiscountValue,
      discountType: orderDiscountType,
      taxRate: orderTaxRate,
    };

    setHeldOrders((prev) => [holdEntry, ...prev]);
    setCart([]);
    setOrderDiscountValue(0);
    message.success(`Order for "${selectedCustomerName}" held in queue!`);
    playPosAudio('success', soundEnabled);
  };

  const handleRecallOrder = (heldEntry) => {
    setCart(heldEntry.items);
    setSelectedCustomerId(heldEntry.customerId);
    setSelectedCustomerName(heldEntry.customerName);
    setOrderDiscountValue(heldEntry.discountValue || 0);
    setOrderDiscountType(heldEntry.discountType || 'percent');
    setOrderTaxRate(heldEntry.taxRate || 0);
    setHeldOrders((prev) => prev.filter((o) => o.id !== heldEntry.id));
    setHeldOrdersDrawerVisible(false);
    message.success(`Recalled order for ${heldEntry.customerName}`);
    playPosAudio('beep', soundEnabled);
  };

  // =========================================================================
  // 5. CHECKOUT & RECEIPT PRINTING MODAL
  // =========================================================================
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // 'Cash' | 'KHQR' | 'Card' | 'Bank'
  const [tenderedUSD, setTenderedUSD] = useState(0);
  const [tenderedKHR, setTenderedKHR] = useState(0);
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState(null);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);

  // Open Checkout
  const handleOpenCheckout = () => {
    if (cart.length === 0) {
      message.warning('Please add products to the cart before checking out.');
      playPosAudio('error', soundEnabled);
      return;
    }
    setTenderedUSD(grandTotalUSD);
    setTenderedKHR(0);
    setCheckoutModalVisible(true);
  };

  // Change Calculation
  const totalTenderedUSD = useMemo(() => {
    const usd = parseFloat(tenderedUSD) || 0;
    const khrInUSD = (parseFloat(tenderedKHR) || 0) / KHR_EXCHANGE_RATE;
    return usd + khrInUSD;
  }, [tenderedUSD, tenderedKHR]);

  const changeDueUSD = useMemo(() => {
    return Math.max(0, totalTenderedUSD - grandTotalUSD);
  }, [totalTenderedUSD, grandTotalUSD]);

  const changeDueKHR = useMemo(() => {
    return Math.round(changeDueUSD * KHR_EXCHANGE_RATE);
  }, [changeDueUSD]);

  // Complete Payment Submission
  const handleFinalizeSale = async () => {
    setIsSubmittingSale(true);
    try {
      const payload = {
        customer_id: selectedCustomerId,
        customer_name: selectedCustomerName,
        user_id: user?.id || 1,
        items: cart,
        subtotal: cartSubtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        shipping_amount: shippingFee,
        grand_total: grandTotalUSD,
        paid_amount: Math.max(grandTotalUSD, totalTenderedUSD),
        paid_by: paymentMethod,
        payment_note: `POS Terminal Cashier: ${user?.name || user?.username || 'Admin'}`,
      };

      const res = await axios.post('/api/admin/pos/checkout', payload);

      if (res.data?.success) {
        setCompletedInvoice(res.data.invoice);
        setCheckoutModalVisible(false);
        setReceiptModalVisible(true);
        setCart([]);
        setOrderDiscountValue(0);
        setShippingFee(0);
        playPosAudio('success', soundEnabled);
        message.success(t('sale_completed', 'Sale completed successfully!'));
      }
    } catch (err) {
      console.error('[POS] Checkout failed, using offline receipt fallback:', err);
      // Offline invoice fallback
      const mockInvoice = {
        sale_id: Date.now(),
        reference_no: `POS-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        customer: selectedCustomerName,
        subtotal: cartSubtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        shipping_amount: shippingFee,
        grand_total: grandTotalUSD,
        paid_amount: totalTenderedUSD || grandTotalUSD,
        change_amount: changeDueUSD,
        paid_by: paymentMethod,
        items: [...cart],
      };
      setCompletedInvoice(mockInvoice);
      setCheckoutModalVisible(false);
      setReceiptModalVisible(true);
      setCart([]);
      message.success('Sale processed locally');
    } finally {
      setIsSubmittingSale(false);
    }
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F2: Focus Search / Barcode
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // F4: Hold Order
      if (e.key === 'F4') {
        e.preventDefault();
        handleHoldOrder();
      }
      // F8: Recall Held Orders
      if (e.key === 'F8') {
        e.preventDefault();
        setHeldOrdersDrawerVisible(true);
      }
      // F9: Open Checkout Modal
      if (e.key === 'F9') {
        e.preventDefault();
        if (checkoutModalVisible) {
          handleFinalizeSale();
        } else {
          handleOpenCheckout();
        }
      }
      // ESC: Close open modals
      if (e.key === 'Escape') {
        if (checkoutModalVisible) setCheckoutModalVisible(false);
        if (receiptModalVisible) setReceiptModalVisible(false);
        if (heldOrdersDrawerVisible) setHeldOrdersDrawerVisible(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [checkoutModalVisible, receiptModalVisible, heldOrdersDrawerVisible, cart, grandTotalUSD, totalTenderedUSD]);

  // Quick Add Customer Handler
  const handleCreateCustomer = async (values) => {
    try {
      const res = await axios.post('/api/admin/pos/customers', values);
      if (res.data?.success) {
        const newCust = res.data.customer;
        setCustomers((prev) => [newCust, ...prev]);
        setSelectedCustomerId(newCust.id);
        setSelectedCustomerName(newCust.name);
        setQuickAddCustomerVisible(false);
        quickCustomerForm.resetFields();
        message.success(`Customer "${newCust.name}" added successfully!`);
      }
    } catch (_) {
      message.error('Failed adding customer');
    }
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        maxWidth: '100vw',
        maxHeight: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: themeMode === 'dark' ? '#090d16' : '#f1f5f9',
        color: adminTheme.text,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ===================================================================== */}
      {/* 1. POS DEDICATED FULL-SCREEN TOP BAR                                  */}
      {/* ===================================================================== */}
      <header
        style={{
          height: 54,
          minHeight: 54,
          background: themeMode === 'dark' ? '#0f172a' : '#ffffff',
          borderBottom: `1px solid ${themeMode === 'dark' ? '#1e293b' : '#e2e8f0'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
          zIndex: 50,
          flexShrink: 0,
        }}
      >
        {/* Left: Exit to Admin & Brand Title */}
        <Flex align="center" gap={12}>
          <Tooltip title="Exit POS & Return to Admin Command Center">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => {
                if (cart.length > 0) {
                  const confirmFn = modal?.confirm || Modal.confirm;
                  confirmFn({
                    title: 'Leave POS Terminal?',
                    content: 'You have active items in your cart. Leave and discard cart?',
                    okText: 'Yes, Exit POS',
                    okType: 'danger',
                    onOk: () => navigate('/admins/dashboard'),
                  });
                } else {
                  navigate('/admins/dashboard');
                }
              }}
              style={{
                borderRadius: 8,
                height: 36,
                fontWeight: 600,
                color: adminTheme.text,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {!isMobile && <span>Admin Center</span>}
            </Button>
          </Tooltip>

          <Divider type="vertical" style={{ height: 24, margin: '0 2px' }} />

          <Flex align="center" gap={8}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)',
              }}
            >
              <ShopOutlined style={{ fontSize: 16 }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                AURA <span style={{ color: '#2563eb' }}>POS TERMINAL</span>
              </div>
              <div style={{ fontSize: 10, color: adminTheme.subtext, fontWeight: 500 }}>
                Main Branch • Store #01
              </div>
            </div>
          </Flex>
        </Flex>

        {/* Center: Live Clock & Register Status Pill */}
        {!isMobile && (
          <Flex align="center" gap={16}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.04)',
                padding: '4px 12px',
                borderRadius: 20,
                border: `1px solid ${themeMode === 'dark' ? '#1e293b' : '#e2e8f0'}`,
                fontSize: 12.5,
                fontWeight: 600,
                fontFamily: 'monospace',
              }}
            >
              <ClockCircleOutlined style={{ color: '#2563eb' }} />
              <span>{currentTime.toLocaleTimeString()}</span>
              <span style={{ opacity: 0.5 }}>|</span>
              <span style={{ fontSize: 11, color: adminTheme.subtext }}>
                {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>

            {/* Register Status Pill */}
            {isRegisterOpen ? (
              <Tag
                color="success"
                style={{
                  borderRadius: 20,
                  padding: '3px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 700,
                  fontSize: 11,
                  margin: 0,
                  border: 'none',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                }}
              >
                <span
                  style={{
                    width: 6.5,
                    height: 6.5,
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 6px #10b981',
                    display: 'inline-block',
                  }}
                />
                SHIFT OPEN • REG #{currentRegister?.id || '01'}
              </Tag>
            ) : (
              <Tag color="error" style={{ borderRadius: 20, fontWeight: 700, margin: 0 }}>
                REGISTER CLOSED
              </Tag>
            )}
          </Flex>
        )}

        {/* Right: Cashier Info, Hold Orders, Close Register & Quick Utilities */}
        <Flex align="center" gap={8}>
          {/* Held Orders Recall Button */}
          <Badge count={heldOrders.length} size="small" offset={[-2, 4]}>
            <Tooltip title="View & Recall Held Orders (F8)">
              <Button
                onClick={() => setHeldOrdersDrawerVisible(true)}
                style={{
                  borderRadius: 8,
                  height: 34,
                  fontWeight: 600,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  background: heldOrders.length > 0 ? '#f59e0b18' : undefined,
                  borderColor: heldOrders.length > 0 ? '#f59e0b' : undefined,
                  color: heldOrders.length > 0 ? '#f59e0b' : undefined,
                }}
              >
                <PauseCircleOutlined />
                {!isMobile && <span>Held ({heldOrders.length})</span>}
              </Button>
            </Tooltip>
          </Badge>

          {/* Close Register (Stop Sale) Button */}
          {isRegisterOpen && (
            <Tooltip title="Close Cash Register Session (Shift Summary & End of Day)">
              <Button
                type="primary"
                danger
                onClick={handleInitiateCloseRegister}
                style={{
                  borderRadius: 8,
                  height: 34,
                  fontWeight: 700,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
                }}
              >
                <LockOutlined />
                <span>Close Shift</span>
              </Button>
            </Tooltip>
          )}

          {/* Sound Toggle */}
          <Tooltip title={soundEnabled ? 'Mute POS Beeps' : 'Enable Audio Feedback'}>
            <Button
              type="text"
              icon={<SoundOutlined style={{ color: soundEnabled ? '#2563eb' : adminTheme.subtext }} />}
              onClick={() => setSoundEnabled(!soundEnabled)}
              style={{ width: 34, height: 34, borderRadius: 8 }}
            />
          </Tooltip>

          {/* Dark / Light Toggle */}
          <Tooltip title={themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'}>
            <Button
              type="text"
              icon={themeMode === 'dark' ? <SunOutlined style={{ color: '#f59e0b' }} /> : <MoonOutlined />}
              onClick={toggleThemeMode}
              style={{ width: 34, height: 34, borderRadius: 8 }}
            />
          </Tooltip>

          {/* Fullscreen Toggle */}
          {!isMobile && (
            <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
              <Button
                type="text"
                icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={toggleFullscreen}
                style={{ width: 34, height: 34, borderRadius: 8 }}
              />
            </Tooltip>
          )}

          {/* Cashier Avatar Chip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '2px 8px 2px 4px',
              borderRadius: 20,
              background: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9',
              border: `1px solid ${themeMode === 'dark' ? '#1e293b' : '#e2e8f0'}`,
            }}
          >
            <Avatar
              size={26}
              src={user?.avatar && typeof user.avatar === 'string' && user.avatar.trim() !== '' ? user.avatar : null}
              icon={<UserOutlined />}
              style={{ background: '#f97316' }}
            />
            {!isMobile && (
              <span style={{ fontSize: 12, fontWeight: 700, maxWidth: 90 }} className="truncate">
                {user?.name || user?.first_name || user?.username || 'Cashier'}
              </span>
            )}
          </div>
        </Flex>
      </header>

      {/* ===================================================================== */}
      {/* 2. MAIN POS WORKSPACE: SPLIT-SCREEN LAYOUT                            */}
      {/* Left 65%: Search, Categories & Product Grid                          */}
      {/* Right 35%: Sticky Cart, Adjustment Sliders & Big Checkout Pad        */}
      {/* ===================================================================== */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* =================== LEFT PANEL: PRODUCTS & CATALOG =================== */}
        <div
          style={{
            flex: isDesktop ? '1 1 65%' : '1 1 100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRight: isDesktop ? `1px solid ${themeMode === 'dark' ? '#1e293b' : '#e2e8f0'}` : 'none',
            background: themeMode === 'dark' ? '#090d16' : '#f8fafc',
          }}
        >
          {/* Top Filter Bar: Search Barcode & Category Pills */}
          <div
            style={{
              padding: '12px 16px',
              background: themeMode === 'dark' ? '#0f172a' : '#ffffff',
              borderBottom: `1px solid ${themeMode === 'dark' ? '#1e293b' : '#e2e8f0'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              flexShrink: 0,
            }}
          >
            {/* Search Input with Barcode Autofocus */}
            <div style={{ display: 'flex', gap: 10 }}>
              <Input
                ref={searchInputRef}
                prefix={<BarcodeOutlined style={{ fontSize: 16, color: '#2563eb' }} />}
                suffix={
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: adminTheme.subtext,
                      padding: '2px 6px',
                      background: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
                      borderRadius: 4,
                    }}
                  >
                    F2 Search / Scan
                  </span>
                }
                placeholder="Scan product barcode, SKU, or search item name..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={handleBarcodeScan}
                allowClear
                size="large"
                style={{
                  borderRadius: 10,
                  fontSize: 13.5,
                  background: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
                }}
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchProductsAndCategories}
                loading={loadingProducts}
                size="large"
                style={{ borderRadius: 10 }}
              />
            </div>

            {/* Horizontal Scrollable Category Pills */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                overflowX: 'auto',
                paddingBottom: 2,
                scrollbarWidth: 'none',
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                style={{
                  border: 'none',
                  borderRadius: 20,
                  padding: '5px 14px',
                  fontSize: 12,
                  fontWeight: selectedCategory === 'all' ? 700 : 500,
                  cursor: 'pointer',
                  background: selectedCategory === 'all' ? '#2563eb' : themeMode === 'dark' ? '#1e293b' : '#e2e8f0',
                  color: selectedCategory === 'all' ? '#ffffff' : adminTheme.text,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
              >
                All Products ({products.length})
              </button>
              {categories.map((cat) => {
                const isSelected = String(selectedCategory) === String(cat.id);
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      border: 'none',
                      borderRadius: 20,
                      padding: '5px 14px',
                      fontSize: 12,
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      background: isSelected ? '#2563eb' : themeMode === 'dark' ? '#1e293b' : '#e2e8f0',
                      color: isSelected ? '#ffffff' : adminTheme.text,
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    {cat.name} ({cat.product_count || 0})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 16,
            }}
          >
            {loadingProducts ? (
              <div style={{ padding: 60, textAlign: 'center' }}>
                <Spin size="large" />
                <div style={{ marginTop: 14, color: adminTheme.subtext, fontSize: 13 }}>
                  Loading POS product catalog...
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: adminTheme.subtext }}>
                <InboxOutlined style={{ fontSize: 42, opacity: 0.3, marginBottom: 8 }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>No products found</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  Try adjusting your search keyword or selected category filter.
                </div>
              </div>
            ) : (
              <Row gutter={[12, 12]}>
                {filteredProducts.map((p) => {
                  const isOutOfStock = p.quantity <= 0;
                  const isLowStock = p.quantity > 0 && p.quantity <= 10;

                  return (
                    <Col xs={12} sm={8} md={8} xl={6} xxl={6} key={p.id}>
                      <div
                        onClick={() => addToCart(p)}
                        style={{
                          background: themeMode === 'dark' ? '#0f172a' : '#ffffff',
                          borderRadius: 12,
                          border: `1px solid ${themeMode === 'dark' ? '#1e293b' : '#e2e8f0'}`,
                          padding: 10,
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          height: '100%',
                          minHeight: 180,
                          position: 'relative',
                          transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#2563eb';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.12)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = themeMode === 'dark' ? '#1e293b' : '#e2e8f0';
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.02)';
                        }}
                      >
                        {/* Top: Image & Stock Badge */}
                        <div style={{ position: 'relative', width: '100%', height: 95, borderRadius: 8, overflow: 'hidden', background: themeMode === 'dark' ? '#1e293b' : '#f1f5f9' }}>
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: adminTheme.subtext, fontSize: 24 }}>
                              <ShopOutlined style={{ opacity: 0.3 }} />
                            </div>
                          )}

                          {/* Stock Tag on Image */}
                          <div style={{ position: 'absolute', top: 5, right: 5 }}>
                            <Tag
                              color={isOutOfStock ? 'error' : isLowStock ? 'warning' : 'default'}
                              style={{
                                fontSize: 9.5,
                                fontWeight: 700,
                                borderRadius: 4,
                                margin: 0,
                                padding: '0 5px',
                                background: isOutOfStock
                                  ? 'rgba(239, 68, 68, 0.9)'
                                  : isLowStock
                                  ? 'rgba(245, 158, 11, 0.9)'
                                  : 'rgba(15, 23, 42, 0.75)',
                                color: '#ffffff',
                                border: 'none',
                              }}
                            >
                              {isOutOfStock ? 'Out of stock' : `${p.quantity} pcs`}
                            </Tag>
                          </div>
                        </div>

                        {/* Middle: Name & Barcode */}
                        <div style={{ marginTop: 8 }}>
                          <Text
                            strong
                            style={{
                              fontSize: 12.5,
                              color: adminTheme.text,
                              display: 'block',
                              lineHeight: 1.25,
                            }}
                            className="truncate"
                            title={p.name}
                          >
                            {p.name}
                          </Text>
                          <div style={{ fontSize: 10, color: adminTheme.subtext, fontFamily: 'monospace', marginTop: 1 }}>
                            {p.code}
                          </div>
                        </div>

                        {/* Bottom: Price in USD & KHR */}
                        <div
                          style={{
                            marginTop: 8,
                            paddingTop: 6,
                            borderTop: `1px dashed ${themeMode === 'dark' ? '#1e293b' : '#f1f5f9'}`,
                            display: 'flex',
                            alignItems: 'baseline',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <span style={{ fontSize: 15, fontWeight: 800, color: '#16a34a' }}>
                              ${p.price.toFixed(2)}
                            </span>
                            <span style={{ fontSize: 10, color: adminTheme.subtext, marginLeft: 4 }}>
                              {(p.price * KHR_EXCHANGE_RATE).toLocaleString()} ៛
                            </span>
                          </div>

                          {p.units && p.units.length > 1 && (
                            <Tag color="blue" style={{ fontSize: 9.5, borderRadius: 4, margin: 0, padding: '0 4px' }}>
                              {p.units.length} Units
                            </Tag>
                          )}
                        </div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            )}
          </div>
        </div>

        {/* =================== RIGHT PANEL: STICKY CART & CHECKOUT =================== */}
        {isDesktop && (
          <div
            style={{
              flex: '1 1 35%',
              maxWidth: '35%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              background: themeMode === 'dark' ? '#0f172a' : '#ffffff',
              borderLeft: `1px solid ${themeMode === 'dark' ? '#1e293b' : '#e2e8f0'}`,
              boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.03)',
            }}
          >
            {/* Cart Header & Customer Selector */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${themeMode === 'dark' ? '#1e293b' : '#e2e8f0'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Flex align="center" gap={8}>
                  <ShoppingCartOutlined style={{ fontSize: 16, color: '#2563eb' }} />
                  <span style={{ fontWeight: 800, fontSize: 14 }}>ACTIVE ORDER</span>
                  <Tag color="blue" style={{ borderRadius: 10, fontWeight: 700 }}>
                    {totalItemCount} Items
                  </Tag>
                </Flex>

                {cart.length > 0 && (
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<ClearOutlined />}
                    onClick={clearCart}
                    style={{ fontSize: 11, fontWeight: 600 }}
                  >
                    Clear (ESC)
                  </Button>
                )}
              </div>

              {/* Customer Selector Dropdown */}
              <div style={{ display: 'flex', gap: 6 }}>
                <Select
                  showSearch
                  placeholder="Select Customer"
                  value={selectedCustomerId}
                  onChange={(val, opt) => {
                    setSelectedCustomerId(val);
                    setSelectedCustomerName(opt.children || 'Customer');
                  }}
                  filterOption={(input, option) =>
                    (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  style={{ flex: 1 }}
                >
                  <Option value={1}>Walk-in Customer</Option>
                  {customers.map((c) => (
                    <Option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </Option>
                  ))}
                </Select>

                <Tooltip title="Quick Add Customer">
                  <Button
                    icon={<UserAddOutlined />}
                    onClick={() => setQuickAddCustomerVisible(true)}
                  />
                </Tooltip>
              </div>
            </div>

            {/* Cart Items List (Scrollable) */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '8px 14px',
              }}
            >
              {cart.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: adminTheme.subtext }}>
                  <ShoppingCartOutlined style={{ fontSize: 44, opacity: 0.25, marginBottom: 8 }} />
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Cart is empty</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    Tap items on the left or scan barcode to add to current order.
                  </div>
                </div>
              ) : (
                cart.map((item) => {
                  const lineTotal = item.quantity * item.unit_price;

                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: themeMode === 'dark' ? '#1e293b' : '#f8fafc',
                        border: `1px solid ${themeMode === 'dark' ? '#334155' : '#e2e8f0'}`,
                        marginBottom: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      {/* Line 1: Title, Unit Selector & Price */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <Text strong style={{ fontSize: 13, color: adminTheme.text, display: 'block' }} className="truncate">
                            {item.name}
                          </Text>
                          <span style={{ fontSize: 10.5, color: adminTheme.subtext, fontFamily: 'monospace' }}>
                            {item.code}
                          </span>
                        </div>

                        {/* Multi-unit dropdown (AURA_v1) */}
                        {item.available_units && item.available_units.length > 1 ? (
                          <Select
                            size="small"
                            value={item.unit_id}
                            onChange={(uid) => handleUnitChange(item.id, uid)}
                            style={{ width: 85 }}
                          >
                            {item.available_units.map((u) => (
                              <Option key={u.unit_id} value={u.unit_id}>
                                {u.unit_name}
                              </Option>
                            ))}
                          </Select>
                        ) : (
                          <Tag style={{ fontSize: 10, margin: 0 }}>{item.unit_name || 'Piece'}</Tag>
                        )}

                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: '#16a34a' }}>
                            ${lineTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Line 2: Quantity Steppers & Delete */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                        <div style={{ fontSize: 11, color: adminTheme.subtext }}>
                          ${item.unit_price.toFixed(2)} / {item.unit_name}
                        </div>

                        <Flex align="center" gap={6}>
                          <Button
                            size="small"
                            icon={<MinusOutlined style={{ fontSize: 10 }} />}
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            style={{ borderRadius: 6, width: 26, height: 26 }}
                          />
                          <InputNumber
                            size="small"
                            min={1}
                            max={9999}
                            value={item.quantity}
                            onChange={(val) => updateQuantity(item.id, parseInt(val, 10) || 1)}
                            style={{ width: 50, textAlign: 'center', borderRadius: 6 }}
                          />
                          <Button
                            size="small"
                            icon={<PlusOutlined style={{ fontSize: 10 }} />}
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            style={{ borderRadius: 6, width: 26, height: 26 }}
                          />
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined style={{ fontSize: 13 }} />}
                            onClick={() => removeFromCart(item.id)}
                            style={{ marginLeft: 4 }}
                          />
                        </Flex>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Totals & Adjustments Summary */}
            <div
              style={{
                padding: '12px 16px',
                background: themeMode === 'dark' ? 'rgba(0, 0, 0, 0.25)' : '#f8fafc',
                borderTop: `1px solid ${themeMode === 'dark' ? '#1e293b' : '#e2e8f0'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                flexShrink: 0,
              }}
            >
              {/* Subtotal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span style={{ color: adminTheme.subtext }}>Subtotal</span>
                <span style={{ fontWeight: 600 }}>${cartSubtotal.toFixed(2)}</span>
              </div>

              {/* Order Discount */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5 }}>
                <span style={{ color: adminTheme.subtext, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>Discount</span>
                  <Radio.Group
                    size="small"
                    value={orderDiscountType}
                    onChange={(e) => setOrderDiscountType(e.target.value)}
                  >
                    <Radio.Button value="percent">%</Radio.Button>
                    <Radio.Button value="fixed">$</Radio.Button>
                  </Radio.Group>
                </span>
                <InputNumber
                  size="small"
                  min={0}
                  value={orderDiscountValue}
                  onChange={(val) => setOrderDiscountValue(parseFloat(val) || 0)}
                  style={{ width: 75, textAlign: 'right' }}
                />
              </div>

              {/* Tax (VAT) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5 }}>
                <span style={{ color: adminTheme.subtext, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>Tax (VAT)</span>
                  <Select
                    size="small"
                    value={orderTaxRate}
                    onChange={(val) => setOrderTaxRate(val)}
                    style={{ width: 85 }}
                  >
                    <Option value={0}>0% None</Option>
                    <Option value={10}>10% VAT</Option>
                    <Option value={7}>7% State</Option>
                  </Select>
                </span>
                <span>+${taxAmount.toFixed(2)}</span>
              </div>

              <Divider style={{ margin: '6px 0' }} />

              {/* Grand Total Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: adminTheme.text }}>TOTAL PAYABLE</div>
                  <div style={{ fontSize: 11, color: adminTheme.subtext }}>
                    Exchange: 1$ = {KHR_EXCHANGE_RATE.toLocaleString()} ៛
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#16a34a', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                    ${grandTotalUSD.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#2563eb' }}>
                    {grandTotalKHR.toLocaleString()} ៛
                  </div>
                </div>
              </div>

              {/* Action Pad: Hold & Checkout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginTop: 8 }}>
                <Button
                  size="large"
                  icon={<PauseCircleOutlined />}
                  onClick={handleHoldOrder}
                  disabled={cart.length === 0}
                  style={{ borderRadius: 10, fontWeight: 700, height: 48 }}
                >
                  Hold (F4)
                </Button>

                <Button
                  type="primary"
                  size="large"
                  icon={<ThunderboltFilled />}
                  onClick={handleOpenCheckout}
                  disabled={cart.length === 0}
                  style={{
                    borderRadius: 10,
                    fontWeight: 800,
                    height: 48,
                    background: '#16a34a',
                    borderColor: '#16a34a',
                    fontSize: 15,
                    boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
                  }}
                >
                  PAY ${grandTotalUSD.toFixed(2)} (F9)
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* =================== MOBILE FLOATING BOTTOM CART BAR =================== */}
        {isMobile && cart.length > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: 14,
              left: 14,
              right: 14,
              background: '#16a34a',
              borderRadius: 16,
              padding: '12px 18px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 8px 24px rgba(22, 163, 74, 0.45)',
              zIndex: 40,
              cursor: 'pointer',
            }}
            onClick={() => setMobileCartDrawerOpen(true)}
          >
            <Flex align="center" gap={10}>
              <Badge count={totalItemCount} style={{ backgroundColor: '#ffffff', color: '#16a34a', fontWeight: 800 }}>
                <ShoppingCartOutlined style={{ fontSize: 22, color: '#ffffff' }} />
              </Badge>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.9 }}>CURRENT ORDER</div>
                <div style={{ fontSize: 16, fontWeight: 900 }}>${grandTotalUSD.toFixed(2)}</div>
              </div>
            </Flex>

            <Button
              type="default"
              style={{
                borderRadius: 10,
                fontWeight: 800,
                color: '#16a34a',
                border: 'none',
              }}
            >
              View Cart & Pay &rarr;
            </Button>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 3. MODAL: OPEN REGISTER (SHUTTER GATE)                                */}
      {/* ===================================================================== */}
      <Modal
        title={
          <Flex align="center" gap={10}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#2563eb', color: '#fff', display: 'grid', placeItems: 'center' }}>
              <UnlockOutlined />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Open Cash Register</div>
              <div style={{ fontSize: 11, color: adminTheme.subtext, fontWeight: 400 }}>
                Enter cash on hand to unlock POS sales session
              </div>
            </div>
          </Flex>
        }
        open={openRegisterModalVisible}
        footer={null}
        closable={false}
        width={440}
        destroyOnHidden
      >
        <Form form={openRegisterForm} layout="vertical" onFinish={handleOpenRegister} initialValues={{ cash_in_hand: 100 }}>
          <div
            style={{
              padding: 14,
              borderRadius: 10,
              background: themeMode === 'dark' ? '#1e293b' : '#f8fafc',
              marginBottom: 16,
              border: `1px solid ${themeMode === 'dark' ? '#334155' : '#e2e8f0'}`,
            }}
          >
            <div style={{ fontSize: 11, color: adminTheme.subtext }}>CASHIER ASSIGNMENT</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 2 }}>
              {user?.name || user?.username || 'Current Operator'} ({user?.group_name || 'Staff'})
            </div>
            <div style={{ fontSize: 11, color: adminTheme.subtext, marginTop: 2 }}>
              Terminal: POS Station #1 • Branch: Main Store
            </div>
          </div>

          <Form.Item
            name="cash_in_hand"
            label={<span style={{ fontWeight: 700 }}>Opening Cash in Hand (USD $)</span>}
            rules={[{ required: true, message: 'Please enter starting cash amount' }]}
          >
            <InputNumber
              size="large"
              prefix="$"
              min={0}
              step={10}
              style={{ width: '100%', borderRadius: 8, fontSize: 16, fontWeight: 700 }}
              placeholder="e.g. 100.00"
            />
          </Form.Item>

          <Form.Item name="note" label="Shift Notes (Optional)">
            <Input.TextArea rows={2} placeholder="e.g., Morning shift float, drawer verified with supervisor" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            icon={<UnlockOutlined />}
            style={{
              height: 46,
              borderRadius: 8,
              fontWeight: 800,
              background: '#2563eb',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
            }}
          >
            Open Register & Unlock POS
          </Button>

          <Button
            type="text"
            block
            onClick={() => navigate('/admins/dashboard')}
            style={{ marginTop: 8 }}
          >
            Return to Admin Dashboard
          </Button>
        </Form>
      </Modal>

      {/* ===================================================================== */}
      {/* 4. MODAL: CLOSE REGISTER (SHIFT RECONCILIATION SUMMARY)                */}
      {/* ===================================================================== */}
      <Modal
        title={
          <Flex align="center" gap={10}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ef4444', color: '#fff', display: 'grid', placeItems: 'center' }}>
              <LockOutlined />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Close Cash Register</div>
              <div style={{ fontSize: 11, color: adminTheme.subtext, fontWeight: 400 }}>
                Reconcile physical cash drawer and finalize cashier shift
              </div>
            </div>
          </Flex>
        }
        open={closeRegisterModalVisible}
        onCancel={() => setCloseRegisterModalVisible(false)}
        footer={null}
        width={580}
        destroyOnHidden
      >
        {loadingSummary ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Spin size="large" />
            <div style={{ marginTop: 12, color: adminTheme.subtext }}>Calculating shift summary totals...</div>
          </div>
        ) : (
          <Form form={closeRegisterForm} layout="vertical" onFinish={handleSubmitCloseRegister}>
            {/* Shift Breakdown Box (Matching AURA_v1 close_register.php) */}
            <div
              style={{
                borderRadius: 12,
                background: themeMode === 'dark' ? '#1e293b' : '#f8fafc',
                border: `1px solid ${themeMode === 'dark' ? '#334155' : '#e2e8f0'}`,
                padding: '14px 18px',
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: adminTheme.subtext, marginBottom: 8 }}>
                SHIFT REVENUE & CASH SUMMARY
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(150, 150, 150, 0.1)' }}>
                <span>Opening Cash in Hand:</span>
                <strong>${(shiftSummary?.cash_in_hand || 0).toFixed(2)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(150, 150, 150, 0.1)' }}>
                <span>Cash Sales:</span>
                <strong style={{ color: '#16a34a' }}>+${(shiftSummary?.cash_sales || 0).toFixed(2)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(150, 150, 150, 0.1)' }}>
                <span>Bakong KHQR / ABA Payments:</span>
                <strong style={{ color: '#0a84ff' }}>${(shiftSummary?.khqr_sales || 0).toFixed(2)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(150, 150, 150, 0.1)' }}>
                <span>Card & Bank Terminal Slips:</span>
                <strong style={{ color: '#8b5cf6' }}>${(shiftSummary?.card_sales || 0).toFixed(2)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 2px 0', fontSize: 14, fontWeight: 800 }}>
                <span>EXPECTED CASH IN DRAWER:</span>
                <span style={{ color: '#16a34a', fontSize: 16 }}>
                  ${(shiftSummary?.expected_cash || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Input Counted Cash */}
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  name="total_cash_submitted"
                  label={<span style={{ fontWeight: 700 }}>Actual Counted Cash ($)</span>}
                  rules={[{ required: true, message: 'Please count drawer cash' }]}
                >
                  <InputNumber
                    size="large"
                    prefix="$"
                    min={0}
                    style={{ width: '100%', borderRadius: 8, fontSize: 15, fontWeight: 700 }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="total_cc_slips_submitted" label="Card Slips Count">
                  <InputNumber size="large" min={0} style={{ width: '100%', borderRadius: 8 }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="note" label="Closure Notes">
              <Input.TextArea rows={2} placeholder="Explain any discrepancy or cash handover to next cashier" />
            </Form.Item>

            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <Button
                type="primary"
                danger
                htmlType="submit"
                size="large"
                block
                icon={<LockOutlined />}
                style={{ borderRadius: 8, fontWeight: 700 }}
              >
                Submit & Close Shift
              </Button>
              <Button size="large" onClick={() => setCloseRegisterModalVisible(false)} style={{ borderRadius: 8 }}>
                Cancel
              </Button>
            </div>
          </Form>
        )}
      </Modal>

      {/* ===================================================================== */}
      {/* 5. MODAL: CHECKOUT & PAYMENT METHOD SELECTOR                          */}
      {/* ===================================================================== */}
      <Modal
        title={
          <Flex align="center" gap={10}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#16a34a', color: '#fff', display: 'grid', placeItems: 'center' }}>
              <DollarOutlined />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Checkout & Finalize Payment</div>
              <div style={{ fontSize: 11, color: adminTheme.subtext, fontWeight: 400 }}>
                Select tender method, calculate change and issue receipt
              </div>
            </div>
          </Flex>
        }
        open={checkoutModalVisible}
        onCancel={() => setCheckoutModalVisible(false)}
        footer={null}
        width={640}
        destroyOnHidden
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Payable Header Display */}
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 12,
              background: themeMode === 'dark' ? '#1e293b' : '#f0fdf4',
              border: `1px solid ${themeMode === 'dark' ? '#334155' : '#bbf7d0'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: adminTheme.subtext, fontWeight: 600 }}>TOTAL AMOUNT DUE</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#16a34a', lineHeight: 1.1 }}>
                ${grandTotalUSD.toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: adminTheme.subtext }}>KHMER RIEL EQUIVALENT</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#2563eb' }}>
                {grandTotalKHR.toLocaleString()} ៛
              </div>
            </div>
          </div>

          {/* Payment Method Selector Tabs */}
          <Radio.Group
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}
          >
            {[
              { key: 'Cash', label: 'Cash Tender', icon: <DollarCircleOutlined /> },
              { key: 'KHQR', label: 'Bakong KHQR', icon: <QrcodeOutlined /> },
              { key: 'Card', label: 'Credit Card', icon: <CreditCardOutlined /> },
              { key: 'Bank', label: 'Bank Transfer', icon: <ShopOutlined /> },
            ].map((m) => (
              <Radio.Button
                key={m.key}
                value={m.key}
                style={{
                  height: 48,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 12,
                  gap: 6,
                }}
              >
                {m.icon} {m.label}
              </Radio.Button>
            ))}
          </Radio.Group>

          {/* Tab 1: Cash Tender & Change Due Calculator */}
          {paymentMethod === 'Cash' && (
            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background: themeMode === 'dark' ? '#1e293b' : '#f8fafc',
                border: `1px solid ${themeMode === 'dark' ? '#334155' : '#e2e8f0'}`,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>QUICK TENDER BUTTONS</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {[
                  { label: 'Exact', val: grandTotalUSD },
                  { label: '$5', val: 5 },
                  { label: '$10', val: 10 },
                  { label: '$20', val: 20 },
                  { label: '$50', val: 50 },
                  { label: '$100', val: 100 },
                ].map((q) => (
                  <Button
                    key={q.label}
                    onClick={() => setTenderedUSD(q.val)}
                    style={{ borderRadius: 8, fontWeight: 700, fontSize: 12 }}
                  >
                    {q.label}
                  </Button>
                ))}
              </div>

              <Row gutter={12}>
                <Col span={12}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: adminTheme.subtext, display: 'block', marginBottom: 4 }}>
                    Cash Received in USD ($)
                  </label>
                  <InputNumber
                    size="large"
                    prefix="$"
                    min={0}
                    value={tenderedUSD}
                    onChange={(v) => setTenderedUSD(parseFloat(v) || 0)}
                    style={{ width: '100%', borderRadius: 8, fontSize: 16, fontWeight: 800 }}
                  />
                </Col>
                <Col span={12}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: adminTheme.subtext, display: 'block', marginBottom: 4 }}>
                    Cash Received in KHR (៛)
                  </label>
                  <InputNumber
                    size="large"
                    prefix="៛"
                    min={0}
                    step={1000}
                    value={tenderedKHR}
                    onChange={(v) => setTenderedKHR(parseFloat(v) || 0)}
                    style={{ width: '100%', borderRadius: 8, fontSize: 16, fontWeight: 800 }}
                  />
                </Col>
              </Row>

              {/* Change Due Display */}
              <div
                style={{
                  marginTop: 14,
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: changeDueUSD >= 0 ? 'rgba(22, 163, 74, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 13, color: changeDueUSD >= 0 ? '#16a34a' : '#ef4444' }}>
                  CHANGE DUE TO CUSTOMER:
                </span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: changeDueUSD >= 0 ? '#16a34a' : '#ef4444' }}>
                    ${changeDueUSD.toFixed(2)}
                  </span>
                  <span style={{ fontSize: 12, marginLeft: 6, fontWeight: 700, color: adminTheme.subtext }}>
                    ({changeDueKHR.toLocaleString()} ៛)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Bakong KHQR Real-time QR Code */}
          {paymentMethod === 'KHQR' && (
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                background: themeMode === 'dark' ? '#1e293b' : '#f8fafc',
                textAlign: 'center',
                border: `1px solid ${themeMode === 'dark' ? '#334155' : '#e2e8f0'}`,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 14, color: '#e11d48' }}>
                BAKONG KHQR • SCAN TO PAY
              </div>
              <div style={{ fontSize: 11, color: adminTheme.subtext, marginTop: 2 }}>
                Scan using any Cambodian banking app (ABA, Acleda, Canadia, Wing, etc.)
              </div>

              {/* Simulated KHQR Visual Display */}
              <div
                style={{
                  width: 170,
                  height: 170,
                  margin: '12px auto',
                  background: '#ffffff',
                  padding: 10,
                  borderRadius: 12,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <QrcodeOutlined style={{ fontSize: 110, color: '#0f172a' }} />
                <div style={{ fontSize: 10, fontWeight: 800, color: '#e11d48', marginTop: 2 }}>
                  KHQR • ${grandTotalUSD.toFixed(2)}
                </div>
              </div>

              <Tag color="processing" style={{ fontWeight: 700 }}>
                Listening for real-time NBC payment webhook...
              </Tag>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <Button
              type="primary"
              size="large"
              block
              icon={<PrinterOutlined />}
              loading={isSubmittingSale}
              onClick={handleFinalizeSale}
              style={{
                height: 48,
                borderRadius: 10,
                fontWeight: 800,
                fontSize: 15,
                background: '#16a34a',
                borderColor: '#16a34a',
                boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
              }}
            >
              COMPLETE SALE & ISSUE RECEIPT (F9)
            </Button>
            <Button size="large" onClick={() => setCheckoutModalVisible(false)} style={{ borderRadius: 10 }}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* ===================================================================== */}
      {/* 6. MODAL: THERMAL POS RECEIPT VIEW (80mm Thermal Receipt Layout)      */}
      {/* ===================================================================== */}
      <Modal
        open={receiptModalVisible}
        onCancel={() => setReceiptModalVisible(false)}
        footer={null}
        width={380}
        destroyOnHidden
        styles={{ body: { padding: '16px 20px' } }}
      >
        <div id="pos-thermal-receipt" style={{ fontFamily: 'monospace', color: '#000000', fontSize: 12 }}>
          {/* Store Receipt Header */}
          <div style={{ textAlign: 'center', paddingBottom: 8, borderBottom: '1px dashed #000' }}>
            <div style={{ fontSize: 16, fontWeight: 900 }}>AURA ENTERPRISE</div>
            <div style={{ fontSize: 11 }}>Main Store • Branch #01</div>
            <div style={{ fontSize: 10 }}>Phnom Penh, Cambodia • Tel: +855 23 888 999</div>
            <div style={{ fontSize: 10, marginTop: 2 }}>VAT TIN: K001-902188219</div>
          </div>

          {/* Invoice Meta */}
          <div style={{ padding: '8px 0', borderBottom: '1px dashed #000', fontSize: 11, lineHeight: 1.4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>INV NO:</span>
              <strong>{completedInvoice?.reference_no || 'POS-2026-001'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>DATE:</span>
              <span>{new Date().toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>CASHIER:</span>
              <span>{user?.name || user?.username || 'Admin'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>CUSTOMER:</span>
              <span>{completedInvoice?.customer || 'Walk-in Customer'}</span>
            </div>
          </div>

          {/* Line Items Table */}
          <div style={{ padding: '8px 0', borderBottom: '1px dashed #000' }}>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>
                  <th style={{ padding: '2px 0' }}>ITEM</th>
                  <th style={{ textAlign: 'center' }}>QTY</th>
                  <th style={{ textAlign: 'right' }}>PRICE</th>
                  <th style={{ textAlign: 'right' }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {(completedInvoice?.items || []).map((it, idx) => (
                  <tr key={idx} style={{ verticalAlign: 'top' }}>
                    <td style={{ padding: '3px 0' }}>
                      <div>{it.name}</div>
                      <span style={{ fontSize: 9.5, opacity: 0.7 }}>{it.unit_name || 'pcs'}</span>
                    </td>
                    <td style={{ textAlign: 'center', padding: '3px 0' }}>{it.quantity}</td>
                    <td style={{ textAlign: 'right', padding: '3px 0' }}>${it.unit_price?.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: '3px 0', fontWeight: 700 }}>
                      ${(it.quantity * it.unit_price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown */}
          <div style={{ padding: '8px 0', borderBottom: '1px dashed #000', fontSize: 11, lineHeight: 1.4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal:</span>
              <span>${completedInvoice?.subtotal?.toFixed(2)}</span>
            </div>
            {completedInvoice?.discount_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Discount:</span>
                <span>-${completedInvoice?.discount_amount?.toFixed(2)}</span>
              </div>
            )}
            {completedInvoice?.tax_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Tax (VAT):</span>
                <span>+${completedInvoice?.tax_amount?.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 900, marginTop: 4 }}>
              <span>GRAND TOTAL:</span>
              <span>${completedInvoice?.grand_total?.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700 }}>
              <span>TOTAL (KHR):</span>
              <span>{(completedInvoice?.grand_total * KHR_EXCHANGE_RATE).toLocaleString()} ៛</span>
            </div>
          </div>

          {/* Payment Details */}
          <div style={{ padding: '8px 0', borderBottom: '1px dashed #000', fontSize: 11, lineHeight: 1.4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Paid via ({completedInvoice?.paid_by || 'Cash'}):</span>
              <span>${completedInvoice?.paid_amount?.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>Change Due:</span>
              <span>${completedInvoice?.change_amount?.toFixed(2) || '0.00'}</span>
            </div>
          </div>

          {/* Footer Barcode & Thank You */}
          <div style={{ textAlign: 'center', paddingTop: 10 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.1em' }}>*** THANK YOU FOR SHOPPING ***</div>
            <div style={{ fontSize: 9.5, opacity: 0.7, marginTop: 2 }}>Goods sold are non-refundable after 7 days</div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <Button
            type="primary"
            block
            icon={<PrinterOutlined />}
            onClick={() => window.print()}
            style={{ borderRadius: 8, fontWeight: 700 }}
          >
            Print Receipt
          </Button>
          <Button
            block
            onClick={() => setReceiptModalVisible(false)}
            style={{ borderRadius: 8 }}
          >
            New Sale (F1)
          </Button>
        </div>
      </Modal>

      {/* ===================================================================== */}
      {/* 7. DRAWER: RECALL HELD ORDERS                                         */}
      {/* ===================================================================== */}
      <Drawer
        title={`Held Suspended Orders (${heldOrders.length})`}
        placement="right"
        width={380}
        open={heldOrdersDrawerVisible}
        onClose={() => setHeldOrdersDrawerVisible(false)}
      >
        {heldOrders.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: adminTheme.subtext }}>
            <PauseCircleOutlined style={{ fontSize: 36, opacity: 0.3, marginBottom: 8 }} />
            <div>No held orders currently in queue</div>
          </div>
        ) : (
          heldOrders.map((h) => (
            <div
              key={h.id}
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                border: `1px solid ${themeMode === 'dark' ? '#334155' : '#e2e8f0'}`,
                background: themeMode === 'dark' ? '#1e293b' : '#f8fafc',
                marginBottom: 10,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong style={{ fontSize: 13.5 }}>{h.customerName}</strong>
                <span style={{ fontSize: 11, color: adminTheme.subtext }}>{h.time}</span>
              </div>
              <div style={{ fontSize: 12, color: adminTheme.subtext, marginTop: 3 }}>
                {h.items.length} items • <strong style={{ color: '#16a34a' }}>${h.grandTotalUSD.toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <Button
                  type="primary"
                  size="small"
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleRecallOrder(h)}
                  style={{ borderRadius: 6, fontWeight: 700 }}
                >
                  Recall to Cart
                </Button>
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => setHeldOrders((prev) => prev.filter((o) => o.id !== h.id))}
                  style={{ borderRadius: 6 }}
                />
              </div>
            </div>
          ))
        )}
      </Drawer>

      {/* ===================================================================== */}
      {/* 8. DRAWER: MOBILE CART DRAWER (For Screens < 992px)                   */}
      {/* ===================================================================== */}
      <Drawer
        title="Current Cart & Checkout"
        placement="bottom"
        height="85vh"
        open={mobileCartDrawerOpen}
        onClose={() => setMobileCartDrawerOpen(false)}
        styles={{ body: { padding: 12 } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {cart.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: 10,
                  borderRadius: 10,
                  background: themeMode === 'dark' ? '#1e293b' : '#f8fafc',
                  marginBottom: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: adminTheme.subtext }}>
                    {item.quantity} x ${item.unit_price.toFixed(2)} ({item.unit_name})
                  </div>
                </div>
                <Flex align="center" gap={6}>
                  <Button size="small" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                    -
                  </Button>
                  <span style={{ fontWeight: 700 }}>{item.quantity}</span>
                  <Button size="small" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                    +
                  </Button>
                  <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => removeFromCart(item.id)} />
                </Flex>
              </div>
            ))}
          </div>

          <div style={{ paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, marginBottom: 10 }}>
              <span>Grand Total:</span>
              <span style={{ color: '#16a34a' }}>${grandTotalUSD.toFixed(2)}</span>
            </div>
            <Button
              type="primary"
              size="large"
              block
              onClick={() => {
                setMobileCartDrawerOpen(false);
                handleOpenCheckout();
              }}
              style={{ height: 48, borderRadius: 10, fontWeight: 800, background: '#16a34a' }}
            >
              Proceed to Pay &rarr;
            </Button>
          </div>
        </div>
      </Drawer>

      {/* ===================================================================== */}
      {/* 9. MODAL: QUICK ADD CUSTOMER                                          */}
      {/* ===================================================================== */}
      <Modal
        title="Quick Add Customer"
        open={quickAddCustomerVisible}
        onCancel={() => setQuickAddCustomerVisible(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={quickCustomerForm} layout="vertical" onFinish={handleCreateCustomer}>
          <Form.Item name="name" label="Customer Name" rules={[{ required: true, message: 'Customer name is required' }]}>
            <Input placeholder="e.g. John Doe / Company" />
          </Form.Item>
          <Form.Item name="phone" label="Phone Number">
            <Input placeholder="e.g. 012 888 999" />
          </Form.Item>
          <Form.Item name="email" label="Email Address">
            <Input placeholder="customer@aura.com" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" style={{ borderRadius: 8, fontWeight: 700 }}>
            Save Customer
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default PosTerminal;
