import type { Json } from "@/core/db/database.types";
import { parseRoutineInsight } from "@/core/ai/routine-insight";

export function RoutineAiInsight({ value, pendingMessage }: { value: Json | null; pendingMessage: string }) {
  const insight = parseRoutineInsight(value);
  if (!insight) return <p>{pendingMessage}</p>;
  if (insight.insufficient_data && !insight.observation && !insight.self_discovery && !insight.suggestion && !insight.evidence.length) {
    return <p>기록이 조금 더 쌓이면 루틴 인사이트를 보여드릴게요.</p>;
  }
  return (
    <div className="ai-insight-content routine-ai-insight">
      {insight.title ? <p className="routine-ai-insight-title">{insight.title}</p> : null}
      {insight.observation ? <section><strong>🌿 오늘의 루틴</strong><p>{insight.observation}</p></section> : null}
      {insight.self_discovery ? <section className="routine-ai-insight-highlight"><strong>💡 오늘의 발견</strong><p>{insight.self_discovery}</p></section> : null}
      {insight.suggestion ? <section className="routine-ai-insight-highlight"><strong>✨ 작은 변화 제안</strong><p>{insight.suggestion}</p></section> : null}
      {insight.evidence.length ? <details className="routine-ai-insight-evidence"><summary>분석 근거</summary><ul>{insight.evidence.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></details> : null}
      {insight.insufficient_data && !insight.observation && !insight.self_discovery && !insight.suggestion ? <p>기록이 조금 더 쌓이면 더 정확한 인사이트를 보여드릴게요.</p> : null}
    </div>
  );
}
