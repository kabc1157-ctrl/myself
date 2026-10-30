"use client";

import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { saveGoogleCalendarEventAction } from "@/core/integrations/google-calendar/actions";
import { PersistentDetails } from "@/core/ui/persistent-details";
import { deletePlannerTaskAction, movePlannerTaskToBacklogAction, savePlannerTaskAction, schedulePlannerTaskAction, setPlannerPriorityAction, togglePlannerTaskAction, updatePlannerTaskAction } from "@/modules/life/application/actions";
import { PlannerEventPriorityButtons } from "@/modules/life/ui/planner-event-priority-buttons";

type Task = { id: string; title: string; priority: number | null; start_time: string | null; end_time: string | null; completed_at: string | null; note: { id: string; title: string } | null; exercise: { id: string; activity: string; focus_area: string | null } | null };
type CalendarEvent = { id: string; title: string; allDay: boolean; startTime: string | null; endTime: string | null; startLabel: string };
type NoteOption = { id: string; title: string };
type ExerciseOption = { id: string; exercise_date: string; activity: string };

const toMinutes = (value: string) => { const [hour, minute] = value.slice(0, 5).split(":").map(Number); return hour * 60 + minute; };
const fromMinutes = (value: number) => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
const addMinutes = (value: string, amount: number) => fromMinutes(Math.min(23 * 60 + 59, Math.max(0, toMinutes(value) + amount)));
const floorToHalfHour = (value: string) => fromMinutes(Math.floor(toMinutes(value) / 30) * 30);
const halfHourOffset = (value: string) => (toMinutes(value) % 30) / 30;

function timeFromIso(value: string | null, timeZone: string) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone }).format(new Date(value));
}

function durationInMinutes(start: string | null, end: string | null, fallback = 30) {
  if (!start || !end) return fallback;
  if (start.includes("T") && end.includes("T")) return Math.max(30, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000));
  return Math.max(30, toMinutes(end) - toMinutes(start));
}

export function PlannerBoard({ date, tasks, backlog, events, dayStart, dayEnd, timeZone }: { date: string; tasks: Task[]; backlog: Task[]; events: CalendarEvent[]; notes?: NoteOption[]; exercises?: ExerciseOption[]; dayStart: string; dayEnd: string; timeZone: string }) {
  const router = useRouter();
  const [localTasks, setLocalTasks] = useState(tasks);
  const [localBacklog, setLocalBacklog] = useState(backlog);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const slots = useMemo(() => {
    const start = toMinutes(dayStart);
    const end = toMinutes(dayEnd);
    return Array.from({ length: Math.max(1, Math.ceil((end - start) / 30)) }, (_, index) => fromMinutes(start + index * 30));
  }, [dayEnd, dayStart]);
  const priorities = [1, 2, 3].map((priority) => localTasks.find((task) => task.priority === priority) ?? null);
  const selectedTask = [...localBacklog, ...localTasks].find((task) => task.id === selectedTaskId) ?? null;
  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null;
  const calendarTitles = new Set(events.map((event) => event.title));

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

  const schedule = (taskId: string, startTime: string, endTime?: string) => {
    const source = [...localBacklog, ...localTasks].find((task) => task.id === taskId);
    if (!source) return;
    const nextEnd = endTime ?? addMinutes(startTime, durationInMinutes(source.start_time, source.end_time));
    setLocalBacklog((current) => current.filter((task) => task.id !== taskId));
    setLocalTasks((current) => [...current.filter((task) => task.id !== taskId), { ...source, start_time: startTime, end_time: nextEnd }]);
    setSelectedTaskId(taskId);
    runAction(async () => { const data = new FormData(); data.set("id", taskId); data.set("date", date); data.set("startTime", startTime); data.set("endTime", nextEnd); await schedulePlannerTaskAction(data); });
  };

  const moveCalendarEvent = (eventId: string, startTime: string, requestedDuration?: number) => {
    const source = events.find((event) => event.id === eventId);
    if (!source || source.allDay) return;
    const endTime = addMinutes(startTime, requestedDuration ?? durationInMinutes(source.startTime, source.endTime));
    setSelectedEventId(eventId);
    setSelectedTaskId(null);
    runAction(async () => { const data = new FormData(); data.set("eventId", source.id); data.set("title", source.title); data.set("date", date); data.set("startTime", startTime); data.set("endTime", endTime); await saveGoogleCalendarEventAction(data); });
  };

  const setPriority = (taskId: string, priority: number) => {
    const source = [...localBacklog, ...localTasks].find((task) => task.id === taskId);
    if (!source) return;
    setLocalBacklog((current) => current.filter((task) => task.id !== taskId));
    setLocalTasks((current) => [...current.filter((task) => task.id !== taskId).map((task) => task.priority === priority ? { ...task, priority: null } : task), { ...source, priority }]);
    setSelectedTaskId(taskId);
    setSelectedEventId(null);
    runAction(async () => { const data = new FormData(); data.set("id", taskId); data.set("date", date); data.set("priority", String(priority)); await setPlannerPriorityAction(data); });
  };

  const moveToBacklog = (taskId: string) => {
    const source = localTasks.find((task) => task.id === taskId);
    if (!source) return;
    const reset = { ...source, priority: null, start_time: null, end_time: null };
    setLocalTasks((current) => current.filter((task) => task.id !== taskId));
    if (!calendarTitles.has(source.title)) setLocalBacklog((current) => [...current.filter((task) => task.id !== taskId), reset]);
    setSelectedTaskId(taskId);
    runAction(async () => { const data = new FormData(); data.set("id", taskId); await movePlannerTaskToBacklogAction(data); });
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
      <PersistentDetails className="planner-board-panel planner-collapsible-panel" defaultOpen storageKey={`planner-priorities-${date}`}><summary><h2>우선순위 3</h2><span aria-hidden="true">+</span></summary><div className="planner-priority-list">{priorities.map((task, index) => <div className="planner-priority-slot" key={index}><b>{index + 1}</b>{task ? <div className="planner-priority-task"><button className={selectedTaskId === task.id ? "selected" : ""} draggable onClick={() => { setSelectedTaskId(task.id); setSelectedEventId(null); }} onDragStart={(event) => event.dataTransfer.setData("text/task-id", task.id)} type="button">{task.title}</button><button aria-label={`${task.title} 브레인 덤프로 이동`} className="planner-return-button" onClick={() => moveToBacklog(task.id)} type="button">되돌리기</button></div> : <button disabled={!selectedTaskId} onClick={() => selectedTaskId && setPriority(selectedTaskId, index + 1)} type="button">{selectedTaskId ? `${index + 1}순위로 지정` : "블록을 먼저 선택하세요"}</button>}</div>)}</div></PersistentDetails>
      <PersistentDetails className="planner-board-panel planner-collapsible-panel" defaultOpen storageKey={`planner-calendar-${date}`}><summary><h2>오늘의 캘린더 일정</h2><span aria-hidden="true">+</span></summary><div className="planner-calendar-refresh-row"><small>하루에 한 번 자동 갱신돼요. 변경 내용을 바로 가져오려면 갱신하기를 눌러주세요.</small><button onClick={() => startTransition(() => router.refresh())} type="button">갱신하기</button></div><div className="planner-source-list">{events.length ? events.map((event) => <div className={selectedEventId === event.id ? "planner-source-card calendar selected" : "planner-source-card calendar"} draggable={!event.allDay} key={event.id} onClick={() => { setSelectedEventId(event.id); setSelectedTaskId(null); }} onDragStart={(dragEvent) => dragEvent.dataTransfer.setData("text/calendar-event-id", event.id)}><span>{event.startLabel}</span><strong>{event.title}</strong><PlannerEventPriorityButtons date={date} title={event.title}/>{!event.allDay ? <small>시간표로 끌어 이동</small> : null}</div>) : <p>오늘 연결된 Google 일정이 없어요.</p>}</div></PersistentDetails>
      <PersistentDetails className="planner-board-panel planner-collapsible-panel" defaultOpen storageKey={`planner-brain-dump-${date}`}><summary><h2>브레인 덤프</h2><span aria-hidden="true">+</span></summary><form action={savePlannerTaskAction} className="brain-dump-form"><input name="title" placeholder="머릿속 할 일을 바로 적어보세요" required/><button>추가</button></form><details className="planner-backlog" open><summary>남은 브레인 덤프 <b>{localBacklog.length}</b></summary><div className="planner-source-list">{localBacklog.map((task) => <article className={selectedTaskId === task.id ? "planner-source-card selected" : "planner-source-card"} draggable key={task.id} onClick={() => { setSelectedTaskId(task.id); setSelectedEventId(null); }} onDragStart={(event) => event.dataTransfer.setData("text/task-id", task.id)}><form action={updatePlannerTaskAction} className="planner-task-edit-form" onClick={(event) => event.stopPropagation()}><input name="id" type="hidden" value={task.id}/><input defaultValue={task.title} name="title" required/><button>수정</button></form><div>{[1,2,3].map((priority)=><button aria-label={`${task.title} ${priority}순위로 지정`} key={priority} onClick={(event) => { event.stopPropagation(); setPriority(task.id, priority); }} type="button">{priority}</button>)}<button aria-label={`${task.title} 삭제`} onClick={(event) => { event.stopPropagation(); removeTask(task.id); }} type="button">×</button></div></article>)}</div></details></PersistentDetails>
    </div>
    <section className="planner-timeline-panel"><div className="planner-timeline-heading"><div><h2>하루 시간표</h2><span>블록을 끌거나 선택한 뒤 시간대를 누르세요.</span></div><button className="secondary-button" onClick={() => { const rows = Array.from(document.querySelectorAll<HTMLElement>(".planner-time-row")); const canvas = document.createElement("canvas"); canvas.width = 900; canvas.height = Math.max(320, rows.length * 42 + 80); const ctx = canvas.getContext("2d"); if (!ctx) return; ctx.fillStyle = "#fbf6ef"; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = "#59698f"; ctx.font = "bold 24px sans-serif"; ctx.fillText("이음새 · 하루 시간표", 32, 42); ctx.font = "18px sans-serif"; rows.forEach((row, index) => ctx.fillText(row.innerText.replace(/\s+/g, " ").trim(), 32, 82 + index * 34)); canvas.toBlob(async (blob) => { if (!blob) return; const file = new File([blob], `ieumsae-${date}.png`, { type: "image/png" }); if (navigator.share && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: "이음새 하루 시간표" }); else { const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = file.name; link.click(); URL.revokeObjectURL(link.href); } }, "image/png"); }} type="button">시간표 이미지 공유</button></div>{selectedTask ? <div className="planner-selection-banner"><strong>{selectedTask.title}</strong><span>배치할 시간의 ‘여기 배치’를 누르세요.</span>{selectedTask.start_time ? <label>길이<select defaultValue={durationInMinutes(selectedTask.start_time, selectedTask.end_time)} onChange={(event) => schedule(selectedTask.id, selectedTask.start_time!, addMinutes(selectedTask.start_time!, Number(event.target.value)))}><option value="30">30분</option><option value="60">1시간</option><option value="90">1시간 30분</option><option value="120">2시간</option><option value="180">3시간</option><option value="240">4시간</option></select></label> : null}<button onClick={() => setSelectedTaskId(null)} type="button">선택 해제</button></div> : selectedEvent ? <div className="planner-selection-banner"><strong>{selectedEvent.title}</strong><span>{selectedEvent.allDay ? "종일 일정은 Google Calendar에서 시간을 지정해 주세요." : "시간표의 다른 시간대로 이동할 수 있어요."}</span>{!selectedEvent.allDay ? <label>길이<select defaultValue={durationInMinutes(selectedEvent.startTime, selectedEvent.endTime)} onChange={(event) => moveCalendarEvent(selectedEvent.id, timeFromIso(selectedEvent.startTime, timeZone) ?? slots[0])}><option value="30">30분</option><option value="60">1시간</option><option value="90">1시간 30분</option><option value="120">2시간</option><option value="180">3시간</option></select></label> : null}<button onClick={() => setSelectedEventId(null)} type="button">선택 해제</button></div> : null}{error ? <p className="form-message error">{error}</p> : null}<div className="planner-timeline">{slots.map((slot) => {
      const tasksAtTime = localTasks.filter((item) => item.start_time?.slice(0,5) === slot);
      const calendarEvents = events.filter((event) => { const eventTime = timeFromIso(event.startTime, timeZone); return eventTime ? floorToHalfHour(eventTime) === slot : false; });
      return <div className={selectedTaskId || selectedEventId ? "planner-time-row ready" : "planner-time-row"} key={slot} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const taskId = event.dataTransfer.getData("text/task-id"); const calendarEventId = event.dataTransfer.getData("text/calendar-event-id"); if (taskId) schedule(taskId, slot); else if (calendarEventId) moveCalendarEvent(calendarEventId, slot); }}><time>{slot}</time><div>{selectedTaskId ? <button className="planner-time-drop-target" onClick={() => schedule(selectedTaskId, slot)} type="button">여기 배치</button> : selectedEventId && !selectedEvent?.allDay ? <button className="planner-time-drop-target" onClick={() => moveCalendarEvent(selectedEventId, slot)} type="button">여기로 이동</button> : null}{calendarEvents.map((event) => { const eventTime = timeFromIso(event.startTime, timeZone)!; return <button className="planner-time-block google" draggable key={event.id} onClick={() => { setSelectedEventId(event.id); setSelectedTaskId(null); }} onDragStart={(dragEvent) => dragEvent.dataTransfer.setData("text/calendar-event-id", event.id)} style={{ "--block-offset": halfHourOffset(eventTime), "--block-slots": durationInMinutes(event.startTime, event.endTime) / 30 } as CSSProperties}>{event.title}</button>; })}{tasksAtTime.map((task) => <div className="planner-time-task" key={task.id} style={{ "--block-slots": durationInMinutes(task.start_time, task.end_time) / 30 } as CSSProperties}><button className={task.completed_at ? "planner-time-block task completed" : "planner-time-block task"} draggable onClick={() => { setSelectedTaskId(task.id); setSelectedEventId(null); }} onDragStart={(event) => event.dataTransfer.setData("text/task-id", task.id)}>{task.title}{task.note ? ` · 메모` : ""}{task.exercise ? ` · 운동` : ""}</button><button aria-label={`${task.title} ${task.completed_at ? "완료 취소" : "완료"}`} onClick={() => toggleTask(task)} type="button">{task.completed_at ? "↩" : "✓"}</button></div>)}</div></div>;
    })}</div></section>
  </section>;
}
