import { useEffect, useState } from 'react';
import type { WebPageBridge, WebPageState } from '../../electron/web-page-api';
import { webPageProfile } from '../../electron/web-page-policy';

declare global {
  interface Window {
    flowpilotWebPage?: WebPageBridge;
  }
}

export function useWebPageState() {
  const [state, setState] = useState<WebPageState>({
    url: webPageProfile.url,
    status: 'loading',
    panelOpen: true,
  });
  useEffect(() => {
    const bridge = window.flowpilotWebPage;
    if (!bridge) return;
    let live = true;
    let received = false;
    const unsubscribe = bridge.onState((next) => {
      received = true;
      setState(next);
    });
    void bridge.getState().then((next) => {
      if (live && !received) setState(next);
    });
    return () => {
      live = false;
      unsubscribe();
    };
  }, []);
  return state;
}
