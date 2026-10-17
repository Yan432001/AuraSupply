import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dropdown } from 'antd';
import {
  ArrowLeftOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  ShoppingCartOutlined,
  DownOutlined,
  CheckOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useHeaderHeight } from '../../hooks/useHeaderHeight';
import { useLanguage, useTranslation, SUPPORTED_LANGUAGES } from '../../contexts/LanguageContext';

/**
 * Universal Shared Sticky Header for Telegram Mini App & E-Menu Pages
 * - Compact height: 48-52px
 * - Position: sticky, top: 0
 * - Solid background (no content bleed-through)
 * - Layering: z-index 1000
 * - Mobile safe area support: padding-top: env(safe-area-inset-top)
 */
export default function EMenuHeader({
  store,
  storeName,
  tableNumber,
  diningMode,
  onLocationClick,
  viewMode,
  onToggleViewMode,
  cartCount = 0,
  onCartClick,
  showBack = false,
  onBack,
  title,
  subtitle,
  rightActions,
  className = '',
}) {
  const navigate = useNavigate();
  const { headerRef } = useHeaderHeight();
  const { currentLanguage, setLanguage } = useLanguage();
  const { t } = useTranslation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const displayName = title || store?.name || storeName || 'Aura E-Menu';
  const displayLocation = subtitle || (customerLocationText(tableNumber, diningMode));

  function customerLocationText(table, mode) {
    if (table && mode) return `${table} • ${mode}`;
    if (table) return String(table);
    if (mode) return String(mode);
    return t('dine_in_table', 'Dine-In • Table');
  }

  return (
    <header
      ref={headerRef}
      className={`header app-sticky-header ${className}`}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'var(--tg-theme-bg-color, #ffffff)',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 6px)',
        paddingBottom: '8px',
        paddingLeft: '12px',
        paddingRight: '12px',
        minHeight: 'var(--header-height, 52px)',
        borderBottom: '1px solid var(--tg-theme-secondary-bg-color, #e2e8f0)',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Left side: Back button OR Store Avatar & Name */}
      <div className="flex items-center gap-2.5 min-w-0">
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] hover:opacity-90 flex items-center justify-center text-[var(--tg-theme-text-color,#334155)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] cursor-pointer active:scale-95 transition shrink-0"
            aria-label="Go Back"
          >
            <ArrowLeftOutlined style={{ fontSize: 14 }} />
          </button>
        )}

        {store?.logo && (
          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] shrink-0">
            <img
              src={store.logo}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        <div
          onClick={onLocationClick}
          className={`${onLocationClick ? 'cursor-pointer active:opacity-80' : ''} min-w-0 select-none`}
        >
          <h1 className="font-bold text-[length:var(--font-title)] text-[var(--tg-theme-text-color,#0f172a)] tracking-tight leading-tight truncate">
            {displayName}
          </h1>
          {displayLocation && (
            <p className="text-[length:var(--font-small)] font-medium text-[var(--tg-theme-hint-color,#64748b)] flex items-center gap-1 pt-0.5 truncate">
              <span>{displayLocation}</span>
              {onLocationClick && (
                <span className="text-[10px] bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] text-[var(--tg-theme-button-color,#2F6FED)] px-1 py-0.5 rounded font-bold inline-flex items-center gap-0.5 shrink-0 border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)]">
                  <span>{t('switch', 'Switch')}</span>
                  <DownOutlined style={{ fontSize: 6 }} />
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Right side: Actions / View Switcher / Language / Cart */}
      <div className="flex items-center gap-2 shrink-0">
        {rightActions}

        {/* Multi-language Selector Pill */}
        <Dropdown
          menu={{
            items: SUPPORTED_LANGUAGES.map((lang) => ({
              key: lang.code,
              onClick: () => setLanguage(lang.code),
              label: (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 125, padding: '2px 0' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{lang.flag}</span>
                    <span style={{ fontWeight: currentLanguage === lang.code ? 700 : 400 }}>{lang.native}</span>
                  </span>
                  {currentLanguage === lang.code && <CheckOutlined style={{ color: '#2F6FED', fontSize: 12 }} />}
                </div>
              ),
            })),
            selectedKeys: [currentLanguage],
          }}
          trigger={['click']}
          placement="bottomRight"
        >
          <button
            type="button"
            aria-label="Change Language"
            className="h-9 px-2.5 rounded-xl bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] hover:opacity-90 text-[var(--tg-theme-text-color,#334155)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] flex items-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 transition shrink-0"
          >
            <span>{SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage)?.flag || '🌐'}</span>
            <span className="uppercase text-[11px] font-bold text-slate-700">
              {SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage)?.iso || currentLanguage}
            </span>
          </button>
        </Dropdown>

        {onToggleViewMode && (
          <button
            type="button"
            onClick={onToggleViewMode}
            aria-label={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
            className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] hover:opacity-90 text-[var(--tg-theme-text-color,#334155)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] flex items-center justify-center text-sm cursor-pointer active:scale-95 transition"
          >
            {viewMode === 'grid' ? <UnorderedListOutlined /> : <AppstoreOutlined />}
          </button>
        )}

        {onCartClick && (
          <button
            type="button"
            onClick={onCartClick}
            className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[var(--tg-theme-button-color,#2F6FED)] text-[var(--tg-theme-button-text-color,#ffffff)] font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
          >
            <ShoppingCartOutlined style={{ fontSize: 14 }} />
            <span>{t('basket', 'Basket')}</span>
            <span className="bg-white text-[var(--tg-theme-button-color,#2F6FED)] px-1.5 py-0.2 rounded-full text-[11px] font-black">
              {cartCount}
            </span>
          </button>
        )}
      </div>
    </header>
  );
}
