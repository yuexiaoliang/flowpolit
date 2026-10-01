import type { Task } from '@flowpilot/contracts';

const currentKey = 'flowpilot.tasks.v1';
const legacyKeys = ['flow-pilot-prototype-tasks-v8', 'flow-pilot-prototype-tasks-v7'];

interface StoredTasks {
  version: 1;
  tasks: Task[];
}

export function loadTasks<T>(restore: (item: T) => Task, defaults: () => Task[]): Task[] {
  try {
    const raw = localStorage.getItem(currentKey) || legacyKeys.map(key => localStorage.getItem(key)).find(Boolean);
    const saved: unknown = JSON.parse(raw || 'null');
    const items = Array.isArray(saved) ? saved : saved && typeof saved === 'object' && 'version' in saved && saved.version === 1 && 'tasks' in saved && Array.isArray(saved.tasks) ? saved.tasks : null;
    return items ? items.map(item => restore(item as T)) : defaults();
  } catch {
    return defaults();
  }
}

export function saveTasks(tasks: Task[]): void {
  const record: StoredTasks = { version: 1, tasks };
  localStorage.setItem(currentKey, JSON.stringify(record));
}
