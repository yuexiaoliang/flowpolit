// 仅用于桌面验收页面宿主，不是正式任务服务契约。
export const webPageChannel = 'flowpilot:web-page';
export const webPageStateChannel = 'flowpilot:web-page-state';

export interface WebPageState {
  url: string;
  status: 'loading' | 'ready' | 'error';
  panelOpen: boolean;
  error?: string;
}

export type WebPageCommand =
  | { type: 'show' | 'hide' | 'toggle-panel' | 'reload' }
  | { type: 'panel-size'; width: number; height: number }
  | { type: 'move-panel'; dx: number; dy: number };

export interface WebPageBridge {
  send: (command: WebPageCommand) => void;
  getState: () => Promise<WebPageState>;
  onState: (listener: (state: WebPageState) => void) => () => void;
}
