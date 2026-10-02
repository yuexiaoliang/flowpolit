import type { ScheduleRule } from '@flowpilot/contracts';
import { nextOccurrence } from '@flowpilot/domain';
import { advanceTask, createTask } from './task-model';
import type { ActivityEvent, Task } from './types';

export type LegacyTask = Partial<Task> &
  Pick<Task, 'id' | 'name' | 'goal' | 'site' | 'status' | 'updated' | 'aiTrace'> & {
    history?: ActivityEvent[];
  };
type ScheduleEditorProps = {
  schedule?: ScheduleRule | null;
  onSave: (value: ScheduleRule) => void;
  onClose: () => void;
};
type HomeProps = {
  tasks: Task[];
  onOpen: (id: string) => void;
  onCreate: (goal: string, schedule: ScheduleRule | null) => void;
  onSchedule: (id: string, schedule: ScheduleRule) => void;
};
type DetailProps = { task: Task; onHome: () => void; onUpdate: (id: string, value: Task) => void };

export function restoreTask(item: LegacyTask): Task {
  if (item.events) return item as Task;
  const desired =
    item.stage ?? (item.status === '已完成' ? 4 : item.id.startsWith('task-') ? 0 : 2);
  let task = createTask(item.goal, null, new Date(), {
    ...item,
    stage: 0,
    status: '进行中',
    hasRun: true,
  });
  for (let stage = 1; stage <= desired; stage++) task = advanceTask(task, stage);
  if (item.history?.length)
    task.events = [
      ...item.history.map((e, i) => ({ ...e, id: e.id + '-old-' + i })),
      ...task.events,
    ];
  return { ...task, status: item.status, paused: item.status === '已暂停' };
}
export function seedTasks(): Task[] {
  const schedule: ScheduleRule = {
    repeat: 'weekly',
    day: 1,
    time: '09:00',
    enabled: true,
    skipDates: [],
  };
  schedule.nextAt = nextOccurrence(schedule);
  return [
    restoreTask({
      id: 'article',
      name: '发布文章',
      goal: '把文章发布到创作中心',
      site: '创作中心',
      status: '进行中',
      updated: '刚刚',
      aiTrace: true,
    }),
    restoreTask({
      id: 'report',
      name: '整理本周行业动态',
      goal: '收集行业动态并整理为摘要',
      site: '资讯网站',
      status: '已完成',
      updated: '昨天',
      aiTrace: true,
      schedule,
    }),
    restoreTask({
      id: 'format',
      name: '检查文章格式',
      goal: '按已保存的步骤核对文章格式',
      site: '创作中心',
      status: '进行中',
      updated: '周一',
      aiTrace: false,
    }),
  ];
}
