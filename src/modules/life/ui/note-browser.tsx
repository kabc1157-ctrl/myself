"use client";

import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";
import type { Json } from "@/core/db/database.types";
import { AiInsight } from "@/core/ui/ai-insight";
import { AiMemoButton } from "@/core/ai/ai-memo-button";
import { SavedAiNoteEditor } from "@/modules/life/ui/saved-ai-note-editor";
import { deleteNoteAction, saveNoteAction, toggleNoteChecklistAction } from "@/modules/life/application/actions";

type Topic = { id: string; name: string };
type Note = { id: string; topic_id: string | null; title: string; remark: string | null; content: string; checklist: Json; ai_feedback: Json | null; ai_highlights: Json; personal_memo: string | null; source_kind: string; source_title: string | null; source_url: string | null; show_on_home?: boolean; topic: Topic | null };

function InlineNoteEditor({ note, topics }: { note: Note; topics: Topic[] }) {
  const [pending, startTransition] = useTransition(); const [error, setError] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; setError(""); startTransition(async () => { try { await saveNoteAction(new FormData(form)); const details = form.closest("details"); if (details) details.open = false; } catch (caught) { setError(caught instanceof Error ? caught.message : "저장하지 못했어요."); } }); };
  return <details className="inline-edit"><summary className="archive-button">수정</summary><form className="feature-form" onSubmit={submit}><input name="id" type="hidden" value={note.id}/><label>제목<input defaultValue={note.title} maxLength={120} name="title" required /></label><label>주제<select defaultValue={note.topic_id ?? ""} name="topicId"><option value="">주제 없음</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select></label><label>비고<input defaultValue={note.remark ?? ""} maxLength={500} name="remark" /></label><label>내용<textarea defaultValue={note.content} name="content" required rows={6} /></label><label className="checkbox-line"><input defaultChecked={note.show_on_home} name="showOnHome" type="checkbox" /> 홈 화면에 표시</label>{error ? <p className="form-error" role="alert">{error}</p> : null}<button className="secondary-button" disabled={pending} type="submit">{pending ? "저장 중…" : "수정 저장"}</button></form></details>;
}

export function NoteBrowser({ notes, topics }: { notes: Note[]; topics: Topic[] }) {
  const [topicId, setTopicId] = useState("");
  const visible = topicId ? notes.filter((note) => note.topic_id === topicId) : notes;
  return <>
    <div className="home-section-heading"><h2>주제별 메모</h2><span>{visible.length}개</span></div>
    <div className="topic-filter-list" role="tablist" aria-label="메모 주제">
      <button aria-selected={!topicId} className={!topicId ? "active" : ""} onClick={() => setTopicId("")} role="tab" type="button">전체 {notes.length}</button>
      {topics.map((topic) => <button aria-selected={topicId === topic.id} className={topicId === topic.id ? "active" : ""} key={topic.id} onClick={() => setTopicId(topic.id)} role="tab" type="button">{topic.name} {notes.filter((note) => note.topic_id === topic.id).length}</button>)}
    </div>
    <div className="feature-list">{visible.map((note) => <details className="note-browser-card" key={note.id}><summary><div><small>{note.source_kind !== "note" ? `AI 인사이트 · ${note.source_kind}` : note.topic?.name ?? "주제 없음"}</small><h3>{note.title}</h3><p>{note.remark}</p></div><span>보기</span></summary>{note.source_kind !== "note" ? <SavedAiNoteEditor content={note.content} highlights={note.ai_highlights} id={note.id} personalMemo={note.personal_memo} sourceKind={note.source_kind} sourceTitle={note.source_title} sourceUrl={note.source_url} title={note.title} /> : <><div className="note-content">{note.content}</div>{Array.isArray(note.checklist) && note.checklist.length > 0 ? <div className="note-checklist"><h4>체크리스트</h4>{(note.checklist as Array<{ text: string; done: boolean }>).map((item, index) => <form action={toggleNoteChecklistAction} key={`${note.id}-${index}`}><input name="id" type="hidden" value={note.id}/><input name="index" type="hidden" value={index}/><button className={item.done ? "checklist-toggle done" : "checklist-toggle"} type="submit" aria-label={`${item.text} ${item.done ? "완료 취소" : "완료"}`}>{item.done ? "✓" : ""}</button><span className={item.done ? "completed" : ""}>{item.text}</span></form>)}</div> : null}<div className="mini-insight"><strong>AI 인사이트</strong><AiInsight value={note.ai_feedback} pendingMessage="AI 인사이트가 준비되면 이곳에 표시돼요." />{note.ai_feedback ? <AiMemoButton source="note" sourceId={note.id} sourceUrl={`/notes?edit=${note.id}`} /> : null}</div></>}<div className="inline-actions"><InlineNoteEditor note={note} topics={topics}/><form action={deleteNoteAction}><input name="id" type="hidden" value={note.id}/><button className="text-button danger">삭제</button></form></div></details>)}</div>
  </>;
}
