import { verifySession } from "@/core/auth/session";
import { formatShortKoreanDate, getLocalDate, isMonth } from "@/core/date/local-date";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { getTodayGoogleCalendarEvents } from "@/core/integrations/google-calendar/repository";
import { ActivityCalendar } from "@/core/ui/activity-calendar";
import { PlannerAiInsight as AiInsight } from "@/core/ui/planner-ai-insight";
import { AiMemoButton } from "@/core/ai/ai-memo-button";
import { getOrCreateProfile } from "@/core/user/profile-repository";
import { getExerciseLogs, getFeatureSettings, getNotes, getPlannerData } from "@/modules/life/infrastructure/repository";
import { PlannerBoard } from "@/modules/life/ui/planner-board";
import { PlannerReviewForm } from "@/modules/life/ui/planner-review-form";

type Props = { searchParams: Promise<{ date?: string; month?: string }> };

export default async function PlannerPage({ searchParams }: Props) {
  const [session, supabase, query] = await Promise.all([verifySession(), createServerSupabaseClient(), searchParams]);
  const profile = await getOrCreateProfile(supabase, session.userId);
  const today = getLocalDate(profile.timezone);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(query.date ?? "") ? query.date! : today;
  const month = isMonth(query.month ?? "") ? query.month! : date.slice(0, 7);
  const [{ tasks, reviews }, googleCalendar, notes, exercises, featureSettings] = await Promise.all([
    getPlannerData(supabase, session.userId),
    getTodayGoogleCalendarEvents(supabase, session.userId, date, profile.timezone, false),
    getNotes(supabase, session.userId),
    getExerciseLogs(supabase, session.userId),
    getFeatureSettings(supabase, session.userId),
  ]);
  const dayTasks = tasks.filter((task) => task.planned_date === date);
  const backlog = tasks.filter((task) => !task.planned_date);
  const review = reviews.find((item) => item.review_date === date);
  const priorityDates = new Set([...tasks.flatMap((task) => task.planned_date ? [task.planned_date] : []), date]);
  const priorityCountForDate = (calendarDate: string) => tasks.filter((task) => task.planned_date === calendarDate && task.priority !== null).length;

  return <div className="feature-page planner-page">
    <PlannerReviewForm date={date} displayDate={formatShortKoreanDate(date)} storageKey="planner-review" />

    <PlannerBoard backlog={backlog} date={date} dayEnd={featureSettings.planner_day_end.slice(0, 5)} dayStart={featureSettings.planner_day_start.slice(0, 5)} events={googleCalendar.events} exercises={exercises} key={`${date}:${tasks.map((task) => `${task.id}:${task.priority ?? ""}:${task.start_time ?? ""}`).join("|")}`} notes={notes} tasks={dayTasks} timeZone={profile.timezone} />

    <ActivityCalendar hrefForDate={(selectedDate) => `/planner?month=${month}&date=${selectedDate}`} hrefForMonth={(selectedMonth) => `/planner?month=${selectedMonth}`} month={month} selectedDate={date} title="일정 기록 달력" values={Array.from(priorityDates).filter((item) => item.startsWith(month)).map((item) => { const count = priorityCountForDate(item); return { date: item, label: `${count}개`, level: 0 }; }).filter((item) => item.label !== "0개")} weekStartsOn={profile.week_starts_on}/>

    <section className="selected-day-card planner-day-detail"><div><span>{formatShortKoreanDate(date)}</span><h2>오늘의 일정</h2></div><section className="planner-selected-section"><h3>우선순위</h3><div className="planner-selected-priorities">{[1,2,3].map((priority) => { const task = dayTasks.find((item) => item.priority === priority); return <p key={priority}><b>{priority}</b><span>{task?.title ?? "지정하지 않음"}</span></p>; })}</div></section><section className="planner-selected-section planner-selected-calendar"><h3>오늘의 일정</h3>{googleCalendar.events.length ? googleCalendar.events.map((event) => <p key={event.id}><time>{event.startLabel}</time><span>{event.title}</span></p>) : <p className="planner-selected-empty">오늘 등록된 캘린더 일정이 없어요.</p>}</section>{review ? <><div className="entry-reading"><h3>일정 회고</h3><p>{review.reflection}</p></div><PlannerReviewForm date={date} edit reflection={review.reflection} storageKey={`planner-review-edit-${date}`} /></> : <p>이날 작성한 일정 회고가 없어요.</p>}<div className="mini-insight"><strong>AI 인사이트</strong><AiInsight value={review?.ai_feedback ?? null} pendingMessage="아직 이 날짜의 AI 인사이트가 없어요." />{review?.ai_feedback ? <AiMemoButton source="planner_review" sourceId={review.id} sourceUrl={`/planner?month=${month}&date=${date}`} /> : null}</div></section>
  </div>;
}
