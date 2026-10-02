import { useRef, useState } from 'react';
import { ArrowUp, CaretRight, Check, Clock, Globe, Sparkle } from '@phosphor-icons/react';
import type { ScheduleRule } from '@flowpilot/contracts';
import { nextOccurrence } from '@flowpilot/domain';
import { parseSchedule, stripSchedulePrefix } from '../demo/schedule-input';
import { taskStatus } from '../demo/task-model';
import type { Task } from '../demo/types';
import { nextLabel, scheduleLabel } from '../presentation/schedule-labels';
import { Brand } from '../components/Brand';
import { ScheduleEditor } from './ScheduleEditor';

type HomeProps = {
  tasks: Task[];
  onOpen: (id: string) => void;
  onCreate: (goal: string, schedule: ScheduleRule | null) => void;
  onSchedule: (id: string, schedule: ScheduleRule) => void;
};

export function Home({ tasks, onOpen, onCreate, onSchedule }: HomeProps) {
  const [goal, setGoal] = useState(''),
    [draft, setDraft] = useState<ScheduleRule | null>(null),
    [editing, setEditing] = useState<string | null>(null),
    [filter, setFilter] = useState('all'),
    [error, setError] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  const inferred = parseSchedule(goal)?.schedule,
    schedule = draft || inferred || null;
  const shown = tasks.filter((t) => filter === 'all' || t.schedule);
  const submit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!goal.trim()) return ref.current?.focus();
    if (schedule?.enabled && !nextOccurrence(schedule)) {
      setError('请选择未来的运行时间');
      return;
    }
    onCreate(schedule ? stripSchedulePrefix(goal.trim()) : goal.trim(), schedule);
    setGoal('');
    setDraft(null);
  };
  return (
    <div className="home">
      <header className="home-head">
        <Brand />
        <span>让网页任务顺畅完成</span>
      </header>
      <main className="home-main">
        <div className="home-intro">
          <span className="intro-icon">
            <Sparkle size={18} weight="fill" />
          </span>
          <h1>你想让网页帮你做什么？</h1>
          <p>描述目标，Flow Pilot 会打开网页，边分析边执行。</p>
        </div>
        <form className="composer" onSubmit={submit}>
          <label className="sr-only" htmlFor="goal">
            输入任务目标
          </label>
          <textarea
            id="goal"
            ref={ref}
            value={goal}
            onChange={(e) => {
              setGoal(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit(e);
              }
            }}
            placeholder="例如：每天早上9点整理行业动态…"
            rows={2}
          />
          <div className="composer-foot">
            <button
              className={'composer-clock ' + (schedule ? 'selected' : '')}
              type="button"
              onClick={() => setEditing('draft')}
            >
              <Clock size={16} />
              {schedule ? scheduleLabel(schedule) : '设置定时'}
            </button>
            <span>{schedule ? nextLabel(schedule) : '用一句话开始，之后可以随时调整'}</span>
            <button
              className="composer-send"
              type="submit"
              aria-label={schedule ? '创建定时任务' : '创建任务'}
            >
              <ArrowUp size={18} weight="bold" />
            </button>
          </div>
          {error && (
            <p className="schedule-error" role="alert">
              {error}
            </p>
          )}
        </form>
        <section className="tasks">
          <div className="tasks-head">
            <h2>我的任务</h2>
            <div className="task-filters">
              <button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
                全部
              </button>
              <button aria-pressed={filter === 'scheduled'} onClick={() => setFilter('scheduled')}>
                定时
              </button>
              <span>{shown.length} 个任务</span>
            </div>
          </div>
          <div className="task-list">
            {shown.map((t) => (
              <div className="task-row" key={t.id}>
                <button className="task-main" onClick={() => onOpen(t.id)}>
                  <span className="task-icon">
                    {t.schedule ? (
                      <Clock size={19} />
                    ) : t.status === '已完成' ? (
                      <Check size={18} />
                    ) : (
                      <Globe size={19} />
                    )}
                  </span>
                  <span className="task-text">
                    <strong>{t.name}</strong>
                    <small>{t.goal}</small>
                  </span>
                  <span className={'task-status ' + (t.status === '进行中' ? 'active' : '')}>
                    <i />
                    {taskStatus(t)}
                  </span>
                  {!t.schedule && <span className="task-time">{t.updated}</span>}
                  <CaretRight size={16} />
                </button>
                {t.schedule && (
                  <button
                    className="list-schedule"
                    aria-label={`修改 ${t.name} 的定时`}
                    onClick={() => setEditing(t.id)}
                  >
                    <span>
                      <Clock size={13} />
                      {scheduleLabel(t.schedule)}
                    </span>
                    <small>{nextLabel(t.schedule)}</small>
                  </button>
                )}
              </div>
            ))}
            {!shown.length && (
              <p className="task-empty">还没有定时任务，在上方描述目标和时间即可创建。</p>
            )}
          </div>
        </section>
      </main>
      {editing && (
        <ScheduleEditor
          schedule={editing === 'draft' ? schedule : tasks.find((t) => t.id === editing)?.schedule}
          onClose={() => setEditing(null)}
          onSave={(value) => (editing === 'draft' ? setDraft(value) : onSchedule(editing, value))}
        />
      )}
    </div>
  );
}
