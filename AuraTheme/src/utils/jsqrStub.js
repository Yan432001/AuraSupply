/**
 * Safe fallback stub for jsQR when the npm package is not installed locally.
 */
export default function jsQR(data, width, height, options) {
  if (typeof window !== 'undefined' && window.jsQR) {
    return window.jsQR(data, width, height, options);
  }
  return null;
}
