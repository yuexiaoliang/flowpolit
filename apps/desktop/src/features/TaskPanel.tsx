import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUp,
  CaretDown,
  CheckCircle,
  CircleNotch,
  Clock,
  Globe,
  Minus,
  Pause,
  Play,
  Plus,
  X,
} from '@phosphor-icons/react';
import { nextOccurrence } from '@flowpilot/domain';
import {
  needsLogin as requiresLogin,
  pauseTask,
  resumeTask,
  setTaskSchedule,
  startRun,
  stopTask,
} from '../demo/task-model';
import type { Task } from '../demo/types';
import { Activity } from './Activity';
import { nextLabel, scheduleLabel } from '../presentation/schedule-labels';
import { ScheduleEditor } from './ScheduleEditor';

const phaseLabels = [
  '查找目标平台',
  '打开平台并检查登录',
  '识别字段并填写',
  '核对结果',
  '任务完成',
];
const runTime = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleString('zh-CN', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '等待开始';
export function TaskPanel({
  task,
  onChange,
  onAdvance,
  onClose,
  onCommand,
}: {
  task: Task;
  onChange: (task: Task) => void;
  onAdvance: () => void;
  onClose: () => void;
  onCommand: (text: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false),
    [showActivity, setShowActivity] = useState(true),
    [reply, setReply] = useState(''),
    [editing, setEditing] = useState<false | true | 'reschedule'>(false),
    [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; at: { x: number; y: number } } | null>(null),
    listRef = useRef<HTMLDivElement>(null);
  const active = ['进行中', '已暂停'].includes(task.status) && task.hasRun,
    paused = task.status === '已暂停',
    stopped = task.status === '已终止',
    login = requiresLogin(task);
  const label = !task.hasRun
    ? task.schedule?.enabled
      ? '等待定时执行'
      : '定时已停用'
    : stopped
      ? '本次执行已终止'
      : paused
        ? '本次执行已暂停'
        : login
          ? '等待用户登录'
          : phaseLabels[task.stage];
  useEffect(() => {
    if (showActivity && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [task.events?.length, task.runId, showActivity]);
  const submit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!reply.trim()) return;
    onCommand(reply.trim());
    setShowActivity(true);
    setReply('');
  };
  const toggleSchedule = () => {
    if (!task.schedule) return;
    const next = { ...task.schedule, enabled: !task.schedule.enabled };
    if (next.enabled && !nextOccurrence(next)) {
      setEditing('reschedule');
      return;
    }
    onChange(setTaskSchedule(task, next, task.schedule.enabled ? '停止后续定时' : '恢复后续定时'));
  };
  return (
    <aside
      className={
        'panel ' +
        (collapsed ? 'collapsed' : '') +
        (stopped ? ' stopped' : '') +
        (paused ? ' paused' : '')
      }
      style={{ transform: `translate(${offset.x}px,${offset.y}px)` }}
      aria-label="Flow Pilot 任务浮窗"
    >
      <div
        className="panel-head"
        onPointerDown={(e) => {
          if ((e.target as Element).closest('button')) return;
          drag.current = { x: e.clientX, y: e.clientY, at: offset };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (drag.current)
            setOffset({
              x: drag.current.at.x + e.clientX - drag.current.x,
              y: drag.current.at.y + e.clientY - drag.current.y,
            });
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <span className={'live-dot ' + (!active || paused ? 'stopped' : '')} />
        <strong>
          {!task.hasRun
            ? '已安排：'
            : stopped
              ? '已终止：'
              : paused
                ? '已暂停：'
                : task.stage === 4
                  ? '已完成：'
                  : '正在完成：'}
          {task.name}
        </strong>
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
            <strong title={task.goal}>{task.goal}</strong>
          </div>
          <div className="panel-schedule">
            <button className="schedule-link" onClick={() => setEditing(true)}>
              <Clock size={14} />
              <span>{scheduleLabel(task.schedule)}</span>
              <CaretDown size={12} />
            </button>
            {task.schedule && (
              <button className="schedule-stop" onClick={toggleSchedule}>
                {task.schedule.enabled ? '停止定时' : '恢复定时'}
              </button>
            )}
            {task.schedule && <small>{nextLabel(task.schedule)}</small>}
          </div>
          <div className="current">
            {!task.hasRun ? (
              <Clock size={23} />
            ) : stopped ? (
              <X size={23} />
            ) : paused ? (
              <Pause size={23} />
            ) : task.stage === 4 ? (
              <CheckCircle size={23} weight="fill" />
            ) : (
              <CircleNotch size={23} className={!login ? 'spin' : ''} />
            )}
            <div>
              <small>当前状态</small>
              <strong>{label}</strong>
            </div>
          </div>
          <section className="activity-section" aria-label="活动记录">
            <button
              className="section-toggle"
              aria-expanded={showActivity}
              onClick={() => setShowActivity(!showActivity)}
            >
              <span>
                活动记录 <small>{task.events?.length || 0} 条</small>
              </span>
              <CaretDown size={16} className={showActivity ? '' : 'turned'} />
            </button>
            {showActivity && (
              <div className="activity-list" ref={listRef}>
                {(task.pastRuns || []).map((run) => (
                  <details className="past-run" key={run.id}>
                    <summary>
                      <span>{runTime(run.startedAt)}</span>
                      <small>
                        {run.status} · {run.events.length} 条
                      </small>
                    </summary>
                    <Activity events={run.events} />
                  </details>
                ))}
                <div className="current-run">
                  <strong>{task.hasRun ? '本次运行' : '定时安排'}</strong>
                  <small>{runTime(task.startedAt)}</small>
                </div>
                <Activity events={task.events || []} />
              </div>
            )}
          </section>
          <form className="panel-input" onSubmit={submit}>
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="改需求、暂停、继续或修改定时…"
              aria-label="向 Flow Pilot 发送调整"
            />
            <button aria-label="发送调整">
              <ArrowUp size={17} weight="bold" />
            </button>
          </form>
          <div className="panel-foot">
            <div className="panel-left-actions">
              <button
                disabled={!active}
                title={paused ? '从当前步骤继续' : '保留进度并暂停当前运行'}
                onClick={() => onChange(paused ? resumeTask(task) : pauseTask(task))}
              >
                {paused ? <Play size={15} weight="fill" /> : <Pause size={15} weight="fill" />}
                {paused ? '继续' : '暂停'}
              </button>
              <button
                className="stop-action"
                disabled={!active}
                title="结束本次执行；定时规则保持原设置"
                onClick={() => onChange(stopTask(task))}
              >
                <X size={14} />
                终止本次
              </button>
            </div>
            <button
              className="next"
              disabled={active && (paused || login)}
              onClick={() =>
                active ? onAdvance() : onChange(startRun(task, task.hasRun ? 'manual' : 'trial'))
              }
            >
              {active
                ? login
                  ? '等待登录'
                  : '模拟下一步'
                : task.hasRun
                  ? '重新运行'
                  : '试运行一次'}
              <ArrowRight size={15} />
            </button>
          </div>
          <small className="control-hint">
            {active
              ? '暂停保留进度；终止本次不影响后续定时。'
              : '定时仅在应用窗口打开时触发；页面操作为模拟。'}
          </small>
        </div>
      )}
      {editing && (
        <ScheduleEditor
          schedule={
            editing === 'reschedule' && task.schedule
              ? { ...task.schedule, enabled: true }
              : task.schedule
          }
          onClose={() => setEditing(false)}
          onSave={(value) => onChange(setTaskSchedule(task, value))}
        />
      )}
    </aside>
  );
}
