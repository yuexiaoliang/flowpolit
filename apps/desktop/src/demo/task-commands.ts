import { parseSchedule } from './schedule-input';
import {
  applyGoalCommand,
  pauseTask,
  resumeTask,
  setTaskSchedule,
  startRun,
  stopTask,
} from './task-model';
import type { Task } from './types';

type CommandResult = { task?: Task; feedback?: string };

export function applyTaskCommand(task: Task, text: string): CommandResult {
  if (/^(全部停止|停止全部|停止所有|终止并停止定时)[。！!]*$/.test(text)) {
    let next = stopTask(task);
    if (next.schedule) next = setTaskSchedule(next, { ...next.schedule, enabled: false }, text);
    return { task: next, feedback: '本次已终止，后续定时已停止' };
  }

  const parsed = parseSchedule(text, task.schedule);
  if (parsed) {
    if (!parsed.schedule) return { feedback: '当前任务还没有定时规则' };
    if (parsed.schedule.enabled && !parsed.schedule.nextAt)
      return { feedback: '请选择未来的运行时间' };
    return {
      task: setTaskSchedule(task, parsed.schedule, text),
      feedback: parsed.action === 'disable' ? '后续定时已停止；当前执行不受影响' : '定时设置已更新',
    };
  }

  if (/^(暂停|暂停一下|暂停任务|暂停本次)[。！!]*$/.test(text)) return { task: pauseTask(task) };
  if (/^(继续|继续执行|继续任务|恢复执行)[。！!]*$/.test(text)) return { task: resumeTask(task) };
  if (/^(停止|终止|停止任务|终止任务|终止本次|停止本次)[。！!]*$/.test(text))
    return { task: stopTask(task) };
  if (/^(重新运行|重新执行|再运行一次|试运行一次)[。！!]*$/.test(text)) {
    if (['进行中', '已暂停'].includes(task.status))
      return { feedback: '请先终止当前这次，再开始新一轮' };
    return { task: startRun(task, 'manual') };
  }
  return { task: applyGoalCommand(task, text) };
}
