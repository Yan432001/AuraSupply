const fs = require('fs');

let code = fs.readFileSync('AuraTheme/src/pages/admins/AdminFrontEndManager.jsx', 'utf8');

// Replace imports
const oldImports = `import {
  getLiveStores,
  saveLiveStores,
  getStorefrontSettings,
  saveStorefrontSettings,
  getHeroSlides,
  saveHeroSlides,
  getPublicPages,
  savePublicPages,
} from '../../data/frontEndControlStore';
import {
  getAllStoreTelegramConfigs,
  getStoreTelegramConfig,
  saveStoreTelegramConfig,
  sendTestGroupNotification,
  getTelegramRoutingLogs,
  syncStoreTelegramConfigsWithServer,
} from '../../data/telegramStoreGroupManager';
import {
  getLiveProducts,
  saveLiveProducts,
  shopCategories,
  branches,
} from '../../data/shopData';`;

const newImports = `import {
  getAllStoreTelegramConfigs,
  getStoreTelegramConfig,
  saveStoreTelegramConfig,
  sendTestGroupNotification,
  getTelegramRoutingLogs,
  syncStoreTelegramConfigsWithServer,
} from '../../data/telegramStoreGroupManager';
import { fetchCategories, fetchBranches, fetchShops, fetchProducts, fetchBanners, fetchShopSettings } from '../../utils/apiconfig';

const FRONTEND_STORES_KEY = 'aura_frontend_stores_v3';
const FRONTEND_SETTINGS_KEY = 'aura_frontend_settings_v2';
const FRONTEND_SLIDES_KEY = 'aura_frontend_slides_v2';
const FRONTEND_PAGES_KEY = 'aura_frontend_pages_v2';
const LIVE_PRODUCTS_KEY = 'aura_admin_live_products_v2';

const getLiveStores = () => {
  try {
    const raw = localStorage.getItem(FRONTEND_STORES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
const saveLiveStores = (st) => {
  try {
    localStorage.setItem(FRONTEND_STORES_KEY, JSON.stringify(st));
  } catch (_) {}
};
const getStorefrontSettings = () => {
  try {
    const raw = localStorage.getItem(FRONTEND_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { announcement: { enabled: true, text: 'Aura Supply Storefront' }, branding: { siteTitle: 'Aura Supply' } };
  } catch {
    return { announcement: { enabled: true, text: 'Aura Supply Storefront' }, branding: { siteTitle: 'Aura Supply' } };
  }
};
const saveStorefrontSettings = (s) => {
  try {
    localStorage.setItem(FRONTEND_SETTINGS_KEY, JSON.stringify(s));
  } catch (_) {}
};
const getHeroSlides = () => {
  try {
    const raw = localStorage.getItem(FRONTEND_SLIDES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
const saveHeroSlides = (sl) => {
  try {
    localStorage.setItem(FRONTEND_SLIDES_KEY, JSON.stringify(sl));
  } catch (_) {}
};
const getPublicPages = () => {
  try {
    const raw = localStorage.getItem(FRONTEND_PAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
const savePublicPages = (p) => {
  try {
    localStorage.setItem(FRONTEND_PAGES_KEY, JSON.stringify(p));
  } catch (_) {}
};
const getLiveProducts = () => {
  try {
    const raw = localStorage.getItem(LIVE_PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
const saveLiveProducts = (p) => {
  try {
    localStorage.setItem(LIVE_PRODUCTS_KEY, JSON.stringify(p));
  } catch (_) {}
};`;

if (!code.includes(oldImports)) {
  console.error('Could not find oldImports');
  process.exit(1);
}
code = code.replace(oldImports, newImports);

// Replace placeholders
code = code.replace(/https:\/\/images\.unsplash\.com\/\.\.\./g, '/assets/uploads/image.png or https://...');

// Add state for categories and branches inside component
const compStart = 'export default function AdminFrontEndManager({ initialTab }) {';
const compAdd = `export default function AdminFrontEndManager({ initialTab }) {
  const [shopCategories, setShopCategories] = useState([]);
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    fetchCategories().then(res => { if (res?.success && Array.isArray(res.data)) setShopCategories(res.data); });
    fetchBranches().then(res => { if (res?.success && Array.isArray(res.data)) setBranches(res.data); });
    fetchShops().then(res => { if (res?.success && Array.isArray(res.data) && res.data.length > 0) setStores(res.data); });
    fetchProducts({ limit: 100 }).then(res => { if (res?.success && Array.isArray(res.data) && res.data.length > 0) setProducts(res.data); });
    fetchBanners().then(res => { if (res?.success && Array.isArray(res.data) && res.data.length > 0) setSlides(res.data); });
  }, []);`;

code = code.replace(compStart, compAdd);

fs.writeFileSync('AuraTheme/src/pages/admins/AdminFrontEndManager.jsx', code, 'utf8');
console.log('Successfully updated AdminFrontEndManager.jsx');
