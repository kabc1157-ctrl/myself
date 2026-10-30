import type { Json } from "@/core/db/database.types";
import { formatShortKoreanDate } from "@/core/date/local-date";
import { AiInsight } from "@/core/ui/ai-insight";
import { InsightSaveButton } from "@/core/ai/insight-save-button";

type MonthlyInsightItem = {
  id: string;
  category: string;
  source_date: string;
  title: string;
  content: Json;
};

export function MonthlyInsightList({ insights, savedInsightIds }: { insights: MonthlyInsightItem[]; savedInsightIds: Set<string> }) {
  return (
    <div className="monthly-insight-list">
      {insights.map((insight) => (
        <details className={`monthly-insight-item ${insight.category}`} key={insight.id}>
          <summary>
            <div>
              <span>{({ journal: "일기", routine: "루틴", note: "메모", exercise: "운동", planner: "일정", reading: "독서", investment: "투자" } as Record<string, string>)[insight.category] ?? insight.category} · {formatShortKoreanDate(insight.source_date).replace(/ \d+일$/, "")}</span>
              <strong>{insight.title}</strong>
            </div>
            <b aria-hidden="true">+</b>
          </summary>
          <AiInsight value={insight.content} />
          <InsightSaveButton insightId={insight.id} saved={savedInsightIds.has(insight.id)} />
        </details>
      ))}
    </div>
  );
}
