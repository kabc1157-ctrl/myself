import Link from "next/link";

import { getIsoWeekday } from "@/core/date/local-date";
import { ScrollPreservingForm } from "@/core/ui/scroll-preserving-form";
import { quickAddWorkShiftAction } from "@/modules/payroll/application/actions";
import { formatWon } from "@/modules/payroll/domain/payroll";

type DailyPayroll = Record<string, { pay: number; minutes: number }>;

export function PayrollCalendar({ month, dailyTotals, workplaceId, selectedDate, allScope = false }: { month: string; dailyTotals: DailyPayroll; workplaceId?: string; selectedDate?: string; allScope?: boolean }) {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthNumber = Number(monthText);
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const firstWeekday = getIsoWeekday(`${month}-01`);
  const cells = [
    ...Array.from({ length: firstWeekday - 1 }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  return (
    <div className="payroll-calendar" role="grid" aria-label={`${year}년 ${monthNumber}월 일자별 금액`}>
      {['월', '화', '수', '목', '금', '토', '일'].map((weekday) => (
        <div className="calendar-weekday" key={weekday} role="columnheader">{weekday}</div>
      ))}
      {cells.map((day, index) => {
        if (day === null) {
          return <div aria-hidden="true" className="calendar-day empty" key={`empty-${index}`} />;
        }
        const date = `${month}-${String(day).padStart(2, "0")}`;
        const total = dailyTotals[date];
        const content = <><span>{day}</span>{total ? <div><strong>{formatWon(total.pay)}</strong><small>{Math.floor(total.minutes / 60)}시간</small><small>{total.minutes % 60}분</small></div> : null}</>;
        const className = `${total ? "calendar-day has-work" : "calendar-day"}${selectedDate === date ? " selected" : ""}`;
        if (total || allScope) {
          return <Link className={className} href={`/payroll?month=${month}${workplaceId ? `&workplace=${workplaceId}` : "&scope=all"}&date=${date}`} key={date} role="gridcell" scroll={false}>{content}</Link>;
        }
        return workplaceId ? (
          <ScrollPreservingForm action={quickAddWorkShiftAction} className={className} key={date} role="gridcell">
            <input name="workplaceId" type="hidden" value={workplaceId} /><input name="workDate" type="hidden" value={date} />
            <button aria-label={`${day}일 기본 근무 등록`} type="submit">{content}</button>
          </ScrollPreservingForm>
        ) : <div className={className} key={date} role="gridcell">{content}</div>;
      })}
    </div>
  );
}
