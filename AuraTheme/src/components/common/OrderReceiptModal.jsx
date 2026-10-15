import React, { useRef } from 'react';
import { formatCurrency } from '../../utils/uiTheme';
import { exportSingleOrderPdf } from '../../utils/orderPdfExporter';

export default function OrderReceiptModal({ order, open, onClose, storeInfo }) {
  const receiptRef = useRef(null);

  if (!open || !order) return null;

  const storeName = order.store_name || storeInfo?.name || 'Aura Specialty Store';
  const storeAddress = storeInfo?.address || 'No. 128, Preah Norodom Blvd, Daun Penh, Phnom Penh';
  const storePhone = storeInfo?.phone || '+855 12 345 678';
  const orderRef = order.referenceNo || `ORD-${order.id}`;
  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleString() : new Date().toLocaleString();
  const orderType = (order.orderType || 'DINE_IN').toUpperCase();
  const customerName = order.customer?.name || 'Walk-in Guest';
  const customerPhone = order.customer?.phone || '';
  const customerAddress = order.customer?.address || '';

  const items = order.items || [];
  const rawSubtotal = Number(
    order.subtotal || items.reduce((s, it) => s + Number(it.subtotal || it.price * it.quantity || 0), 0)
  );
  
  // Calculate tax (10% VAT if not specified)
  const taxAmount = Number(order.tax || order.taxAmount || (rawSubtotal * 0.1));
  const deliveryFee = Number(order.deliveryFee || 0);
  const discount = Number(order.discount || 0);
  const grandTotal = Number(order.grandTotal || order.totalAmount || (rawSubtotal + taxAmount + deliveryFee - discount));

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    exportSingleOrderPdf(order, { storeName });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      {/* Print CSS Style Injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #aura-printable-receipt, #aura-printable-receipt * {
            visibility: visible !important;
          }
          #aura-printable-receipt {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 80mm !important;
            margin: 0 auto !important;
            padding: 10px !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-scaleUp">
        {/* Top Action Bar (hidden in print) */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-base">🧾</span>
            <span className="text-xs font-black uppercase tracking-wider">Official Order Receipt</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold transition-all"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Printable Receipt Paper Container */}
        <div id="aura-printable-receipt" ref={receiptRef} className="p-6 bg-white text-slate-900 font-sans text-xs space-y-4">
          {/* Header & Logo */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
            <div className="w-10 h-10 mx-auto rounded-full bg-orange-600 text-white font-black flex items-center justify-center text-lg shadow-sm">
              A
            </div>
            <h2 className="text-base font-black tracking-tight uppercase text-slate-900">{storeName}</h2>
            <p className="text-[11px] text-slate-500">{storeAddress}</p>
            <p className="text-[11px] text-slate-500">Tel: {storePhone}</p>
            <div className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono text-[10px] font-bold">
              VAT TIN: K008-9021-8392
            </div>
          </div>

          {/* Receipt Metadata */}
          <div className="grid grid-cols-2 gap-y-1 text-[11px] text-slate-600 pb-3 border-b border-dashed border-slate-300">
            <div>
              <span className="text-slate-400">Receipt No: </span>
              <span className="font-mono font-bold text-slate-900">{orderRef}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400">Type: </span>
              <span className="font-bold text-slate-900">{orderType}</span>
            </div>
            <div>
              <span className="text-slate-400">Date: </span>
              <span className="text-slate-800">{orderDate}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400">Status: </span>
              <span className="font-bold uppercase text-emerald-600">{order.status || 'Completed'}</span>
            </div>
            {customerName && (
              <div className="col-span-2 pt-1 border-t border-slate-100 mt-1">
                <span className="text-slate-400">Customer: </span>
                <span className="font-semibold text-slate-800">{customerName}</span>
                {customerPhone && <span className="text-slate-500"> ({customerPhone})</span>}
                {customerAddress && <span className="text-slate-400 text-[10px] block">📍 {customerAddress}</span>}
              </div>
            )}
          </div>

          {/* Itemized Table */}
          <div className="space-y-2">
            <div className="grid grid-cols-12 font-bold text-[10.5px] uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-200">
              <span className="col-span-6">Item / Description</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-2 text-right">Price</span>
              <span className="col-span-2 text-right">Total</span>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 text-[11px] text-slate-800 items-baseline">
                  <div className="col-span-6 pr-2">
                    <span className="font-semibold block">{item.name}</span>
                    {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                      <span className="text-[9.5px] text-slate-400 block">
                        {Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(' • ')}
                      </span>
                    )}
                  </div>
                  <span className="col-span-2 text-center font-mono font-medium">{item.quantity}</span>
                  <span className="col-span-2 text-right font-mono text-slate-600">${Number(item.price || 0).toFixed(2)}</span>
                  <span className="col-span-2 text-right font-mono font-bold">
                    ${Number(item.subtotal || item.quantity * item.price || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing & Tax Breakdown */}
          <div className="pt-3 border-t border-dashed border-slate-300 space-y-1.5 text-[11.5px]">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono">${rawSubtotal.toFixed(2)}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount / Voucher:</span>
                <span className="font-mono">-${discount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <div className="flex items-center gap-1">
                <span>Tax / VAT (10%):</span>
                <span className="text-[10px] text-slate-400 font-normal">State Invoicing</span>
              </div>
              <span className="font-mono">${taxAmount.toFixed(2)}</span>
            </div>

            {deliveryFee > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Delivery / Service Fee:</span>
                <span className="font-mono">${deliveryFee.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-black pt-2 border-t-2 border-slate-900 text-slate-900">
              <span className="uppercase tracking-wide">GRAND TOTAL:</span>
              <span className="font-mono text-base text-orange-600">${grandTotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-[10.5px] text-slate-500 pt-1">
              <span>Paid via: <b>{order.paymentMethod || 'KHQR Instant Pay'}</b></span>
              <span>Ref: #{orderRef.slice(-6)}</span>
            </div>
          </div>

          {/* Barcode Graphic & Footer Thank You */}
          <div className="pt-4 border-t border-dashed border-slate-300 text-center space-y-2">
            {/* Thermal Barcode Mock */}
            <div className="flex justify-center items-center gap-[2px] h-8 max-w-[200px] mx-auto opacity-75">
              {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 4, 1, 2, 3, 1, 4, 2, 3, 1, 2, 4, 1].map((w, i) => (
                <div key={i} className="bg-slate-900 h-full" style={{ width: `${w * 1.5}px` }} />
              ))}
            </div>
            <p className="font-mono text-[9.5px] text-slate-400 tracking-widest">{orderRef}</p>
            <p className="text-[11px] font-bold text-slate-700">Thank you for dining with us!</p>
            <p className="text-[9.5px] text-slate-400">Please retain this receipt for warranty and claims.</p>
          </div>
        </div>

        {/* Modal Footer Action Buttons (hidden in print) */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <span>🖨️</span>
            <span>Print Receipt</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <span>📄</span>
            <span>PDF</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs active:scale-95 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
