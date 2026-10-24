/**
 * AuraTheme API Client Configuration & Data Fetchers
 * Connects directly to backend API backed by MySQL (aura_v1_db)
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const APIConfig = {
  baseURL: BASE_URL,
  version: '1.0',
  token: '',
  headers: {
    'Content-Type': 'application/json'
  }
};

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const authToken = localStorage.getItem('aura_web_token') || localStorage.getItem('aura_admin_token') || localStorage.getItem('token');
  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers
    },
    ...options
  };

  try {
    const res = await fetch(url, config);
    const json = await res.json();
    return json;
  } catch (err) {
    console.error(`[API Error] ${options.method || 'GET'} ${url}:`, err);
    return { success: false, status: false, error: err.message, data: null };
  }
}

// 1. Products Catalog
export async function fetchProducts(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '' && val !== 'all') {
      searchParams.set(key, val);
    }
  });
  const queryString = searchParams.toString();
  return request(`/products${queryString ? `?${queryString}` : ''}`);
}

export async function fetchProductBySlug(slug) {
  return request(`/products/${encodeURIComponent(slug)}`);
}

// 2. Categories & Brands
export async function fetchCategories() {
  return request('/categories');
}

export async function fetchBrands() {
  return request('/brands');
}

// 3. Multi-Store / Suppliers
export async function fetchShops(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '' && val !== 'all') {
      searchParams.set(key, val);
    }
  });
  const queryString = searchParams.toString();
  return request(`/shops${queryString ? `?${queryString}` : ''}`);
}

export async function fetchShopById(id) {
  return request(`/shops/${encodeURIComponent(id)}`);
}

// 4. Hero Promotional Banners
export async function fetchBanners() {
  return request('/banners');
}

// 5. Storefront Settings
export async function fetchShopSettings() {
  return request('/shop-settings');
}

// 6. CMS Pages & Navigation Menu
export async function fetchPage(slug) {
  return request(`/pages/${encodeURIComponent(slug)}`);
}

export async function fetchMenu() {
  return request('/menu');
}

// 7. Knowledge Base & Blog Posts
export async function fetchPosts() {
  return request('/posts');
}

// 8. Customer Product Reviews
export async function fetchReviews(productId) {
  const q = productId ? `?product_id=${encodeURIComponent(productId)}` : '';
  return request(`/reviews${q}`);
}

export async function submitReview(payload) {
  return request('/reviews', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// 9. Newsletter RFQ & Contact
export async function submitNewsletter(email) {
  return request('/newsletter', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}

export async function submitContact(payload) {
  return request('/contact', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// 10. Commercial Orders
export async function submitOrder(payload) {
  return request('/orders', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function fetchOrders() {
  return request('/orders');
}

// 11. Currencies & Branches
export async function fetchCurrencies() {
  return request('/currencies');
}

export async function fetchBranches() {
  return request('/branches');
}

// 12. Authentication & Customer Registration
export async function loginUser(credentials) {
  return request('/web/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
}

export async function registerCustomer(customerData) {
  return request('/web/auth/register', {
    method: 'POST',
    body: JSON.stringify(customerData)
  });
}

// 13. Admin ERP Data Fetchers
export async function fetchAdminCustomers() {
  return request('/admin/customers');
}

export async function fetchAdminUsers() {
  return request('/admin/users');
}

export default {
  APIConfig,
  fetchProducts,
  fetchProductBySlug,
  fetchCategories,
  fetchBrands,
  fetchShops,
  fetchShopById,
  fetchBanners,
  fetchShopSettings,
  fetchPage,
  fetchMenu,
  fetchPosts,
  fetchReviews,
  submitReview,
  submitNewsletter,
  submitContact,
  submitOrder,
  fetchOrders,
  fetchCurrencies,
  fetchBranches,
  loginUser,
  registerCustomer
};