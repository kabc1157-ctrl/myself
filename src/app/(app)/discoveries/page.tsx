import { AiInsight } from "@/core/ui/ai-insight";
import { InsightSaveButton } from "@/core/ai/insight-save-button";
import { getSavedAiInsights } from "@/core/ai/insight-inbox";
import { verifySession } from "@/core/auth/session";
import { formatShortKoreanDate } from "@/core/date/local-date";
import { createServerSupabaseClient } from "@/core/db/supabase/server";

export const dynamic = "force-dynamic";

export default async function DiscoveriesPage() {
  const [session, supabase] = await Promise.all([verifySession(), createServerSupabaseClient()]);
  const savedInsights = await getSavedAiInsights(supabase, session.userId);

  return (
    <div className="discoveries-page">
      <header className="page-heading compact-page-heading">
        <div><p className="eyebrow page-menu-label">나의 발견</p><h1>기억하고 싶은 인사이트</h1></div>
        <p>다시 보고 싶은 분석을 한곳에 모아두세요.</p>
      </header>
      {savedInsights.length === 0 ? (
        <div className="empty-state"><strong>아직 기억한 인사이트가 없어요.</strong><span>홈이나 루틴 인사이트에서 ‘기억하기’를 눌러보세요.</span></div>
      ) : (
        <div className="discovery-list">
          {savedInsights.map((saved) => {
            const insight = saved.insight;
            if (!insight || Array.isArray(insight)) return null;
            return (
              <article className="discovery-card" key={saved.id}>
                <div className="home-insight-meta">
                  <span>{insight.category === "routine" ? "루틴" : "일기"} · {insight.scope === "monthly" ? "월간" : insight.scope === "weekly" ? "주간" : "일간"}</span>
                  <time dateTime={insight.source_date}>{formatShortKoreanDate(insight.source_date)}</time>
                </div>
                <h2>{insight.title}</h2>
                <AiInsight value={insight.content} />
                <InsightSaveButton insightId={insight.id} saved />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
