import type { Json } from "@/core/db/database.types";
import { formatShortKoreanDate } from "@/core/date/local-date";
import { AiInsight } from "@/core/ui/ai-insight";

type MonthlyInsightItem = {
  id: string;
  category: string;
  source_date: string;
  title: string;
  content: Json;
};

export function MonthlyInsightList({ insights }: { insights: MonthlyInsightItem[] }) {
  return (
    <div className="monthly-insight-list">
      {insights.map((insight) => (
        <details className={`monthly-insight-item ${insight.category}`} key={insight.id}>
          <summary>
            <div>
              <span>{insight.category === "journal" ? "일기" : "루틴"} · {formatShortKoreanDate(insight.source_date).replace(/ \d+일$/, "")}</span>
              <strong>{insight.title}</strong>
            </div>
            <b aria-hidden="true">+</b>
          </summary>
          <AiInsight value={insight.content} />
        </details>
      ))}
    </div>
  );
}
