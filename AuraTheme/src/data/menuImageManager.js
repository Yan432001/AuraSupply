// Menu Image Manager
// Manages real-time image deletions & restorations for E-Menu and Telegram Store & Group Manager

const DELETED_IMAGES_KEY = 'aura_menu_deleted_images_v1';
const DELETED_LOGOS_KEY = 'aura_menu_deleted_logos_v1';

/**
 * Get all deleted images or filtered by store slug
 */
export const getDeletedImages = (storeSlug = null) => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(DELETED_IMAGES_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    if (!storeSlug || storeSlug === 'all') return list;
    return list.filter((item) => item.storeSlug === storeSlug);
  } catch (err) {
    console.warn('[menuImageManager] Error reading deleted images:', err);
    return [];
  }
};

/**
 * Check if a specific product image has been deleted
 */
export const isImageDeleted = (productId, storeSlug = null) => {
  if (!productId) return false;
  const deleted = getDeletedImages(storeSlug);
  return deleted.some((item) => String(item.productId) === String(productId));
};

/**
 * Delete a product image from E-Menu
 */
export const deleteProductImage = (productId, storeSlug, productName = '', originalImage = '') => {
  if (!productId) return null;
  const list = getDeletedImages(); // get all
  const existingIdx = list.findIndex(
    (item) => String(item.productId) === String(productId) && (!storeSlug || item.storeSlug === storeSlug)
  );

  const record = {
    id: `del_img_${productId}_${Date.now()}`,
    productId: String(productId),
    storeSlug: storeSlug || 'general',
    productName: productName || `Product #${productId}`,
    originalImage: originalImage || '',
    deletedAt: Date.now(),
    deletedAtFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    deletedBy: 'Merchant (Yin)',
  };

  let updatedList;
  if (existingIdx >= 0) {
    updatedList = [...list];
    updatedList[existingIdx] = record;
  } else {
    updatedList = [record, ...list];
  }

  try {
    window.localStorage.setItem(DELETED_IMAGES_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(
      new CustomEvent('aura_menu_image_updated', {
        detail: { action: 'delete', productId, storeSlug, record },
      })
    );
  } catch (err) {
    console.error('[menuImageManager] Error saving deletion:', err);
  }

  return record;
};

/**
 * Restore a deleted product image back to the E-Menu
 */
export const restoreProductImage = (productId, storeSlug = null) => {
  if (!productId) return false;
  const list = getDeletedImages();
  const updatedList = list.filter(
    (item) => !(String(item.productId) === String(productId) && (!storeSlug || item.storeSlug === storeSlug))
  );

  try {
    window.localStorage.setItem(DELETED_IMAGES_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(
      new CustomEvent('aura_menu_image_updated', {
        detail: { action: 'restore', productId, storeSlug },
      })
    );
    return true;
  } catch (err) {
    console.error('[menuImageManager] Error restoring image:', err);
    return false;
  }
};

/**
 * Get all deleted store logos
 */
export const getDeletedStoreLogos = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(DELETED_LOGOS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

/**
 * Check if a store's logo image has been deleted
 */
export const isStoreLogoDeleted = (storeSlug) => {
  if (!storeSlug) return false;
  const deleted = getDeletedStoreLogos();
  return deleted.some((item) => item.storeSlug === storeSlug);
};

/**
 * Delete a store's logo image
 */
export const deleteStoreLogo = (storeSlug, storeName = '', originalLogo = '') => {
  if (!storeSlug) return null;
  const list = getDeletedStoreLogos();
  const filtered = list.filter((item) => item.storeSlug !== storeSlug);
  const record = {
    storeSlug,
    storeName: storeName || storeSlug,
    originalLogo,
    deletedAt: Date.now(),
    deletedAtFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  const updated = [record, ...filtered];

  try {
    window.localStorage.setItem(DELETED_LOGOS_KEY, JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent('aura_menu_image_updated', {
        detail: { action: 'delete_logo', storeSlug, record },
      })
    );
  } catch (err) {
    console.error(err);
  }

  return record;
};

/**
 * Restore a store's logo image
 */
export const restoreStoreLogo = (storeSlug) => {
  if (!storeSlug) return false;
  const list = getDeletedStoreLogos();
  const updated = list.filter((item) => item.storeSlug !== storeSlug);

  try {
    window.localStorage.setItem(DELETED_LOGOS_KEY, JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent('aura_menu_image_updated', {
        detail: { action: 'restore_logo', storeSlug },
      })
    );
    return true;
  } catch {
    return false;
  }
};

/**
 * Count total deleted images for a specific store
 */
export const getStoreDeletedCount = (storeSlug) => {
  const images = getDeletedImages(storeSlug).length;
  const logo = isStoreLogoDeleted(storeSlug) ? 1 : 0;
  return images + logo;
};
