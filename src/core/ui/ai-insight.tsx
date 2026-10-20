import type { Json } from "@/core/db/database.types";
import { parseDailyInsight, parseMonthlyInsight } from "@/core/ai/daily-insight";

type AiInsightProps = {
  value: Json | null;
  pendingMessage?: string;
};

export function AiInsight({ value, pendingMessage = "아직 AI 인사이트가 없어요." }: AiInsightProps) {
  const insight = parseDailyInsight(value);
  const monthlyInsight = parseMonthlyInsight(value);

  if (!insight && !monthlyInsight) return <p>{pendingMessage}</p>;

  if (monthlyInsight) {
    return (
      <div className="ai-insight-content monthly">
        <section><strong>월간 요약</strong><p>{monthlyInsight.monthly_summary}</p></section>
        <section><strong>눈에 띄었던 변화</strong><p>{monthlyInsight.notable_changes}</p></section>
        <section><strong>잘한 점</strong><p>{monthlyInsight.wins}</p></section>
        <section><strong>개선 포인트</strong><p>{monthlyInsight.improvement_point}</p></section>
        <section><strong>다음 달 목표 수립 팁</strong><p>{monthlyInsight.next_month_goal_tip}</p></section>
        <section><strong>응원</strong><p>{monthlyInsight.encouragement}</p></section>
      </div>
    );
  }

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
