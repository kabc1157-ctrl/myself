"use client";

import { useEffect, useMemo, useState } from "react";

type Todo = { id: string; last_edited_time?: string; properties: Record<string, any> };
type Source = { id: string; title?: Array<{ plain_text?: string }>; properties?: Record<string, { id?: string; type?: string; name?: string }> };

function plainValue(property: any) {
  if (property?.title) return property.title.map((item: any) => item.plain_text ?? "").join("");
  if (property?.rich_text) return property.rich_text.map((item: any) => item.plain_text ?? "").join("");
  if (property?.checkbox !== undefined) return property.checkbox ? "완료" : "";
  return property?.date?.start ?? "";
}

export function NotionTodoPanel({ enabled, date }: { enabled: boolean; date: string }) {
  const [open, setOpen] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");

  const load = async () => {
    const [todoResponse, configResponse] = await Promise.all([fetch("/api/integrations/notion/todos"), fetch("/api/integrations/notion/config")]);
    const todoBody = await todoResponse.json();
    const configBody = await configResponse.json();
    setTodos(todoBody.todos ?? []); setConfig(configBody.config ?? null);
  };
  useEffect(() => { if (enabled) void load(); }, [enabled]);
  const properties = useMemo(() => Object.entries(selectedSource?.properties ?? {}) as Array<[string, any]>, [selectedSource]);
  if (!enabled) return null;
  return <details className="planner-board-panel notion-todo-panel" open={open} onToggle={(event) => setOpen((event.currentTarget as HTMLDetailsElement).open)}>
    <summary><h2>Notion To-do</h2><span aria-hidden="true">+</span></summary>
    <div className="notion-todo-toolbar"><p>{config ? "연결된 To-do를 불러왔어요." : "Notion 데이터베이스를 선택해 주세요."}</p><button onClick={() => void load()} type="button">갱신하기</button></div>
    {!config ? <button className="secondary-button" onClick={async () => { const response = await fetch("/api/integrations/notion/data-sources"); const body = await response.json(); setSources(body.results ?? []); }} type="button">데이터베이스 불러오기</button> : null}
    {sources.length ? <div className="notion-source-picker">{sources.map((source) => <button key={source.id} onClick={async () => { const response = await fetch(`/api/integrations/notion/data-sources?id=${source.id}`); const body = await response.json(); setSelectedSource({ ...source, ...body.dataSource }); }} type="button">{source.title?.map((item) => item.plain_text).join("") || source.id}</button>)}</div> : null}
    {selectedSource ? <div className="notion-mapping-form"><strong>속성 매핑</strong>{(["titlePropertyId", "datePropertyId", "completedPropertyId", "startTimePropertyId", "endTimePropertyId"] as const).map((field) => <label key={field}>{field.replace("PropertyId", "")}<select value={mapping[field] ?? ""} onChange={(event) => setMapping((current) => ({ ...current, [field]: event.target.value }))}><option value="">사용하지 않음</option>{properties.map(([id, property]) => <option key={id} value={property.id ?? id}>{property.name ?? id} ({property.type})</option>)}</select></label>)}<button onClick={async () => { const response = await fetch("/api/integrations/notion/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ databaseId: selectedSource.id, dataSourceId: selectedSource.id, ...mapping }) }); setNotice(response.ok ? "Notion 설정을 저장했어요." : "설정을 저장하지 못했어요."); if (response.ok) await load(); }} type="button">매핑 저장</button></div> : null}
    {notice ? <p className="form-message" role="status">{notice}</p> : null}
    {config ? <div className="notion-todo-list">{todos.length ? todos.map((todo) => <article key={todo.id}><strong>{plainValue(todo.properties[config.title_property_id]) || "제목 없음"}</strong><span><button onClick={async () => { const propertyId = config.completed_property_id; if (!propertyId) return; const current = todo.properties[propertyId]?.checkbox === true; await fetch("/api/integrations/notion/todos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pageId: todo.id, properties: { [propertyId]: { checkbox: !current } } }) }); await load(); }} type="button">{config.completed_property_id && todo.properties[config.completed_property_id]?.checkbox ? "✓" : "완료"}</button><button onClick={async () => { const title = plainValue(todo.properties[config.title_property_id]) || "Notion To-do"; const response = await fetch("/api/integrations/notion/todos/planner", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pageId: todo.id, title, plannedDate: date }) }); setNotice(response.ok ? "하루 시간표에 추가했어요." : "하루 시간표 추가에 실패했어요."); }} type="button">시간표 추가</button></span></article>) : <p>오늘 표시할 Notion To-do가 없어요.</p>}</div> : null}
  </details>;
}
