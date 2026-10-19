import React from 'react';
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
} from '@ant-design/icons';

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
  themeMode,
  adminTheme,
  t,
}) => {
  const isDark = themeMode === 'dark';

  // Filter products by selected category and search keyword
  const filteredProducts = products.filter((p) => {
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
          prefix={<BarcodeOutlined style={{ color: '#2563eb', fontSize: 18, marginRight: 4 }} />}
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

      {/* 2. CATEGORY PILL SCROLLBAR */}
      <div
        style={{
          padding: '10px 16px',
          background: isDark ? 'rgba(15, 23, 42, 0.5)' : '#ffffff',
          borderBottom: `1px solid ${isDark ? 'rgba(51, 65, 85, 0.3)' : '#f1f5f9'}`,
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          scrollbarWidth: 'none',
        }}
      >
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            background: selectedCategory === 'all' ? '#2563eb' : isDark ? '#1e293b' : '#f1f5f9',
            color: selectedCategory === 'all' ? '#ffffff' : isDark ? '#cbd5e1' : '#475569',
            boxShadow: selectedCategory === 'all' ? '0 4px 12px rgba(37, 99, 235, 0.35)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          All Items ({products.length})
        </button>

        {categories.map((cat) => {
          const isSelected = String(selectedCategory) === String(cat.id);
          const count = products.filter(
            (p) => String(p.category_id) === String(cat.id) || (p.category_name && p.category_name.toLowerCase() === cat.name.toLowerCase())
          ).length;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                background: isSelected ? '#2563eb' : isDark ? '#1e293b' : '#f1f5f9',
                color: isSelected ? '#ffffff' : isDark ? '#cbd5e1' : '#475569',
                boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.35)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <span>{cat.name}</span>
              <span
                style={{
                  fontSize: 10,
                  padding: '1px 5px',
                  borderRadius: 10,
                  background: isSelected ? 'rgba(255,255,255,0.25)' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
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
          /* List Mode */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filteredProducts.map((p) => {
              const qty = parseFloat(p.quantity ?? 99);
              const isOutOfStock = qty <= 0;
              const khrPrice = Math.round((parseFloat(p.price) || 0) * khrExchangeRate);

              return (
                <div
                  key={p.id}
                  onClick={() => !isOutOfStock && onAddToCart(p)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: isDark ? '#0f172a' : '#ffffff',
                    border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                    opacity: isOutOfStock ? 0.5 : 1,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isOutOfStock) e.currentTarget.style.borderColor = '#2563eb';
                  }}
                  onMouseLeave={(e) => {
                    if (!isOutOfStock) e.currentTarget.style.borderColor = isDark ? '#1e293b' : '#e2e8f0';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 8,
                        background: isDark ? '#1e293b' : '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        color: '#94a3b8',
                        overflow: 'hidden',
                      }}
                    >
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <PictureOutlined />
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{p.code} • {p.category_name || 'Item'}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <Tag color={isOutOfStock ? 'default' : qty < 10 ? 'warning' : 'success'} style={{ borderRadius: 6, margin: 0 }}>
                      {isOutOfStock ? 'Out of Stock' : `${qty} left`}
                    </Tag>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#2563eb' }}>${parseFloat(p.price || 0).toFixed(2)}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>៛{khrPrice.toLocaleString()}</div>
                    </div>
                    <Button type="primary" size="small" shape="circle" icon={<PlusOutlined />} style={{ background: '#2563eb' }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Grid Mode */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 12,
            }}
          >
            {filteredProducts.map((p) => {
              const qty = parseFloat(p.quantity ?? 99);
              const isOutOfStock = qty <= 0;
              const khrPrice = Math.round((parseFloat(p.price) || 0) * khrExchangeRate);

              return (
                <div
                  key={p.id}
                  onClick={() => !isOutOfStock && onAddToCart(p)}
                  style={{
                    borderRadius: 14,
                    background: isDark ? '#0f172a' : '#ffffff',
                    border: `1px solid ${isDark ? 'rgba(51, 65, 85, 0.4)' : '#e2e8f0'}`,
                    padding: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                    opacity: isOutOfStock ? 0.45 : 1,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.03)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isOutOfStock) {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.borderColor = '#2563eb';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(37, 99, 235, 0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isOutOfStock) {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.borderColor = isDark ? 'rgba(51, 65, 85, 0.4)' : '#e2e8f0';
                      e.currentTarget.style.boxShadow = isDark ? '0 4px 12px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.03)';
                    }
                  }}
                >
                  {/* Stock Level Badge */}
                  <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 6,
                        background: isOutOfStock
                          ? 'rgba(239, 68, 68, 0.15)'
                          : qty < 10
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'rgba(16, 185, 129, 0.15)',
                        color: isOutOfStock ? '#ef4444' : qty < 10 ? '#f59e0b' : '#10b981',
                      }}
                    >
                      {isOutOfStock ? 'Out' : `${qty}`}
                    </span>
                  </div>

                  {/* Thumbnail */}
                  <div
                    style={{
                      height: 80,
                      borderRadius: 10,
                      background: isDark ? '#1e293b' : '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      marginBottom: 8,
                    }}
                  >
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: 28, opacity: 0.4 }}>📦</span>
                    )}
                  </div>

                  {/* Name and Code */}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: isDark ? '#f8fafc' : '#0f172a',
                        lineHeight: 1.25,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: 32,
                      }}
                      title={p.name}
                    >
                      {p.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginTop: 2 }}>
                      {p.code}
                    </div>
                  </div>

                  {/* Price Tag & Add Button */}
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
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#2563eb', lineHeight: 1 }}>
                        ${parseFloat(p.price || 0).toFixed(2)}
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', marginTop: 2 }}>
                        ៛{khrPrice.toLocaleString()}
                      </div>
                    </div>

                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 8,
                        background: '#2563eb',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        boxShadow: '0 2px 6px rgba(37, 99, 235, 0.4)',
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
