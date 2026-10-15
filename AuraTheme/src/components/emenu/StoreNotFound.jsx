import React from 'react';

export default function StoreNotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-2xl font-bold mb-3">
        !
      </div>
      <h2 className="text-lg font-bold mb-1">Store Not Found</h2>
      <p className="text-xs text-gray-500 max-w-[240px]">
        The requested e-menu does not exist or the link parameter is invalid.
      </p>
    </div>
  );
}