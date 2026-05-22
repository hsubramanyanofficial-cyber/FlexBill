import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Build and register service worker shell
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('⚡ FlexBill Service Worker registered with scope: ', reg.scope);
      })
      .catch((err) => {
        console.warn('⚡ Service worker registration bypassed:', err);
      });
  });
} else if ('serviceWorker' in navigator) {
  // Fallback dev register for testing in preview tabs
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('⚡ Dev scope Service Worker registered: ', reg.scope);
      })
      .catch((err) => {
        console.log('⚡ Sw development sandbox registration bypass');
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
