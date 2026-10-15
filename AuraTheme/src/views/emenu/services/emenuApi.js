const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export async function fetchStoreInfo(slug) {
  const res = await fetch(`${API_BASE_URL}/shop/${slug}`);
  return res.json();
}

export async function fetchCategories(slug) {
  const res = await fetch(`${API_BASE_URL}/shop/${slug}/categories`);
  return res.json();
}

export async function fetchProducts(slug, { category = '', q = '', page = 1 }) {
  const url = new URL(`${window.location.origin}${API_BASE_URL}/shop/${slug}/products`);
  if (category) url.searchParams.set('category', category);
  if (q) url.searchParams.set('q', q);
  url.searchParams.set('page', page);
  const res = await fetch(url.toString());
  return res.json();
}

export async function resolveBillerStore(billerId) {
  const res = await fetch(`${API_BASE_URL}/biller/${billerId}/store`);
  return res.json();
}

export async function submitOrder(slug, payload, initData) {
  const res = await fetch(`${API_BASE_URL}/shop/${slug}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-telegram-init-data': initData || ''
    },
    body: JSON.stringify(payload)
  });
  return res.json();
}