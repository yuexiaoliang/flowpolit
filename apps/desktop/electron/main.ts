import { app, BrowserWindow, protocol, session } from 'electron';
import path from 'node:path';
import { createAssetHandler } from './asset-server.ts';
import { installWebPageHost } from './web-page-host';
import { allowsPageRequest, webPageProfile } from './web-page-policy';

const scheme = 'flowpilot';
const origin = `${scheme}://app`;
const clientRoot = path.resolve(__dirname, '../client');

protocol.registerSchemesAsPrivileged([
  {
    scheme,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
    },
  },
]);

function createWindow() {
  const window = new BrowserWindow({
    title: 'Flow Pilot',
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    backgroundColor: '#f8faf9',
    titleBarStyle: process.platform === 'darwin' ? 'hidden' : 'default',
    trafficLightPosition: process.platform === 'darwin' ? { x: 18, y: 18 } : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event, destination) => {
    if (!destination.startsWith(`${origin}/`)) event.preventDefault();
  });
  window.once('ready-to-show', () => window.show());
  installWebPageHost(window);
  window.loadURL(`${origin}/`);
}

app.whenReady().then(() => {
  app.setName('Flow Pilot');
  protocol.handle(scheme, createAssetHandler(clientRoot));
  const pageSession = session.fromPartition(webPageProfile.partition);
  pageSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  pageSession.setPermissionCheckHandler(() => false);
  pageSession.on('will-download', (event) => event.preventDefault());
  pageSession.webRequest.onBeforeRequest((details, callback) => {
    callback({ cancel: !allowsPageRequest(details.url) });
  });
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
