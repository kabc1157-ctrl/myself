import { verifySession } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { createStandaloneChecklistAction, deleteNoteChecklistItemAction, saveNoteAction, toggleNoteChecklistAction, updateNoteChecklistItemAction } from "@/modules/life/application/actions";
import { getNotes, getNoteTopics } from "@/modules/life/infrastructure/repository";
import { NoteBrowser } from "@/modules/life/ui/note-browser";
import { PersistentDetails } from "@/core/ui/persistent-details";

type Props = { searchParams: Promise<{ topic?: string; edit?: string; checklist?: string; memo?: string }> };

export default async function NotesPage({ searchParams }: Props) {
  const [session, supabase, query] = await Promise.all([verifySession(), createServerSupabaseClient(), searchParams]);
  const [notes, topics] = await Promise.all([getNotes(supabase, session.userId), getNoteTopics(supabase, session.userId)]);
  const editing = notes.find((note) => note.id === query.edit);
  const checklistNotes = notes.filter((note) => note.remark === "__checklist__");
  const memoNotes = notes.filter((note) => note.remark !== "__checklist__");
  const checklistItems = checklistNotes.flatMap((note) => Array.isArray(note.checklist) ? (note.checklist as Array<{ text: string; done?: boolean }>).map((item, index) => ({ noteId: note.id, index, ...item })) : []);
  return <div className="feature-page">
    <PersistentDetails className="settings-card expandable-panel" defaultOpen={Boolean(editing) || query.memo === "1"} storageKey="note-editor"><summary><div className="card-heading"><span>필수 기록</span><h1>{editing ? "메모 수정" : "메모 쓰기"}</h1></div><span className="expand-icon">+</span></summary>
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
    </PersistentDetails>
    <section className="settings-card checklist-groups"><PersistentDetails className="checklist-group" defaultOpen storageKey="notes-checklist-open"><summary><span>미완료</span><strong>{checklistItems.filter((item) => !item.done).length}</strong></summary>{checklistItems.filter((item) => !item.done).map((item) => <div className="standalone-checklist-row" key={`${item.noteId}-${item.index}`}><form action={toggleNoteChecklistAction}><input name="id" type="hidden" value={item.noteId}/><input name="index" type="hidden" value={item.index}/><button aria-label={`${item.text} 완료`} type="submit">○</button></form><form action={updateNoteChecklistItemAction} className="checklist-edit-form"><input name="id" type="hidden" value={item.noteId}/><input name="index" type="hidden" value={item.index}/><input defaultValue={item.text} name="text"/><button type="submit">수정</button></form><form action={deleteNoteChecklistItemAction}><input name="id" type="hidden" value={item.noteId}/><input name="index" type="hidden" value={item.index}/><button type="submit">삭제</button></form></div>)}</PersistentDetails><PersistentDetails className="checklist-group" storageKey="notes-checklist-done"><summary><span>완료</span><strong>{checklistItems.filter((item) => item.done).length}</strong></summary>{checklistItems.filter((item) => item.done).map((item) => <div className="standalone-checklist-row completed" key={`${item.noteId}-${item.index}`}><form action={toggleNoteChecklistAction}><input name="id" type="hidden" value={item.noteId}/><input name="index" type="hidden" value={item.index}/><button aria-label={`${item.text} 완료 취소`} type="submit">✓</button></form><span>{item.text}</span><form action={deleteNoteChecklistItemAction}><input name="id" type="hidden" value={item.noteId}/><input name="index" type="hidden" value={item.index}/><button type="submit">삭제</button></form></div>)}</PersistentDetails></section>
    <PersistentDetails className="settings-card checklist-management" defaultOpen storageKey="checklist-management"><summary><div className="card-heading"><span>추가 기록</span><h2>체크리스트 관리</h2></div><span className="expand-icon">+</span></summary><PersistentDetails className="checklist-add-panel" storageKey="checklist-add"><summary><span>체크리스트 추가</span><span className="expand-icon">+</span></summary><form action={createStandaloneChecklistAction} className="feature-form"><label>체크리스트 작성하기<textarea name="checklistText" required rows={4}/></label><label className="checkbox-line"><input defaultChecked name="showOnHome" type="checkbox"/> 홈 화면에 표시</label><button className="primary-button">저장</button></form></PersistentDetails><PersistentDetails className="checklist-past-panel" defaultOpen storageKey="checklist-past"><summary><span>지난 체크리스트 보기</span><span className="expand-icon">+</span></summary><p>미완료 {checklistItems.filter((item) => !item.done).length} · 완료 {checklistItems.filter((item) => item.done).length}</p></PersistentDetails></PersistentDetails>
    <section className="settings-card">
      <NoteBrowser notes={memoNotes} topics={topics} />
    </section>
  </div>;
}
