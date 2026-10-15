const fs = require('fs');
let code = fs.readFileSync('AuraTheme/src/views/EMenuPage.jsx', 'utf8');

// 1. Remove SELLER_SLUG_MAP
const oldSlugMap = `    const SELLER_SLUG_MAP = {
      'seller-1': 'sbc-store',
      'seller-2': 'aura-bakery',
      'seller-3': 'aura-lounge',
      'seller-4': 'aura-bistro',
      'seller-5': 'aura-tech',
      'seller-6': 'nexus-mobile',
      'nexus-mobile': 'nexus-mobile',
    };
    if (raw && SELLER_SLUG_MAP[raw]) {
      return SELLER_SLUG_MAP[raw];
    }
    return raw || 'sbc-store';`;

const newSlugMap = `    return raw || 'sbc-store';`;

if (code.includes(oldSlugMap)) {
  code = code.replace(oldSlugMap, newSlugMap);
  console.log('Removed SELLER_SLUG_MAP');
} else {
  console.log('Warning: oldSlugMap pattern not found');
}

// 2. Replace unsplash placeholders
code = code.replace(/https:\/\/images\.unsplash\.com\/photo-[^'"\s]+/g, '/assets/uploads/no_image.png');

fs.writeFileSync('AuraTheme/src/views/EMenuPage.jsx', code, 'utf8');
console.log('Cleaned EMenuPage.jsx');
