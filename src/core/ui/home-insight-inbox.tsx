"use client";

import { useEffect, useState } from "react";
import { markAiInsightReadAction } from "@/core/ai/actions";
import { InsightSaveButton } from "@/core/ai/insight-save-button";
import { HomeAiInsight } from "@/core/ui/home-ai-insight";
import { formatShortKoreanDate } from "@/core/date/local-date";
import type { Json } from "@/core/db/database.types";

type Insight = {
  id: string;
  category: string;
  scope: string;
  source_date: string;
  title: string;
  content: Json;
};

const categoryLabels: Record<string, string> = {
  journal: "일기",
  routine: "루틴",
  note: "메모",
  exercise: "운동",
  planner: "일정",
  reading: "독서",
  investment: "투자",
};

export function HomeInsightInbox({ insights, savedInsightIds, userId }: { insights: Insight[]; savedInsightIds: string[]; userId: string }) {
  const storageKey = `ieumsae:home-new-insights:${userId}`;
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(storageKey) === "collapsed");
  }, [storageKey]);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(storageKey, next ? "collapsed" : "expanded");
      return next;
    });
  }

  return <section className={`home-insight-inbox${collapsed ? " is-collapsed" : ""}`} aria-labelledby="home-insights-title">
    <button aria-controls="home-insight-list" aria-expanded={!collapsed} className="home-insight-heading" onClick={toggleCollapsed} type="button">
      <span><span>AI INSIGHT</span><strong id="home-insights-title">뉴 인사이트</strong></span>
      <span className="home-insight-heading-tools"><b>{insights.length}개</b><span aria-hidden="true" className="home-insight-chevron">{collapsed ? "⌄" : "⌃"}</span></span>
    </button>
    <div className="home-insight-list" id="home-insight-list">
      {insights.map((insight) => {
        const category = insight.category.trim().toLowerCase();
        return <article className={`home-insight-card ${category}`} key={insight.id}>
        <div className="home-insight-meta"><span>{insight.scope === "monthly" ? "월간" : insight.scope === "weekly" ? "주간" : "오늘"} · {categoryLabels[category] ?? category}</span><time dateTime={insight.source_date}>{formatShortKoreanDate(insight.source_date)}</time></div>
        <HomeAiInsight category={category} title={insight.title} value={insight.content} />
        <div className="insight-card-actions">
          <InsightSaveButton insightId={insight.id} saved={savedInsightIds.includes(insight.id)} />
          <form action={markAiInsightReadAction}><input name="insightId" type="hidden" value={insight.id} /><button className="insight-read-button" type="submit">읽었어요</button></form>
        </div>
      </article>;
      })}
    </div>
  </section>;
}
