import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/base.css';
import './styles/home.css';
import './styles/detail.css';
import './styles/panel.css';
import './styles/discovery.css';
import './styles/schedule.css';
import './styles/web-page.css';
import { WebPagePanelHost } from './web-page/WebPagePanel';

if (navigator.userAgent.includes('Electron') && navigator.platform.startsWith('Mac')) {
  document.documentElement.classList.add('desktop-shell');
}

const panelHost = location.pathname === '/web-panel';
if (panelHost) document.documentElement.classList.add('web-panel-document');

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{panelHost ? <WebPagePanelHost /> : <App />}</React.StrictMode>,
);
