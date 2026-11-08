"use client";

import { useMemo, useState } from "react";

type Book = { is_completed: boolean; completed_at: string | null };

export function ReadingCompletionPeriods({ books, currentYear, currentMonth }: { books: Book[]; currentYear: string; currentMonth: string }) {
  const years = useMemo(() => Array.from(new Set([currentYear, ...books.map((book) => book.completed_at?.slice(0, 4)).filter((value): value is string => Boolean(value))])).sort().reverse(), [books, currentYear]);
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth.slice(5, 7));
  const yearCount = books.filter((book) => book.is_completed && book.completed_at?.startsWith(year)).length;
  const monthKey = `${year}-${month}`;
  const monthCount = books.filter((book) => book.is_completed && book.completed_at?.startsWith(monthKey)).length;
  return <div className="reading-completion-periods" aria-label="기간별 완독 현황">
    <div><label htmlFor="reading-completion-year">연도</label><select id="reading-completion-year" value={year} onChange={(event) => setYear(event.target.value)}>{years.map((value) => <option key={value} value={value}>{value}년</option>)}</select><strong>{yearCount}권</strong></div>
    <div><label htmlFor="reading-completion-month">월</label><select id="reading-completion-month" value={month} onChange={(event) => setMonth(event.target.value)}>{Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0")).map((value) => <option key={value} value={value}>{year}년 {Number(value)}월</option>)}</select><strong>{monthCount}권</strong></div>
  </div>;
}
