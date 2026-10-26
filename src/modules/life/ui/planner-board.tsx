"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { PersistentDetails } from "@/core/ui/persistent-details";
import { deletePlannerTaskAction, savePlannerTaskAction, schedulePlannerTaskAction, setPlannerPriorityAction, togglePlannerTaskAction } from "@/modules/life/application/actions";

type Task = { id: string; title: string; priority: number | null; start_time: string | null; end_time: string | null; completed_at: string | null; note: { id: string; title: string } | null; exercise: { id: string; activity: string; focus_area: string | null } | null };
type CalendarEvent = { id: string; title: string; allDay: boolean; startTime: string | null; endTime: string | null; startLabel: string };
type NoteOption = { id: string; title: string };
type ExerciseOption = { id: string; exercise_date: string; activity: string };

const slots = Array.from({ length: 38 }, (_, index) => {
  const minutes = 5 * 60 + index * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});

function timeFromIso(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function PlannerBoard({ date, tasks, backlog, events, notes, exercises }: { date: string; tasks: Task[]; backlog: Task[]; events: CalendarEvent[]; notes: NoteOption[]; exercises: ExerciseOption[] }) {
  const router = useRouter();
  const [localTasks, setLocalTasks] = useState(tasks);
  const [localBacklog, setLocalBacklog] = useState(backlog);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const priorities = [1, 2, 3].map((priority) => localTasks.find((task) => task.priority === priority) ?? null);
  const selectedTask = [...localBacklog, ...localTasks].find((task) => task.id === selectedTaskId) ?? null;

  useEffect(() => {
    const refresh = () => router.refresh();
    const intervalId = window.setInterval(refresh, 24 * 60 * 60 * 1_000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [router]);

  const runAction = (action: () => Promise<unknown>) => startTransition(async () => {
    setError(null);
    try { await action(); router.refresh(); }
    catch { setError("저장하지 못했어요. 잠시 후 다시 시도해 주세요."); router.refresh(); }
  });

  const schedule = (taskId: string, startTime: string) => {
    const source = [...localBacklog, ...localTasks].find((task) => task.id === taskId);
    if (!source) return;
    const [hour, minute] = startTime.split(":").map(Number);
    const endMinutes = hour * 60 + minute + 30;
    const endTime = endMinutes >= 24 * 60 ? "23:59" : `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
    setLocalBacklog((current) => current.filter((task) => task.id !== taskId));
    setLocalTasks((current) => [...current.filter((task) => task.id !== taskId), { ...source, start_time: startTime, end_time: endTime }]);
    setSelectedTaskId(null);
    runAction(async () => { const data = new FormData(); data.set("id", taskId); data.set("date", date); data.set("startTime", startTime); await schedulePlannerTaskAction(data); });
  };

  const setPriority = (taskId: string, priority: number) => {
    const source = [...localBacklog, ...localTasks].find((task) => task.id === taskId);
    if (!source) return;
    setLocalBacklog((current) => current.filter((task) => task.id !== taskId));
    setLocalTasks((current) => [...current.filter((task) => task.id !== taskId).map((task) => task.priority === priority ? { ...task, priority: null } : task), { ...source, priority }]);
    setSelectedTaskId(taskId);
    runAction(async () => { const data = new FormData(); data.set("id", taskId); data.set("date", date); data.set("priority", String(priority)); await setPlannerPriorityAction(data); });
  };

  const removeTask = (taskId: string) => {
    setLocalBacklog((current) => current.filter((task) => task.id !== taskId));
    setLocalTasks((current) => current.filter((task) => task.id !== taskId));
    if (selectedTaskId === taskId) setSelectedTaskId(null);
    runAction(async () => { const data = new FormData(); data.set("id", taskId); await deletePlannerTaskAction(data); });
  };

  const toggleTask = (task: Task) => {
    const nextCompletedAt = task.completed_at ? null : new Date().toISOString();
    setLocalTasks((current) => current.map((item) => item.id === task.id ? { ...item, completed_at: nextCompletedAt } : item));
    runAction(async () => { const data = new FormData(); data.set("id", task.id); data.set("completed", String(Boolean(task.completed_at))); await togglePlannerTaskAction(data); });
  };

  return <section className={pending ? "planner-board is-pending" : "planner-board"}>
    <div className="planner-board-left">
      <PersistentDetails className="planner-board-panel planner-collapsible-panel" defaultOpen storageKey={`planner-priorities-${date}`}><summary><h2>우선순위 3</h2><span aria-hidden="true">+</span></summary><div className="planner-priority-list">{priorities.map((task, index) => <div className="planner-priority-slot" key={index}><b>{index + 1}</b>{task ? <button className={selectedTaskId === task.id ? "selected" : ""} draggable onClick={() => setSelectedTaskId(task.id)} onDragStart={(event) => event.dataTransfer.setData("text/task-id", task.id)} type="button">{task.title}</button> : <button disabled={!selectedTaskId} onClick={() => selectedTaskId && setPriority(selectedTaskId, index + 1)} type="button">{selectedTaskId ? `${index + 1}순위로 지정` : "블록을 먼저 선택하세요"}</button>}</div>)}</div></PersistentDetails>
      <PersistentDetails className="planner-board-panel planner-collapsible-panel" defaultOpen storageKey={`planner-calendar-${date}`}><summary><h2>오늘의 캘린더 일정</h2><span aria-hidden="true">+</span></summary><div className="planner-calendar-refresh-row"><small>하루에 한 번 자동 갱신돼요. 변경 내용을 바로 가져오려면 갱신하기를 눌러주세요.</small><button onClick={() => startTransition(() => router.refresh())} type="button">갱신하기</button></div><div className="planner-source-list">{events.length ? events.map((event) => <div className="planner-source-card calendar" key={event.id}><span>{event.startLabel}</span><strong>{event.title}</strong></div>) : <p>오늘 연결된 Google 일정이 없어요.</p>}</div></PersistentDetails>
      <PersistentDetails className="planner-board-panel planner-collapsible-panel" defaultOpen storageKey={`planner-brain-dump-${date}`}><summary><h2>브레인 덤프</h2><span aria-hidden="true">+</span></summary><form action={savePlannerTaskAction} className="brain-dump-form"><input name="title" placeholder="머릿속 할 일을 바로 적어보세요" required/><button>추가</button><details><summary>메모·운동 기록 연결</summary><div><label>메모<select name="noteId"><option value="">연결 안 함</option>{notes.map((note) => <option key={note.id} value={note.id}>{note.title}</option>)}</select></label><label>운동 기록<select name="exerciseId"><option value="">연결 안 함</option>{exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.exercise_date} · {exercise.activity}</option>)}</select></label></div></details></form><details className="planner-backlog" open><summary>남은 브레인 덤프 <b>{localBacklog.length}</b></summary><div className="planner-source-list">{localBacklog.map((task) => <article className={selectedTaskId === task.id ? "planner-source-card selected" : "planner-source-card"} draggable key={task.id} onClick={() => setSelectedTaskId(task.id)} onDragStart={(event) => event.dataTransfer.setData("text/task-id", task.id)}><strong>{task.title}</strong>{task.note ? <small>메모 · {task.note.title}</small> : null}{task.exercise ? <small>운동 · {task.exercise.activity}</small> : null}<div>{[1,2,3].map((priority)=><button aria-label={`${task.title} ${priority}순위로 지정`} key={priority} onClick={(event) => { event.stopPropagation(); setPriority(task.id, priority); }} type="button">{priority}</button>)}<button aria-label={`${task.title} 삭제`} onClick={(event) => { event.stopPropagation(); removeTask(task.id); }} type="button">×</button></div></article>)}</div></details></PersistentDetails>
    </div>
    <section className="planner-timeline-panel"><div className="planner-timeline-heading"><h2>하루 시간표</h2><span>블록을 끌거나 선택한 뒤 시간대를 누르세요.</span></div>{selectedTask ? <div className="planner-selection-banner"><strong>{selectedTask.title}</strong><span>배치할 시간의 ‘여기 배치’를 누르세요.</span><button onClick={() => setSelectedTaskId(null)} type="button">선택 해제</button></div> : null}{error ? <p className="form-message error">{error}</p> : null}<div className="planner-timeline">{slots.map((slot) => {
      const tasksAtTime = localTasks.filter((item) => item.start_time?.slice(0,5) === slot);
      const calendarEvents = events.filter((event) => timeFromIso(event.startTime) === slot);
      return <div className={selectedTaskId ? "planner-time-row ready" : "planner-time-row"} key={slot} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData("text/task-id"); if (id) schedule(id, slot); }}><time>{slot}</time><div>{selectedTaskId ? <button className="planner-time-drop-target" onClick={() => schedule(selectedTaskId, slot)} type="button">여기 배치</button> : null}{calendarEvents.map((event)=><span className="planner-time-block google" key={event.id}>{event.title}</span>)}{tasksAtTime.map((task) => <div className="planner-time-task" key={task.id}><button className={task.completed_at ? "planner-time-block task completed" : "planner-time-block task"} draggable onClick={() => setSelectedTaskId(task.id)} onDragStart={(event) => event.dataTransfer.setData("text/task-id", task.id)}>{task.title}{task.note ? ` · 메모` : ""}{task.exercise ? ` · 운동` : ""}</button><button aria-label={`${task.title} ${task.completed_at ? "완료 취소" : "완료"}`} onClick={() => toggleTask(task)} type="button">{task.completed_at ? "↩" : "✓"}</button></div>)}</div></div>;
    })}</div></section>
  </section>;
}
