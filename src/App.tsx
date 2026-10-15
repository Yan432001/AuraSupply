import React, { useState } from 'react';
import { ERPProvider, useERP } from './context/ERPContext';
import { AdminLayout } from './pages/admins/AdminLayout';
import { CustomerView } from './pages/customer/CustomerView';
import { 
  Building2, 
  UtensilsCrossed, 
  Layers, 
  Warehouse, 
  AlertTriangle, 
  Sparkles, 
  ShieldCheck,
  Send,
  Table,
  Sun,
  Moon
} from 'lucide-react';

const MainShell: React.FC = () => {
  const { lowStockItems, outOfStockItems, activeStore, themeMode, toggleThemeMode } = useERP();
  const [currentView, setCurrentView] = useState<'admin' | 'customer'>('admin');
  const isDark = themeMode === 'dark';

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      isDark ? 'bg-[#090d16] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Top Navigation Bar */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors duration-200 ${
        isDark 
          ? 'bg-[#0c121e]/90 border-slate-800 text-slate-100' 
          : 'bg-white/95 border-slate-200 text-slate-900 shadow-xs'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-600/30">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-bold text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Aura Global
                </span>
                <span className={`text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded border ${
                  isDark 
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}>
                  ERP &bull; E-Menu
                </span>
              </div>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Multi-Store Hospitality &amp; Inventory Management
              </p>
            </div>
          </div>

          {/* High-Level View Switcher */}
          <div className={`flex items-center gap-1.5 p-1 rounded-xl border transition-colors ${
            isDark 
              ? 'bg-slate-900/90 border-slate-800' 
              : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setCurrentView('admin')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                currentView === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : isDark 
                    ? 'text-slate-400 hover:text-slate-200' 
                    : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Warehouse className="w-3.5 h-3.5" />
              <span>ERP Admin Panel</span>
              {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setCurrentView('customer')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                currentView === 'customer'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : isDark 
                    ? 'text-slate-400 hover:text-slate-200' 
                    : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Customer E-Menu &amp; TMA</span>
            </button>
          </div>

          {/* Right Controls: Theme Switcher & Status Badge */}
          <div className="flex items-center gap-3">
            {/* Global Theme Toggle Button */}
            <button
              onClick={toggleThemeMode}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition shadow-xs cursor-pointer ${
                isDark 
                  ? 'bg-slate-800/90 border-slate-700 text-amber-300 hover:bg-slate-700' 
                  : 'bg-white border-slate-300 text-indigo-950 hover:bg-slate-50'
              }`}
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-200">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-slate-800">Dark Mode</span>
                </>
              )}
            </button>

            <div className="hidden md:flex items-center gap-2">
              <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border ${
                isDark 
                  ? 'bg-slate-900 text-slate-300 border-slate-800' 
                  : 'bg-white text-slate-700 border-slate-200 shadow-xs'
              }`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-medium">Inventory Synced</span>
              </div>
              {lowStockItems.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{lowStockItems.length} Low Stock</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {currentView === 'admin' ? <AdminLayout /> : <CustomerView />}
      </main>

      {/* Footer */}
      <footer className={`border-t py-4 mt-auto transition-colors ${
        isDark 
          ? 'bg-[#0c121e] border-slate-800 text-slate-500' 
          : 'bg-white border-slate-200 text-slate-500 shadow-xs'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
          <div>
            Aura Global Hospitality ERP &bull; Store Products Controlled via Inventory Module
          </div>
          <div className="flex items-center gap-3">
            <span>Branch: <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>{activeStore.name}</strong></span>
            <span>&bull;</span>
            <span className="text-emerald-500 font-medium">Real-time Stock Deductions Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ERPProvider>
      <MainShell />
    </ERPProvider>
  );
}
