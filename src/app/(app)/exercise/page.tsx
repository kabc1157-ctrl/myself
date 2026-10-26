import { verifySession } from "@/core/auth/session";
import { getLatestAiInsight } from "@/core/ai/insight-inbox";
import { PageInsightPanel } from "@/core/ai/page-insight-panel";
import { formatShortKoreanDate, getLocalDate, isMonth } from "@/core/date/local-date";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { AiInsight } from "@/core/ui/ai-insight";
import { ActivityCalendar } from "@/core/ui/activity-calendar";
import { getOrCreateProfile } from "@/core/user/profile-repository";
import { saveExerciseAction } from "@/modules/life/application/actions";
import { getExerciseLogs } from "@/modules/life/infrastructure/repository";

type Props = { searchParams: Promise<{ date?: string; month?: string }> };
const labels = { cardio: "유산소", stretching: "스트레칭", strength: "근력" } as const;
function exerciseTypeLabel(value: string) { return labels[value as keyof typeof labels] ?? value; }

export default async function ExercisePage({ searchParams }: Props) {
  const [session, supabase, query] = await Promise.all([verifySession(), createServerSupabaseClient(), searchParams]);
  const profile = await getOrCreateProfile(supabase, session.userId);
  const today = getLocalDate(profile.timezone);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(query.date ?? "") ? query.date! : today;
  const month = isMonth(query.month ?? "") ? query.month! : date.slice(0, 7);
  const [logs, latestInsight] = await Promise.all([getExerciseLogs(supabase, session.userId), getLatestAiInsight(supabase, session.userId, "exercise")]);
  const selected = logs.find((log) => log.exercise_date === date);
  return <div className="feature-page">
    <section className="settings-card"><div className="card-heading"><span>나의 움직임</span><h1>운동 기록장</h1></div>
      <form action={saveExerciseAction} className="feature-form">
        <label>날짜<input defaultValue={date} name="date" type="date" required /></label>
        <label>운동 종류<select defaultValue={selected?.exercise_type ?? "cardio"} name="type"><option value="cardio">유산소</option><option value="stretching">스트레칭</option><option value="strength">근력</option></select></label>
        <label>오늘 한 운동<textarea defaultValue={selected?.activity} name="activity" required rows={3}/></label>
        <label>집중 부위<input defaultValue={selected?.focus_area ?? ""} name="focusArea" /></label>
        <label>메모<textarea defaultValue={selected?.memo ?? ""} name="memo" rows={4}/></label>
        <button className="primary-button">운동 기록 저장</button>
      </form>
    </section>
    <ActivityCalendar hrefForDate={(selectedDate) => `/exercise?month=${month}&date=${selectedDate}`} hrefForMonth={(selectedMonth) => `/exercise?month=${selectedMonth}`} month={month} selectedDate={date} title="운동 달력" values={logs.filter((log) => log.exercise_date.startsWith(month)).map((log) => ({ date: log.exercise_date, label: exerciseTypeLabel(log.exercise_type), level: log.exercise_type === "strength" ? 5 : log.exercise_type === "cardio" ? 4 : 3 }))} weekStartsOn={profile.week_starts_on}/>
    <section className="selected-day-card">
      <div><span>{formatShortKoreanDate(date)}</span><h2>{selected ? exerciseTypeLabel(selected.exercise_type) : "이날의 운동 기록이 없어요"}</h2></div>
      {selected ? <><div className="entry-reading"><h3>오늘 한 운동</h3><p>{selected.activity}</p>{selected.focus_area ? <p><strong>집중 부위</strong> {selected.focus_area}</p> : null}{selected.memo ? <p><strong>메모</strong> {selected.memo}</p> : null}</div><div className="mini-insight"><strong>AI 인사이트</strong><AiInsight value={selected.ai_feedback} pendingMessage="AI 인사이트가 준비되면 이곳에 표시돼요." /></div></> : <p>운동한 날짜를 누르면 입력한 기록과 AI 인사이트를 볼 수 있어요.</p>}
    </section>
    <PageInsightPanel insight={latestInsight} />
  </div>;
}
