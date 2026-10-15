import React from 'react';

export default function StoreNotFoundPage() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center p-6 text-center space-y-3">
      <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center text-2xl font-bold">
        ✕
      </div>
      <h1 className="text-lg font-bold">Store Not Found</h1>
      <p className="text-xs text-zinc-500 max-w-xs">
        The restaurant or store you are trying to access does not exist or has been disabled.
      </p>
    </div>
  );
}