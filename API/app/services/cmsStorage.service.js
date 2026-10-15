const fs = require('fs');
const path = require('path');

const DATA_FILE = path.resolve(__dirname, '../../../../data/cms_data.json');

const DEFAULT_CMS_DATA = {
  settings: {
    id: 1,
    site_name_en: "Aura Global",
    site_name_km: "អូរ៉ា គ្លូប៊ល",
    tagline_en: "Artisan Coffee, Culinary Delights & Modern Lifestyle",
    tagline_km: "កាហ្វេរសជាតិដើម អាហារឆ្ងាញ់ និងទាន់សម័យ",
    logo_url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=300&q=80",
    favicon_url: "/favicon.ico",
    phone: "+855 12 345 678",
    phone_secondary: "+855 23 999 888",
    email: "contact@auraglobal.com",
    address_en: "No. 128, Preah Norodom Blvd, Phnom Penh, Cambodia",
    address_km: "អគារលេខ ១២៨ មហាវិថីព្រះនរោត្តម រាជធានីភ្នំពេញ កម្ពុជា",
    google_maps_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3908.775836267746!2d104.922123!3d11.553421",
    social_facebook: "https://facebook.com/auraglobal",
    social_telegram: "https://t.me/auraglobal_kh",
    social_instagram: "https://instagram.com/auraglobal",
    social_tiktok: "https://tiktok.com/@auraglobal",
    footer_text_en: "© 2026 Aura Global Group. All rights reserved.",
    footer_text_km: "© ២០២៦ អូរ៉ា គ្លូប៊ល គ្រុប។ រក្សាសិទ្ធិគ្រប់យ៉ាង។",
    seo_meta_title: "Aura Global - Premium Coffee & Lifestyle Experience",
    seo_meta_description: "Discover exceptional specialty coffee, chef-crafted menus, and lifestyle community with Aura Global.",
    seo_keywords: "aura coffee, phnom penh coffee, brunch, artisan cafe, bakery cambodia"
  },
  menus: [
    { id: 1, parent_id: null, title_en: "Home", title_km: "ទំព័រដើម", url: "/", target: "_self", location: "header", sort_order: 1, is_active: true },
    { id: 2, parent_id: null, title_en: "Menu & Shop", title_km: "ម៉ឺនុយ និងហាង", url: "/shop", target: "_self", location: "header", sort_order: 2, is_active: true },
    { id: 3, parent_id: null, title_en: "Stories & Guide", title_km: "អត្ថបទ និងមគ្គុទ្ទេសក៍", url: "/learn", target: "_self", location: "header", sort_order: 3, is_active: true },
    { id: 4, parent_id: null, title_en: "Community", title_km: "សហគមន៍", url: "/community", target: "_self", location: "header", sort_order: 4, is_active: true },
    { id: 5, parent_id: null, title_en: "About Aura", title_km: "អំពីអូរ៉ា", url: "/pages/about", target: "_self", location: "footer_quick_links", sort_order: 1, is_active: true },
    { id: 6, parent_id: null, title_en: "Terms & Conditions", title_km: "លក្ខខណ្ឌប្រើប្រាស់", url: "/pages/terms", target: "_self", location: "footer_quick_links", sort_order: 2, is_active: true },
    { id: 7, parent_id: null, title_en: "Privacy Policy", title_km: "គោលការណ៍ឯកជនភាព", url: "/pages/privacy", target: "_self", location: "footer_quick_links", sort_order: 3, is_active: true }
  ],
  heroSlides: [
    {
      id: 1,
      badge_en: "✨ SPECIALTY ROAST 2026",
      badge_km: "✨ កាហ្វេលំដាប់ខ្ពស់ ២០២៦",
      title_en: "Pure Artisan Flavor & Ethical Highland Beans",
      title_km: "រសជាតិកាហ្វេពិតៗ និងគ្រាប់កាហ្វេតំបន់ខ្ពង់រាបធម្មជាតិ",
      subtitle_en: "Handcrafted espresso, single-origin pour-overs, and European sourdough pastries baked fresh every sunrise.",
      subtitle_km: "កាហ្វេប្រណិត គ្រាប់កាហ្វេពិសេស និងនំបុ័ងដុតថ្មីៗជារៀងរាល់ថ្ងៃ។",
      button_text_en: "Order Now",
      button_text_km: "កុម្ម៉ង់ឥឡូវនេះ",
      button_url: "/shop",
      image_url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80",
      sort_order: 1,
      is_active: true
    },
    {
      id: 2,
      badge_en: "🌿 BOTANICAL INFUSIONS",
      badge_km: "🌿 តែរុក្ខជាតិធម្មជាតិ",
      title_en: "Ceremonial Uji Matcha & Cascara Cold Brews",
      title_km: "តែបៃតងម៉ាត់ឆាអ៊ូជី និងកាហ្វេត្រជាក់",
      subtitle_en: "Direct-trade organic teas whisked with velvety plant milks and house lavender infusions.",
      subtitle_km: "តែសរីរាង្គកូរយ៉ាងម៉ត់ខៃជាមួយទឹកដោះគោរុក្ខជាតិ និងក្លិនផ្កាឡាវេនឌ័រ។",
      button_text_en: "Explore Beverages",
      button_text_km: "មើលបញ្ជីភេសជ្ជៈ",
      button_url: "/shop",
      image_url: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=1200&q=80",
      sort_order: 2,
      is_active: true
    }
  ],
  pages: [
    {
      id: 1,
      slug: "about",
      title_en: "Our Heritage & Philosophy",
      title_km: "ប្រវត្តិ និងទស្សនវិស័យរបស់យើង",
      content_en: "Founded in Phnom Penh, Aura Global bridges traditional coffee roasting craftsmanship with contemporary culinary aesthetics. Every batch is ethically sourced directly from smallholder farms in Mondulkiri and Vietnam highlands.",
      content_km: "បង្កើតឡើងនៅរាជធានីភ្នំពេញ អូរ៉ា គ្លូប៊ល រួមបញ្ចូលគ្នានូវសិល្បៈកាហ្វេប្រពៃណី និងភាពច្នៃប្រឌិតទាន់សម័យ។ គ្រាប់កាហ្វេនីមួយៗត្រូវបានជ្រើសរើសយ៉ាងយកចិត្តទុកដាក់ពីកសិដ្ឋានតំបន់ខ្ពង់រាបខេត្តមណ្ឌលគិរី។",
      featured_image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=800&q=80",
      meta_title: "About Aura Global - Our Story",
      meta_description: "Learn about our artisan heritage, fair-trade bean sourcing, and passionate barista team.",
      status: "published"
    },
    {
      id: 2,
      slug: "terms",
      title_en: "Terms & Conditions",
      title_km: "លក្ខខណ្ឌប្រើប្រាស់",
      content_en: "By accessing Aura Global online ordering, Telegram Mini App, or dining at our venues, you agree to comply with our guest policies and payment guidelines.",
      content_km: "តាមរយៈការប្រើប្រាស់សេវាកម្មកុម្ម៉ង់អនឡាញ ឬ Telegram Mini App របស់ អូរ៉ា គ្លូប៊ល លោកអ្នកយល់ព្រមគោរពតាមគោលការណ៍របស់ហាង។",
      status: "published"
    },
    {
      id: 3,
      slug: "privacy",
      title_en: "Privacy & Data Protection",
      title_km: "គោលការណ៍ឯកជនភាព",
      content_en: "We protect your contact and delivery preferences with strict industry standards. We never sell or distribute your private data.",
      content_km: "យើងប្តេជ្ញាការពារទិន្នន័យផ្ទាល់ខ្លួន និងព័ត៌មានដឹកជញ្ជូនរបស់អ្នកដោយសុវត្ថិភាពខ្ពស់បំផុត។",
      status: "published"
    }
  ],
  blogCategories: [
    { id: 1, slug: "coffee-culture", name_en: "Coffee Culture", name_km: "វប្បធម៌កាហ្វេ", sort_order: 1 },
    { id: 2, slug: "brewing-guides", name_en: "Brewing Guides", name_km: "វិធីឆុងកាហ្វេ", sort_order: 2 },
    { id: 3, slug: "announcements", name_en: "News & Events", name_km: "ព័ត៌មាន និងព្រឹត្តិការណ៍", sort_order: 3 }
  ],
  posts: [
    {
      id: 1,
      category_id: 1,
      slug: "mastering-v60-pourover",
      title_en: "The Art of Pour-Over: Step-by-Step V60 Ritual",
      title_km: "សិល្បៈនៃការឆុងកាហ្វេ V60 ដោយដៃ",
      excerpt_en: "Unlock floral notes and crisp acidity with this precise water-to-coffee ratio guide.",
      excerpt_km: "ស្វែងយល់ពីក្បួនឆុងកាហ្វេដ៏ឈ្ងុយឆ្ងាញ់ជាមួយសមាមាត្រកាហ្វេ និងទឹកដ៏ត្រឹមត្រូវ។",
      body_en: "To achieve the clearest cup, maintain a 1:16 brew ratio with water heated precisely to 93°C. Pour in steady concentric circles, allowing a 45-second bloom phase.",
      body_km: "ដើម្បីទទួលបានកាហ្វេដែលមានរសជាតិឆ្ងាញ់ សូមប្រើសមាមាត្រ ១:១៦ ជាមួយទឹកក្តៅ ៩៣ អង្សាសេ ហើយរង់ចាំ ៤៥ វិនាទីក្នុងដំណាក់កាលទីមួយ។",
      cover_image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
      author_name: "Master Roaster Sophea",
      tags: ["Pour-Over", "V60", "Barista Guide"],
      status: "published",
      views_count: 342,
      published_at: "2026-09-01T08:00:00.000Z"
    },
    {
      id: 2,
      category_id: 2,
      slug: "origin-of-our-mondulkiri-beans",
      title_en: "From Plantation to Cup: Sustainable Beans from Mondulkiri",
      title_km: "ពីចម្ការមកកាន់ពែងកាហ្វេ៖ គ្រាប់កាហ្វេមណ្ឌលគិរី",
      excerpt_en: "How direct farmer partnerships bring Cambodia's premier highland Arabica directly to your table.",
      excerpt_km: "ស្វែងយល់ពីកិច្ចសហការជាមួយកសិករនៅខេត្តមណ្ឌលគិរីដើម្បីនាំយកកាហ្វេធម្មជាតិពិតៗ។",
      body_en: "Grown at 800m elevation in rich basalt volcanic soil, our Mondulkiri harvest develops notes of dark chocolate, hazelnut, and wild honey.",
      body_km: "ដីភ្នំភ្លើងដ៏មានជីជាតិនៅខេត្តមណ្ឌលគិរី ផ្តល់នូវគ្រាប់កាហ្វេរសជាតិឈ្ងុយ និងមានគុណភាពខ្ពស់។",
      cover_image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80",
      author_name: "Agronomist Team",
      tags: ["Cambodia Coffee", "Mondulkiri", "Origin"],
      status: "published",
      views_count: 512,
      published_at: "2026-08-20T08:00:00.000Z"
    }
  ],
  teamMembers: [
    {
      id: 1,
      name: "Sophea Kim",
      position_en: "Head Barista & Roaster",
      position_km: "ប្រធានអ្នកឆុងកាហ្វេ និងលីងគ្រាប់",
      bio_en: "National Barista Champion 2024 with over 9 years crafting specialty coffee profiles.",
      bio_km: "ជើងឯក Barista ថ្នាក់ជាតិ ឆ្នាំ២០២៤ មានបទពិសោធន៍ជាង ៩ឆ្នាំក្នុងវិស័យកាហ្វេ។",
      photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
      social_telegram: "@sopheakim",
      social_linkedin: "https://linkedin.com/in/sophea-kim",
      sort_order: 1,
      is_active: true
    },
    {
      id: 2,
      name: "David Chen",
      position_en: "Executive Pastry Chef",
      position_km: "មេចុងភៅនំបុ័ងជាន់ខ្ពស់",
      bio_en: "Le Cordon Bleu graduate dedicated to authentic croissants, sourdough, and fruit tarts.",
      bio_km: "បញ្ចប់ការសិក្សាពី Le Cordon Bleu ជំនាញខាងនំបុ័ង Croissant និងនំខេក។",
      photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      social_telegram: "@davidpastry",
      social_linkedin: "https://linkedin.com/in/david-chen",
      sort_order: 2,
      is_active: true
    },
    {
      id: 3,
      name: "Chanthou Meas",
      position_en: "Hospitality & Operations Director",
      position_km: "នាយិកាប្រតិបត្តិការ និងសេវាកម្ម",
      bio_en: "Passionate about creating unforgettable boutique guest experiences across all stores.",
      bio_km: "យកចិត្តទុកដាក់ខ្ពស់លើការផ្តល់បទពិសោធន៍ដ៏ល្អឥតខ្ចោះដល់អតិថិជន។",
      photo_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
      social_telegram: "@chanthoumeas",
      sort_order: 3,
      is_active: true
    }
  ],
  testimonials: [
    {
      id: 1,
      author_name: "Kosal Chea",
      author_role_en: "Architect & Frequent Guest",
      author_role_km: "ស្ថាបត្យករ",
      avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
      rating: 5,
      quote_en: "The best flat white in Phnom Penh hands down. The cozy ambience, ergonomic seating, and fast Wi-Fi make it my daily creative hub.",
      quote_km: "កាហ្វេ Flat White ឆ្ងាញ់ដាច់គេនៅភ្នំពេញ បរិយាកាសស្ងប់ស្ងាត់ល្អសម្រាប់ធ្វើការងារ។",
      is_approved: true,
      sort_order: 1
    },
    {
      id: 2,
      author_name: "Jessica Taylor",
      author_role_en: "Creative Director",
      author_role_km: "នាយិកាផ្នែកច្នៃប្រឌិត",
      avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      rating: 5,
      quote_en: "Their pastries are authentic French caliber. The almond croissant paired with cold brew is pure bliss every Saturday morning!",
      quote_km: "នំបុ័ង Croissant រសជាតិដើមបារាំងពិតៗ ញ៉ាំជាមួយកាហ្វេត្រជាក់ពិតជាត្រូវគ្នាណាស់។",
      is_approved: true,
      sort_order: 2
    }
  ],
  faqs: [
    {
      id: 1,
      category: "Ordering",
      question_en: "Can I order directly via Telegram without downloading a mobile app?",
      question_km: "តើខ្ញុំអាចកុម្ម៉ង់តាមតេឡេក្រាមបានទេ?",
      answer_en: "Yes! Our Telegram Mini App opens instantly inside Telegram with zero installation, full menu browsing, ABA KHQR payment, and live delivery tracking.",
      answer_km: "ពិតជាបាន! លោកអ្នកអាចកុម្ម៉ង់ផ្ទាល់តាម Telegram Mini App ដោយមិនបាច់ដំឡើងកម្មវិធីបន្ថែម និងគាំទ្រការទូទាត់តាម ABA KHQR។",
      sort_order: 1,
      is_active: true
    },
    {
      id: 2,
      category: "Dietary",
      question_en: "Do you offer vegan and non-dairy milk options?",
      question_km: "តើហាងមានជម្រើសទឹកដោះគោរុក្ខជាតិដែរឬទេ?",
      answer_en: "We proudly offer premium barista oat milk, almond milk, and soy milk across all espresso and specialty tea beverages at no extra wait time.",
      answer_km: "យើងមានទឹកដោះគោអូត (Oat Milk) ទឹកដោះគោអាល់ម៉ុន និងទឹកដោះសណ្ដែកសៀងសម្រាប់ភេសជ្ជៈទាំងអស់។",
      sort_order: 2,
      is_active: true
    },
    {
      id: 3,
      category: "Catering",
      question_en: "Do you cater for corporate meetings and private events?",
      question_km: "តើមានសេវាកម្មរៀបចំអាហារសម្រាប់កម្មវិធី និងការប្រជុំទេ?",
      answer_en: "Yes, our mobile espresso bar and bakery boxes are available for office events, workshops, and private parties.",
      answer_km: "បាទ/ចាស យើងមានសេវាកម្មរៀបចំកាហ្វេ និងនំសម្រាប់កម្មវិធីជួបជុំ និងការប្រជុំក្រុមហ៊ុន។",
      sort_order: 3,
      is_active: true
    }
  ],
  partners: [
    {
      id: 1,
      name: "ABA Bank KHQR",
      logo_url: "https://upload.wikimedia.org/wikipedia/commons/4/4b/ABA_Bank_logo.png",
      website_url: "https://www.ababank.com",
      sort_order: 1,
      is_active: true
    },
    {
      id: 2,
      name: "Specialty Coffee Association",
      logo_url: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=200&q=80",
      website_url: "https://sca.coffee",
      sort_order: 2,
      is_active: true
    }
  ],
  contactMessages: [
    {
      id: 1,
      name: "Rithy Seng",
      email: "rithy.seng@gmail.com",
      phone: "+855 77 123 456",
      subject: "Private Event Booking Inquiry",
      message: "Hello Aura team, we would like to book the 2nd floor lounge for a team workshop of 20 people next Friday. Do you offer set brunch packages?",
      is_read: false,
      admin_reply: null,
      created_at: "2026-09-28T14:20:00.000Z"
    }
  ],
  subscribers: [
    { id: 1, email: "coffee.lover@example.com", status: "subscribed", subscribed_at: "2026-09-15T10:00:00.000Z" },
    { id: 2, email: "sophea.dev@example.com", status: "subscribed", subscribed_at: "2026-09-20T11:30:00.000Z" }
  ],
  media: [
    {
      id: 1,
      file_name: "hero-espresso.jpg",
      file_path: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80",
      mime_type: "image/jpeg",
      file_size: 142000,
      alt_text: "Artisan espresso extraction",
      created_at: "2026-09-01T00:00:00.000Z"
    },
    {
      id: 2,
      file_name: "matcha-ceremony.jpg",
      file_path: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=1200&q=80",
      mime_type: "image/jpeg",
      file_size: 165000,
      alt_text: "Fresh ceremonial matcha bowl",
      created_at: "2026-09-01T00:00:00.000Z"
    }
  ]
};

// Memory cache
let cachedData = null;

function loadData() {
  if (cachedData) return cachedData;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      cachedData = JSON.parse(raw);
    } else {
      cachedData = JSON.parse(JSON.stringify(DEFAULT_CMS_DATA));
      saveData(cachedData);
    }
  } catch (err) {
    console.error('[CMS Storage] Read error, resetting cache:', err.message);
    cachedData = JSON.parse(JSON.stringify(DEFAULT_CMS_DATA));
  }
  return cachedData;
}

function saveData(data) {
  try {
    cachedData = data;
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[CMS Storage] Write error:', err.message);
  }
}

module.exports = {
  getAll() {
    return loadData();
  },

  getSettings() {
    return loadData().settings;
  },

  updateSettings(newSettings) {
    const data = loadData();
    data.settings = { ...data.settings, ...newSettings };
    saveData(data);
    return data.settings;
  },

  getMenus() {
    return loadData().menus || [];
  },

  saveMenu(menuItem) {
    const data = loadData();
    data.menus = data.menus || [];
    if (menuItem.id) {
      const idx = data.menus.findIndex(m => Number(m.id) === Number(menuItem.id));
      if (idx !== -1) {
        data.menus[idx] = { ...data.menus[idx], ...menuItem };
      } else {
        data.menus.push(menuItem);
      }
    } else {
      const newId = data.menus.length ? Math.max(...data.menus.map(m => Number(m.id) || 0)) + 1 : 1;
      menuItem.id = newId;
      data.menus.push(menuItem);
    }
    saveData(data);
    return menuItem;
  },

  deleteMenu(id) {
    const data = loadData();
    data.menus = (data.menus || []).filter(m => Number(m.id) !== Number(id));
    saveData(data);
    return true;
  },

  getHeroSlides() {
    return loadData().heroSlides || [];
  },

  saveHeroSlide(slide) {
    const data = loadData();
    data.heroSlides = data.heroSlides || [];
    if (slide.id) {
      const idx = data.heroSlides.findIndex(s => Number(s.id) === Number(slide.id));
      if (idx !== -1) {
        data.heroSlides[idx] = { ...data.heroSlides[idx], ...slide };
      } else {
        data.heroSlides.push(slide);
      }
    } else {
      const newId = data.heroSlides.length ? Math.max(...data.heroSlides.map(s => Number(s.id) || 0)) + 1 : 1;
      slide.id = newId;
      data.heroSlides.push(slide);
    }
    saveData(data);
    return slide;
  },

  deleteHeroSlide(id) {
    const data = loadData();
    data.heroSlides = (data.heroSlides || []).filter(s => Number(s.id) !== Number(id));
    saveData(data);
    return true;
  },

  getPages() {
    return loadData().pages || [];
  },

  savePage(page) {
    const data = loadData();
    data.pages = data.pages || [];
    if (page.id) {
      const idx = data.pages.findIndex(p => Number(p.id) === Number(page.id));
      if (idx !== -1) {
        data.pages[idx] = { ...data.pages[idx], ...page };
      } else {
        data.pages.push(page);
      }
    } else {
      const newId = data.pages.length ? Math.max(...data.pages.map(p => Number(p.id) || 0)) + 1 : 1;
      page.id = newId;
      data.pages.push(page);
    }
    saveData(data);
    return page;
  },

  deletePage(id) {
    const data = loadData();
    data.pages = (data.pages || []).filter(p => Number(p.id) !== Number(id));
    saveData(data);
    return true;
  },

  getPosts() {
    return loadData().posts || [];
  },

  savePost(post) {
    const data = loadData();
    data.posts = data.posts || [];
    if (post.id) {
      const idx = data.posts.findIndex(p => Number(p.id) === Number(post.id));
      if (idx !== -1) {
        data.posts[idx] = { ...data.posts[idx], ...post };
      } else {
        data.posts.push(post);
      }
    } else {
      const newId = data.posts.length ? Math.max(...data.posts.map(p => Number(p.id) || 0)) + 1 : 1;
      post.id = newId;
      post.published_at = post.published_at || new Date().toISOString();
      data.posts.push(post);
    }
    saveData(data);
    return post;
  },

  deletePost(id) {
    const data = loadData();
    data.posts = (data.posts || []).filter(p => Number(p.id) !== Number(id));
    saveData(data);
    return true;
  },

  getTeam() {
    return loadData().teamMembers || [];
  },

  saveTeamMember(member) {
    const data = loadData();
    data.teamMembers = data.teamMembers || [];
    if (member.id) {
      const idx = data.teamMembers.findIndex(m => Number(m.id) === Number(member.id));
      if (idx !== -1) {
        data.teamMembers[idx] = { ...data.teamMembers[idx], ...member };
      } else {
        data.teamMembers.push(member);
      }
    } else {
      const newId = data.teamMembers.length ? Math.max(...data.teamMembers.map(m => Number(m.id) || 0)) + 1 : 1;
      member.id = newId;
      data.teamMembers.push(member);
    }
    saveData(data);
    return member;
  },

  deleteTeamMember(id) {
    const data = loadData();
    data.teamMembers = (data.teamMembers || []).filter(m => Number(m.id) !== Number(id));
    saveData(data);
    return true;
  },

  getTestimonials() {
    return loadData().testimonials || [];
  },

  saveTestimonial(item) {
    const data = loadData();
    data.testimonials = data.testimonials || [];
    if (item.id) {
      const idx = data.testimonials.findIndex(t => Number(t.id) === Number(item.id));
      if (idx !== -1) {
        data.testimonials[idx] = { ...data.testimonials[idx], ...item };
      } else {
        data.testimonials.push(item);
      }
    } else {
      const newId = data.testimonials.length ? Math.max(...data.testimonials.map(t => Number(t.id) || 0)) + 1 : 1;
      item.id = newId;
      data.testimonials.push(item);
    }
    saveData(data);
    return item;
  },

  deleteTestimonial(id) {
    const data = loadData();
    data.testimonials = (data.testimonials || []).filter(t => Number(t.id) !== Number(id));
    saveData(data);
    return true;
  },

  getFaqs() {
    return loadData().faqs || [];
  },

  saveFaq(faq) {
    const data = loadData();
    data.faqs = data.faqs || [];
    if (faq.id) {
      const idx = data.faqs.findIndex(f => Number(f.id) === Number(faq.id));
      if (idx !== -1) {
        data.faqs[idx] = { ...data.faqs[idx], ...faq };
      } else {
        data.faqs.push(faq);
      }
    } else {
      const newId = data.faqs.length ? Math.max(...data.faqs.map(f => Number(f.id) || 0)) + 1 : 1;
      faq.id = newId;
      data.faqs.push(faq);
    }
    saveData(data);
    return faq;
  },

  deleteFaq(id) {
    const data = loadData();
    data.faqs = (data.faqs || []).filter(f => Number(f.id) !== Number(id));
    saveData(data);
    return true;
  },

  getPartners() {
    return loadData().partners || [];
  },

  savePartner(partner) {
    const data = loadData();
    data.partners = data.partners || [];
    if (partner.id) {
      const idx = data.partners.findIndex(p => Number(p.id) === Number(partner.id));
      if (idx !== -1) {
        data.partners[idx] = { ...data.partners[idx], ...partner };
      } else {
        data.partners.push(partner);
      }
    } else {
      const newId = data.partners.length ? Math.max(...data.partners.map(p => Number(p.id) || 0)) + 1 : 1;
      partner.id = newId;
      data.partners.push(partner);
    }
    saveData(data);
    return partner;
  },

  deletePartner(id) {
    const data = loadData();
    data.partners = (data.partners || []).filter(p => Number(p.id) !== Number(id));
    saveData(data);
    return true;
  },

  getInquiries() {
    return loadData().contactMessages || [];
  },

  addInquiry(inquiry) {
    const data = loadData();
    data.contactMessages = data.contactMessages || [];
    const newId = data.contactMessages.length ? Math.max(...data.contactMessages.map(m => Number(m.id) || 0)) + 1 : 1;
    const item = {
      id: newId,
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone || '',
      subject: inquiry.subject || 'General Inquiry',
      message: inquiry.message,
      is_read: false,
      admin_reply: null,
      created_at: new Date().toISOString()
    };
    data.contactMessages.unshift(item);
    saveData(data);
    return item;
  },

  updateInquiry(id, updateData) {
    const data = loadData();
    data.contactMessages = data.contactMessages || [];
    const idx = data.contactMessages.findIndex(m => Number(m.id) === Number(id));
    if (idx !== -1) {
      data.contactMessages[idx] = { ...data.contactMessages[idx], ...updateData };
      saveData(data);
      return data.contactMessages[idx];
    }
    return null;
  },

  deleteInquiry(id) {
    const data = loadData();
    data.contactMessages = (data.contactMessages || []).filter(m => Number(m.id) !== Number(id));
    saveData(data);
    return true;
  },

  getSubscribers() {
    return loadData().subscribers || [];
  },

  addSubscriber(email) {
    const data = loadData();
    data.subscribers = data.subscribers || [];
    const exists = data.subscribers.find(s => s.email.toLowerCase() === email.toLowerCase());
    if (exists) return exists;
    const newId = data.subscribers.length ? Math.max(...data.subscribers.map(s => Number(s.id) || 0)) + 1 : 1;
    const item = { id: newId, email, status: 'subscribed', subscribed_at: new Date().toISOString() };
    data.subscribers.unshift(item);
    saveData(data);
    return item;
  },

  deleteSubscriber(id) {
    const data = loadData();
    data.subscribers = (data.subscribers || []).filter(s => Number(s.id) !== Number(id));
    saveData(data);
    return true;
  },

  getMedia() {
    return loadData().media || [];
  },

  addMedia(mediaItem) {
    const data = loadData();
    data.media = data.media || [];
    const newId = data.media.length ? Math.max(...data.media.map(m => Number(m.id) || 0)) + 1 : 1;
    mediaItem.id = newId;
    mediaItem.created_at = new Date().toISOString();
    data.media.unshift(mediaItem);
    saveData(data);
    return mediaItem;
  },

  deleteMedia(id) {
    const data = loadData();
    data.media = (data.media || []).filter(m => Number(m.id) !== Number(id));
    saveData(data);
    return true;
  },

  bulkImport(collection, items) {
    const data = loadData();
    const key = collection === 'story' ? 'stories' : collection;
    if (!data[key]) {
      data[key] = [];
    }
    const timestamp = new Date().toISOString();
    const formatted = items.map((it, idx) => ({
      ...it,
      id: it.id || (Date.now() + idx),
      created_at: it.created_at || timestamp,
      updated_at: timestamp,
    }));
    data[key] = [...formatted, ...data[key]];
    saveData(data);
    return formatted;
  }
};
