"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteReadingBookAction } from "@/modules/life/application/actions";

type Book = { id: string; title: string; author: string | null };
type Log = { id: string; book_id: string; reading_date: string; record_title: string | null; pages_read: number | null };

function formatDate(value: string) { return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(`${value}T00:00:00`)); }

export function ReadingBookList({ books, logs }: { books: Book[]; logs: Log[] }) {
  const [openBookId, setOpenBookId] = useState<string | null>(null);
  return <div className="reading-library-list">{books.map((book) => { const bookLogs = logs.filter((log) => log.book_id === book.id); const open = openBookId === book.id; return <div className={open ? "reading-book-card is-open" : "reading-book-card"} key={book.id}>
    <button className="reading-book-summary" onClick={() => setOpenBookId((current) => current === book.id ? null : book.id)} type="button" aria-expanded={open}><span><strong>{book.title}</strong><span>{book.author ?? "저자 미입력"}</span></span><b>{bookLogs.length}개의 기록</b></button>
    {open ? <div className="reading-book-history">{bookLogs.length ? bookLogs.map((log) => <Link href={`/reading?month=${log.reading_date.slice(0, 7)}&date=${log.reading_date}&edit=${log.id}`} key={log.id} scroll={false}><time>{formatDate(log.reading_date)}</time><span className="reading-book-history-title">{log.record_title ?? ""}</span><span>{log.pages_read !== null ? `${log.pages_read}쪽` : ""}</span></Link>) : <p>아직 이 책의 독서 기록이 없어요.</p>}<form action={deleteReadingBookAction}><input name="id" type="hidden" value={book.id}/><button className="text-button danger" disabled={bookLogs.length > 0} title={bookLogs.length ? "독서 기록이 연결된 책은 삭제할 수 없어요." : undefined}>책 삭제</button></form></div> : null}
  </div>; })}</div>;
}
