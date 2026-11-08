"use client";

import { useEffect, useState } from "react";
import styles from "./reading-book-reflection.module.css";

type Reflection = { reflection_text: string | null; source_record_count: number; generation_status: "generating" | "complete" | "failed"; error_message: string | null };

export function ReadingBookReflection({ bookId, sourceRecordCount }: { bookId: string; sourceRecordCount: number }) {
  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  async function load() { const response = await fetch(`/api/reading/books/${bookId}/reflection`, { cache: "no-store" }); if (response.ok) { const payload = await response.json(); setReflection(payload.reflection); setText(payload.reflection?.reflection_text ?? ""); } }
  useEffect(() => { void load(); }, [bookId]);
  useEffect(() => { if (!reflection || reflection.generation_status !== "generating") return; const timer = window.setInterval(() => void load(), 5000); return () => window.clearInterval(timer); }, [reflection?.generation_status, bookId]);
  async function save() { setBusy(true); const response = await fetch(`/api/reading/books/${bookId}/reflection`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ reflectionText: text }) }); if (response.ok) { const payload = await response.json(); setReflection(payload.reflection); setEditing(false); } setBusy(false); }
  async function retry() { setBusy(true); await fetch(`/api/reading/books/${bookId}/reflection`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ retry: true }) }); await load(); setBusy(false); }
  return <section className={styles.card} aria-live="polite"><p className={styles.kicker}>나의 독서 회고</p><h2>책을 덮으며</h2>{!reflection ? <p className="muted-copy">독서 기록을 남기면 나만의 회고를 만들 수 있어요.</p> : reflection.generation_status === "generating" ? <p>독서 기록을 돌아보고 있어요.</p> : reflection.generation_status === "failed" ? <><p>회고를 만들지 못했어요.</p><button className="text-button" disabled={busy} onClick={retry} type="button">다시 시도</button></> : editing ? <><textarea className={styles.textarea} aria-label="독서 회고" onChange={(event) => setText(event.target.value)} value={text}/><div className={styles.actions}><button className="text-button" disabled={busy} onClick={save} type="button">저장</button><button className="text-button" onClick={() => setEditing(false)} type="button">취소</button></div></> : <><p className={styles.text}>{reflection.reflection_text}</p><p className={styles.count}>독서 기록 {reflection.source_record_count || sourceRecordCount}개를 바탕으로 작성했어요.</p><button className="text-button" onClick={() => setEditing(true)} type="button">회고 수정</button></>}</section>;
}
