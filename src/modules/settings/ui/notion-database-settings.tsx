"use client";

import { useEffect, useMemo, useState } from "react";

type Source = { id: string; title?: Array<{ plain_text?: string }>; properties?: Record<string, { id?: string; type?: string; name?: string }> };

export function NotionDatabaseSettings({ connected }: { connected: boolean }) {
  const [sources, setSources] = useState<Source[]>([]);
  const [selected, setSelected] = useState<Source | null>(null);
  const [config, setConfig] = useState<any>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const properties = useMemo(() => Object.entries(selected?.properties ?? {}) as Array<[string, any]>, [selected]);
  useEffect(() => { if (connected) void fetch("/api/integrations/notion/config").then((response) => response.json()).then((body) => setConfig(body.config ?? null)); }, [connected]);
  if (!connected) return null;
  const loadSources = async () => { const response = await fetch("/api/integrations/notion/data-sources"); const body = await response.json(); if (!response.ok) return setMessage(body.error ?? "데이터베이스를 불러오지 못했어요."); setSources((body.results ?? []).filter((source: Source) => source.title?.map((item) => item.plain_text ?? "").join("").trim().toLowerCase() !== "untitled")); };
  const chooseSource = async (source: Source) => { const response = await fetch(`/api/integrations/notion/data-sources?id=${source.id}`); const body = await response.json(); if (!response.ok) return setMessage(body.error ?? "데이터베이스 정보를 불러오지 못했어요."); setSelected({ ...source, ...body.dataSource }); };
  const save = async () => { if (!selected || !mapping.titlePropertyId) return setMessage("제목 속성을 선택해 주세요."); const response = await fetch("/api/integrations/notion/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ databaseId: selected.id, dataSourceId: selected.id, ...mapping }) }); const body = await response.json(); setMessage(response.ok ? "Notion To-do 설정을 저장했어요." : body.error ?? "설정을 저장하지 못했어요."); if (response.ok) { setConfig(body.config); setSelected(null); } };
  return <div className="notion-database-settings"><strong>{config ? "연결된 To-do 데이터베이스" : "To-do 데이터베이스 선택"}</strong><ol><li>Notion에서 실제 To-do 데이터베이스를 엽니다.</li><li>데이터베이스 우측 상단의 <b>···</b>을 클릭합니다.</li><li><b>연결 추가</b> 또는 <b>Connections</b>를 선택합니다.</li><li>목록에서 이음새 Notion 연동 앱을 선택합니다.</li><li>다시 이음새에서 데이터베이스를 불러옵니다.</li></ol><button className="secondary-button" onClick={() => void loadSources()} type="button">데이터베이스 불러오기</button>{sources.map((source) => <button className="notion-database-option" key={source.id} onClick={() => void chooseSource(source)} type="button">{source.title?.map((item) => item.plain_text ?? "").join("") || "이름 없는 데이터베이스"}</button>)}{selected ? <div className="notion-mapping-form"><strong>속성 매핑</strong>{(["titlePropertyId", "datePropertyId", "completedPropertyId", "memoPropertyId"] as const).map((field) => <label key={field}>{field === "titlePropertyId" ? "타이틀" : field === "datePropertyId" ? "데이트" : field === "completedPropertyId" ? "완료" : "메모"}<select value={mapping[field] ?? ""} onChange={(event) => setMapping((current) => ({ ...current, [field]: event.target.value }))}><option value="">사용하지 않음</option>{properties.map(([id, property]) => <option key={id} value={property.id ?? id}>{property.name ?? id} ({property.type})</option>)}</select></label>)}<button className="secondary-button" onClick={() => void save()} type="button">매핑 저장</button></div> : null}{message ? <p className="form-message" role="status">{message}</p> : null}</div>;
}
