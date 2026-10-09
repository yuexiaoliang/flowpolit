import { useEffect } from 'react';
import { ArrowLeft, Globe, Sparkle, X } from '@phosphor-icons/react';
import { Brand } from '../components/Brand';
import { useWebPageState } from './bridge';
import { webPageProfile } from '../../electron/web-page-policy';

export function WebPageWorkspace({ active, onHome }: { active: boolean; onHome: () => void }) {
  const state = useWebPageState();
  const native = Boolean(window.flowpilotWebPage);

  useEffect(() => {
    if (!native || !active) return;
    window.flowpilotWebPage!.send({ type: 'show' });
    return () => window.flowpilotWebPage!.send({ type: 'hide' });
  }, [active, native]);

  const togglePanel = () => window.flowpilotWebPage?.send({ type: 'toggle-panel' });

  if (!active) return null;
  return (
    <div className="detail web-page-detail">
      <div className="tabs">
        <button onClick={onHome} className="back-home" title="返回首页">
          <Brand compact />
        </button>
        <div className="tab">
          <Globe size={16} />
          {webPageProfile.title}
          <button aria-label={`关闭${webPageProfile.title}`} onClick={onHome}>
            <X size={14} />
          </button>
        </div>
        <span className="spacer" />
        <button
          className="task-toggle"
          onClick={
            native
              ? togglePanel
              : () => window.open(webPageProfile.url, '_blank', 'noopener,noreferrer')
          }
        >
          <span className="live-dot stopped" />
          {native ? '手动操作' : '独立打开'}
        </button>
      </div>
      <div className="address">
        <button aria-label="返回首页" onClick={onHome}>
          <ArrowLeft size={19} />
        </button>
        <div className="url">
          <Globe size={16} />
          {state.url} · 无需登录
        </div>
        {native && (
          <button
            className="pilot-switch"
            aria-label={state.panelOpen ? '隐藏任务浮窗' : '显示任务浮窗'}
            onClick={togglePanel}
          >
            <Sparkle size={19} weight="fill" />
          </button>
        )}
      </div>
      <div className="web-page-placeholder">
        {native ? (
          state.status === 'error' ? (
            <>
              <p>
                {webPageProfile.title}未能打开：{state.error}
              </p>
              <button
                className="outline"
                onClick={() => window.flowpilotWebPage!.send({ type: 'reload' })}
              >
                重新加载页面
              </button>
            </>
          ) : state.status === 'loading' ? (
            <p>正在打开{webPageProfile.title}…</p>
          ) : null
        ) : (
          <>
            <p>在桌面客户端中打开 HedgeDoc，可同时操作文档与任务浮窗。</p>
            <a href={webPageProfile.url} target="_blank" rel="noopener noreferrer">
              在独立页面打开测试环境
            </a>
          </>
        )}
      </div>
    </div>
  );
}
