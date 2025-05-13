// filepath: client/src/lib/config.ts
export const API_BASE = import.meta.env.VITE_API_URL ?? '/.netlify/functions/api';

// Use relative '/ws' so Netlify proxy can forward WebSocket to backend
export const WS_URL = import.meta.env.VITE_WS_URL ?? (() => {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.host}/ws`;
})();
