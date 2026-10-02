import { useEffect, useRef, useState } from 'react';
import { Clock, X } from '@phosphor-icons/react';
import type { ScheduleRepeat, ScheduleRule } from '@flowpilot/contracts';
import { localDate, nextOccurrence } from '@flowpilot/domain';
import { nextLabel } from '../presentation/schedule-labels';

type ScheduleEditorProps = {
  schedule?: ScheduleRule | null;
  onSave: (value: ScheduleRule) => void;
  onClose: () => void;
};

export function ScheduleEditor({ schedule, onSave, onClose }: ScheduleEditorProps) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [draft, setDraft] = useState<ScheduleRule>(
    schedule || {
      repeat: 'daily',
      time: '09:00',
      day: 1,
      date: localDate(tomorrow),
      enabled: true,
      skipDates: [],
    },
  );
  const ref = useRef<HTMLDialogElement>(null);
  const next = nextOccurrence(draft);
  const change = <K extends keyof ScheduleRule>(key: K, value: ScheduleRule[K]) =>
    setDraft((d) => ({ ...d, [key]: value, skipDates: [] }));
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      className="schedule-dialog"
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-labelledby="schedule-title"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.enabled && !next) return;
          onSave({ ...draft, nextAt: next });
          onClose();
        }}
      >
        <div className="schedule-dialog-head">
          <span>
            <Clock size={18} /> <strong id="schedule-title">定时任务</strong>
          </span>
          <button type="button" aria-label="关闭定时设置" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <label className="schedule-field">
          重复规则
          <select
            value={draft.repeat}
            onChange={(e) => change('repeat', e.target.value as ScheduleRepeat)}
          >
            <option value="once">仅一次</option>
            <option value="daily">每天</option>
            <option value="workdays">工作日</option>
            <option value="weekly">每周</option>
          </select>
        </label>
        <div className="schedule-field-row">
          <label className="schedule-field">
            运行时间
            <input
              type="time"
              required
              value={draft.time}
              onInput={(e) => change('time', e.currentTarget.value)}
              onChange={(e) => change('time', e.target.value)}
            />
          </label>
          {draft.repeat === 'once' && (
            <label className="schedule-field">
              日期
              <input
                type="date"
                required
                min={localDate()}
                value={draft.date}
                onInput={(e) => change('date', e.currentTarget.value)}
                onChange={(e) => change('date', e.target.value)}
              />
            </label>
          )}
          {draft.repeat === 'weekly' && (
            <label className="schedule-field">
              星期
              <select value={draft.day} onChange={(e) => change('day', Number(e.target.value))}>
                {['日', '一', '二', '三', '四', '五', '六'].map((d, i) => (
                  <option value={i} key={i}>
                    周{d}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <label className="schedule-enabled">
          <input
            type="checkbox"
            checked={draft.enabled}
            onChange={(e) => change('enabled', e.target.checked)}
          />
          <span>启用后续定时</span>
        </label>
        <div className="schedule-preview">
          <strong>
            {draft.enabled && next
              ? nextLabel({ ...draft, nextAt: next })
              : draft.enabled
                ? '请选择未来的运行时间'
                : '后续定时已停用'}
          </strong>
          <small>按本机时区运行；应用窗口打开时触发。关闭或休眠期间错过的运行会跳过。</small>
        </div>
        <div className="schedule-dialog-actions">
          <button className="outline" type="button" onClick={onClose}>
            取消
          </button>
          <button className="publish" type="submit" disabled={draft.enabled && !next}>
            保存定时
          </button>
        </div>
      </form>
    </dialog>
  );
}
