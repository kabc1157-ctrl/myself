import Link from "next/link";
import { verifySession } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { getLocalDate } from "@/core/date/local-date";
import { getOrCreateProfile } from "@/core/user/profile-repository";
import { getReadingBooks, getReadingLogs } from "@/modules/life/infrastructure/repository";
import { ReadingArchiveList } from "@/modules/life/ui/reading-archive-list";
import { ReadingCompletionPeriods } from "@/modules/life/ui/reading-completion-periods";

export default async function ReadingBooksPage() {
  const session = await verifySession();
  const supabase = await createServerSupabaseClient();
  const profile = await getOrCreateProfile(supabase, session.userId);
  const [books, logs] = await Promise.all([getReadingBooks(supabase, session.userId), getReadingLogs(supabase, session.userId)]);
  const sortedBooks = [...books].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const completeCount = books.filter((book) => book.is_completed).length;
  const inProgressCount = books.length - completeCount;
  const currentMonth = getLocalDate(profile.timezone).slice(0, 7);
  const currentYear = currentMonth.slice(0, 4);
  return <div className="feature-page reading-archive-page">
    <header className="reading-archive-header"><Link className="archive-back-link" href="/reading">‹ 독서</Link><div><h1>나의 서재</h1><p>읽은 책과 독서 기록을 한곳에서 살펴보세요.</p></div></header>
    <section className="settings-card reading-archive-card">
      <div className="reading-archive-stats" aria-label="독서 현황">
        <div><span>전체</span><strong>{books.length}</strong></div>
        <div><span>완독</span><strong>{completeCount}</strong></div>
        <div><span>읽는 중</span><strong>{inProgressCount}</strong></div>
      </div>
      <ReadingCompletionPeriods books={books} currentYear={currentYear} currentMonth={currentMonth} />
      <ReadingArchiveList books={sortedBooks} logs={logs} />
    </section>
  </div>;
}
