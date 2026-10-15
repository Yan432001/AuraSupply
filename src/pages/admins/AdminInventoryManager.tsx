import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { 
  Warehouse, 
  AlertTriangle, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Layers, 
  FileSpreadsheet, 
  ArrowDownRight, 
  ArrowUpRight, 
  XCircle, 
  CheckCircle2, 
  History, 
  RefreshCcw,
  Edit3,
  TrendingDown,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { InventoryItem, StockAdjustmentLog } from '../../types';

export const AdminInventoryManager: React.FC = () => {
  const {
    inventory,
    lowStockItems,
    outOfStockItems,
    stores,
    stockLogs,
    adjustStock,
    setReorderThreshold,
    addInventoryItem,
    updateInventoryItem
  } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out' | 'normal'>('all');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'audit_log'>('inventory');

  // New item form state
  const [newItem, setNewItem] = useState({
    sku: '',
    name: '',
    category: 'Cocktails & Spirits' as InventoryItem['category'],
    description: '',
    stockQty: 20,
    reorderThreshold: 10,
    unitCost: 5.0,
    sellingPrice: 15.0,
    unit: 'portion' as InventoryItem['unit'],
    supplier: 'Standard ERP Supplier Co.',
    barcode: '4900000000000',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    linkedStoreIds: stores.map(s => s.id),
  });

  const categories = ['All', ...Array.from(new Set(inventory.map((i) => i.category)))];

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;

    let matchesStatus = true;
    if (stockStatusFilter === 'low') matchesStatus = item.stockQty > 0 && item.stockQty <= item.reorderThreshold;
    if (stockStatusFilter === 'out') matchesStatus = item.stockQty <= 0;
    if (stockStatusFilter === 'normal') matchesStatus = item.stockQty > item.reorderThreshold;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalValuation = inventory.reduce((sum, item) => sum + item.stockQty * item.unitCost, 0);
  const totalUnits = inventory.reduce((sum, item) => sum + item.stockQty, 0);

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.sku) return;
    addInventoryItem(newItem);
    setIsAddingNew(false);
    setNewItem({
      sku: '',
      name: '',
      category: 'Cocktails & Spirits',
      description: '',
      stockQty: 20,
      reorderThreshold: 10,
      unitCost: 5.0,
      sellingPrice: 15.0,
      unit: 'portion',
      supplier: 'Standard ERP Supplier Co.',
      barcode: '4900000000000',
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
      linkedStoreIds: stores.map(s => s.id),
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Warehouse className="w-3.5 h-3.5" />
                Enterprise Resource Planning (ERP)
              </span>
              <span className="text-xs text-slate-400">Master Stock & Warehouse Control</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
              Central Inventory Module
            </h1>
            <p className="text-sm text-slate-300 mt-0.5">
              Source of truth for all stores. Real-time SKU tracking, dynamic low-stock threshold monitoring, and automated store catalog sync.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab(activeTab === 'inventory' ? 'audit_log' : 'inventory')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              <History className="w-4 h-4 text-slate-400" />
              {activeTab === 'inventory' ? 'View Stock Audit Log' : 'Back to Inventory Table'}
            </button>
            <button
              onClick={() => setIsAddingNew(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
            >
              <Plus className="w-4 h-4" />
              Add Inventory SKU
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-1">
            <span>Total SKUs Tracked</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{inventory.length}</div>
          <div className="text-xs text-slate-400 mt-1">{totalUnits} total units in stock</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-1">
            <span>Stock Valuation (Cost)</span>
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <div className="text-xs text-slate-400 mt-1">Weighted average asset value</div>
        </div>

        <div className={`border rounded-xl p-4 transition ${
          lowStockItems.length > 0 ? 'bg-amber-950/30 border-amber-500/50 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-400'
        }`}>
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="font-semibold">Low Stock Threshold Warnings</span>
            <AlertTriangle className={`w-4 h-4 ${lowStockItems.length > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
          </div>
          <div className={`text-2xl font-bold ${lowStockItems.length > 0 ? 'text-amber-400' : 'text-white'}`}>
            {lowStockItems.length}
          </div>
          <div className="text-xs mt-1 opacity-80">Requires replenishment</div>
        </div>

        <div className={`border rounded-xl p-4 transition ${
          outOfStockItems.length > 0 ? 'bg-rose-950/30 border-rose-500/50 text-rose-300' : 'bg-slate-900 border-slate-800 text-slate-400'
        }`}>
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="font-semibold">Out of Stock SKUs</span>
            <XCircle className={`w-4 h-4 ${outOfStockItems.length > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
          </div>
          <div className={`text-2xl font-bold ${outOfStockItems.length > 0 ? 'text-rose-400' : 'text-white'}`}>
            {outOfStockItems.length}
          </div>
          <div className="text-xs mt-1 opacity-80">Depleted inventory items</div>
        </div>
      </div>

      {activeTab === 'inventory' ? (
        <>
          {/* Filters & Search */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter inventory by item name, SKU, or supplier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs">
                <button
                  onClick={() => setStockStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    stockStatusFilter === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  All ({inventory.length})
                </button>
                <button
                  onClick={() => setStockStatusFilter('low')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                    stockStatusFilter === 'low'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Below Threshold ({lowStockItems.length})
                </button>
                <button
                  onClick={() => setStockStatusFilter('out')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                    stockStatusFilter === 'out'
                      ? 'bg-rose-600 text-white font-bold'
                      : 'bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Out of Stock ({outOfStockItems.length})
                </button>
                <button
                  onClick={() => setStockStatusFilter('normal')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                    stockStatusFilter === 'normal'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Adequate Stock
                </button>
              </div>
            </div>

            {/* Category selection */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 shrink-0">Categories:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-md shrink-0 transition ${
                    categoryFilter === cat
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-semibold'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Master Inventory Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Item & SKU</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-center">Stock Level</th>
                    <th className="py-3 px-3 text-center">Defined Threshold</th>
                    <th className="py-3 px-3">Unit Cost / Price</th>
                    <th className="py-3 px-3">Supplier</th>
                    <th className="py-3 px-3 text-center">Status & Warning</th>
                    <th className="py-3 px-4 text-right">Quick Restock / Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredInventory.map((item) => {
                    const isOut = item.stockQty <= 0;
                    const isLow = !isOut && item.stockQty <= item.reorderThreshold;

                    return (
                      <tr
                        key={item.id}
                        className={`transition hover:bg-slate-800/40 ${
                          isOut
                            ? 'bg-rose-950/25'
                            : isLow
                            ? 'bg-amber-950/20'
                            : ''
                        }`}
                      >
                        {/* Item and SKU */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-10 h-10 rounded-lg object-cover bg-slate-950 border border-slate-700 shrink-0"
                            />
                            <div>
                              <div className="font-semibold text-white flex items-center gap-2">
                                {item.name}
                                {item.dietary?.includes('Chef Special') && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                    Special
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                                <span>SKU: {item.sku}</span>
                                <span>&bull;</span>
                                <span>{item.barcode}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-3 text-xs text-slate-300">
                          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                            {item.category}
                          </span>
                        </td>

                        {/* Stock Level */}
                        <td className="py-3.5 px-3 text-center">
                          <span className={`font-mono font-bold text-sm px-2 py-0.5 rounded ${
                            isOut
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : isLow
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'text-emerald-400'
                          }`}>
                            {item.stockQty} {item.unit}s
                          </span>
                        </td>

                        {/* Defined Threshold with in-place adjustment */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="inline-flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                            <span className="text-xs font-mono font-bold text-amber-300">
                              &le; {item.reorderThreshold}
                            </span>
                            <span className="text-[10px] text-slate-500">{item.unit}s</span>
                          </div>
                        </td>

                        {/* Cost & Price */}
                        <td className="py-3.5 px-3 text-xs">
                          <div className="text-slate-200 font-medium">
                            Cost: <span className="font-mono text-indigo-300">${item.unitCost.toFixed(2)}</span>
                          </div>
                          <div className="text-slate-400 font-mono text-[11px]">
                            Retail: ${item.sellingPrice.toFixed(2)}
                          </div>
                        </td>

                        {/* Supplier */}
                        <td className="py-3.5 px-3 text-xs text-slate-300">
                          <div className="truncate max-w-[150px]" title={item.supplier}>
                            {item.supplier}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Synced to {item.linkedStoreIds.length} stores
                          </div>
                        </td>

                        {/* Status & Warning Badge */}
                        <td className="py-3.5 px-3 text-center">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-600 text-white animate-pulse">
                              <XCircle className="w-3.5 h-3.5" />
                              Depleted (0)
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950 shadow-md">
                              <AlertTriangle className="w-3.5 h-3.5 text-slate-950" />
                              Warning: Deficit {item.reorderThreshold - item.stockQty}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              Optimal
                            </span>
                          )}
                        </td>

                        {/* Quick Restock Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => adjustStock(item.id, 10, 'Restock', 'ERP Inventory Control')}
                              className="px-2.5 py-1 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded text-xs font-semibold transition"
                              title="Add 10 units"
                            >
                              +10 Restock
                            </button>
                            <button
                              onClick={() => adjustStock(item.id, -1, 'Waste / Spoilage', 'ERP Inventory Control')}
                              disabled={item.stockQty <= 0}
                              className="px-2 py-1 bg-slate-800 hover:bg-rose-900/60 disabled:opacity-40 text-slate-300 hover:text-rose-200 rounded text-xs font-semibold transition"
                              title="Waste / Deduct 1 unit"
                            >
                              -1
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Stock Audit Log View */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                ERP Inventory Stock Movement & Audit Trail
              </h3>
              <p className="text-xs text-slate-400">
                Immutable chronological log of all stock deductions, restocks, order dispatches, and manual counts.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">{stockLogs.length} total events recorded</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Product Name & SKU</th>
                  <th className="py-2.5 px-3 text-center">Movement</th>
                  <th className="py-2.5 px-3 text-center">Before &rarr; After</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3">Operator / Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stockLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{log.timestamp}</td>
                    <td className="py-2.5 px-3 text-white font-medium">
                      {log.productName} <span className="text-slate-500 font-mono">({log.sku})</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded font-mono font-bold text-xs ${
                        log.delta > 0
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {log.delta > 0 ? `+${log.delta}` : log.delta}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                      {log.previousQty} &rarr; <span className="font-bold text-white">{log.newQty}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                        {log.reason}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{log.staffName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add New SKU Modal */}
      {isAddingNew && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateItem}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Create New Inventory SKU</h3>
                <p className="text-xs text-slate-400">Registers item into ERP master warehouse</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">SKU Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CKT-GIN-11"
                  value={newItem.sku}
                  onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category *</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value as any })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Cocktails & Spirits">Cocktails & Spirits</option>
                  <option value="Main Dishes">Main Dishes</option>
                  <option value="Appetizers">Appetizers</option>
                  <option value="Wines & Champagne">Wines & Champagne</option>
                  <option value="Desserts">Desserts</option>
                  <option value="Specialty Coffee">Specialty Coffee</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Product Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Kyoto Botanical Dry Gin"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="Product description and menu tasting notes..."
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Initial Stock Qty</label>
                <input
                  type="number"
                  min="0"
                  value={newItem.stockQty}
                  onChange={(e) => setNewItem({ ...newItem, stockQty: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-amber-400 mb-1">Reorder Threshold *</label>
                <input
                  type="number"
                  min="1"
                  value={newItem.reorderThreshold}
                  onChange={(e) => setNewItem({ ...newItem, reorderThreshold: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-amber-500/50 rounded-lg text-sm text-amber-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Unit Type</label>
                <select
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value as any })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white"
                >
                  <option value="portion">portion</option>
                  <option value="bottle">bottle</option>
                  <option value="pack">pack</option>
                  <option value="kg">kg</option>
                  <option value="liter">liter</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Unit Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newItem.unitCost}
                  onChange={(e) => setNewItem({ ...newItem, unitCost: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Retail Selling Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newItem.sellingPrice}
                  onChange={(e) => setNewItem({ ...newItem, sellingPrice: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-emerald-400 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Supplier Organization</label>
              <input
                type="text"
                value={newItem.supplier}
                onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
              >
                Save &amp; Sync SKU to ERP
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
