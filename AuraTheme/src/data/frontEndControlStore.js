import { sellers, defaultMasterProducts, getLiveProducts, saveLiveProducts } from './shopData';

export const FRONTEND_STORES_KEY = 'aura_frontend_stores_v3';
export const FRONTEND_SETTINGS_KEY = 'aura_frontend_settings_v2';
export const FRONTEND_SLIDES_KEY = 'aura_frontend_slides_v2';
export const FRONTEND_PAGES_KEY = 'aura_frontend_pages_v2';

export const initialStores = sellers.map((seller, idx) => ({
  ...seller,
  activeOnWebsite: true,
  featuredOnHome: idx < 4,
  isFlagship: idx === 0,
  order: idx + 1,
  openHours: idx % 2 === 0 ? '07:00 AM - 10:00 PM' : '08:00 AM - 09:30 PM',
  deliveryAvailable: true,
  telegramBot: '@auraglobal_bot',
  contactPhone: '+855 23 888 ' + (100 + idx),
}));

export const initialStorefrontSettings = {
  announcement: {
    enabled: true,
    text: '🎉 Grand Opening Special: 15% OFF on all bakery & coffee orders with code AURA2026 | Order via Telegram Mini App',
    bgColor: '#059669',
    textColor: '#ffffff',
    link: '/shops',
    buttonText: 'Order Now',
  },
  sections: {
    heroSlider: true,
    featuredStores: true,
    popularCategories: true,
    trendingProducts: true,
    telegramBanner: true,
    customerReviews: true,
    branchLocations: true,
  },
  theme: {
    primaryColor: '#10b981',
    layoutMode: 'grid', // 'grid' | 'compact' | 'editorial'
    currency: 'USD',
    productsPerPage: 12,
    showPricesDual: true, // Show both $ and ៛
    directTelegramOrder: true,
  },
  branding: {
    siteTitle: 'Aura Supply Marketplace & Multi-Store E-Menu',
    tagline: 'Specialty Coffee, Artisanal Bakery, Workstations & Modern Living',
    logoUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=200&q=80',
    supportEmail: 'hello@auraglobal.com',
    supportTelegram: '@auraglobal_support',
  },
};

export const initialHeroSlides = [
  {
    id: 1,
    title: 'Artisanal Specialty Coffee & Roastery',
    subtitle: 'Direct-trade highland Arabica, signature espresso roasts, and iced Spanish lattes.',
    badge: '☕ Single Origin Roastery',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1600&h=900&fit=crop',
    buttonText: 'Order Coffee Online',
    link: '/shops/sbc-store',
    targetShop: 'sbc-store',
    active: true,
    order: 1,
  },
  {
    id: 2,
    title: 'French Viennoiserie & Fresh Bakery',
    subtitle: 'Golden flaky croissants, artisan sourdough loaves, and sweet morning crepes.',
    badge: '🥐 Baked Fresh Daily',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=1600&h=900&fit=crop',
    buttonText: 'Discover Bakery Menu',
    link: '/shops/aura-bakery',
    targetShop: 'aura-bakery',
    active: true,
    order: 2,
  },
  {
    id: 3,
    title: 'Parisian Bistro & Gourmet Dining',
    subtitle: 'Flame-grilled Wagyu burgers, Neapolitan sourdough pizza, and al dente pastas.',
    badge: '🍽️ Chef Specials',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&h=900&fit=crop',
    buttonText: 'Reserve Table & Order',
    link: '/shops/aura-bistro',
    targetShop: 'aura-bistro',
    active: true,
    order: 3,
  },
  {
    id: 4,
    title: 'Pro Workstations & Liquid-Cooled Rigs',
    subtitle: 'High-performance creator laptops, color-calibrated 4K displays, and custom rigs.',
    badge: '💻 Apex PC Gear',
    image: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=1600&h=900&fit=crop',
    buttonText: 'Explore Tech Shop',
    link: '/shops/apex-pc',
    targetShop: 'apex-pc',
    active: true,
    order: 4,
  },
];

export const initialPages = [
  {
    id: 'about',
    title: 'About Aura Global Platform',
    slug: 'about',
    category: 'Company',
    status: 'published',
    views: 4890,
    lastUpdated: '2026-09-15',
    summary: 'Discover the vision behind Aura Global multi-store retail and food-service ecosystem.',
  },
  {
    id: 'sourcing',
    title: 'Highland Direct-Trade Sourcing Story',
    slug: 'sourcing',
    category: 'Origins',
    status: 'published',
    views: 3120,
    lastUpdated: '2026-09-20',
    summary: 'Partnering directly with local farmers in Mondulkiri and regional sustainable plantations.',
  },
  {
    id: 'delivery',
    title: 'Express Delivery & Telegram Ordering Guide',
    slug: 'delivery',
    category: 'Customer Care',
    status: 'published',
    views: 6540,
    lastUpdated: '2026-09-28',
    summary: 'How to order in 3 clicks with instant QR payment and real-time live rider tracking.',
  },
  {
    id: 'terms',
    title: 'Store Policies, Terms & Return Standards',
    slug: 'terms',
    category: 'Legal',
    status: 'published',
    views: 1210,
    lastUpdated: '2026-08-30',
    summary: 'Quality guarantees, food safety certifications, and customer return policies.',
  },
];

// Helper functions with localStorage sync and CustomEvent dispatch
export const getLiveStores = () => {
  if (typeof window === 'undefined') return initialStores;
  try {
    const raw = window.localStorage.getItem(FRONTEND_STORES_KEY);
    if (!raw) return initialStores;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length >= initialStores.length ? parsed : initialStores;
  } catch (e) {
    console.warn('Failed reading frontend stores:', e);
    return initialStores;
  }
};

export const saveLiveStores = (stores) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FRONTEND_STORES_KEY, JSON.stringify(stores));
    window.dispatchEvent(new CustomEvent('aura_frontend_stores_updated', { detail: stores }));
  } catch (e) {
    console.error('Failed saving frontend stores:', e);
  }
};

export const getStorefrontSettings = () => {
  if (typeof window === 'undefined') return initialStorefrontSettings;
  try {
    const raw = window.localStorage.getItem(FRONTEND_SETTINGS_KEY);
    if (!raw) return initialStorefrontSettings;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed reading storefront settings:', e);
    return initialStorefrontSettings;
  }
};

export const saveStorefrontSettings = (settings) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FRONTEND_SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('aura_frontend_settings_updated', { detail: settings }));
  } catch (e) {
    console.error('Failed saving storefront settings:', e);
  }
};

export const getHeroSlides = () => {
  if (typeof window === 'undefined') return initialHeroSlides;
  try {
    const raw = window.localStorage.getItem(FRONTEND_SLIDES_KEY);
    if (!raw) return initialHeroSlides;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialHeroSlides;
  } catch (e) {
    console.warn('Failed reading hero slides:', e);
    return initialHeroSlides;
  }
};

export const saveHeroSlides = (slides) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FRONTEND_SLIDES_KEY, JSON.stringify(slides));
    window.dispatchEvent(new CustomEvent('aura_frontend_slides_updated', { detail: slides }));
  } catch (e) {
    console.error('Failed saving hero slides:', e);
  }
};

export const getPublicPages = () => {
  if (typeof window === 'undefined') return initialPages;
  try {
    const raw = window.localStorage.getItem(FRONTEND_PAGES_KEY);
    if (!raw) return initialPages;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialPages;
  } catch (e) {
    console.warn('Failed reading public pages:', e);
    return initialPages;
  }
};

export const savePublicPages = (pages) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FRONTEND_PAGES_KEY, JSON.stringify(pages));
    window.dispatchEvent(new CustomEvent('aura_frontend_pages_updated', { detail: pages }));
  } catch (e) {
    console.error('Failed saving public pages:', e);
  }
};
