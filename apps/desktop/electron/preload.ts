import { contextBridge, ipcRenderer } from 'electron';
import {
  webPageChannel,
  webPageStateChannel,
  type WebPageBridge,
  type WebPageState,
} from './web-page-api';

const bridge: WebPageBridge = {
  send: (command) => ipcRenderer.send(webPageChannel, command),
  getState: () => ipcRenderer.invoke(webPageStateChannel),
  onState: (listener) => {
    const receive = (_event: Electron.IpcRendererEvent, state: WebPageState) => listener(state);
    ipcRenderer.on(webPageStateChannel, receive);
    return () => ipcRenderer.removeListener(webPageStateChannel, receive);
  },
};

contextBridge.exposeInMainWorld('flowpilotWebPage', bridge);
