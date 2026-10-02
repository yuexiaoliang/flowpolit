import test from 'node:test';
import assert from 'node:assert/strict';
import { localDate, nextOccurrence } from '@flowpilot/domain';
import { parseSchedule } from '../apps/desktop/src/demo/schedule-input';
import {
  createTask,
  startRun,
  pauseTask,
  resumeTask,
  stopTask,
  advanceTask,
  setTaskSchedule,
  tickTasks,
  applyGoalCommand,
} from '../apps/desktop/src/demo/task-model';
import { applyTaskCommand } from '../apps/desktop/src/demo/task-commands';
const now = new Date(2026, 9, 1, 8, 0);
const rule = (repeat = 'daily') => ({
  repeat,
  time: '09:00',
  day: 1,
  date: localDate(now),
  enabled: true,
  skipDates: [],
});

test('future schedules support once, daily, weekdays, weekly and Chinese time commands', () => {
  assert.equal(new Date(nextOccurrence(rule(), now)).getHours(), 9);
  assert.equal(new Date(nextOccurrence(rule('weekly'), now)).getDay(), 1);
  assert.equal(new Date(nextOccurrence(rule('workdays'), new Date(2026, 9, 2, 10))).getDay(), 1);
  assert.equal(nextOccurrence(rule('once'), new Date(2026, 9, 1, 10)), null);
  assert.equal(parseSchedule('每天早上九点整理行业动态', null, now).schedule.time, '09:00');
  assert.equal(parseSchedule('改到晚上八点', rule(), now).schedule.time, '20:00');
  assert.equal(parseSchedule('每周一执行一次', null, now).schedule.repeat, 'weekly');
  assert.equal(parseSchedule('停止定时', rule(), now).schedule.enabled, false);
  const skip = parseSchedule('明天这次取消，之后照常', rule(), now).schedule;
  assert.ok(skip.skipDates.includes('2026-10-02'));
});

test('pause preserves steps and prevents manual and automatic progression, resume continues', () => {
  let task = startRun(createTask('在知乎发布文章', rule(), now), 'trial', now);
  task = advanceTask(task, 2, now);
  task = pauseTask(task, now);
  assert.equal(task.status, '已暂停');
  assert.equal(advanceTask(task, 3, now), task);
  assert.equal(tickTasks([task], new Date(now.getTime() + 30000))[0], task);
  const restored = JSON.parse(JSON.stringify(task));
  task = resumeTask(restored, now);
  assert.equal(task.stage, 2);
  assert.equal(task.status, '进行中');
  task = tickTasks([task], new Date(now.getTime() + 6000))[0];
  assert.equal(task.stage, 3);
});

test('terminate stops this run without disabling future rules; edits do not revive it', () => {
  let task = startRun(createTask('在知乎发布文章', rule(), now), 'trial', now);
  task = stopTask(task, now);
  assert.equal(task.schedule.enabled, true);
  assert.equal(task.simulationNextAt, null);
  assert.equal(advanceTask(task, 1, now), task);
  assert.equal(resumeTask(task, now), task);
  const edited = applyGoalCommand(task, '改成在公众号发布文章', now);
  assert.equal(edited.status, '已终止');
  assert.equal(edited.site, '公众号平台');
  task = startRun(edited, 'manual', now);
  assert.equal(task.pastRuns.length, 1);
  assert.equal(task.pastRuns[0].status, '已终止');
  assert.equal(task.stage, 0);
});

test('disabling schedules leaves the current run alive and prevents future triggers', () => {
  let task = startRun(createTask('发布文章', rule(), now), 'trial', now);
  task = setTaskSchedule(task, { ...task.schedule, enabled: false }, '停止定时', now);
  assert.equal(task.status, '进行中');
  assert.equal(task.schedule.nextAt, null);
  task = stopTask(task, now);
  assert.equal(tickTasks([task], new Date(2026, 9, 1, 10))[0], task);
});

test('due triggers run once, preserve archives and never replace a paused run', () => {
  const schedule = rule();
  schedule.nextAt = nextOccurrence(schedule, now);
  const task = createTask('发布文章', schedule, now);
  const due = new Date(2026, 9, 1, 9, 0, 1);
  let started = tickTasks([task], due)[0];
  assert.equal(started.status, '进行中');
  assert.equal(started.runTrigger, 'scheduled');
  assert.ok(new Date(started.schedule.nextAt) > due);
  assert.equal(tickTasks([started], due)[0], started);
  const id = started.runId;
  started = pauseTask(started, due);
  started = { ...started, schedule: { ...started.schedule, nextAt: due.toISOString() } };
  const skipped = tickTasks([started], due)[0];
  assert.equal(skipped.runId, id);
  assert.equal(skipped.status, '已暂停');
  assert.match(skipped.events.at(-1).summary, /仍在运行/);
});

test('one-time and missed schedules do not backfill or repeatedly trigger', () => {
  const schedule = rule('once');
  schedule.nextAt = nextOccurrence(schedule, now);
  let task = createTask('发布文章', schedule, now);
  task = tickTasks([task], new Date(2026, 9, 1, 9, 0, 1))[0];
  assert.equal(task.schedule.enabled, false);
  assert.equal(task.schedule.nextAt, null);
  const daily = rule();
  daily.nextAt = nextOccurrence(daily, now);
  const missed = tickTasks([createTask('发布文章', daily, now)], new Date(2026, 9, 1, 10))[0];
  assert.equal(missed.hasRun, false);
  assert.match(missed.events.at(-1).summary, /错过/);
});

test('natural language controls keep stopping a run separate from stopping its schedule', () => {
  const running = startRun(createTask('整理行业动态', rule(), now), 'trial', now);
  const scheduleOnly = applyTaskCommand(running, '停止定时').task!;
  assert.equal(scheduleOnly.status, '进行中');
  assert.equal(scheduleOnly.schedule?.enabled, false);

  const paused = applyTaskCommand(running, '暂停').task!;
  assert.equal(paused.status, '已暂停');
  assert.equal(applyTaskCommand(paused, '继续').task?.status, '进行中');

  const all = applyTaskCommand(running, '全部停止').task!;
  assert.equal(all.status, '已终止');
  assert.equal(all.schedule?.enabled, false);
});
