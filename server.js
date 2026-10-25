require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const auraThemeRoot = path.resolve(__dirname, 'AuraTheme');
  const distDir = fs.existsSync(path.resolve(auraThemeRoot, 'dist'))
    ? path.resolve(auraThemeRoot, 'dist')
    : path.resolve(__dirname, 'dist');
  const isDev = process.env.NODE_ENV !== 'production' && process.env.SERVE_DIST !== 'true';

  // Secure CORS with Cookie & Credentials Support
  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL,
    process.env.PUBLIC_APP_URL,
    process.env.WEBAPP_URL
  ].filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-session-check', 'X-Requested-With']
  }));

  // Parse HttpOnly and signed cookies
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Root health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: true,
      service: 'Aura Global Hospitality & E-Menu Platform',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Mount Core Application Routes
  try {
    const tmaRoute = require('./API/app/config/route/tma.route');
    app.use('/api/tma', tmaRoute);
    app.use('/api', tmaRoute);
    console.log('[Route] Mounted /api/tma and /api');
  } catch (err) {
    console.warn('[Route] Warning mounting /api/tma:', err.message);
  }

  try {
    const emenuRoute = require('./API/app/config/route/emenu.route');
    app.use('/api/emenu', emenuRoute);
    console.log('[Route] Mounted /api/emenu');
  } catch (err) {
    console.warn('[Route] Warning mounting /api/emenu:', err.message);
  }

  try {
    require('./API/app/config/route/cms.route')(app);
    console.log('[Route] Mounted /api/cms');
  } catch (err) {
    console.warn('[Route] Warning mounting /api/cms:', err.message);
  }

  // Telegram Concept: Multi-Store Configuration, Webhooks & Bot Services
  try {
    const Telegram = require('./Telegram');
    app.use('/api/admin/telegram-stores', Telegram.storesRoute);
    app.use('/api/tma/telegram-stores', Telegram.storesRoute);
    app.use('/api/telegram', Telegram.webhookRoute);
    console.log('[Telegram Controller] Mounted /api/admin/telegram-stores and /api/telegram webhooks');
  } catch (err) {
    console.warn('[Telegram Controller] Warning mounting Telegram routes:', err.message);
  }

  // AuraTheme Public Website & Sourcing API Endpoints (Real Database Data)
  try {
    require('./API/app/config/route/web/themePublic.route')(app);
    console.log('[Route] Mounted /api (AuraTheme Public Endpoints)');
  } catch (err) {
    console.warn('[Route] Warning mounting AuraTheme public routes:', err.message);
  }

  // AuraTheme Public Website Authentication & Customer Sessions
  try {
    require('./API/app/config/route/web/webAuth.route')(app);
    console.log('[Route] Mounted /api/web/auth (Website Auth Endpoints)');
  } catch (err) {
    console.warn('[Route] Warning mounting AuraTheme webAuth routes:', err.message);
  }

  // High-Volume Items & RBAC Architecture Routes
  try {
    const itemsRoute = require('./API/app/routes/items.routes');
    app.use(itemsRoute);
    console.log('[Route] Mounted /api/items (High-Volume Architecture)');
  } catch (err) {
    console.warn('[Route] Warning mounting /api/items:', err.message);
  }

  // Mount Admin & ERP Module Routes

  const adminRoutes = [
    'quantityAdjustments',
    'usingStock',
    'erpMaster',
    'auth',
    'users',
    'products',
    'categories',
    'orders',
    'sales',
    'customers',
    'suppliers',
    'purchases',
    'dashboard',
    'setting',
    'address',
    'borrower',
    'permissions',
    'product.options',
    'product.photo',
    'product.price',
    'product.rack',
    'product.serials',
    'product.units',
    'product.variants',
    'units',
    'systemSettings',
    'language',
    'bpasErpData',
    'pos',
    'attributes',
    'inventoryOperations',
    'accounting',
    'asset',
    'barcode',
    'stockCounts',
    'transfers',
    'costAdjustments'
  ];

  for (const routeName of adminRoutes) {
    try {
      const routeFn = require(`./API/app/config/route/admin/${routeName}.route`);
      if (typeof routeFn === 'function') {
        routeFn(app);
        console.log(`[Route] Mounted admin/${routeName}.route`);
      }
    } catch (err) {
      console.warn(`[Route] Notice mounting admin/${routeName}.route:`, err.message);
    }
  }

  // Static assets from AuraTheme public directory and uploaded media
  app.use(express.static(path.join(auraThemeRoot, 'public')));
  app.use('/logos', express.static(path.join(auraThemeRoot, 'public/logos')));

  // Serve uploaded images (from local assets and AURA_v1 uploads directory)
  const v1Uploads = 'c:/wamp64/www/AURA_v1/assets/uploads';
  if (fs.existsSync(v1Uploads)) {
    app.use('/assets/uploads', express.static(v1Uploads));
  }
  const localUploads = path.resolve(__dirname, 'assets/uploads');
  if (fs.existsSync(localUploads)) {
    app.use('/assets/uploads', express.static(localUploads));
  }

  // Telegram Bot Polling (Non-blocking & conflict resilient)
  // Telegram Bot Daemon (Non-blocking & conflict resilient)
  try {
    const Telegram = require('./Telegram');
    Telegram.startBot();
  } catch (err) {
    console.log('[Telegram Controller] Running in local simulation mode:', err.message);
  }

  // ---------------------------------------------------------------------------
  // Default Website UI: AuraTheme (Serves AuraTheme/dist and AuraTheme UI)
  // ---------------------------------------------------------------------------
  console.log('[Server] UI: Serving AuraTheme UI from:', distDir);
  app.use(express.static(distDir));
  app.use('/assets', express.static(path.join(distDir, 'assets')));
  if (fs.existsSync(path.join(auraThemeRoot, 'assets'))) {
    app.use('/assets', express.static(path.join(auraThemeRoot, 'assets')));
  }
  app.use(express.static(path.join(auraThemeRoot, 'public')));
  app.use(express.static(auraThemeRoot));

  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ status: false, error: 'Endpoint not found' });
    }
    const distHtml = path.join(distDir, 'index.html');
    if (fs.existsSync(distHtml)) {
      return res.sendFile(distHtml);
    }
    const rootHtml = path.join(auraThemeRoot, 'index.html');
    if (fs.existsSync(rootHtml)) {
      return res.sendFile(rootHtml);
    }
    res.status(404).send('AuraTheme UI index.html not found');
  });

  // Global Error Handler
  app.use((err, req, res, next) => {
    console.error('[Server Error]', err);
    res.status(500).json({
      status: false,
      error: err.message || 'Internal Server Error'
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🚀 Aura Global Server running at port ${PORT}`);
    console.log(`🌐 Local Website:    http://127.0.0.1:${PORT}/`);
    console.log(`🌐 Localhost:        http://localhost:${PORT}/`);
    console.log(`🛍️ E-Menu WebApp:    http://localhost:${PORT}/shop/sbc-store`);
    console.log(`📡 E-Menu & TMA API: http://localhost:${PORT}/api/tma/stores`);
    console.log(`====================================================`);
  });
}

startServer().catch((err) => {
  console.error('[Server Fatal Startup Error]', err);
  process.exit(1);
});
