"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { deleteReadingBookAction } from "@/modules/life/application/actions";

export type ArchiveBook = { id: string; title: string; author: string | null };
export type ArchiveLog = { id: string; book_id: string; reading_date: string; record_title: string | null; pages_read: number | null };

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
      return <Link className="reading-archive-book-card" href={`/reading/books/${book.id}`} key={book.id}>
        <span><strong>{book.title}</strong><small>{book.author ?? "저자 미입력"}</small></span><b>{count}개의 기록</b>
      </Link>;
    })}</div> : <p className="empty-state">{books.length ? "검색 결과가 없어요." : "아직 등록된 책이 없어요."}</p>}
    {filtered.length ? <p className="reading-archive-hint">책을 선택하면 해당 책의 모든 기록을 확인할 수 있어요.</p> : null}
    {books.length === 0 ? null : <div className="reading-archive-delete-note">책 삭제는 책 상세 화면에서 할 수 있어요.</div>}
  </>;
}

export { deleteReadingBookAction, formatDate };
