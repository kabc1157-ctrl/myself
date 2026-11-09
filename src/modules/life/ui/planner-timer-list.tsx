import { startPlannerTimerAction, stopPlannerTimerAction } from "@/modules/life/application/actions";

type Task = { id: string; title: string; start_time: string | null };

export function PlannerTimerList({ tasks }: { tasks: Task[] }) {
  const scheduled = tasks.filter((task) => task.start_time);
  if (!scheduled.length) return null;
  return <section className="planner-timer-list"><div className="card-heading"><span>집중 기록</span><h2>오늘의 타이머</h2></div>{scheduled.map((task) => <div className="planner-timer-row" key={task.id}><span><small>{task.start_time?.slice(0, 5)}</small>{task.title}</span><div><form action={startPlannerTimerAction}><input name="taskId" type="hidden" value={task.id}/><button type="submit">시작</button></form><form action={stopPlannerTimerAction}><input name="taskId" type="hidden" value={task.id}/><button type="submit">정지</button></form></div></div>)}</section>;
}
