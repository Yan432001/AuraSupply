/**
 * Centralized Authentication & Session Management Configuration
 * Modeled strictly on CodeIgniter 3 AURA_v1 (bpas/config/config.php & ion_auth.php)
 */

module.exports = {
  // --------------------------------------------------------------------------
  // Base URLs (Development & Production Environments)
  // --------------------------------------------------------------------------
  urls: {
    adminBaseUrl: process.env.ADMIN_BASE_URL || '/admins',
    webBaseUrl: process.env.WEB_BASE_URL || '/',
    apiBaseUrl: process.env.API_BASE_URL || '/api',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    publicAppUrl: process.env.PUBLIC_APP_URL || 'http://localhost:3000'
  },

  // --------------------------------------------------------------------------
  // Session & Cookie Configuration ($config['sess_*'] & $config['cookie_*'])
  // --------------------------------------------------------------------------
  session: {
    // Isolated session cookie names to prevent admin & website cross-contamination
    adminCookieName: 'aura_admin_session',
    webCookieName: 'aura_web_session',
    cookiePrefix: 'aura_',
    cookieDomain: process.env.COOKIE_DOMAIN || undefined,
    cookiePath: '/',
    // Cookie security attributes
    cookieHttpOnly: true, // Prevents XSS token exfiltration
    cookieSecure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
    cookieSameSite: 'lax', // Protects against CSRF while permitting top-level navigation

    // Expirations (in seconds)
    sessExpiration: Number(process.env.SESSION_EXPIRATION) || 7200, // 2 Hours active session
    rememberExpiration: 30 * 24 * 3600, // 30 Days if "Remember Me" is checked

    // Automatic Inactivity Logout (Requirement 5)
    // Inactivity timeout in seconds: default 20 minutes (1200 seconds)
    inactivityTimeout: Number(process.env.SESSION_INACTIVITY_TIMEOUT) || 1200
  },

  // --------------------------------------------------------------------------
  // Ion Auth & Lockout Settings ($config['track_login_attempts'], etc.)
  // --------------------------------------------------------------------------
  ionAuth: {
    trackLoginAttempts: true,
    maximumLoginAttempts: 5,
    lockoutTimeSeconds: 900, // 15 Minutes
    hashMethod: 'bcrypt',
    defaultRounds: 10
  }
};
