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
function memoValue(property: any) { return property?.rich_text?.map((item: any) => item.plain_text ?? "").join("") || "-"; }
function propertyFor(todo: Todo, configuredId: string | null | undefined, type: "title" | "date" | "rich_text" | "checkbox") {
  if (configuredId && todo.properties[configuredId]) return todo.properties[configuredId];
  const match = Object.values(todo.properties).find((property: any) => property?.[type] !== undefined);
  return match;
}
function propertyKeyFor(todo: Todo, configuredId: string | null | undefined, type: "title" | "date" | "rich_text" | "checkbox") {
  if (configuredId && todo.properties[configuredId]) return configuredId;
  return Object.entries(todo.properties).find(([, property]: [string, any]) => property?.[type] !== undefined)?.[0];
}

export function NotionTodoPanel({ enabled, date }: { enabled: boolean; date: string }) {
  const [open, setOpen] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [notice, setNotice] = useState("");

  const load = async () => {
    const [todoResponse, configResponse] = await Promise.all([fetch(`/api/integrations/notion/todos?date=${encodeURIComponent(date)}`), fetch("/api/integrations/notion/config")]);
    const todoBody = await todoResponse.json();
    const configBody = await configResponse.json();
    setTodos(todoBody.todos ?? []); setConfig(configBody.config ?? null);
  };
  useEffect(() => { if (enabled) void load(); }, [enabled]);
  if (!enabled) return null;
  return <details className="planner-board-panel notion-todo-panel" open={open} onToggle={(event) => setOpen((event.currentTarget as HTMLDetailsElement).open)}>
    <summary><h2>Notion To-do</h2><span aria-hidden="true">+</span></summary>
    <div className="notion-todo-toolbar"><p>{config ? "연결된 To-do를 불러왔어요." : "Notion 데이터베이스를 선택해 주세요."}</p><button className="notion-refresh-button" onClick={() => void load()} type="button">갱신하기</button></div>
    {!config ? <p className="notion-todo-empty">마이페이지의 Notion 연동에서 To-do 데이터베이스를 선택해 주세요.</p> : null}
    {notice ? <p className="form-message" role="status">{notice}</p> : null}
    {config ? <div className="notion-todo-list">{todos.length ? todos.map((todo) => { const titleProperty = propertyFor(todo, config.title_property_id, "title"); const dateProperty = propertyFor(todo, config.date_property_id, "date"); const memoProperty = propertyFor(todo, config.memo_property_id, "rich_text"); const completedProperty = propertyFor(todo, config.completed_property_id, "checkbox"); const completedPropertyId = propertyKeyFor(todo, config.completed_property_id, "checkbox"); return <article key={todo.id}><div className="notion-todo-content"><strong>{plainValue(titleProperty) || "제목 없음"}</strong><small>{dateValue(dateProperty)}</small><p>{memoValue(memoProperty)}</p></div><span><button onClick={async () => { if (!completedPropertyId) return; const current = completedProperty?.checkbox === true; await fetch("/api/integrations/notion/todos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pageId: todo.id, properties: { [completedPropertyId]: { checkbox: !current } } }) }); await load(); }} type="button">{completedProperty?.checkbox ? "✓" : "완료"}</button><button onClick={async () => { const title = plainValue(titleProperty) || "Notion To-do"; const response = await fetch("/api/integrations/notion/todos/planner", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pageId: todo.id, title, plannedDate: date }) }); setNotice(response.ok ? "하루 시간표에 추가했어요." : "하루 시간표 추가에 실패했어요."); }} type="button">시간표 추가</button></span></article>; }) : <p>오늘 표시할 Notion To-do가 없어요.</p>}</div> : null}
  </details>;
}
