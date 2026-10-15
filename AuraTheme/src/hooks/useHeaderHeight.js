import { useState, useEffect, useRef, useCallback } from 'react';
import {
  calculateHeaderHeight,
  updateHeaderHeightCSS,
  DEFAULT_HEADER_HEIGHT,
} from '../utils/headerHeight';

/**
 * Custom React hook that calculates the rendered height of the header component
 * and updates the '--header-height' CSS variable dynamically for any screen size.
 *
 * Usage examples:
 * 1. Self-contained ref:
 *    const { headerRef, height } = useHeaderHeight();
 *    return <header ref={headerRef} className="header app-sticky-header">...</header>;
 *
 * 2. Observing an existing ref:
 *    const myRef = useRef(null);
 *    useHeaderHeight(myRef);
 *
 * 3. Global / selector observation:
 *    useHeaderHeight({ selector: '.app-sticky-header' });
 *
 * @param {React.RefObject|HTMLElement|string|object} [targetOrOptions]
 * @returns {{ headerRef: React.RefObject, height: number, updateHeight: Function }}
 */
export function useHeaderHeight(targetOrOptions) {
  const internalRef = useRef(null);
  const [height, setHeight] = useState(DEFAULT_HEADER_HEIGHT);

  let externalRef = null;
  let selector = null;

  if (targetOrOptions) {
    if (targetOrOptions.current !== undefined) {
      externalRef = targetOrOptions;
    } else if (typeof targetOrOptions === 'string') {
      selector = targetOrOptions;
    } else if (targetOrOptions.selector) {
      selector = targetOrOptions.selector;
    } else if (targetOrOptions.ref) {
      externalRef = targetOrOptions.ref;
    }
  }

  const effectiveRef = externalRef || internalRef;

  const measureAndUpdate = useCallback(() => {
    if (typeof window === 'undefined') return DEFAULT_HEADER_HEIGHT;

    let element = effectiveRef.current;
    if (!element && selector) {
      element = document.querySelector(selector);
    }
    if (!element) {
      element = document.querySelector('.header, .app-sticky-header, header');
    }

    if (element) {
      const rect = element.getBoundingClientRect();
      const measuredHeight = Math.round(
        rect.height || element.offsetHeight || DEFAULT_HEADER_HEIGHT
      );
      if (measuredHeight > 0) {
        setHeight(measuredHeight);
        updateHeaderHeightCSS(measuredHeight);
        return measuredHeight;
      }
    }
    return DEFAULT_HEADER_HEIGHT;
  }, [effectiveRef, selector]);

  useEffect(() => {
    // Initial measurement after mount/render
    measureAndUpdate();

    let element = effectiveRef.current;
    if (!element && selector) {
      element = document.querySelector(selector);
    }
    if (!element) {
      element = document.querySelector('.header, .app-sticky-header, header');
    }

    // ResizeObserver tracks dynamic element size changes
    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined' && element) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const newHeight = Math.round(
            entry.borderBoxSize?.[0]?.blockSize ||
              entry.contentRect?.height ||
              element.getBoundingClientRect().height
          );
          if (newHeight > 0) {
            setHeight(newHeight);
            updateHeaderHeightCSS(newHeight);
          }
        }
      });
      resizeObserver.observe(element);
    }

    // Window resize & orientation change listeners
    const handleResize = () => {
      measureAndUpdate();
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    // Telegram Mini App viewport change listener
    const tg = typeof window !== 'undefined' && window.Telegram?.WebApp;
    if (tg?.onEvent) {
      try {
        tg.onEvent('viewportChanged', handleResize);
      } catch (_) {}
    }

    return () => {
      if (resizeObserver && element) {
        resizeObserver.unobserve(element);
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (tg?.offEvent) {
        try {
          tg.offEvent('viewportChanged', handleResize);
        } catch (_) {}
      }
    };
  }, [measureAndUpdate, effectiveRef, selector]);

  return {
    headerRef: effectiveRef,
    height,
    updateHeight: measureAndUpdate,
  };
}

// Re-export utility functions for convenience
export { calculateHeaderHeight, updateHeaderHeightCSS, DEFAULT_HEADER_HEIGHT };
export default useHeaderHeight;
