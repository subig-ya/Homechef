import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { enforceSessionLifetime } from './auth/storage.js';

// Wipe any non-remembered session left over from a previous browser session.
enforceSessionLifetime();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
