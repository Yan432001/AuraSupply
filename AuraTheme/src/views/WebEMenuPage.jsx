import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  StarFilled,
  HeartOutlined,
  HeartFilled,
  EyeOutlined,
  ShoppingCartOutlined,
  CloseOutlined,
  PlusOutlined,
  MinusOutlined,
  CheckOutlined,
  ShopOutlined,
  ArrowLeftOutlined,
  SearchOutlined,
  FireOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  SendOutlined,
  DeleteOutlined,
  CameraOutlined,
  ReloadOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import { message, Modal, Drawer, notification } from 'antd';
import { fetchShops, fetchProducts, submitOrder } from '../utils/apiconfig';
import { useCart } from '../contexts/CartContext';
import { publicTheme } from '../utils/webTheme';
import MenuSearchBar, { HighlightMatch } from '../components/emenu/MenuSearchBar';
import OrderStatusMiniBanner from '../components/emenu/OrderStatusMiniBanner';
import ProductDetailModal from '../components/emenu/ProductDetailModal';
import AuraLogo from '../components/common/AuraLogo';
import { useFavorites } from '../hooks/useFavorites';
import { useHeaderHeight } from '../hooks/useHeaderHeight';
import { routeOrderToTelegramGroup } from '../data/telegramStoreGroupManager';
import {
  isImageDeleted,
  deleteProductImage,
  restoreProductImage,
  isStoreLogoDeleted,
  deleteStoreLogo,
  restoreStoreLogo,
  getStoreDeletedCount,
} from '../data/menuImageManager';

// Master Multi-Business Catalog covering Breakfast, Bakery, Coffee, Bistro, Mobile Phones, Computers, and Fashion
const MOCK_WEB_FOODS = [
  // ==========================================
  // BREAKFAST & VIENNOISERIE (Matches image.png exactly)
  // ==========================================
  {
    id: 'food-bk-1',
    name: 'Pancake',
    category: 'Breakfast',
    price: 2.0,
    originalPrice: 3.5,
    rating: 5.0,
    reviews: 189,
    time: '10 min',
    image: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=600&auto=format&fit=crop&q=80',
    description: 'Start your day right with our fluffy pancakes, served fresh every morning.',
    portion: 'Triple Fluffy Stack',
    calories: '420 kcal',
    storeSlug: 'aura-bakery',
  },
  {
    id: 'food-bk-2',
    name: 'Bagel',
    category: 'Breakfast',
    price: 2.0,
    originalPrice: 3.0,
    rating: 4.9,
    reviews: 142,
    time: '5 min',
    image: 'https://images.unsplash.com/photo-1585478259715-876acc5be8eb?w=600&auto=format&fit=crop&q=80',
    description: 'Delight in our freshly baked bagels, perfect for any time of day.',
    portion: 'Toasted with Cream Cheese',
    calories: '310 kcal',
    storeSlug: 'aura-bakery',
  },
  {
    id: 'food-bk-3',
    name: 'Cinnamon Roll',
    category: 'Breakfast',
    price: 2.0,
    originalPrice: 3.2,
    rating: 5.0,
    reviews: 210,
    time: '30 min',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
    description: 'Celebrate the sweet indulgence of our cinnamon rolls, baked fresh daily.',
    portion: 'Jumbo Swirl with Vanilla Glaze',
    calories: '480 kcal',
    storeSlug: 'aura-bakery',
  },
  {
    id: 'food-bk-4',
    name: 'French Toast',
    category: 'Breakfast',
    price: 2.0,
    originalPrice: 3.5,
    rating: 4.9,
    reviews: 165,
    time: '20 min',
    image: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=600&auto=format&fit=crop&q=80',
    description: 'Savor our French toast, a breakfast classic made to perfection.',
    portion: 'Brioche with Maple & Berries',
    calories: '460 kcal',
    storeSlug: 'aura-bakery',
  },
  {
    id: 'food-bk-5',
    name: 'Sweet Crepes',
    category: 'Breakfast',
    price: 2.0,
    originalPrice: 3.0,
    rating: 4.8,
    reviews: 130,
    time: '15 min',
    image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600&auto=format&fit=crop&q=80',
    description: 'Indulge in our sweet crepes, a delectable treat for any occasion.',
    portion: 'Folded Crêpe with Berry Compote',
    calories: '320 kcal',
    storeSlug: 'aura-bakery',
  },
  {
    id: 'food-bk-6',
    name: 'Omelet',
    category: 'Breakfast',
    price: 2.0,
    originalPrice: 3.5,
    rating: 4.9,
    reviews: 155,
    time: '10 min',
    image: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=600&auto=format&fit=crop&q=80',
    description: 'Enjoy our fluffy omelets, made with farm-fresh eggs and your choice of fillings.',
    portion: 'Fresh Country Herb Omelet',
    calories: '380 kcal',
    storeSlug: 'aura-bakery',
  },
  {
    id: 'food-bk-7',
    name: 'Croissants',
    category: 'Breakfast',
    price: 2.0,
    originalPrice: 3.0,
    rating: 5.0,
    reviews: 320,
    time: '25 min',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80',
    description: 'Savor the flaky goodness of our croissants, freshly baked to perfection.',
    portion: 'Golden French Butter Croissant',
    calories: '290 kcal',
    storeSlug: 'aura-bakery',
  },
  {
    id: 'food-bk-8',
    name: 'Muffins',
    category: 'Breakfast',
    price: 2.0,
    originalPrice: 3.0,
    rating: 4.8,
    reviews: 118,
    time: '35 min',
    image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=600&auto=format&fit=crop&q=80',
    description: 'Delight in our moist and flavorful muffins, baked fresh daily.',
    portion: 'Wild Blueberry Streusel Muffin',
    calories: '340 kcal',
    storeSlug: 'aura-bakery',
  },

  // ==========================================
  // LUNCH SELECTIONS
  // ==========================================
  {
    id: 'food-ln-1',
    name: 'Spicy Burger',
    category: 'Lunch',
    price: 10.9,
    originalPrice: 13.9,
    rating: 4.9,
    reviews: 142,
    time: '12 min',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    description: 'Crispy flame-grilled beef patty with smoked chipotle sauce, aged cheddar, crisp lettuce, and pickles.',
    portion: 'Single Gourmet Patty',
    calories: '650 kcal',
    storeSlug: 'aura-bistro',
  },
  {
    id: 'food-ln-2',
    name: 'French Fry Share Box',
    category: 'Lunch',
    price: 5.5,
    originalPrice: 7.0,
    rating: 5.0,
    reviews: 210,
    time: '8 min',
    image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80',
    description: 'Golden crispy double-fried Idaho russet potatoes seasoned with sea salt and fresh rosemary.',
    portion: 'Large Share Box',
    calories: '380 kcal',
    storeSlug: 'aura-bistro',
  },
  {
    id: 'food-ln-3',
    name: 'San Marzano Penne Pasta',
    category: 'Lunch',
    price: 10.9,
    originalPrice: 14.0,
    rating: 4.9,
    reviews: 98,
    time: '15 min',
    image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?w=600&auto=format&fit=crop&q=80',
    description: 'Al dente penne pasta tossed in slow-simmered San Marzano tomato marinara and shaved Parmigiano-Reggiano.',
    portion: 'Regular Bowl (350g)',
    calories: '520 kcal',
    storeSlug: 'aura-bistro',
  },
  {
    id: 'food-ln-4',
    name: 'Artisan Club Sandwich',
    category: 'Lunch',
    price: 8.5,
    originalPrice: 11.0,
    rating: 4.8,
    reviews: 135,
    time: '10 min',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80',
    description: 'Triple-decker artisan toasted sourdough club sandwich with herb roast chicken, crisp bacon, avocado, and Dijon mayo.',
    portion: 'Full Cut Sandwich',
    calories: '580 kcal',
    storeSlug: 'aura-bakery',
  },

  // ==========================================
  // DINNER SPECIALS
  // ==========================================
  {
    id: 'food-dn-1',
    name: 'Ribeye Steak Frites',
    category: 'Dinner',
    price: 18.5,
    originalPrice: 22.0,
    rating: 5.0,
    reviews: 154,
    time: '25 min',
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&auto=format&fit=crop&q=80',
    description: 'Grass-fed Australian ribeye steak seared with thyme butter, served with truffle fries and peppercorn jus.',
    portion: '280g Prime Cut',
    calories: '820 kcal',
    storeSlug: 'aura-bistro',
  },
  {
    id: 'food-dn-2',
    name: 'Margherita Neapolitan Pizza',
    category: 'Dinner',
    price: 12.0,
    originalPrice: 15.0,
    rating: 4.9,
    reviews: 195,
    time: '18 min',
    image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600&auto=format&fit=crop&q=80',
    description: 'Wood-fired sourdough crust topped with San Marzano tomatoes, buffalo mozzarella, fresh basil, and extra virgin olive oil.',
    portion: '10 inch Neapolitan',
    calories: '720 kcal',
    storeSlug: 'aura-bistro',
  },

  // ==========================================
  // DESSERT & JUICE
  // ==========================================
  {
    id: 'food-ds-1',
    name: 'Triple Chocolate Tart',
    category: 'Dessert & juice',
    price: 4.5,
    originalPrice: 6.0,
    rating: 4.9,
    reviews: 165,
    time: '5 min',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
    description: 'Dark Belgian chocolate ganache on cocoa sable pastry topped with crushed hazelnuts and gold leaf.',
    portion: 'Individual Tart',
    calories: '380 kcal',
    storeSlug: 'aura-bakery',
  },
  {
    id: 'food-ds-2',
    name: 'Cascara Sparkling Cold Brew',
    category: 'Dessert & juice',
    price: 4.0,
    originalPrice: 5.0,
    rating: 4.9,
    reviews: 120,
    time: '3 min',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80',
    description: 'Slow cold-steeped coffee cherry husks with sparkling tonic, fresh mint sprig, and hand-cut clear ice.',
    portion: 'Chilled Glass (16oz)',
    calories: '110 kcal',
    storeSlug: 'sbc-store',
  },

  // ==========================================
  // SPECIALTY COFFEE
  // ==========================================
  {
    id: 'food-cf-1',
    name: 'Spanish Iced Latte',
    category: 'Coffee',
    price: 4.25,
    originalPrice: 5.0,
    rating: 4.9,
    reviews: 310,
    time: '4 min',
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80',
    description: 'Signature double shot highland espresso shaken with condensed milk and velvety fresh milk over crystalline ice.',
    portion: '16oz Glass',
    calories: '220 kcal',
    storeSlug: 'sbc-store',
  },
  {
    id: 'food-cf-2',
    name: 'Mondulkiri Hand Pour-Over (V60)',
    category: 'Coffee',
    price: 4.5,
    originalPrice: 5.5,
    rating: 5.0,
    reviews: 178,
    time: '6 min',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80',
    description: 'Single-origin washed Arabica from Bousra highlands with clean notes of pomelo, jasmine, and sugarcane.',
    portion: 'Server Carafe (300ml)',
    calories: '5 kcal',
    storeSlug: 'sbc-store',
  },

  // ==========================================
  // SMARTPHONES & MOBILE TECH (Nexus Mobile)
  // ==========================================
  {
    id: 'mob-1',
    name: 'iPhone 16 Pro Max 256GB',
    category: 'Flagship Phones',
    price: 1199.0,
    originalPrice: 1299.0,
    rating: 5.0,
    reviews: 84,
    time: 'Instant Stock',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
    description: 'Grade 5 aerospace titanium design with Camera Control button and A18 Pro chip.',
    portion: 'Desert Titanium',
    calories: '256GB Storage',
    storeSlug: 'nexus-mobile',
  },
  {
    id: 'mob-2',
    name: 'Samsung Galaxy S25 Ultra',
    category: 'Flagship Phones',
    price: 1249.0,
    originalPrice: 1399.0,
    rating: 4.9,
    reviews: 62,
    time: 'Instant Stock',
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80',
    description: 'Galaxy AI flagship with built-in S-Pen, 200MP quad camera setup, and Snapdragon 8 Elite.',
    portion: 'Titanium Black',
    calories: '512GB Storage',
    storeSlug: 'nexus-mobile',
  },
  {
    id: 'mob-3',
    name: 'Anker Prime 100W GaN Charger',
    category: 'Fast Chargers',
    price: 69.0,
    originalPrice: 85.0,
    rating: 4.9,
    reviews: 140,
    time: 'Ready for Pickup',
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80',
    description: 'Ultra-compact GaNPrime tech charging phone, tablet, and laptop simultaneously at top speed.',
    portion: '3-Port GaN Wall Block',
    calories: '100W Total Output',
    storeSlug: 'nexus-mobile',
  },
  {
    id: 'mob-4',
    name: 'Sony WH-1000XM5 Headphones',
    category: 'Audio & Earbuds',
    price: 349.0,
    originalPrice: 399.0,
    rating: 4.9,
    reviews: 112,
    time: 'Sealed Retail Box',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    description: 'Industry-leading noise cancellation with dual processors, 8 microphones, and 30-hour battery life.',
    portion: 'Wireless Over-Ear',
    calories: '30h Playtime',
    storeSlug: 'nexus-mobile',
  },

  // ==========================================
  // COMPUTERS & WORKSTATIONS (Apex PC)
  // ==========================================
  {
    id: 'pc-1',
    name: 'MacBook Pro 16" M3 Max',
    category: 'Creator Laptops',
    price: 3499.0,
    originalPrice: 3899.0,
    rating: 5.0,
    reviews: 48,
    time: 'Factory Sealed',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
    description: '16-core CPU, 40-core GPU, 48GB unified memory, and 1TB ultra-fast SSD.',
    portion: 'Space Black 16"',
    calories: '48GB RAM / 1TB SSD',
    storeSlug: 'apex-pc',
  },
  {
    id: 'pc-2',
    name: 'Apex Liquid RTX 4090 Rig',
    category: 'Custom Rigs',
    price: 3890.0,
    originalPrice: 4200.0,
    rating: 4.9,
    reviews: 35,
    time: 'Pre-Tested 24h',
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80',
    description: 'Intel Core i9-14900K, GeForce RTX 4090 24GB, custom dual-radiator hardline loop.',
    portion: 'Full Tower Workstation',
    calories: '64GB DDR5 / 2TB Gen5',
    storeSlug: 'apex-pc',
  },
  {
    id: 'pc-3',
    name: 'Keychron Q1 Pro Mechanical',
    category: 'Keyboards',
    price: 199.0,
    originalPrice: 229.0,
    rating: 4.8,
    reviews: 95,
    time: 'Ready to Type',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
    description: 'Full CNC aluminum body, hot-swappable switches, double-gasket design, and wireless Bluetooth.',
    portion: '75% Layout Wireless',
    calories: 'Carbon Black Edition',
    storeSlug: 'apex-pc',
  },
  {
    id: 'pc-4',
    name: 'LG UltraFine 32" 4K Ergo',
    category: 'Monitors',
    price: 699.0,
    originalPrice: 799.0,
    rating: 4.9,
    reviews: 58,
    time: 'Includes Ergo Arm',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80',
    description: 'Nano IPS panel covering 98% DCI-P3 with ergonomic C-clamp arm and 90W USB-C delivery.',
    portion: '32 inch 4K UHD',
    calories: '98% DCI-P3 Color',
    storeSlug: 'apex-pc',
  },

  // ==========================================
  // CLOTHING & MINIMALIST APPAREL (Velour)
  // ==========================================
  {
    id: 'clt-1',
    name: 'Supima Cotton Minimalist Tee',
    category: 'Tops & Linen',
    price: 38.0,
    originalPrice: 48.0,
    rating: 4.9,
    reviews: 145,
    time: 'Hand-Tailored',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
    description: '280 GSM heavyweight California Supima cotton tailored with seamless collar binding.',
    portion: 'Heavyweight 280 GSM',
    calories: '100% Organic Cotton',
    storeSlug: 'velour-apparel',
  },
  {
    id: 'clt-2',
    name: 'French Normandy Linen Overshirt',
    category: 'Tops & Linen',
    price: 89.0,
    originalPrice: 110.0,
    rating: 4.8,
    reviews: 82,
    time: 'Garment Washed',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80',
    description: 'Pure certified Normandy flax linen with garment-washed softness and mother-of-pearl buttons.',
    portion: 'Relaxed Fit Overshirt',
    calories: '100% Flax Linen',
    storeSlug: 'velour-apparel',
  },
  {
    id: 'clt-3',
    name: 'Japanese Selvedge Raw Denim',
    category: 'Japanese Denim',
    price: 145.0,
    originalPrice: 175.0,
    rating: 4.9,
    reviews: 73,
    time: 'Vintage Looms',
    image: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=600&auto=format&fit=crop&q=80',
    description: 'Woven on vintage Toyoda shuttle looms in Okayama with red selvedge ID and copper hardware.',
    portion: '13.5oz Kurabo Mills',
    calories: 'Classic Tapered Fit',
    storeSlug: 'velour-apparel',
  },
  {
    id: 'clt-4',
    name: 'Italian Merino Wool Peacoat',
    category: 'Jackets & Coats',
    price: 295.0,
    originalPrice: 360.0,
    rating: 5.0,
    reviews: 44,
    time: 'Tuscan Atelier',
    image: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80',
    description: 'Tailored in Tuscany from thick brushed Melton merino wool with cupro lining and horn buttons.',
    portion: 'Double-Breasted Coat',
    calories: '100% Merino Wool',
    storeSlug: 'velour-apparel',
  },
];

// Available 8 merchants across the platform
// Merchant Yin owns 2 stores (Bakery & Coffee), 7 other merchants own 1 store each
const STORES_LIST = [
  { slug: 'aura-bakery', name: 'Aura Artisan Bakery', shortName: 'Bakery', emoji: '🥐', merchant: 'Yin', tag: 'Breakfast & Breads' },
  { slug: 'sbc-store', name: 'Aura Specialty Coffee', shortName: 'Coffee', emoji: '☕', merchant: 'Yin', tag: 'Espresso & Roasts' },
  { slug: 'aura-bistro', name: 'Aura French Bistro', shortName: 'Bistro', emoji: '🍽️', merchant: 'Pierre Dubois', tag: 'French Gastronomy' },
  { slug: 'aura-lounge', name: 'Botanical Lounge & Matcha', shortName: 'Matcha', emoji: '🍵', merchant: 'Kenji Sato', tag: 'Ceremonial Tea' },
  { slug: 'nexus-mobile', name: 'Nexus Mobile & Gadgets', shortName: 'Mobile', emoji: '📱', merchant: 'Alex Chen', tag: 'Phones & Gadgets' },
  { slug: 'aura-tech', name: 'Aura Automation Tech', shortName: 'Tech', emoji: '💻', merchant: 'David Kim', tag: 'Smart Living' },
  { slug: 'apex-pc', name: 'Apex PC & Workstation Hub', shortName: 'PCs', emoji: '🖥️', merchant: 'Elena Rostova', tag: 'Desktops & Rigs' },
  { slug: 'velour-apparel', name: 'Velour Minimalist Apparel', shortName: 'Apparel', emoji: '👔', merchant: 'Marcus Vance', tag: 'Fashion & Tailoring' },
];

export default function WebEMenuPage() {
  const { storeSlug } = useParams();
  const navigate = useNavigate();
  const { addItem, cartItems = [] } = useCart();
  const { headerRef } = useHeaderHeight();

  const [dbStores, setDbStores] = useState([]);
  const [dbFoods, setDbFoods] = useState([]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([fetchShops(), fetchProducts({ limit: 150 })])
      .then(([sRes, pRes]) => {
        if (!isMounted) return;
        if (sRes?.success && Array.isArray(sRes.data)) {
          setDbStores(sRes.data);
        }
        if (pRes?.success && Array.isArray(pRes.data) && pRes.data.length > 0) {
          const mapped = pRes.data.map((p) => {
            const foundStore = sRes?.data?.find((s) => s.id === p.shop_id || s.id === p.biller_id);
            return {
              id: String(p.id),
              rawId: p.id,
              name: p.name,
              category: p.category || 'Specialty',
              price: Number(p.price || 0),
              originalPrice: Number((p.price * 1.2).toFixed(2)),
              rating: Number(p.rating || 4.9),
              reviews: Number(p.reviews_count || 42),
              time: '10-15 min',
              image: p.image,
              storeSlug: foundStore?.slug || p.shop?.slug || 'sbc-store',
              storeName: foundStore?.name || p.brand || 'Aura Partner',
              description: p.description || p.details || p.name,
              badge: p.featured ? 'Chef Special' : undefined,
              nutrition: { calories: '320 kcal', prep: 'Artisan Batch' },
            };
          });
          setDbFoods(mapped);
        }
      })
      .catch((e) => console.warn('EMenu DB fetch error:', e));

    return () => { isMounted = false; };
  }, []);

  const activeFoods = useMemo(() => {
    return dbFoods.length > 0 ? dbFoods : MOCK_WEB_FOODS;
  }, [dbFoods]);

  // Active Store
  const currentSlug = storeSlug || 'aura-bakery';
  const currentStore = useMemo(() => {
    const foundDbStore = dbStores.find((s) => s.slug === currentSlug || String(s.id) === String(currentSlug));
    if (foundDbStore) return foundDbStore;
    return (
      STORES_LIST.find((s) => s.slug === currentSlug) ||
      dbStores[0] ||
      STORES_LIST[0]
    );
  }, [currentSlug, dbStores]);

  // Categories dynamically extracted for current store
  const storeCategories = useMemo(() => {
    const foodsForStore = activeFoods.filter((f) => f.storeSlug === currentSlug);
    const uniqueCats = Array.from(new Set(foodsForStore.map((f) => f.category)));
    if (uniqueCats.length > 0) {
      return uniqueCats;
    }
    // Fallback default matching image.png
    return ['Breakfast', 'Lunch', 'Dinner', 'Dessert & juice', 'Coffee'];
  }, [currentSlug, activeFoods]);

  // Active category filter (defaults to first category, e.g. 'Breakfast')
  const [activeCategory, setActiveCategory] = useState(storeCategories[0] || 'Breakfast');
  const [searchQuery, setSearchQuery] = useState('');

  // Update active category when store changes
  useEffect(() => {
    if (storeCategories.length > 0 && !storeCategories.includes(activeCategory)) {
      setActiveCategory(storeCategories[0]);
    }
  }, [storeCategories]);

  // Persistent Favorites state via useFavorites hook
  const { isFavorite, toggleFavorite, favoritesCount } = useFavorites();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Total favorites count for current store items
  const currentStoreFavoritesCount = useMemo(() => {
    const list = activeFoods.filter((f) => f.storeSlug === currentSlug);
    return (list.length ? list : activeFoods).filter((f) => isFavorite(f.id)).length;
  }, [currentSlug, isFavorite, activeFoods]);

  // Dynamic quick tags based on items in active category (matching image.png concept)
  const categoryQuickTags = useMemo(() => {
    const foodsInCat = activeFoods.filter(
      (f) => f.storeSlug === currentSlug && f.category === activeCategory
    );
    if (foodsInCat.length > 0) {
      return foodsInCat.map((f) => f.name);
    }
    return ['Pancake', 'Bagel', 'Cinnamon Roll', 'French Toast', 'Omelet', 'Croissants', 'Muffins'];
  }, [currentSlug, activeCategory, activeFoods]);

  // Modal & Cart Drawer State
  const [quickViewItem, setQuickViewItem] = useState(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState('Table #06');
  const [diningOption, setDiningOption] = useState('Dine-In');

  // Media deletion synchronization state
  const [mediaVersion, setMediaVersion] = useState(0);

  useEffect(() => {
    const handleMediaChange = () => setMediaVersion((v) => v + 1);
    window.addEventListener('aura_menu_image_updated', handleMediaChange);
    return () => window.removeEventListener('aura_menu_image_updated', handleMediaChange);
  }, []);

  const handleDeleteProductImage = (item, e) => {
    e?.stopPropagation?.();
    deleteProductImage(item.id, currentSlug, item.name, item.image);
    message.success(`Image for "${item.name}" deleted from E-Menu & synchronized with Telegram Store Manager!`);
  };

  const handleRestoreProductImage = (item, e) => {
    e?.stopPropagation?.();
    restoreProductImage(item.id, currentSlug);
    message.success(`Image for "${item.name}" restored in E-Menu!`);
  };

  const handleToggleStoreLogo = () => {
    const isDeleted = isStoreLogoDeleted(currentSlug);
    if (isDeleted) {
      restoreStoreLogo(currentSlug);
      message.success(`Restored logo for ${currentStore?.name} in E-Menu!`);
    } else {
      deleteStoreLogo(currentSlug, currentStore?.name, currentStore?.logo);
      message.success(`Deleted logo for ${currentStore?.name} from E-Menu!`);
    }
  };

  // Local cart state
  const [localCart, setLocalCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('aura_web_emenu_cart') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('aura_web_emenu_cart', JSON.stringify(localCart));
    } catch (_) {}
  }, [localCart]);

  const handleAddToCart = (item, quantity = 1) => {
    setLocalCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: Number(item.price),
          image: item.image,
          quantity,
          category: item.category,
          storeSlug: item.storeSlug || currentSlug,
        },
      ];
    });

    try {
      addItem?.({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        image: item.image,
        quantity,
      });
    } catch (_) {}

    notification.success({
      message: (
        <span className="font-extrabold text-sm text-slate-900">
          Added {item.name}!
        </span>
      ),
      description: (
        <div className="flex items-center gap-3 mt-1">
          <img
            src={item.image}
            alt=""
            className="w-10 h-10 rounded-full object-cover border border-slate-200"
          />
          <div>
            <div className="font-bold text-[#A31D1D]">
              ${Number(item.price).toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500">
              Ready in {item.time || '10 min'}
            </div>
          </div>
        </div>
      ),
      placement: 'topRight',
      duration: 3,
    });
  };

  const handleUpdateQuantity = (itemId, delta) => {
    setLocalCart((prev) =>
      prev
        .map((i) => {
          if (i.id === itemId) {
            const nextQty = i.quantity + delta;
            return nextQty > 0 ? { ...i, quantity: nextQty } : null;
          }
          return i;
        })
        .filter(Boolean)
    );
  };

  const totalCartCount = useMemo(() => {
    return localCart.reduce((sum, i) => sum + i.quantity, 0);
  }, [localCart]);

  const cartTotalAmount = useMemo(() => {
    return localCart.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2);
  }, [localCart]);

  // Total foods count for active store
  const storeTotalFoodsCount = useMemo(() => {
    const list = activeFoods.filter((f) => f.storeSlug === currentSlug);
    return list.length || activeFoods.length;
  }, [currentSlug, activeFoods]);

  // Filter foods based on store, category, favorites, and real-time search query
  const displayedFoods = useMemo(() => {
    let list = activeFoods.filter((f) => f.storeSlug === currentSlug);

    // If store has no items for this slug, show all
    if (list.length === 0) {
      list = activeFoods;
    }

    if (showFavoritesOnly) {
      list = list.filter((f) => isFavorite(f.id));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (f) =>
          (f.name || '').toLowerCase().includes(q) ||
          (f.category || '').toLowerCase().includes(q) ||
          (f.description || '').toLowerCase().includes(q)
      );

      // Sort with product name exact/prefix matches first
      list.sort((a, b) => {
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        const aStarts = aName.startsWith(q);
        const bStarts = bName.startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return aName.localeCompare(bName);
      });
    } else if (activeCategory && !showFavoritesOnly) {
      list = list.filter((f) => f.category === activeCategory);
    }

    return list;
  }, [currentSlug, activeCategory, searchQuery, showFavoritesOnly, isFavorite, activeFoods]);

  return (
    <div className="bg-[#FAF9F6] min-h-screen text-slate-800 font-sans pb-28 antialiased selection:bg-[#A31D1D] selection:text-white">
      {/* Persistent Mini-Banner at the Top of Screen */}
      <OrderStatusMiniBanner
        storeName={currentStore?.name}
        className="sticky top-0 z-50"
      />

      {/* ======================================================== */}
      {/* 1. TOP UTILITY HEADER (STORE SWITCHER & CART FLOATING)   */}
      {/* ======================================================== */}
      <header
        ref={headerRef}
        className="header app-sticky-header sticky top-0 z-[1000] border-b border-slate-200/80 shadow-xs px-4 sm:px-8 py-3.5 flex items-center justify-between"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          background: '#ffffff',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          minHeight: 'var(--header-height, 52px)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition cursor-pointer"
            title="Return to Website Home"
          >
            <ArrowLeftOutlined />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A31D1D]">
                Aura E-Menu
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-xs font-bold text-slate-700">
                {currentStore?.name || 'Aura Artisan Bakery'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setTableModalOpen(true)}
              className="text-[11px] text-slate-500 hover:text-[#A31D1D] font-medium flex items-center gap-1.5 transition cursor-pointer group"
              title="Click to select table number or dining preference"
            >
              <span>{tableNumber} • {diningOption}</span>
              <span className="text-[10px] text-slate-400 group-hover:text-[#A31D1D] underline">
                (Change)
              </span>
            </button>
          </div>
        </div>

        {/* Right: Store Switcher Dropdown & Cart Trigger */}
        <div className="flex items-center gap-2.5">
          {/* Quick Store Switcher Pills */}
          <div className="hidden lg:flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-full text-xs font-bold">
            {STORES_LIST.map((st) => (
              <button
                key={st.slug}
                type="button"
                onClick={() => {
                  navigate(`/shop/menu/${st.slug}`);
                  setSearchQuery('');
                }}
                className={`px-3 py-1 rounded-full transition cursor-pointer flex items-center gap-1.5 ${
                  currentSlug === st.slug
                    ? 'bg-[#A31D1D] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{st.emoji}</span>
                <span>{st.shortName}</span>
              </button>
            ))}
          </div>

          {/* Cart Button */}
          <button
            type="button"
            onClick={() => setCartDrawerOpen(true)}
            className="flex items-center gap-2 bg-[#A31D1D] hover:bg-[#831616] text-white px-4 py-2 rounded-full font-bold text-xs shadow-md shadow-[#A31D1D]/20 active:scale-95 transition cursor-pointer"
          >
            <ShoppingCartOutlined className="text-sm" />
            <span>Basket</span>
            <span className="bg-white text-[#A31D1D] px-2 py-0.5 rounded-full text-[11px] font-black">
              {totalCartCount}
            </span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
        {/* ======================================================== */}
        {/* 2. DYNAMIC TEXT HEADER MATCHING image.png               */}
        {/* Bold uppercase crimson header showing active Category or Store Name */}
        {/* ======================================================== */}
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
          {/* Shop Name Label / Subtitle */}
          <div className="text-xs sm:text-sm font-bold tracking-widest uppercase text-slate-400 mb-1">
            {currentStore?.name || 'AURA ARTISAN BAKERY'}
          </div>

          {/* Large Bold Crimson Red Header (matches image.png 'BREAKFAST') */}
          <h1 className="text-3xl sm:text-5xl font-black text-[#A31D1D] tracking-wider uppercase mb-4 font-sans">
            {searchQuery ? `SEARCH: ${searchQuery.toUpperCase()}` : activeCategory.toUpperCase()}
          </h1>

          {/* ======================================================== */}
          {/* REAL-TIME SEARCH BAR COMPONENT                           */}
          {/* Filters current store items by name or category in real-time */}
          {/* ======================================================== */}
          <div className="max-w-xl mx-auto mb-5 px-2">
            <MenuSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={() => setSearchQuery('')}
              placeholder={`Search products by name in ${currentStore?.name || 'menu'}...`}
              totalMatches={displayedFoods.length}
              totalItems={storeTotalFoodsCount}
              accentColor="#A31D1D"
              variant="website"
              showQuickTags={true}
              quickTags={categoryQuickTags}
            />
          </div>

          {/* ======================================================== */}
          {/* 3. CATEGORY PILLS BAR (EXACT MATCH TO image.png)         */}
          {/* Active pill: Deep Crimson rounded capsule                 */}
          {/* Inactive pills: Soft gray text with rounded hover        */}
          {/* ======================================================== */}
          <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-3 py-2">
            {/* Favorites Filter Pill */}
            <button
              type="button"
              onClick={() => {
                setShowFavoritesOnly(!showFavoritesOnly);
                if (!showFavoritesOnly) setSearchQuery('');
              }}
              className={`text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full ${
                showFavoritesOnly
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25 font-black scale-102'
                  : 'text-rose-600 bg-rose-50/80 hover:bg-rose-100/80 border border-rose-200/80 font-bold'
              }`}
              title="Show bookmarked favorites"
            >
              <HeartFilled className={showFavoritesOnly ? 'text-white' : 'text-rose-500'} />
              <span>Favorites ({currentStoreFavoritesCount})</span>
            </button>

            {storeCategories.map((cat) => {
              const isActive = !showFavoritesOnly && !searchQuery && activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setShowFavoritesOnly(false);
                    setActiveCategory(cat);
                    setSearchQuery('');
                  }}
                  className={`text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#A31D1D] text-white px-6 sm:px-7 py-2 rounded-full shadow-md shadow-[#A31D1D]/25 font-black scale-102'
                      : 'text-slate-600 hover:text-slate-900 bg-transparent hover:bg-slate-200/60 px-4 sm:px-5 py-2 rounded-full font-semibold'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Store Switcher for Mobile / Tablet */}
          <div className="flex lg:hidden items-center justify-center gap-1.5 mt-4 overflow-x-auto pb-2 scrollbar-none">
            {STORES_LIST.map((st) => (
              <button
                key={st.slug}
                type="button"
                onClick={() => {
                  navigate(`/shop/menu/${st.slug}`);
                  setSearchQuery('');
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition cursor-pointer ${
                  currentSlug === st.slug
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {st.emoji} {st.shortName}
              </button>
            ))}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 4. 4-COLUMN CARDS GRID (EXACT MATCH TO image.png)        */}
        {/* Top round plate disc + Heart top right + Name + Time + Description + Price & Add button */}
        {/* ======================================================== */}
        {displayedFoods.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 max-w-md mx-auto shadow-sm px-6">
            <span className="text-4xl block mb-2">{showFavoritesOnly ? '❤️' : '🔍'}</span>
            <h3 className="font-bold text-slate-800">
              {showFavoritesOnly
                ? 'No favorites bookmarked yet'
                : searchQuery
                ? `No items found for "${searchQuery}"`
                : 'No items found'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {showFavoritesOnly
                ? 'Click the heart icon on any food card to bookmark it to your persistent favorites list.'
                : searchQuery
                ? 'Try searching by a different product name, keyword, or category.'
                : 'Select another category above to view available choices.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setShowFavoritesOnly(false);
                setActiveCategory(storeCategories[0]);
                setSearchQuery('');
              }}
              className="mt-4 px-5 py-2 rounded-full bg-[#A31D1D] hover:bg-[#831616] text-white text-xs font-bold transition cursor-pointer"
            >
              {showFavoritesOnly ? 'Browse All Menu Items' : searchQuery ? 'Clear Search' : 'Reset Category'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayedFoods.map((item) => {
              const isFav = isFavorite(item.id);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_36px_-6px_rgba(163,29,29,0.14),0_8px_16px_-4px_rgba(0,0,0,0.05)] hover:border-rose-100 hover:-translate-y-1.5 active:scale-[0.98] transition-all duration-300 ease-out flex flex-col justify-between relative group cursor-pointer"
                >
                  {/* Top: Portion / Diet Tag on Left + Heart Favorite Button on Right */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-400 truncate max-w-[140px]">
                      {item.portion || item.category}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(item.id, item.name, e)}
                      aria-label={isFav ? `Remove ${item.name} from favorites` : `Bookmark ${item.name} to favorites`}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer z-10 ${
                        isFav
                          ? 'bg-rose-50 text-rose-600 scale-110 shadow-xs'
                          : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50/50'
                      }`}
                      title={isFav ? 'Bookmarked in Favorites (Click to remove)' : 'Bookmark to Favorites'}
                    >
                      {isFav ? (
                        <HeartFilled className="text-rose-600 text-base" />
                      ) : (
                        <HeartOutlined className="text-slate-300 hover:text-rose-500 text-base" />
                      )}
                    </button>
                  </div>

                  {/* Centered Food Image on Circular Ceramic Plate */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setQuickViewItem(item)}
                    className="relative w-36 h-36 mx-auto mb-3 flex items-center justify-center cursor-pointer rounded-full overflow-hidden shadow-md bg-gradient-to-b from-white to-slate-100 p-1.5 border border-slate-100 ring-4 ring-slate-50/80 group-hover:scale-105 transition-transform duration-300"
                  >
                    {isImageDeleted(item.id, currentSlug) ? (
                      <div className="w-full h-full rounded-full bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 p-2 text-center select-none">
                        <CameraOutlined style={{ fontSize: 20 }} className="text-slate-400 mb-1" />
                        <span className="text-[10px] font-bold text-slate-500">Image Deleted</span>
                        <span className="text-[9px] text-slate-400">Click to view</span>
                      </div>
                    ) : (
                      <img
                        src={item.image}
                        alt={item.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src =
                            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';
                        }}
                        className="w-full h-full object-cover rounded-full"
                        loading="lazy"
                      />
                    )}

                    {/* Direct Delete / Restore Image Button */}
                    {!isImageDeleted(item.id, currentSlug) ? (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteProductImage(item, e)}
                        className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 hover:bg-rose-600 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1 transition active:scale-90 z-10 cursor-pointer shadow-xs min-h-[22px]"
                        title="Delete image directly"
                      >
                        <DeleteOutlined style={{ fontSize: 9 }} />
                        <span>Del</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleRestoreProductImage(item, e)}
                        className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold flex items-center gap-1 transition active:scale-90 z-10 cursor-pointer shadow-xs min-h-[22px]"
                        title="Restore product image"
                      >
                        <ReloadOutlined style={{ fontSize: 9 }} />
                        <span>Restore</span>
                      </button>
                    )}
                  </div>

                  {/* Content: Title & Preparation Time (Exact match to image.png) */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between gap-1.5">
                      <h3
                        onClick={() => setQuickViewItem(item)}
                        className="font-serif font-bold text-base sm:text-lg text-slate-900 leading-snug hover:text-[#A31D1D] transition cursor-pointer tracking-tight truncate"
                      >
                        <HighlightMatch text={item.name} query={searchQuery} />
                      </h3>
                      {item.time && (
                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 shrink-0 whitespace-nowrap">
                          <ClockCircleOutlined style={{ fontSize: 11 }} />
                          {item.time}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Price & add to cart + Button (Exact match to image.png) */}
                  <div className="flex items-center justify-between pt-3 mt-auto border-t border-slate-50">
                    <span className="font-mono font-bold text-lg sm:text-xl text-[#A31D1D] tracking-tight">
                      ${Number(item.price).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddToCart(item)}
                      className="bg-[#A31D1D] hover:bg-[#851616] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-xs hover:shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>add to cart</span>
                      <PlusOutlined style={{ fontSize: 10 }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* 5. TAOBAO-STYLE PRODUCT DETAIL MODAL                      */}
      {/* ======================================================== */}
      {quickViewItem && (
        <ProductDetailModal
          open={Boolean(quickViewItem)}
          product={quickViewItem}
          onClose={() => setQuickViewItem(null)}
          onAddToCart={(item) => {
            handleAddToCart(item, item.quantity || 1);
            setQuickViewItem(null);
          }}
          onBuyNow={(item) => {
            handleAddToCart(item, item.quantity || 1);
            setQuickViewItem(null);
            setCartDrawerOpen(true);
          }}
        />
      )}

      {/* ======================================================== */}
      {/* 6. BASKET DRAWER                                         */}
      {/* ======================================================== */}
      <Drawer
        open={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        title={
          <div className="flex items-center justify-between">
            <span className="font-black text-base text-slate-900">
              Your Basket ({totalCartCount})
            </span>
            <span className="text-xs font-bold text-[#A31D1D]">{tableNumber}</span>
          </div>
        }
        width={420}
        destroyOnHidden
      >
        <div className="flex flex-col h-full justify-between">
          <div className="space-y-3 overflow-y-auto pr-1">
            {localCart.length === 0 ? (
              <div className="py-20 text-center space-y-2">
                <span className="text-4xl block">🛍️</span>
                <p className="font-bold text-sm text-slate-800">Your basket is empty</p>
                <p className="text-xs text-slate-400">
                  Tap "add to cart +" on any pancake, croissant, or dish to begin.
                </p>
              </div>
            ) : (
              localCart.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3"
                >
                  <img
                    src={item.image}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 truncate">
                      {item.name}
                    </h4>
                    <span className="text-xs font-black text-[#A31D1D]">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(item.id, -1)}
                      className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 hover:bg-slate-100"
                    >
                      -
                    </button>
                    <span className="w-5 text-center font-bold text-xs">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(item.id, 1)}
                      className="w-6 h-6 rounded-lg bg-[#A31D1D] text-white flex items-center justify-center font-bold text-xs hover:bg-[#831616]"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {localCart.length > 0 && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex justify-between items-center text-sm font-black text-slate-900">
                <span>Total Amount:</span>
                <span className="text-lg text-[#A31D1D]">${cartTotalAmount}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const refNo = `ORD-${Date.now().toString().slice(-4)}`;
                  const orderData = {
                    referenceNo: refNo,
                    storeName: currentStore?.name || 'Aura Artisan Bakery',
                    status: 'Preparing',
                    placedAt: Date.now(),
                    itemsCount: localCart.reduce((sum, item) => sum + item.quantity, 0),
                    grandTotal: parseFloat(cartTotalAmount),
                  };
                  try {
                    localStorage.setItem('aura_emenu_active_order', JSON.stringify(orderData));
                    sessionStorage.removeItem('aura_emenu_order_dismissed');
                    window.dispatchEvent(new Event('aura_order_updated'));
                  } catch (_) {}
                  routeOrderToTelegramGroup(currentSlug, {
                    referenceNo: refNo,
                    items: localCart,
                    grandTotal: parseFloat(cartTotalAmount),
                    customer: { name: 'Dine-In Customer', address: tableNumber },
                  });
                  submitOrder({
                    customer: { name: 'Dine-In Customer', address: tableNumber },
                    items: localCart.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price, shop_id: currentStore?.id || 1 })),
                    notes: `${diningOption} - ${tableNumber}`,
                    deliveryMethod: diningOption.toLowerCase(),
                  }).catch((err) => console.warn('EMenu DB order write:', err));

                  message.success(`Order #${refNo} for ${tableNumber} placed & recorded in database! 🎉`);
                  setLocalCart([]);
                  setCartDrawerOpen(false);
                }}
                className="w-full py-3.5 rounded-2xl bg-[#A31D1D] hover:bg-[#831616] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#A31D1D]/25 transition cursor-pointer"
              >
                <span>Confirm Order (${cartTotalAmount})</span>
              </button>
            </div>
          )}
        </div>
      </Drawer>

      {/* ======================================================== */}
      {/* 7. TABLE & DINING OPTION SELECTOR MODAL                  */}
      {/* ======================================================== */}
      <Modal
        open={tableModalOpen}
        onCancel={() => setTableModalOpen(false)}
        footer={null}
        title={
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-slate-900">Select Table & Dining Preference</span>
          </div>
        }
        centered
        width={420}
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Dining Mode:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['Dine-In', 'Takeaway'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDiningOption(mode)}
                  className={`py-2.5 rounded-xl font-bold text-xs transition cursor-pointer border ${
                    diningOption === mode
                      ? 'bg-[#A31D1D] text-white border-[#A31D1D] shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {mode === 'Dine-In' ? '🍽️ Dine-In' : '🛍️ Takeaway'}
                </button>
              ))}
            </div>
          </div>

          {diningOption === 'Dine-In' && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Select Your Table:
              </label>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                {Array.from({ length: 16 }, (_, i) => {
                  const tStr = `Table #${String(i + 1).padStart(2, '0')}`;
                  const isSel = tableNumber === tStr;
                  return (
                    <button
                      key={tStr}
                      type="button"
                      onClick={() => setTableNumber(tStr)}
                      className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        isSel
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      #{String(i + 1).padStart(2, '0')}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              message.success(`Set to ${tableNumber} (${diningOption})`);
              setTableModalOpen(false);
            }}
            className="w-full mt-2 py-3 rounded-xl bg-[#A31D1D] hover:bg-[#831616] text-white font-bold text-xs shadow-md shadow-[#A31D1D]/20 transition cursor-pointer"
          >
            Confirm Table ({tableNumber})
          </button>
        </div>
      </Modal>
    </div>
  );
}
