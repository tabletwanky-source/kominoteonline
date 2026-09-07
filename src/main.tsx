// Guard for environments where window.fetch has only a getter
if (typeof window !== 'undefined') {
  try {
    const originalFetch = window.fetch;
    let customFetch: typeof window.fetch | null = null;
    const desc = Object.getOwnPropertyDescriptor(window, 'fetch') ||
      (typeof Window !== 'undefined' ? Object.getOwnPropertyDescriptor(Window.prototype, 'fetch') : null);

    if (!desc || typeof desc.set !== 'function') {
      Object.defineProperty(window, 'fetch', {
        get() {
          return customFetch || (originalFetch ? originalFetch.bind(window) : originalFetch);
        },
        set(fn) {
          customFetch = fn;
        },
        configurable: true,
        enumerable: true,
      });
    }
  } catch {
    // Ignore if not permitted
  }
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
