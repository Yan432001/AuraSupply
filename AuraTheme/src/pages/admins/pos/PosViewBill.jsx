import React, { useState, useEffect, useMemo } from 'react';
import { Tag, Carousel } from 'antd';
import {
  ShopOutlined,
  UserOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  TagOutlined,
  QrcodeOutlined,
  GiftOutlined,
  FireOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';

const KHR_RATE = 4100;

const PosViewBill = () => {
  const [billData, setBillData] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_pos_customer_display');
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: true }));

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to BroadcastChannel and localStorage events
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'aura_pos_customer_display' && e.newValue) {
        try {
          setBillData(JSON.parse(e.newValue));
        } catch (_) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    let bc = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('aura_pos_cart');
      bc.onmessage = (event) => {
        if (event.data) {
          setBillData(event.data);
        }
      };
    }

    // Polling fallback every 1 sec
    const pollInterval = setInterval(() => {
      try {
        const raw = localStorage.getItem('aura_pos_customer_display');
        if (raw) {
          const parsed = JSON.parse(raw);
          setBillData((prev) => {
            if (!prev || prev.timestamp !== parsed.timestamp) {
              return parsed;
            }
            return prev;
          });
        }
      } catch (_) {}
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (bc) bc.close();
      clearInterval(pollInterval);
    };
  }, []);

  const items = useMemo(() => (billData?.items && Array.isArray(billData.items) ? billData.items : []), [billData]);
  const totalItemCount = useMemo(() => items.reduce((sum, it) => sum + (parseFloat(it.quantity) || 1), 0), [items]);
  const grossTotal = parseFloat(billData?.grossSubtotal || 0);
  const totalDiscount = parseFloat(billData?.totalDiscount || 0);
  const orderTax = parseFloat(billData?.taxAmount || 0);
  const grandTotalUSD = parseFloat(billData?.grandTotalUSD || 0);
  const grandTotalKHR = billData?.grandTotalKHR || Math.round(grandTotalUSD * KHR_RATE);

  // Promotional posters data
  const promoSlides = [
    {
      id: 1,
      badge: 'PROMOTION OF THE MONTH',
      title: 'Smart Retail & Hospitality Solutions',
      desc: 'Seamless cloud billing, live inventory tracking, and dual-screen customer experience.',
      icon: <FireOutlined style={{ fontSize: 44, color: '#f59e0b' }} />,
      bg: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
    },
    {
      id: 2,
      badge: 'INSTANT PAYMENT',
      title: 'Scan KHQR to Pay with Any Bank',
      desc: 'Pay in seconds with Bakong, ABA, ACLEDA, or Wing. Zero transaction fees.',
      icon: <QrcodeOutlined style={{ fontSize: 44, color: '#10b981' }} />,
      bg: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
    },
    {
      id: 3,
      badge: 'MEMBERSHIP PERKS',
      title: 'Earn Reward Points on Every Purchase',
      desc: 'Ask your cashier to sign up for instant 5% cashback points and exclusive member discounts.',
      icon: <GiftOutlined style={{ fontSize: 44, color: '#ec4899' }} />,
      bg: 'linear-gradient(135deg, #831843 0%, #db2777 100%)',
    },
  ];

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        background: '#f1f5f9',
        fontFamily: "'Segoe UI', Aptos, -apple-system, BlinkMacSystemFont, sans-serif",
        overflow: 'hidden',
      }}
    >
      {/* ================= LEFT SIDE: CUSTOMER BILL DISPLAY (MATCHING IMAGE 2) ================= */}
      <div
        style={{
          width: 460,
          minWidth: 420,
          maxWidth: 500,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          borderRight: '1px solid #cbd5e1',
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.05)',
          zIndex: 10,
        }}
      >
        {/* Bill Top Header */}
        <div
          style={{
            padding: '16px 20px 12px 20px',
            borderBottom: '1px solid #e2e8f0',
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: 18,
                  fontWeight: 900,
                }}
              >
                A
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>
                  AURA POS
                </div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Customer Display Screen</div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 4 }}>
                <ClockCircleOutlined /> {currentTime}
              </div>
              <div style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>● Online</div>
            </div>
          </div>

          {/* Customer & Table details */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 10,
              padding: '6px 10px',
              background: '#f8fafc',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              fontSize: 11.5,
              fontWeight: 600,
              color: '#475569',
            }}
          >
            <div>
              <UserOutlined style={{ marginRight: 4, color: '#2563eb' }} />
              <span>{billData?.customer_name || 'Walk-in Customer'}</span>
            </div>
            <div>
              <span>📍 {billData?.table_name || 'Takeaway / Walk-in'}</span>
            </div>
          </div>
        </div>

        {/* Product Items Table (Header + Scrollable Body) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Table Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1.2fr',
              padding: '10px 16px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              fontSize: 12,
              fontWeight: 800,
              color: '#334155',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            <div>Product</div>
            <div style={{ textAlign: 'center' }}>Price</div>
            <div style={{ textAlign: 'center' }}>Qty</div>
            <div style={{ textAlign: 'right' }}>Subtotal</div>
          </div>

          {/* Table Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
            {items.length === 0 ? (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  gap: 12,
                  padding: 24,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 44, opacity: 0.5 }}>🛒</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#475569' }}>Welcome to our store!</div>
                <div style={{ fontSize: 12, color: '#94a3b8', maxWidth: 220 }}>
                  Your selected items will appear here as the cashier scans them.
                </div>
              </div>
            ) : (
              items.map((item, idx) => {
                const uPrice = parseFloat(item.unit_price || item.price || 0);
                const q = parseFloat(item.quantity || 1);
                const isPercent = item.discount_type === 'percent';
                const discVal = parseFloat(item.discount_val !== undefined ? item.discount_val : (item.item_discount || 0)) || 0;
                const unitDisc = isPercent ? (uPrice * discVal) / 100 : discVal;
                const netPrice = Math.max(0, uPrice - unitDisc);
                const sub = netPrice * q;

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1.2fr',
                      padding: '10px 16px',
                      alignItems: 'center',
                      borderBottom: '1px solid #f1f5f9',
                      background: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                      fontSize: 12.5,
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>{item.name}</div>
                      <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>{item.code}</div>
                      {unitDisc > 0 && (
                        <Tag color="red" style={{ fontSize: 9.5, margin: '2px 0 0 0', padding: '0 4px', borderRadius: 4, fontWeight: 700 }}>
                          -{isPercent ? `${discVal}%` : `$${unitDisc.toFixed(2)}`} off
                        </Tag>
                      )}
                      {(item.item_note || item.comment) && (
                        <div style={{ fontSize: 10, color: '#059669', fontWeight: 600, marginTop: 2 }}>
                          💬 {item.item_note || item.comment}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'center', fontWeight: 600, color: '#475569' }}>
                      ${uPrice.toFixed(2)}
                    </div>
                    <div style={{ textAlign: 'center', fontWeight: 800, color: '#0f172a' }}>
                      {q}
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 800, color: '#2563eb' }}>
                      ${sub.toFixed(2)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Totals Summary Rows (Matching Image 2) */}
        <div
          style={{
            borderTop: '1px solid #e2e8f0',
            background: '#ffffff',
            padding: '12px 18px',
          }}
        >
          {/* Row 1: Items & Total */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 12.5,
              color: '#334155',
              marginBottom: 6,
            }}
          >
            <div>
              <span style={{ color: '#64748b' }}>Items: </span>
              <span style={{ fontWeight: 800 }}>{items.length} ({totalItemCount})</span>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Total: </span>
              <span style={{ fontWeight: 800 }}>${(grossTotal || grandTotalUSD).toFixed(2)}</span>
            </div>
          </div>

          {/* Row 2: Order Tax & Discount */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 12.5,
              color: '#334155',
              marginBottom: 10,
            }}
          >
            <div>
              <span style={{ color: '#64748b' }}>Order Tax: </span>
              <span style={{ fontWeight: 800 }}>${orderTax.toFixed(2)}</span>
            </div>
            <div>
              <span style={{ color: totalDiscount > 0 ? '#e11d48' : '#64748b' }}>Discount: </span>
              <span style={{ fontWeight: 800, color: totalDiscount > 0 ? '#e11d48' : '#334155' }}>
                ({totalDiscount.toFixed(2)}) -${totalDiscount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* High-Contrast Total Payable Footer (Matching Image 2) */}
        <div
          style={{
            background: '#222222',
            color: '#ffffff',
            padding: '14px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {/* USD Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: 0.5 }}>Total Payable</span>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#38bdf8' }}>
              ${grandTotalUSD.toFixed(2)}
            </span>
          </div>

          {/* KHR Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 900, letterSpacing: 0.5, opacity: 0.9 }}>Total Payable</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#4ade80' }}>
              KHR {grandTotalKHR.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* ================= RIGHT SIDE: PROMOTIONAL SLIDES & POSTER CAROUSEL (MATCHING IMAGE 2) ================= */}
      <div
        style={{
          flex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          background: '#0f172a',
        }}
      >
        <Carousel
          autoplay
          autoplaySpeed={5000}
          effect="fade"
          style={{ width: '100%', height: '100%' }}
        >
          {promoSlides.map((slide) => (
            <div key={slide.id}>
              <div
                style={{
                  width: '100%',
                  height: '100vh',
                  background: slide.bg,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '60px 80px',
                  boxSizing: 'border-box',
                  position: 'relative',
                  color: '#ffffff',
                  textAlign: 'center',
                }}
              >
                {/* Background radial glow */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 600,
                    height: 600,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Badge Tag */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 16px',
                    borderRadius: 30,
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: 1.5,
                    marginBottom: 24,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                  }}
                >
                  <ThunderboltFilled /> {slide.badge}
                </div>

                {/* Main Icon */}
                <div
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 24,
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  }}
                >
                  {slide.icon}
                </div>

                {/* Slide Title */}
                <h1
                  style={{
                    fontSize: 42,
                    fontWeight: 900,
                    lineHeight: 1.2,
                    marginBottom: 16,
                    maxWidth: 720,
                    textShadow: '0 4px 16px rgba(0,0,0,0.25)',
                  }}
                >
                  {slide.title}
                </h1>

                {/* Slide Description */}
                <p
                  style={{
                    fontSize: 18,
                    fontWeight: 500,
                    lineHeight: 1.6,
                    maxWidth: 600,
                    opacity: 0.9,
                    margin: 0,
                  }}
                >
                  {slide.desc}
                </p>

                {/* Bottom Welcome Footer */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 40,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: 'rgba(0, 0, 0, 0.25)',
                    padding: '8px 20px',
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  <span>Thank you for shopping with us!</span>
                  <span>•</span>
                  <span>សូមអរគុណសម្រាប់ការគាំទ្រ</span>
                </div>
              </div>
            </div>
          ))}
        </Carousel>
      </div>
    </div>
  );
};

export default PosViewBill;
