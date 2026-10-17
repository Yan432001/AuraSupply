/**
 * ENTERPRISE ERP AUTH & PERMISSION CONTEXT
 * ========================================
 * Provides module-level Role-Based Access Control (RBAC) across React components,
 * buttons, tables, and protected routes.
 *
 * Exports:
 *   - PermissionProvider (Context Provider)
 *   - usePermission() (Custom Hook)
 *   - <Can /> (Declarative Permission Gate Component)
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

const PermissionContext = createContext({
  permissions: {},
  isSuperAdmin: false,
  loading: true,
  can: () => false,
  canAny: () => false,
  canAll: () => false,
  refreshPermissions: async () => {}
});

/**
 * Standardize Action Names
 * Maps common UX verbs ('edit', 'read', 'insert', etc.) to canonical database actions
 */
function normalizeAction(action) {
  if (!action) return 'view';
  const a = String(action).toLowerCase().trim();
  if (['view', 'read', 'list', 'get', 'show'].includes(a)) return 'view';
  if (['create', 'add', 'post', 'insert', 'new'].includes(a)) return 'create';
  if (['update', 'edit', 'put', 'patch', 'modify', 'save'].includes(a)) return 'update';
  if (['delete', 'remove', 'del', 'destroy'].includes(a)) return 'delete';
  if (['export', 'download', 'csv', 'excel', 'print'].includes(a)) return 'export';
  if (['approve', 'authorize', 'sign', 'confirm'].includes(a)) return 'approve';
  return a;
}

/**
 * Standardize Module Names
 */
function normalizeModule(moduleName) {
  return String(moduleName || '').toUpperCase().trim();
}

export const PermissionProvider = ({ children }) => {
  const [permissions, setPermissions] = useState({});
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user session from localStorage or token
  const loadEffectivePermissions = useCallback(async (bustCache = false) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      const savedUserStr = localStorage.getItem('user');
      let userId = null;

      if (savedUserStr) {
        try {
          const u = JSON.parse(savedUserStr);
          userId = u.id || u.user_id;
          if (u.is_system_admin === 1 || u.group_id === 1 || u.level === 1 || u.role === 'owner' || u.role === 'admin') {
            setIsSuperAdmin(true);
          }
        } catch (_) {}
      }

      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (userId) headers['x-user-id'] = userId;
      if (bustCache) headers['x-cache-bust'] = 'true';

      const response = await axios.get('/api/auth/me/permissions', { headers, timeout: 5000 });
      if (response.data && response.data.success) {
        setPermissions(response.data.data.permissions || {});
        if (response.data.data.isSuperAdmin) {
          setIsSuperAdmin(true);
        }
      }
    } catch (err) {
      // Fallback: If not logged in or offline, check saved user
      console.warn('[PermissionContext] Notice loading permissions from API:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEffectivePermissions();
  }, [loadEffectivePermissions]);

  /**
   * Primary Evaluation Function: can(module, action)
   * Example: can('Inventory', 'update')
   */
  const can = useCallback((moduleName, action = 'view') => {
    // 1. Superadmin / Owner always has full access
    if (isSuperAdmin) return true;

    const mod = normalizeModule(moduleName);
    const act = normalizeAction(action);

    const moduleRights = permissions[mod];
    if (!moduleRights) return false;

    return Number(moduleRights[act]) === 1;
  }, [isSuperAdmin, permissions]);

  /**
   * canAny([ ['Inventory', 'update'], ['Inventory', 'delete'] ])
   */
  const canAny = useCallback((checks = []) => {
    if (isSuperAdmin) return true;
    return checks.some(([mod, act]) => can(mod, act));
  }, [isSuperAdmin, can]);

  /**
   * canAll([ ['Inventory', 'view'], ['Inventory', 'update'] ])
   */
  const canAll = useCallback((checks = []) => {
    if (isSuperAdmin) return true;
    return checks.every(([mod, act]) => can(mod, act));
  }, [isSuperAdmin, can]);

  const value = useMemo(() => ({
    permissions,
    isSuperAdmin,
    loading,
    can,
    canAny,
    canAll,
    refreshPermissions: () => loadEffectivePermissions(true)
  }), [permissions, isSuperAdmin, loading, can, canAny, canAll, loadEffectivePermissions]);

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

/**
 * Custom Hook: usePermission()
 */
export const usePermission = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  return context;
};

/**
 * Declarative RBAC Gate: <Can />
 *
 * Examples:
 *   // Completely hides button if unauthorized
 *   <Can module="Inventory" action="update">
 *     <button onClick={editItem}>Edit Item</button>
 *   </Can>
 *
 *   // Renders disabled button with tooltip if unauthorized
 *   <Can module="Inventory" action="delete" disableOnly>
 *     <button onClick={deleteItem}>Delete</button>
 *   </Can>
 *
 *   // Shows fallback message
 *   <Can module="Accounting" action="view" fallback={<p>No Access</p>}>
 *     <AccountingDashboard />
 *   </Can>
 */
export const Can = ({
  module: moduleName,
  action = 'view',
  fallback = null,
  disableOnly = false,
  children
}) => {
  const { can, isSuperAdmin, loading } = usePermission();
  const allowed = can(moduleName, action);

  if (loading) return null;

  // Support render prop: {({ allowed, isSuperAdmin }) => (...)}
  if (typeof children === 'function') {
    return children({ allowed, isSuperAdmin });
  }

  // If authorized, render children normally
  if (allowed) {
    return <>{children}</>;
  }

  // If unauthorized and disableOnly is requested, clone element and disable it
  if (disableOnly && React.isValidElement(children)) {
    return React.cloneElement(children, {
      disabled: true,
      'aria-disabled': 'true',
      title: `Permission required: ${normalizeModule(moduleName)} (${normalizeAction(action)})`,
      className: `${children.props.className || ''} opacity-50 cursor-not-allowed pointer-events-none select-none`
    });
  }

  // Default: Return fallback (default null)
  return fallback;
};

export default PermissionContext;
