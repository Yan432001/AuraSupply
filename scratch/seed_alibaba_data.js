const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const categories = [
  { id: 201, code: 'commercial-machinery', name: 'Commercial Kitchen & Bar Machinery', slug: 'commercial-machinery', description: 'Factory-direct commercial espresso machines, planetary mixers, blast chillers, bubble tea sealers, and ice makers.' },
  { id: 202, code: 'eco-packaging', name: 'Eco Packaging & Biodegradable Disposables', slug: 'eco-packaging', description: 'Certified biodegradable sugarcane bagasse takeout clamshells, PLA cups, and kraft paper packaging.' },
  { id: 203, code: 'bulk-commodities', name: 'Bulk Raw Commodities & Ingredients', slug: 'bulk-commodities', description: 'Direct-trade green coffee beans, ceremonial grade Uji matcha, Madagascar vanilla beans, and couverture chocolate.' },
  { id: 204, code: 'hospitality-furniture', name: 'Commercial Hospitality & Cafe Furniture', slug: 'hospitality-furniture', description: 'Solid oak cafe chairs, cast-iron bistro tables, modular dining booths, and communal workstation tables.' },
  { id: 205, code: 'smart-pos-hardware', name: 'Cloud POS & Smart Retail Hardware', slug: 'smart-pos-hardware', description: 'Dual-screen Android POS terminals, high-speed thermal printers, guest pager systems, and 2D barcode scanners.' }
];

const stores = [
  {
    id: 301,
    name: 'Guangzhou Apex Machinery',
    company: 'Guangzhou Apex Commercial Kitchen & Beverage Machinery Co., Ltd.',
    slug: 'apex-commercial-machinery',
    city: 'Guangzhou',
    phone: '+86 20 8765 4321',
    email: 'sales@apex-machinery.cn',
    rating: 4.95,
    logo: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80',
    banner_url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200&auto=format&fit=crop&q=80',
    store_type: 'Commercial Machinery Manufacturer',
    address: 'Zone B, Apex Industrial Robotics Park, Panyu District, Guangzhou'
  },
  {
    id: 302,
    name: 'Zhejiang EcoPack Factory',
    company: 'Zhejiang EcoPack Biodegradable & Food Packaging Co., Ltd.',
    slug: 'ecopack-packaging',
    city: 'Hangzhou',
    phone: '+86 571 8912 3456',
    email: 'export@ecopack-cn.com',
    rating: 4.92,
    logo: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=300&auto=format&fit=crop&q=80',
    banner_url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=1200&auto=format&fit=crop&q=80',
    store_type: 'Packaging & Disposables Factory',
    address: 'Eco-Green Manufacturing Base, Yuhang District, Hangzhou'
  },
  {
    id: 303,
    name: 'Highland Coffee & Tea Directorate',
    company: 'Yunnan & Highland Organic Coffee & Tea Commodity Trade Directorate',
    slug: 'highland-trade-directorate',
    city: 'Kunming',
    phone: '+86 871 6543 2100',
    email: 'sourcing@yunnan-coffee.org',
    rating: 4.89,
    logo: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&auto=format&fit=crop&q=80',
    banner_url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1200&auto=format&fit=crop&q=80',
    store_type: 'Direct Origin Commodity Exporter',
    address: 'Pu\'er & Kunming Highland Coffee Trade Center, Kunming'
  },
  {
    id: 304,
    name: 'MasterCraft Commercial Furniture',
    company: 'Foshan MasterCraft Commercial Hospitality Furniture Works',
    slug: 'mastercraft-furniture',
    city: 'Foshan',
    phone: '+86 757 2233 4455',
    email: 'contract@mastercraft-furniture.com',
    rating: 4.94,
    logo: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&auto=format&fit=crop&q=80',
    banner_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
    store_type: 'Commercial Furniture Factory',
    address: 'Shunde Furniture Industrial Corridor, Foshan'
  },
  {
    id: 305,
    name: 'Sunmi Cloud POS Hardware',
    company: 'Shenzhen Sunmi Cloud Tech & POS Hardware Co., Ltd.',
    slug: 'sunmi-cloud-pos',
    city: 'Shenzhen',
    phone: '+86 755 8320 9988',
    email: 'b2b@sunmi-hardware.com',
    rating: 4.98,
    logo: 'https://images.unsplash.com/photo-1556742049-0a67e557224f?w=300&auto=format&fit=crop&q=80',
    banner_url: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1200&auto=format&fit=crop&q=80',
    store_type: 'Smart Retail Hardware Manufacturer',
    address: 'Hi-Tech Industrial Park, Nanshan District, Shenzhen'
  }
];

const products = [
  // 1. Commercial Machinery (Store 301, Cat 201)
  {
    id: 401,
    code: 'ALB-MAC-01',
    name: 'Commercial 2-Group Rotary Pump Espresso Machine (Dual Boiler 14L, PID Digital Controller)',
    price: 2450.00,
    cost: 1680.00,
    category_id: 201,
    store_id: 301,
    image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80',
    slug: 'commercial-2-group-rotary-pump-espresso-machine',
    brand: 'Apex Machinery',
    featured: 1,
    stock: 25
  },
  {
    id: 402,
    code: 'ALB-MAC-02',
    name: 'Heavy-Duty 30L Planetary Food & Dough Mixer (3-Speed Gearbox, Stainless Steel Bowl)',
    price: 890.00,
    cost: 590.00,
    category_id: 201,
    store_id: 301,
    image: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=800&auto=format&fit=crop&q=80',
    slug: 'heavy-duty-30l-planetary-food-dough-mixer',
    brand: 'Apex Machinery',
    featured: 1,
    stock: 40
  },
  {
    id: 403,
    code: 'ALB-MAC-03',
    name: 'Commercial Stainless Steel Rapid Blast Chiller & Shock Freezer (10-Tray GN 1/1)',
    price: 1680.00,
    cost: 1150.00,
    category_id: 201,
    store_id: 301,
    image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&auto=format&fit=crop&q=80',
    slug: 'commercial-stainless-steel-rapid-blast-chiller',
    brand: 'Apex Machinery',
    featured: 0,
    stock: 18
  },
  {
    id: 404,
    code: 'ALB-MAC-04',
    name: 'Automatic Touchscreen Boba Cup Sealing Machine (95mm/90mm Caliber, 500 cups/hr)',
    price: 280.00,
    cost: 175.00,
    category_id: 201,
    store_id: 301,
    image: 'https://images.unsplash.com/photo-1558857563-b37cfbcfd687?w=800&auto=format&fit=crop&q=80',
    slug: 'automatic-touchscreen-boba-cup-sealing-machine',
    brand: 'Apex Machinery',
    featured: 0,
    stock: 65
  },
  {
    id: 405,
    code: 'ALB-MAC-05',
    name: 'Commercial Modular Air-Cooled Cube Ice Maker (220kg/24hr Production, 150kg Bin)',
    price: 1250.00,
    cost: 820.00,
    category_id: 201,
    store_id: 301,
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80',
    slug: 'commercial-modular-air-cooled-cube-ice-maker',
    brand: 'Apex Machinery',
    featured: 1,
    stock: 22
  },
  {
    id: 406,
    code: 'ALB-MAC-06',
    name: 'Heavy-Duty Commercial Countertop Induction Deep Fryer (Twin Tank 2x10L Digital Timer)',
    price: 480.00,
    cost: 310.00,
    category_id: 201,
    store_id: 301,
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
    slug: 'heavy-duty-commercial-countertop-induction-deep-fryer',
    brand: 'Apex Machinery',
    featured: 0,
    stock: 35
  },

  // 2. Eco Packaging & Disposables (Store 302, Cat 202)
  {
    id: 407,
    code: 'ALB-PKG-01',
    name: 'Biodegradable Sugarcane Bagasse 3-Compartment Clamshell Boxes (Case of 500 pcs)',
    price: 48.00,
    cost: 29.00,
    category_id: 202,
    store_id: 302,
    image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80',
    slug: 'biodegradable-sugarcane-bagasse-clamshell-boxes',
    brand: 'EcoPack',
    featured: 1,
    stock: 250
  },
  {
    id: 408,
    code: 'ALB-PKG-02',
    name: 'Heavy Kraft Paper Takeout Bags with Reinforced Twisted Handles (Carton of 400 pcs)',
    price: 38.50,
    cost: 22.00,
    category_id: 202,
    store_id: 302,
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
    slug: 'heavy-kraft-paper-takeout-bags-twisted-handles',
    brand: 'EcoPack',
    featured: 0,
    stock: 320
  },
  {
    id: 409,
    code: 'ALB-PKG-03',
    name: 'Double-Wall Ripple Insulated Coffee Paper Cups 12oz with Lids (Master Case of 1,000 pcs)',
    price: 62.00,
    cost: 39.00,
    category_id: 202,
    store_id: 302,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
    slug: 'double-wall-ripple-insulated-coffee-paper-cups',
    brand: 'EcoPack',
    featured: 1,
    stock: 180
  },
  {
    id: 410,
    code: 'ALB-PKG-04',
    name: 'Crystal Clear PLA Compostable Cold Beverage Cups 16oz with Flat Lids (Case of 1,000 pcs)',
    price: 55.00,
    cost: 34.00,
    category_id: 202,
    store_id: 302,
    image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&auto=format&fit=crop&q=80',
    slug: 'crystal-clear-pla-compostable-cold-cups',
    brand: 'EcoPack',
    featured: 0,
    stock: 220
  },
  {
    id: 411,
    code: 'ALB-PKG-05',
    name: 'Unbleached Natural Bamboo Fiber Beverage Straws (Pack of 2,000 Individually Wrapped)',
    price: 24.00,
    cost: 13.50,
    category_id: 202,
    store_id: 302,
    image: 'https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?w=800&auto=format&fit=crop&q=80',
    slug: 'unbleached-natural-bamboo-fiber-beverage-straws',
    brand: 'EcoPack',
    featured: 0,
    stock: 450
  },
  {
    id: 412,
    code: 'ALB-PKG-06',
    name: 'Custom Embossed Corrugated Kraft Coffee Cup Sleeves (Case of 1,000 pcs)',
    price: 18.50,
    cost: 9.80,
    category_id: 202,
    store_id: 302,
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80',
    slug: 'custom-embossed-corrugated-kraft-coffee-cup-sleeves',
    brand: 'EcoPack',
    featured: 0,
    stock: 500
  },

  // 3. Bulk Raw Commodities & Ingredients (Store 303, Cat 203)
  {
    id: 413,
    code: 'ALB-COM-01',
    name: 'Grade-A Ceremonial Kyoto Uji Organic Matcha Powder (1kg Airtight Vacuum Tin)',
    price: 72.00,
    cost: 44.00,
    category_id: 203,
    store_id: 303,
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800&auto=format&fit=crop&q=80',
    slug: 'grade-a-ceremonial-kyoto-uji-organic-matcha-powder',
    brand: 'Highland Trade',
    featured: 1,
    stock: 85
  },
  {
    id: 414,
    code: 'ALB-COM-02',
    name: 'Single-Origin Ethiopian Yirgacheffe Specialty Grade Green Coffee Beans (60kg Jute Sack)',
    price: 480.00,
    cost: 330.00,
    category_id: 203,
    store_id: 303,
    image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&auto=format&fit=crop&q=80',
    slug: 'single-origin-ethiopian-yirgacheffe-green-coffee-beans',
    brand: 'Highland Trade',
    featured: 1,
    stock: 30
  },
  {
    id: 415,
    code: 'ALB-COM-03',
    name: 'Organic Madagascar Bourbon Vanilla Beans Gourmet Grade-A (1kg Vacuum Sealed Pack)',
    price: 195.00,
    cost: 135.00,
    category_id: 203,
    store_id: 303,
    image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800&auto=format&fit=crop&q=80',
    slug: 'organic-madagascar-bourbon-vanilla-beans-gourmet',
    brand: 'Highland Trade',
    featured: 0,
    stock: 45
  },
  {
    id: 416,
    code: 'ALB-COM-04',
    name: 'Belgian 70% Dark Callets Couverture Baking & Dessert Chocolate (10kg Bulk Master Box)',
    price: 120.00,
    cost: 78.00,
    category_id: 203,
    store_id: 303,
    image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800&auto=format&fit=crop&q=80',
    slug: 'belgian-70-dark-callets-couverture-baking-chocolate',
    brand: 'Highland Trade',
    featured: 0,
    stock: 60
  },
  {
    id: 417,
    code: 'ALB-COM-05',
    name: 'Chewy Amber Brown Sugar Boba Tapioca Pearls (Carton of 6x3kg Vacuum Bags)',
    price: 45.00,
    cost: 26.00,
    category_id: 203,
    store_id: 303,
    image: 'https://images.unsplash.com/photo-1558857563-b37cfbcfd687?w=800&auto=format&fit=crop&q=80',
    slug: 'chewy-amber-brown-sugar-boba-tapioca-pearls',
    brand: 'Highland Trade',
    featured: 0,
    stock: 110
  },
  {
    id: 418,
    code: 'ALB-COM-06',
    name: 'Yunnan High-Mountain Spring Flush Black Tea Orthodox Leaves (5kg Foil Vacuum Carton)',
    price: 85.00,
    cost: 52.00,
    category_id: 203,
    store_id: 303,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80',
    slug: 'yunnan-high-mountain-spring-flush-black-tea',
    brand: 'Highland Trade',
    featured: 0,
    stock: 75
  },

  // 4. Commercial Furniture (Store 304, Cat 204)
  {
    id: 419,
    code: 'ALB-FUR-01',
    name: 'Scandinavian Solid White Oak Commercial Cafe Dining Chair (Set of 4 Chairs)',
    price: 340.00,
    cost: 210.00,
    category_id: 204,
    store_id: 304,
    image: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=800&auto=format&fit=crop&q=80',
    slug: 'scandinavian-solid-white-oak-cafe-dining-chair',
    brand: 'MasterCraft',
    featured: 1,
    stock: 50
  },
  {
    id: 420,
    code: 'ALB-FUR-02',
    name: 'Heavy Cast Iron Pedestal Round Bistro Dining Table with Terrazzo Top (Dia 70cm)',
    price: 165.00,
    cost: 98.00,
    category_id: 204,
    store_id: 304,
    image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986b88?w=800&auto=format&fit=crop&q=80',
    slug: 'heavy-cast-iron-pedestal-round-bistro-dining-table',
    brand: 'MasterCraft',
    featured: 0,
    stock: 65
  },
  {
    id: 421,
    code: 'ALB-FUR-03',
    name: 'Modular Double-Sided Restaurant Booth Seating Banquette (High-Density Leatherette)',
    price: 420.00,
    cost: 260.00,
    category_id: 204,
    store_id: 304,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
    slug: 'modular-double-sided-restaurant-booth-seating-banquette',
    brand: 'MasterCraft',
    featured: 1,
    stock: 20
  },
  {
    id: 422,
    code: 'ALB-FUR-04',
    name: 'Industrial Powder-Coated Steel Outdoor Patio Bar Stools with Teak Footrest (Set of 2)',
    price: 150.00,
    cost: 88.00,
    category_id: 204,
    store_id: 304,
    image: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&auto=format&fit=crop&q=80',
    slug: 'industrial-powder-coated-steel-outdoor-bar-stools',
    brand: 'MasterCraft',
    featured: 0,
    stock: 80
  },
  {
    id: 423,
    code: 'ALB-FUR-05',
    name: 'Solid Acacia Live-Edge Communal Workstation Table with Cable Ports (240cm x 90cm)',
    price: 580.00,
    cost: 360.00,
    category_id: 204,
    store_id: 304,
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
    slug: 'solid-acacia-live-edge-communal-workstation-table',
    brand: 'MasterCraft',
    featured: 0,
    stock: 15
  },
  {
    id: 424,
    code: 'ALB-FUR-06',
    name: 'Ergonomic Mid-Century Minimalist Lounge Armchair with Waterproof Linen',
    price: 195.00,
    cost: 118.00,
    category_id: 204,
    store_id: 304,
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80',
    slug: 'ergonomic-mid-century-minimalist-lounge-armchair',
    brand: 'MasterCraft',
    featured: 0,
    stock: 45
  },

  // 5. Smart POS Hardware (Store 305, Cat 205)
  {
    id: 425,
    code: 'ALB-POS-01',
    name: 'Android 13 Dual-Screen HD Smart Cloud POS Terminal with High-Speed 80mm Seiko Thermal Printer',
    price: 499.00,
    cost: 320.00,
    category_id: 205,
    store_id: 305,
    image: 'https://images.unsplash.com/photo-1556742049-0a67e557224f?w=800&auto=format&fit=crop&q=80',
    slug: 'android-13-dual-screen-smart-cloud-pos-terminal',
    brand: 'Sunmi Tech',
    featured: 1,
    stock: 60
  },
  {
    id: 426,
    code: 'ALB-POS-02',
    name: 'High-Speed 80mm Wireless WiFi & Bluetooth Thermal Kitchen Order Ticket Printer (Auto-Cutter)',
    price: 115.00,
    cost: 65.00,
    category_id: 205,
    store_id: 305,
    image: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800&auto=format&fit=crop&q=80',
    slug: 'high-speed-80mm-wireless-thermal-kitchen-ticket-printer',
    brand: 'Sunmi Tech',
    featured: 0,
    stock: 120
  },
  {
    id: 427,
    code: 'ALB-POS-03',
    name: 'Omnidirectional Hands-Free 2D QR Code & Barcode Desktop Scanner (USB / Serial Interface)',
    price: 68.00,
    cost: 38.00,
    category_id: 205,
    store_id: 305,
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80',
    slug: 'omnidirectional-hands-free-2d-qr-barcode-desktop-scanner',
    brand: 'Sunmi Tech',
    featured: 0,
    stock: 95
  },
  {
    id: 428,
    code: 'ALB-POS-04',
    name: 'Rechargeable Ultra-Long Range Wireless Restaurant Guest Pager Buzzer System (Host + 20 Pagers)',
    price: 175.00,
    cost: 105.00,
    category_id: 205,
    store_id: 305,
    image: 'https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=800&auto=format&fit=crop&q=80',
    slug: 'wireless-restaurant-guest-pager-buzzer-system',
    brand: 'Sunmi Tech',
    featured: 1,
    stock: 45
  },
  {
    id: 429,
    code: 'ALB-POS-05',
    name: 'Heavy-Duty 5-Bill 8-Coin Electronic Steel Cash Drawer with RJ11 Printer Trigger Interface',
    price: 55.00,
    cost: 29.00,
    category_id: 205,
    store_id: 305,
    image: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=800&auto=format&fit=crop&q=80',
    slug: 'heavy-duty-electronic-steel-cash-drawer',
    brand: 'Sunmi Tech',
    featured: 0,
    stock: 140
  },
  {
    id: 430,
    code: 'ALB-POS-06',
    name: 'High-Precision Smart Coffee Brewing Scale with Auto-Tare Timer & Bluetooth Live Telemetry',
    price: 42.00,
    cost: 21.00,
    category_id: 205,
    store_id: 305,
    image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80',
    slug: 'high-precision-smart-coffee-brewing-scale',
    brand: 'Sunmi Tech',
    featured: 0,
    stock: 200
  }
];

const banners = [
  {
    id: 5,
    position: 'home_hero',
    title: 'Global B2B Sourcing Fair: Factory-Direct Commercial Machinery',
    subtitle: 'Container-load discounts on dual-boiler espresso machinery, planetary mixers & POS terminals with ISO 9001 compliance.',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1400&auto=format&fit=crop&q=80',
    badge: '🏭 FACTORY DIRECT • UP TO 35% OFF',
    coupon_code: 'ALIBABA35',
    status: 1
  },
  {
    id: 6,
    position: 'home_hero',
    title: 'Certified Biodegradable & Sugarcane Bagasse Eco-Packaging',
    subtitle: 'Full-container wholesale orders with custom logo debossing and free shipping on bulk cafe carton pallets.',
    image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=1400&auto=format&fit=crop&q=80',
    badge: '🌿 ECO DISPOSABLES • BULK WHOLESALE',
    coupon_code: 'ECOPACK2026',
    status: 1
  }
];

const reviews = [
  { product_id: 401, name: 'Laurent Delacroix', rating: 5, comment: 'We outfitted three of our bistro branches with the Apex 2-Group machine. Steam pressure is rock steady during peak rush hours.' },
  { product_id: 407, name: 'Elena Rostova', rating: 5, comment: 'Certified food-grade sugarcane clamshells arrived within 10 days. Moisture-resistant and holds sauces without leaking.' },
  { product_id: 413, name: 'Kenji Takahashi', rating: 5, comment: 'Authentic stone-ground Uji ceremonial matcha. Deep umami aroma and vivid jade green foam. Outstanding wholesale price.' },
  { product_id: 419, name: 'Marcus Sterling', rating: 5, comment: 'The solid oak chairs have commercial-grade joinery. Built like a tank and looks gorgeous in our cafe dining hall.' },
  { product_id: 425, name: 'Vireak Srun', rating: 5, comment: 'Sunmi dual screen POS works flawlessly with our Telegram ordering webhook. Crisp thermal printing and snappy touch response.' }
];

async function seedAlibabaData() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'aura_v1_db',
  });

  console.log('Seeding Alibaba B2B Categories, Stores, Products, Banners, and Reviews...');

  // 1. Categories
  for (const c of categories) {
    await pool.query(
      `INSERT INTO aura_categories (id, code, name, slug, description)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), slug=VALUES(slug), description=VALUES(description)`,
      [c.id, c.code, c.name, c.slug, c.description]
    );
  }
  console.log(`✓ Inserted/Updated ${categories.length} Alibaba B2B Categories`);

  // 2. Stores (aura_companies with group_name = 'biller')
  for (const s of stores) {
    await pool.query(
      `INSERT INTO aura_companies (
        id, group_id, group_name, name, company, city, phone, email,
        slug, rating, logo, banner, address, is_active
      ) VALUES (?, 1, 'biller', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE
        name=VALUES(name), company=VALUES(company), city=VALUES(city),
        phone=VALUES(phone), email=VALUES(email), slug=VALUES(slug),
        rating=VALUES(rating), logo=VALUES(logo), banner=VALUES(banner),
        address=VALUES(address), is_active=1`,
      [s.id, s.name, s.company, s.city, s.phone, s.email, s.slug, s.rating, s.logo, s.banner_url, s.address]
    );
  }
  console.log(`✓ Inserted/Updated ${stores.length} Alibaba Verified Supplier Stores`);

  // 3. Products
  for (const p of products) {
    await pool.query(
      `INSERT INTO aura_products (
        id, code, name, price, cost, category_id, biller_id, image, slug, brand, featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        code=VALUES(code), name=VALUES(name), price=VALUES(price), cost=VALUES(cost),
        category_id=VALUES(category_id), biller_id=VALUES(biller_id), image=VALUES(image),
        slug=VALUES(slug), brand=VALUES(brand), featured=VALUES(featured)`,
      [p.id, p.code, p.name, p.price, p.cost, p.category_id, p.store_id, p.image, p.slug, p.brand, p.featured]
    );

    // Stock in warehouse 1
    await pool.query(
      `INSERT INTO aura_warehouses_products (product_id, warehouse_id, quantity, avg_cost)
       VALUES (?, 1, ?, ?)
       ON DUPLICATE KEY UPDATE quantity=VALUES(quantity), avg_cost=VALUES(avg_cost)`,
      [p.id, p.stock, p.cost]
    );
  }
  console.log(`✓ Inserted/Updated ${products.length} Alibaba Wholesale Products with Warehouse Stocks`);

  // 4. Banners
  for (const b of banners) {
    await pool.query(
      `INSERT INTO aura_theme_banners (
        id, position, title, subtitle, image, badge, coupon_code, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        title=VALUES(title), subtitle=VALUES(subtitle), image=VALUES(image),
        badge=VALUES(badge), coupon_code=VALUES(coupon_code), status=VALUES(status)`,
      [b.id, b.position, b.title, b.subtitle, b.image, b.badge, b.coupon_code, b.status]
    );
  }
  console.log(`✓ Inserted/Updated ${banners.length} Alibaba Promo Banners`);

  // 5. Reviews
  for (const r of reviews) {
    await pool.query(
      `INSERT INTO aura_theme_reviews (product_id, name, rating, comment, status)
       VALUES (?, ?, ?, ?, 'approved')`,
      [r.product_id, r.name, r.rating, r.comment]
    );
  }
  console.log(`✓ Inserted ${reviews.length} Verified Buyer Reviews`);

  await pool.end();
  console.log('Seeding completed successfully!');
}

seedAlibabaData().catch(err => {
  console.error('Fatal error during Alibaba data seed:', err);
  process.exit(1);
});
