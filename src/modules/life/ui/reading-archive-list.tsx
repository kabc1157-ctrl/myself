"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { deleteReadingBookAction } from "@/modules/life/application/actions";
import { ReadingCompletionControl } from "@/modules/life/ui/reading-completion-control";

export type ArchiveBook = { id: string; title: string; author: string | null; created_at?: string; is_completed?: boolean; completed_at?: string | null };
export type ArchiveLog = { id: string; book_id: string; reading_date: string; record_title: string | null; pages_read: number | null };

function BookStatus({ completed = false }: { completed?: boolean }) {
  return <span className="reading-book-status">{completed ? "완독" : "읽는 중"}</span>;
}

function BookCard({ book, count, className = "" }: { book: ArchiveBook; count: number; className?: string }) {
  return <article className={`reading-archive-book-card ${className}`.trim()}>
    <Link href={`/reading/books/${book.id}`}><span><strong>{book.title}</strong><small>{book.author ?? "저자 미입력"}</small></span><span className="reading-book-card-meta"><BookStatus completed={book.is_completed} /><b>{count}개의 기록</b></span></Link>
    <ReadingCompletionControl bookId={book.id} completed={Boolean(book.is_completed)} />
  </article>;
}

export function ReadingRecentBooks({ books, logs }: { books: ArchiveBook[]; logs: ArchiveLog[] }) {
  return books.length ? <div className="reading-recent-books">
    {books.map((book) => <BookCard book={book} count={logs.filter((log) => log.book_id === book.id).length} key={book.id} />)}
  </div> : <p className="empty-state">지금 읽고 있는 책이 없어요.</p>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(`${value}T00:00:00`));
}

export function ReadingArchiveList({ books, logs }: { books: ArchiveBook[]; logs: ArchiveLog[] }) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return books;
    return books.filter((book) => `${book.title} ${book.author ?? ""}`.toLocaleLowerCase().includes(normalized));
  }, [books, query]);

  return <>
    <div className="reading-archive-search">
      <button aria-expanded={searchOpen} aria-label="책 검색" className="archive-search-toggle" onClick={() => setSearchOpen((value) => !value)} type="button">⌕</button>
      {searchOpen ? <><label className="sr-only" htmlFor="reading-book-search">책 제목 또는 저자 검색</label><input id="reading-book-search" onChange={(event) => setQuery(event.target.value)} placeholder="책 제목 또는 저자 검색" type="search" value={query} />{query ? <button className="text-button" onClick={() => setQuery("")} type="button">지우기</button> : null}</> : null}
    </div>
    {filtered.length ? <div className="reading-archive-grid">{filtered.map((book) => {
      const count = logs.filter((log) => log.book_id === book.id).length;
      return <BookCard book={book} count={count} key={book.id} />;
    })}</div> : <p className="empty-state">{books.length ? "검색 결과가 없어요." : "아직 등록된 책이 없어요."}</p>}
  </>;
}

export { deleteReadingBookAction, formatDate };
