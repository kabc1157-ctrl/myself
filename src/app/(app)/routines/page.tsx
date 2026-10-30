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
import { PersistentDetails } from "@/core/ui/persistent-details";
import { QuerySelect } from "@/core/ui/query-select";
import { ScrollPreservingForm } from "@/core/ui/scroll-preserving-form";
import { getOrCreateProfile } from "@/core/user/profile-repository";
import {
  getRoutineDailyReview,
  getRoutineDashboard,
} from "@/modules/routines/infrastructure/routine-repository";
import { getRoutineScheduleLabel, groupRoutineItemsByPeriod, sortRoutineItems, type RoutineSort } from "@/modules/routines/domain/routine-sort";

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
  const dashboard = await getRoutineDashboard(supabase, date, profile.week_starts_on);
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
  const routinePeriodGroups = groupRoutineItemsByPeriod(sortedDayItems);
  const selectedDayItems = selectedRoutineId ? selectedDay.items.filter((item) => item.id === selectedRoutineId) : selectedDay.items;
  const completedSelectedDayItems = selectedDayItems.filter((item) => item.completed);
  const incompleteSelectedDayItems = selectedDayItems.filter((item) => !item.completed);
  const currentMonth = date.slice(0, 7);
  const selectedRoutineMonthCutoff = calendarMonth < currentMonth
    ? shiftDate(getMonthRange(calendarMonth).endExclusive, -1)
    : calendarMonth === currentMonth ? date : "";
  const selectedRoutineMonthStats = selectedRoutineId
    ? calendarDashboard.calendar
        .filter((calendarDay) => selectedRoutineMonthCutoff && calendarDay.date <= selectedRoutineMonthCutoff)
        .reduce((summary, calendarDay) => {
          const item = calendarDay.items.find((candidate) => candidate.id === selectedRoutineId);
          if (!item) return summary;
          return { completed: summary.completed + (item.completed ? 1 : 0), total: summary.total + 1 };
        }, { completed: 0, total: 0 })
    : null;
  const selectedRoutineMonthlyAverage = selectedRoutineMonthStats
    ? selectedRoutineMonthStats.total === 0 ? 0 : Math.round((selectedRoutineMonthStats.completed / selectedRoutineMonthStats.total) * 100)
    : calendarDashboard.monthly.completionRate;
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
      <section className="routine-main" aria-label="루틴 회고 쓰기">
        <PersistentDetails className="create-panel journal-editor routine-review-editor record-hero-editor" defaultOpen={false} storageKey="routines-daily-review">
          <summary><strong>{selectedReview ? "루틴 회고 수정" : "루틴 회고 쓰기"}</strong><span className="expand-icon">+</span></summary>
          <DailyReviewForm initialReflection={selectedReview?.reflection ?? ""} label="루틴은 어땠나요?" reviewDate={selectedDate} />
        </PersistentDetails>
        <div className="section-heading routine-progress-heading">
          <div className="header-progress-mini" aria-label="주간 및 월간 루틴 진행률">
            <span>이번 주 <strong>{dashboard.weekly.completionRate}%</strong></span>
            <span>이번 달 <strong>{dashboard.monthly.completionRate}%</strong></span>
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

        <div className="routine-list-heading">
          <span>오늘의 루틴</span>
          <QuerySelect ariaLabel="루틴 정렬" className="compact-select" name="sort" options={[
            { value: "schedule", label: "시간·시간대순" },
            { value: "name", label: "이름순" },
            { value: "completion", label: "미완료순" },
          ]} value={sort} />
        </div>
        <div className="routine-period-groups">
          {sortedDayItems.length === 0 ? (
            <div className="empty-state">
              <strong>오늘 예정된 루틴이 없어요.</strong>
              <span>새 루틴 추가 버튼으로 추가해보세요.</span>
            </div>
          ) : (
            routinePeriodGroups.map((group) => (
              <PersistentDetails className={`routine-period-group ${group.id}`} storageKey={`routine-period-${group.id}`} key={group.id}>
                <summary>
                  <span>{group.label}</span>
                  <strong>{group.items.filter((item) => item.completed).length}/{group.items.length}</strong>
                  <b aria-hidden="true">+</b>
                </summary>
                <div className="routine-list compact-routine-list">
                  {group.items.map((item) => (
                    <article className={item.completed ? "routine-item completed" : "routine-item"} key={item.id}>
                      <ScrollPreservingForm action={toggleRoutineCompletionAction}>
                        <input name="routineId" type="hidden" value={item.id} />
                        <button aria-label={item.completed ? `${item.name} 완료 취소` : `${item.name} 완료`} className="completion-toggle" type="submit">
                          {item.completed ? "✓" : ""}
                        </button>
                      </ScrollPreservingForm>
                      <div className="routine-copy">
                        <strong>{item.name}</strong>
                        {getRoutineScheduleLabel(item) ? <span>{getRoutineScheduleLabel(item)}</span> : null}
                      </div>
                      <div className="routine-item-actions">
                        <Link className="archive-button" href={`/routines?edit=${item.id}${sort !== "schedule" ? `&sort=${sort}` : ""}`} scroll={false}>수정</Link>
                        <ScrollPreservingForm action={archiveRoutineAction}>
                          <input name="routineId" type="hidden" value={item.id} />
                          <button className="archive-button" type="submit">보관</button>
                        </ScrollPreservingForm>
                      </div>
                    </article>
                  ))}
                </div>
              </PersistentDetails>
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
          <QuerySelect ariaLabel="달력에서 볼 루틴" className="compact-select" name="routine" options={[
            { value: "", label: "전체 루틴" },
            ...Array.from(routinesById.values()).sort((left, right) => left.name.localeCompare(right.name, "ko")).map((item) => ({ value: item.id, label: item.name })),
          ]} value={selectedRoutineId} />
        </div>
        <ActivityCalendar
          circular
          headingAside={<><span>이달 평균</span><strong>{selectedRoutineMonthlyAverage}%</strong></>}
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
        <div className="mini-insight selected-day-insight"><strong>AI 인사이트</strong><AiInsight value={selectedReview?.ai_feedback ?? null} pendingMessage="아직 이 날짜의 AI 인사이트가 없어요." /></div>
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
          </div>
        ) : <p>이날 작성한 루틴 회고가 없어요.</p>}
        {selectedDayItems.length === 0 ? <p>이날 배정된 루틴이 없어요.</p> : <div className="routine-day-groups">
          <PersistentDetails className="routine-day-group completed" storageKey={`routine-day-completed-${selectedDate}-${selectedRoutineId || "all"}`}>
            <summary><span>완료한 루틴</span><strong>{completedSelectedDayItems.length}</strong><b aria-hidden="true">+</b></summary>
            <div>{completedSelectedDayItems.length === 0 ? <p>완료한 루틴이 없어요.</p> : completedSelectedDayItems.map((item) => (
              <ScrollPreservingForm action={toggleRoutineCompletionAction} className="day-routine-row" key={item.id}>
                <input name="routineId" type="hidden" value={item.id} />
                <input name="routineDate" type="hidden" value={selectedDate} />
                <button aria-label={`${item.name} 완료 상태 변경`} className="completion-toggle checked" type="submit">✓</button>
                <strong>{item.name}</strong>
              </ScrollPreservingForm>
            ))}</div>
          </PersistentDetails>
          <PersistentDetails className="routine-day-group incomplete" storageKey={`routine-day-incomplete-${selectedDate}-${selectedRoutineId || "all"}`}>
            <summary><span>미완료 루틴</span><strong>{incompleteSelectedDayItems.length}</strong><b aria-hidden="true">+</b></summary>
            <div>{incompleteSelectedDayItems.length === 0 ? <p>미완료 루틴이 없어요.</p> : incompleteSelectedDayItems.map((item) => (
              <ScrollPreservingForm action={toggleRoutineCompletionAction} className="day-routine-row" key={item.id}>
                <input name="routineId" type="hidden" value={item.id} />
                <input name="routineDate" type="hidden" value={selectedDate} />
                <button aria-label={`${item.name} 완료 상태 변경`} className="completion-toggle" type="submit" />
                <strong>{item.name}</strong>
              </ScrollPreservingForm>
            ))}</div>
          </PersistentDetails>
        </div>}
      </section>
    </div>
  );
}
