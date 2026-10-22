import { verifySession } from "@/core/auth/session";
import { getLocalDate } from "@/core/date/local-date";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { AiInsight } from "@/core/ui/ai-insight";
import { getOrCreateProfile } from "@/core/user/profile-repository";
import { saveExerciseAction } from "@/modules/life/application/actions";
import { getExerciseLogs } from "@/modules/life/infrastructure/repository";

type Props = { searchParams: Promise<{ date?: string }> };
const labels = { cardio: "유산소", stretching: "스트레칭", strength: "근력" } as const;
function exerciseTypeLabel(value: string) { return labels[value as keyof typeof labels] ?? value; }

export default async function ExercisePage({ searchParams }: Props) {
  const [session, supabase, query] = await Promise.all([verifySession(), createServerSupabaseClient(), searchParams]);
  const profile = await getOrCreateProfile(supabase, session.userId);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(query.date ?? "") ? query.date! : getLocalDate(profile.timezone);
  const logs = await getExerciseLogs(supabase, session.userId);
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
      {selected?.ai_feedback ? <div className="feature-insight"><h2>운동 인사이트</h2><AiInsight value={selected.ai_feedback}/></div> : null}
    </section>
    <section className="settings-card"><h2>운동 달력</h2><div className="date-chip-list">{logs.map((log) => <a href={`/exercise?date=${log.exercise_date}`} key={log.id}><strong>{log.exercise_date}</strong><span>{exerciseTypeLabel(log.exercise_type)}</span></a>)}</div></section>
  </div>;
}
