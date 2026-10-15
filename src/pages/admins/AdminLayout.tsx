import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { 
  Building2, 
  Warehouse, 
  Layers, 
  ShoppingBag, 
  Palette, 
  AlertTriangle, 
  RefreshCw, 
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';
import { AdminStoreManager } from './AdminStoreManager';
import { AdminInventoryManager } from './AdminInventoryManager';
import { AdminOrdersManager } from './AdminOrdersManager';
import { AdminFrontEndManager } from './AdminFrontEndManager';

export const AdminLayout: React.FC = () => {
  const { 
    stores, 
    activeStoreId, 
    setActiveStoreId, 
    activeStore, 
    lowStockItems, 
    orders,
    resetToSampleData,
    themeMode,
    toggleThemeMode,
    themePreset,
    setThemePreset
  } = useERP();

  const [activeTab, setActiveTab] = useState<'store_manager' | 'inventory_module' | 'orders' | 'frontend'>('store_manager');
  const isDark = themeMode === 'dark';

  const pendingOrdersCount = orders.filter((o) => o.status === 'pending' || o.status === 'preparing').length;

  return (
    <div className="space-y-6">
      {/* Admin Subheader & Store Switcher */}
      <div className={`rounded-2xl p-4 transition-colors duration-200 border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
        isDark 
          ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-xl' 
          : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}>
        {/* Active Store Selector */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-mono font-semibold uppercase tracking-wider ${
                isDark ? 'text-indigo-400' : 'text-indigo-600'
              }`}>
                Store Branch:
              </span>
              <select
                value={activeStoreId}
                onChange={(e) => setActiveStoreId(e.target.value)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none focus:border-indigo-500 cursor-pointer border transition-colors ${
                  isDark 
                    ? 'bg-slate-950 border-slate-700 text-white' 
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.city})
                  </option>
                ))}
              </select>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Code: <span className={`font-mono font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{activeStore.code}</span> &bull; {activeStore.tablesCount} Tables &bull; {activeStore.currency} ({activeStore.currencySymbol})
            </p>
          </div>
        </div>

        {/* Admin Navigation Tabs & Theme Mode Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className={`flex items-center gap-1 p-1 rounded-xl border ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setActiveTab('store_manager')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'store_manager'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : isDark
                    ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Store Products</span>
              {lowStockItems.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                  {lowStockItems.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('inventory_module')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'inventory_module'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : isDark
                    ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
            >
              <Warehouse className="w-3.5 h-3.5" />
              <span>Central Inventory</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold border ${
                isDark 
                  ? 'bg-indigo-950 text-indigo-300 border-indigo-700/50' 
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}>
                ERP
              </span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : isDark
                    ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Orders</span>
              {pendingOrdersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-500 text-white">
                  {pendingOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('frontend')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'frontend'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : isDark
                    ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Themes &amp; Design</span>
            </button>
          </div>

          {/* Quick Theme Toggle & Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleThemeMode}
              title={`Switch admin theme to ${isDark ? 'Light' : 'Dark'} mode`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold transition cursor-pointer ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700' 
                  : 'bg-white hover:bg-slate-50 text-indigo-900 border-slate-200 shadow-xs'
              }`}
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Dark</span>
                </>
              )}
            </button>

            <button
              onClick={resetToSampleData}
              title="Reset to default ERP sample data"
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border-slate-700' 
                  : 'bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-900 border-slate-200 shadow-xs'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="transition-colors duration-200">
        {activeTab === 'store_manager' && (
          <AdminStoreManager onNavigateToInventory={() => setActiveTab('inventory_module')} />
        )}
        {activeTab === 'inventory_module' && <AdminInventoryManager />}
        {activeTab === 'orders' && <AdminOrdersManager />}
        {activeTab === 'frontend' && (
          <AdminFrontEndManager onNavigateToStoreManagement={() => setActiveTab('store_manager')} />
        )}
      </div>
    </div>
  );
};
