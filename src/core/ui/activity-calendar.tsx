import Link from "next/link";
import type { ReactNode } from "react";

import { getCalendarLeadingDays, getCalendarWeekdays, shiftMonth } from "@/core/date/local-date";

type ActivityCalendarValue = {
  date: string;
  label: string;
  level: number;
  tone?: "buy" | "sell";
};

export function ActivityCalendar({
  month,
  title,
  values,
  hrefForDate,
  selectedDate,
  circular = false,
  headingAside,
  hrefForMonth,
  weekStartsOn = 1,
}: {
  month: string;
  title: string;
  values: ActivityCalendarValue[];
  hrefForDate?: (date: string) => string;
  selectedDate?: string;
  circular?: boolean;
  headingAside?: ReactNode;
  hrefForMonth?: (month: string) => string;
  weekStartsOn?: number;
}) {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthNumber = Number(monthText);
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const leadingDays = getCalendarLeadingDays(`${month}-01`, weekStartsOn);
  const weekdays = getCalendarWeekdays(weekStartsOn);
  const valuesByDate = new Map(values.map((value) => [value.date, value]));
  const cells = [
    ...Array.from({ length: leadingDays }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  return (
    <section className="activity-calendar-section">
      <div className="list-heading activity-calendar-heading">
        <div>
          <p className="eyebrow">MONTHLY VIEW</p>
          <div className="activity-calendar-title-line">
            <h2>{title}</h2>
            {headingAside ? <div className="activity-calendar-aside">{headingAside}</div> : null}
          </div>
        </div>
      </div>
      {hrefForMonth ? (
        <nav aria-label={`${title} 월 이동`} className="calendar-month-navigation">
          <Link aria-label="이전 달" href={hrefForMonth(shiftMonth(month, -1))} scroll={false}>‹</Link>
          <strong>{year}년 {monthNumber}월</strong>
          <Link aria-label="다음 달" href={hrefForMonth(shiftMonth(month, 1))} scroll={false}>›</Link>
        </nav>
      ) : <strong className="calendar-current-month">{year}년 {monthNumber}월</strong>}
      <div className="activity-calendar" role="grid" aria-label={`${year}년 ${monthNumber}월 ${title}`}>
        {weekdays.map((weekday) => (
          <div className="calendar-weekday" key={weekday} role="columnheader">{weekday}</div>
        ))}
        {cells.map((day, index) => {
          if (day === null) {
            return <div aria-hidden="true" className="activity-day empty" key={`empty-${index}`} />;
          }
          const date = `${month}-${String(day).padStart(2, "0")}`;
          const value = valuesByDate.get(date);
          const content = (
            <>
              <span>{day}</span>
              {value ? <strong aria-hidden={circular || undefined} className={circular ? "calendar-progress-ring" : undefined} style={circular ? { "--progress": `${Math.max(0, Math.min(100, value.level)) * 3.6}deg` } as React.CSSProperties : undefined}>{circular ? "" : value.label}</strong> : null}
            </>
          );
          const className = `activity-day level-${Math.max(0, Math.min(5, circular ? Math.ceil((value?.level ?? 0) / 20) : value?.level ?? 0))}${value?.tone ? ` calendar-tone-${value.tone}` : ""}${selectedDate === date ? " selected" : ""}`;
          return hrefForDate ? (
            <Link
              aria-label={`${day}일${value ? ` ${value.label}` : " 기록 없음"}`}
              className={className}
              href={hrefForDate(date)}
              key={date}
              role="gridcell"
              scroll={false}
              title={value?.label}
            >
              {content}
            </Link>
          ) : (
            <div aria-label={`${day}일${value ? ` ${value.label}` : " 기록 없음"}`} className={className} key={date} role="gridcell" title={value?.label}>{content}</div>
          );
        })}
      </div>
    </section>
  );
}
