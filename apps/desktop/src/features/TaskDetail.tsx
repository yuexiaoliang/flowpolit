import { useState } from 'react';
import {
  ArrowClockwise,
  ArrowLeft,
  ArrowRight,
  Clock,
  DotsThree,
  Globe,
  Play,
  Plus,
  Sparkle,
  X,
} from '@phosphor-icons/react';
import {
  advanceTask,
  confirmLogin,
  needsLogin as requiresLogin,
  startRun,
  taskStatus,
} from '../demo/task-model';
import { applyTaskCommand } from '../demo/task-commands';
import type { Task } from '../demo/types';
import { nextLabel, scheduleLabel } from '../presentation/schedule-labels';
import { Brand } from '../components/Brand';
import { DiscoverySurface } from './DiscoverySurface';
import { Editor } from './DemoEditor';
import { TaskPanel } from './TaskPanel';

type DetailProps = { task: Task; onHome: () => void; onUpdate: (id: string, value: Task) => void };

export function TaskDetail({ task, onHome, onUpdate }: DetailProps) {
  const [visible, setVisible] = useState(true),
    [toast, setToast] = useState('');
  const stopped = task.status === '已终止',
    paused = task.status === '已暂停',
    inactive = !task.hasRun || stopped || paused || task.status === '已完成';
  const label = requiresLogin(task) && !paused ? '等待用户登录' : taskStatus(task);
  const update = (value: Task) => onUpdate(task.id, value);
  const advance = () => {
    if (inactive) return;
    update(
      requiresLogin(task) ? confirmLogin(task) : advanceTask(task, Math.min(task.stage + 1, 4)),
    );
  };
  const command = (text: string) => {
    const result = applyTaskCommand(task, text);
    if (result.task) update(result.task);
    if (result.feedback) setToast(result.feedback);
  };
  return (
    <div className="detail">
      <div className="tabs">
        <button onClick={onHome} className="back-home" title="返回首页">
          <Brand compact />
        </button>
        <div className="tab">
          <Globe size={16} />
          {!task.hasRun ? '定时任务' : task.stage === 0 ? '寻找平台' : task.site} · {task.name}
          <button aria-label="关闭标签页" onClick={onHome}>
            <X size={14} />
          </button>
        </div>
        <button className="new-tab" aria-label="新任务" onClick={onHome}>
          <Plus size={17} />
        </button>
        <span className="spacer" />
        <button className="task-toggle" onClick={() => setVisible(!visible)}>
          <span className={'live-dot ' + (inactive ? 'stopped' : '')} />
          {label}
        </button>
      </div>
      <div className="address">
        <button aria-label="返回首页" onClick={onHome}>
          <ArrowLeft size={19} />
        </button>
        <button aria-label="前进" onClick={() => setToast('正在按任务目标继续')}>
          <ArrowRight size={19} />
        </button>
        <button aria-label="刷新" onClick={() => setToast('网页已刷新')}>
          <ArrowClockwise size={17} />
        </button>
        <div className="url">
          <Globe size={16} />
          {!task.hasRun
            ? '等待计划时间，到时打开目标平台'
            : task.stage === 0
              ? '正在查找目标平台…'
              : task.stage === 1
                ? 'https://create.example.com'
                : 'https://create.example.com/write'}
        </div>
        <button
          className="pilot-switch"
          aria-label="切换任务浮窗"
          onClick={() => setVisible(!visible)}
        >
          <Sparkle size={19} weight="fill" />
        </button>
        <button aria-label="更多" onClick={() => setToast('暂无更多操作')}>
          <DotsThree size={20} />
        </button>
      </div>
      {toast && (
        <div className="toast" role="status" onClick={() => setToast('')}>
          {toast}
        </div>
      )}
      {!task.hasRun ? (
        <div className="scheduled-surface">
          <span className="discovery-symbol">
            <Clock size={26} />
          </span>
          <small>{task.schedule?.enabled ? '已安排定时任务' : '定时已停止'}</small>
          <h1>{scheduleLabel(task.schedule)}</h1>
          <p>{task.goal}</p>
          <span>{nextLabel(task.schedule)}</span>
          <button className="outline" onClick={() => update(startRun(task, 'trial'))}>
            试运行一次 <Play size={14} />
          </button>
          <small>本机时区 · 窗口打开时触发 · 不补跑错过的运行</small>
        </div>
      ) : task.stage < 2 ? (
        <DiscoverySurface
          stage={task.stage}
          goal={task.goal}
          site={task.site}
          stopped={stopped}
          paused={paused}
          needsLogin={requiresLogin(task)}
          onContinue={advance}
        />
      ) : (
        <Editor
          stage={task.stage}
          stopped={stopped}
          paused={paused}
          siteName={task.site}
          title={task.title || 'AI 时代，普通人如何提升自己的核心竞争力？'}
          setTitle={(title) => update({ ...task, title })}
          onPublish={() => {
            if (!inactive) {
              update(advanceTask(task, 4));
              setToast('模拟任务结果已确认');
            }
          }}
        />
      )}
      {visible ? (
        <TaskPanel
          task={task}
          onChange={update}
          onAdvance={advance}
          onCommand={command}
          onClose={() => setVisible(false)}
        />
      ) : (
        <button className="reopen" onClick={() => setVisible(true)}>
          <Sparkle size={17} weight="fill" />
          查看任务过程
        </button>
      )}
    </div>
  );
}
