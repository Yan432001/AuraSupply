import '@ant-design/v5-patch-for-react-19';
import './utils/antdPatch.js';
import './utils/telegramPatch.js';
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import App from './App.jsx'

// Initialize Telegram WebApp safely if running inside Telegram
if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
  const tg = window.Telegram.WebApp;
  try {
    tg.ready?.();
  } catch (_) {}
  try {
    tg.expand?.();
  } catch (_) {}
  try {
    if (typeof tg.isVersionAtLeast === 'function' && tg.isVersionAtLeast('6.2')) {
      tg.enableClosingConfirmation?.();
    }
  } catch (_) {}
}

createRoot(document.getElementById('root')).render(
  <App />
)