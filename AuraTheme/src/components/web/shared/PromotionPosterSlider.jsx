import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  FireFilled,
  ThunderboltFilled,
  TagFilled,
  CopyOutlined,
  CheckOutlined,
  ArrowRightOutlined,
  GiftFilled,
} from '@ant-design/icons';

// Curated high-impact promotion posters for Aura flagship stores
const PROMO_POSTERS = [
  {
    id: 'promo-1',
    storeName: 'Aura Specialty Coffee',
    storeSlug: 'sbc-store',
    storeLogo: '☕',
    badge: 'DAILY FLASH DEAL • 25% OFF',
    badgeColor: '#ef4444',
    badgeBg: 'rgba(239, 68, 68, 0.95)',
    title: 'Spanish Iced Latte & Almond Croissant',
    subtitle: 'Signature single-origin espresso with sweetened milk paired with flaky 84% butter pastry.',
    originalPrice: '$12.25',
    promoPrice: '$8.99',
    savings: 'Save $3.26',
    couponCode: 'AURACOFFEE25',
    validUntil: 'Today only until 3:00 PM',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
    overlayGradient: 'linear-gradient(180deg, rgba(15,23,42,0.3) 0%, rgba(15,23,42,0.7) 45%, rgba(15,23,42,0.96) 100%)',
    accentColor: '#2F6FED',
    ctaText: 'Claim 25% Off Deal',
  },
  {
    id: 'promo-2',
    storeName: 'Aura Artisan Bakery',
    storeSlug: 'aura-bakery',
    storeLogo: '🥐',
    badge: 'WEEKEND SPECIAL • BUY 1 GET 1 50% OFF',
    badgeColor: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.95)',
    title: 'Golden Viennoiserie & Sourdough Box',
    subtitle: 'Warm Normandy butter croissants, pain au chocolat, and rustic country sourdough loaves.',
    originalPrice: '$18.50',
    promoPrice: '$12.75',
    savings: 'Save $5.75',
    couponCode: 'BAKERY50',
    validUntil: 'Fresh morning bake',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
    overlayGradient: 'linear-gradient(180deg, rgba(30,15,5,0.25) 0%, rgba(30,15,5,0.7) 45%, rgba(15,10,5,0.96) 100%)',
    accentColor: '#FF7A3D',
    ctaText: 'Claim Bakery Deal',
  },
  {
    id: 'promo-3',
    storeName: 'Aura Botanical Lounge & Matcha',
    storeSlug: 'aura-lounge',
    storeLogo: '🍵',
    badge: 'CEREMONIAL SPECIAL • 20% OFF',
    badgeColor: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.95)',
    title: 'Kyoto Uji Matcha Latte & Mochi Waffle',
    subtitle: 'First-harvest ceremonial matcha stone-ground in Uji, whisked fresh with oat milk.',
    originalPrice: '$14.00',
    promoPrice: '$10.50',
    savings: 'Save $3.50',
    couponCode: 'MATCHA20',
    validUntil: 'Available daily 11am-8pm',
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800&auto=format&fit=crop&q=80',
    overlayGradient: 'linear-gradient(180deg, rgba(6,30,18,0.25) 0%, rgba(6,30,18,0.7) 45%, rgba(4,20,12,0.96) 100%)',
    accentColor: '#10b981',
    ctaText: 'Explore Matcha Deal',
  },
  {
    id: 'promo-4',
    storeName: 'Aura French Bistro',
    storeSlug: 'aura-bistro',
    storeLogo: '🍽️',
    badge: 'CHEF\'S SPECIAL • $5 DISCOUNT',
    badgeColor: '#8b5cf6',
    badgeBg: 'rgba(139, 92, 246, 0.95)',
    title: 'Wagyu Truffle Burger & Hand-Cut Fries',
    subtitle: 'Aged gruyère cheese, black truffle aioli, and caramelized balsamic onion jam on brioche.',
    originalPrice: '$19.50',
    promoPrice: '$14.50',
    savings: 'Save $5.00',
    couponCode: 'BISTROVIP',
    validUntil: 'Dinner & lunch service',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
    overlayGradient: 'linear-gradient(180deg, rgba(20,10,35,0.25) 0%, rgba(20,10,35,0.7) 45%, rgba(12,6,22,0.96) 100%)',
    accentColor: '#8b5cf6',
    ctaText: 'Order Bistro Combo',
  },
];

export default function PromotionPosterSlider({ onSelectPoster }) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const autoPlayTimerRef = useRef(null);

  const totalPosters = PROMO_POSTERS.length;
  const currentPoster = PROMO_POSTERS[currentIndex];

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalPosters);
  }, [totalPosters]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalPosters) % totalPosters);
  }, [totalPosters]);

  // Auto-play timer (slides every 4.8 seconds when not hovered)
  useEffect(() => {
    if (isPaused) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      handleNext();
    }, 4800);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isPaused, handleNext]);

  const handleCopyCode = (code, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    message.success(`Copied promo code "${code}"! Discount applies at checkout.`);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2500);
  };

  const handlePosterClick = (poster) => {
    if (onSelectPoster) {
      onSelectPoster(poster);
    } else {
      navigate(`/shop/${poster.storeSlug}`);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 bg-slate-900 select-none group transition-all duration-300"
      style={{
        minHeight: 380,
        height: '100%',
        boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.25)',
      }}
    >
      {/* Background Poster Image with Zoom Transition */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          key={currentPoster.id}
          src={currentPoster.image}
          alt={currentPoster.title}
          className="w-full h-full object-cover transition-all duration-700 ease-out transform scale-102 group-hover:scale-108"
        />
        {/* Scrim Gradient Overlays for High Legibility */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{ background: currentPoster.overlayGradient }}
        />
        {/* Subtle decorative radial glow */}
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-35 blur-3xl pointer-events-none"
          style={{ background: currentPoster.badgeColor }}
        />
      </div>

      {/* Slide Content Layer */}
      <div className="relative z-10 flex flex-col justify-between h-full p-5 sm:p-6 text-white min-h-[380px]">
        {/* 1. Header: Store Badge & Auto-Sync Live Chip */}
        <div className="flex items-center justify-between gap-2">
          {/* Store Name Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/20 shadow-sm">
            <span className="text-base">{currentPoster.storeLogo}</span>
            <span className="text-xs font-bold tracking-wide text-white/95">
              {currentPoster.storeName}
            </span>
          </div>

          {/* Flash Deal Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-md bg-amber-400 text-slate-950 animate-pulse">
            <FireFilled className="text-rose-600" />
            <span>Limited Offer</span>
          </div>
        </div>

        {/* 2. Middle Body: Discount Badge, Headline & Subtitle */}
        <div className="my-auto pt-3 pb-2 space-y-2">
          {/* Badge Tag */}
          <div>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider shadow-lg backdrop-blur-xs text-white"
              style={{ background: currentPoster.badgeBg }}
            >
              <ThunderboltFilled />
              {currentPoster.badge}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-md">
            {currentPoster.title}
          </h3>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-slate-200/90 leading-snug line-clamp-2 drop-shadow-xs max-w-md">
            {currentPoster.subtitle}
          </p>

          {/* Pricing & Voucher Row */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Price Pill */}
            <div className="flex items-baseline gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15">
              <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
                {currentPoster.promoPrice}
              </span>
              <span className="text-xs text-slate-400 line-through font-mono">
                {currentPoster.originalPrice}
              </span>
              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded-md">
                {currentPoster.savings}
              </span>
            </div>

            {/* Voucher Coupon Badge */}
            <button
              type="button"
              onClick={(e) => handleCopyCode(currentPoster.couponCode, e)}
              className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 border border-white/30 active:scale-95 transition-all text-white px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-bold cursor-pointer backdrop-blur-md"
              title="Click to copy promo code"
            >
              <TagFilled className="text-amber-400" />
              <span>{currentPoster.couponCode}</span>
              {copiedCode === currentPoster.couponCode ? (
                <CheckOutlined className="text-emerald-400 ml-0.5" />
              ) : (
                <CopyOutlined className="text-slate-300 ml-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* 3. Footer: Navigation Arrows, Carousel Dots, & Action Button */}
        <div className="pt-3 border-t border-white/15 flex items-center justify-between gap-3">
          {/* Carousel Slide Indicators */}
          <div className="flex items-center gap-1.5">
            {PROMO_POSTERS.map((poster, idx) => (
              <button
                key={poster.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === currentIndex
                    ? 'w-6 h-2 bg-white'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
            <span className="text-[10px] font-mono text-slate-300 ml-1.5 font-bold">
              {currentIndex + 1}/{totalPosters}
            </span>
          </div>

          {/* Action Row: Left / Right controls & CTA */}
          <div className="flex items-center gap-2">
            {/* Prev / Next Nav Buttons */}
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md rounded-xl p-0.5 border border-white/15">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous poster"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 active:scale-90 transition cursor-pointer text-xs"
              >
                <LeftOutlined />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next poster"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 active:scale-90 transition cursor-pointer text-xs"
              >
                <RightOutlined />
              </button>
            </div>

            {/* Primary Order / Claim CTA */}
            <button
              type="button"
              onClick={() => handlePosterClick(currentPoster)}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black shadow-lg text-white hover:opacity-95 active:scale-95 transition-all cursor-pointer"
              style={{
                background: currentPoster.accentColor || '#2F6FED',
                boxShadow: `0 6px 18px ${currentPoster.accentColor || '#2F6FED'}55`,
              }}
            >
              <span>{currentPoster.ctaText}</span>
              <ArrowRightOutlined className="text-[11px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
