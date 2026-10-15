import React from 'react';
import { Link } from 'react-router-dom';

export default function StoreNotFound() {
  return (
    <div className="flex-1 min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto">
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 text-red-500 flex items-center justify-center text-2xl font-bold mb-3 shadow-inner">
        🏪
      </div>
      <h2 className="text-lg font-bold mb-1 text-slate-900 dark:text-white">Store Not Found</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
        The requested store e-menu does not exist or the link parameter was not recognized.
      </p>
      <div className="space-y-2 w-full">
        <Link
          to="/shop/sbc-store"
          className="w-full inline-block py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition"
        >
          ☕ Open Aura Specialty Coffee
        </Link>
        <Link
          to="/shop/aura-bakery"
          className="w-full inline-block py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs transition"
        >
          🥐 Open Aura Artisan Bakery
        </Link>
      </div>
    </div>
  );
}
