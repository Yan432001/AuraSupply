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
  const isAntdKnownWarning = (msg) => {
    if (!msg || typeof msg !== 'string') return false;
    return (
      msg.includes('[antd: message] Static function can not consume context') ||
      msg.includes('[antd: Card] `bordered` is deprecated') ||
      msg.includes('[antd: Card] `bodyStyle` is deprecated') ||
      msg.includes('Instance created by `useForm` is not connected to any Form element') ||
      msg.includes('triggering nested component updates from render is not allowed')
    );
  };

  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (isAntdKnownWarning(args[0])) return;
    originalWarn.apply(console, args);
  };

  const originalError = console.error;
  console.error = (...args) => {
    if (isAntdKnownWarning(args[0])) return;
    originalError.apply(console, args);
  };
}

export default {};
