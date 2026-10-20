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
} from '@ant-design/icons';

const PosCart = ({
  cart,
  updateItemQuantity,
  removeItemFromCart,
  clearCart,
  selectedCustomerId,
  setSelectedCustomerId,
  customers,
  onOpenQuickAddCustomer,
  onOpenViewCustomer,
  currentTable,
  setCurrentTable,
  tables = ['Takeaway / Walk-in', 'Table 1', 'Table 2', 'Table 3', 'Table 4', 'VIP Room 1', 'VIP Room 2'],
  heldOrders,
  resumeHeldOrder,
  onHoldOrder,
  onPrintBill,
  onOpenCheckout,
  onEditItem,
  onCommentItem,
  onOpenOrderDiscount,
  onOpenOrderTax,
  onOpenDeliveryFee,
  orderDiscountValue,
  orderDiscountType,
  orderTaxRate,
  shippingFee,
  subtotal,
  totalDiscount,
  taxAmount,
  grandTotal,
  khrExchangeRate = 4200,
  thbExchangeRate = 36.5,
  themeMode,
  adminTheme,
  t,
}) => {
  const isDark = themeMode === 'dark';
  const totalKHR = Math.round(grandTotal * khrExchangeRate);
  const totalTHB = (grandTotal * thbExchangeRate).toFixed(2);

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
              const lineTotal = ((parseFloat(item.unit_price || 0) * (item.quantity || 1)) - (parseFloat(item.item_discount || 0) * (item.quantity || 1)));
              return (
                <div
                  key={`${item.id}-${index}`}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: isDark ? 'rgba(30, 41, 59, 0.5)' : '#ffffff',
                    border: `1px solid ${isDark ? 'rgba(51, 65, 85, 0.4)' : '#e2e8f0'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    transition: 'all 0.15s ease',
                    boxShadow: isDark ? 'none' : '0 2px 6px rgba(0,0,0,0.02)',
                  }}
                >
                  {/* Item Row 1: Name, Code, Badges, Remove Button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, paddingRight: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', lineHeight: 1.2 }}>
                        {item.name}
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3 }}>
                        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{item.code}</span>
                        {item.unit_name && (
                          <Tag style={{ fontSize: 10, borderRadius: 4, margin: 0, padding: '0 4px', background: isDark ? '#1e293b' : '#f1f5f9' }}>
                            {item.unit_name}
                          </Tag>
                        )}
                        {item.item_discount > 0 && (
                          <Tag color="red" style={{ fontSize: 10, borderRadius: 4, margin: 0, padding: '0 4px' }}>
                            -${parseFloat(item.item_discount).toFixed(2)} off
                          </Tag>
                        )}
                      </div>
                      {item.item_note && (
                        <div style={{ fontSize: 11, color: '#0284c7', fontStyle: 'italic', marginTop: 2 }}>
                          💬 {item.item_note}
                        </div>
                      )}
                    </div>

                    {/* Remove Action */}
                    <button
                      type="button"
                      onClick={() => removeItemFromCart(index)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: 4,
                        fontSize: 14,
                        opacity: 0.8,
                      }}
                      title="Remove item"
                    >
                      <DeleteOutlined />
                    </button>
                  </div>

                  {/* Item Row 2: Price, Quantity Stepper, Line Total, Modifier Tools */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 2 }}>
                    {/* Unit Price */}
                    <div style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#cbd5e1' : '#475569' }}>
                      ${parseFloat(item.unit_price || 0).toFixed(2)}
                    </div>

                    {/* Quantity Stepper */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        background: isDark ? '#1e293b' : '#f1f5f9',
                        borderRadius: 8,
                        padding: '2px 4px',
                        border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(index, (item.quantity || 1) - 1)}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
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
                        <MinusOutlined style={{ fontSize: 10 }} />
                      </button>

                      <input
                        type="number"
                        min="1"
                        value={item.quantity || 1}
                        onChange={(e) => updateItemQuantity(index, parseFloat(e.target.value) || 1)}
                        style={{
                          width: 38,
                          textAlign: 'center',
                          background: 'transparent',
                          border: 'none',
                          fontWeight: 800,
                          fontSize: 13,
                          color: isDark ? '#f8fafc' : '#0f172a',
                          outline: 'none',
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => updateItemQuantity(index, (item.quantity || 1) + 1)}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
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
                        <PlusOutlined style={{ fontSize: 10 }} />
                      </button>
                    </div>

                    {/* Line Total & Tool Icons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Tooltip title="Edit item unit, price or discount (prModal)">
                        <button
                          type="button"
                          onClick={() => onEditItem(item, index)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            fontSize: 12,
                            padding: 2,
                          }}
                        >
                          <EditOutlined />
                        </button>
                      </Tooltip>

                      <Tooltip title="Add item cooking / special note (cmModal)">
                        <button
                          type="button"
                          onClick={() => onCommentItem(item, index)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            fontSize: 12,
                            padding: 2,
                          }}
                        >
                          <CommentOutlined />
                        </button>
                      </Tooltip>

                      <span style={{ fontSize: 14, fontWeight: 800, color: '#2563eb' }}>
                        ${lineTotal.toFixed(2)}
                      </span>
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
            icon={<PercentageOutlined />}
            onClick={onOpenOrderDiscount}
            style={{
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              color: orderDiscountValue > 0 ? '#ef4444' : undefined,
              borderColor: orderDiscountValue > 0 ? '#fca5a5' : undefined,
            }}
          >
            {orderDiscountValue > 0 ? `-${orderDiscountType === 'percentage' ? `${orderDiscountValue}%` : `$${orderDiscountValue}`}` : 'Discount'}
          </Button>

          <Button
            size="small"
            icon={<TagOutlined />}
            onClick={onOpenOrderTax}
            style={{
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              color: orderTaxRate > 0 ? '#2563eb' : undefined,
            }}
          >
            {orderTaxRate > 0 ? `Tax ${orderTaxRate}%` : 'Order Tax'}
          </Button>

          <Button
            size="small"
            icon={<CarOutlined />}
            onClick={onOpenDeliveryFee}
            style={{
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              color: shippingFee > 0 ? '#f59e0b' : undefined,
            }}
          >
            {shippingFee > 0 ? `+$${shippingFee}` : 'Shipping'}
          </Button>
        </div>

        {/* Calculation Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 12, color: '#64748b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal ({cart.reduce((s, i) => s + (i.quantity || 1), 0)} items)</span>
            <span style={{ fontWeight: 600, color: isDark ? '#cbd5e1' : '#334155' }}>${subtotal.toFixed(2)}</span>
          </div>

          {totalDiscount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
              <span>Total Discount</span>
              <span style={{ fontWeight: 700 }}>-${totalDiscount.toFixed(2)}</span>
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

        <Divider style={{ margin: '8px 0', borderColor: isDark ? '#334155' : '#e2e8f0' }} />

        {/* Grand Total Multi-Currency Display */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.5px' }}>
              Total Payable
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>
              ៛{totalKHR.toLocaleString()} KHR <span style={{ fontSize: 11, color: '#64748b' }}>• ฿{totalTHB} THB</span>
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#2563eb', lineHeight: 1 }}>
            ${grandTotal.toFixed(2)}
          </div>
        </div>

        {/* 4. ACTION BUTTONS: Cancel, Hold, Print Bill, Checkout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 6 }}>
          <Button
            danger
            icon={<ClearOutlined />}
            onClick={clearCart}
            disabled={cart.length === 0}
            style={{ borderRadius: 10, height: 38, fontWeight: 700, fontSize: 12 }}
          >
            Void
          </Button>

          <Button
            icon={<PauseCircleOutlined />}
            onClick={onHoldOrder}
            disabled={cart.length === 0}
            style={{ borderRadius: 10, height: 38, fontWeight: 700, fontSize: 12, color: '#f59e0b', borderColor: '#fcd34d' }}
          >
            Hold
          </Button>

          <Button
            icon={<PrinterOutlined />}
            onClick={onPrintBill}
            disabled={cart.length === 0}
            style={{ borderRadius: 10, height: 38, fontWeight: 700, fontSize: 12, color: '#0284c7', borderColor: '#7dd3fc' }}
          >
            Bill
          </Button>
        </div>

        {/* Primary Pay / Checkout Button */}
        <Button
          type="primary"
          block
          size="large"
          icon={<CreditCardOutlined />}
          onClick={onOpenCheckout}
          disabled={cart.length === 0}
          style={{
            height: 50,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #0284c7 100%)',
            fontSize: 16,
            fontWeight: 800,
            boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)',
            border: 'none',
          }}
        >
          CHECK OUT (${grandTotal.toFixed(2)})
        </Button>
      </div>
    </div>
  );
};

export default PosCart;
