import { ArrowRight, Globe } from '@phosphor-icons/react';

export function DiscoverySurface({
  stage,
  goal,
  site,
  onContinue,
  stopped,
  paused,
  needsLogin,
}: {
  stage: number;
  goal: string;
  site: string;
  onContinue: () => void;
  stopped: boolean;
  paused: boolean;
  needsLogin: boolean;
}) {
  return (
    <div className="discovery-surface">
      <div className="discovery-sitebar">
        <span className="demo-logo">{stage === 0 ? '网页探索' : site}</span>
        <span>{stage === 0 ? '平台查找' : '任务入口'}</span>
      </div>
      <main className="discovery-main">
        <div className="discovery-symbol">
          <Globe size={26} />
        </div>
        <small>{stopped ? '任务已终止' : stage === 0 ? '正在探索平台' : '已打开目标平台'}</small>
        <h1>
          {stopped
            ? '已停止执行当前任务'
            : paused
              ? '任务已暂停，进度已保留'
              : stage === 0
                ? `正在寻找 ${site} 的任务入口`
                : needsLogin
                  ? '等待你完成平台登录'
                  : '正在检查页面和登录状态'}
        </h1>
        <p>
          {stage === 0
            ? `目标：${goal}`
            : needsLogin
              ? '已定位登录入口。请在平台完成登录，然后返回 Flow Pilot 继续任务。'
              : '已找到创作入口。当前示例会话已登录，可以继续识别页面字段。'}
        </p>
        <div className="discovery-progress">
          <span className={'live-dot ' + (stopped ? 'stopped' : '')} />
          {stopped
            ? '后续网页操作已停止'
            : stage === 0
              ? '搜索平台、比对入口与页面结构'
              : needsLogin
                ? '暂停自动操作，等待登录确认'
                : '检查登录状态与可用操作'}
        </div>
        {!stopped && (
          <button disabled={paused} onClick={onContinue}>
            {stage === 0 ? '查看已找到的平台' : needsLogin ? '我已完成登录' : '进入编辑页面'}
            <ArrowRight size={16} />
          </button>
        )}
      </main>
    </div>
  );
}
