import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { getReadingBooks, getReadingLogs } from "@/modules/life/infrastructure/repository";
import { DeleteReadingBookForm } from "@/modules/life/ui/delete-reading-book-form";
import { ReadingAiInsight } from "@/core/ui/reading-ai-insight";
import { AiMemoButton } from "@/core/ai/ai-memo-button";
import { ReadingBookReflection } from "@/modules/life/ui/reading-book-reflection";

type Props = { params: Promise<{ bookId: string }> };

function formatReadingDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(`${value}T00:00:00`));
}

export default async function ReadingBookDetailPage({ params }: Props) {
  const session = await verifySession();
  const { bookId } = await params;
  const supabase = await createServerSupabaseClient();
  const [books, logs] = await Promise.all([getReadingBooks(supabase, session.userId), getReadingLogs(supabase, session.userId)]);
  const book = books.find((item) => item.id === bookId);
  if (!book) notFound();
  const bookLogs = logs.filter((log) => log.book_id === book.id).sort((a, b) => b.reading_date.localeCompare(a.reading_date));
  return <div className="feature-page reading-book-detail-page">
    <header className="reading-archive-header"><Link className="archive-back-link" href="/reading/books">‹ 읽은 책 리스트</Link><div><h1>{book.title}</h1><p>{book.author ?? "저자 미입력"}</p></div></header>
    {book.is_completed ? <ReadingBookReflection bookId={book.id} sourceRecordCount={bookLogs.length} /> : null}
    <section className="settings-card reading-book-detail-card">
      <div className="reading-detail-section-heading"><h2>독서 기록</h2><span>{bookLogs.length}개</span></div>
      {bookLogs.length ? <div className="reading-book-detail-list">{bookLogs.map((log) => <details className="reading-archive-log" key={log.id}>
        <summary><span>{formatReadingDate(log.reading_date)}</span><strong>{log.record_title || "독서 기록"}</strong><b>{log.pages_read !== null ? `${log.pages_read}쪽` : "쪽수 없음"}</b></summary>
        <div className="reading-archive-log-body">
          {log.memorable_quote ? <blockquote>{log.memorable_quote}</blockquote> : null}
          {log.reflection ? <p>{log.reflection}</p> : <p className="muted-copy">상세 내용이 없는 기록이에요.</p>}
          <div className="mini-insight"><strong>AI 인사이트</strong><ReadingAiInsight author={book.author} bookTitle={book.title} value={log.ai_feedback} pendingMessage="AI 인사이트가 준비되면 이곳에 표시돼요." />{log.ai_feedback ? <AiMemoButton source="reading" sourceId={log.id} sourceUrl={`/reading/books/${book.id}`} /> : null}</div>
          <Link className="text-button" href={`/reading?month=${log.reading_date.slice(0, 7)}&date=${log.reading_date}&edit=${log.id}`} scroll={false}>기록 수정</Link>
        </div>
      </details>)}</div> : <p>아직 이 책의 독서 기록이 없어요.</p>}
      <DeleteReadingBookForm bookId={book.id} hasLogs={bookLogs.length > 0} />
    </section>
  </div>;
}
