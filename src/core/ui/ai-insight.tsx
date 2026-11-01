import type { Json } from "@/core/db/database.types";
import { parseDailyInsight, parseMonthlyInsight } from "@/core/ai/daily-insight";

function readableText(value: Json | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(readableText).filter(Boolean).join("\n");
  return Object.entries(value).map(([key, item]) => `${key}: ${readableText(item)}`).join("\n\n");
}

type AiInsightProps = {
  value: Json | null;
  pendingMessage?: string;
};

export function AiInsight({
  value,
  pendingMessage = "아직 AI 인사이트가 없어요.",
}: AiInsightProps) {
  const insight = parseDailyInsight(value);
  const monthlyInsight = parseMonthlyInsight(value);

  if (!insight && !monthlyInsight) {
    const fallback = readableText(value);
    return fallback ? <div className="ai-insight-content"><p>{fallback}</p></div> : <p>{pendingMessage}</p>;
  }

  if (monthlyInsight) {
    return (
      <div className="ai-insight-content monthly">
        <section>
          <strong>월간 요약</strong>
          <p>{monthlyInsight.monthly_summary}</p>
        </section>

        <section>
          <strong>눈에 띄었던 변화</strong>
          <p>{monthlyInsight.notable_changes}</p>
        </section>

        <section>
          <strong>잘한 점</strong>
          <p>{monthlyInsight.wins}</p>
        </section>

        <section>
          <strong>개선 포인트</strong>
          <p>{monthlyInsight.improvement_point}</p>
        </section>

        <section>
          <strong>다음 달 목표 수립 팁</strong>
          <p>{monthlyInsight.next_month_goal_tip}</p>
        </section>

        <section>
          <strong>응원</strong>
          <p>{monthlyInsight.encouragement}</p>
        </section>
      </div>
    );
  }

  if (!insight) {
    return <p>{pendingMessage}</p>;
  }

  return (
    <div className="ai-insight-content">

      {insight.core_feedback && (
        <section>
          <strong>♡ 오늘의 마음</strong>
          <p style={{ whiteSpace: "pre-line", lineHeight: 1.8 }}>
            {insight.core_feedback}
          </p>
        </section>
      )}

      {insight.wins && (
        <section>
          <strong>🌱 오늘의 발견</strong>
          <p style={{ whiteSpace: "pre-line", lineHeight: 1.8 }}>
            {insight.wins}
          </p>
        </section>
      )}

      {insight.improvements && (
        <section>
          <strong>💡 조금 더 이해하기</strong>
          <p style={{ whiteSpace: "pre-line", lineHeight: 1.8 }}>
            {insight.improvements}
          </p>
        </section>
      )}

      {insight.self_understanding_tip && (
        <section
          style={{
            backgroundColor: "#FFF5E7",
            borderRadius: "12px",
            padding: "16px",
          }}
        >
          <strong>✨ 나를 이해하는 단서</strong>
          <p style={{ whiteSpace: "pre-line", lineHeight: 1.8 }}>
            {insight.self_understanding_tip}
          </p>
        </section>
      )}

    </div>
  );
}
