import { ipcMain, WebContentsView, type BrowserWindow, type IpcMainEvent } from 'electron';
import path from 'node:path';
import {
  webPageChannel,
  webPageStateChannel,
  type WebPageCommand,
  type WebPageState,
} from './web-page-api';
import { clampPanelBounds, webPageBounds, type ViewBounds } from './web-page-layout';
import { allowsPageNavigation, webPageProfile } from './web-page-policy';

const panelURL = 'flowpilot://app/web-panel';

export function installWebPageHost(window: BrowserWindow) {
  let page: WebContentsView | undefined;
  let panel: WebContentsView | undefined;
  let visible = false;
  let panelBounds: ViewBounds | undefined;
  let state: WebPageState = {
    url: webPageProfile.url,
    status: 'loading',
    panelOpen: true,
  };

  const publish = () => {
    for (const contents of [window.webContents, panel?.webContents]) {
      if (contents && !contents.isDestroyed()) contents.send(webPageStateChannel, state);
    }
  };
  const layout = () => {
    const [width, height] = window.getContentSize();
    page?.setBounds(webPageBounds(width, height));
    panelBounds = clampPanelBounds(
      panelBounds || { x: width - 450, y: 170, width: 427, height: 420 },
      width,
      height,
    );
    panel?.setBounds(panelBounds);
    const showPage = visible && state.status !== 'error';
    const showPanel = visible && state.panelOpen;
    const children = window.contentView.children;
    const addPage = page && showPage && !children.includes(page);
    if (page) {
      if (addPage) window.contentView.addChildView(page);
      else if (!showPage && children.includes(page)) window.contentView.removeChildView(page);
      page.setVisible(showPage);
    }
    if (panel) {
      // 页面重新挂载后，把浮窗重新放到最上层。
      if (showPanel && (addPage || !children.includes(panel)))
        window.contentView.addChildView(panel);
      else if (!showPanel && children.includes(panel)) window.contentView.removeChildView(panel);
      panel.setVisible(showPanel);
    }
  };
  const createViews = () => {
    if (page) return;
    page = new WebContentsView({
      webPreferences: {
        partition: webPageProfile.partition,
        contextIsolation: true,
        sandbox: true,
        nodeIntegration: false,
      },
    });
    const createdPage = page;
    const update = (load: Partial<Pick<WebPageState, 'status' | 'url' | 'error'>>) => {
      state = { ...state, ...load };
      layout();
      publish();
    };
    page.webContents.setWindowOpenHandler(({ url }) => {
      // 测试站的同源新窗口在当前页面打开，继续由用户可见的视图承载。
      if (allowsPageNavigation(url)) void createdPage.webContents.loadURL(url).catch(() => {});
      return { action: 'deny' };
    });
    page.webContents.on('will-frame-navigate', (event) => {
      if (!allowsPageNavigation(event.url)) event.preventDefault();
    });
    page.webContents.on('will-redirect', (event, url) => {
      if (!allowsPageNavigation(url)) event.preventDefault();
    });
    page.webContents.on('did-start-loading', () => update({ status: 'loading', error: undefined }));
    page.webContents.on('did-finish-load', () => {
      update({ status: 'ready', url: createdPage.webContents.getURL(), error: undefined });
    });
    page.webContents.on('did-stop-loading', () => {
      const url = createdPage.webContents.getURL();
      if (state.status === 'loading' && allowsPageNavigation(url))
        update({ status: 'ready', url, error: undefined });
    });
    page.webContents.on('did-navigate-in-page', (_event, url, isMainFrame) => {
      if (isMainFrame) update({ status: 'ready', url, error: undefined });
    });
    page.webContents.on('did-fail-load', (_event, code, description, _url, isMainFrame) => {
      if (!isMainFrame || code === -3) return;
      update({ status: 'error', error: description });
    });
    page.webContents.on('render-process-gone', () => {
      update({ status: 'error', error: '页面进程已退出，请重新加载页面。' });
    });
    if (!panel) {
      panel = new WebContentsView({
        webPreferences: {
          preload: path.join(__dirname, 'preload.cjs'),
          contextIsolation: true,
          sandbox: true,
          nodeIntegration: false,
        },
      });
      panel.setBackgroundColor('#00000000');
      panel.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
      panel.webContents.on('will-frame-navigate', (event) => event.preventDefault());
      panel.webContents.on('did-finish-load', publish);
      void panel.webContents.loadURL(panelURL).catch(() => {
        state = { ...state, panelOpen: false };
        layout();
        publish();
      });
    }
    layout();
    void page.webContents.loadURL(webPageProfile.url).catch(() => {});
  };

  const isTrusted = (event: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent) =>
    event.senderFrame === event.sender.mainFrame &&
    (event.sender === window.webContents || event.sender === panel?.webContents);

  const receive = (event: IpcMainEvent, command: WebPageCommand) => {
    if (!isTrusted(event) || !command || typeof command !== 'object') return;
    const fromShell = event.sender === window.webContents;
    switch (command.type) {
      case 'show':
        if (!fromShell) return;
        visible = true;
        createViews();
        break;
      case 'hide':
        if (!fromShell) return;
        visible = false;
        break;
      case 'toggle-panel':
        state = { ...state, panelOpen: !state.panelOpen };
        break;
      case 'reload':
        if (!fromShell || !page) return;
        page.webContents.reload();
        break;
      case 'panel-size':
        if (fromShell || !Number.isFinite(command.width) || !Number.isFinite(command.height))
          return;
        if (panelBounds) {
          panelBounds = { ...panelBounds, width: command.width, height: command.height };
        }
        break;
      case 'move-panel':
        if (fromShell || !Number.isFinite(command.dx) || !Number.isFinite(command.dy)) return;
        if (panelBounds) {
          panelBounds = {
            ...panelBounds,
            x: panelBounds.x + command.dx,
            y: panelBounds.y + command.dy,
          };
        }
        break;
      default:
        return;
    }
    layout();
    publish();
  };
  ipcMain.on(webPageChannel, receive);
  ipcMain.handle(webPageStateChannel, (event) => {
    if (!isTrusted(event)) throw new Error('Unknown web page client');
    return state;
  });
  window.on('resize', layout);
  // 壳界面刷新时先隐藏视图，由重新挂载的页面决定是否显示。
  window.webContents.on('did-start-loading', () => {
    visible = false;
    layout();
  });
  window.on('closed', () => {
    ipcMain.removeListener(webPageChannel, receive);
    ipcMain.removeHandler(webPageStateChannel);
    for (const view of [page, panel]) {
      if (view && !view.webContents.isDestroyed()) view.webContents.close();
    }
  });
}
