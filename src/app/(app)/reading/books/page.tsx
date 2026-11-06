import Link from "next/link";
import { verifySession } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { getReadingBooks, getReadingLogs } from "@/modules/life/infrastructure/repository";
import { ReadingArchiveList } from "@/modules/life/ui/reading-archive-list";

export default async function ReadingBooksPage() {
  const session = await verifySession();
  const supabase = await createServerSupabaseClient();
  const [books, logs] = await Promise.all([getReadingBooks(supabase, session.userId), getReadingLogs(supabase, session.userId)]);
  return <div className="feature-page reading-archive-page">
    <header className="reading-archive-header"><Link className="archive-back-link" href="/reading">‹ 독서</Link><div><span>{books.length}권</span><h1>읽은 책 리스트</h1></div></header>
    <section className="settings-card reading-archive-card"><ReadingArchiveList books={books} logs={logs} /></section>
  </div>;
}
