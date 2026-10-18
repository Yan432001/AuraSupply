import { unstableSetRender } from 'antd';
import { createRoot } from 'react-dom/client';

// 1. Patch Ant Design v5 render behavior for React 19 compatibility
if (typeof unstableSetRender === 'function') {
  try {
    unstableSetRender((node, container) => {
      container._reactRoot = container._reactRoot || createRoot(container);
      const root = container._reactRoot;
      // Defer render via queueMicrotask to ensure root.render is not invoked synchronously during another component's render pass
      queueMicrotask(() => {
        try {
          root.render(node);
        } catch (_) {}
      });
      return () =>
        new Promise((resolve) => {
          setTimeout(() => {
            try {
              root.unmount();
            } catch (_) {}
            resolve();
          }, 0);
        });
    });
  } catch (err) {
    console.warn('[Aura] Ant Design React 19 patch skipped:', err);
  }
}

// 2. Suppress benign Ant Design v5 deprecation & static context notices
if (typeof window !== 'undefined' && console) {
  const isAntdKnownWarning = (args) => {
    if (!args || !args.length) return false;
    const combined = args
      .map((arg) => (typeof arg === 'string' ? arg : (arg && arg.message) || ''))
      .join(' ');

    return (
      combined.includes('Static function can not consume context') ||
      combined.includes('[antd: Modal]') && combined.includes('Static function') ||
      combined.includes('[antd: message] Static function') ||
      combined.includes('[antd: notification] Static function') ||
      combined.includes('`destroyOnClose` is deprecated') ||
      combined.includes('`dropdownRender` is deprecated') ||
      combined.includes('`bordered` is deprecated') ||
      combined.includes('`bodyStyle` is deprecated') ||
      combined.includes('An empty string ("") was passed to the src attribute') ||
      combined.includes('Instance created by `useForm` is not connected to any Form element') ||
      combined.includes('triggering nested component updates from render is not allowed')
    );
  };

  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (isAntdKnownWarning(args)) return;
    originalWarn.apply(console, args);
  };

  const originalError = console.error;
  console.error = (...args) => {
    if (isAntdKnownWarning(args)) return;
    originalError.apply(console, args);
  };
}

export default {};
