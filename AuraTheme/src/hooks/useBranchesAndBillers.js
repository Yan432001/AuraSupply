import { useState, useEffect, useCallback, useMemo } from 'react';
import simpleData from '../../../data/simpleData';

export const BRANCHES_STORAGE_KEY = 'aura_admin_branches_data';
export const BILLERS_STORAGE_KEY = 'aura_admin_billers_data';
export const ACTIVE_BRANCH_STORAGE_KEY = 'aura_admin_active_branch_id';
export const BRANCH_STATE_EVENT = 'aura_branch_state_changed';

// Initial default corporate billers
export const defaultBillers = [
  {
    id: 1,
    code: 'BIL-001',
    company_name: 'Aura Specialty Coffee Co., Ltd.',
    trading_name: 'Aura Specialty Coffee',
    vat_tin: 'K008-90218734',
    invoice_prefix: 'INV-ASC-',
    next_invoice_no: 4281,
    tax_rate: 10,
    currency_code: 'USD',
    currency_symbol: '$',
    exchange_rate_khr: 4100,
    bank_name: 'ABA Bank (National Bank of Cambodia)',
    bank_account_no: '001 849 204',
    bank_account_name: 'AURA SPECIALTY COFFEE CO LTD',
    bakong_id: 'aura_coffee@ababank',
    phone: '+855 12 345 678',
    email: 'billing@auraglobal.com',
    address: 'No. 128, Preah Norodom Blvd, Daun Penh, Phnom Penh, Cambodia',
    is_active: true,
    is_default: true,
    created_at: '2025-01-15',
  },
  {
    id: 2,
    code: 'BIL-002',
    company_name: 'Aura Artisan Bakery & Viennoiserie Co., Ltd.',
    trading_name: 'Aura Bakery',
    vat_tin: 'K008-90218735',
    invoice_prefix: 'INV-AAB-',
    next_invoice_no: 2150,
    tax_rate: 10,
    currency_code: 'USD',
    currency_symbol: '$',
    exchange_rate_khr: 4100,
    bank_name: 'Canadia Bank',
    bank_account_no: '002 918 305',
    bank_account_name: 'AURA ARTISAN BAKERY CO LTD',
    bakong_id: 'aura_bakery@cnb',
    phone: '+855 12 345 679',
    email: 'bakery.billing@auraglobal.com',
    address: 'Street 240, Daun Penh, Phnom Penh, Cambodia',
    is_active: true,
    is_default: false,
    created_at: '2025-02-01',
  },
  {
    id: 3,
    code: 'BIL-003',
    company_name: 'Aura Botanical Tea & Wellness Group Co., Ltd.',
    trading_name: 'Aura Lounge',
    vat_tin: 'K008-90218736',
    invoice_prefix: 'INV-ABT-',
    next_invoice_no: 1680,
    tax_rate: 10,
    currency_code: 'USD',
    currency_symbol: '$',
    exchange_rate_khr: 4100,
    bank_name: 'ACLEDA Bank Plc.',
    bank_account_no: '003 726 492',
    bank_account_name: 'AURA BOTANICAL WELLNESS CO LTD',
    bakong_id: 'aura_lounge@acleda',
    phone: '+855 12 345 680',
    email: 'lounge.billing@auraglobal.com',
    address: 'Street 302, BKK1, Chamkarmon, Phnom Penh, Cambodia',
    is_active: true,
    is_default: false,
    created_at: '2025-02-10',
  },
  {
    id: 4,
    code: 'BIL-004',
    company_name: 'Aura Hospitality & Roastery Holdings Ltd.',
    trading_name: 'Aura Central Roastery & Supply',
    vat_tin: 'K008-90218737',
    invoice_prefix: 'INV-AHR-',
    next_invoice_no: 890,
    tax_rate: 10,
    currency_code: 'USD',
    currency_symbol: '$',
    exchange_rate_khr: 4100,
    bank_name: 'ABA Bank',
    bank_account_no: '001 993 112',
    bank_account_name: 'AURA HOSPITALITY HOLDINGS LTD',
    bakong_id: 'aura_holdings@ababank',
    phone: '+855 12 345 681',
    email: 'roastery.billing@auraglobal.com',
    address: 'National Highway 4, Phnom Penh Special Economic Zone, Cambodia',
    is_active: true,
    is_default: false,
    created_at: '2025-03-01',
  },
];

// Initial default multi-branch shops list
export const defaultBranches = [
  {
    id: 1,
    code: 'BR-001',
    name: 'Norodom Daun Penh (Flagship)',
    biller_id: 1,
    store_slug: 'sbc-store',
    shop_type: 'Flagship Cafe',
    manager_name: 'Sokha Chan',
    phone: '+855 12 345 678',
    email: 'norodom@auraglobal.com',
    city: 'Phnom Penh',
    address: 'No. 128, Preah Norodom Blvd, Daun Penh, Phnom Penh',
    operating_hours: '6:30 AM - 8:30 PM',
    registers_count: 3,
    warehouse_id: 1,
    warehouse_name: 'Central Warehouse Phnom Penh',
    is_active: true,
    is_default: true,
    today_sales: 1450.50,
    today_orders: 142,
    rating: 4.9,
    logo: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 2,
    code: 'BR-002',
    name: 'BKK1 Botanical Lounge & Teahouse',
    biller_id: 3,
    store_slug: 'aura-lounge',
    shop_type: 'Botanical Teahouse',
    manager_name: 'Bopha Vong',
    phone: '+855 12 345 680',
    email: 'bkk1@auraglobal.com',
    city: 'Phnom Penh',
    address: 'Street 302, BKK1, Chamkarmon, Phnom Penh',
    operating_hours: '8:00 AM - 9:00 PM',
    registers_count: 2,
    warehouse_id: 2,
    warehouse_name: 'BKK1 Storefront Store',
    is_active: true,
    is_default: false,
    today_sales: 980.00,
    today_orders: 86,
    rating: 4.9,
    logo: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 3,
    code: 'BR-003',
    name: 'Street 240 Artisan Bakery Bistro',
    biller_id: 2,
    store_slug: 'aura-bakery',
    shop_type: 'Bakery Bistro',
    manager_name: 'Dara Pich',
    phone: '+855 12 345 679',
    email: 'st240@auraglobal.com',
    city: 'Phnom Penh',
    address: 'Street 240, Daun Penh, Phnom Penh',
    operating_hours: '7:00 AM - 7:00 PM',
    registers_count: 2,
    warehouse_id: 1,
    warehouse_name: 'Central Warehouse Phnom Penh',
    is_active: true,
    is_default: false,
    today_sales: 1120.75,
    today_orders: 118,
    rating: 4.8,
    logo: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 4,
    code: 'BR-004',
    name: 'Toul Kork Express & Drive-Thru',
    biller_id: 1,
    store_slug: 'tk-express',
    shop_type: 'Express Kiosk',
    manager_name: 'Kosal Heng',
    phone: '+855 12 345 685',
    email: 'toulkork@auraglobal.com',
    city: 'Phnom Penh',
    address: 'Street 315, Toul Kork, Phnom Penh',
    operating_hours: '6:00 AM - 9:00 PM',
    registers_count: 2,
    warehouse_id: 1,
    warehouse_name: 'Central Warehouse Phnom Penh',
    is_active: true,
    is_default: false,
    today_sales: 780.25,
    today_orders: 95,
    rating: 4.7,
    logo: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 5,
    code: 'BR-005',
    name: 'Riverside Waterfront Cafe',
    biller_id: 1,
    store_slug: 'riverside-cafe',
    shop_type: 'Waterfront Cafe',
    manager_name: 'Thida Keo',
    phone: '+855 12 345 686',
    email: 'riverside@auraglobal.com',
    city: 'Phnom Penh',
    address: 'Sisowath Quay, Riverfront, Daun Penh, Phnom Penh',
    operating_hours: '7:00 AM - 10:00 PM',
    registers_count: 3,
    warehouse_id: 1,
    warehouse_name: 'Central Warehouse Phnom Penh',
    is_active: true,
    is_default: false,
    today_sales: 1650.00,
    today_orders: 164,
    rating: 4.9,
    logo: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 6,
    code: 'BR-006',
    name: 'Siem Reap Heritage Pub Street',
    biller_id: 4,
    store_slug: 'siem-reap-heritage',
    shop_type: 'Heritage Bistro',
    manager_name: 'Chanthy Sin',
    phone: '+855 63 963 888',
    email: 'siemreap@auraglobal.com',
    city: 'Siem Reap',
    address: 'Old Market Area, Pub Street, Siem Reap, Cambodia',
    operating_hours: '7:00 AM - 11:00 PM',
    registers_count: 2,
    warehouse_id: 3,
    warehouse_name: 'Siem Reap Regional Depot',
    is_active: true,
    is_default: false,
    today_sales: 1890.00,
    today_orders: 172,
    rating: 4.9,
    logo: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 7,
    code: 'BR-007',
    name: 'Airport Domestic Terminal Kiosk',
    biller_id: 1,
    store_slug: 'airport-kiosk',
    shop_type: 'Express Kiosk',
    manager_name: 'Rithy Lim',
    phone: '+855 12 345 688',
    email: 'airport@auraglobal.com',
    city: 'Phnom Penh',
    address: 'Phnom Penh International Airport (Departure Hall)',
    operating_hours: '5:00 AM - 10:00 PM',
    registers_count: 2,
    warehouse_id: 1,
    warehouse_name: 'Central Warehouse Phnom Penh',
    is_active: true,
    is_default: false,
    today_sales: 1320.50,
    today_orders: 198,
    rating: 4.8,
    logo: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=300&q=80',
  },
];

// Helper to get stored branches
export const getStoredBranches = () => {
  if (typeof window === 'undefined') return defaultBranches;
  try {
    const raw = window.localStorage.getItem(BRANCHES_STORAGE_KEY);
    if (!raw) return defaultBranches;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : defaultBranches;
  } catch (err) {
    console.warn('[Aura] Failed to parse branches from storage:', err);
    return defaultBranches;
  }
};

// Helper to get stored billers
export const getStoredBillers = () => {
  if (typeof window === 'undefined') return defaultBillers;
  try {
    const raw = window.localStorage.getItem(BILLERS_STORAGE_KEY);
    if (!raw) return defaultBillers;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : defaultBillers;
  } catch (err) {
    console.warn('[Aura] Failed to parse billers from storage:', err);
    return defaultBillers;
  }
};

export const useBranchesAndBillers = () => {
  const [branches, setBranches] = useState(() => getStoredBranches());
  const [billers, setBillers] = useState(() => getStoredBillers());
  const [activeBranchId, setActiveBranchIdState] = useState(() => {
    if (typeof window === 'undefined') return 1;
    try {
      const saved = window.localStorage.getItem(ACTIVE_BRANCH_STORAGE_KEY);
      return saved ? Number(saved) : 1;
    } catch {
      return 1;
    }
  });

  // Save branches to localStorage safely
  const persistBranches = useCallback((newBranches) => {
    setBranches(newBranches);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(BRANCHES_STORAGE_KEY, JSON.stringify(newBranches));
        window.dispatchEvent(new CustomEvent(BRANCH_STATE_EVENT, { detail: { branches: newBranches } }));
      } catch (err) {
        console.error('[Aura] Failed to save branches:', err);
      }
    }
  }, []);

  // Save billers to localStorage safely
  const persistBillers = useCallback((newBillers) => {
    setBillers(newBillers);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(BILLERS_STORAGE_KEY, JSON.stringify(newBillers));
        window.dispatchEvent(new CustomEvent(BRANCH_STATE_EVENT, { detail: { billers: newBillers } }));
      } catch (err) {
        console.error('[Aura] Failed to save billers:', err);
      }
    }
  }, []);

  // Switch active branch
  const setActiveBranchId = useCallback((id) => {
    const numId = Number(id);
    setActiveBranchIdState(numId);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(ACTIVE_BRANCH_STORAGE_KEY, String(numId));
        window.dispatchEvent(new CustomEvent(BRANCH_STATE_EVENT, { detail: { activeBranchId: numId } }));
      } catch (err) {
        console.error('[Aura] Failed to save active branch:', err);
      }
    }
  }, []);

  // Sync listener across tabs and components
  useEffect(() => {
    const handleSync = (e) => {
      if (e.detail?.branches) setBranches(e.detail.branches);
      if (e.detail?.billers) setBillers(e.detail.billers);
      if (e.detail?.activeBranchId) setActiveBranchIdState(e.detail.activeBranchId);
    };

    window.addEventListener(BRANCH_STATE_EVENT, handleSync);
    return () => window.removeEventListener(BRANCH_STATE_EVENT, handleSync);
  }, []);

  // Branch CRUD operations
  const addBranch = useCallback(
    (branchData) => {
      const newId = branches.length ? Math.max(...branches.map((b) => b.id)) + 1 : 1;
      const newBranch = {
        ...branchData,
        id: newId,
        code: branchData.code || `BR-00${newId}`,
        today_sales: 0,
        today_orders: 0,
        is_active: branchData.is_active !== false,
        is_default: Boolean(branchData.is_default),
      };

      let updated = [...branches, newBranch];
      if (newBranch.is_default) {
        updated = updated.map((b) => ({ ...b, is_default: b.id === newId }));
      }
      persistBranches(updated);
      return newBranch;
    },
    [branches, persistBranches]
  );

  const updateBranch = useCallback(
    (id, branchData) => {
      let updated = branches.map((b) => (b.id === id ? { ...b, ...branchData } : b));
      if (branchData.is_default) {
        updated = updated.map((b) => ({ ...b, is_default: b.id === id }));
      }
      persistBranches(updated);
    },
    [branches, persistBranches]
  );

  const deleteBranch = useCallback(
    (id) => {
      const updated = branches.filter((b) => b.id !== id);
      persistBranches(updated);
      if (activeBranchId === id && updated.length) {
        setActiveBranchId(updated[0].id);
      }
    },
    [branches, activeBranchId, persistBranches, setActiveBranchId]
  );

  const toggleBranchStatus = useCallback(
    (id) => {
      const updated = branches.map((b) => (b.id === id ? { ...b, is_active: !b.is_active } : b));
      persistBranches(updated);
    },
    [branches, persistBranches]
  );

  const setDefaultBranch = useCallback(
    (id) => {
      const updated = branches.map((b) => ({ ...b, is_default: b.id === id }));
      persistBranches(updated);
      setActiveBranchId(id);
    },
    [branches, persistBranches, setActiveBranchId]
  );

  // Biller CRUD operations
  const addBiller = useCallback(
    (billerData) => {
      const newId = billers.length ? Math.max(...billers.map((b) => b.id)) + 1 : 1;
      const newBiller = {
        ...billerData,
        id: newId,
        code: billerData.code || `BIL-00${newId}`,
        created_at: new Date().toISOString().split('T')[0],
        is_active: billerData.is_active !== false,
        is_default: Boolean(billerData.is_default),
      };

      let updated = [...billers, newBiller];
      if (newBiller.is_default) {
        updated = updated.map((b) => ({ ...b, is_default: b.id === newId }));
      }
      persistBillers(updated);
      return newBiller;
    },
    [billers, persistBillers]
  );

  const updateBiller = useCallback(
    (id, billerData) => {
      let updated = billers.map((b) => (b.id === id ? { ...b, ...billerData } : b));
      if (billerData.is_default) {
        updated = updated.map((b) => ({ ...b, is_default: b.id === id }));
      }
      persistBillers(updated);
    },
    [billers, persistBillers]
  );

  const deleteBiller = useCallback(
    (id) => {
      const updated = billers.filter((b) => b.id !== id);
      persistBillers(updated);
    },
    [billers, persistBillers]
  );

  const toggleBillerStatus = useCallback(
    (id) => {
      const updated = billers.map((b) => (b.id === id ? { ...b, is_active: !b.is_active } : b));
      persistBillers(updated);
    },
    [billers, persistBillers]
  );

  const setDefaultBiller = useCallback(
    (id) => {
      const updated = billers.map((b) => ({ ...b, is_default: b.id === id }));
      persistBillers(updated);
    },
    [billers, persistBillers]
  );

  // Auto-sync stores from simpleData if needed
  const syncFromStores = useCallback(() => {
    if (!simpleData?.stores?.length) return;
    const existingSlugs = new Set(branches.map((b) => b.store_slug));
    const newItems = [];

    simpleData.stores.forEach((store) => {
      if (!existingSlugs.has(store.slug)) {
        newItems.push({
          id: branches.length + newItems.length + 1,
          code: `BR-0${branches.length + newItems.length + 1}`,
          name: store.name,
          biller_id: store.biller_id || 1,
          store_slug: store.slug,
          shop_type: store.tagline || 'Cafe & Specialty',
          manager_name: 'Store Manager',
          phone: store.phone || '+855 12 345 678',
          email: store.email || 'store@auraglobal.com',
          city: 'Phnom Penh',
          address: store.address || 'Phnom Penh, Cambodia',
          operating_hours: store.operating_hours || '7:00 AM - 8:30 PM',
          registers_count: 2,
          warehouse_id: 1,
          warehouse_name: 'Central Warehouse Phnom Penh',
          is_active: store.is_active !== 0,
          is_default: false,
          today_sales: 850.00,
          today_orders: 80,
          rating: store.rating || 4.8,
          logo: store.logo,
        });
      }
    });

    if (newItems.length) {
      persistBranches([...branches, ...newItems]);
    }
  }, [branches, persistBranches]);

  // Active branch object
  const activeBranch = useMemo(() => {
    return branches.find((b) => b.id === activeBranchId) || branches[0] || null;
  }, [branches, activeBranchId]);

  // Active biller for the active branch
  const activeBranchBiller = useMemo(() => {
    if (!activeBranch) return billers[0] || null;
    return billers.find((b) => b.id === activeBranch.biller_id) || billers[0] || null;
  }, [activeBranch, billers]);

  return {
    branches,
    billers,
    activeBranchId,
    activeBranch,
    activeBranchBiller,
    setActiveBranchId,
    addBranch,
    updateBranch,
    deleteBranch,
    toggleBranchStatus,
    setDefaultBranch,
    addBiller,
    updateBiller,
    deleteBiller,
    toggleBillerStatus,
    setDefaultBiller,
    syncFromStores,
  };
};

export default useBranchesAndBillers;
