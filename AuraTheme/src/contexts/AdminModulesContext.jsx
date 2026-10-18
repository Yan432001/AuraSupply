import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { erpModules } from '../data/erpModules';
import { DEFAULT_WEBSITE_TEMPLATE, getWebsiteTemplate } from '../data/websiteTemplates';

export const MODULE_STATE_STORAGE_KEY = 'aura-admin-module-state';
export const ACTIVE_TEMPLATE_STORAGE_KEY = 'aura_active_website_template';

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

export const getStoredWebsiteTemplate = () => {
  if (typeof window === 'undefined') return DEFAULT_WEBSITE_TEMPLATE;
  try {
    return window.localStorage.getItem(ACTIVE_TEMPLATE_STORAGE_KEY) || DEFAULT_WEBSITE_TEMPLATE;
  } catch {
    return DEFAULT_WEBSITE_TEMPLATE;
  }
};

const AdminModulesContext = createContext(null);

export const AdminModulesProvider = ({ children }) => {
  const [moduleState, setModuleState] = useState(() => getStoredModuleState());
  const [activeWebsiteTemplate, setActiveWebsiteTemplate] = useState(() => getStoredWebsiteTemplate());

  // Fetch real-time public website & template status from database
  useEffect(() => {
    let isMounted = true;
    axios.get('/api/public/website-status')
      .then((res) => {
        if (!isMounted) return;
        if (res.data?.success && res.data?.data) {
          const { is_ecommerce_active, active_template, submodules } = res.data.data;
          if (typeof is_ecommerce_active === 'boolean') {
            setModuleState((prev) => ({
              ...prev,
              ecommerce: is_ecommerce_active,
              shop: is_ecommerce_active
            }));
          }
          if (active_template) {
            setActiveWebsiteTemplate(active_template);
            try {
              window.localStorage.setItem(ACTIVE_TEMPLATE_STORAGE_KEY, active_template);
            } catch (_) {}
          }
          if (Array.isArray(submodules)) {
            setModuleState((prev) => {
              const next = { ...prev };
              submodules.forEach((sub) => {
                next[sub.sub_module_key] = sub.is_enabled === 1;
              });
              return next;
            });
          }
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // Persist moduleState to localStorage safely on state change
  useEffect(() => {
    try {
      window.localStorage.setItem(MODULE_STATE_STORAGE_KEY, JSON.stringify(moduleState));
    } catch (err) {
      console.error('[Aura] Failed to save module state:', err);
    }
  }, [moduleState]);

  // Persist activeWebsiteTemplate
  const setWebsiteTemplate = useCallback((templateId) => {
    setActiveWebsiteTemplate(templateId);
    try {
      window.localStorage.setItem(ACTIVE_TEMPLATE_STORAGE_KEY, templateId);
    } catch (_) {}
  }, []);

  const isModuleOpen = useCallback(
    (moduleKey) => {
      if (!moduleKey) return true;
      return moduleState[moduleKey] !== false;
    },
    [moduleState]
  );

  // E-commerce & Public Website Online Status:
  // If either 'ecommerce' or 'shop' module is toggled OFF, website is offline
  const isWebsiteOnline = useMemo(() => {
    return moduleState['ecommerce'] !== false && moduleState['shop'] !== false;
  }, [moduleState]);

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

  const setAllModuleStates = useCallback((nextStates) => {
    setModuleState((prev) => ({
      ...prev,
      ...nextStates,
    }));
  }, []);

  const resetModules = useCallback(() => {
    setModuleState(getDefaultModuleState());
  }, []);

  const activeModulesCount = useMemo(() => {
    return erpModules.filter((m) => moduleState[m.key] !== false).length;
  }, [moduleState]);

  const totalModulesCount = erpModules.length;

  const currentTemplate = useMemo(() => {
    return getWebsiteTemplate(activeWebsiteTemplate);
  }, [activeWebsiteTemplate]);

  const contextValue = useMemo(
    () => ({
      moduleState,
      isModuleOpen,
      isWebsiteOnline,
      activeWebsiteTemplate,
      setWebsiteTemplate,
      currentTemplate,
      toggleModule,
      setAllModuleStates,
      enableAllModules,
      disableAllModules,
      resetModules,
      activeModulesCount,
      totalModulesCount,
    }),
    [
      moduleState,
      isModuleOpen,
      isWebsiteOnline,
      activeWebsiteTemplate,
      setWebsiteTemplate,
      currentTemplate,
      toggleModule,
      setAllModuleStates,
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
      isWebsiteOnline: true,
      activeWebsiteTemplate: DEFAULT_WEBSITE_TEMPLATE,
      setWebsiteTemplate: () => {},
      currentTemplate: getWebsiteTemplate(DEFAULT_WEBSITE_TEMPLATE),
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
