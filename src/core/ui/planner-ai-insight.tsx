import type { Json } from "@/core/db/database.types";
import { parseDailyInsight } from "@/core/ai/daily-insight";

function display(value: string | string[] | undefined) { return Array.isArray(value) ? value.join("\n") : value ?? ""; }

export function PlannerAiInsight({ value, pendingMessage }: { value: Json | null; pendingMessage: string }) {
  const insight = parseDailyInsight(value);
  if (!insight) return <p>{pendingMessage}</p>;
  const sections = [["♡ 오늘의 생각", insight.core_feedback, ""], ["🌱 오늘의 발견", display(insight.wins), ""], ["💡 조금 더 이해하기", display(insight.improvements), ""], ["✨ 나를 이해하는 단서", display(insight.self_understanding_tip), "planner-ai-insight-highlight"]] as const;
  return <div className="ai-insight-content planner-ai-insight">{sections.map(([title, content, className]) => content.trim() ? <section className={className} key={title}><strong>{title}</strong><p>{content}</p></section> : null)}</div>;
}
