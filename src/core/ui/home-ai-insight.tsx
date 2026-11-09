import type { Json } from "@/core/db/database.types";
import { parseDailyInsight } from "@/core/ai/daily-insight";
import { parseRoutineInsight } from "@/core/ai/routine-insight";

function display(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value.filter(Boolean).join("\n") : value?.trim() ?? "";
}

function Section({ title, value }: { title: string; value: string }) {
  if (!value) return null;
  return <section><strong>{title}</strong><p>{value}</p></section>;
}

export function HomeAiInsight({ category, title, value }: { category: string; title?: string | null; value: Json | null }) {
  const routine = category === "routine" ? parseRoutineInsight(value) : null;
  const daily = routine ? null : parseDailyInsight(value);

  if (!routine && !daily) {
    return <div className="ai-insight-content home-ai-insight"><p>인사이트를 표시할 수 없어요.</p></div>;
  }

  if (routine) {
    const discovery = [routine.evidence.join("\n"), routine.observation].filter(Boolean).join("\n\n");
    if (routine.insufficient_data && !routine.title && !discovery && !routine.suggestion && !routine.self_discovery) {
      return <div className="ai-insight-content home-ai-insight"><p>기록이 조금 더 쌓이면 인사이트를 보여드릴게요.</p></div>;
    }
    return <div className="ai-insight-content home-ai-insight">
      {(routine.title ?? title) ? <p className="home-ai-insight-title">{routine.title ?? title}</p> : null}
      <Section title="오늘의 발견" value={discovery} />
      <Section title="내일의 작은 제안" value={routine.suggestion ?? ""} />
      <Section title="나에 대한 발견" value={routine.self_discovery ?? ""} />
    </div>;
  }

  if (!daily) {
    return <div className="ai-insight-content home-ai-insight"><p>인사이트를 표시할 수 없어요.</p></div>;
  }

  const discovery = [daily.core_feedback, display(daily.wins), display(daily.improvements)]
    .filter(Boolean)
    .join("\n\n");
  return <div className="ai-insight-content home-ai-insight">
    {title ? <p className="home-ai-insight-title">{title}</p> : null}
    <Section title="오늘의 발견" value={discovery} />
    <Section title="내일의 작은 제안" value={display(daily.tomorrow_action)} />
    <Section title="나에 대한 발견" value={display(daily.self_understanding_tip)} />
  </div>;
}
