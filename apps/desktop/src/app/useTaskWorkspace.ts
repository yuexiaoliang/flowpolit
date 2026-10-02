import { useEffect, useState } from 'react';
import type { ScheduleRule } from '@flowpilot/contracts';
import { createTask, setTaskSchedule, tickTasks } from '../demo/task-model';
import { restoreTask, seedTasks, type LegacyTask } from '../demo/seed-tasks';
import type { Task } from '../demo/types';
import { loadTasks, saveTasks } from './task-storage';

function routeTaskId(): string | null {
  return location.pathname.startsWith('/task/')
    ? decodeURIComponent(location.pathname.split('/')[2] || 'article')
    : null;
}

export function useTaskWorkspace() {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks<LegacyTask>(restoreTask, seedTasks));
  const [active, setActive] = useState<string | null>(routeTaskId);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);
  useEffect(() => {
    const timer = setInterval(() => setTasks((list) => tickTasks(list)), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const listener = () => setActive(routeTaskId());
    addEventListener('popstate', listener);
    return () => removeEventListener('popstate', listener);
  }, []);

  const open = (id: string) => {
    history.pushState({}, '', `/task/${encodeURIComponent(id)}`);
    setActive(id);
  };
  const home = () => {
    history.pushState({}, '', '/');
    setActive(null);
  };
  const create = (goal: string, schedule: ScheduleRule | null) => {
    const task = createTask(goal, schedule);
    setTasks((list) => [task, ...list]);
    open(task.id);
  };
  const update = (id: string, value: Task) => {
    setTasks((list) => list.map((task) => (task.id === id ? { ...value, updated: '刚刚' } : task)));
  };
  const schedule = (id: string, value: ScheduleRule) => {
    setTasks((list) => list.map((task) => (task.id === id ? setTaskSchedule(task, value) : task)));
  };

  return {
    tasks,
    task: tasks.find((item) => item.id === active),
    open,
    home,
    create,
    update,
    schedule,
  };
}
