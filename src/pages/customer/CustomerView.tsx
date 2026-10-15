import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { 
  ShoppingBag, 
  Send, 
  Sparkles, 
  Check, 
  Plus, 
  Minus, 
  X, 
  UtensilsCrossed, 
  Search, 
  Clock, 
  Info, 
  AlertTriangle,
  ChevronRight,
  Wine,
  Coffee,
  CheckCircle2,
  Table
} from 'lucide-react';
import { InventoryItem } from '../../types';

export const CustomerView: React.FC = () => {
  const { activeStore, getStoreProducts, createOrder } = useERP();

  const [mode, setMode] = useState<'telegram' | 'emenu'>('telegram');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{ item: InventoryItem; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState('Table 12');
  const [guestName, setGuestName] = useState('E-Menu Guest');
  const [telegramUsername, setTelegramUsername] = useState('@guest_alex');
  const [orderPlacedSuccess, setOrderPlacedSuccess] = useState<string | null>(null);

  // Products available in this store (synced with ERP Inventory module!)
  const storeProducts = getStoreProducts(activeStore.id);
  const activeProducts = storeProducts.filter((p) => p.isLinked);

  const categories = ['All', ...Array.from(new Set(activeProducts.map((p) => p.item.category)))];

  const filteredProducts = activeProducts.filter(({ item }) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const cartTotal = cart.reduce((sum, entry) => sum + entry.item.sellingPrice * entry.quantity, 0);
  const cartItemCount = cart.reduce((sum, entry) => sum + entry.quantity, 0);

  const addToCart = (item: InventoryItem) => {
    if (item.stockQty <= 0) return;

    setCart((prev) => {
      const existing = prev.find((entry) => entry.item.id === item.id);
      if (existing) {
        if (existing.quantity >= item.stockQty) return prev; // Cannot exceed physical stock
        return prev.map((entry) =>
          entry.item.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) =>
      prev
        .map((entry) => (entry.item.id === itemId ? { ...entry, quantity: entry.quantity - 1 } : entry))
        .filter((entry) => entry.quantity > 0)
    );
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    createOrder({
      storeId: activeStore.id,
      orderSource: mode === 'telegram' ? 'Telegram Mini App' : 'E-Menu QR Table',
      tableNumber,
      customerName: guestName,
      telegramUsername: mode === 'telegram' ? telegramUsername : undefined,
      items: cart.map((c) => ({
        inventoryId: c.item.id,
        sku: c.item.sku,
        name: c.item.name,
        quantity: c.quantity,
        unitPrice: c.item.sellingPrice,
      })),
      totalAmount: cartTotal,
      status: 'pending',
    });

    setCart([]);
    setIsCartOpen(false);
    setOrderPlacedSuccess(`Order successfully dispatched to ${activeStore.name} kitchen! Inventory automatically deducted.`);
    setTimeout(() => setOrderPlacedSuccess(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* View Mode Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="text-sm font-bold text-white">Customer Ordering Interface</h2>
            <p className="text-xs text-slate-400">
              Live guest menu connected to <span className="text-indigo-300 font-medium">{activeStore.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setMode('telegram')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === 'telegram'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Telegram Mini App Mode
          </button>
          <button
            onClick={() => setMode('emenu')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === 'emenu'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            Table QR / Web E-Menu
          </button>
        </div>
      </div>

      {orderPlacedSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-medium">{orderPlacedSuccess}</span>
          </div>
          <button
            onClick={() => setOrderPlacedSuccess(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className={`mx-auto transition-all ${mode === 'telegram' ? 'max-w-md' : 'max-w-5xl'}`}>
        <div className={`rounded-2xl border overflow-hidden shadow-2xl transition-all ${
          mode === 'telegram'
            ? 'bg-slate-950 border-sky-500/40 ring-1 ring-sky-500/20'
            : 'bg-slate-900 border-slate-800'
        }`}>
          {/* Telegram Header Simulation */}
          {mode === 'telegram' && (
            <div className="bg-[#212d3b] text-white px-4 py-2.5 flex items-center justify-between border-b border-sky-900/30 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-semibold text-white">@AuraGlobal_Bot</span>
                <span className="text-[10px] text-sky-300 bg-sky-950/60 px-1.5 py-0.2 rounded border border-sky-500/30">
                  Mini App
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="text-[11px] text-slate-300">Table: {tableNumber}</span>
              </div>
            </div>
          )}

          {/* Storefront Hero Banner */}
          <div className="relative p-6 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border-b border-slate-800">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Sparkles className="w-3 h-3" />
                {activeStore.name}
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Aura Gastronomy &amp; Mixology
              </h1>
              <p className="text-xs text-slate-400">
                {activeStore.address} &bull; Open {activeStore.openHours}
              </p>
            </div>

            {/* Table & Guest quick config */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Table:</span>
                <select
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-white"
                >
                  {Array.from({ length: activeStore.tablesCount }, (_, i) => `Table ${String(i + 1).padStart(2, '0')}`).map((tbl) => (
                    <option key={tbl} value={tbl}>{tbl}</option>
                  ))}
                </select>
              </div>

              {mode === 'telegram' ? (
                <div className="flex items-center gap-1.5 text-sky-400 font-mono text-[11px]">
                  <span>User: {telegramUsername}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Guest:</span>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-md px-2 py-0.5 text-xs text-white w-28"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Search & Categories Bar */}
          <div className="p-4 bg-slate-900/90 border-b border-slate-800 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search food, cocktails, wine..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap text-xs font-medium transition ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Items List */}
          <div className="p-4 space-y-3 max-h-[580px] overflow-y-auto">
            {filteredProducts.map(({ item, isLowStock, isOutOfStock }) => {
              const inCart = cart.find((c) => c.item.id === item.id);

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border flex gap-3 transition ${
                    isOutOfStock
                      ? 'bg-slate-950/60 border-slate-800 opacity-50'
                      : isLowStock
                      ? 'bg-slate-900 border-amber-500/30 hover:border-amber-500/60'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-20 h-20 rounded-lg object-cover bg-slate-950 border border-slate-800 shrink-0"
                  />

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-white">{item.name}</h4>
                        <span className="font-mono font-bold text-indigo-400 text-sm shrink-0">
                          {activeStore.currencySymbol}{item.sellingPrice.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/80">
                      {/* Live Stock Indicator directly from Inventory module! */}
                      {isOutOfStock ? (
                        <span className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                          Sold Out
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[10px] text-amber-400 font-medium flex items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          Only {item.stockQty} left in stock!
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-medium">
                          Available
                        </span>
                      )}

                      {/* Add/Remove Button */}
                      {!isOutOfStock && (
                        <div className="flex items-center gap-2">
                          {inCart ? (
                            <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg p-0.5">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 text-white hover:bg-slate-700"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold text-white px-1">
                                {inCart.quantity}
                              </span>
                              <button
                                onClick={() => addToCart(item)}
                                disabled={inCart.quantity >= item.stockQty}
                                className="w-6 h-6 flex items-center justify-center rounded bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-30"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-xs">
                No items found for this selection.
              </div>
            )}
          </div>

          {/* Floating Cart Bottom Bar */}
          {cartItemCount > 0 && (
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                  {cartItemCount}
                </div>
                <div>
                  <div className="text-xs text-slate-400">Total Bill</div>
                  <div className="text-sm font-bold text-white font-mono">
                    {activeStore.currencySymbol}{cartTotal.toFixed(2)}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsCartOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
              >
                <span>View Order &amp; Place</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cart Modal / Checkout Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Review Your Table Order</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 flex justify-between">
              <span>Location: <strong>{activeStore.name}</strong></span>
              <span className="font-mono text-indigo-400 font-bold">{tableNumber}</span>
            </div>

            {/* Cart Items */}
            <div className="space-y-2 max-h-60 overflow-y-auto divide-y divide-slate-800/60">
              {cart.map(({ item, quantity }) => (
                <div key={item.id} className="pt-2 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-semibold text-white">{item.name}</div>
                    <div className="text-slate-400 font-mono">
                      {quantity} &times; ${item.sellingPrice.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center text-white"
                    >
                      -
                    </button>
                    <span className="font-bold text-white font-mono">{quantity}</span>
                    <button
                      onClick={() => addToCart(item)}
                      disabled={quantity >= item.stockQty}
                      className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center text-white disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-sm">
              <span className="text-slate-400 font-medium">Order Total:</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {activeStore.currencySymbol}{cartTotal.toFixed(2)}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Items will be sent directly to the kitchen dispatch. ERP Inventory is synchronized automatically.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsCartOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Back to Menu
              </button>
              <button
                onClick={handleCheckout}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
              >
                Confirm &amp; Send Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
