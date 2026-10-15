import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  ChefHat, 
  Send, 
  AlertCircle, 
  Table, 
  Smartphone, 
  Search, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { Order } from '../../types';

export const AdminOrdersManager: React.FC = () => {
  const { orders, updateOrderStatus, activeStore } = useERP();
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'preparing' | 'ready' | 'completed'>('all');

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === 'all') return true;
    return order.status === filterStatus;
  });

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            New Order
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse">
            <ChefHat className="w-3.5 h-3.5" />
            Kitchen Preparing
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Ready for Table / Pickup
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            Fulfilled
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <ChefHat className="w-3.5 h-3.5" />
                Live Order Dispatch &amp; Kitchen Display System (KDS)
              </span>
              <span className="text-xs text-slate-400">Store: {activeStore.name}</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
              Active Orders &amp; Fulfillment
            </h1>
            <p className="text-sm text-slate-300 mt-0.5">
              Incoming orders from guest Table E-Menu and Telegram Mini App. Inventory deductions are committed immediately upon placement.
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {(['all', 'pending', 'preparing', 'ready', 'completed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                  filterStatus === st
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {st} ({orders.filter(o => st === 'all' ? true : o.status === st).length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-white">
                      #{order.orderNumber}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                      {order.orderSource === 'Telegram Mini App' ? (
                        <>
                          <Send className="w-3 h-3 text-sky-400" />
                          Telegram
                        </>
                      ) : (
                        <>
                          <Smartphone className="w-3 h-3 text-emerald-400" />
                          Table QR
                        </>
                      )}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>{order.createdAt}</span>
                    <span>&bull;</span>
                    <span className="text-indigo-300 font-medium">
                      {order.tableNumber || 'Takeaway'}
                    </span>
                  </div>
                </div>

                <div>{getStatusBadge(order.status)}</div>
              </div>

              {/* Guest Details */}
              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80 text-xs text-slate-300 flex justify-between">
                <div>
                  <span className="text-slate-500">Guest: </span>
                  <span className="font-medium text-white">{order.customerName || 'Hospitality Guest'}</span>
                </div>
                {order.telegramUsername && (
                  <span className="text-sky-400 font-mono text-[11px]">{order.telegramUsername}</span>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-2 pt-1 border-t border-slate-800">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Ordered Items ({order.items.reduce((s, i) => s + i.quantity, 0)} items)
                </div>
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-indigo-500/20 text-indigo-400 font-mono font-bold text-[11px] flex items-center justify-center">
                        {item.quantity}x
                      </span>
                      <span className="text-slate-200 font-medium">{item.name}</span>
                    </div>
                    <span className="text-slate-400 font-mono">
                      ${(item.unitPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total and Kitchen Actions */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Total Order Amount</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  ${order.totalAmount.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {order.status === 'pending' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition"
                  >
                    Start Preparing
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'ready')}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition"
                  >
                    Mark Ready for Service
                  </button>
                )}
                {order.status === 'ready' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'completed')}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
                  >
                    Mark Fulfilled &amp; Closed
                  </button>
                )}
                {order.status === 'completed' && (
                  <div className="w-full text-center py-1.5 text-xs text-slate-500 font-medium">
                    Order Closed
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="col-span-full py-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <ClipboardList className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-300">No orders match this status</h3>
            <p className="text-xs text-slate-500">
              Orders placed by customers in the E-Menu or Telegram Mini App will show here in real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
