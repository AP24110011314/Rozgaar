import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import App from './App.jsx';
import './index.css';

// Guard against missing VITE_API_URL
const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background-color: var(--color-page, #FBF6E9); color: var(--color-text, #2E1D10); padding: 24px;">
        <div style="max-width: 520px; width: 100%; background: var(--color-surface, #FFFFFF); border: 2px solid var(--color-error, #8B1A1A); border-radius: 6px; padding: 28px; box-shadow: 0 1px 2px rgba(46,29,16,0.12);">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <span style="font-size: 24px;">⚠️</span>
            <h1 style="color: var(--color-error, #8B1A1A); font-size: 18px; font-weight: 700; margin: 0;">Configuration Error: Missing VITE_API_URL</h1>
          </div>
          <p style="color: var(--color-text, #2E1D10); font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
            The environment variable <code>VITE_API_URL</code> is required by Rozgaar. Hardcoded fallback URLs are strictly prohibited.
          </p>
          <div style="background: var(--color-sand, #F0D8A1); border: 1px solid var(--color-border, #A47251); border-radius: 4px; padding: 12px; font-family: monospace; font-size: 13px; color: var(--color-text, #2E1D10); margin-bottom: 16px; font-weight: bold;">
            VITE_API_URL=https://api.yourdomain.example/api/v1
          </div>
          <p style="color: var(--color-text-muted, #5C4633); font-size: 13px; margin: 0;">
            Please define <code>VITE_API_URL</code> in <code>client/.env</code> and restart your development server.
          </p>
        </div>
      </div>
    `;
  }
  throw new Error('❌ Missing required environment variable: VITE_API_URL');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
