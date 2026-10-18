import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

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
  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem('token');
    if (!saved) return null;
    if (isTokenExpired(saved)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
    return saved;
  });

  const [user, setUser] = useState(() => {
    try {
      const savedToken = localStorage.getItem('token');
      if (!savedToken || isTokenExpired(savedToken)) {
        return null;
      }
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [loadingSession, setLoadingSession] = useState(() => {
    const saved = localStorage.getItem('token');
    return Boolean(saved && !isTokenExpired(saved));
  });

  // Support both flattened and wrapped session user payloads
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

  // Staff or Admin flag for ERP Operations Portal access
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
   * Check if current user has permission
   * Modeled on CodeIgniter 3:
   *   if ($this->Owner || $this->Admin || $this->GP['module-action'])
   */
  const hasPermission = useCallback((permissionKey) => {
    if (!user) return false;
    // Owner and Admin have access to everything
    if (isOwner || isAdmin) return true;

    // Direct check in GP dictionary
    if (GP && (GP[permissionKey] === 1 || GP[permissionKey] === true || GP[permissionKey] === '1')) {
      return true;
    }

    // Check in permissions array
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

  // Session Login
  const login = useCallback((authPayload) => {
    const rawToken = authPayload?.token || authPayload?.access_token;
    const rawUser = authPayload?.user || authPayload?.profile || authPayload;

    if (rawToken) {
      setToken(rawToken);
      localStorage.setItem('token', rawToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${rawToken}`;
    }

    if (rawUser) {
      setUser(rawUser);
      localStorage.setItem('user', JSON.stringify(rawUser));
    }
  }, []);

  // Session Logout
  const logout = useCallback(async () => {
    try {
      const activeToken = token || localStorage.getItem('token');
      if (activeToken) {
        await axios.post('/api/admin/auth/logout', {}, {
          headers: { Authorization: `Bearer ${activeToken}` }
        }).catch(() => {});
      }
    } catch (_) {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setToken(null);
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('aura_emenu_cart_v2');

      // Navigate to admin login if inside admin panel
      if (window.location.pathname.startsWith('/admins') && !window.location.pathname.startsWith('/admins/login')) {
        window.location.href = '/admins/login';
      }
    }
  }, [token]);

  // Validate session on app initialization
  useEffect(() => {
    let isMounted = true;
    const initSession = async () => {
      const savedToken = localStorage.getItem('token');
      if (!savedToken || isTokenExpired(savedToken)) {
        if (savedToken) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          delete axios.defaults.headers.common['Authorization'];
          if (isMounted) {
            setUser(null);
            setToken(null);
          }
        }
        if (isMounted) setLoadingSession(false);
        return;
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;

      let parsedUser = null;
      try {
        const savedUser = localStorage.getItem('user');
        parsedUser = savedUser ? JSON.parse(savedUser) : null;
      } catch (_) {}

      const isCustomerAccount = parsedUser?.role === 'customer' || Number(parsedUser?.group_id) === 4;

      try {
        // Customer accounts authenticate via /api/auth/profile; Admin/staff via /api/admin/auth/session
        // Pass ?silent=1 and x-session-check header so backend returns 200 with authenticated:false instead of logging 401 console errors on dead sessions
        const baseEndpoint = isCustomerAccount ? '/api/auth/profile' : '/api/admin/auth/session';
        const sessionEndpoint = `${baseEndpoint}?silent=1`;
        const res = await axios.get(sessionEndpoint, {
          headers: { 
            Authorization: `Bearer ${savedToken}`,
            'x-session-check': '1'
          }
        });

        if (res.data?.authenticated === false || (!res.data?.success && !res.data?.status)) {
          if (isMounted) {
            setUser(null);
            setToken(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            delete axios.defaults.headers.common['Authorization'];
          }
          return;
        }

        if (isMounted && (res.data?.success || res.data?.status) && res.data?.data) {
          const payloadData = res.data.data;
          const userObj = payloadData.user || payloadData.profile || payloadData;
          const freshUser = {
            ...userObj,
            GP: payloadData.GP || userObj.GP || {},
            permissions: payloadData.permissions || userObj.permissions || [],
            group: payloadData.group || userObj.group || {},
            group_name: payloadData.group?.name || userObj.group_name || userObj.role || 'owner',
            group_id: payloadData.group?.id || userObj.group_id || 1,
            allow_admin_login: payloadData.group?.allow_admin_login !== undefined
              ? payloadData.group.allow_admin_login
              : (userObj.allow_admin_login !== undefined ? userObj.allow_admin_login : 1)
          };
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        }
      } catch (err) {
        // If 401 Unauthorized, token has expired
        if (err.response?.status === 401) {
          if (isMounted) {
            setUser(null);
            setToken(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            delete axios.defaults.headers.common['Authorization'];
          }
        } else if (err.response?.status === 403 && !isCustomerAccount) {
          // If 403 when hitting admin session, account may be a customer or restricted
          if (isMounted && parsedUser) {
            setUser(parsedUser);
          }
        }
      } finally {
        if (isMounted) setLoadingSession(false);
      }
    };

    initSession();
    return () => { isMounted = false; };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
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
        login,
        logout,
        loadingSession,
        isAuthenticated: Boolean(user && token)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};