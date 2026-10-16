import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loadingSession, setLoadingSession] = useState(true);

  // Group Permissions ($this->GP in CodeIgniter 3)
  const GP = user?.GP || user?.permissionsMap || {};

  // Role flags matching CodeIgniter 3 MY_Controller
  const roleName = (user?.group_name || user?.role || '').toLowerCase();
  const isOwner = Boolean(
    Number(user?.group_id) === 1 || 
    Number(user?.level) === 1 || 
    roleName === 'owner' || 
    user?.Owner
  );
  const isAdmin = Boolean(
    Number(user?.group_id) === 2 || 
    Number(user?.level) === 2 || 
    roleName === 'admin' || 
    user?.Admin
  );
  const isStore = Boolean(roleName === 'store' || user?.Store);
  const isSupplier = Boolean(roleName === 'supplier' || user?.Supplier);
  const isCustomer = Boolean(roleName === 'customer' || user?.Customer);
  const isSalesman = Boolean(
    roleName === 'salesman' || 
    roleName === 'sale-agents' || 
    roleName === 'saleman' || 
    user?.Salesman
  );

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
      if (!savedToken) {
        if (isMounted) setLoadingSession(false);
        return;
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;

      try {
        const res = await axios.get('/api/admin/auth/session', {
          headers: { Authorization: `Bearer ${savedToken}` }
        });

        if (isMounted && res.data?.success && res.data?.data) {
          const freshUser = res.data.data;
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