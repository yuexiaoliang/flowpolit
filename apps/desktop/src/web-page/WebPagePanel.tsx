import { useLayoutEffect, useRef, useState } from 'react';
import { CheckCircle, CircleNotch, Minus, Plus, X } from '@phosphor-icons/react';
import type { WebPageState } from '../../electron/web-page-api';
import { Activity } from '../features/Activity';
import { useWebPageState } from './bridge';
import { webPageProfile } from '../../electron/web-page-policy';

export function WebPagePanel({ state, onClose }: { state: WebPageState; onClose: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const bridge = window.flowpilotWebPage;
  const title = webPageProfile.title;

  useLayoutEffect(() => {
    if (!bridge || !panelRef.current) return;
    const observer = new ResizeObserver(() => {
      const rect = panelRef.current!.getBoundingClientRect();
      bridge.send({
        type: 'panel-size',
        width: Math.ceil(rect.width) + 32,
        height: Math.ceil(rect.height) + 32,
      });
    });
    observer.observe(panelRef.current);
    return () => observer.disconnect();
  }, [bridge]);

  const summary =
    state.status === 'ready'
      ? `${title}已打开`
      : state.status === 'error'
        ? `${title}加载失败`
        : `正在打开${title}`;
  return (
    <aside
      ref={panelRef}
      className={'panel web-panel ' + (collapsed ? 'collapsed' : '')}
      aria-label={`${title}任务浮窗`}
    >
      <div
        className="panel-head"
        onPointerDown={(event) => {
          if (!bridge || (event.target as Element).closest('button')) return;
          drag.current = { x: event.screenX, y: event.screenY };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          const dx = event.screenX - drag.current.x;
          const dy = event.screenY - drag.current.y;
          drag.current = { x: event.screenX, y: event.screenY };
          bridge?.send({ type: 'move-panel', dx, dy });
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <span className={'live-dot ' + (state.status !== 'ready' ? 'stopped' : '')} />
        <strong>HedgeDoc 手动验收</strong>
        <div className="panel-actions">
          <button
            aria-label={collapsed ? '展开浮窗' : '收起浮窗'}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <Plus size={18} /> : <Minus size={18} />}
          </button>
          <button aria-label="关闭浮窗" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="panel-inside">
          <div className="goal-line">
            <span>当前目标</span>
            <strong>手动编辑文档，检查保存和切换状态</strong>
          </div>
          <div className="current">
            {state.status === 'ready' ? (
              <CheckCircle size={23} />
            ) : state.status === 'error' ? (
              <X size={23} />
            ) : (
              <CircleNotch size={23} className="spin" />
            )}
            <div>
              <small>当前状态</small>
              <strong>{state.status === 'ready' ? '等待手动操作' : summary}</strong>
            </div>
          </div>
          <section className="activity-section" aria-label="活动记录">
            <div className="web-activity-heading">活动记录</div>
            <div className="activity-list">
              <Activity
                events={[
                  {
                    id: 'page-load',
                    type: 'execution',
                    label: `打开${title}`,
                    summary,
                    status:
                      state.status === 'ready'
                        ? '已打开'
                        : state.status === 'error'
                          ? '失败'
                          : '加载中',
                    detail:
                      state.error ||
                      '已连接 home 上的 HedgeDoc 测试环境。无需登录，可以创建访客笔记、编辑正文并查看预览；返回首页后再进入，当前文档与位置会保留。',
                  },
                ]}
              />
            </div>
          </section>
          <p className="web-panel-help">
            创建访客笔记，修改正文并切换预览，再返回首页重新打开 HedgeDoc。
          </p>
          <small className="control-hint">
            当前由你手动操作，尚未接入自动填写或 AI。文档由 HedgeDoc 自动保存。
          </small>
        </div>
      )}
    </aside>
  );
}

export function WebPagePanelHost() {
  const state = useWebPageState();
  return (
    <WebPagePanel
      state={state}
      onClose={() => window.flowpilotWebPage?.send({ type: 'toggle-panel' })}
    />
  );
}
