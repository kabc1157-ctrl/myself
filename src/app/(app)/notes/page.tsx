import { verifySession } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { saveNoteAction } from "@/modules/life/application/actions";
import { getNotes, getNoteTopics } from "@/modules/life/infrastructure/repository";
import { NoteBrowser } from "@/modules/life/ui/note-browser";
import { PersistentDetails } from "@/core/ui/persistent-details";

type Props = { searchParams: Promise<{ topic?: string; edit?: string }> };

export default async function NotesPage({ searchParams }: Props) {
  const [session, supabase, query] = await Promise.all([verifySession(), createServerSupabaseClient(), searchParams]);
  const [notes, topics] = await Promise.all([getNotes(supabase, session.userId), getNoteTopics(supabase, session.userId)]);
  const editing = notes.find((note) => note.id === query.edit);
  return <div className="feature-page">
    <PersistentDetails className="settings-card expandable-panel" defaultOpen={Boolean(editing)} storageKey="note-editor"><summary><div className="card-heading"><span>필수 기록</span><h1>{editing ? "메모 수정" : "메모 쓰기"}</h1></div><span className="expand-icon">+</span></summary>
      <form action={saveNoteAction} className="feature-form">
        {editing ? <input name="id" type="hidden" value={editing.id} /> : null}
        <label>제목<input defaultValue={editing?.title} maxLength={120} name="title" required /></label>
        <label>주제<select defaultValue={editing?.topic_id ?? ""} name="topicId"><option value="">주제 없음</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select></label>
        <label>새 주제 추가<input maxLength={40} name="newTopic" placeholder="예: 강의, 아이디어" /></label>
        <label>비고<input defaultValue={editing?.remark ?? ""} maxLength={500} name="remark" /></label>
        <label>내용<textarea defaultValue={editing?.content} name="content" required rows={8} /></label>
        <label>체크리스트<textarea defaultValue={Array.isArray(editing?.checklist) ? (editing.checklist as Array<{ text: string }>).map((item) => item.text).join("\n") : ""} name="checklistText" placeholder="할 일을 한 줄에 하나씩 입력하세요" rows={5} /></label>
        <label className="checkbox-line"><input defaultChecked={editing?.show_on_home} name="showOnHome" type="checkbox" /> 홈 화면에 표시</label>
        <button className="primary-button" type="submit">저장</button>
      </form>
    </PersistentDetails>
    <section className="settings-card">
      <NoteBrowser notes={notes} topics={topics} />
    </section>
  </div>;
}
