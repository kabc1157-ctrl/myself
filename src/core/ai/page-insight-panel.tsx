import { formatShortKoreanDate } from "@/core/date/local-date";
import { AiInsight } from "@/core/ui/ai-insight";
import type { Json } from "@/core/db/database.types";

type Insight = { source_date: string; title: string; content: Json } | null;

export function PageInsightPanel({ insight }: { insight: Insight }) {
  return <section className="settings-card page-ai-insight-panel">
    <div className="card-heading"><span>{insight ? formatShortKoreanDate(insight.source_date) : "나의 기록 분석"}</span><h2>AI 인사이트</h2></div>
    {insight ? <><h3>{insight.title}</h3><AiInsight value={insight.content} /></> : <p>AI 인사이트가 준비되면 이곳에 표시돼요.</p>}
  </section>;
}
