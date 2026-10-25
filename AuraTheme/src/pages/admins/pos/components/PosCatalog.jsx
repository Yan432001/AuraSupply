import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Input,
  Button,
  Tag,
  Tooltip,
  Badge,
  Spin,
  Empty,
  Segmented,
} from 'antd';
import {
  SearchOutlined,
  BarcodeOutlined,
  AppstoreOutlined,
  BarsOutlined,
  PlusOutlined,
  PlusCircleOutlined,
  InboxOutlined,
  PictureOutlined,
  LeftOutlined,
  RightOutlined,
  ThunderboltFilled,
  CheckCircleFilled,
} from '@ant-design/icons';

// Helper to assign vibrant emojis based on category name
const getCategoryEmoji = (name = '') => {
  const n = String(name).toLowerCase();
  if (!n || n === 'all' || n.includes('all')) return '🌟';
  if (n.includes('coffee') || n.includes('cafe')) return '☕';
  if (n.includes('tea') || n.includes('boba')) return '🧋';
  if (n.includes('drink') || n.includes('beverage') || n.includes('water') || n.includes('juice') || n.includes('soda')) return '🥤';
  if (n.includes('bakery') || n.includes('bread') || n.includes('cake') || n.includes('pastry')) return '🥐';
  if (n.includes('food') || n.includes('meal') || n.includes('dish') || n.includes('rice') || n.includes('noodle')) return '🍜';
  if (n.includes('burger') || n.includes('fast food')) return '🍔';
  if (n.includes('pizza')) return '🍕';
  if (n.includes('snack') || n.includes('chip') || n.includes('candy')) return '🍿';
  if (n.includes('beer') || n.includes('alcohol') || n.includes('wine') || n.includes('liquor')) return '🍺';
  if (n.includes('pharma') || n.includes('medicine') || n.includes('drug') || n.includes('health') || n.includes('pill')) return '💊';
  if (n.includes('beauty') || n.includes('cosmetic') || n.includes('skin') || n.includes('care')) return '💄';
  if (n.includes('phone') || n.includes('tech') || n.includes('electronic') || n.includes('digital') || n.includes('computer')) return '📱';
  if (n.includes('cloth') || n.includes('fashion') || n.includes('wear') || n.includes('shirt') || n.includes('apparel')) return '👕';
  if (n.includes('shoe') || n.includes('footwear')) return '👟';
  if (n.includes('grocery') || n.includes('market') || n.includes('super')) return '🛒';
  if (n.includes('fruit') || n.includes('fresh') || n.includes('veg')) return '🍎';
  if (n.includes('book') || n.includes('stationery') || n.includes('paper')) return '📚';
  return '🏷️';
};

const PosCatalog = ({
  products,
  categories,
  selectedCategory,
  setSelectedCategory,
  searchProductKeyword,
  setSearchProductKeyword,
  searchInputRef,
  onBarcodeScanSubmit,
  onAddToCart,
  loadingProducts,
  onOpenManualAddProduct,
  catalogViewMode = 'grid',
  setCatalogViewMode,
  khrExchangeRate = 4200,
  allowOverselling = false,
  themeMode,
  adminTheme,
  t,
}) => {
  const isDark = false; // Always enforce clean, beautiful website light theme
  const categoryScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Deduplicate products defensively by unique id or code
  const uniqueProducts = React.useMemo(() => {
    const seen = new Set();
    const list = [];
    for (const p of products || []) {
      const key = p.id ?? p.code;
      if (!seen.has(key)) {
        seen.add(key);
        list.push(p);
      }
    }
    return list;
  }, [products]);

  // Check category track scrollability
  const checkCategoryScroll = useCallback(() => {
    const el = categoryScrollRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 6);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 6);
    }
  }, []);

  useEffect(() => {
    checkCategoryScroll();
    window.addEventListener('resize', checkCategoryScroll);
    return () => window.removeEventListener('resize', checkCategoryScroll);
  }, [categories, uniqueProducts, checkCategoryScroll]);

  const handleCategoryScroll = (distance) => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({ left: distance, behavior: 'smooth' });
      setTimeout(checkCategoryScroll, 200);
    }
  };

  // Filter products by selected category and search keyword
  const filteredProducts = uniqueProducts.filter((p) => {
    const matchCategory =
      !selectedCategory ||
      selectedCategory === 'all' ||
      String(p.category_id) === String(selectedCategory) ||
      (p.category_name && p.category_name.toLowerCase() === String(selectedCategory).toLowerCase());

    const keyword = searchProductKeyword.trim().toLowerCase();
    const matchKeyword =
      !keyword ||
      (p.name && p.name.toLowerCase().includes(keyword)) ||
      (p.code && p.code.toLowerCase().includes(keyword)) ||
      (p.barcode && p.barcode.toLowerCase().includes(keyword));

    return matchCategory && matchKeyword;
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: isDark ? '#090d16' : '#f8fafc',
      }}
    >
      {/* 1. TOP SEARCH & SCANNER TOOLBAR */}
      <div
        style={{
          padding: '12px 16px',
          background: isDark ? '#0f172a' : '#ffffff',
          borderBottom: `1px solid ${isDark ? 'rgba(51, 65, 85, 0.4)' : '#e2e8f0'}`,
          display: 'flex',
          gap: 10,
          alignItems: 'center',
        }}
      >
        {/* Barcode & Search Combined Input */}
        <Input
          ref={searchInputRef}
          size="large"
          prefix={<BarcodeOutlined style={{ color: '#2F6FED', fontSize: 18, marginRight: 4 }} />}
          suffix={
            <Tooltip title="Press F2 to focus scanner">
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: 6,
                  background: isDark ? '#334155' : 'rgba(47, 111, 237, 0.08)',
                  color: isDark ? '#94a3b8' : '#2F6FED',
                }}
              >
                F2
              </span>
            </Tooltip>
          }
          placeholder="Scan barcode or type product name/code (Enter to add)..."
          value={searchProductKeyword}
          onChange={(e) => setSearchProductKeyword(e.target.value)}
          onPressEnter={onBarcodeScanSubmit}
          allowClear
          style={{
            borderRadius: 12,
            background: isDark ? '#1e293b' : '#f8fafc',
            borderColor: isDark ? '#334155' : '#cbd5e1',
          }}
        />

        {/* 1-Click Manual Add Item (F3) */}
        <Tooltip title="Manually Add Custom Item (F3)">
          <Button
            icon={<PlusCircleOutlined />}
            onClick={onOpenManualAddProduct}
            size="large"
            style={{
              borderRadius: 12,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Custom Item
          </Button>
        </Tooltip>

        {/* Grid vs List View Mode Toggle */}
        {setCatalogViewMode && (
          <Segmented
            value={catalogViewMode}
            onChange={setCatalogViewMode}
            options={[
              { value: 'grid', icon: <AppstoreOutlined /> },
              { value: 'list', icon: <BarsOutlined /> },
            ]}
            style={{
              background: isDark ? '#1e293b' : '#f1f5f9',
            }}
          />
        )}
      </div>

      {/* 2. CATEGORY PILL SCROLLBAR WITH SMOOTH SCROLL FUNCTION */}
      <div
        style={{
          position: 'relative',
          background: isDark ? 'rgba(15, 23, 42, 0.5)' : '#ffffff',
          borderBottom: `1px solid ${isDark ? 'rgba(51, 65, 85, 0.3)' : '#f1f5f9'}`,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Scroll Left Button */}
        {canScrollLeft && (
          <Button
            shape="circle"
            size="small"
            icon={<LeftOutlined style={{ fontSize: 11 }} />}
            onClick={() => handleCategoryScroll(-240)}
            style={{
              position: 'absolute',
              left: 6,
              zIndex: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
              background: isDark ? '#1e293b' : '#ffffff',
              borderColor: isDark ? '#334155' : '#cbd5e1',
            }}
          />
        )}

        {/* Horizontal Category Scroll Track */}
        <div
          ref={categoryScrollRef}
          onScroll={checkCategoryScroll}
          onWheel={(e) => {
            if (e.deltaY !== 0) {
              e.currentTarget.scrollLeft += e.deltaY;
              checkCategoryScroll();
            }
          }}
          style={{
            padding: '10px 16px',
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            scrollBehavior: 'smooth',
            width: '100%',
          }}
        >
          <button
            type="button"
            className={`pos-category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              border: selectedCategory === 'all' ? 'none' : '1px solid rgba(226, 232, 240, 0.85)',
              background: selectedCategory === 'all' ? 'linear-gradient(135deg, #2F6FED, #5B8DEF)' : isDark ? '#1e293b' : '#ffffff',
              color: selectedCategory === 'all' ? '#ffffff' : isDark ? '#cbd5e1' : '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              flexShrink: 0,
            }}
          >
            <span>🌟 All Items</span>
            <span
              style={{
                fontSize: 10.5,
                padding: '1px 6px',
                borderRadius: 10,
                background: selectedCategory === 'all' ? 'rgba(255,255,255,0.28)' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(47, 111, 237, 0.08)',
                color: selectedCategory === 'all' ? '#ffffff' : '#2F6FED',
                fontWeight: 800,
              }}
            >
              {uniqueProducts.length}
            </span>
          </button>

          {categories
            .filter((cat) => cat.id !== 'all' && cat.name?.toLowerCase() !== 'all items')
            .map((cat) => {
              const isSelected = String(selectedCategory) === String(cat.id);
              const count = uniqueProducts.filter(
                (p) => String(p.category_id) === String(cat.id) || (p.category_name && p.category_name.toLowerCase() === cat.name?.toLowerCase())
              ).length;
              const emoji = getCategoryEmoji(cat.name);

              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`pos-category-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: isSelected ? 'none' : '1px solid rgba(226, 232, 240, 0.85)',
                    background: isSelected ? 'linear-gradient(135deg, #2F6FED, #5B8DEF)' : isDark ? '#1e293b' : '#ffffff',
                    color: isSelected ? '#ffffff' : isDark ? '#cbd5e1' : '#475569',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    flexShrink: 0,
                  }}
                >
                  <span>{emoji} {cat.name}</span>
                  <span
                    style={{
                      fontSize: 10.5,
                      padding: '1px 6px',
                      borderRadius: 10,
                      background: isSelected ? 'rgba(255,255,255,0.28)' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(47, 111, 237, 0.08)',
                      color: isSelected ? '#ffffff' : '#2F6FED',
                      fontWeight: 800,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
        </div>

        {/* Scroll Right Button */}
        {canScrollRight && (
          <Button
            shape="circle"
            size="small"
            icon={<RightOutlined style={{ fontSize: 11 }} />}
            onClick={() => handleCategoryScroll(240)}
            style={{
              position: 'absolute',
              right: 6,
              zIndex: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
              background: isDark ? '#1e293b' : '#ffffff',
              borderColor: isDark ? '#334155' : '#cbd5e1',
            }}
          />
        )}
      </div>

      {/* 3. PRODUCT CATALOG GRID / LIST */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
        }}
      >
        {loadingProducts ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <Spin size="large" />
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Loading catalog...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Empty
              description="No products found in this category"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : catalogViewMode === 'list' ? (
          /* Enlarged, Spacious, Informative List Mode */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredProducts.map((p) => {
              const qty = parseFloat(p.quantity ?? 0);
              const isServiceOrDigital = p.type === 'service' || p.type === 'digital';
              const canOversell = Boolean(allowOverselling || p.can_oversell || isServiceOrDigital);
              const hasNoStock = qty <= 0;
              const isBlocked = hasNoStock && !canOversell;
              const isLowStock = !hasNoStock && qty < 10;
              const khrPrice = Math.round((parseFloat(p.price) || 0) * khrExchangeRate);
              const fallbackEmoji = getCategoryEmoji(p.category_name);

              return (
                <div
                  key={p.id}
                  onClick={() => !isBlocked && onAddToCart(p)}
                  className={`pos-press ${!isBlocked ? 'pos-product-card' : ''}`}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 14,
                    background: isDark ? '#0f172a' : '#ffffff',
                    border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: isBlocked ? 'not-allowed' : 'pointer',
                    opacity: isBlocked ? 0.45 : 1,
                    transition: 'all 0.18s ease',
                    boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.02)',
                  }}
                >
                  {/* Left Column: Larger 56px Thumbnail & Rich Product Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0, paddingRight: 12 }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        minWidth: 56,
                        borderRadius: 12,
                        background: isDark ? '#1e293b' : '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 26,
                        overflow: 'hidden',
                        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                      }}
                    >
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="pos-card-img"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span>{fallbackEmoji}</span>
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14.5,
                          fontWeight: 700,
                          color: isDark ? '#f8fafc' : '#0f172a',
                          lineHeight: 1.3,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {p.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>{p.code}</span>
                        {p.category_name && (
                          <Tag style={{ fontSize: 11, borderRadius: 6, margin: 0, padding: '0 7px', background: isDark ? '#1e293b' : '#f1f5f9' }}>
                            {p.category_name}
                          </Tag>
                        )}
                        {p.unit_name && (
                          <Tag color="cyan" style={{ fontSize: 11, borderRadius: 6, margin: 0, padding: '0 7px' }}>
                            Unit: {p.unit_name}
                          </Tag>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: In-Stock Tag, Large Price, + Add Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 20,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        background: isBlocked
                          ? 'rgba(239, 68, 68, 0.12)'
                          : isServiceOrDigital
                          ? 'rgba(99, 102, 241, 0.12)'
                          : hasNoStock
                          ? 'rgba(245, 158, 11, 0.12)'
                          : isLowStock
                          ? 'rgba(245, 158, 11, 0.12)'
                          : 'rgba(16, 185, 129, 0.12)',
                        color: isBlocked
                          ? '#ef4444'
                          : isServiceOrDigital
                          ? '#4f46e5'
                          : hasNoStock
                          ? '#d97706'
                          : isLowStock
                          ? '#d97706'
                          : '#059669',
                        border: `1px solid ${
                          isBlocked
                            ? '#fca5a5'
                            : isServiceOrDigital
                            ? '#c7d2fe'
                            : hasNoStock
                            ? '#fcd34d'
                            : isLowStock
                            ? '#fcd34d'
                            : '#86efac'
                        }`,
                      }}
                    >
                      <span
                        className={!isBlocked && !hasNoStock && !isLowStock ? 'pos-pulse-dot' : ''}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: isBlocked
                            ? '#ef4444'
                            : isServiceOrDigital
                            ? '#4f46e5'
                            : hasNoStock
                            ? '#d97706'
                            : isLowStock
                            ? '#d97706'
                            : '#10b981',
                        }}
                      />
                      {isBlocked
                        ? 'Sold Out'
                        : isServiceOrDigital
                        ? 'Service'
                        : hasNoStock
                        ? `${qty} (Oversell)`
                        : isLowStock
                        ? `⚡ ${qty} left`
                        : `${qty} in stock`}
                    </span>

                    <div style={{ textAlign: 'right', minWidth: 85 }}>
                      <div style={{ fontSize: 17, fontWeight: 900, color: '#2F6FED' }}>${parseFloat(p.price || 0).toFixed(2)}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>៛{khrPrice.toLocaleString()}</div>
                    </div>

                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      disabled={isBlocked}
                      className="pos-add-btn"
                      style={{
                        background: 'linear-gradient(135deg, #2F6FED 0%, #5B8DEF 100%)',
                        border: 'none',
                        borderRadius: 10,
                        fontWeight: 700,
                        height: 38,
                        padding: '0 14px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        boxShadow: '0 3px 10px rgba(47, 111, 237, 0.28)',
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Grid Mode - Creative Tactile Product Cards */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 14,
            }}
          >
            {filteredProducts.map((p) => {
              const qty = parseFloat(p.quantity ?? 0);
              const isServiceOrDigital = p.type === 'service' || p.type === 'digital';
              const canOversell = Boolean(allowOverselling || p.can_oversell || isServiceOrDigital);
              const hasNoStock = qty <= 0;
              const isBlocked = hasNoStock && !canOversell;
              const isLowStock = !hasNoStock && qty < 10;
              const khrPrice = Math.round((parseFloat(p.price) || 0) * khrExchangeRate);
              const fallbackEmoji = getCategoryEmoji(p.category_name);

              return (
                <div
                  key={p.id}
                  onClick={() => !isBlocked && onAddToCart(p)}
                  className={`pos-press ${!isBlocked ? 'pos-product-card' : ''}`}
                  style={{
                    borderRadius: 16,
                    background: isDark ? '#0f172a' : '#ffffff',
                    border: `1px solid ${isDark ? 'rgba(51, 65, 85, 0.4)' : '#e2e8f0'}`,
                    padding: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: isBlocked ? 'not-allowed' : 'pointer',
                    opacity: isBlocked ? 0.45 : 1,
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.03)',
                  }}
                >
                  {/* Stock Level Badge */}
                  <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: 12,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: isBlocked
                          ? 'rgba(239, 68, 68, 0.15)'
                          : isServiceOrDigital
                          ? 'rgba(99, 102, 241, 0.15)'
                          : hasNoStock
                          ? 'rgba(245, 158, 11, 0.15)'
                          : isLowStock
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'rgba(16, 185, 129, 0.15)',
                        color: isBlocked
                          ? '#ef4444'
                          : isServiceOrDigital
                          ? '#4f46e5'
                          : hasNoStock
                          ? '#d97706'
                          : isLowStock
                          ? '#d97706'
                          : '#059669',
                        backdropFilter: 'blur(4px)',
                        border: `1px solid ${
                          isBlocked
                            ? '#fca5a5'
                            : isServiceOrDigital
                            ? '#c7d2fe'
                            : hasNoStock
                            ? '#fcd34d'
                            : isLowStock
                            ? '#fcd34d'
                            : '#86efac'
                        }`,
                      }}
                    >
                      <span
                        className={!isBlocked && !hasNoStock && !isLowStock ? 'pos-pulse-dot' : ''}
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          background: isBlocked
                            ? '#ef4444'
                            : isServiceOrDigital
                            ? '#4f46e5'
                            : hasNoStock
                            ? '#d97706'
                            : isLowStock
                            ? '#d97706'
                            : '#10b981',
                        }}
                      />
                      {isBlocked
                        ? 'Sold Out'
                        : isServiceOrDigital
                        ? 'Service'
                        : hasNoStock
                        ? `${qty}`
                        : isLowStock
                        ? `⚡ ${qty}`
                        : `${qty}`}
                    </span>
                  </div>

                  {/* Thumbnail Container */}
                  <div
                    style={{
                      height: 96,
                      borderRadius: 12,
                      background: isDark ? '#1e293b' : '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      marginBottom: 8,
                      border: `1px solid ${isDark ? '#334155' : '#f1f5f9'}`,
                    }}
                  >
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="pos-card-img"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: 36, opacity: 0.85 }}>{fallbackEmoji}</span>
                    )}
                  </div>

                  {/* Name and Code */}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: isDark ? '#f8fafc' : '#0f172a',
                        lineHeight: 1.25,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: 34,
                      }}
                      title={p.name}
                    >
                      {p.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginTop: 2 }}>
                      {p.code}
                    </div>
                  </div>

                  {/* Price Tag & Tactile + Add Button */}
                  <div
                    style={{
                      marginTop: 8,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                      paddingTop: 6,
                      borderTop: `1px dashed ${isDark ? '#1e293b' : '#f1f5f9'}`,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#2F6FED', lineHeight: 1 }}>
                        ${parseFloat(p.price || 0).toFixed(2)}
                      </div>
                      <div style={{ fontSize: 10.5, fontWeight: 600, color: '#94a3b8', marginTop: 2 }}>
                        ៛{khrPrice.toLocaleString()}
                      </div>
                    </div>

                    <div
                      className="pos-add-btn"
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 10,
                        background: 'linear-gradient(135deg, #2F6FED 0%, #5B8DEF 100%)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        boxShadow: '0 3px 10px rgba(47, 111, 237, 0.35)',
                        cursor: 'pointer',
                      }}
                    >
                      <PlusOutlined />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PosCatalog;
