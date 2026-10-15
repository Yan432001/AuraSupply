export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: 'Cocktails & Spirits' | 'Main Dishes' | 'Appetizers' | 'Wines & Champagne' | 'Desserts' | 'Specialty Coffee';
  description: string;
  stockQty: number;
  reorderThreshold: number; // The threshold below which item is highlighted with warnings
  unitCost: number;
  sellingPrice: number;
  unit: 'bottle' | 'portion' | 'kg' | 'pack' | 'liter';
  supplier: string;
  barcode: string;
  imageUrl: string;
  linkedStoreIds: string[]; // Stores where this inventory product is enabled for menu
  lastUpdated: string;
  dietary?: ('Vegan' | 'Vegetarian' | 'Gluten-Free' | 'Halal' | 'Chef Special')[];
}

export interface Store {
  id: string;
  name: string;
  code: string;
  city: string;
  country: string;
  currency: string;
  currencySymbol: string;
  tablesCount: number;
  address: string;
  status: 'active' | 'maintenance' | 'closed';
  openHours: string;
}

export interface StoreProductOverride {
  inventoryId: string;
  storeId: string;
  isAvailableInStore: boolean;
  storePriceOverride?: number;
  featured?: boolean;
  posQuickKey?: string;
}

export interface OrderItem {
  inventoryId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  storeId: string;
  orderSource: 'Telegram Mini App' | 'E-Menu QR Table' | 'POS Terminal';
  tableNumber?: string;
  customerName?: string;
  telegramUsername?: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  createdAt: string;
  inventoryDeducted: boolean;
}

export interface StockAdjustmentLog {
  id: string;
  inventoryId: string;
  sku: string;
  productName: string;
  previousQty: number;
  newQty: number;
  delta: number;
  reason: 'Restock' | 'Waste / Spoilage' | 'Customer Order' | 'Inventory Audit Count' | 'Damaged';
  timestamp: string;
  staffName: string;
}

export type AdminThemeMode = 'light' | 'dark';
export type AdminThemePreset = 'default' | 'emeraldFintech' | 'violetPrestige' | 'amberElegance' | 'roseSunset' | 'slateExecutive' | 'cyberCyan';
