import Link from "next/link";

import { verifySession } from "@/core/auth/session";
import { formatShortKoreanDate, getLocalDate, isMonth } from "@/core/date/local-date";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { ActivityCalendar } from "@/core/ui/activity-calendar";
import { AiInsight } from "@/core/ui/ai-insight";
import { PersistentDetails } from "@/core/ui/persistent-details";
import { getOrCreateProfile } from "@/core/user/profile-repository";
import { deleteReadingBookAction, deleteReadingLogAction, saveReadingBookAction, saveReadingLogAction } from "@/modules/life/application/actions";
import { getReadingBooks, getReadingLogs } from "@/modules/life/infrastructure/repository";

type Props = { searchParams: Promise<{ date?: string; month?: string; edit?: string }> };

export default async function ReadingPage({ searchParams }: Props) {
  const [session, supabase, query] = await Promise.all([
    verifySession(),
    createServerSupabaseClient(),
    searchParams,
  ]);
  const profile = await getOrCreateProfile(supabase, session.userId);
  const today = getLocalDate(profile.timezone);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(query.date ?? "") ? query.date! : today;
  const month = isMonth(query.month ?? "") ? query.month! : date.slice(0, 7);
  const [logs, books] = await Promise.all([
    getReadingLogs(supabase, session.userId),
    getReadingBooks(supabase, session.userId),
  ]);
  const editing = logs.find((log) => log.id === query.edit) ?? null;
  const selectedLogs = logs.filter((log) => log.reading_date === date);
  const counts = new Map<string, number>();
  for (const log of logs) counts.set(log.reading_date, (counts.get(log.reading_date) ?? 0) + 1);

  return <div className="feature-page reading-page">
    <PersistentDetails className="settings-card expandable-panel" defaultOpen={Boolean(editing) || selectedLogs.length === 0} storageKey="reading-editor">
      <summary><div className="card-heading"><span>{formatShortKoreanDate(editing?.reading_date ?? date)}</span><h1>{editing ? "독서 기록 수정" : "독서 기록 쓰기"}</h1></div><span className="expand-icon">+</span></summary>
      <form action={saveReadingLogAction} className="feature-form">
        {editing ? <input name="id" type="hidden" value={editing.id} /> : null}
        <label>날짜<input defaultValue={editing?.reading_date ?? date} name="date" required type="date" /></label>
        <label>책 선택<select defaultValue={editing?.book_id ?? ""} name="bookId" required><option disabled value="">책 제목과 저자를 선택해 주세요</option>{books.map((book) => <option key={book.id} value={book.id}>{book.title}{book.author ? ` · ${book.author}` : ""}</option>)}</select></label>
        {books.length === 0 ? <p className="form-message">먼저 아래 ‘책 제목과 저자 관리’에서 책을 추가해 주세요.</p> : null}
        <label>오늘 읽은 쪽 수<input defaultValue={editing?.pages_read ?? ""} min="0" name="pagesRead" type="number" /></label>
        <label>기억하고 싶은 문장<textarea defaultValue={editing?.memorable_quote ?? ""} maxLength={3000} name="memorableQuote" rows={3} /></label>
        <label>읽고 든 생각<textarea defaultValue={editing?.reflection ?? ""} maxLength={10000} name="reflection" rows={6} /></label>
        <button className="primary-button" disabled={books.length === 0}>{editing ? "수정 저장" : "독서 기록 저장"}</button>
      </form>
    </PersistentDetails>

    <PersistentDetails className="settings-card expandable-panel" defaultOpen={books.length === 0} storageKey="reading-book-manager">
      <summary><div className="card-heading"><span>책 데이터베이스</span><h2>책 제목과 저자 관리</h2></div><span className="expand-icon">+</span></summary>
      <form action={saveReadingBookAction} className="feature-form reading-book-form">
        <label>책 제목<input maxLength={200} name="title" required /></label>
        <label>저자<input maxLength={120} name="author" /></label>
        <button className="secondary-button">책 추가</button>
      </form>
    </PersistentDetails>

    <ActivityCalendar
      hrefForDate={(selectedDate) => `/reading?month=${month}&date=${selectedDate}`}
      hrefForMonth={(selectedMonth) => `/reading?month=${selectedMonth}`}
      month={month}
      selectedDate={date}
      title="독서 달력"
      values={Array.from(counts, ([recordDate, count]) => ({ date: recordDate, label: `${count}권`, level: Math.min(5, count) })).filter((item) => item.date.startsWith(month))}
      weekStartsOn={profile.week_starts_on}
    />

    <section className="selected-day-card reading-day-detail">
      <div><span>{formatShortKoreanDate(date)}</span><h2>{selectedLogs.length ? `${selectedLogs.length}개의 독서 기록` : "이날의 독서 기록이 없어요"}</h2></div>
      {selectedLogs.map((log) => <article className="reading-log-card" key={log.id}>
        <div className="reading-log-heading"><div><h3>{log.title}</h3>{log.author ? <span>{log.author}</span> : null}</div>{log.pages_read !== null ? <strong>{log.pages_read}쪽</strong> : null}</div>
        {log.memorable_quote ? <blockquote>{log.memorable_quote}</blockquote> : null}
        {log.reflection ? <div className="entry-reading"><strong>읽고 든 생각</strong><p>{log.reflection}</p></div> : null}
        <div className="mini-insight"><strong>AI 인사이트</strong><AiInsight value={log.ai_feedback} pendingMessage="AI 인사이트가 준비되면 이곳에 표시돼요." /></div>
        <div className="inline-actions"><Link className="archive-button" href={`/reading?month=${month}&date=${date}&edit=${log.id}`} scroll={false}>수정</Link><form action={deleteReadingLogAction}><input name="id" type="hidden" value={log.id}/><button className="text-button danger">삭제</button></form></div>
      </article>)}
      {!selectedLogs.length ? <p>위 기록 쓰기에서 오늘 읽은 책과 생각을 남겨보세요.</p> : null}
    </section>

    <section className="settings-card reading-library">
      <div className="card-heading"><span>{books.length}권</span><h2>읽은 책 리스트</h2></div>
      {books.length ? <div className="reading-library-list">{books.map((book) => {
        const bookLogs = logs.filter((log) => log.book_id === book.id);
        return <details className="reading-book-card" key={book.id}>
          <summary><div><strong>{book.title}</strong><span>{book.author ?? "저자 미입력"}</span></div><b>{bookLogs.length}개의 기록</b></summary>
          <div className="reading-book-history">
            {bookLogs.length ? bookLogs.map((log) => <Link href={`/reading?month=${log.reading_date.slice(0, 7)}&date=${log.reading_date}`} key={log.id} scroll={false}><time>{formatShortKoreanDate(log.reading_date)}</time><span>{log.pages_read !== null ? `${log.pages_read}쪽` : "기록 보기"}</span></Link>) : <p>아직 이 책의 독서 기록이 없어요.</p>}
            <form action={deleteReadingBookAction}><input name="id" type="hidden" value={book.id}/><button className="text-button danger" disabled={bookLogs.length > 0} title={bookLogs.length ? "독서 기록이 연결된 책은 삭제할 수 없어요." : undefined}>책 삭제</button></form>
          </div>
        </details>;
      })}</div> : <p>책을 추가하면 이곳에서 기록을 모아볼 수 있어요.</p>}
    </section>
  </div>;
}
