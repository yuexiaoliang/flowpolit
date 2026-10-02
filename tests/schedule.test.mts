import test from 'node:test';
import assert from 'node:assert/strict';
import { nextOccurrence, localDate } from '@flowpilot/domain';
import { parseSchedule, stripSchedulePrefix } from '../apps/desktop/src/demo/schedule-input';
import {
  createTask,
  startRun,
  stopTask,
  pauseTask,
  resumeTask,
  taskStatus,
  tickTasks,
} from '../apps/desktop/src/demo/task-model';
const at = (day, hour = 8, minute = 0) => new Date(2026, 9, day, hour, minute, 0);
const daily = { repeat: 'daily', time: '09:00', enabled: true, skipDates: [] };

test('daily and weekly rules roll forward at the exact scheduled time', () => {
  assert.equal(nextOccurrence(daily, at(1)), at(1, 9).toISOString());
  assert.equal(nextOccurrence(daily, at(1, 9)), at(2, 9).toISOString());
  assert.equal(
    nextOccurrence({ ...daily, repeat: 'weekly', day: 1 }, at(1)),
    at(5, 9).toISOString(),
  );
});
test('skip dates, workdays and expired one-time rules do not create extra runs', () => {
  assert.equal(
    nextOccurrence({ ...daily, skipDates: [localDate(at(2))] }, at(1, 10)),
    at(3, 9).toISOString(),
  );
  assert.equal(nextOccurrence({ ...daily, repeat: 'workdays' }, at(2, 10)), at(5, 9).toISOString());
  assert.equal(
    nextOccurrence({ ...daily, repeat: 'once', date: localDate(at(1)) }, at(1, 10)),
    null,
  );
});
test('natural language scheduling keeps the task goal separate and preserves recurrence when time changes', () => {
  assert.equal(parseSchedule('每天早上9点整理行业动态', null, at(1)).schedule.time, '09:00');
  assert.equal(stripSchedulePrefix('每天早上9点整理行业动态'), '整理行业动态');
  const revised = parseSchedule('改到晚上八点', daily, at(1)).schedule;
  assert.equal(revised.time, '20:00');
  assert.equal(revised.repeat, 'daily');
  assert.equal(parseSchedule('标题改成：新的观点', daily, at(1)), null);
  assert.equal(
    parseSchedule('明天这次取消，之后照常', daily, at(1, 10)).schedule.nextAt,
    at(3, 9).toISOString(),
  );
});
test('ending this run keeps future schedules; a new run archives its activity', () => {
  const task = startRun(createTask('在知乎发布文章', daily, at(1)), 'trial', at(1));
  const stopped = stopTask(task, at(1, 8, 1));
  assert.equal(stopped.schedule.enabled, true);
  assert.equal(stopped.status, '已终止');
  const rerun = startRun(stopped, 'manual', at(1, 8, 2));
  assert.equal(rerun.pastRuns.length, 1);
  assert.equal(rerun.pastRuns[0].status, '已终止');
  assert.equal(rerun.pastRuns[0].events.at(-1).summary, '结束本次执行');
});
test('due timers trigger one simulated run and overlapping or missed triggers are skipped', () => {
  const schedule = { ...daily, nextAt: at(1, 9).toISOString() };
  const task = createTask('整理行业动态', schedule, at(1));
  const triggered = tickTasks([task], at(1, 9))[0];
  assert.equal(triggered.status, '进行中');
  assert.equal(triggered.runTrigger, 'scheduled');
  assert.equal(triggered.schedule.nextAt, at(2, 9).toISOString());
  const busy = tickTasks(
    [{ ...triggered, schedule: { ...schedule, nextAt: at(1, 9).toISOString() } }],
    at(1, 9),
  )[0];
  assert.equal(busy.runId, triggered.runId);
  assert.match(busy.events.at(-1).summary, /上一轮/);
  const late = tickTasks([task], at(1, 9, 5))[0];
  assert.equal(late.hasRun, false);
  assert.match(late.events.at(-1).summary, /错过/);
});
test('automatic demo progression pauses for user pause and required login', () => {
  const now = at(1);
  let task = startRun(createTask('在知乎登录后发布文章', daily, now), 'trial', now);
  task = tickTasks([task], new Date(now.getTime() + 6000))[0];
  assert.equal(task.stage, 1);
  assert.equal(tickTasks([task], new Date(now.getTime() + 20000))[0].stage, 1);
  const paused = { ...task, goal: '在知乎发布文章', paused: true };
  assert.equal(tickTasks([paused], new Date(now.getTime() + 20000))[0].stage, 1);
});

test('pausing a scheduled run preserves its step and reports pause; resuming continues this run', () => {
  const now = at(1);
  const running = startRun(createTask('整理行业动态', daily, now), 'trial', now);
  const paused = pauseTask(running, now);
  assert.equal(taskStatus(paused), '已暂停');
  const later = tickTasks([paused], new Date(now.getTime() + 30000))[0];
  assert.equal(later.stage, running.stage);
  const resumed = resumeTask(later, new Date(now.getTime() + 30000));
  assert.equal(resumed.runId, running.runId);
  const progressed = tickTasks([resumed], new Date(now.getTime() + 36000))[0];
  assert.equal(progressed.stage, 1);
});
