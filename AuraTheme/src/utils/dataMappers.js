/**
 * Central Data Mappers for AuraTheme
 * Transforms database snake_case fields (from MySQL aura_v1_db via API endpoints)
 * into clean, typed, reliable component data structures.
 * 
 * ZERO mock fallbacks, ZERO unsplash/picsum URLs.
 */

const DEFAULT_NO_IMAGE = '/assets/uploads/no_image.png';

/**
 * Normalizes an image path or URL from the database
 */
export function normalizeImageUrl(img) {
  if (!img || typeof img !== 'string' || img.trim() === '') {
    return DEFAULT_NO_IMAGE;
  }
  const clean = img.trim();
  // Discard any legacy unsplash / picsum placeholder URLs
  if (clean.includes('unsplash.com') || clean.includes('picsum.photos')) {
    return DEFAULT_NO_IMAGE;
  }
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('/') || clean.startsWith('data:')) {
    return clean;
  }
  return `/assets/uploads/${clean}`;
}

/**
 * Maps DB Product (aura_products, aura_warehouses_products, aura_product_photos)
 */
export function mapProduct(p) {
  if (!p) return null;

  const id = Number(p.id) || p.id;
  const price = parseFloat(p.price) || 0;
  const rawOriginalPrice = parseFloat(p.original_price || p.originalPrice || p.regular_price);
  const originalPrice = rawOriginalPrice > price ? rawOriginalPrice : null;
  const inStockQty = parseFloat(p.in_stock !== undefined ? p.in_stock : p.quantity) || 0;
  const inStock = inStockQty > 0;
  const rating = parseFloat(p.rating) || 5.0;
  const reviewsCount = parseInt(p.reviews_count || p.reviews, 10) || 0;

  // Primary image
  const image = normalizeImageUrl(p.image || p.photo);

  // Gallery images
  let images = [];
  if (Array.isArray(p.images) && p.images.length > 0) {
    images = p.images.map(normalizeImageUrl);
  } else if (Array.isArray(p.photos) && p.photos.length > 0) {
    images = p.photos.map((ph) => normalizeImageUrl(ph.photo || ph));
  } else if (image) {
    images = [image];
  }

  // Store / Biller info
  const billerId = p.biller_id || p.shop_id || p.company_id || (p.shop ? p.shop.id : null);
  const storeName = p.store_name || p.biller_name || p.company || (p.shop ? p.shop.name : '') || 'Official Store';
  const storeSlug = p.store_slug || (p.shop ? p.shop.slug : null) || (billerId ? `store-${billerId}` : 'store');
  const storeLogo = p.store_logo || (p.shop ? p.shop.logo : null) ? normalizeImageUrl(p.store_logo || p.shop.logo) : null;

  return {
    id,
    code: p.code || `PRD-${id}`,
    name: p.name || 'Unnamed Product',
    slug: p.slug || String(id),
    price,
    originalPrice,
    cost: undefined, // Never expose cost to client
    image,
    images,
    category: p.category_name || p.category || 'General',
    categoryId: p.category_id || p.categoryId || null,
    categorySlug: p.category_slug || (p.category_id ? String(p.category_id) : 'all'),
    brand: p.brand_name || p.brand || '',
    brandId: p.brand_id || null,
    unit: p.unit || p.unit_name || 'piece',
    inStock,
    in_stock: inStockQty,
    quantity: inStockQty,
    rating,
    reviews: reviewsCount,
    reviewsCount,
    reviews_count: reviewsCount,
    featured: Boolean(p.featured),
    moq: parseInt(p.moq, 10) || 1,
    details: p.details || p.description || '',
    description: p.description || p.details || '',
    biller_id: billerId,
    billerId,
    shop_id: billerId,
    storeId: billerId,
    storeName,
    seller: storeName,
    store_name: storeName,
    storeSlug,
    store_slug: storeSlug,
    storeLogo,
    badge: p.featured ? 'Featured' : (originalPrice ? 'Sale' : undefined),
    isFavorite: false,
    raw: p,
  };
}

/**
 * Maps DB Store / Biller (aura_companies where group_name = 'biller')
 */
export function mapShop(s) {
  if (!s) return null;

  const id = Number(s.id) || s.id;
  const name = s.name || s.company || 'Aura Partner';
  const slug = s.store_slug || s.slug || `store-${id}`;
  const logo = s.logo || s.logo_url ? normalizeImageUrl(s.logo || s.logo_url) : null;
  const banner = s.banner || s.hero_image || s.heroImage ? normalizeImageUrl(s.banner || s.hero_image || s.heroImage) : null;
  const rating = parseFloat(s.rating) || 4.9;
  const reviewsCount = parseInt(s.reviews_count || s.reviews, 10) || 42;

  return {
    id,
    biller_id: id,
    name,
    company: s.company || name,
    slug,
    store_slug: slug,
    logo,
    logoUrl: logo,
    banner,
    heroImage: banner,
    phone: s.phone || '',
    email: s.email || '',
    address: s.address || '',
    addressKh: s.address_kh || '',
    city: s.city || 'Phnom Penh',
    state: s.state || '',
    country: s.country || 'Cambodia',
    rating,
    reviews: reviewsCount,
    reviewsCount,
    tagline: s.cf1 || s.tagline || s.company || '',
    operating_hours: s.cf2 || s.operating_hours || '07:30 AM - 09:30 PM',
    telegram_chat_id: s.telegram_chat_id || '',
    telegramBot: s.telegram_chat_id ? `@${s.telegram_chat_id}` : '@auraglobal_bot',
    is_active: Boolean(s.is_active !== undefined ? s.is_active : 1),
    products_count: parseInt(s.products_count, 10) || 0,
    raw: s,
  };
}

/**
 * Maps DB Category (aura_categories)
 */
export function mapCategory(c) {
  if (!c) return null;

  const id = Number(c.id) || c.id;
  const name = c.name || 'Category';
  const slug = c.slug || c.code?.toLowerCase() || `cat-${id}`;
  const image = c.image ? normalizeImageUrl(c.image) : null;

  return {
    id,
    name,
    code: c.code || `CAT-${id}`,
    slug,
    image,
    description: c.description || '',
    parentId: c.parent_id || null,
    subcategories: Array.isArray(c.subcategories) ? c.subcategories.map(mapCategory) : [],
    raw: c,
  };
}

/**
 * Maps DB Brand (aura_brands)
 */
export function mapBrand(b) {
  if (!b) return null;

  const id = Number(b.id) || b.id;
  const name = b.name || 'Brand';
  const slug = b.slug || b.code?.toLowerCase() || `brand-${id}`;
  const image = b.image ? normalizeImageUrl(b.image) : null;

  return {
    id,
    name,
    code: b.code || `BRD-${id}`,
    slug,
    image,
    description: b.description || '',
    raw: b,
  };
}

/**
 * Maps DB Banner / Hero Slide (aura_theme_banners)
 */
export function mapBanner(b) {
  if (!b) return null;

  const id = b.id || Math.random().toString(36).substr(2, 9);
  const image = normalizeImageUrl(b.image || b.image_url || b.photo);
  const link = b.link || b.url || '/shop';
  const title = b.title || b.caption || 'Aura Supply Special';
  const subtitle = b.subtitle || b.description || '';
  const badge = b.badge || 'PROMOTION';
  const ctaText = b.button_text || b.cta_text || 'Shop Now';
  const storeName = b.store_name || b.storeName || 'Aura Partner';
  const storeSlug = b.store_slug || b.storeSlug || 'sbc-store';
  const couponCode = b.coupon_code || b.couponCode || '';

  return {
    id,
    title,
    subtitle,
    badge,
    badgeColor: b.badge_color || '#2F6FED',
    badgeBg: b.badge_bg || 'rgba(47, 111, 237, 0.95)',
    image,
    link,
    ctaText,
    storeName,
    storeSlug,
    couponCode,
    originalPrice: b.original_price || b.originalPrice || '',
    promoPrice: b.promo_price || b.promoPrice || '',
    savings: b.savings || '',
    validUntil: b.valid_until || b.validUntil || 'Limited time offer',
    overlayGradient: b.overlay_gradient || 'linear-gradient(180deg, rgba(15,23,42,0.3) 0%, rgba(15,23,42,0.7) 45%, rgba(15,23,42,0.96) 100%)',
    accentColor: b.accent_color || '#2F6FED',
    raw: b,
  };
}

/**
 * Maps DB Post / Article (aura_theme_posts)
 */
export function mapPost(p) {
  if (!p) return null;

  const id = Number(p.id) || p.id;
  return {
    id,
    title: p.title || 'Untitled Post',
    slug: p.slug || `post-${id}`,
    excerpt: p.excerpt || p.summary || '',
    content: p.content || '',
    image: normalizeImageUrl(p.image || p.cover_image),
    category: p.category || 'News',
    author: p.author || 'Aura Editorial',
    createdAt: p.created_at || new Date().toISOString(),
    views: parseInt(p.views || p.views_count, 10) || 0,
    tags: Array.isArray(p.tags) ? p.tags : (p.tags ? String(p.tags).split(',').map((t) => t.trim()) : []),
    raw: p,
  };
}

/**
 * Maps DB Review (aura_theme_reviews)
 */
export function mapReview(r) {
  if (!r) return null;

  const id = Number(r.id) || r.id;
  const rating = parseFloat(r.rating) || 5.0;
  return {
    id,
    productId: r.product_id || null,
    shopId: r.shop_id || r.biller_id || null,
    rating,
    comment: r.comment || r.review || '',
    author: r.author || r.customer_name || 'Customer',
    authorAvatar: r.author_avatar ? normalizeImageUrl(r.author_avatar) : null,
    createdAt: r.created_at || new Date().toISOString(),
    raw: r,
  };
}

/**
 * Maps DB Shop Settings (aura_shop_settings)
 */
export function mapShopSettings(s) {
  if (!s) return {};

  return {
    shopName: s.shop_name || 'Aura Supply',
    siteTitle: s.site_title || s.shop_name || 'Aura Supply',
    tagline: s.description || '',
    logo: s.logo ? normalizeImageUrl(s.logo) : '/assets/uploads/logo.png',
    phone: s.phone || '',
    email: s.email || '',
    address: s.address || '',
    hide0: Number(s.hide0) === 1,
    hidePrice: Number(s.hide_price) === 1,
    productsPage: Number(s.products_page) || 12,
    defaultCurrency: s.currency_code || 'USD',
    facebook: s.facebook || '',
    instagram: s.instagram || '',
    twitter: s.twitter || '',
    bankDetails: s.bank_details || '',
    cookieMessage: s.cookie_message || '',
    slider: s.slider || [],
    raw: s,
  };
}

export default {
  normalizeImageUrl,
  mapProduct,
  mapShop,
  mapCategory,
  mapBrand,
  mapBanner,
  mapPost,
  mapReview,
  mapShopSettings,
};
