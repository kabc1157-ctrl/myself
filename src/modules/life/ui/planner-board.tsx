"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const priorities = [1, 2, 3].map((priority) => tasks.find((task) => task.priority === priority) ?? null);
  const schedule = (taskId: string, startTime: string) => startTransition(async () => {
    const data = new FormData(); data.set("id", taskId); data.set("date", date); data.set("startTime", startTime);
    await schedulePlannerTaskAction(data); setSelectedTaskId(null); router.refresh();
  });
  return <section className={pending ? "planner-board is-pending" : "planner-board"}>
    <div className="planner-board-left">
      <section className="planner-board-panel"><h2>우선순위 3</h2><div className="planner-priority-list">{priorities.map((task, index) => <div className="planner-priority-slot" key={index}><b>{index + 1}</b>{task ? <button draggable onClick={() => setSelectedTaskId(task.id)} onDragStart={(event) => event.dataTransfer.setData("text/task-id", task.id)} type="button">{task.title}</button> : <span>우선순위를 선택하세요</span>}</div>)}</div></section>
      <section className="planner-board-panel"><h2>오늘의 캘린더 일정</h2><div className="planner-source-list">{events.length ? events.map((event) => <div className="planner-source-card calendar" key={event.id}><span>{event.startLabel}</span><strong>{event.title}</strong></div>) : <p>오늘 연결된 Google 일정이 없어요.</p>}</div></section>
      <section className="planner-board-panel"><h2>브레인 덤프</h2><form action={savePlannerTaskAction} className="brain-dump-form"><input name="title" placeholder="머릿속 할 일을 바로 적어보세요" required/><button>추가</button><details><summary>메모·운동 기록 연결</summary><div><label>메모<select name="noteId"><option value="">연결 안 함</option>{notes.map((note) => <option key={note.id} value={note.id}>{note.title}</option>)}</select></label><label>운동 기록<select name="exerciseId"><option value="">연결 안 함</option>{exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.exercise_date} · {exercise.activity}</option>)}</select></label></div></details></form><details className="planner-backlog"><summary>남은 브레인 덤프 <b>{backlog.length}</b></summary><div className="planner-source-list">{backlog.map((task) => <article className={selectedTaskId === task.id ? "planner-source-card selected" : "planner-source-card"} draggable key={task.id} onClick={() => setSelectedTaskId(task.id)} onDragStart={(event) => event.dataTransfer.setData("text/task-id", task.id)}><strong>{task.title}</strong>{task.note ? <small>메모 · {task.note.title}</small> : null}{task.exercise ? <small>운동 · {task.exercise.activity}</small> : null}<div>{[1,2,3].map((priority)=><form action={setPlannerPriorityAction} key={priority}><input name="id" type="hidden" value={task.id}/><input name="date" type="hidden" value={date}/><input name="priority" type="hidden" value={priority}/><button aria-label={`${priority}순위로 지정`}>{priority}</button></form>)}<form action={deletePlannerTaskAction}><input name="id" type="hidden" value={task.id}/><button aria-label={`${task.title} 삭제`}>×</button></form></div></article>)}</div></details></section>
    </div>
    <section className="planner-timeline-panel"><div className="planner-timeline-heading"><h2>하루 시간표</h2><span>블록을 끌거나 선택한 뒤 시간대를 누르세요.</span></div><div className="planner-timeline">{slots.map((slot) => {
      const tasksAtTime = tasks.filter((item) => item.start_time?.slice(0,5) === slot);
      const calendarEvents = events.filter((event) => timeFromIso(event.startTime) === slot);
      return <div className="planner-time-row" key={slot} onClick={() => selectedTaskId && schedule(selectedTaskId, slot)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData("text/task-id"); if (id) schedule(id, slot); }}><time>{slot}</time><div>{calendarEvents.map((event)=><span className="planner-time-block google" key={event.id}>{event.title}</span>)}{tasksAtTime.map((task) => <div className="planner-time-task" key={task.id}><button className={task.completed_at ? "planner-time-block task completed" : "planner-time-block task"} draggable onClick={(event) => { event.stopPropagation(); setSelectedTaskId(task.id); }} onDragStart={(event) => event.dataTransfer.setData("text/task-id", task.id)}>{task.title}{task.note ? ` · 메모` : ""}{task.exercise ? ` · 운동` : ""}</button><form action={togglePlannerTaskAction}><input name="id" type="hidden" value={task.id}/><input name="completed" type="hidden" value={String(Boolean(task.completed_at))}/><button aria-label={`${task.title} ${task.completed_at ? "완료 취소" : "완료"}`}>{task.completed_at ? "↩" : "✓"}</button></form></div>)}</div></div>;
    })}</div></section>
  </section>;
}
