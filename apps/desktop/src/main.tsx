import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/base.css';
import './styles/home.css';
import './styles/detail.css';
import './styles/panel.css';
import './styles/discovery.css';
import './styles/schedule.css';

if (navigator.userAgent.includes('Electron') && navigator.platform.startsWith('Mac')) {
  document.documentElement.classList.add('desktop-shell');
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
