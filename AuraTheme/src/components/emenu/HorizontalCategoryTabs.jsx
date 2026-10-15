import React, { useRef } from 'react';
import { HeartFilled } from '@ant-design/icons';

/**
 * Helper to get domain-appropriate icon/emoji for food & retail categories
 */
export const getCategoryIcon = (categoryName = '') => {
  const lower = (categoryName || '').toLowerCase();
  if (lower.includes('drink') || lower.includes('beverage') || lower.includes('juice') || lower.includes('tea') || lower.includes('brew')) {
    return '🍹';
  }
  if (lower.includes('coffee') || lower.includes('espresso') || lower.includes('latte')) {
    return '☕';
  }
  if (lower.includes('main') || lower.includes('dinner') || lower.includes('lunch') || lower.includes('pasta') || lower.includes('steak') || lower.includes('burger') || lower.includes('pizza') || lower.includes('sandwich')) {
    return '🍽️';
  }
  if (lower.includes('dessert') || lower.includes('cake') || lower.includes('tart') || lower.includes('sweet') || lower.includes('chocolate') || lower.includes('ice cream')) {
    return '🍰';
  }
  if (lower.includes('bakery') || lower.includes('pastr') || lower.includes('croissant') || lower.includes('muffin') || lower.includes('bread') || lower.includes('sourdough') || lower.includes('roll')) {
    return '🥐';
  }
  if (lower.includes('breakfast') || lower.includes('brunch') || lower.includes('pancake') || lower.includes('omelet') || lower.includes('egg') || lower.includes('toast') || lower.includes('crepe')) {
    return '🍳';
  }
  if (lower.includes('phone') || lower.includes('mobile') || lower.includes('gadget') || lower.includes('charger') || lower.includes('earbud')) {
    return '📱';
  }
  if (lower.includes('computer') || lower.includes('laptop') || lower.includes('rig') || lower.includes('monitor') || lower.includes('keyboard')) {
    return '💻';
  }
  if (lower.includes('apparel') || lower.includes('fashion') || lower.includes('cloth') || lower.includes('denim') || lower.includes('jacket') || lower.includes('top')) {
    return '👕';
  }
  return '✨';
};

/**
 * HorizontalCategoryTabs
 * Refined horizontal category filter bar placed right below the search bar.
 * Supports smooth horizontal scrolling, active indicator states, category icons,
 * item counts, Favorites filter toggle, and responsive touch gestures.
 */
export default function HorizontalCategoryTabs({
  categories = [],
  activeCategory = null,
  onSelectCategory,
  totalItems = 0,
  showFavoritesTab = true,
  showFavoritesOnly = false,
  onToggleFavorites,
  favoritesCount = 0,
  accentColor = '#2F6FED',
  activeClassName = '',
  inactiveClassName = '',
  triggerHaptic,
  className = '',
}) {
  const containerRef = useRef(null);

  const handleSelectTab = (catIdOrName, event) => {
    triggerHaptic?.('light');
    onSelectCategory?.(catIdOrName);

    // Smoothly center the clicked tab in the horizontal scroll container
    if (event?.currentTarget) {
      event.currentTarget.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  };

  const handleToggleFavs = (event) => {
    triggerHaptic?.('light');
    onToggleFavorites?.();

    if (event?.currentTarget) {
      event.currentTarget.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  };

  // Determine if "All" is active (when neither favorites nor a category is selected)
  const isAllActive = !showFavoritesOnly && (activeCategory === null || activeCategory === 'all' || activeCategory === '');

  // Default active style if none provided via props
  const defaultActiveClasses = activeClassName ||
    'bg-gradient-to-r from-[#2F6FED] to-[#5B8DEF] text-white shadow-md shadow-[#2F6FED]/25 font-bold border-transparent';

  // Default inactive style
  const defaultInactiveClasses = inactiveClassName ||
    'bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 border border-slate-200/80 font-semibold';

  return (
    <nav
      role="tablist"
      aria-label="Filter products by category"
      className={`w-full overflow-hidden ${className}`}
    >
      <div
        ref={containerRef}
        className="flex items-center gap-2 overflow-x-auto scrollbar-none py-2 px-3 sm:px-4 select-none"
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* 1. All Items Tab */}
        <button
          type="button"
          role="tab"
          aria-selected={isAllActive}
          onClick={(e) => handleSelectTab(null, e)}
          className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer active:scale-95 shrink-0 flex items-center gap-1.5 ${
            isAllActive ? defaultActiveClasses : defaultInactiveClasses
          }`}
        >
          <span className="text-sm">🍽️</span>
          <span>All</span>
          {totalItems > 0 && (
            <span
              className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                isAllActive ? 'bg-white/20 text-white' : 'bg-slate-200/90 text-slate-600'
              }`}
            >
              {totalItems}
            </span>
          )}
        </button>

        {/* 2. Favorites Bookmark Filter Tab */}
        {showFavoritesTab && (
          <button
            type="button"
            role="tab"
            aria-selected={showFavoritesOnly}
            onClick={handleToggleFavs}
            className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap cursor-pointer active:scale-95 shrink-0 flex items-center gap-1.5 ${
              showFavoritesOnly
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25 border-transparent'
                : 'bg-rose-50/80 hover:bg-rose-100/90 text-rose-600 border border-rose-200/90'
            }`}
            title="Filter bookmarked favorites"
          >
            <HeartFilled className={showFavoritesOnly ? 'text-white' : 'text-rose-500'} />
            <span>Favorites</span>
            <span
              className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                showFavoritesOnly ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
              }`}
            >
              {favoritesCount}
            </span>
          </button>
        )}

        {/* 3. Category Tabs (Drinks, Mains, Desserts, etc.) */}
        {categories.map((cat) => {
          const catId = typeof cat === 'object' ? cat.id : cat;
          const catName = typeof cat === 'object' ? cat.name : cat;
          const catCount = typeof cat === 'object' ? cat.count : undefined;
          const catIcon = typeof cat === 'object' && cat.icon ? cat.icon : getCategoryIcon(catName);

          const isSelected =
            !showFavoritesOnly &&
            (activeCategory === catId ||
              String(activeCategory).toLowerCase() === String(catName).toLowerCase() ||
              (typeof catId === 'string' && typeof activeCategory === 'string' && activeCategory.toLowerCase() === catId.toLowerCase()));

          return (
            <button
              key={catId || catName}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={(e) => handleSelectTab(catId, e)}
              className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer active:scale-95 shrink-0 flex items-center gap-1.5 ${
                isSelected ? defaultActiveClasses : defaultInactiveClasses
              }`}
            >
              <span className="text-sm">{catIcon}</span>
              <span>{catName}</span>
              {catCount !== undefined && catCount > 0 && (
                <span
                  className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/90 text-slate-600'
                  }`}
                >
                  {catCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
