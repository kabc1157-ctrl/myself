import { verifySession } from "@/core/auth/session";
import { formatShortKoreanDate, getLocalDate, isMonth } from "@/core/date/local-date";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { getTodayGoogleCalendarEvents } from "@/core/integrations/google-calendar/repository";
import { ActivityCalendar } from "@/core/ui/activity-calendar";
import { AiInsight } from "@/core/ui/ai-insight";
import { PersistentDetails } from "@/core/ui/persistent-details";
import { getOrCreateProfile } from "@/core/user/profile-repository";
import { savePlannerReviewAction } from "@/modules/life/application/actions";
import { getExerciseLogs, getFeatureSettings, getNotes, getPlannerData } from "@/modules/life/infrastructure/repository";
import { PlannerBoard } from "@/modules/life/ui/planner-board";

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
  const backlog = tasks.filter((task) => !task.planned_date && !task.completed_at);
  const review = reviews.find((item) => item.review_date === date);
  const calendarDates = new Set([...tasks.flatMap((task) => task.planned_date ? [task.planned_date] : []), ...reviews.map((item) => item.review_date)]);

  return <div className="feature-page planner-page">
    <PersistentDetails className="settings-card expandable-panel planner-review-panel" storageKey="planner-review"><summary><div className="card-heading"><span>{formatShortKoreanDate(date)}</span><h1>일정 회고 쓰기</h1></div><span className="expand-icon">+</span></summary><form action={savePlannerReviewAction} className="feature-form"><label>날짜<input className="record-date-input" defaultValue={date} name="date" type="date" /></label><label>오늘의 시간 사용은 어땠나요?<textarea defaultValue={review?.reflection} name="reflection" required rows={5}/></label><button className="primary-button">회고 저장</button></form></PersistentDetails>

    <PlannerBoard backlog={backlog} date={date} dayEnd={featureSettings.planner_day_end.slice(0, 5)} dayStart={featureSettings.planner_day_start.slice(0, 5)} events={googleCalendar.events} exercises={exercises} key={`${date}:${tasks.map((task) => `${task.id}:${task.priority ?? ""}:${task.start_time ?? ""}:${task.completed_at ?? ""}`).join("|")}`} notes={notes} tasks={dayTasks} timeZone={profile.timezone} />

    <ActivityCalendar hrefForDate={(selectedDate) => `/planner?month=${month}&date=${selectedDate}`} hrefForMonth={(selectedMonth) => `/planner?month=${selectedMonth}`} month={month} selectedDate={date} title="일정 기록 달력" values={Array.from(calendarDates).filter((item) => item.startsWith(month)).map((item) => ({ date: item, label: `${tasks.filter((task) => task.planned_date === item).length}개`, level: Math.min(5, Math.max(1, tasks.filter((task) => task.planned_date === item).length)) }))} weekStartsOn={profile.week_starts_on}/>

    <section className="selected-day-card planner-day-detail"><div><span>{formatShortKoreanDate(date)}</span><h2>우선순위와 일정 회고</h2></div><div className="planner-selected-priorities">{[1,2,3].map((priority) => { const task = dayTasks.find((item) => item.priority === priority); return <p key={priority}><b>{priority}</b><span>{task?.title ?? "지정하지 않음"}</span></p>; })}</div>{review ? <><div className="entry-reading"><h3>일정 회고</h3><p>{review.reflection}</p></div><PersistentDetails className="create-panel" storageKey={`planner-review-edit-${date}`}><summary>일정 회고 수정</summary><form action={savePlannerReviewAction} className="feature-form"><input name="date" type="hidden" value={date}/><label>일정 회고<textarea defaultValue={review.reflection} name="reflection" required rows={5}/></label><button className="secondary-button">수정 저장</button></form></PersistentDetails></> : <p>이날 작성한 일정 회고가 없어요.</p>}<div className="mini-insight"><strong>AI 인사이트</strong><AiInsight value={review?.ai_feedback ?? null} pendingMessage="아직 이 날짜의 AI 인사이트가 없어요." /></div></section>
  </div>;
}
