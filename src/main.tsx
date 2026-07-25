import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './theme.css';
import { App } from './App';
import { AuthProvider } from './lib/auth';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);

// PWA: офлайн-кэш и фундамент для будущих пуш-напоминаний
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').catch(() => { /* dev или старый браузер */ });
  });
}
