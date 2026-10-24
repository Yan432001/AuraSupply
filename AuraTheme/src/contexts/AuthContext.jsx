import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

// Ensure all Axios HTTP requests carry secure cookies across origins
axios.defaults.withCredentials = true;

// Storage Keys
const ADMIN_KEYS = {
  token: 'aura_admin_token',
  user: 'aura_admin_user',
  activity: 'aura_admin_last_activity'
};

const WEB_KEYS = {
  token: 'aura_web_token',
  user: 'aura_web_user',
  activity: 'aura_web_last_activity'
};

// Default Inactivity Idle Timeout: 20 Minutes (1200 seconds)
const DEFAULT_INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000;

// Helper to verify if JWT string is expired or malformed
const isTokenExpired = (rawToken) => {
  if (!rawToken || typeof rawToken !== 'string') return true;
  try {
    const parts = rawToken.split('.');
    if (parts.length !== 3) return false;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    if (decoded && decoded.exp) {
      return Date.now() >= decoded.exp * 1000;
    }
    return false;
  } catch (_) {
    return true;
  }
};

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentPath, setCurrentPath] = useState(() => (typeof window !== 'undefined' ? window.location.pathname : '/'));
  const isAdminArea = currentPath.startsWith('/admins') || currentPath.startsWith('/pos');

  // --------------------------------------------------------------------------
  // 1. Admin Authentication State (aura_admin_*)
  // --------------------------------------------------------------------------
  const [adminToken, setAdminToken] = useState(() => {
    const saved = localStorage.getItem(ADMIN_KEYS.token) || (!localStorage.getItem(WEB_KEYS.token) ? localStorage.getItem('token') : null);
    if (!saved || isTokenExpired(saved)) {
      localStorage.removeItem(ADMIN_KEYS.token);
      localStorage.removeItem(ADMIN_KEYS.user);
      return null;
    }
    return saved;
  });

  const [adminUser, setAdminUser] = useState(() => {
    try {
      const savedToken = localStorage.getItem(ADMIN_KEYS.token) || (!localStorage.getItem(WEB_KEYS.token) ? localStorage.getItem('token') : null);
      if (!savedToken || isTokenExpired(savedToken)) return null;
      const savedUser = localStorage.getItem(ADMIN_KEYS.user) || (!localStorage.getItem(WEB_KEYS.user) ? localStorage.getItem('user') : null);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  // --------------------------------------------------------------------------
  // 2. Website Customer Authentication State (aura_web_*)
  // --------------------------------------------------------------------------
  const [webToken, setWebToken] = useState(() => {
    const saved = localStorage.getItem(WEB_KEYS.token);
    if (!saved || isTokenExpired(saved)) {
      localStorage.removeItem(WEB_KEYS.token);
      localStorage.removeItem(WEB_KEYS.user);
      return null;
    }
    return saved;
  });

  const [webUser, setWebUser] = useState(() => {
    try {
      const savedToken = localStorage.getItem(WEB_KEYS.token);
      if (!savedToken || isTokenExpired(savedToken)) return null;
      const savedUser = localStorage.getItem(WEB_KEYS.user);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [loadingSession, setLoadingSession] = useState(true);
  const lastHeartbeatRef = useRef(0);

  // Sync active path changes
  useEffect(() => {
    const onLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', onLocationChange);
    return () => window.removeEventListener('popstate', onLocationChange);
  }, []);

  // Update Authorization header according to current section
  useEffect(() => {
    const activeToken = isAdminArea ? adminToken : (webToken || adminToken);
    if (activeToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${activeToken}`;
      // Legacy backward compatibility for older components reading localStorage('token')
      localStorage.setItem('token', activeToken);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [isAdminArea, adminToken, webToken]);

  // Active user depending on current section
  const user = isAdminArea ? adminUser : (webUser || adminUser);
  const token = isAdminArea ? adminToken : (webToken || adminToken);
  const effectiveUser = user?.user ? { ...user.user, ...user } : user;

  // Group Permissions ($this->GP in CodeIgniter 3)
  const GP = effectiveUser?.GP || effectiveUser?.permissionsMap || {};

  // Role flags matching CodeIgniter 3 MY_Controller
  const roleName = (effectiveUser?.group_name || effectiveUser?.role || effectiveUser?.group?.name || '').toLowerCase();
  const effectiveGroupId = Number(effectiveUser?.group_id || effectiveUser?.group?.id || 0);
  const effectiveLevel = Number(effectiveUser?.level || effectiveUser?.group?.level || 0);

  const isOwner = Boolean(
    effectiveGroupId === 1 || 
    effectiveLevel === 1 || 
    roleName === 'owner' || 
    effectiveUser?.Owner ||
    effectiveUser?.username === 'admin'
  );
  const isAdmin = Boolean(
    effectiveGroupId === 2 || 
    effectiveLevel === 2 || 
    roleName === 'admin' || 
    effectiveUser?.Admin
  );
  const isStore = Boolean(roleName === 'store' || effectiveUser?.Store);
  const isSupplier = Boolean(roleName === 'supplier' || effectiveUser?.Supplier);
  const isCustomer = Boolean(
    !isOwner && !isAdmin && (
      roleName === 'customer' || 
      effectiveUser?.Customer ||
      effectiveGroupId === 4
    )
  );
  const isSalesman = Boolean(
    roleName === 'salesman' || 
    roleName === 'sale-agents' || 
    roleName === 'saleman' || 
    effectiveUser?.Salesman
  );

  const isStaffOrAdmin = Boolean(
    effectiveUser &&
    !isCustomer &&
    roleName !== 'customer' &&
    effectiveGroupId !== 4 &&
    (
      isOwner ||
      isAdmin ||
      isStore ||
      isSalesman ||
      isSupplier ||
      Boolean(effectiveUser?.allow_admin_login) ||
      ['owner', 'admin', 'branch', 'salesman', 'employee', 'audit', 'account', 'cashier', 'stock', 'shop', 'store'].includes(roleName) ||
      (effectiveGroupId > 0 && effectiveGroupId !== 4)
    )
  );
  const canAccessOperationsPortal = isStaffOrAdmin;

  /**
   * Check if current user has permission ($this->GP)
   */
  const hasPermission = useCallback((permissionKey) => {
    if (!user) return false;
    if (isOwner || isAdmin) return true;
    if (GP && (GP[permissionKey] === 1 || GP[permissionKey] === true || GP[permissionKey] === '1')) {
      return true;
    }
    if (Array.isArray(user.permissions) && user.permissions.includes(permissionKey)) {
      return true;
    }
    return false;
  }, [user, isOwner, isAdmin, GP]);

  const hasAnyPermission = useCallback((...keys) => {
    return keys.flat().some(k => hasPermission(k));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((...keys) => {
    return keys.flat().every(k => hasPermission(k));
  }, [hasPermission]);

  // --------------------------------------------------------------------------
  // Admin Login & Logout Methods
  // --------------------------------------------------------------------------
  const loginAdmin = useCallback((authPayload) => {
    const rawToken = authPayload?.token || authPayload?.access_token || authPayload?.data?.token;
    const rawUser = authPayload?.user || authPayload?.profile || authPayload?.data?.user || authPayload;

    if (rawToken) {
      setAdminToken(rawToken);
      localStorage.setItem(ADMIN_KEYS.token, rawToken);
      localStorage.setItem(ADMIN_KEYS.activity, String(Date.now()));
      localStorage.setItem('token', rawToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${rawToken}`;
    }

    if (rawUser) {
      setAdminUser(rawUser);
      localStorage.setItem(ADMIN_KEYS.user, JSON.stringify(rawUser));
      localStorage.setItem('user', JSON.stringify(rawUser));
    }
  }, []);

  const logoutAdmin = useCallback(async (reason = null) => {
    try {
      const activeToken = adminToken || localStorage.getItem(ADMIN_KEYS.token);
      if (activeToken) {
        await axios.post('/api/admin/auth/logout', {}, {
          headers: { Authorization: `Bearer ${activeToken}` }
        }).catch(() => {});
      }
    } catch (_) {
      // Ignore network errors
    } finally {
      setAdminUser(null);
      setAdminToken(null);
      localStorage.removeItem(ADMIN_KEYS.token);
      localStorage.removeItem(ADMIN_KEYS.user);
      localStorage.removeItem(ADMIN_KEYS.activity);
      localStorage.removeItem('aura_emenu_cart_v2');

      const reasonQuery = reason ? `?reason=${encodeURIComponent(reason)}` : '';
      if (window.location.pathname.startsWith('/admins') || window.location.pathname.startsWith('/pos')) {
        window.location.href = `/admins/login${reasonQuery}`;
      }
    }
  }, [adminToken]);

  // --------------------------------------------------------------------------
  // Website Login & Logout Methods
  // --------------------------------------------------------------------------
  const loginWeb = useCallback((authPayload) => {
    const rawToken = authPayload?.token || authPayload?.access_token || authPayload?.data?.token;
    const rawUser = authPayload?.user || authPayload?.profile || authPayload?.data?.user || authPayload;

    if (rawToken) {
      setWebToken(rawToken);
      localStorage.setItem(WEB_KEYS.token, rawToken);
      localStorage.setItem(WEB_KEYS.activity, String(Date.now()));
      if (!window.location.pathname.startsWith('/admins')) {
        localStorage.setItem('token', rawToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${rawToken}`;
      }
    }

    if (rawUser) {
      setWebUser(rawUser);
      localStorage.setItem(WEB_KEYS.user, JSON.stringify(rawUser));
      if (!window.location.pathname.startsWith('/admins')) {
        localStorage.setItem('user', JSON.stringify(rawUser));
      }
    }
  }, []);

  const logoutWeb = useCallback(async (reason = null) => {
    try {
      const activeToken = webToken || localStorage.getItem(WEB_KEYS.token);
      if (activeToken) {
        await axios.post('/api/web/auth/logout', {}, {
          headers: { Authorization: `Bearer ${activeToken}` }
        }).catch(() => {});
      }
    } catch (_) {
      // Ignore network errors
    } finally {
      setWebUser(null);
      setWebToken(null);
      localStorage.removeItem(WEB_KEYS.token);
      localStorage.removeItem(WEB_KEYS.user);
      localStorage.removeItem(WEB_KEYS.activity);

      const reasonQuery = reason ? `?reason=${encodeURIComponent(reason)}` : '';
      if (!window.location.pathname.startsWith('/admins')) {
        window.location.href = `/login${reasonQuery}`;
      }
    }
  }, [webToken]);

  // Unified login & logout for backward compatibility
  const login = useCallback((authPayload) => {
    const isCustomerAccount = authPayload?.role === 'customer' || authPayload?.group_id === 4 || authPayload?.user?.role === 'customer';
    if (isCustomerAccount) {
      loginWeb(authPayload);
    } else {
      loginAdmin(authPayload);
    }
  }, [loginWeb, loginAdmin]);

  const logout = useCallback(async (reason = null) => {
    if (window.location.pathname.startsWith('/admins') || window.location.pathname.startsWith('/pos')) {
      await logoutAdmin(reason);
    } else {
      await logoutWeb(reason);
    }
  }, [logoutAdmin, logoutWeb]);

  // --------------------------------------------------------------------------
  // 3. Automatic Logout After Inactivity Tracker (Requirement 5)
  // --------------------------------------------------------------------------
  useEffect(() => {
    // Only track if an authenticated session exists
    const hasActiveSession = Boolean(adminToken || webToken);
    if (!hasActiveSession) return;

    const handleUserInteraction = () => {
      const now = Date.now();
      const storageKey = isAdminArea ? ADMIN_KEYS.activity : WEB_KEYS.activity;
      localStorage.setItem(storageKey, String(now));

      // Throttled heartbeat ping every 2 minutes
      if (now - lastHeartbeatRef.current > 120000) {
        lastHeartbeatRef.current = now;
        const heartbeatUrl = isAdminArea ? '/api/admin/auth/activity' : '/api/web/auth/activity';
        axios.post(heartbeatUrl, {}, { headers: { 'x-session-check': '1' } }).catch(() => {});
      }
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((ev) => window.addEventListener(ev, handleUserInteraction, { passive: true }));

    // Periodic idle checker every 10 seconds
    const intervalId = setInterval(() => {
      const now = Date.now();
      const storageKey = isAdminArea ? ADMIN_KEYS.activity : WEB_KEYS.activity;
      const lastActivity = Number(localStorage.getItem(storageKey)) || now;
      const idleTime = now - lastActivity;

      if (idleTime >= DEFAULT_INACTIVITY_TIMEOUT_MS) {
        // Inactivity exceeded -> trigger auto logout
        if (isAdminArea && adminToken) {
          logoutAdmin('inactivity');
        } else if (!isAdminArea && webToken) {
          logoutWeb('inactivity');
        }
      }
    }, 10000);

    return () => {
      activityEvents.forEach((ev) => window.removeEventListener(ev, handleUserInteraction));
      clearInterval(intervalId);
    };
  }, [adminToken, webToken, isAdminArea, logoutAdmin, logoutWeb]);

  // --------------------------------------------------------------------------
  // 4. Session Revalidation on Mount (Handles Refreshes & Direct URLs)
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    const initSessions = async () => {
      // 1. Validate Admin Session
      const savedAdminToken = localStorage.getItem(ADMIN_KEYS.token);
      if (savedAdminToken && !isTokenExpired(savedAdminToken)) {
        try {
          const res = await axios.get('/api/admin/auth/session?silent=1', {
            headers: {
              Authorization: `Bearer ${savedAdminToken}`,
              'x-session-check': '1'
            }
          });

          if (res.data?.authenticated === false || (!res.data?.success && !res.data?.status)) {
            if (isMounted) {
              setAdminUser(null);
              setAdminToken(null);
              localStorage.removeItem(ADMIN_KEYS.token);
              localStorage.removeItem(ADMIN_KEYS.user);
            }
          } else if (res.data?.data) {
            const payload = res.data.data;
            const userObj = payload.user || payload.profile || payload;
            const enrichedUser = {
              ...userObj,
              GP: payload.GP || userObj.GP || {},
              permissions: payload.permissions || userObj.permissions || [],
              branches: payload.branches || userObj.branches || []
            };
            if (isMounted) {
              setAdminUser(enrichedUser);
              localStorage.setItem(ADMIN_KEYS.user, JSON.stringify(enrichedUser));
            }
          }
        } catch (_) {
          // If server fails or rejects
          if (isMounted) {
            setAdminUser(null);
            setAdminToken(null);
            localStorage.removeItem(ADMIN_KEYS.token);
            localStorage.removeItem(ADMIN_KEYS.user);
          }
        }
      }

      // 2. Validate Website Customer Session
      const savedWebToken = localStorage.getItem(WEB_KEYS.token);
      if (savedWebToken && !isTokenExpired(savedWebToken)) {
        try {
          const res = await axios.get('/api/web/auth/session?silent=1', {
            headers: {
              Authorization: `Bearer ${savedWebToken}`,
              'x-session-check': '1'
            }
          });

          if (res.data?.authenticated === false || (!res.data?.success && !res.data?.status)) {
            if (isMounted) {
              setWebUser(null);
              setWebToken(null);
              localStorage.removeItem(WEB_KEYS.token);
              localStorage.removeItem(WEB_KEYS.user);
            }
          } else if (res.data?.data) {
            const payload = res.data.data;
            const userObj = payload.user || payload.profile || payload;
            if (isMounted) {
              setWebUser(userObj);
              localStorage.setItem(WEB_KEYS.user, JSON.stringify(userObj));
            }
          }
        } catch (_) {
          if (isMounted) {
            setWebUser(null);
            setWebToken(null);
            localStorage.removeItem(WEB_KEYS.token);
            localStorage.removeItem(WEB_KEYS.user);
          }
        }
      }

      if (isMounted) {
        setLoadingSession(false);
      }
    };

    initSessions();
    return () => { isMounted = false; };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        // Active contextual session
        user,
        token,
        isAuthenticated: Boolean(user && token),

        // Isolated Admin Session
        adminUser,
        adminToken,
        isAdminAuthenticated: Boolean(adminUser && adminToken),
        loginAdmin,
        logoutAdmin,

        // Isolated Website Customer Session
        webUser,
        webToken,
        isWebAuthenticated: Boolean(webUser && webToken),
        loginWeb,
        logoutWeb,

        // Role & Permission Checks
        GP,
        isOwner,
        isAdmin,
        isStore,
        isSupplier,
        isCustomer,
        isSalesman,
        isStaffOrAdmin,
        canAccessOperationsPortal,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,

        // Universal Methods
        login,
        logout,
        loadingSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
