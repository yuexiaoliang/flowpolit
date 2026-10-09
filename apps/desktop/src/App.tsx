import { Home } from './features/Home';
import { TaskDetail } from './features/TaskDetail';
import { useTaskWorkspace } from './app/useTaskWorkspace';
import { WebPageWorkspace } from './web-page/WebPageWorkspace';

export function App() {
  const { tasks, task, open, home, create, update, schedule, openHedgeDoc, pageActive } =
    useTaskWorkspace();
  return (
    <>
      {!pageActive &&
        (task ? (
          <TaskDetail key={task.id} task={task} onHome={home} onUpdate={update} />
        ) : (
          <Home
            tasks={tasks}
            onOpen={open}
            onCreate={create}
            onSchedule={schedule}
            onOpenHedgeDoc={openHedgeDoc}
          />
        ))}
      <WebPageWorkspace active={pageActive} onHome={home} />
    </>
  );
}
