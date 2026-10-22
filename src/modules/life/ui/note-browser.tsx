"use client";

import Link from "next/link";
import { useState } from "react";
import type { Json } from "@/core/db/database.types";
import { AiInsight } from "@/core/ui/ai-insight";
import { deleteNoteAction } from "@/modules/life/application/actions";

type Topic = { id: string; name: string };
type Note = { id: string; topic_id: string | null; title: string; remark: string | null; content: string; ai_feedback: Json | null; topic: Topic | null };

export function NoteBrowser({ notes, topics }: { notes: Note[]; topics: Topic[] }) {
  const [topicId, setTopicId] = useState("");
  const visible = topicId ? notes.filter((note) => note.topic_id === topicId) : notes;
  return <>
    <div className="home-section-heading"><h2>주제별 메모</h2><span>{visible.length}개</span></div>
    <div className="topic-filter-list" role="tablist" aria-label="메모 주제">
      <button aria-selected={!topicId} className={!topicId ? "active" : ""} onClick={() => setTopicId("")} role="tab" type="button">전체 {notes.length}</button>
      {topics.map((topic) => <button aria-selected={topicId === topic.id} className={topicId === topic.id ? "active" : ""} key={topic.id} onClick={() => setTopicId(topic.id)} role="tab" type="button">{topic.name} {notes.filter((note) => note.topic_id === topic.id).length}</button>)}
    </div>
    <div className="feature-list">{visible.map((note) => <details className="note-browser-card" key={note.id}><summary><div><small>{note.topic?.name ?? "주제 없음"}</small><h3>{note.title}</h3><p>{note.remark}</p></div><span>보기</span></summary><div className="note-content">{note.content}</div><div className="mini-insight"><strong>n8n 메모 인사이트</strong><AiInsight value={note.ai_feedback} pendingMessage="n8n 분석이 완료되면 이곳에 메모 인사이트가 표시돼요." /></div><div className="inline-actions"><Link className="archive-button" href={`/notes?edit=${note.id}`} scroll={false}>수정</Link><form action={deleteNoteAction}><input name="id" type="hidden" value={note.id}/><button className="text-button danger">삭제</button></form></div></details>)}</div>
  </>;
}
