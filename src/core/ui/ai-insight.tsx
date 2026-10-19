import type { Json } from "@/core/db/database.types";
import { parseDailyInsight } from "@/core/ai/daily-insight";

type AiInsightProps = {
  value: Json | null;
  pendingMessage?: string;
};

export function AiInsight({ value, pendingMessage = "아직 AI 인사이트가 없어요." }: AiInsightProps) {
  const insight = parseDailyInsight(value);

  if (!insight) return <p>{pendingMessage}</p>;

  return (
    <div className="ai-insight-content">
      <section><strong>오늘의 핵심 피드백</strong><p>{insight.core_feedback}</p></section>
      <section><strong>잘한 점</strong><ul>{insight.wins.map((item) => <li key={item}>{item}</li>)}</ul></section>
      <section><strong>개선할 점</strong><ul>{insight.improvements.map((item) => <li key={item}>{item}</li>)}</ul></section>
      <section><strong>내일 실천할 행동 한 가지</strong><p>{insight.tomorrow_action}</p></section>
    </div>
  );
}
