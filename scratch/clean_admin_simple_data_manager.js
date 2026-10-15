const fs = require('fs');

let code = fs.readFileSync('AuraTheme/src/pages/admins/AdminSimpleDataManager.jsx', 'utf8');

// Replace import
const oldImport = "import { loadWebsiteData, saveWebsiteData } from '../../data/websiteDataManager';";
const newImport = `const STORAGE_KEY = 'aura_website_simple_data_v2';
const loadWebsiteData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { users: [], posts: [], stories: [], media: [], categories: [], comments: [] };
  } catch {
    return { users: [], posts: [], stories: [], media: [], categories: [], comments: [] };
  }
};
const saveWebsiteData = (d) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch (_) {}
};`;

if (!code.includes(oldImport)) {
  console.error('Could not find oldImport');
  process.exit(1);
}
code = code.replace(oldImport, newImport);

// Add API data hydration
const effectTarget = '  // Keep in sync with query parameter';
const effectCode = `  // Load real database data for users, posts, categories
  useEffect(() => {
    Promise.allSettled([
      fetch('/api/admin/users').then(r => r.json()),
      fetch('/api/posts').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
    ]).then(([uRes, pRes, cRes]) => {
      setDataStore(prev => {
        const next = { ...prev };
        if (uRes.status === 'fulfilled' && uRes.value?.status && Array.isArray(uRes.value.data)) {
          next.users = uRes.value.data.map(u => ({
            id: u.id,
            username: u.username,
            name: \`\${u.first_name || ''} \${u.last_name || ''}\`.trim() || u.username,
            email: u.email,
            role: u.group_id === 1 ? 'Owner / Super Admin' : 'Admin Staff',
            status: Number(u.active) === 1 ? 'active' : 'inactive',
            phone: u.phone || '',
          }));
        }
        if (pRes.status === 'fulfilled' && pRes.value?.success && Array.isArray(pRes.value.data)) {
          next.posts = pRes.value.data;
        }
        if (cRes.status === 'fulfilled' && cRes.value?.success && Array.isArray(cRes.value.data)) {
          next.categories = cRes.value.data;
        }
        return next;
      });
    }).catch(err => console.warn('AdminSimpleDataManager load error:', err));
  }, []);

  // Keep in sync with query parameter`;

code = code.replace(effectTarget, effectCode);

// Replace unsplash input placeholders
code = code.replace(/https:\/\/images\.unsplash\.com\/\.\.\./g, '/assets/uploads/image.png or https://...');

fs.writeFileSync('AuraTheme/src/pages/admins/AdminSimpleDataManager.jsx', code, 'utf8');
console.log('Successfully updated AdminSimpleDataManager.jsx');
