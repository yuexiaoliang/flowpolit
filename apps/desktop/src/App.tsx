import { Home } from './features/Home';
import { TaskDetail } from './features/TaskDetail';
import { useTaskWorkspace } from './app/useTaskWorkspace';

export function App() {
  const { tasks, task, open, home, create, update, schedule } = useTaskWorkspace();
  return task ? (
    <TaskDetail key={task.id} task={task} onHome={home} onUpdate={update} />
  ) : (
    <Home tasks={tasks} onOpen={open} onCreate={create} onSchedule={schedule} />
  );
}
