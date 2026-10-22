import Link from "next/link";

import {
  archiveRoutineAction,
  deleteRoutineAction,
  restoreRoutineAction,
  toggleRoutineCompletionAction,
} from "@/modules/routines/application/actions";
import { CreateRoutineForm } from "@/modules/routines/ui/create-routine-form";
import { EditRoutineForm } from "@/modules/routines/ui/edit-routine-form";
import { DailyReviewForm } from "@/modules/routines/ui/daily-review-form";
import { verifySession } from "@/core/auth/session";
import { formatShortKoreanDate, getLocalDate, getMonthRange, isMonth, shiftDate } from "@/core/date/local-date";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { ActivityCalendar } from "@/core/ui/activity-calendar";
import { AiInsight } from "@/core/ui/ai-insight";
import { InsightSaveButton } from "@/core/ai/insight-save-button";
import { getRoutineAiInsights, getSavedInsightIds } from "@/core/ai/insight-inbox";
import { PersistentDetails } from "@/core/ui/persistent-details";
import { QuerySelect } from "@/core/ui/query-select";
import { ScrollPreservingForm } from "@/core/ui/scroll-preserving-form";
import { getOrCreateProfile } from "@/core/user/profile-repository";
import {
  getRoutineDailyReview,
  getRoutineDashboard,
} from "@/modules/routines/infrastructure/routine-repository";
import { getRoutineScheduleLabel, sortRoutineItems, type RoutineSort } from "@/modules/routines/domain/routine-sort";

export const dynamic = "force-dynamic";

type RoutinesPageProps = { searchParams: Promise<{ date?: string | string[]; month?: string | string[]; sort?: string | string[]; routine?: string | string[]; edit?: string | string[] }> };

export default async function RoutinesPage({ searchParams }: RoutinesPageProps) {
  const [session, supabase, parameters] = await Promise.all([
    verifySession(),
    createServerSupabaseClient(),
    searchParams,
  ]);
  const profile = await getOrCreateProfile(supabase, session.userId);
  const date = getLocalDate(profile.timezone);
  const [dashboard, routineInsights, savedInsightIds] = await Promise.all([
    getRoutineDashboard(supabase, date, profile.week_starts_on),
    getRoutineAiInsights(supabase, session.userId),
    getSavedInsightIds(supabase, session.userId),
  ]);
  const day = dashboard.day;
  const requestedDateValue = typeof parameters.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parameters.date) ? parameters.date : null;
  const requestedMonthValue = typeof parameters.month === "string" && isMonth(parameters.month) ? parameters.month : null;
  const calendarMonth = requestedMonthValue ?? requestedDateValue?.slice(0, 7) ?? date.slice(0, 7);
  const calendarAnchorDate = calendarMonth === date.slice(0, 7)
    ? date
    : shiftDate(getMonthRange(calendarMonth).endExclusive, -1);
  const calendarDashboard = calendarMonth === date.slice(0, 7)
    ? dashboard
    : await getRoutineDashboard(supabase, calendarAnchorDate, profile.week_starts_on);
  const selectedDate = requestedDateValue?.startsWith(calendarMonth)
    ? requestedDateValue
    : calendarMonth === date.slice(0, 7) ? date : `${calendarMonth}-01`;
  const selectedDay = calendarDashboard.calendar.find((calendarDay) => calendarDay.date === selectedDate) ?? calendarDashboard.day;
  const selectedReview = await getRoutineDailyReview(supabase, selectedDate);
  const requestedSort = typeof parameters.sort === "string" ? parameters.sort : "schedule";
  const sort: RoutineSort = requestedSort === "name" || requestedSort === "completion" ? requestedSort : "schedule";
  const routinesById = new Map(calendarDashboard.calendar.flatMap((calendarDay) => calendarDay.items).map((item) => [item.id, item]));
  const requestedRoutineId = typeof parameters.routine === "string" ? parameters.routine : "";
  const selectedRoutineId = routinesById.has(requestedRoutineId) ? requestedRoutineId : "";
  const requestedEditId = typeof parameters.edit === "string" ? parameters.edit : "";
  const editRoutine = dashboard.editable.find((routine) => routine.id === requestedEditId) ?? null;
  const sortedDayItems = sortRoutineItems(day.items, sort);
  const selectedDayItems = selectedRoutineId ? selectedDay.items.filter((item) => item.id === selectedRoutineId) : selectedDay.items;
  const calendarValues = selectedRoutineId
    ? calendarDashboard.calendar.flatMap((calendarDay) => {
        const item = calendarDay.items.find((candidate) => candidate.id === selectedRoutineId);
        return item ? [{ date: calendarDay.date, label: item.completed ? "100%" : "0%", level: item.completed ? 100 : 0 }] : [];
      })
    : calendarDashboard.calendar.filter((calendarDay) => calendarDay.totalCount > 0).map((calendarDay) => ({
        date: calendarDay.date, label: `${calendarDay.completionRate}%`, level: calendarDay.completionRate,
      }));
  return (
    <div className="routine-layout">
      <section className="routine-main" aria-labelledby="today-title">
        <div className="section-heading">
          <div className="routine-date-summary">
            <div>
              <p className="eyebrow page-menu-label">루틴</p>
              <h1 id="today-title">{formatShortKoreanDate(date)}</h1>
            </div>
            <div className="header-progress-mini" aria-label="주간 및 월간 루틴 진행률">
              <span>이번 주 <strong>{dashboard.weekly.completionRate}%</strong></span>
              <span>이번 달 <strong>{dashboard.monthly.completionRate}%</strong></span>
            </div>
          </div>
          <div
            aria-label={`달성률 ${day.completionRate}%`}
            className="today-progress-capsule"
            style={{ "--progress": `${day.completionRate * 3.6}deg` } as React.CSSProperties}
          >
            <div><span>오늘의 루틴 진행률</span><strong>{day.completionRate}%</strong></div>
            <div className="capsule-track"><span style={{ width: `${day.completionRate}%` }} /></div>
            <small>{day.completedCount}/{day.totalCount} 완료</small>
          </div>
        </div>

        <div className="routine-toolbar-grid" aria-label="루틴 관리">
          <PersistentDetails className="routine-toolbar-panel" storageKey="routines-create">
            <summary><span>새 루틴 추가</span><b aria-hidden="true">+</b></summary>
            <CreateRoutineForm date={date} />
          </PersistentDetails>
          <PersistentDetails className="routine-toolbar-panel archived-routines" storageKey="routines-archived">
            <summary><span>보관된 루틴</span><strong>{dashboard.archived.length}</strong></summary>
            {dashboard.archived.length === 0 ? (
              <p className="integration-note archived-empty">보관된 루틴이 없어요.</p>
            ) : dashboard.archived.map((routine) => (
              <article className="archived-routine-row" key={routine.id}>
                <div><strong>{routine.name}</strong><span>{routine.start_date} 시작{routine.end_date ? ` · ${routine.end_date} 종료` : ""}</span></div>
                <div>
                  <ScrollPreservingForm action={restoreRoutineAction}><input name="routineId" type="hidden" value={routine.id} /><button className="archive-button" type="submit">복구</button></ScrollPreservingForm>
                  <ScrollPreservingForm action={deleteRoutineAction}><input name="routineId" type="hidden" value={routine.id} /><button className="text-button danger" type="submit">삭제</button></ScrollPreservingForm>
                </div>
              </article>
            ))}
          </PersistentDetails>
        </div>

        <PersistentDetails className="review-panel journal-focus-card expandable-panel routine-insight-card" defaultOpen={!selectedReview} storageKey="routines-daily-review">
          <summary>
            <div>
              <h2 className="routine-insight-label">루틴 회고 쓰기</h2>
              <small>{formatShortKoreanDate(selectedDate)}</small>
            </div>
            <span aria-hidden="true" className="expand-icon">+</span>
          </summary>
          {selectedReview ? <div className="inline-review-insight"><AiInsight value={selectedReview.ai_feedback} pendingMessage="회고가 분석되면 이곳에 루틴 인사이트가 표시돼요." /><small>회고를 수정해도 기존 인사이트는 자동으로 변하지 않아요.</small></div> : null}
          <DailyReviewForm initialReflection={selectedReview?.reflection ?? ""} label="루틴은 어땠나요?" reviewDate={selectedDate} />
        </PersistentDetails>

        <section className="routine-insight-history" aria-labelledby="routine-insight-history-title">
          <div className="home-section-heading">
            <h2 id="routine-insight-history-title">루틴 인사이트</h2>
            <Link href="/discoveries">나의 발견</Link>
          </div>
          {routineInsights.length === 0 ? (
            <p className="home-pending-empty">아직 생성된 루틴 인사이트가 없어요.</p>
          ) : (
            <div className="routine-insight-list">
              {routineInsights.map((insight) => (
                <article className="home-insight-card routine" key={insight.id}>
                  <div className="home-insight-meta">
                    <span>{insight.scope === "monthly" ? "월간" : insight.scope === "weekly" ? "주간" : "일간"} 루틴</span>
                    <time dateTime={insight.source_date}>{formatShortKoreanDate(insight.source_date)}</time>
                  </div>
                  <AiInsight value={insight.content} />
                  <InsightSaveButton insightId={insight.id} saved={savedInsightIds.has(insight.id)} />
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="routine-list-heading">
          <span>오늘의 루틴</span>
          <QuerySelect ariaLabel="루틴 정렬" className="compact-select" name="sort" options={[
            { value: "schedule", label: "시간·시간대순" },
            { value: "name", label: "이름순" },
            { value: "completion", label: "미완료순" },
          ]} value={sort} />
        </div>
        <div className="routine-list compact-routine-list">
          {sortedDayItems.length === 0 ? (
            <div className="empty-state">
              <strong>오늘 예정된 루틴이 없어요.</strong>
              <span>새 루틴 추가 버튼으로 추가해보세요.</span>
            </div>
          ) : (
            sortedDayItems.map((item) => (
              <article className={item.completed ? "routine-item completed" : "routine-item"} key={item.id}>
                <ScrollPreservingForm action={toggleRoutineCompletionAction}>
                  <input name="routineId" type="hidden" value={item.id} />
                  <button
                    aria-label={item.completed ? `${item.name} 완료 취소` : `${item.name} 완료`}
                    className="completion-toggle"
                    type="submit"
                  >
                    {item.completed ? "✓" : ""}
                  </button>
                </ScrollPreservingForm>
                <div className="routine-copy">
                  <strong>{item.name}</strong>
                  {getRoutineScheduleLabel(item) ? <span>{getRoutineScheduleLabel(item)}</span> : null}
                </div>
                <div className="routine-item-actions">
                  <Link className="archive-button" href={`/routines?edit=${item.id}${sort !== "schedule" ? `&sort=${sort}` : ""}`}>수정</Link>
                  <ScrollPreservingForm action={archiveRoutineAction}>
                    <input name="routineId" type="hidden" value={item.id} />
                    <button className="archive-button" type="submit">보관</button>
                  </ScrollPreservingForm>
                </div>
              </article>
            ))
          )}
        </div>

        {editRoutine ? (
          <PersistentDetails className="routine-edit-panel expandable-panel" defaultOpen storageKey={`routine-edit-${editRoutine.id}`}>
            <summary><div><p className="eyebrow">EDIT ROUTINE</p><h2>{editRoutine.name} 수정</h2></div><span aria-hidden="true" className="expand-icon">+</span></summary>
            <EditRoutineForm routine={editRoutine} />
          </PersistentDetails>
        ) : null}

      </section>

      <div className="routine-calendar-block">
        <div className="routine-calendar-tools">
          <span>달성 기록 보기</span>
          <QuerySelect ariaLabel="달력에서 볼 루틴" className="compact-select" name="routine" options={[
            { value: "", label: "전체 루틴" },
            ...Array.from(routinesById.values()).sort((left, right) => left.name.localeCompare(right.name, "ko")).map((item) => ({ value: item.id, label: item.name })),
          ]} value={selectedRoutineId} />
        </div>
        <ActivityCalendar
          circular
          headingAside={<><span>이달 평균</span><strong>{calendarDashboard.monthly.completionRate}%</strong></>}
          hrefForDate={(calendarDate) => `/routines?month=${calendarMonth}&date=${calendarDate}${sort !== "schedule" ? `&sort=${sort}` : ""}${selectedRoutineId ? `&routine=${selectedRoutineId}` : ""}`}
          hrefForMonth={(selectedMonth) => `/routines?month=${selectedMonth}${sort !== "schedule" ? `&sort=${sort}` : ""}${selectedRoutineId ? `&routine=${selectedRoutineId}` : ""}`}
          month={calendarMonth}
          selectedDate={selectedDate}
          title={selectedRoutineId ? `${routinesById.get(selectedRoutineId)?.name ?? "루틴"} 달성 기록` : "루틴 달성 기록"}
          weekStartsOn={profile.week_starts_on}
          values={calendarValues}
        />
      </div>

      <section className="selected-day-card routine-day-detail">
        <div className="selected-day-heading">
          <div>
            <span>{formatShortKoreanDate(selectedDate)}</span>
            <div className="selected-day-title-line"><h2>진행한 루틴</h2><strong>{selectedDay.completionRate}%</strong></div>
          </div>
        </div>
        {selectedReview ? (
          <div className="selected-routine-review">
            <h3>루틴 회고</h3>
            <p>{selectedReview.reflection}</p>
            <AiInsight value={selectedReview.ai_feedback} pendingMessage="아직 생성된 인사이트가 없어요." />
          </div>
        ) : <p>이날 작성한 루틴 회고가 없어요.</p>}
        {selectedDayItems.length === 0 ? <p>이날 배정된 루틴이 없어요.</p> : selectedDayItems.map((item) => (
          <ScrollPreservingForm action={toggleRoutineCompletionAction} className="day-routine-row" key={item.id}>
            <input name="routineId" type="hidden" value={item.id} />
            <input name="routineDate" type="hidden" value={selectedDate} />
            <button aria-label={`${item.name} 완료 상태 변경`} className={item.completed ? "completion-toggle checked" : "completion-toggle"} type="submit">{item.completed ? "✓" : ""}</button>
            <strong>{item.name}</strong>
          </ScrollPreservingForm>
        ))}
      </section>
    </div>
  );
}
