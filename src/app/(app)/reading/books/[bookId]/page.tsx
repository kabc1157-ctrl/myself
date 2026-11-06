import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { deleteReadingBookAction } from "@/modules/life/application/actions";
import { getReadingBooks, getReadingLogs } from "@/modules/life/infrastructure/repository";
import { formatDate } from "@/modules/life/ui/reading-archive-list";

type Props = { params: Promise<{ bookId: string }> };

export default async function ReadingBookDetailPage({ params }: Props) {
  const session = await verifySession();
  const { bookId } = await params;
  const supabase = await createServerSupabaseClient();
  const [books, logs] = await Promise.all([getReadingBooks(supabase, session.userId), getReadingLogs(supabase, session.userId)]);
  const book = books.find((item) => item.id === bookId);
  if (!book) notFound();
  const bookLogs = logs.filter((log) => log.book_id === book.id).sort((a, b) => b.reading_date.localeCompare(a.reading_date));
  return <div className="feature-page reading-book-detail-page">
    <header className="reading-archive-header"><Link className="archive-back-link" href="/reading/books">‹ 읽은 책 리스트</Link><div><span>{bookLogs.length}개의 기록</span><h1>{book.title}</h1><p>{book.author ?? "저자 미입력"}</p></div></header>
    <section className="settings-card reading-book-detail-card">
      <h2>독서 기록</h2>
      {bookLogs.length ? <div className="reading-book-detail-list">{bookLogs.map((log) => <details className="reading-archive-log" key={log.id}>
        <summary><span>{formatDate(log.reading_date)}</span><strong>{log.record_title || "독서 기록"}</strong><b>{log.pages_read !== null ? `${log.pages_read}쪽` : "쪽수 없음"}</b></summary>
        <div className="reading-archive-log-body">
          {log.memorable_quote ? <blockquote>{log.memorable_quote}</blockquote> : null}
          {log.reflection ? <p>{log.reflection}</p> : <p className="muted-copy">상세 내용이 없는 기록이에요.</p>}
          <Link className="text-button" href={`/reading?month=${log.reading_date.slice(0, 7)}&date=${log.reading_date}&edit=${log.id}`} scroll={false}>기록 수정</Link>
        </div>
      </details>)}</div> : <p>아직 이 책의 독서 기록이 없어요.</p>}
      <form action={deleteReadingBookAction} className="reading-archive-delete-form"><input name="id" type="hidden" value={book.id}/><button className="text-button danger" disabled={bookLogs.length > 0} title={bookLogs.length ? "독서 기록이 연결된 책은 삭제할 수 없어요." : undefined}>책 삭제</button></form>
    </section>
  </div>;
}
