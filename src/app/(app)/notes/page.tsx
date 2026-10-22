import Link from "next/link";
import { verifySession } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { deleteNoteAction, saveNoteAction } from "@/modules/life/application/actions";
import { getNotes, getNoteTopics } from "@/modules/life/infrastructure/repository";

type Props = { searchParams: Promise<{ topic?: string; edit?: string }> };

export default async function NotesPage({ searchParams }: Props) {
  const [session, supabase, query] = await Promise.all([verifySession(), createServerSupabaseClient(), searchParams]);
  const [notes, topics] = await Promise.all([getNotes(supabase, session.userId), getNoteTopics(supabase, session.userId)]);
  const visible = query.topic ? notes.filter((note) => note.topic_id === query.topic) : notes;
  const editing = notes.find((note) => note.id === query.edit);
  return <div className="feature-page">
    <section className="settings-card">
      <div className="card-heading"><span>필수 기록</span><h1>{editing ? "메모 수정" : "메모 쓰기"}</h1></div>
      <form action={saveNoteAction} className="feature-form">
        {editing ? <input name="id" type="hidden" value={editing.id} /> : null}
        <label>제목<input defaultValue={editing?.title} maxLength={120} name="title" required /></label>
        <label>주제<select defaultValue={editing?.topic_id ?? ""} name="topicId"><option value="">주제 없음</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select></label>
        <label>새 주제 추가<input maxLength={40} name="newTopic" placeholder="예: 강의, 아이디어" /></label>
        <label>비고<input defaultValue={editing?.remark ?? ""} maxLength={500} name="remark" /></label>
        <label>내용<textarea defaultValue={editing?.content} name="content" required rows={8} /></label>
        <label className="checkbox-line"><input defaultChecked={editing?.show_on_home} name="showOnHome" type="checkbox" /> 홈 화면에 표시</label>
        <button className="primary-button" type="submit">저장</button>
      </form>
    </section>
    <section className="settings-card">
      <div className="home-section-heading"><h2>주제별 메모</h2><span>{visible.length}개</span></div>
      <div className="topic-filter-list"><Link href="/notes">전체 {notes.length}</Link>{topics.map((topic) => <Link href={`/notes?topic=${topic.id}`} key={topic.id}>{topic.name} {notes.filter((note) => note.topic_id === topic.id).length}</Link>)}</div>
      <div className="feature-list">{visible.map((note) => <article key={note.id}><div><small>{note.topic?.name ?? "주제 없음"}</small><h3>{note.title}</h3><p>{note.remark}</p><div className="note-content">{note.content}</div></div><div className="inline-actions"><Link className="archive-button" href={`/notes?edit=${note.id}`}>수정</Link><form action={deleteNoteAction}><input name="id" type="hidden" value={note.id}/><button className="text-button danger">삭제</button></form></div></article>)}</div>
    </section>
  </div>;
}
