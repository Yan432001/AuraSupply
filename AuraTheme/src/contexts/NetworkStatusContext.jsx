import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const NetworkStatusContext = createContext({
  isOnline: true,
  isChecking: false,
  wasOffline: false,
  reconnectNotice: false,
  simulatedOffline: false,
  toggleSimulateOffline: () => {},
  retryConnection: async () => true,
});

export const NetworkStatusProvider = ({ children }) => {
  // Read real navigator.onLine state
  const [realOnline, setRealOnline] = useState(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [simulatedOffline, setSimulatedOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [reconnectNotice, setReconnectNotice] = useState(false);

  // Effective online status: false if real is offline or simulation is active
  const isOnline = realOnline && !simulatedOffline;

  // Active ping verification to ensure real network connectivity
  const verifyConnectivity = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return false;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`/api/health?t=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      }).catch(() => null);
      clearTimeout(timeoutId);

      if (res && (res.ok || res.status < 500)) {
        return true;
      }
      return typeof navigator !== 'undefined' ? navigator.onLine : true;
    } catch {
      return typeof navigator !== 'undefined' ? navigator.onLine : true;
    }
  }, []);

  const handleOnline = useCallback(() => {
    setRealOnline(true);
    setReconnectNotice(true);
    // Auto-dismiss the "Connection restored" notice after 3.5 seconds
    const timer = setTimeout(() => {
      setReconnectNotice(false);
      setWasOffline(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  const handleOffline = useCallback(() => {
    setRealOnline(false);
    setWasOffline(true);
    setReconnectNotice(false);
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setRealOnline(false);
      setWasOffline(true);
    }

    // Periodic heartbeat sync to monitor navigator.onLine in background
    const interval = setInterval(() => {
      if (typeof navigator !== 'undefined') {
        const currentNavigatorState = navigator.onLine;
        if (currentNavigatorState !== realOnline) {
          if (currentNavigatorState) {
            handleOnline();
          } else {
            handleOffline();
          }
        }
      }
    }, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [handleOnline, handleOffline, realOnline]);

  // Toggle simulated offline state for instant UI testing
  const toggleSimulateOffline = useCallback(() => {
    setSimulatedOffline((prev) => {
      const next = !prev;
      if (next) {
        setWasOffline(true);
        setReconnectNotice(false);
      } else {
        setReconnectNotice(true);
        setTimeout(() => {
          setReconnectNotice(false);
          setWasOffline(false);
        }, 3500);
      }
      return next;
    });
  }, []);

  // Manual retry / check connection trigger
  const retryConnection = useCallback(async () => {
    setIsChecking(true);
    try {
      if (simulatedOffline) {
        // If simulation is on, notify user
        setSimulatedOffline(false);
      }
      const active = await verifyConnectivity();
      if (active) {
        setRealOnline(true);
        setReconnectNotice(true);
        setTimeout(() => {
          setReconnectNotice(false);
          setWasOffline(false);
        }, 3500);
      } else {
        setRealOnline(false);
        setWasOffline(true);
      }
      return active;
    } finally {
      setIsChecking(false);
    }
  }, [verifyConnectivity, simulatedOffline]);

  return (
    <NetworkStatusContext.Provider
      value={{
        isOnline,
        realOnline,
        isChecking,
        wasOffline,
        reconnectNotice,
        simulatedOffline,
        toggleSimulateOffline,
        retryConnection,
      }}
    >
      {children}
    </NetworkStatusContext.Provider>
  );
};

export const useNetworkStatus = () => useContext(NetworkStatusContext);

export default NetworkStatusContext;
