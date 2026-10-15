export const publicTheme = {
  pageBackground:
    'radial-gradient(circle at 10% 8%, rgba(47, 111, 237, 0.04), transparent 30%), radial-gradient(circle at 90% 4%, rgba(255, 122, 61, 0.03), transparent 26%), linear-gradient(180deg, #ffffff 0%, #f8fafc 48%, #ffffff 100%)',
  heroBackground:
    'radial-gradient(circle at 18% 20%, rgba(47, 111, 237, 0.12), transparent 28%), radial-gradient(circle at 84% 10%, rgba(255, 122, 61, 0.10), transparent 26%), linear-gradient(145deg, #ffffff 0%, #f8faff 54%, #f1f5fb 100%)',
  cardBackground: '#ffffff',
  cardStrong: '#ffffff',
  cardMuted: '#f8fafc',
  primary: '#2f6fed',
  primaryDark: '#1d4ed8',
  primaryLight: '#eff6ff',
  secondary: '#5b8def',
  accent: '#ff7a3d',
  accentDark: '#ea580c',
  accentLight: '#fff7ed',
  text: '#0f172a',
  subtext: '#64748b',
  textLight: '#94a3b8',
  border: 'rgba(226, 232, 240, 0.85)',
  softBorder: 'rgba(226, 232, 240, 0.6)',
  borderActive: 'rgba(47, 111, 237, 0.4)',
  shadow: '0 20px 45px -12px rgba(15, 23, 42, 0.08), 0 8px 16px -6px rgba(15, 23, 42, 0.04)',
  lightShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 4px 6px -2px rgba(15, 23, 42, 0.025)',
  hoverShadow: '0 24px 50px -10px rgba(47, 111, 237, 0.16), 0 8px 20px -6px rgba(15, 23, 42, 0.08)',
  pill: 'linear-gradient(135deg, rgba(47,111,237,0.1), rgba(91,141,239,0.1))',
  ribbon: 'linear-gradient(135deg, #2f6fed 0%, #1d4ed8 100%)',
  sunset: 'linear-gradient(135deg, #ff7a3d 0%, #ea580c 100%)',
  emerald: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 22,
    full: 9999,
  },
};

// B2B Wholesale Pricing Tiers configuration
export const B2B_WHOLESALE_TIERS = [
  { tier: 1, minQty: 1, maxQty: 9, discountLabel: 'Standard Wholesale', discountRate: 0 },
  { tier: 2, minQty: 10, maxQty: 49, discountLabel: 'Bulk Tier (Save 12%)', discountRate: 0.12 },
  { tier: 3, minQty: 50, maxQty: Infinity, discountLabel: 'Enterprise VIP (Save 22%)', discountRate: 0.22 },
];

export const calculateTierPrice = (basePrice, quantity) => {
  const qty = Math.max(1, Number(quantity) || 1);
  const tier = B2B_WHOLESALE_TIERS.find((t) => qty >= t.minQty && qty <= t.maxQty) || B2B_WHOLESALE_TIERS[0];
  const unitPrice = Number((basePrice * (1 - tier.discountRate)).toFixed(2));
  return {
    unitPrice,
    totalPrice: Number((unitPrice * qty).toFixed(2)),
    tier,
    discountRate: tier.discountRate,
    savings: Number(((basePrice - unitPrice) * qty).toFixed(2)),
  };
};

// Universal font size system tokens matching header base font size (13px)
export const fontSizes = {
  base: 'var(--font-base)',
  small: 'var(--font-small)',
  title: 'var(--font-title)',
  price: 'var(--font-price)',
  heading: 'var(--font-heading)',
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));

export const formatCompact = (value) => compactFormatter.format(Number(value || 0));