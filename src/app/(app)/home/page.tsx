import Link from "next/link";
import { Suspense } from "react";

import { verifySession } from "@/core/auth/session";
import { markAiInsightReadAction } from "@/core/ai/actions";
import { getMonthlyAiInsights, getUnreadAiInsights } from "@/core/ai/insight-inbox";
import { AiInsight } from "@/core/ui/ai-insight";
import { formatShortKoreanDate, getLocalDate } from "@/core/date/local-date";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { MonthlyInsightList } from "@/core/ui/monthly-insight-list";
import { ScrollPreservingForm } from "@/core/ui/scroll-preserving-form";
import { getOrCreateProfile } from "@/core/user/profile-repository";
import { HomeCalendarFallback, HomeCalendarSection } from "@/core/integrations/google-calendar/home-calendar-section";
import { getJournalOverview } from "@/modules/journal/infrastructure/journal-repository";
import { getPayrollOverview } from "@/modules/payroll/infrastructure/payroll-repository";
import { toggleRoutineCompletionAction } from "@/modules/routines/application/actions";
import { getRoutineDashboard } from "@/modules/routines/infrastructure/routine-repository";

function formatWon(value: number) {
  return new Intl.NumberFormat("ko-KR").format(Math.round(value));
}

function formatHours(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}시간 ${remainingMinutes}분` : `${hours}시간`;
}

export default async function AppHomePage() {
  const [session, supabase] = await Promise.all([
    verifySession(),
    createServerSupabaseClient(),
  ]);
  const profile = await getOrCreateProfile(supabase, session.userId);
  const date = getLocalDate(profile.timezone);
  const month = date.slice(0, 7);
  const [journal, routines, payroll, unreadInsights, monthlyInsightHistory] = await Promise.all([
    getJournalOverview(supabase, date),
    getRoutineDashboard(supabase, date, profile.week_starts_on),
    getPayrollOverview(supabase, month),
    getUnreadAiInsights(supabase, session.userId),
    getMonthlyAiInsights(supabase, session.userId),
  ]);
  const workedMinutes = payroll.shifts.reduce((sum, shift) => sum + (shift.workedMinutes ?? 0), 0);
  const displayName = profile.display_name?.trim();
  const pendingRoutines = routines.day.items.filter((item) => !item.completed);
  const seenMonthlyCategories = new Set<string>();
  const latestMonthlyInsights = monthlyInsightHistory.filter((insight) => {
    if (seenMonthlyCategories.has(insight.category)) return false;
    seenMonthlyCategories.add(insight.category);
    return true;
  });

  return (
    <div className="app-home-dashboard">
      <header className="app-home-heading">
        <div>
          <p className="eyebrow page-menu-label">홈</p>
          <h1>{displayName ? `${displayName}님, 안녕하세요:)` : "오늘도 천천히 시작해요."}</h1>
        </div>
        <time dateTime={date}>{formatShortKoreanDate(date)}</time>
      </header>

      <section className="home-today-card" aria-labelledby="home-today-title">
        <div>
          <h2 id="home-today-title">오늘의 생활</h2>
        </div>
        <div className="home-today-grid">
          <Link href="/journal">
            <span>일기</span>
            <strong aria-label={journal.current ? "오늘 일기 완료" : "오늘 일기 미작성"}>{journal.current ? "✓" : "−"}</strong>
          </Link>
          <Link href="/routines">
            <span>루틴</span>
            <strong aria-label={`오늘 루틴 진행률 ${routines.day.completionRate}%`}>{routines.day.completionRate}%</strong>
          </Link>
        </div>
        <Suspense fallback={<HomeCalendarFallback />}>
          <HomeCalendarSection date={date} timeZone={profile.timezone} userId={session.userId} />
        </Suspense>
      </section>

      <section className="home-pending-routines" aria-labelledby="home-pending-routines-title">
        <div className="home-section-heading">
          <h2 id="home-pending-routines-title">아직 남은 루틴</h2>
          <span>{pendingRoutines.length}</span>
        </div>
        {pendingRoutines.length > 0 ? (
          <div className="home-pending-routine-list">
            {pendingRoutines.map((item) => (
              <ScrollPreservingForm action={toggleRoutineCompletionAction} key={item.id}>
                <input name="routineId" type="hidden" value={item.id} />
                <input name="routineDate" type="hidden" value={date} />
                <button aria-label={`${item.name} 완료`} type="submit">
                  <span aria-hidden="true" />
                  <strong>{item.name}</strong>
                </button>
              </ScrollPreservingForm>
            ))}
          </div>
        ) : (
          <p className="home-pending-empty">오늘 루틴을 모두 마쳤어요.</p>
        )}
      </section>

      {unreadInsights.length > 0 ? (
        <section className="home-insight-inbox" aria-labelledby="home-insights-title">
          <div className="home-insight-heading">
            <div><span>AI INSIGHT</span><h2 id="home-insights-title">뉴 인사이트</h2></div>
            <strong>{unreadInsights.length}개</strong>
          </div>
          <div className="home-insight-list">
            {unreadInsights.map((insight) => (
              <article className={`home-insight-card ${insight.category}`} key={insight.id}>
                <div className="home-insight-meta">
                  <span>{insight.scope === "monthly" ? "월간" : insight.scope === "weekly" ? "주간" : "오늘"} · {insight.category === "journal" ? "일기" : "루틴"}</span>
                  <time dateTime={insight.source_date}>{formatShortKoreanDate(insight.source_date)}</time>
                </div>
                <AiInsight value={insight.content} />
                <form action={markAiInsightReadAction}>
                  <input name="insightId" type="hidden" value={insight.id} />
                  <button className="insight-read-button" type="submit">읽었어요</button>
                </form>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {latestMonthlyInsights.length > 0 ? (
        <section className="home-monthly-insights" aria-labelledby="home-monthly-insights-title">
          <div className="home-section-heading">
            <h2 id="home-monthly-insights-title">월간 인사이트</h2>
          </div>
          <MonthlyInsightList insights={latestMonthlyInsights} />
        </section>
      ) : null}

      <section className="home-summary-grid" aria-label="생활 요약">
        <Link className="home-summary-card journal" href="/journal">
          <div><span>이번 달 일기</span><strong>{journal.monthlyEntryCount}일</strong></div>
          <p><span>주간 기분 {journal.weeklyAverageMood ?? "-"}</span><span>월간 기분 {journal.monthlyAverageMood ?? "-"}</span></p>
          <b aria-hidden="true">→</b>
        </Link>
        <Link className="home-summary-card routine" href="/routines">
          <div><span>루틴 진행률</span><strong>{routines.weekly.completionRate}%</strong></div>
          <p><span>이번 주 {routines.weekly.completionRate}%</span><span>이번 달 {routines.monthly.completionRate}%</span></p>
          <b aria-hidden="true">→</b>
        </Link>
        <Link className="home-summary-card payroll" href={`/payroll?month=${month}`}>
          <div><span>이번 달 예상 급여</span><strong>{formatWon(payroll.totalPay)}원</strong></div>
          <p><span>{payroll.shifts.length}건</span><span>총 {formatHours(workedMinutes)}</span></p>
          <b aria-hidden="true">→</b>
        </Link>
      </section>

    </div>
  );
}
