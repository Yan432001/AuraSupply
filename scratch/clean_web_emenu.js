const fs = require('fs');

let code = fs.readFileSync('AuraTheme/src/views/WebEMenuPage.jsx', 'utf8');

const mockStartStr = '// Master Multi-Business Catalog covering Breakfast';
const mockEndStr = "  // Active category filter (defaults to first category, e.g. 'Breakfast')";

const startIdx = code.indexOf(mockStartStr);
const endIdx = code.indexOf(mockEndStr);

if (startIdx === -1 || endIdx === -1) {
  console.error('Indices not found!', startIdx, endIdx);
  process.exit(1);
}

const replacement = `export default function WebEMenuPage() {
  const { storeSlug } = useParams();
  const navigate = useNavigate();
  const { addItem, cartItems = [] } = useCart();
  const { headerRef } = useHeaderHeight();

  const [dbStores, setDbStores] = useState([]);
  const [dbFoods, setDbFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    Promise.all([fetchShops(), fetchProducts({ limit: 150 })])
      .then(([sRes, pRes]) => {
        if (!isMounted) return;
        if (sRes?.success && Array.isArray(sRes.data)) {
          setDbStores(sRes.data);
        }
        if (pRes?.success && Array.isArray(pRes.data) && pRes.data.length > 0) {
          const mapped = pRes.data.map((p) => {
            const foundStore = sRes?.data?.find((s) => Number(s.id) === Number(p.shop_id || p.biller_id));
            return {
              id: String(p.id),
              rawId: p.id,
              name: p.name,
              category: p.category || p.category_name || 'Specialty',
              price: Number(p.price || 0),
              originalPrice: p.original_price ? Number(p.original_price) : Number((p.price * 1.2).toFixed(2)),
              rating: Number(p.rating || 4.9),
              reviews: Number(p.reviews_count || 42),
              time: '10-15 min',
              image: p.image || '/assets/uploads/no_image.png',
              biller_id: p.biller_id || p.shop_id,
              storeSlug: foundStore?.slug || foundStore?.store_slug || p.shop?.slug || (p.biller_id ? \`store-\${p.biller_id}\` : 'store'),
              storeName: foundStore?.name || p.brand || 'Aura Partner',
              description: p.description || p.details || p.name,
              badge: p.featured ? 'Chef Special' : undefined,
              nutrition: { calories: '320 kcal', prep: 'Artisan Batch' },
            };
          });
          setDbFoods(mapped);
        }
      })
      .catch((e) => console.warn('EMenu DB fetch error:', e))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  const activeFoods = dbFoods;

  // Active Store
  const currentSlug = storeSlug || 'sbc-store';
  const currentStore = useMemo(() => {
    const foundDbStore = dbStores.find((s) => s.slug === currentSlug || s.store_slug === currentSlug || String(s.id) === String(currentSlug));
    if (foundDbStore) return foundDbStore;
    return dbStores[0] || null;
  }, [currentSlug, dbStores]);

  // Categories dynamically extracted for current store
  const storeCategories = useMemo(() => {
    const foodsForStore = activeFoods.filter((f) => f.storeSlug === currentSlug || (currentStore && Number(f.biller_id) === Number(currentStore.id)));
    const uniqueCats = Array.from(new Set(foodsForStore.map((f) => f.category).filter(Boolean)));
    return uniqueCats;
  }, [currentSlug, activeFoods, currentStore]);

`;

code = code.substring(0, startIdx) + replacement + code.substring(endIdx);

// Also replace any unsplash URLs in WebEMenuPage
code = code.replace(/https:\/\/images\.unsplash\.com\/photo-[^'"\s]+/g, '/assets/uploads/no_image.png');

fs.writeFileSync('AuraTheme/src/views/WebEMenuPage.jsx', code, 'utf8');
console.log('WebEMenuPage successfully updated. New line count:', code.split('\n').length);
