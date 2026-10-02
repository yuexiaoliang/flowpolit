import type { ScheduleRule } from '@flowpilot/contracts';

export type TaskStatus = '待执行' | '进行中' | '已暂停' | '已终止' | '已完成';
export type ActivityType = 'user' | 'execution' | 'thought' | 'tool' | 'skill';

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  label: string;
  summary: string;
  status: string;
  detail: string;
}

export interface TaskRun {
  id: string;
  startedAt: string | null;
  endedAt: string | null;
  status: TaskStatus;
  events: ActivityEvent[];
}

export interface Task {
  id: string;
  name: string;
  goal: string;
  site: string;
  status: TaskStatus;
  updated: string;
  aiTrace: boolean;
  stage: number;
  hasRun: boolean;
  runId: string;
  startedAt: string | null;
  endedAt?: string | null;
  runTrigger?: 'manual' | 'scheduled' | 'trial';
  paused?: boolean;
  loginConfirmed?: boolean;
  simulationNextAt?: string | null;
  pastRuns: TaskRun[];
  schedule: ScheduleRule | null;
  events: ActivityEvent[];
  title?: string;
}
