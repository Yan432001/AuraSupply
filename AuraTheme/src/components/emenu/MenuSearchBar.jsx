import React, { useRef } from 'react';
import { SearchOutlined, CloseCircleFilled } from '@ant-design/icons';

/**
 * HighlightMatch
 * Highlights the matched search query substring within product name
 */
export function HighlightMatch({ text = '', query = '' }) {
  if (!text) return null;
  if (!query || !query.trim()) {
    return <span>{text}</span>;
  }

  const q = query.trim().toLowerCase();
  const lowerText = text.toLowerCase();
  const index = lowerText.indexOf(q);

  if (index === -1) {
    return <span>{text}</span>;
  }

  const before = text.substring(0, index);
  const match = text.substring(index, index + q.length);
  const after = text.substring(index + q.length);

  return (
    <span>
      {before}
      <span className="bg-amber-200/90 text-slate-900 rounded-xs px-0.5 font-black underline decoration-amber-400">
        {match}
      </span>
      {after}
    </span>
  );
}

/**
 * MenuSearchBar
 * Fast, real-time search component at the top of the menu page
 * that filters products by name with instant feedback and matching highlights.
 */
export default function MenuSearchBar({
  value = '',
  onChange,
  onClear,
  placeholder = 'Search products by name...',
  totalMatches,
  totalItems,
  accentColor = '#2F6FED',
  className = '',
  quickTags = ['Latte', 'Croissant', 'Sourdough', 'Matcha', 'Espresso'],
  showQuickTags = false,
  variant = 'auto', // 'auto' | 'website' | 'tma'
}) {
  const inputRef = useRef(null);

  const handleClear = () => {
    onChange?.('');
    onClear?.();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  const handleSelectTag = (tag) => {
    if (value.toLowerCase() === tag.toLowerCase()) {
      handleClear();
    } else {
      onChange?.(tag);
      inputRef.current?.focus();
    }
  };

  const isSearching = Boolean(value && value.trim().length > 0);
  const isWebsite = variant === 'website' || accentColor === '#A31D1D';

  return (
    <div className={`w-full ${className}`}>
      <div className="relative flex items-center w-full group">
        {/* Search Icon */}
        <div
          className={`absolute left-3.5 sm:left-4 pointer-events-none flex items-center justify-center transition-colors ${
            isWebsite ? 'text-slate-400 group-focus-within:text-[#A31D1D]' : 'text-slate-400'
          }`}
        >
          <SearchOutlined className={isWebsite ? 'text-lg' : 'text-base sm:text-lg'} />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search menu products by name"
          autoComplete="off"
          spellCheck="false"
          className={
            isWebsite
              ? 'w-full pl-11 pr-20 h-11 text-sm sm:text-base rounded-2xl border border-slate-200/90 bg-white focus:bg-white text-slate-800 placeholder:text-slate-400 font-medium shadow-xs outline-none transition-all duration-200 focus:border-[#A31D1D] focus:ring-3 focus:ring-[#A31D1D]/15'
              : 'w-full pl-8 pr-16 h-9 text-[length:var(--font-base)] rounded-xl border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] focus:bg-[var(--tg-theme-bg-color,#ffffff)] text-[var(--tg-theme-text-color,#0f172a)] placeholder:text-[var(--tg-theme-hint-color,#94a3b8)] font-medium shadow-2xs outline-none transition-all duration-150 focus:border-[var(--tg-theme-button-color,#2F6FED)] focus:ring-1 focus:ring-[var(--tg-theme-button-color,#2F6FED)]/20'
          }
          style={
            !isWebsite
              ? {
                  '--accent-color': accentColor || 'var(--tg-theme-button-color, #2F6FED)',
                }
              : undefined
          }
        />

        {/* Right Actions: Result Pill & Clear Button */}
        <div className="absolute right-2 flex items-center gap-1.5">
          {isSearching && (
            <>
              {/* Match count badge */}
              <span
                className={
                  isWebsite
                    ? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200'
                    : 'inline-flex items-center px-1.5 py-0.5 rounded-full text-[9.5px] font-bold bg-[var(--tg-theme-bg-color,#ffffff)] text-[var(--tg-theme-hint-color,#64748b)] border border-[var(--tg-theme-secondary-bg-color,#cbd5e1)]'
                }
              >
                {totalMatches !== undefined ? `${totalMatches} found` : '...'}
              </span>

              {/* Clear (X) button */}
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear search input"
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 active:scale-90 transition-transform cursor-pointer"
                title="Clear search (Esc)"
              >
                <CloseCircleFilled className={isWebsite ? 'text-sm text-slate-400 hover:text-slate-600' : 'text-xs'} />
              </button>
            </>
          )}

          {!isSearching && totalItems !== undefined && (
            <span
              className={
                isWebsite
                  ? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-slate-400 mr-1'
                  : 'inline-flex items-center px-1.5 py-0.5 rounded-full text-[9.5px] font-semibold text-[var(--tg-theme-hint-color,#94a3b8)] mr-1.5'
              }
            >
              {totalItems} items
            </span>
          )}
        </div>
      </div>

      {/* Quick Search Tag Suggestions (Matches image.png concept) */}
      {showQuickTags && quickTags && quickTags.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto scrollbar-none pb-1">
          <span
            className={
              isWebsite
                ? 'text-xs uppercase font-black text-slate-400 tracking-wider shrink-0 mr-1'
                : 'text-[10px] uppercase font-bold text-[var(--tg-theme-hint-color,#94a3b8)] tracking-wider shrink-0 mr-0.5'
            }
          >
            QUICK:
          </span>
          {quickTags.map((tag) => {
            const isTagActive = value.trim().toLowerCase() === tag.trim().toLowerCase();
            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleSelectTag(tag)}
                className={
                  isWebsite
                    ? `text-xs px-3 py-1 rounded-full transition-all duration-150 font-bold whitespace-nowrap cursor-pointer shrink-0 active:scale-95 shadow-2xs ${
                        isTagActive
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 hover:border-slate-300'
                      }`
                    : 'text-[11px] px-2.5 py-1 rounded-lg bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] hover:opacity-90 text-[var(--tg-theme-text-color,#334155)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] transition-colors font-medium whitespace-nowrap cursor-pointer shrink-0 min-h-[28px] active:scale-95'
                }
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
