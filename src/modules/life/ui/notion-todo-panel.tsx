"use client";

import { useEffect, useState } from "react";

type Todo = { id: string; last_edited_time?: string; properties: Record<string, any> };

function plainValue(property: any) {
  if (property?.title) return property.title.map((item: any) => item.plain_text ?? "").join("");
  if (property?.rich_text) return property.rich_text.map((item: any) => item.plain_text ?? "").join("");
  if (property?.checkbox !== undefined) return property.checkbox ? "완료" : "";
  return property?.date?.start ?? "";
}

function dateValue(property: any) { return property?.date?.start?.slice(0, 10) ?? "-"; }
function memoValue(property: any) {
  if (property?.rich_text) return property.rich_text.map((item: any) => item.plain_text ?? "").join("") || "-";
  if (property?.multi_select) return property.multi_select.map((item: any) => item.name ?? "").join(", ") || "-";
  if (property?.select) return property.select.name ?? "-";
  if (property?.url) return property.url || "-";
  if (property?.number !== undefined) return String(property.number);
  return "-";
}
function propertyFor(todo: Todo, configuredId: string | null | undefined, type: "title" | "date" | "rich_text" | "checkbox") {
  if (configuredId && todo.properties[configuredId]) return todo.properties[configuredId];
  const match = Object.values(todo.properties).find((property: any) => property?.[type] !== undefined);
  return match;
}
function propertyKeyFor(todo: Todo, configuredId: string | null | undefined, type: "title" | "date" | "rich_text" | "checkbox") {
  if (configuredId && todo.properties[configuredId]) return configuredId;
  return Object.entries(todo.properties).find(([, property]: [string, any]) => property?.[type] !== undefined)?.[0];
}

export function NotionTodoPanel({ enabled, date, onAdded }: { enabled: boolean; date: string; onAdded?: () => void }) {
  const [open, setOpen] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [notice, setNotice] = useState("");
  const [drafts, setDrafts] = useState<Record<string, { startTime: string; endTime: string; priority: number | null }>>({});

  const load = async () => {
    const [todoResponse, configResponse] = await Promise.all([fetch(`/api/integrations/notion/todos?date=${encodeURIComponent(date)}`), fetch("/api/integrations/notion/config")]);
    const todoBody = await todoResponse.json();
    const configBody = await configResponse.json();
    setTodos(todoBody.todos ?? []); setConfig(configBody.config ?? null);
  };
  useEffect(() => { if (enabled) void load(); }, [enabled, date]);
  if (!enabled) return null;
  return <details className="planner-board-panel notion-todo-panel" open={open} onToggle={(event) => setOpen((event.currentTarget as HTMLDetailsElement).open)}>
    <summary><h2>Notion To-do</h2><span aria-hidden="true">+</span></summary>
    <div className="notion-todo-toolbar"><p>{config ? "연결된 To-do를 불러왔어요." : "Notion 데이터베이스를 선택해 주세요."}</p><button className="notion-refresh-button" onClick={() => void load()} type="button">갱신하기</button></div>
    {!config ? <p className="notion-todo-empty">마이페이지의 Notion 연동에서 To-do 데이터베이스를 선택해 주세요.</p> : null}
    {notice ? <p className="form-message" role="status">{notice}</p> : null}
    {config ? <div className="notion-todo-list">{todos.length ? todos.map((todo) => {
      const titleProperty = propertyFor(todo, config.title_property_id, "title");
      const dateProperty = propertyFor(todo, config.date_property_id, "date");
      const memoProperty = config.memo_property_id && todo.properties[config.memo_property_id] ? todo.properties[config.memo_property_id] : propertyFor(todo, config.memo_property_id, "rich_text");
      const completedProperty = propertyFor(todo, config.completed_property_id, "checkbox");
      const completedPropertyId = propertyKeyFor(todo, config.completed_property_id, "checkbox");
      const draft = drafts[todo.id] ?? { startTime: "09:00", endTime: "09:30", priority: null };
      const updateDraft = (next: Partial<typeof draft>) => setDrafts((current) => ({ ...current, [todo.id]: { ...draft, ...next } }));
      const addToPlanner = async () => {
        const title = plainValue(titleProperty) || "Notion To-do";
        const response = await fetch("/api/integrations/notion/todos/planner", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pageId: todo.id, title, plannedDate: date, startTime: draft.startTime, endTime: draft.endTime, priority: draft.priority }) });
        const body = await response.json().catch(() => ({}));
        setNotice(response.ok ? "하루 시간표에 추가했어요." : body.error ?? "하루 시간표 추가에 실패했어요.");
        if (response.ok) onAdded?.();
      };
      return <article key={todo.id}>
        <div className="notion-todo-content"><strong>{plainValue(titleProperty) || "제목 없음"}</strong><small>{dateValue(dateProperty)}</small><p>{memoValue(memoProperty)}</p></div>
        <div className="notion-todo-actions">
          <button onClick={async () => { if (!completedPropertyId) return; const current = completedProperty?.checkbox === true; const response = await fetch("/api/integrations/notion/todos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pageId: todo.id, properties: { [completedPropertyId]: { checkbox: !current } } }) }); if (!response.ok) setNotice("완료 상태를 저장하지 못했어요."); else await load(); }} type="button">완료</button>
          <button onClick={() => void addToPlanner()} type="button">시간표 추가</button>
          {[1, 2, 3].map((priority) => <button aria-label={`${priority}순위로 추가`} className={draft.priority === priority ? "selected" : ""} key={priority} onClick={() => updateDraft({ priority })} type="button">{priority}</button>)}
        </div>
        <div className="notion-todo-schedule-fields"><label>시작 <input onChange={(event) => updateDraft({ startTime: event.target.value })} type="time" value={draft.startTime} /></label><label>종료 <input onChange={(event) => updateDraft({ endTime: event.target.value })} type="time" value={draft.endTime} /></label></div>
      </article>;
    }) : <p>오늘 표시할 Notion To-do가 없어요.</p>}</div> : null}
  </details>;
}
