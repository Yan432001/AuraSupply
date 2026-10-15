import { useState, useEffect, useCallback, useMemo } from 'react';

export const BRANCHES_STORAGE_KEY = 'aura_admin_branches_data';
export const BILLERS_STORAGE_KEY = 'aura_admin_billers_data';
export const ACTIVE_BRANCH_STORAGE_KEY = 'aura_admin_active_branch_id';
export const BRANCH_STATE_EVENT = 'aura_branch_state_changed';

// Initial corporate billers & multi-branch shops list
export const defaultBillers = [];
export const defaultBranches = [];

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

  // Fetch real stores and billers directly from MySQL backend
  useEffect(() => {
    let isMounted = true;
    fetch('/api/shops')
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted || !json.success || !Array.isArray(json.data) || !json.data.length) return;
        const liveShops = json.data;

        const liveBillers = liveShops.map((s, idx) => ({
          id: s.id,
          code: `BIL-${String(s.id).padStart(3, '0')}`,
          company_name: s.company || s.name,
          trading_name: s.name,
          vat_tin: `K008-${90200000 + s.id}`,
          invoice_prefix: `INV-${(s.slug || 'AURA').toUpperCase().slice(0, 3)}-`,
          next_invoice_no: 1000 + s.id,
          tax_rate: 10,
          currency_code: 'USD',
          currency_symbol: '$',
          exchange_rate_khr: 4100,
          bank_name: 'ABA Bank (National Bank of Cambodia)',
          bank_account_no: `001 ${800 + (s.id % 100)} 204`,
          bank_account_name: (s.company || s.name).toUpperCase(),
          bakong_id: `${s.slug || 'store'}@ababank`,
          phone: s.phone || '+855 12 345 678',
          email: s.email || 'billing@auraglobal.com',
          address: s.address || `${s.city || 'Phnom Penh'}, Cambodia`,
          is_active: s.status === 'active' || s.is_active !== false,
          is_default: idx === 0,
          created_at: '2025-01-15',
        }));

        const liveBranches = liveShops.map((s, idx) => ({
          id: s.id,
          code: `BR-${String(s.id).padStart(3, '0')}`,
          name: `${s.name} (${s.city || 'Main'})`,
          biller_id: s.id,
          store_slug: s.slug,
          shop_type: s.store_type || 'Storefront & Sourcing',
          manager_name: 'Store Manager',
          phone: s.phone || '+855 12 345 678',
          email: s.email || 'store@auraglobal.com',
          city: s.city || 'Phnom Penh',
          address: s.address || 'Preah Norodom Blvd, Daun Penh, Phnom Penh',
          operating_hours: '7:00 AM - 9:00 PM',
          registers_count: 2,
          warehouse_id: 1,
          warehouse_name: 'Central Warehouse Phnom Penh',
          is_active: s.status === 'active' || s.is_active !== false,
          is_default: idx === 0,
          today_sales: 1250.0,
          today_orders: 85,
          rating: s.rating || 4.9,
          logo: s.logo || '/assets/uploads/no_image.png',
        }));

        setBillers(liveBillers);
        setBranches(liveBranches);
      })
      .catch((err) => console.warn('Live shops fetch notice:', err.message));

    return () => {
      isMounted = false;
    };
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

  // Auto-sync stores from API if needed
  const syncFromStores = useCallback(async () => {
    try {
      const res = await fetch('/api/shops');
      if (!res.ok) return;
      const data = await res.json();
      const stores = data.data || [];
      if (!stores.length) return;
      const existingSlugs = new Set(branches.map((b) => b.store_slug));
      const newItems = [];

      stores.forEach((store) => {
        const slug = store.slug || store.store_slug || `store-${store.id}`;
        if (!existingSlugs.has(slug)) {
          newItems.push({
            id: branches.length + newItems.length + 1,
            code: `BR-0${branches.length + newItems.length + 1}`,
            name: store.name,
            biller_id: store.id,
            store_slug: slug,
            shop_type: store.tagline || 'Store & Supply',
            manager_name: store.contact_person || 'Store Manager',
            phone: store.phone || '+855 12 345 678',
            email: store.email || 'store@auraglobal.com',
            city: store.city || 'Phnom Penh',
            address: store.address || 'Phnom Penh, Cambodia',
            operating_hours: store.operating_hours || '7:00 AM - 8:30 PM',
            registers_count: 2,
            warehouse_id: 1,
            warehouse_name: 'Central Warehouse Phnom Penh',
            is_active: store.is_active !== 0,
            is_default: false,
            today_sales: 0.00,
            today_orders: 0,
            rating: 4.8,
            logo: store.logo,
          });
        }
      });

      if (newItems.length) {
        persistBranches([...branches, ...newItems]);
      }
    } catch (e) {
      console.warn('Failed to sync branches from API:', e);
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
