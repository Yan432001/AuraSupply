import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { 
  AlertTriangle, 
  Package, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  SlidersHorizontal, 
  Search, 
  Plus, 
  Minus, 
  ExternalLink, 
  RefreshCw, 
  TrendingDown,
  Warehouse,
  ShieldAlert,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { InventoryItem } from '../../types';

interface AdminStoreManagerProps {
  onNavigateToInventory?: () => void;
}

export const AdminStoreManager: React.FC<AdminStoreManagerProps> = ({ onNavigateToInventory }) => {
  const {
    activeStore,
    getStoreProducts,
    adjustStock,
    setReorderThreshold,
    toggleStoreLink,
    updateInventoryItem
  } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low_stock' | 'out_of_stock' | 'active'>('all');
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<InventoryItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(5);
  const [adjustReason, setAdjustReason] = useState<'Restock' | 'Damaged' | 'Waste / Spoilage'>('Restock');
  const [newThresholdInput, setNewThresholdInput] = useState<number>(10);
  const [editingThresholdId, setEditingThresholdId] = useState<string | null>(null);

  // Fetch products directly synced with ERP Inventory module!
  const storeProducts = getStoreProducts(activeStore.id);

  // Categorize
  const categories = ['All', ...Array.from(new Set(storeProducts.map((p) => p.item.category)))];

  // Filter products
  const filteredProducts = storeProducts.filter(({ item, isLinked, isLowStock, isOutOfStock }) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;

    let matchesStatus = true;
    if (statusFilter === 'low_stock') matchesStatus = isLowStock;
    if (statusFilter === 'out_of_stock') matchesStatus = isOutOfStock;
    if (statusFilter === 'active') matchesStatus = isLinked && !isOutOfStock;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const storeLowStockCount = storeProducts.filter((p) => p.isLinked && p.isLowStock).length;
  const storeOutOfStockCount = storeProducts.filter((p) => p.isLinked && p.isOutOfStock).length;
  const storeLinkedCount = storeProducts.filter((p) => p.isLinked).length;

  const handleQuickRestock = (item: InventoryItem, qty: number) => {
    adjustStock(item.id, qty, 'Restock', `Store Admin (${activeStore.code})`);
  };

  const handleSaveThreshold = (item: InventoryItem) => {
    setReorderThreshold(item.id, newThresholdInput);
    setEditingThresholdId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Explaining ERP Inventory Sync Architecture */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-900/40 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Warehouse className="w-3.5 h-3.5" />
                ERP Inventory Synced
              </span>
              <span className="text-xs text-slate-400">
                Store ID: <span className="font-mono text-slate-200">{activeStore.code}</span> ({activeStore.name})
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Store Product & Catalog Management
            </h1>
            <p className="text-sm text-slate-300">
              Live menu items are dynamically controlled by and synced with the <strong className="text-indigo-300 font-semibold">Central Inventory Module</strong>. Stock deductions, threshold warnings, and reorder alerts are synchronized in real time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToInventory && (
              <button
                onClick={onNavigateToInventory}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-md hover:shadow-indigo-500/20"
              >
                <Layers className="w-4 h-4" />
                Go to Central Warehouse
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Visual Warning Banner for Items Below Defined Threshold */}
      {storeLowStockCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border-2 border-amber-500/40 rounded-xl p-4 shadow-lg animate-pulse-slow">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-400 shrink-0">
              <ShieldAlert className="w-6 h-6 animate-bounce" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-amber-200 flex items-center gap-2">
                  <span>Inventory Threshold Alert:</span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500 text-slate-950">
                    {storeLowStockCount} {storeLowStockCount === 1 ? 'Product' : 'Products'} Below Reorder Level
                  </span>
                </h3>
                <button
                  onClick={() => setStatusFilter(statusFilter === 'low_stock' ? 'all' : 'low_stock')}
                  className="text-xs font-medium text-amber-300 hover:text-white underline underline-offset-2 transition"
                >
                  {statusFilter === 'low_stock' ? 'Show All Products' : 'Filter Low Stock Only'}
                </button>
              </div>
              <p className="text-xs text-amber-300/90 leading-relaxed">
                The highlighted items below have fallen below their defined reorder threshold in the Inventory module. Visual warnings are flagged on the store catalog to prevent guest ordering oversells.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Store Metrics Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active in Store</span>
            <Package className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {storeLinkedCount} <span className="text-xs text-slate-400 font-normal">/ {storeProducts.length} ERP items</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Live on guest menu & POS</p>
        </div>

        <div className={`border rounded-xl p-4 shadow-sm transition ${
          storeLowStockCount > 0 
            ? 'bg-amber-950/30 border-amber-600/50 text-amber-300' 
            : 'bg-slate-900/80 border-slate-800 text-slate-400'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Low Stock Warnings</span>
            <AlertTriangle className={`w-4 h-4 ${storeLowStockCount > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
          </div>
          <div className={`text-2xl font-bold ${storeLowStockCount > 0 ? 'text-amber-400' : 'text-white'}`}>
            {storeLowStockCount}
          </div>
          <p className="text-xs mt-1 opacity-80">Stock &le; Defined Threshold</p>
        </div>

        <div className={`border rounded-xl p-4 shadow-sm transition ${
          storeOutOfStockCount > 0 
            ? 'bg-rose-950/30 border-rose-600/50 text-rose-300' 
            : 'bg-slate-900/80 border-slate-800 text-slate-400'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Out of Stock</span>
            <XCircle className={`w-4 h-4 ${storeOutOfStockCount > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
          </div>
          <div className={`text-2xl font-bold ${storeOutOfStockCount > 0 ? 'text-rose-400' : 'text-white'}`}>
            {storeOutOfStockCount}
          </div>
          <p className="text-xs mt-1 opacity-80">Unavailable on storefront</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Store Currency</span>
            <span className="text-xs font-mono font-bold text-slate-300">{activeStore.currency}</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {activeStore.currencySymbol} <span className="text-sm text-slate-400 font-normal">{activeStore.city}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{activeStore.tablesCount} dining tables</p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search store products by name, SKU, or category (ERP-linked)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Items ({storeProducts.length})
            </button>
            <button
              onClick={() => setStatusFilter('low_stock')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === 'low_stock'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Low Stock Warnings ({storeLowStockCount})
            </button>
            <button
              onClick={() => setStatusFilter('out_of_stock')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === 'out_of_stock'
                  ? 'bg-rose-600 text-white font-semibold'
                  : 'bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              Out of Stock ({storeOutOfStockCount})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Active in Store
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 text-xs">
          <span className="text-slate-400 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md shrink-0 transition ${
                categoryFilter === cat
                  ? 'bg-slate-700 text-white font-medium shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map(({ item, isLinked, isAvailable, isLowStock, isOutOfStock, threshold }) => {
          const isWarning = isLowStock || isOutOfStock;
          const stockPercentage = Math.min(100, Math.round((item.stockQty / (threshold * 2 || 1)) * 100));

          return (
            <div
              key={item.id}
              className={`group relative rounded-xl border transition-all duration-200 overflow-hidden flex flex-col ${
                isOutOfStock
                  ? 'bg-rose-950/20 border-rose-600/60 shadow-lg shadow-rose-950/20 ring-1 ring-rose-500/30'
                  : isLowStock
                  ? 'bg-amber-950/20 border-amber-500/60 shadow-lg shadow-amber-950/30 ring-2 ring-amber-500/30'
                  : isLinked
                  ? 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800/60 opacity-60'
              }`}
            >
              {/* Product Visual Header */}
              <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                {/* SKU & Category Pill */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-slate-900/90 backdrop-blur-md text-[10px] font-mono font-semibold text-slate-300 border border-slate-700">
                    {item.sku}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-900/90 backdrop-blur-md text-[10px] font-medium text-slate-300 border border-slate-700">
                    {item.category}
                  </span>
                </div>

                {/* VISUAL WARNING BADGE ON PRODUCT CARD */}
                {isOutOfStock ? (
                  <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-md bg-rose-600 text-white text-[11px] font-bold shadow-md flex items-center gap-1.5 animate-pulse">
                    <XCircle className="w-3.5 h-3.5" />
                    OUT OF STOCK
                  </div>
                ) : isLowStock ? (
                  <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 text-[11px] font-extrabold shadow-md flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-slate-950" />
                    LOW STOCK WARNING
                  </div>
                ) : (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                    In Stock ({item.stockQty} {item.unit}s)
                  </div>
                )}

                {/* Price Display */}
                <div className="absolute bottom-2.5 left-2.5">
                  <div className="text-xl font-bold text-white drop-shadow">
                    {activeStore.currencySymbol}{item.sellingPrice.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    ERP Cost: ${item.unitCost.toFixed(2)} / {item.unit}
                  </div>
                </div>

                {/* Enable/Disable in Store Toggle */}
                <div className="absolute bottom-2.5 right-2.5">
                  <button
                    onClick={() => toggleStoreLink(activeStore.id, item.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition backdrop-blur-md border flex items-center gap-1 ${
                      isLinked
                        ? 'bg-emerald-600/90 text-white border-emerald-500 hover:bg-rose-600 hover:border-rose-500'
                        : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-emerald-600 hover:border-emerald-500'
                    }`}
                    title={isLinked ? 'Click to disable in this store menu' : 'Click to enable in this store menu'}
                  >
                    {isLinked ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                        In Menu
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" />
                        Add to Menu
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-base font-semibold text-white group-hover:text-indigo-300 transition line-clamp-1">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* INVENTORY MODULE SYNC & THRESHOLD WARNING PANEL */}
                <div className={`p-3 rounded-lg border transition ${
                  isOutOfStock
                    ? 'bg-rose-950/40 border-rose-700/50 text-rose-200'
                    : isLowStock
                    ? 'bg-amber-950/40 border-amber-600/50 text-amber-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300'
                }`}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Warehouse className="w-3.5 h-3.5 text-indigo-400" />
                      ERP Inventory Stock:
                    </span>
                    <span className={`font-mono font-bold text-sm ${
                      isOutOfStock ? 'text-rose-400' : isLowStock ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {item.stockQty} {item.unit}s
                    </span>
                  </div>

                  {/* Stock Bar vs Threshold */}
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        isOutOfStock ? 'bg-rose-600 w-0' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(5, Math.min(100, (item.stockQty / (threshold * 1.5 || 10)) * 100))}%` }}
                    />
                  </div>

                  {/* Defined Threshold Visual Warning Info */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <span>Threshold:</span>
                      {editingThresholdId === item.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={newThresholdInput}
                            onChange={(e) => setNewThresholdInput(Number(e.target.value))}
                            className="w-12 px-1 py-0.5 bg-slate-900 border border-indigo-500 rounded text-xs text-white text-center"
                          />
                          <button
                            onClick={() => handleSaveThreshold(item)}
                            className="px-1.5 py-0.5 bg-indigo-600 text-white rounded text-[10px] hover:bg-indigo-500"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <span 
                          onClick={() => {
                            setEditingThresholdId(item.id);
                            setNewThresholdInput(item.reorderThreshold);
                          }}
                          className="font-mono text-slate-200 cursor-pointer underline hover:text-indigo-300"
                          title="Click to edit threshold"
                        >
                          {item.reorderThreshold} {item.unit}s
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono">
                      Supplier: {item.supplier.split(' ')[0]}
                    </span>
                  </div>

                  {/* Explicit Visual Warning Text */}
                  {isLowStock && (
                    <div className="mt-2 pt-2 border-t border-amber-700/40 flex items-center justify-between text-xs text-amber-300 font-medium">
                      <span className="flex items-center gap-1">
                        <TrendingDown className="w-3.5 h-3.5" />
                        Deficit: {threshold - item.stockQty} under threshold!
                      </span>
                      <button
                        onClick={() => handleQuickRestock(item, 10)}
                        className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-[10px] hover:bg-amber-400 transition"
                      >
                        +10 Restock
                      </button>
                    </div>
                  )}

                  {isOutOfStock && (
                    <div className="mt-2 pt-2 border-t border-rose-700/40 flex items-center justify-between text-xs text-rose-300 font-medium">
                      <span className="flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        Order blocked on Menu
                      </span>
                      <button
                        onClick={() => handleQuickRestock(item, 15)}
                        className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px] hover:bg-rose-500 transition"
                      >
                        Emergency +15
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                    <span>ERP Item #{item.sku}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedItemForAdjust(item);
                        setAdjustAmount(5);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                      title="Adjust Inventory Stock directly"
                    >
                      <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                      Adjust Stock
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <Package className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">No products match your search or filter</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query, status filter, or category tabs.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('All');
              setStatusFilter('all');
            }}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {selectedItemForAdjust && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider font-semibold">
                  ERP Inventory Adjustment
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {selectedItemForAdjust.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  SKU: {selectedItemForAdjust.sku} &bull; Warehouse Unit: {selectedItemForAdjust.unit}
                </p>
              </div>
              <button
                onClick={() => setSelectedItemForAdjust(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                &times;
              </button>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Current Stock Level:</span>
                <span className="font-mono font-bold text-white text-sm">
                  {selectedItemForAdjust.stockQty} {selectedItemForAdjust.unit}s
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Defined Reorder Threshold:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {selectedItemForAdjust.reorderThreshold} {selectedItemForAdjust.unit}s
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-300">
                Reason for Stock Adjustment:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Restock', 'Waste / Spoilage', 'Damaged'] as const).map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setAdjustReason(reason)}
                    className={`py-2 px-2 rounded-lg text-xs font-medium border text-center transition ${
                      adjustReason === reason
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-300">
                Quantity to Adjust:
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustAmount(Math.max(1, adjustAmount - 1))}
                  className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-center text-lg font-bold text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setAdjustAmount(adjustAmount + 1)}
                  className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-center text-slate-400">
                New inventory level will be:{' '}
                <span className="font-bold font-mono text-emerald-400 text-sm">
                  {adjustReason === 'Restock'
                    ? selectedItemForAdjust.stockQty + adjustAmount
                    : Math.max(0, selectedItemForAdjust.stockQty - adjustAmount)}{' '}
                  {selectedItemForAdjust.unit}s
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedItemForAdjust(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const delta = adjustReason === 'Restock' ? adjustAmount : -adjustAmount;
                  adjustStock(selectedItemForAdjust.id, delta, adjustReason, `Store Manager (${activeStore.code})`);
                  setSelectedItemForAdjust(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
              >
                Confirm Inventory Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
