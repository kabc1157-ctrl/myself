"use client";

import { useEffect, useState } from "react";
import { markAiInsightReadAction } from "@/core/ai/actions";
import { InsightSaveButton } from "@/core/ai/insight-save-button";
import { AiInsight } from "@/core/ui/ai-insight";
import { parseRoutineInsight } from "@/core/ai/routine-insight";
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
      {insights.map((insight) => <article className={`home-insight-card ${insight.category}`} key={insight.id}>
        <div className="home-insight-meta"><span>{insight.scope === "monthly" ? "월간" : insight.scope === "weekly" ? "주간" : "오늘"} · {categoryLabels[insight.category] ?? insight.category}</span><time dateTime={insight.source_date}>{formatShortKoreanDate(insight.source_date)}</time></div>
        {insight.category === "routine" ? <HomeRoutineInsight value={insight.content} /> : <AiInsight value={insight.content} />}
        <div className="insight-card-actions">
          <InsightSaveButton insightId={insight.id} saved={savedInsightIds.includes(insight.id)} />
          <form action={markAiInsightReadAction}><input name="insightId" type="hidden" value={insight.id} /><button className="insight-read-button" type="submit">읽었어요</button></form>
        </div>
      </article>)}
    </div>
  </section>;
}

function HomeRoutineInsight({ value }: { value: Json | null }) {
  const insight = parseRoutineInsight(value);
  if (!insight) return <p>인사이트를 표시할 수 없어요.</p>;
  if (insight.insufficient_data && !insight.title && !insight.observation && !insight.self_discovery && !insight.suggestion && !insight.evidence.length) {
    return <p>기록이 조금 더 쌓이면 루틴 인사이트를 보여드릴게요.</p>;
  }
  const discovery = [insight.evidence.join("\n"), insight.observation].filter(Boolean).join("\n\n");
  return <div className="ai-insight-content routine-home-insight">
    {insight.title ? <p className="routine-ai-insight-title">{insight.title}</p> : null}
    {discovery ? <section><strong>오늘의 발견</strong><p>{discovery}</p></section> : null}
    {insight.suggestion ? <section><strong>내일의 작은 제안</strong><p>{insight.suggestion}</p></section> : null}
    {insight.self_discovery ? <section className="routine-ai-insight-highlight"><strong>나에 대한 발견</strong><p>{insight.self_discovery}</p></section> : null}
  </div>;
}
