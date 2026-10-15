import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { message, Spin } from 'antd';
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
import { fetchBanners } from '../../../utils/apiconfig';
import { mapBanner } from '../../../utils/dataMappers';

export default function PromotionPosterSlider({ onSelectPoster }) {
  const navigate = useNavigate();
  const [posters, setPosters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const autoPlayTimerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    fetchBanners()
      .then((res) => {
        if (!isMounted) return;
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          setPosters(res.data.map(mapBanner));
        } else if (Array.isArray(res?.banners) && res.banners.length > 0) {
          setPosters(res.banners.map(mapBanner));
        } else {
          setPosters([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Banners fetch error:', err);
        setPosters([]);
        setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  const totalPosters = posters.length;
  const currentPoster = totalPosters > 0 ? (posters[currentIndex] || posters[0]) : null;

  const handleNext = useCallback(() => {
    if (totalPosters <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % totalPosters);
  }, [totalPosters]);

  const handlePrev = useCallback(() => {
    if (totalPosters <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + totalPosters) % totalPosters);
  }, [totalPosters]);

  // Auto-play timer (slides every 4.8 seconds when not hovered)
  useEffect(() => {
    if (isPaused || totalPosters <= 1) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      handleNext();
    }, 4800);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isPaused, handleNext, totalPosters]);

  const handleCopyCoupon = (code, e) => {
    e.stopPropagation();
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    message.success(`Copied code: ${code}`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handlePosterClick = (poster) => {
    if (onSelectPoster) {
      onSelectPoster(poster);
      return;
    }
    if (poster?.link) {
      if (poster.link.startsWith('http')) {
        window.open(poster.link, '_blank');
      } else {
        navigate(poster.link);
      }
      return;
    }
    if (poster?.storeSlug) {
      navigate(`/shop/${poster.storeSlug}`);
    } else {
      navigate('/shop');
    }
  };

  if (loading) {
    return (
      <div className="w-full h-48 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
        <Spin size="default" />
      </div>
    );
  }

  if (!currentPoster) {
    return null;
  }

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl shadow-xl transition-all duration-300 group select-none mb-6 border border-slate-200/80 dark:border-slate-800"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{ minHeight: '260px' }}
    >
      {/* Background Hero Banner */}
      <div className="absolute inset-0 z-0">
        <img
          src={currentPoster.image}
          alt={currentPoster.title}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/assets/uploads/no_image.png';
          }}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-103"
        />
        <div
          className="absolute inset-0"
          style={{ background: currentPoster.overlayGradient }}
        />
      </div>

      {/* Foreground Content Card */}
      <div className="relative z-10 flex flex-col justify-between h-full p-5 sm:p-7 text-white min-h-[260px]">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-black tracking-wide uppercase shadow-sm"
              style={{
                backgroundColor: currentPoster.badgeBg,
                color: '#ffffff',
              }}
            >
              <FireFilled className="text-amber-300" />
              {currentPoster.badge}
            </span>
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-300/90 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
              {currentPoster.validUntil}
            </span>
          </div>

          {currentPoster.couponCode && (
            <button
              type="button"
              onClick={(e) => handleCopyCoupon(currentPoster.couponCode, e)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold transition active:scale-95 border border-white/25 cursor-pointer"
              title="Click to copy coupon code"
            >
              {copiedCode === currentPoster.couponCode ? (
                <>
                  <CheckOutlined className="text-emerald-400" />
                  <span className="text-emerald-300 font-mono font-bold">COPIED!</span>
                </>
              ) : (
                <>
                  <TagFilled className="text-amber-300" />
                  <span className="font-mono">{currentPoster.couponCode}</span>
                  <CopyOutlined className="text-[11px] opacity-75" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Center Headline & Value Prop */}
        <div className="my-auto py-3 max-w-2xl cursor-pointer" onClick={() => handlePosterClick(currentPoster)}>
          <div className="flex items-center gap-2 mb-1.5 text-xs sm:text-sm font-semibold text-slate-200">
            <span>{currentPoster.storeName}</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight mb-2 drop-shadow-md text-white">
            {currentPoster.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-200/90 line-clamp-2 leading-relaxed drop-shadow-xs max-w-xl">
            {currentPoster.subtitle}
          </p>

          {/* Pricing Row if available */}
          {(currentPoster.promoPrice || currentPoster.savings) && (
            <div className="flex items-baseline gap-2.5 mt-3">
              {currentPoster.promoPrice && (
                <span className="text-2xl sm:text-3xl font-black text-amber-300 drop-shadow-sm">
                  {currentPoster.promoPrice}
                </span>
              )}
              {currentPoster.originalPrice && (
                <span className="text-sm line-through text-slate-400">
                  {currentPoster.originalPrice}
                </span>
              )}
              {currentPoster.savings && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/80 backdrop-blur-xs text-white text-[11px] font-black uppercase">
                  {currentPoster.savings}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom Pagination & CTAs */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {/* Slide Indicator Dots */}
          <div className="flex items-center gap-1.5">
            {posters.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to poster ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  currentIndex === idx
                    ? 'w-6 h-2 bg-white shadow-sm'
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
