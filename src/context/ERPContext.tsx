import React, { createContext, useContext, useState, useEffect } from 'react';
import { InventoryItem, Store, StoreProductOverride, Order, StockAdjustmentLog, AdminThemeMode, AdminThemePreset } from '../types';

const INITIAL_STORES: Store[] = [
  {
    id: 'store-tokyo',
    name: 'Aura Grand Lounge & Dining',
    code: 'TYO-01',
    city: 'Tokyo',
    country: 'Japan',
    currency: 'USD',
    currencySymbol: '$',
    tablesCount: 28,
    address: 'Roppongi Hills Mori Tower 52F, Minato City',
    status: 'active',
    openHours: '11:00 AM - 02:00 AM',
  },
  {
    id: 'store-singapore',
    name: 'Aura Sky Deck & Mixology',
    code: 'SIN-02',
    city: 'Singapore',
    country: 'Singapore',
    currency: 'USD',
    currencySymbol: '$',
    tablesCount: 34,
    address: 'Marina Bay Sands Level 57, Tower 1',
    status: 'active',
    openHours: '12:00 PM - 03:00 AM',
  },
  {
    id: 'store-paris',
    name: 'Aura Bistro & Terrace',
    code: 'PAR-03',
    city: 'Paris',
    country: 'France',
    currency: 'EUR',
    currencySymbol: '€',
    tablesCount: 22,
    address: '18 Avenue Montaigne, 8th Arrondissement',
    status: 'active',
    openHours: '10:00 AM - Midnight',
  },
];

const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-001',
    sku: 'CKT-OLD-01',
    name: 'Aura Smoked Old Fashioned',
    category: 'Cocktails & Spirits',
    description: '12-year bourbon, angostura bitters, flamed orange peel, hickory wood infusion served over hand-cut ice.',
    stockQty: 4, // Below threshold 10!
    reorderThreshold: 10,
    unitCost: 4.80,
    sellingPrice: 18.00,
    unit: 'portion',
    supplier: 'Nippon Spirits Wholesale Co.',
    barcode: '4901234567890',
    imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&auto=format&fit=crop&q=80',
    linkedStoreIds: ['store-tokyo', 'store-singapore', 'store-paris'],
    lastUpdated: 'Today at 09:15 AM',
    dietary: ['Chef Special'],
  },
  {
    id: 'inv-002',
    sku: 'STK-WAG-02',
    name: 'Wagyu A5 Striploin Steak (250g)',
    category: 'Main Dishes',
    description: 'Miyazaki prefecture A5 black beef, robata grilled with wasabi stem paste and smoked sea salt crystals.',
    stockQty: 2, // Below threshold 8!
    reorderThreshold: 8,
    unitCost: 32.00,
    sellingPrice: 78.00,
    unit: 'portion',
    supplier: 'Kobe Prime Meats Export',
    barcode: '4909876543210',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    linkedStoreIds: ['store-tokyo', 'store-singapore'],
    lastUpdated: 'Yesterday at 04:30 PM',
    dietary: ['Chef Special', 'Gluten-Free'],
  },
  {
    id: 'inv-003',
    sku: 'WNE-DOM-03',
    name: 'Dom Pérignon Vintage 2013',
    category: 'Wines & Champagne',
    description: 'Iconic cuvée with aromas of eucalyptus, mint and mirabelle plum, followed by smoky roasted notes.',
    stockQty: 1, // Below threshold 5!
    reorderThreshold: 5,
    unitCost: 160.00,
    sellingPrice: 380.00,
    unit: 'bottle',
    supplier: 'Moët Hennessy Cellars',
    barcode: '3185370638102',
    imageUrl: 'https://images.unsplash.com/photo-1594488518000-75d1d6159670?w=600&auto=format&fit=crop&q=80',
    linkedStoreIds: ['store-tokyo', 'store-singapore', 'store-paris'],
    lastUpdated: 'Oct 12 at 11:20 AM',
    dietary: ['Vegan'],
  },
  {
    id: 'inv-004',
    sku: 'PST-TRF-04',
    name: 'Truffle Mushroom Risotto',
    category: 'Main Dishes',
    description: 'Acquerello carnaroli rice, wild porcini, 24-month Parmigiano-Reggiano, and fresh shaved Norcia winter truffle.',
    stockQty: 24, // Healthy
    reorderThreshold: 10,
    unitCost: 6.50,
    sellingPrice: 28.00,
    unit: 'portion',
    supplier: 'Emilia Food Distribution',
    barcode: '8001234567891',
    imageUrl: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=600&auto=format&fit=crop&q=80',
    linkedStoreIds: ['store-tokyo', 'store-singapore', 'store-paris'],
    lastUpdated: 'Today at 08:00 AM',
    dietary: ['Vegetarian'],
  },
  {
    id: 'inv-005',
    sku: 'DES-MCH-05',
    name: 'Matcha Glazed Mochi Donuts (3 pcs)',
    category: 'Desserts',
    description: 'Chewy artisan rice flour rings glazed with Uji ceremonial grade matcha and edible 24k gold flakes.',
    stockQty: 0, // OUT OF STOCK!
    reorderThreshold: 6,
    unitCost: 2.10,
    sellingPrice: 12.00,
    unit: 'pack',
    supplier: 'Kyoto Artisan Bakery Lab',
    barcode: '4905556667778',
    imageUrl: 'https://images.unsplash.com/photo-1527515862127-a4fc05baf7a5?w=600&auto=format&fit=crop&q=80',
    linkedStoreIds: ['store-tokyo', 'store-singapore'],
    lastUpdated: 'Today at 10:45 AM',
    dietary: ['Vegetarian'],
  },
  {
    id: 'inv-006',
    sku: 'BEV-CLD-06',
    name: 'Ethiopian Guji Nitro Cold Brew',
    category: 'Specialty Coffee',
    description: 'Single-origin washed heirloom coffee steeped for 24 hours, infused with pure nitrogen for a velvety stout head.',
    stockQty: 7, // Below threshold 12!
    reorderThreshold: 12,
    unitCost: 1.40,
    sellingPrice: 8.50,
    unit: 'portion',
    supplier: 'Origin Coffee Roasters Global',
    barcode: '7935731928421',
    imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80',
    linkedStoreIds: ['store-tokyo', 'store-singapore', 'store-paris'],
    lastUpdated: 'Oct 13 at 07:15 AM',
    dietary: ['Vegan', 'Gluten-Free'],
  },
  {
    id: 'inv-007',
    sku: 'APP-HAM-07',
    name: 'Hamachi Yellowtail Crudo',
    category: 'Appetizers',
    description: 'Thinly sliced sashimi yellowtail, white ponzu, yuzu kosho pearls, serrano chili, and micro cilantro.',
    stockQty: 15, // Healthy
    reorderThreshold: 8,
    unitCost: 7.20,
    sellingPrice: 22.00,
    unit: 'portion',
    supplier: 'Toyosu Fish Market Express',
    barcode: '4904433221100',
    imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80',
    linkedStoreIds: ['store-tokyo', 'store-singapore'],
    lastUpdated: 'Today at 06:30 AM',
    dietary: ['Gluten-Free', 'Chef Special'],
  },
  {
    id: 'inv-008',
    sku: 'BEV-BLU-08',
    name: 'Blueberry Lavender Botanical Mocktail',
    category: 'Cocktails & Spirits',
    description: 'Wild Maine blueberries muddled with Provence culinary lavender syrup, fresh lemon juice, and artisanal tonic.',
    stockQty: 26, // Healthy
    reorderThreshold: 10,
    unitCost: 2.20,
    sellingPrice: 14.00,
    unit: 'portion',
    supplier: 'Botanical Botanics Syrup Co.',
    barcode: '0123456789012',
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
    linkedStoreIds: ['store-tokyo', 'store-singapore', 'store-paris'],
    lastUpdated: 'Yesterday at 02:10 PM',
    dietary: ['Vegan', 'Gluten-Free'],
  },
  {
    id: 'inv-009',
    sku: 'FSH-SLM-09',
    name: 'Wild Alaskan King Salmon Fillet',
    category: 'Main Dishes',
    description: 'Pan-seared crispy skin salmon served over saffron cauliflower purée, charred broccolini, and lemon-dill velouté.',
    stockQty: 5, // Below threshold 6!
    reorderThreshold: 6,
    unitCost: 11.50,
    sellingPrice: 36.00,
    unit: 'portion',
    supplier: 'Pacific Seafood Sustainable Fishery',
    barcode: '0789456123012',
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&auto=format&fit=crop&q=80',
    linkedStoreIds: ['store-tokyo', 'store-singapore', 'store-paris'],
    lastUpdated: 'Today at 07:45 AM',
    dietary: ['Gluten-Free'],
  },
  {
    id: 'inv-010',
    sku: 'APP-BUR-10',
    name: 'Artisan Burrata & Heirloom Tomatoes',
    category: 'Appetizers',
    description: 'Creamy Puglia burrata, colorful vine-ripened heirloom tomatoes, 15-year aged balsamic glaze, and torn basil leaves.',
    stockQty: 18, // Healthy
    reorderThreshold: 8,
    unitCost: 5.40,
    sellingPrice: 19.50,
    unit: 'portion',
    supplier: 'Emilia Food Distribution',
    barcode: '8009988776655',
    imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=600&auto=format&fit=crop&q=80',
    linkedStoreIds: ['store-tokyo', 'store-singapore', 'store-paris'],
    lastUpdated: 'Oct 13 at 08:30 AM',
    dietary: ['Vegetarian', 'Gluten-Free'],
  },
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-801',
    orderNumber: 'AURA-801',
    storeId: 'store-tokyo',
    orderSource: 'Telegram Mini App',
    telegramUsername: '@alex_foodie',
    customerName: 'Alex Chen',
    tableNumber: 'Table 14',
    items: [
      {
        inventoryId: 'inv-001',
        sku: 'CKT-OLD-01',
        name: 'Aura Smoked Old Fashioned',
        quantity: 2,
        unitPrice: 18.00,
        notes: 'Extra orange peel please',
      },
      {
        inventoryId: 'inv-002',
        sku: 'STK-WAG-02',
        name: 'Wagyu A5 Striploin Steak (250g)',
        quantity: 1,
        unitPrice: 78.00,
        notes: 'Medium rare',
      },
    ],
    totalAmount: 114.00,
    status: 'preparing',
    createdAt: '12 minutes ago',
    inventoryDeducted: true,
  },
  {
    id: 'ord-802',
    orderNumber: 'AURA-802',
    storeId: 'store-tokyo',
    orderSource: 'E-Menu QR Table',
    customerName: 'Guest (Table 08)',
    tableNumber: 'Table 08',
    items: [
      {
        inventoryId: 'inv-007',
        sku: 'APP-HAM-07',
        name: 'Hamachi Yellowtail Crudo',
        quantity: 1,
        unitPrice: 22.00,
      },
      {
        inventoryId: 'inv-004',
        sku: 'PST-TRF-04',
        name: 'Truffle Mushroom Risotto',
        quantity: 2,
        unitPrice: 28.00,
      },
    ],
    totalAmount: 78.00,
    status: 'pending',
    createdAt: '4 minutes ago',
    inventoryDeducted: true,
  },
];

interface ERPContextType {
  stores: Store[];
  activeStoreId: string;
  setActiveStoreId: (id: string) => void;
  activeStore: Store;
  inventory: InventoryItem[];
  orders: Order[];
  stockLogs: StockAdjustmentLog[];
  // Theme Mode & Controls
  themeMode: AdminThemeMode;
  themePreset: AdminThemePreset;
  toggleThemeMode: () => void;
  setThemeMode: (mode: AdminThemeMode) => void;
  setThemePreset: (preset: AdminThemePreset) => void;
  // Low stock calculation
  lowStockItems: InventoryItem[];
  outOfStockItems: InventoryItem[];
  // Store inventory products
  getStoreProducts: (storeId: string) => {
    item: InventoryItem;
    isLinked: boolean;
    isAvailable: boolean;
    isLowStock: boolean;
    isOutOfStock: boolean;
    threshold: number;
    effectivePrice: number;
  }[];
  // Operations
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => void;
  deleteInventoryItem: (id: string) => void;
  adjustStock: (id: string, delta: number, reason: StockAdjustmentLog['reason'], staffName?: string) => void;
  setReorderThreshold: (id: string, newThreshold: number) => void;
  toggleStoreLink: (storeId: string, inventoryId: string) => void;
  createOrder: (order: Omit<Order, 'id' | 'createdAt' | 'orderNumber' | 'inventoryDeducted'>) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  resetToSampleData: () => void;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

export const ERPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<AdminThemeMode>(() => {
    return (localStorage.getItem('admin-theme') as AdminThemeMode) || (localStorage.getItem('theme-mode') as AdminThemeMode) || 'light';
  });

  const [themePreset, setThemePreset] = useState<AdminThemePreset>(() => {
    return (localStorage.getItem('admin-theme-preset') as AdminThemePreset) || 'default';
  });

  const [stores] = useState<Store[]>(INITIAL_STORES);
  const [activeStoreId, setActiveStoreId] = useState<string>(() => {
    return localStorage.getItem('aura_active_store') || 'store-tokyo';
  });

  const toggleThemeMode = () => {
    setThemeModeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setThemeMode = (mode: AdminThemeMode) => {
    setThemeModeState(mode);
  };

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    root.classList.remove('light', 'dark', 'theme-light', 'theme-dark');
    root.classList.add(themeMode, `theme-${themeMode}`);
    root.setAttribute('data-mode', themeMode);
    root.setAttribute('data-theme', themePreset);
    root.style.colorScheme = themeMode;

    if (body) {
      body.classList.remove('light', 'dark', 'theme-light', 'theme-dark');
      body.classList.add(themeMode, `theme-${themeMode}`);
      body.setAttribute('data-mode', themeMode);
      body.setAttribute('data-theme', themePreset);
    }

    try {
      localStorage.setItem('admin-theme', themeMode);
      localStorage.setItem('admin-theme-mode', themeMode);
      localStorage.setItem('theme-mode', themeMode);
      localStorage.setItem('admin-theme-preset', themePreset);
      window.dispatchEvent(new CustomEvent('admin_theme_changed', {
        detail: { themeMode, themePreset, isDark: themeMode === 'dark' }
      }));
    } catch {}
  }, [themeMode, themePreset]);

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('aura_erp_inventory');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved inventory', e);
      }
    }
    return INITIAL_INVENTORY;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('aura_erp_orders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved orders', e);
      }
    }
    return INITIAL_ORDERS;
  });

  const [stockLogs, setStockLogs] = useState<StockAdjustmentLog[]>(() => {
    const saved = localStorage.getItem('aura_erp_stock_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved stock logs', e);
      }
    }
    return [
      {
        id: 'log-01',
        inventoryId: 'inv-001',
        sku: 'CKT-OLD-01',
        productName: 'Aura Smoked Old Fashioned',
        previousQty: 10,
        newQty: 4,
        delta: -6,
        reason: 'Customer Order',
        timestamp: 'Today at 09:15 AM',
        staffName: 'Tokyo Bar Team',
      },
      {
        id: 'log-02',
        inventoryId: 'inv-002',
        sku: 'STK-WAG-02',
        productName: 'Wagyu A5 Striploin Steak (250g)',
        previousQty: 6,
        newQty: 2,
        delta: -4,
        reason: 'Customer Order',
        timestamp: 'Yesterday at 04:30 PM',
        staffName: 'Chef Kenji',
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem('aura_active_store', activeStoreId);
  }, [activeStoreId]);

  useEffect(() => {
    localStorage.setItem('aura_erp_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('aura_erp_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('aura_erp_stock_logs', JSON.stringify(stockLogs));
  }, [stockLogs]);

  const activeStore = stores.find((s) => s.id === activeStoreId) || stores[0];

  // Derived low stock items: stockQty <= reorderThreshold and stockQty > 0
  const lowStockItems = inventory.filter((item) => item.stockQty > 0 && item.stockQty <= item.reorderThreshold);
  const outOfStockItems = inventory.filter((item) => item.stockQty <= 0);

  // Helper to fetch store products directly from ERP inventory
  const getStoreProducts = (storeId: string) => {
    return inventory.map((item) => {
      const isLinked = item.linkedStoreIds.includes(storeId);
      const isOutOfStock = item.stockQty <= 0;
      const isLowStock = !isOutOfStock && item.stockQty <= item.reorderThreshold;

      return {
        item,
        isLinked,
        isAvailable: isLinked && !isOutOfStock,
        isLowStock,
        isOutOfStock,
        threshold: item.reorderThreshold,
        effectivePrice: item.sellingPrice,
      };
    });
  };

  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            ...updates,
            lastUpdated: 'Just now',
          };
        }
        return item;
      })
    );
  };

  const addInventoryItem = (newItem: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    const item: InventoryItem = {
      ...newItem,
      id: `inv-${Date.now()}`,
      lastUpdated: 'Just now',
    };
    setInventory((prev) => [item, ...prev]);

    // Add log
    const newLog: StockAdjustmentLog = {
      id: `log-${Date.now()}`,
      inventoryId: item.id,
      sku: item.sku,
      productName: item.name,
      previousQty: 0,
      newQty: item.stockQty,
      delta: item.stockQty,
      reason: 'Restock',
      timestamp: 'Just now',
      staffName: 'ERP Admin',
    };
    setStockLogs((prev) => [newLog, ...prev]);
  };

  const deleteInventoryItem = (id: string) => {
    setInventory((prev) => prev.filter((item) => item.id !== id));
  };

  const adjustStock = (
    id: string,
    delta: number,
    reason: StockAdjustmentLog['reason'],
    staffName: string = 'Store Admin'
  ) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(0, item.stockQty + delta);
          const log: StockAdjustmentLog = {
            id: `log-${Date.now()}`,
            inventoryId: item.id,
            sku: item.sku,
            productName: item.name,
            previousQty: item.stockQty,
            newQty,
            delta,
            reason,
            timestamp: 'Just now',
            staffName,
          };
          setStockLogs((l) => [log, ...l]);
          return {
            ...item,
            stockQty: newQty,
            lastUpdated: 'Just now',
          };
        }
        return item;
      })
    );
  };

  const setReorderThreshold = (id: string, newThreshold: number) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            reorderThreshold: Math.max(0, newThreshold),
            lastUpdated: 'Just now',
          };
        }
        return item;
      })
    );
  };

  const toggleStoreLink = (storeId: string, inventoryId: string) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === inventoryId) {
          const isLinked = item.linkedStoreIds.includes(storeId);
          const updated = isLinked
            ? item.linkedStoreIds.filter((sid) => sid !== storeId)
            : [...item.linkedStoreIds, storeId];
          return {
            ...item,
            linkedStoreIds: updated,
            lastUpdated: 'Just now',
          };
        }
        return item;
      })
    );
  };

  const createOrder = (orderData: Omit<Order, 'id' | 'createdAt' | 'orderNumber' | 'inventoryDeducted'>) => {
    const orderNumber = `AURA-${Math.floor(100 + Math.random() * 900)}`;
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber,
      createdAt: 'Just now',
      inventoryDeducted: true,
    };

    // Auto-deduct inventory for each ordered item
    orderData.items.forEach((item) => {
      adjustStock(item.inventoryId, -item.quantity, 'Customer Order', `${orderData.orderSource} (${orderNumber})`);
    });

    setOrders((prev) => [newOrder, ...prev]);
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  };

  const resetToSampleData = () => {
    setInventory(INITIAL_INVENTORY);
    setOrders(INITIAL_ORDERS);
    localStorage.removeItem('aura_erp_inventory');
    localStorage.removeItem('aura_erp_orders');
    localStorage.removeItem('aura_erp_stock_logs');
  };

  return (
    <ERPContext.Provider
      value={{
        themeMode,
        themePreset,
        toggleThemeMode,
        setThemeMode,
        setThemePreset,
        stores,
        activeStoreId,
        setActiveStoreId,
        activeStore,
        inventory,
        orders,
        stockLogs,
        lowStockItems,
        outOfStockItems,
        getStoreProducts,
        updateInventoryItem,
        addInventoryItem,
        deleteInventoryItem,
        adjustStock,
        setReorderThreshold,
        toggleStoreLink,
        createOrder,
        updateOrderStatus,
        resetToSampleData,
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
};
