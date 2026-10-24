import React from 'react';
import {
  Space,
  Button,
  Input,
  Select,
  Tag,
  Tooltip,
  Divider,
  Avatar,
  Badge,
  Popover,
  Popconfirm,
} from 'antd';
import {
  UserOutlined,
  UserAddOutlined,
  DeleteOutlined,
  PlusOutlined,
  MinusOutlined,
  EditOutlined,
  CommentOutlined,
  PauseCircleOutlined,
  ClearOutlined,
  PrinterOutlined,
  CreditCardOutlined,
  TagOutlined,
  PercentageOutlined,
  CarOutlined,
  BarcodeOutlined,
  CheckCircleFilled,
  EnvironmentOutlined,
  SwapOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';

const PosCart = ({
  cart = [],
  updateItemQuantity,
  onUpdateCartItem,
  removeItemFromCart,
  clearCart,
  selectedCustomerId,
  setSelectedCustomerId,
  customers = [],
  onOpenQuickAddCustomer,
  onOpenViewCustomer,
  currentTable,
  setCurrentTable,
  tables = ['Takeaway / Walk-in', 'Table 1', 'Table 2', 'Table 3', 'Table 4', 'VIP Room 1', 'VIP Room 2'],
  heldOrders = [],
  resumeHeldOrder,
  onHoldOrder,
  onPrintBill,
  onOpenCheckout,
  onEditItem,
  onCommentItem,
  onOpenOrderDiscount,
  onOpenOrderTax,
  onOpenDeliveryFee,
  orderDiscountValue = 0,
  orderDiscountType = 'fixed',
  orderDiscountAmount = 0,
  productDiscountTotal = 0,
  orderTaxRate = 0,
  shippingFee = 0,
  grossSubtotal = 0,
  subtotal = 0,
  totalDiscount = 0,
  taxAmount = 0,
  grandTotal = 0,
  khrExchangeRate = 4200,
  thbExchangeRate = 36.5,
  themeMode,
  adminTheme,
  t,
}) => {
  const isDark = themeMode === 'dark';
  const totalKHR = Math.round(grandTotal * khrExchangeRate);
  const totalTHB = (grandTotal * thbExchangeRate).toFixed(2);
  const isOrderDiscountPercent = orderDiscountType === 'percent' || orderDiscountType === 'percentage';
  const orderDiscountPercentEquiv = subtotal > 0 ? ((orderDiscountAmount / subtotal) * 100).toFixed(0) : 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: isDark ? '#0f172a' : '#ffffff',
        borderLeft: `1px solid ${isDark ? 'rgba(51, 65, 85, 0.4)' : '#e2e8f0'}`,
      }}
    >
      {/* 1. TOP CONTROLS: Customer & Table / Order Type */}
      <div
        style={{
          padding: '12px 14px',
          borderBottom: `1px solid ${isDark ? 'rgba(51, 65, 85, 0.4)' : '#f1f5f9'}`,
          background: isDark ? 'rgba(15, 23, 42, 0.6)' : '#fafafa',
        }}
      >
        {/* Customer Selector & Quick Add */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <Select
            showSearch
            value={selectedCustomerId}
            onChange={setSelectedCustomerId}
            placeholder="Select or Search Customer"
            style={{ flex: 1 }}
            size="middle"
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={customers.map((c) => ({
              value: c.id,
              label: `${c.name} ${c.phone ? `(${c.phone})` : ''}`,
            }))}
          />

          <Tooltip title="Quick Add Customer (F2)">
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={onOpenQuickAddCustomer}
              style={{
                borderRadius: 8,
                background: '#2563eb',
                height: 36,
                padding: '0 12px',
              }}
            />
          </Tooltip>

          <Tooltip title="View Customer Profile & Loyalty Points">
            <Button
              icon={<UserOutlined />}
              onClick={onOpenViewCustomer}
              style={{
                borderRadius: 8,
                height: 36,
                padding: '0 10px',
              }}
            />
          </Tooltip>
        </div>

        {/* Table / Room Selector + Held Sales Tabs */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Select
            value={currentTable}
            onChange={setCurrentTable}
            style={{ width: 160 }}
            size="small"
            options={tables.map((tbl) => ({ value: tbl, label: `📍 ${tbl}` }))}
          />

          {/* Held Orders Quick Chips */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              paddingBottom: 2,
            }}
          >
            {heldOrders.length > 0 ? (
              heldOrders.map((h, idx) => (
                <Tag
                  key={h.id || idx}
                  color="warning"
                  onClick={() => resumeHeldOrder(h.id)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 700,
                    margin: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span>{h.reference || `Hold #${idx + 1}`}</span>
                  <span style={{ fontSize: 10, color: '#b45309' }}>(${parseFloat(h.total || 0).toFixed(2)})</span>
                </Tag>
              ))
            ) : (
              <span style={{ fontSize: 11, color: '#94a3b8' }}>No held sales</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. CART ITEMS LIST */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 12px',
        }}
      >
        {cart.length === 0 ? (
          <div
            style={{
              height: '100%',
              minHeight: 220,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: isDark ? 'rgba(30, 41, 59, 0.6)' : '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                color: '#cbd5e1',
              }}
            >
              🛒
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: isDark ? '#e2e8f0' : '#475569' }}>
              Cart is Empty
            </div>
            <div style={{ fontSize: 12, textAlign: 'center', maxWidth: 240, color: '#94a3b8' }}>
              Scan barcodes or tap products from the catalog on the left
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cart.map((item, index) => {
              const unitPrice = parseFloat(item.unit_price || 0);
              const qty = parseFloat(item.quantity || 1);
              const isItemPercent = item.discount_type === 'percent';
              const rawDiscountVal = parseFloat(item.discount_val !== undefined ? item.discount_val : (item.item_discount || 0)) || 0;
              const discountUnitUSD = isItemPercent
                ? (unitPrice * Math.min(100, Math.max(0, rawDiscountVal))) / 100
                : Math.min(unitPrice, Math.max(0, rawDiscountVal));
              const percentEquiv = unitPrice > 0 ? ((discountUnitUSD / unitPrice) * 100).toFixed(0) : 0;
              const netUnitPrice = Math.max(0, unitPrice - discountUnitUSD);
              const lineTotal = netUnitPrice * qty;

              // Calculate special instruction / comment count
              const commentCount = (() => {
                if (Array.isArray(item.comments) && item.comments.length > 0) return item.comments.length;
                const note = item.item_note || item.comment || '';
                if (!note.trim()) return 0;
                return note.split(/[,;\n]/).filter((s) => s.trim().length > 0).length || 1;
              })();

              return (
                <div
                  key={`${item.id}-${index}`}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 14,
                    background: isDark ? 'rgba(30, 41, 59, 0.6)' : '#ffffff',
                    border: `1px solid ${isDark ? 'rgba(51, 65, 85, 0.4)' : '#e2e8f0'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    transition: 'all 0.15s ease',
                    boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.02)',
                  }}
                >
                  {/* Item Row 1: Name, Code, Badges, Comments, Action Tools */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', lineHeight: 1.25 }}>
                        {item.name}
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{item.code}</span>
                        {item.unit_name && (
                          <Tag style={{ fontSize: 10, borderRadius: 4, margin: 0, padding: '0 5px', background: isDark ? '#1e293b' : '#f1f5f9' }}>
                            {item.unit_name}
                          </Tag>
                        )}
                        {item.variant_name && (
                          <Tag color="purple" style={{ fontSize: 10, borderRadius: 4, margin: 0, padding: '0 5px', fontWeight: 600 }}>
                            {item.variant_name}
                          </Tag>
                        )}
                        {/* Stock warning if quantity exceeds warehouse limit */}
                        {item.max_quantity !== undefined && item.quantity > item.max_quantity && (
                          <Tag color="error" style={{ fontSize: 10, borderRadius: 4, margin: 0, padding: '0 5px', fontWeight: 700 }}>
                            ⚠ Stock limit: {item.max_quantity}
                          </Tag>
                        )}
                        {/* Discount Badge showing both Percentage (%) and Price ($) */}
                        {discountUnitUSD > 0 && (
                          <Tag
                            color="red"
                            style={{
                              fontSize: 11,
                              borderRadius: 6,
                              margin: 0,
                              padding: '1px 7px',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fff1f2',
                              border: '1px solid #fca5a5',
                              color: '#dc2626',
                            }}
                          >
                            <span>🏷️</span>
                            <span>
                              {isItemPercent
                                ? `-${rawDiscountVal}% (-$${discountUnitUSD.toFixed(2)})`
                                : `-$${discountUnitUSD.toFixed(2)} (-${percentEquiv}%)`}
                            </span>
                            <span style={{ fontSize: 9.5, opacity: 0.85 }}>off</span>
                            <Tooltip title="Remove discount">
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onUpdateCartItem) {
                                    onUpdateCartItem(index, {
                                      discount_val: 0,
                                      discount_type: 'percent',
                                      item_discount: 0,
                                    });
                                  }
                                }}
                                style={{
                                  cursor: 'pointer',
                                  marginLeft: 2,
                                  fontWeight: 900,
                                  color: '#dc2626',
                                  lineHeight: 1,
                                  fontSize: 12,
                                }}
                              >
                                ×
                              </span>
                            </Tooltip>
                          </Tag>
                        )}
                      </div>

                      {/* Comment tags below item title */}
                      {commentCount > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                          {(item.item_note || item.comment).split(/[,;\n]/).map((n, i) => n.trim() && (
                            <Tag
                              key={i}
                              color="success"
                              style={{ borderRadius: 6, fontSize: 10.5, margin: 0, padding: '1px 6px', fontWeight: 600 }}
                            >
                              💬 {n.trim()}
                            </Tag>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Tools: Comment (with Count Badge), Edit Pencil, Delete */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      {/* Comment Icon with Comment Count Badge */}
                      <Tooltip title={commentCount > 0 ? `${commentCount} Special Note(s)` : 'Add cooking / special note (cmModal)'}>
                        <Badge count={commentCount} size="small" offset={[2, -2]}>
                          <button
                            type="button"
                            onClick={() => onCommentItem(item, index)}
                            style={{
                              background: commentCount > 0 ? 'rgba(5, 150, 105, 0.12)' : 'transparent',
                              border: `1px solid ${commentCount > 0 ? '#059669' : isDark ? '#334155' : '#cbd5e1'}`,
                              color: commentCount > 0 ? '#059669' : '#64748b',
                              cursor: 'pointer',
                              fontSize: 13,
                              width: 28,
                              height: 28,
                              borderRadius: 7,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <CommentOutlined />
                          </button>
                        </Badge>
                      </Tooltip>

                      {/* Pencil Edit Icon (for advanced modal details) */}
                      <Tooltip title="Advanced Item Details (prModal)">
                        <button
                          type="button"
                          onClick={() => onEditItem(item, index)}
                          style={{
                            background: 'transparent',
                            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                            color: '#64748b',
                            cursor: 'pointer',
                            fontSize: 12,
                            width: 28,
                            height: 28,
                            borderRadius: 7,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <EditOutlined />
                        </button>
                      </Tooltip>

                      {/* Remove Item Button */}
                      <button
                        type="button"
                        onClick={() => removeItemFromCart(index)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: 14,
                          width: 28,
                          height: 28,
                          borderRadius: 7,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0.85,
                        }}
                        title="Remove item"
                      >
                        <DeleteOutlined />
                      </button>
                    </div>
                  </div>

                  {/* Item Row 2: Direct Price & Dual Discount Control (% vs $) + Stepper + Line Total */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, paddingTop: 2 }}>
                    {/* Direct Price & Discount Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {/* Direct Unit Price Input */}
                      <Tooltip title="Directly adjust unit price without opening pencil modal">
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            background: isDark ? '#1e293b' : '#f8fafc',
                            border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                            borderRadius: 8,
                            padding: '1px 6px',
                            height: 28,
                          }}
                        >
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginRight: 2 }}>$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="pos-clean-number-input"
                            value={item.unit_price ?? ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              const updatedDiscountUSD = isItemPercent
                                ? (val * Math.min(100, Math.max(0, rawDiscountVal))) / 100
                                : Math.min(val, Math.max(0, rawDiscountVal));
                              if (onUpdateCartItem) {
                                onUpdateCartItem(index, {
                                  unit_price: val,
                                  item_discount: updatedDiscountUSD,
                                });
                              }
                            }}
                            style={{
                              width: 54,
                              background: 'transparent',
                              border: 'none',
                              outline: 'none',
                              fontWeight: 700,
                              fontSize: 12.5,
                              color: isDark ? '#f8fafc' : '#0f172a',
                            }}
                          />
                        </div>
                      </Tooltip>

                      {/* Dual Discount Control (% vs $) with Segmented Switcher, Clean Input, and ⚡ Quick Presets */}
                      <Tooltip title={`Discount Concept: ${isItemPercent ? 'Percentage (%)' : 'Fixed Price ($)'}. Click % or $ to switch.`}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            background: discountUnitUSD > 0
                              ? (isDark ? 'rgba(239, 68, 68, 0.15)' : '#fff1f2')
                              : (isDark ? '#1e293b' : '#f8fafc'),
                            border: `1px solid ${
                              discountUnitUSD > 0
                                ? '#f43f5e'
                                : (isDark ? '#334155' : '#cbd5e1')
                            }`,
                            borderRadius: 8,
                            padding: '2px 4px',
                            height: 28,
                            gap: 3,
                            boxShadow: discountUnitUSD > 0 ? '0 0 0 1px rgba(244, 63, 94, 0.2)' : 'none',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {/* Segmented Mode Switcher: [%] vs [$] */}
                          <div
                            style={{
                              display: 'inline-flex',
                              background: isDark ? '#0f172a' : '#e2e8f0',
                              borderRadius: 6,
                              padding: 1.5,
                              gap: 1.5,
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                if (!isItemPercent) {
                                  const nextPercent = unitPrice > 0 ? Math.round((discountUnitUSD / unitPrice) * 100) : rawDiscountVal;
                                  const nextDiscountUSD = (unitPrice * Math.min(100, Math.max(0, nextPercent))) / 100;
                                  if (onUpdateCartItem) {
                                    onUpdateCartItem(index, {
                                      discount_type: 'percent',
                                      discount_val: nextPercent,
                                      item_discount: nextDiscountUSD,
                                    });
                                  }
                                }
                              }}
                              style={{
                                background: isItemPercent ? '#e11d48' : 'transparent',
                                color: isItemPercent ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
                                border: 'none',
                                borderRadius: 4,
                                fontSize: 10,
                                fontWeight: 800,
                                height: 20,
                                padding: '0 5px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.12s ease',
                              }}
                              title="Percentage Discount (%)"
                            >
                              %
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (isItemPercent) {
                                  const nextFixed = parseFloat(discountUnitUSD.toFixed(2));
                                  const nextDiscountUSD = Math.min(unitPrice, Math.max(0, nextFixed));
                                  if (onUpdateCartItem) {
                                    onUpdateCartItem(index, {
                                      discount_type: 'fixed',
                                      discount_val: nextFixed,
                                      item_discount: nextDiscountUSD,
                                    });
                                  }
                                }
                              }}
                              style={{
                                background: !isItemPercent ? '#2563eb' : 'transparent',
                                color: !isItemPercent ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
                                border: 'none',
                                borderRadius: 4,
                                fontSize: 10,
                                fontWeight: 800,
                                height: 20,
                                padding: '0 5px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.12s ease',
                              }}
                              title="Fixed Price Discount ($)"
                            >
                              $
                            </button>
                          </div>

                          {/* Direct Input Value with clean number styling (no spinners) */}
                          <input
                            type="text"
                            inputMode="decimal"
                            className="pos-clean-number-input"
                            placeholder={isItemPercent ? '0%' : '0.00'}
                            value={rawDiscountVal > 0 ? `${rawDiscountVal}` : ''}
                            onChange={(e) => {
                              let rawText = e.target.value.trim();
                              let isPercentInput = isItemPercent;
                              if (rawText.includes('%')) {
                                isPercentInput = true;
                                rawText = rawText.replace('%', '').trim();
                              } else if (rawText.startsWith('$')) {
                                isPercentInput = false;
                                rawText = rawText.replace('$', '').trim();
                              }
                              const val = parseFloat(rawText) || 0;
                              const updatedDiscountUSD = isPercentInput
                                ? (unitPrice * Math.min(100, Math.max(0, val))) / 100
                                : Math.min(unitPrice, Math.max(0, val));
                              if (onUpdateCartItem) {
                                onUpdateCartItem(index, {
                                  discount_val: val,
                                  discount_type: isPercentInput ? 'percent' : 'fixed',
                                  item_discount: updatedDiscountUSD,
                                });
                              }
                            }}
                            style={{
                              width: 44,
                              background: 'transparent',
                              border: 'none',
                              outline: 'none',
                              fontWeight: 800,
                              fontSize: 12,
                              textAlign: 'center',
                              color: discountUnitUSD > 0 ? '#dc2626' : (isDark ? '#cbd5e1' : '#64748b'),
                            }}
                          />

                          {/* Quick Presets Popover ⚡ */}
                          <Popover
                            trigger="click"
                            placement="bottom"
                            content={
                              <div style={{ width: 220, padding: 4 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>
                                  Quick Discount for <span style={{ color: '#0f172a' }}>{item.name}</span>
                                </div>

                                {/* Percentage Presets */}
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#e11d48', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                  Percentage (%)
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginBottom: 8 }}>
                                  {[5, 10, 15, 20, 50].map((pct) => (
                                    <button
                                      key={pct}
                                      type="button"
                                      className="pos-preset-chip"
                                      onClick={() => {
                                        const discUSD = (unitPrice * pct) / 100;
                                        if (onUpdateCartItem) {
                                          onUpdateCartItem(index, {
                                            discount_type: 'percent',
                                            discount_val: pct,
                                            item_discount: discUSD,
                                          });
                                        }
                                      }}
                                      style={{
                                        padding: '3px 0',
                                        fontSize: 11,
                                        fontWeight: 700,
                                        borderRadius: 6,
                                        border: rawDiscountVal === pct && isItemPercent ? '1.5px solid #e11d48' : '1px solid #e2e8f0',
                                        background: rawDiscountVal === pct && isItemPercent ? '#ffe4e6' : '#f8fafc',
                                        color: rawDiscountVal === pct && isItemPercent ? '#e11d48' : '#334155',
                                      }}
                                    >
                                      {pct}%
                                    </button>
                                  ))}
                                </div>

                                {/* Fixed Dollar Presets */}
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                  Fixed Dollar ($)
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginBottom: 10 }}>
                                  {[0.5, 1, 2, 5, 10].map((fix) => (
                                    <button
                                      key={fix}
                                      type="button"
                                      className="pos-preset-chip"
                                      onClick={() => {
                                        const discUSD = Math.min(unitPrice, fix);
                                        if (onUpdateCartItem) {
                                          onUpdateCartItem(index, {
                                            discount_type: 'fixed',
                                            discount_val: fix,
                                            item_discount: discUSD,
                                          });
                                        }
                                      }}
                                      style={{
                                        padding: '3px 0',
                                        fontSize: 11,
                                        fontWeight: 700,
                                        borderRadius: 6,
                                        border: rawDiscountVal === fix && !isItemPercent ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                                        background: rawDiscountVal === fix && !isItemPercent ? '#eff6ff' : '#f8fafc',
                                        color: rawDiscountVal === fix && !isItemPercent ? '#2563eb' : '#334155',
                                      }}
                                    >
                                      ${fix}
                                    </button>
                                  ))}
                                </div>

                                {/* Clear Discount Button */}
                                {discountUnitUSD > 0 && (
                                  <Button
                                    size="small"
                                    danger
                                    block
                                    onClick={() => {
                                      if (onUpdateCartItem) {
                                        onUpdateCartItem(index, {
                                          discount_type: 'percent',
                                          discount_val: 0,
                                          item_discount: 0,
                                        });
                                      }
                                    }}
                                    style={{ borderRadius: 6, fontSize: 11, fontWeight: 700, height: 26 }}
                                  >
                                    Clear Item Discount
                                  </Button>
                                )}
                              </div>
                            }
                          >
                            <button
                              type="button"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: discountUnitUSD > 0 ? '#f43f5e' : '#94a3b8',
                                cursor: 'pointer',
                                fontSize: 12,
                                padding: '0 2px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title="Quick Discount Presets"
                            >
                              ⚡
                            </button>
                          </Popover>

                          {/* Quick Clear "×" Button when discount > 0 */}
                          {discountUnitUSD > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (onUpdateCartItem) {
                                  onUpdateCartItem(index, {
                                    discount_type: 'percent',
                                    discount_val: 0,
                                    item_discount: 0,
                                  });
                                }
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#dc2626',
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 800,
                                padding: '0 2px',
                                lineHeight: 1,
                              }}
                              title="Reset discount to 0"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </Tooltip>
                    </div>

                    {/* Quantity Stepper & Line Total (with strikethrough original when discounted) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* Quantity Stepper */}
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          background: isDark ? '#1e293b' : '#f1f5f9',
                          borderRadius: 9,
                          padding: '2px',
                          border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                        }}
                      >
                        <button
                          type="button"
                          className="pos-stepper-btn"
                          onClick={() => updateItemQuantity(index, (item.quantity || 1) - 1)}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 7,
                            background: 'transparent',
                            border: 'none',
                            color: isDark ? '#f8fafc' : '#0f172a',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <MinusOutlined style={{ fontSize: 11 }} />
                        </button>

                        <input
                          type="number"
                          min="1"
                          className="pos-clean-number-input"
                          value={item.quantity || 1}
                          onChange={(e) => updateItemQuantity(index, parseFloat(e.target.value) || 1)}
                          style={{
                            width: 38,
                            textAlign: 'center',
                            background: 'transparent',
                            border: 'none',
                            fontWeight: 800,
                            fontSize: 13.5,
                            color: isDark ? '#f8fafc' : '#0f172a',
                            outline: 'none',
                          }}
                        />

                        <button
                          type="button"
                          className="pos-stepper-btn"
                          onClick={() => updateItemQuantity(index, (item.quantity || 1) + 1)}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 7,
                            background: 'transparent',
                            border: 'none',
                            color: isDark ? '#f8fafc' : '#0f172a',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <PlusOutlined style={{ fontSize: 11 }} />
                        </button>
                      </div>

                      {/* Line Total with Strikethrough Original Total if Discounted */}
                      <div style={{ minWidth: 68, textAlign: 'right' }}>
                        {discountUnitUSD > 0 && (
                          <div style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'line-through', lineHeight: 1.1 }}>
                            ${(unitPrice * qty).toFixed(2)}
                          </div>
                        )}
                        <div style={{ fontSize: 15.5, fontWeight: 900, color: '#2563eb', lineHeight: 1.2 }}>
                          ${lineTotal.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. ORDER SUMMARY FOOTER */}
      <div
        style={{
          padding: '12px 14px',
          borderTop: `1px solid ${isDark ? 'rgba(51, 65, 85, 0.4)' : '#e2e8f0'}`,
          background: isDark ? 'rgba(15, 23, 42, 0.8)' : '#f8fafc',
        }}
      >
        {/* Adjustment Quick Buttons: Discount, Tax, Shipping */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
          <Button
            size="small"
            className="pos-press"
            icon={<PercentageOutlined />}
            onClick={onOpenOrderDiscount}
            style={{
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              height: 30,
              color: orderDiscountValue > 0 ? '#ef4444' : undefined,
              borderColor: orderDiscountValue > 0 ? '#fca5a5' : undefined,
              background: orderDiscountValue > 0 ? 'rgba(239, 68, 68, 0.08)' : undefined,
            }}
          >
            {orderDiscountValue > 0
              ? (isOrderDiscountPercent
                  ? `-${orderDiscountValue}% (-$${orderDiscountAmount.toFixed(2)})`
                  : `-$${parseFloat(orderDiscountValue).toFixed(2)} (-${orderDiscountPercentEquiv}%)`)
              : 'Discount (% / $)'}
          </Button>

          <Button
            size="small"
            className="pos-press"
            icon={<TagOutlined />}
            onClick={onOpenOrderTax}
            style={{
              borderRadius: 8,
              fontSize: 11.5,
              fontWeight: 700,
              height: 30,
              color: orderTaxRate > 0 ? '#2563eb' : undefined,
              borderColor: orderTaxRate > 0 ? '#93c5fd' : undefined,
              background: orderTaxRate > 0 ? 'rgba(37, 99, 235, 0.08)' : undefined,
            }}
          >
            {orderTaxRate > 0 ? `Tax ${orderTaxRate}%` : 'Order Tax'}
          </Button>

          <Button
            size="small"
            className="pos-press"
            icon={<CarOutlined />}
            onClick={onOpenDeliveryFee}
            style={{
              borderRadius: 8,
              fontSize: 11.5,
              fontWeight: 700,
              height: 30,
              color: shippingFee > 0 ? '#d97706' : undefined,
              borderColor: shippingFee > 0 ? '#fcd34d' : undefined,
              background: shippingFee > 0 ? 'rgba(245, 158, 11, 0.08)' : undefined,
            }}
          >
            {shippingFee > 0 ? `+$${shippingFee}` : 'Shipping'}
          </Button>
        </div>

        {/* Calculation Rows: Subtotal, Item Discounts, Order Discount, Total Savings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 12, color: '#64748b', marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal ({cart.reduce((s, i) => s + (i.quantity || 1), 0)} items)</span>
            <span style={{ fontWeight: 600, color: isDark ? '#cbd5e1' : '#334155' }}>${(grossSubtotal || subtotal).toFixed(2)}</span>
          </div>

          {/* Product Line-Item Discounts */}
          {productDiscountTotal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e11d48' }}>
              <span>Product Discounts (Items)</span>
              <span style={{ fontWeight: 700 }}>-${productDiscountTotal.toFixed(2)}</span>
            </div>
          )}

          {/* Order-Level Discount */}
          {orderDiscountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e11d48' }}>
              <span>
                Order Discount ({isOrderDiscountPercent ? `${orderDiscountValue}%` : `$${parseFloat(orderDiscountValue).toFixed(2)}`})
              </span>
              <span style={{ fontWeight: 700 }}>
                -${orderDiscountAmount.toFixed(2)} ({isOrderDiscountPercent ? `${orderDiscountValue}%` : `${orderDiscountPercentEquiv}%`} off)
              </span>
            </div>
          )}

          {/* Combined Total Discount */}
          {totalDiscount > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                color: '#ef4444',
                fontWeight: 700,
                background: 'rgba(239, 68, 68, 0.06)',
                padding: '2px 6px',
                borderRadius: 6,
              }}
            >
              <span>Total Savings / Discount</span>
              <span>
                -${totalDiscount.toFixed(2)}
                {(grossSubtotal || subtotal) > 0 ? ` (${(((totalDiscount) / (grossSubtotal || subtotal)) * 100).toFixed(0)}% off)` : ''}
              </span>
            </div>
          )}

          {taxAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Order Tax</span>
              <span style={{ fontWeight: 600 }}>+${taxAmount.toFixed(2)}</span>
            </div>
          )}

          {shippingFee > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Delivery Fee</span>
              <span style={{ fontWeight: 600 }}>+${parseFloat(shippingFee).toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* High-Contrast Creative Total Payable Card */}
        <div
          style={{
            background: isDark ? 'rgba(30, 41, 59, 0.7)' : '#eff6ff',
            border: `1px solid ${isDark ? '#334155' : '#bfdbfe'}`,
            borderRadius: 14,
            padding: '10px 14px',
            marginBottom: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#2563eb', letterSpacing: '0.6px' }}>
              Total Payable
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#059669', marginTop: 2 }}>
              ៛{totalKHR.toLocaleString()} KHR <span style={{ fontSize: 11, color: '#64748b' }}>• ฿{totalTHB} THB</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 27, fontWeight: 900, color: '#1d4ed8', lineHeight: 1 }}>
              ${grandTotal.toFixed(2)}
            </div>
          </div>
        </div>

        {/* 4. ACTION BUTTONS: Void, Hold, Bill */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
          <Popconfirm
            title="Void / Clear Entire Cart?"
            description="Are you sure you want to remove all items from this active order?"
            onConfirm={clearCart}
            okText="Yes, Clear"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            disabled={cart.length === 0}
          >
            <Button
              danger
              icon={<ClearOutlined />}
              disabled={cart.length === 0}
              className="pos-press"
              style={{ borderRadius: 10, height: 38, fontWeight: 700, fontSize: 12, width: '100%' }}
            >
              Void <span style={{ fontSize: 10, opacity: 0.75 }}>F8</span>
            </Button>
          </Popconfirm>

          <Tooltip title="Hold / Suspend Order (F7)">
            <Button
              icon={<PauseCircleOutlined />}
              onClick={onHoldOrder}
              disabled={cart.length === 0}
              className="pos-press"
              style={{ borderRadius: 10, height: 38, fontWeight: 700, fontSize: 12, color: '#d97706', borderColor: '#fcd34d' }}
            >
              Hold <span style={{ fontSize: 10, opacity: 0.75 }}>F7</span>
            </Button>
          </Tooltip>

          <Tooltip title="Print Pre-check Table Bill (F6)">
            <Button
              icon={<PrinterOutlined />}
              onClick={onPrintBill}
              disabled={cart.length === 0}
              className="pos-press"
              style={{ borderRadius: 10, height: 38, fontWeight: 700, fontSize: 12, color: '#0284c7', borderColor: '#7dd3fc' }}
            >
              Bill <span style={{ fontSize: 10, opacity: 0.75 }}>F6</span>
            </Button>
          </Tooltip>
        </div>

        {/* Primary Pay / Checkout Button with Gradient & Shortcut Tag */}
        <Button
          type="primary"
          block
          size="large"
          icon={<CreditCardOutlined style={{ fontSize: 18 }} />}
          onClick={onOpenCheckout}
          disabled={cart.length === 0}
          className="pos-checkout-btn pos-press"
          style={{
            height: 52,
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: cart.length > 0 ? '0 8px 24px rgba(37, 99, 235, 0.45)' : 'none',
            border: 'none',
            cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          <span>CHECKOUT</span>
          <span style={{ fontSize: 17, fontWeight: 900 }}>(${grandTotal.toFixed(2)})</span>
          <Tag
            style={{
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 800,
              padding: '1px 6px',
              margin: 0,
              background: 'rgba(255, 255, 255, 0.25)',
              border: 'none',
              color: '#ffffff',
            }}
          >
            ↵ Enter / F4
          </Tag>
        </Button>
      </div>
    </div>
  );
};

export default PosCart;
