/**
 * Utility functions to calculate rendered header height and update CSS custom properties dynamically.
 */

export const DEFAULT_HEADER_HEIGHT = 52;

/**
 * Calculates rendered height of a header element (or elements matching a selector).
 * @param {HTMLElement|string|object|null} target
 * @returns {number} rendered height in px
 */
export function calculateHeaderHeight(target) {
  if (typeof window === 'undefined') return DEFAULT_HEADER_HEIGHT;

  let element = null;
  if (typeof target === 'string') {
    element = document.querySelector(target);
  } else if (target && target.nodeType === Node.ELEMENT_NODE) {
    element = target;
  } else if (target && target.current) {
    element = target.current;
  }

  if (!element) {
    element = document.querySelector('.header, .app-sticky-header, header');
  }

  if (!element) return DEFAULT_HEADER_HEIGHT;

  const rect = element.getBoundingClientRect();
  const height = rect.height || element.offsetHeight || DEFAULT_HEADER_HEIGHT;
  return Math.round(height);
}

/**
 * Updates the '--header-height' CSS variable dynamically on document.documentElement.
 * @param {number|HTMLElement|string|object} valueOrTarget
 * @returns {number} the applied height in px
 */
export function updateHeaderHeightCSS(valueOrTarget) {
  if (typeof document === 'undefined') return DEFAULT_HEADER_HEIGHT;

  let height = DEFAULT_HEADER_HEIGHT;
  if (typeof valueOrTarget === 'number' && !isNaN(valueOrTarget) && valueOrTarget > 0) {
    height = Math.round(valueOrTarget);
  } else {
    height = calculateHeaderHeight(valueOrTarget);
  }

  const heightPx = `${height}px`;
  document.documentElement.style.setProperty('--header-height', heightPx);
  if (document.body) {
    document.body.style.setProperty('--header-height', heightPx);
  }

  // Dispatch custom event for any other subscribers
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('headerHeightChange', {
        detail: { height, heightPx },
      })
    );
  }

  return height;
}
