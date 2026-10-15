import React from 'react';
import { Outlet } from 'react-router-dom';
import OfflineWarningBanner from '../../components/common/OfflineWarningBanner';
import { publicTheme } from '../../utils/webTheme';

export default function EMenuLayout() {
  return (
    <div
      style={{
        background: 'var(--tg-theme-bg-color, #ffffff)',
        color: 'var(--tg-theme-text-color, #0f172a)',
        minHeight: '100vh',
      }}
      className="w-full font-sans flex flex-col antialiased selection:bg-[var(--tg-theme-button-color,#2F6FED)] selection:text-white"
    >
      <OfflineWarningBanner />
      <main className="w-full flex-1 flex flex-col items-center justify-start">
        <Outlet />
      </main>
    </div>
  );
}
