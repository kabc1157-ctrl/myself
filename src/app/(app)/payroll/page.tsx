import Link from "next/link";

import { verifySession } from "@/core/auth/session";
import { formatKoreanDate, getLocalDate, isMonth, shiftMonth } from "@/core/date/local-date";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { ScrollPreservingForm } from "@/core/ui/scroll-preserving-form";
import { getOrCreateProfile } from "@/core/user/profile-repository";
import { deleteWorkShiftAction } from "@/modules/payroll/application/actions";
import { formatWon, payTypeLabels, type PayType } from "@/modules/payroll/domain/payroll";
import { getPayrollOverview } from "@/modules/payroll/infrastructure/payroll-repository";
import { PayrollCalendar } from "@/modules/payroll/ui/payroll-calendar";
import { BulkWorkShiftForm } from "@/modules/payroll/ui/bulk-work-shift-form";
import { WorkplaceForm } from "@/modules/payroll/ui/workplace-form";
import { WorkShiftForm } from "@/modules/payroll/ui/work-shift-form";

type PayrollPageProps = {
  searchParams: Promise<{ month?: string | string[]; workplace?: string | string[]; date?: string | string[]; scope?: string | string[] }>;
};

export default async function PayrollPage({ searchParams }: PayrollPageProps) {
  const [session, supabase, parameters] = await Promise.all([
    verifySession(),
    createServerSupabaseClient(),
    searchParams,
  ]);
  const profile = await getOrCreateProfile(supabase, session.userId);
  const date = getLocalDate(profile.timezone);
  const requestedMonth = typeof parameters.month === "string" ? parameters.month : "";
  const month = isMonth(requestedMonth) ? requestedMonth : date.slice(0, 7);
  const overview = await getPayrollOverview(supabase, month);
  const requestedWorkplace = typeof parameters.workplace === "string" ? parameters.workplace : "";
  const allScope = parameters.scope === "all";
  const selectedWorkplace = overview.workplaces.find((workplace) => workplace.id === requestedWorkplace)
    ?? overview.workplaces[0]
    ?? null;
  const selectedShifts = !allScope && selectedWorkplace
    ? overview.shifts.filter((shift) => shift.workplace_id === selectedWorkplace.id)
    : overview.shifts;
  const selectedDailyTotals = selectedShifts.reduce<Record<string, { pay: number; minutes: number }>>((totals, shift) => {
    const current = totals[shift.work_date] ?? { pay: 0, minutes: 0 };
    totals[shift.work_date] = {
      pay: current.pay + shift.calculatedPay,
      minutes: current.minutes + (shift.workedMinutes ?? 0),
    };
    return totals;
  }, {});
  const selectedMonthSummary = selectedShifts.reduce(
    (summary, shift) => ({
      pay: summary.pay + shift.calculatedPay,
      minutes: summary.minutes + (shift.workedMinutes ?? 0),
    }),
    { pay: 0, minutes: 0 },
  );
  const workplacesById = new Map(
    overview.workplaces.map((workplace) => [workplace.id, workplace]),
  );
  const selectedDate = typeof parameters.date === "string" ? parameters.date : "";
  const selectedDateShifts = selectedShifts.filter((shift) => shift.work_date === selectedDate);

  return (
    <div className="payroll-page">
      <section className="payroll-summary" aria-labelledby="payroll-title">
        <div className="month-navigation">
          <Link aria-label="이전 달" href={`/payroll?month=${shiftMonth(month, -1)}${selectedWorkplace ? `&workplace=${selectedWorkplace.id}` : ""}`} scroll={false}>←</Link>
          <div>
            <p className="eyebrow page-menu-label">월급</p>
            <h1 id="payroll-title">{month.replace("-", "년 ")}월</h1>
          </div>
          <Link aria-label="다음 달" href={`/payroll?month=${shiftMonth(month, 1)}${selectedWorkplace ? `&workplace=${selectedWorkplace.id}` : ""}`} scroll={false}>→</Link>
        </div>

        <details className="total-pay-card compact-total-card">
          <summary>
            <Link href={`/payroll?month=${month}&scope=all`} scroll={false}><span>이번 달 예상 금액</span><strong>{formatWon(overview.totalPay)}</strong></Link>
            <span aria-label="새 근무지 추가" className="card-plus">+</span>
          </summary>
          <small>세금·법정 수당을 제외한 입력 기록 기준입니다.</small>
          <WorkplaceForm />
        </details>

        <div className="workplace-summary-list">
          {overview.workplaceSummaries.length === 0 ? (
            <div className="empty-state">
              <strong>등록된 근무지가 없어요.</strong>
              <span>아래에서 첫 근무지를 추가해 보세요.</span>
            </div>
          ) : (
            overview.workplaceSummaries.map((workplace) => (
              <article className={selectedWorkplace?.id === workplace.id && !allScope ? "workplace-summary-card active" : "workplace-summary-card"} key={workplace.id}>
                <Link className="workplace-card-link" href={`/payroll?month=${month}&workplace=${workplace.id}`} scroll={false}>
                  <div><strong>{workplace.name} · 매월 {workplace.pay_day}일</strong><span>급여일 예상 {formatWon(workplace.totalPay)}</span></div>
                  <strong>{formatWon(workplace.totalPay)}</strong>
                </Link>
                <details className="inline-edit-panel">
                  <summary aria-label={`${workplace.name} 수정`}>+</summary>
                  <WorkplaceForm initialValue={{
                    id: workplace.id, name: workplace.name, defaultPayType: workplace.default_pay_type,
                    defaultRate: workplace.default_rate, payPeriodStartDay: workplace.pay_period_start_day,
                    payDay: workplace.pay_day, defaultStartTime: workplace.default_start_time,
                    defaultEndTime: workplace.default_end_time, defaultBreakMinutes: workplace.default_break_minutes,
                  }} />
                </details>
              </article>
            ))
          )}
        </div>

        <div className="calendar-context-row">
          <p className="calendar-context"><strong>{allScope ? "전체 근무지" : selectedWorkplace?.name ?? "근무지"}</strong> 근무 시간과 급여</p>
          <div className="calendar-month-summary" aria-label="이번 달 근무 합계">
            <span>이번 달 {Math.floor(selectedMonthSummary.minutes / 60)}시간 {selectedMonthSummary.minutes % 60}분</span>
            <strong>{formatWon(selectedMonthSummary.pay)}</strong>
          </div>
        </div>
        {!allScope && selectedWorkplace ? (
          <details className="bulk-shift-panel">
            <summary>요일로 한 달 등록 <span aria-hidden="true">+</span></summary>
            <BulkWorkShiftForm month={month} workplaceId={selectedWorkplace.id} />
          </details>
        ) : null}
        <PayrollCalendar allScope={allScope} dailyTotals={selectedDailyTotals} month={month} selectedDate={selectedDate} workplaceId={allScope ? undefined : selectedWorkplace?.id} />
      </section>

      {selectedDate ? <section className="selected-day-card payroll-day-detail">
          <div><span>{formatKoreanDate(selectedDate)}</span><h2>등록된 근무</h2></div>
          {selectedDateShifts.length === 0 ? <p>선택한 날짜에 등록된 근무가 없어요.</p> : selectedDateShifts.map((shift) => {
              const workplace = workplacesById.get(shift.workplace_id);
              return (
                <article className="shift-row" key={shift.id}>
                  <div>
                    <strong>{workplace?.name ?? "근무지"}</strong>
                    <span>{payTypeLabels[shift.pay_type as PayType]} · {shift.start_time?.slice(0, 5) ?? "시간 없음"}{shift.end_time ? `–${shift.end_time.slice(0, 5)}` : ""}</span>
                  </div>
                  <div>
                    <strong>{formatWon(shift.calculatedPay)}</strong>
                    <ScrollPreservingForm action={deleteWorkShiftAction}>
                      <input name="shiftId" type="hidden" value={shift.id} />
                      <button className="archive-button" type="submit">삭제</button>
                    </ScrollPreservingForm>
                  </div>
                  <details className="shift-edit-panel"><summary>수정</summary><WorkShiftForm date={selectedDate} initialShift={{ id: shift.id, workplaceId: shift.workplace_id, workDate: shift.work_date, startTime: shift.start_time, endTime: shift.end_time, breakMinutes: shift.break_minutes, payType: shift.pay_type, payRate: shift.pay_rate, quantity: shift.quantity, additionalPay: shift.additional_pay, memo: shift.memo }} workplaces={overview.workplaces.map((item) => ({ id: item.id, name: item.name, defaultPayType: item.default_pay_type, defaultRate: item.default_rate }))} /></details>
                </article>
              );
            })}
      </section> : null}
    </div>
  );
}
