import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';

// ---------------------------------------------------------------------------
// 1. Supported Languages List (Concept cloned from AURA_v1)
// ---------------------------------------------------------------------------
export const SUPPORTED_LANGUAGES = [
  {
    code: 'english',
    iso: 'en',
    name: 'English',
    native: 'English',
    flag: '🇺🇸',
    direction: 'ltr',
    is_default: true,
  },
  {
    code: 'khmer',
    iso: 'kh',
    name: 'Khmer',
    native: 'ភាសាខ្មែរ',
    flag: '🇰🇭',
    direction: 'ltr',
    is_default: false,
  },
  {
    code: 'chinese',
    iso: 'zh',
    name: 'Simplified Chinese',
    native: '简体中文',
    flag: '🇨🇳',
    direction: 'ltr',
    is_default: false,
  },
  {
    code: 'thai',
    iso: 'th',
    name: 'Thai',
    native: 'ภาษาไทย',
    flag: '🇹🇭',
    direction: 'ltr',
    is_default: false,
  },
  {
    code: 'vietnamese',
    iso: 'vi',
    name: 'Vietnamese',
    native: 'Tiếng Việt',
    flag: '🇻🇳',
    direction: 'ltr',
    is_default: false,
  },
];

// ---------------------------------------------------------------------------
// 2. Core High-Priority Preloaded Dictionary (Zero-latency instant render)
// ---------------------------------------------------------------------------
const CORE_VOCABULARY = {
  english: {
    dashboard: 'Dashboard',
    pos: 'POS',
    list_pos: 'List POS',
    pos_settings: 'POS Settings',
    products: 'Products',
    add_product: 'Add Product',
    categories: 'Categories',
    sales: 'Sales',
    purchases: 'Purchases',
    orders: 'Orders',
    customers: 'Customers',
    suppliers: 'Suppliers',
    warehouses: 'Warehouses',
    branches: 'Branches',
    billers: 'Billers',
    users: 'Users & Permissions',
    reports: 'Reports',
    settings: 'System Settings',
    modules: 'ERP Modules',
    language: 'Language',
    change_language: 'Change Language',
    theme_settings: 'Theme & Appearance',
    transparent_mode: 'Transparent Glass Mode',
    dark_mode: 'Dark Mode',
    light_mode: 'Light Mode',
    profile: 'My Profile',
    logout: 'Log Out',
    login: 'Log In',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    search: 'Search',
    export: 'Export',
    filter: 'Filter',
    refresh: 'Refresh',
    actions: 'Actions',
    status: 'Status',
    total: 'Total',
    price: 'Price',
    quantity: 'Quantity',
    unit: 'Unit',
    discount: 'Discount',
    tax: 'Tax',
    created_at: 'Created Date',
    storefront: 'Storefront',
    welcome: 'Welcome',
    all: 'All',
    view: 'View',
    print: 'Print',
    overview: 'Overview',
    financial: 'Financial',
    inventory: 'Inventory',
    hospitality: 'Hospitality',
    crm: 'CRM & Customers',
    hr: 'Human Resources',
    accounting: 'Accounting',
    appearance: 'Appearance',
    density: 'Density',
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
    completed: 'Completed',
    cancelled: 'Cancelled',
    date: 'Date',
    reference_no: 'Reference No',
    biller: 'Biller',
    customer: 'Customer',
    grand_total: 'Grand Total',
    paid: 'Paid',
    balance: 'Balance',
    payment_status: 'Payment Status',
    action: 'Action',
    home: 'Home',
    shops: 'Shops',
    service: 'Service',
    learn: 'Learn',
    like: 'Like',
    cart: 'Cart',
    account: 'Account',
    basket: 'Basket',
    switch: 'Switch',
    dine_in_table: 'Dine-In • Table',
    erp_portal: 'ERP Portal',
    operations_portal: 'Operations Portal',
    sign_in: 'Sign In',
    register: 'Register',
  },
  khmer: {
    dashboard: 'ផ្ទាំងគ្រប់គ្រង',
    pos: 'ភីអូអេស (POS)',
    list_pos: 'បញ្ជីភីអូអេស',
    pos_settings: 'ការកំណត់ភីអូអេស',
    products: 'ទំនិញ',
    add_product: 'បង្កើតផលិតផលថ្មី',
    categories: 'ប្រភេទទំនិញ',
    sales: 'ការលក់',
    purchases: 'ការទិញទំនិញ',
    orders: 'ការបញ្ជាទិញ',
    customers: 'អតិថិជន',
    suppliers: 'អ្នកផ្គត់ផ្គង់',
    warehouses: 'ឃ្លាំងទំនិញ',
    branches: 'សាខាអាជីវកម្ម',
    billers: 'អ្នកចេញវិក្កយបត្រ',
    users: 'អ្នកប្រើប្រាស់ និងសិទ្ធិ',
    reports: 'របាយការណ៍',
    settings: 'ការកំណត់ប្រព័ន្ធ',
    modules: 'ម៉ូឌុល ERP',
    language: 'ភាសា',
    change_language: 'ផ្លាស់ប្តូរភាសា',
    theme_settings: 'រូបរាង និងពណ៌ប្រព័ន្ធ',
    transparent_mode: 'ផ្ទៃខាងក្រោយថ្លា (Glass)',
    dark_mode: 'មុខងារងងឹត (Dark)',
    light_mode: 'មុខងារពន្លឺ (Light)',
    profile: 'គណនីរបស់ខ្ញុំ',
    logout: 'ចាកចេញ',
    login: 'ចូលប្រើប្រាស់',
    save: 'រក្សាទុក',
    cancel: 'បោះបង់',
    delete: 'លុប',
    edit: 'កែប្រែ',
    search: 'ស្វែងរក',
    export: 'ទាញយកទិន្នន័យ',
    filter: 'ចម្រាញ់ទិន្នន័យ',
    refresh: 'ផ្ទុកឡើងវិញ',
    actions: 'សកម្មភាព',
    status: 'ស្ថានភាព',
    total: 'សរុប',
    price: 'តម្លៃ',
    quantity: 'បរិមាណ',
    unit: 'ឯកតា',
    discount: 'បញ្ចុះតម្លៃ',
    tax: 'ពន្ធ',
    created_at: 'កាលបរិច្ឆេទបង្កើត',
    storefront: 'គេហទំព័រហាង',
    welcome: 'សូមស្វាគមន៍',
    all: 'ទាំងអស់',
    view: 'មើល',
    print: 'បោះពុម្ព',
    overview: 'ទិដ្ឋភាពទូទៅ',
    financial: 'ហិរញ្ញវត្ថុ',
    inventory: 'ស្តុកទំនិញ',
    hospitality: 'បដិសណ្ឋារកិច្ច',
    crm: 'អតិថិជន និង CRM',
    hr: 'ធនធានមនុស្ស',
    accounting: 'គណនេយ្យ',
    appearance: 'រូបរាង',
    density: 'គម្លាតផ្ទៃ',
    active: 'ដំណើរការ',
    inactive: 'ផ្អាកដំណើរការ',
    pending: 'កំពុងរង់ចាំ',
    completed: 'បានបញ្ចប់',
    cancelled: 'បានបោះបង់',
    date: 'កាលបរិច្ឆេទ',
    reference_no: 'លេខយោង',
    biller: 'អ្នកចេញវិក្កយបត្រ',
    customer: 'អតិថិជន',
    grand_total: 'សរុបរួម',
    paid: 'បានបង់',
    balance: 'សមតុល្យនៅខ្វះ',
    payment_status: 'ស្ថានភាពទូទាត់',
    action: 'សកម្មភាព',
    home: 'ទំព័រដើម',
    shops: 'ហាងទំនិញ',
    service: 'សេវាកម្ម',
    learn: 'ស្វែងយល់',
    like: 'ចូលចិត្ត',
    cart: 'កន្ត្រក',
    account: 'គណនី',
    basket: 'កន្ត្រកទំនិញ',
    switch: 'ផ្លាស់ប្តូរ',
    dine_in_table: 'ញ៉ាំនៅហាង • តុ',
    erp_portal: 'ប្រព័ន្ធគ្រប់គ្រង ERP',
    operations_portal: 'ច្រកចូលប្រតិបត្តិការ',
    sign_in: 'ចូលគណនី',
    register: 'ចុះឈ្មោះ',
  },
  chinese: {
    dashboard: '仪表板',
    pos: '销售点',
    list_pos: '销售点列表',
    pos_settings: 'POS设置',
    products: '产品',
    add_product: '新增产品',
    categories: '产品分类',
    sales: '销售管理',
    purchases: '采购管理',
    orders: '订单管理',
    customers: '客户管理',
    suppliers: '供应商',
    warehouses: '仓库管理',
    branches: '分店管理',
    billers: '开票商',
    users: '用户与权限',
    reports: '统计报表',
    settings: '系统设置',
    modules: 'ERP模块',
    language: '语言',
    change_language: '更改语言',
    theme_settings: '外观与主题',
    transparent_mode: '透明磨砂玻璃模式',
    dark_mode: '暗黑模式',
    light_mode: '明亮模式',
    profile: '个人资料',
    logout: '退出登录',
    login: '登录',
    save: '保存',
    cancel: '取消',
    delete: '删除',
    edit: '编辑',
    search: '搜索',
    export: '导出',
    filter: '筛选',
    refresh: '刷新',
    actions: '操作',
    status: '状态',
    total: '总计',
    price: '价格',
    quantity: '数量',
    unit: '单位',
    discount: '折扣',
    tax: '税费',
    created_at: '创建时间',
    storefront: '网店前台',
    welcome: '欢迎',
    all: '全部',
    view: '查看',
    print: '打印',
    active: '活跃',
    inactive: '停用',
    pending: '待处理',
    completed: '已完成',
    cancelled: '已取消',
    home: '首页',
    shops: '店铺',
    service: '服务',
    learn: '了解更多',
    like: '收藏',
    cart: '购物车',
    account: '我的账户',
    basket: '购物篮',
    switch: '切换',
    dine_in_table: '堂食 • 桌号',
    erp_portal: 'ERP管理门户',
    operations_portal: '运营门户',
    sign_in: '登录',
    register: '注册',
  },
  thai: {
    dashboard: 'แดชบอร์ด',
    pos: 'จุดขาย',
    list_pos: 'รายการจุดขาย',
    pos_settings: 'การตั้งค่า POS',
    products: 'สินค้า',
    add_product: 'เพิ่มสินค้า',
    categories: 'หมวดหมู่สินค้า',
    sales: 'การขาย',
    purchases: 'การซื้อ',
    orders: 'คำสั่งซื้อ',
    customers: 'ลูกค้า',
    suppliers: 'ผู้จำหน่าย',
    warehouses: 'คลังสินค้า',
    branches: 'สาขา',
    billers: 'ผู้ออกบิล',
    users: 'ผู้ใช้และสิทธิ์',
    reports: 'รายงาน',
    settings: 'การตั้งค่าระบบ',
    modules: 'โมดูล ERP',
    language: 'ภาษา',
    change_language: 'เปลี่ยนภาษา',
    theme_settings: 'ธีมและรูปลักษณ์',
    transparent_mode: 'โหมดกระจกใส',
    dark_mode: 'โหมดมืด',
    light_mode: 'โหมดสว่าง',
    profile: 'โปรไฟล์ของฉัน',
    logout: 'ออกจากระบบ',
    login: 'เข้าสู่ระบบ',
    save: 'บันทึก',
    cancel: 'ยกเลิก',
    delete: 'ลบ',
    edit: 'แก้ไข',
    search: 'ค้นหา',
    export: 'ส่งออก',
    filter: 'กรอง',
    refresh: 'รีเฟรช',
    actions: 'การกระทำ',
    status: 'สถานะ',
    total: 'ยอดรวม',
    price: 'ราคา',
    quantity: 'จำนวน',
    unit: 'หน่วย',
    discount: 'ส่วนลด',
    tax: 'ภาษี',
    created_at: 'วันที่สร้าง',
    storefront: 'หน้าร้านค้า',
    welcome: 'ยินดีต้อนรับ',
    all: 'ทั้งหมด',
    view: 'ดู',
    print: 'พิมพ์',
    home: 'หน้าแรก',
    shops: 'ร้านค้า',
    service: 'บริการ',
    learn: 'เรียนรู้',
    like: 'รายการโปรด',
    cart: 'ตะกร้า',
    account: 'บัญชีผู้ใช้',
    basket: 'ตะกร้าสินค้า',
    switch: 'เปลี่ยน',
    dine_in_table: 'ทานที่ร้าน • โต๊ะ',
    erp_portal: 'พอร์ทัล ERP',
    operations_portal: 'พอร์ทัลการดำเนินงาน',
    sign_in: 'เข้าสู่ระบบ',
    register: 'ลงทะเบียน',
  },
  vietnamese: {
    dashboard: 'Bảng điều khiển',
    pos: 'Điểm bán hàng',
    list_pos: 'Danh sách POS',
    pos_settings: 'Cài đặt POS',
    products: 'Sản phẩm',
    add_product: 'Thêm sản phẩm',
    categories: 'Danh mục',
    sales: 'Bán hàng',
    purchases: 'Mua hàng',
    orders: 'Đơn hàng',
    customers: 'Khách hàng',
    suppliers: 'Nhà cung cấp',
    warehouses: 'Kho hàng',
    branches: 'Chi nhánh',
    billers: 'Người lập hóa đơn',
    users: 'Người dùng & Quyền',
    reports: 'Báo cáo',
    settings: 'Cài đặt hệ thống',
    modules: 'Mô-đun ERP',
    language: 'Ngôn ngữ',
    change_language: 'Đổi ngôn ngữ',
    theme_settings: 'Chủ đề & Giao diện',
    transparent_mode: 'Chế độ kính trong suốt',
    dark_mode: 'Chế độ tối',
    light_mode: 'Chế độ sáng',
    profile: 'Hồ sơ của tôi',
    logout: 'Đăng xuất',
    login: 'Đăng nhập',
    save: 'Lưu',
    cancel: 'Hủy',
    delete: 'Xóa',
    edit: 'Chỉnh sửa',
    search: 'Tìm kiếm',
    export: 'Xuất',
    filter: 'Bộ lọc',
    refresh: 'Làm mới',
    actions: 'Hành động',
    status: 'Trạng thái',
    total: 'Tổng cộng',
    price: 'Giá',
    quantity: 'Số lượng',
    unit: 'Đơn vị',
    discount: 'Chiết khấu',
    tax: 'Thuế',
    created_at: 'Ngày tạo',
    storefront: 'Cửa hàng trực tuyến',
    welcome: 'Chào mừng',
    all: 'Tất cả',
    view: 'Xem',
    print: 'In',
    home: 'Trang chủ',
    shops: 'Cửa hàng',
    service: 'Dịch vụ',
    learn: 'Tìm hiểu',
    like: 'Yêu thích',
    cart: 'Giỏ hàng',
    account: 'Tài khoản',
    basket: 'Giỏ hàng',
    switch: 'Chuyển đổi',
    dine_in_table: 'Ăn tại chỗ • Bàn',
    erp_portal: 'Cổng quản lý ERP',
    operations_portal: 'Cổng vận hành',
    sign_in: 'Đăng nhập',
    register: 'Đăng ký',
  },
};

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  // Read initial language from localStorage or default to khmer / english
  const [currentLanguage, setCurrentLanguageState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aura-language');
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        return saved;
      }
    }
    return 'khmer'; // Official concept default to Khmer as requested for AURA_v1
  });

  // Dynamic dictionary loaded from /api/languages/translations/:lang
  const [dynamicDictionary, setDynamicDictionary] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`aura_lang_cache_${currentLanguage}`);
        if (cached) return JSON.parse(cached);
      } catch (_) {}
    }
    return {};
  });

  const [isLoadingTranslations, setIsLoadingTranslations] = useState(false);

  // Fetch full dictionary from MySQL API
  const fetchTranslations = useCallback(async (langCode) => {
    try {
      setIsLoadingTranslations(true);
      const res = await axios.get(`/api/languages/translations/${langCode}`);
      if (res.data?.success && res.data?.data) {
        setDynamicDictionary(res.data.data);
        try {
          localStorage.setItem(`aura_lang_cache_${langCode}`, JSON.stringify(res.data.data));
        } catch (_) {}
      }
    } catch (err) {
      console.warn('[LanguageContext] Failed to load server translations:', err.message);
    } finally {
      setIsLoadingTranslations(false);
    }
  }, []);

  // Sync on language change
  useEffect(() => {
    fetchTranslations(currentLanguage);

    const activeLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = activeLangObj?.iso || 'km';
      document.documentElement.dir = activeLangObj?.direction || 'ltr';
    }
  }, [currentLanguage, fetchTranslations]);

  // Language switcher function
  const setLanguage = useCallback((newLang) => {
    const valid = SUPPORTED_LANGUAGES.find((l) => l.code === newLang);
    if (!valid) return;

    setCurrentLanguageState(valid.code);
    try {
      localStorage.setItem('aura-language', valid.code);
      document.cookie = `aura_language=${valid.code}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (_) {}

    // Persist to backend user account if authenticated
    axios.post('/api/user/language', { language: valid.code }).catch(() => {});
  }, []);

  // Primary translation lookup function
  const t = useCallback((key, fallback = null) => {
    if (!key) return '';
    const cleanKey = String(key).trim();
    const lowerKey = cleanKey.toLowerCase();

    // 1. Check dynamic dictionary from MySQL table aura_language
    if (dynamicDictionary[cleanKey]) return dynamicDictionary[cleanKey];
    if (dynamicDictionary[lowerKey]) return dynamicDictionary[lowerKey];

    // 2. Check bundled core vocabulary
    const currentCore = CORE_VOCABULARY[currentLanguage];
    if (currentCore) {
      if (currentCore[cleanKey]) return currentCore[cleanKey];
      if (currentCore[lowerKey]) return currentCore[lowerKey];
    }

    // 3. Fallback to English core vocabulary if available
    if (currentLanguage !== 'english' && CORE_VOCABULARY.english) {
      if (CORE_VOCABULARY.english[cleanKey]) return CORE_VOCABULARY.english[cleanKey];
      if (CORE_VOCABULARY.english[lowerKey]) return CORE_VOCABULARY.english[lowerKey];
    }

    // 4. Return provided fallback or original key formatted
    if (fallback !== null && fallback !== undefined) return fallback;

    // Convert snake_case or dash-case to Human readable if needed
    if (cleanKey.includes('_') || cleanKey.includes('-')) {
      return cleanKey
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
    }

    return cleanKey;
  }, [currentLanguage, dynamicDictionary]);

  const activeLanguage = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];
  }, [currentLanguage]);

  const value = useMemo(() => ({
    currentLanguage,
    activeLanguage,
    setLanguage,
    t,
    languages: SUPPORTED_LANGUAGES,
    isLoadingTranslations,
    refreshTranslations: () => fetchTranslations(currentLanguage),
  }), [currentLanguage, activeLanguage, setLanguage, t, isLoadingTranslations, fetchTranslations]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const useTranslation = () => {
  const { t, currentLanguage, activeLanguage, setLanguage } = useLanguage();
  return { t, currentLanguage, activeLanguage, setLanguage };
};

export default LanguageContext;
