import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { erpModules } from '../data/erpModules';

export const MODULE_STATE_STORAGE_KEY = 'aura-admin-module-state';

export const getDefaultModuleState = () => {
  const state = {};
  erpModules.forEach((m) => {
    state[m.key] = m.enabled !== false;
    if (m.submodules) {
      m.submodules.forEach((sub) => {
        state[sub.key] = sub.enabled !== false;
      });
    }
  });
  return state;
};

export const getStoredModuleState = () => {
  const defaults = getDefaultModuleState();
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = window.localStorage.getItem(MODULE_STATE_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed };
  } catch (err) {
    console.warn('[Aura] Failed to parse module state:', err);
    return defaults;
  }
};

const AdminModulesContext = createContext(null);

export const AdminModulesProvider = ({ children }) => {
  const [moduleState, setModuleState] = useState(() => getStoredModuleState());

  // Persist to localStorage safely on state change
  useEffect(() => {
    try {
      window.localStorage.setItem(MODULE_STATE_STORAGE_KEY, JSON.stringify(moduleState));
    } catch (err) {
      console.error('[Aura] Failed to save module state:', err);
    }
  }, [moduleState]);

  const isModuleOpen = useCallback(
    (moduleKey) => {
      if (!moduleKey) return true;
      return moduleState[moduleKey] !== false;
    },
    [moduleState]
  );

  const toggleModule = useCallback((moduleKey, enabled) => {
    setModuleState((prev) => ({
      ...prev,
      [moduleKey]: typeof enabled === 'boolean' ? enabled : !prev[moduleKey],
    }));
  }, []);

  const enableAllModules = useCallback(() => {
    const next = {};
    erpModules.forEach((m) => {
      next[m.key] = true;
      if (m.submodules) {
        m.submodules.forEach((sub) => {
          next[sub.key] = true;
        });
      }
    });
    setModuleState(next);
  }, []);

  const disableAllModules = useCallback(() => {
    const next = {};
    erpModules.forEach((m) => {
      next[m.key] = m.key === 'settings';
    });
    setModuleState(next);
  }, []);

  const resetModules = useCallback(() => {
    setModuleState(getDefaultModuleState());
  }, []);

  const activeModulesCount = useMemo(() => {
    return erpModules.filter((m) => moduleState[m.key] !== false).length;
  }, [moduleState]);

  const totalModulesCount = erpModules.length;

  const contextValue = useMemo(
    () => ({
      moduleState,
      isModuleOpen,
      toggleModule,
      enableAllModules,
      disableAllModules,
      resetModules,
      activeModulesCount,
      totalModulesCount,
    }),
    [
      moduleState,
      isModuleOpen,
      toggleModule,
      enableAllModules,
      disableAllModules,
      resetModules,
      activeModulesCount,
      totalModulesCount,
    ]
  );

  return (
    <AdminModulesContext.Provider value={contextValue}>
      {children}
    </AdminModulesContext.Provider>
  );
};

export const useAdminModules = () => {
  const context = useContext(AdminModulesContext);
  if (!context) {
    const defaults = getDefaultModuleState();
    return {
      moduleState: defaults,
      isModuleOpen: () => true,
      toggleModule: () => {},
      enableAllModules: () => {},
      disableAllModules: () => {},
      resetModules: () => {},
      activeModulesCount: erpModules.length,
      totalModulesCount: erpModules.length,
    };
  }
  return context;
};

export default AdminModulesContext;
