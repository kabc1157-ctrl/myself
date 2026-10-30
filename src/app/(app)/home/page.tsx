import Link from "next/link";
import { Suspense } from "react";

import { verifySession } from "@/core/auth/session";
import { markAiInsightReadAction } from "@/core/ai/actions";
import { getMonthlyAiInsights, getSavedInsightIds, getUnreadAiInsights } from "@/core/ai/insight-inbox";
import { InsightSaveButton } from "@/core/ai/insight-save-button";
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
import { toggleNoteChecklistAction } from "@/modules/life/application/actions";
import { getRoutineDashboard } from "@/modules/routines/infrastructure/routine-repository";
import { getExerciseLogs, getFeatureSettings, getInvestmentTrades, getNotes, getPlannerData, getReadingLogs } from "@/modules/life/infrastructure/repository";

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
  const [journal, routines, payroll, unreadInsights, monthlyInsightHistory, savedInsightIds, featureSettings, notes, exerciseLogs, planner, readingLogs, investmentTrades] = await Promise.all([
    getJournalOverview(supabase, date),
    getRoutineDashboard(supabase, date, profile.week_starts_on),
    getPayrollOverview(supabase, month),
    getUnreadAiInsights(supabase, session.userId),
    getMonthlyAiInsights(supabase, session.userId),
    getSavedInsightIds(supabase, session.userId),
    getFeatureSettings(supabase, session.userId),
    getNotes(supabase, session.userId),
    getExerciseLogs(supabase, session.userId),
    getPlannerData(supabase, session.userId),
    getReadingLogs(supabase, session.userId),
    getInvestmentTrades(supabase, session.userId),
  ]);
  const workedMinutes = payroll.shifts.reduce((sum, shift) => sum + (shift.workedMinutes ?? 0), 0);
  const displayName = profile.display_name?.trim();
  const pendingRoutines = routines.day.items.filter((item) => !item.completed);
  const visiblePendingRoutines = pendingRoutines.slice(0, 4);
  const seenMonthlyCategories = new Set<string>();
  const latestMonthlyInsights = monthlyInsightHistory.filter((insight) => {
    if (seenMonthlyCategories.has(insight.category)) return false;
    seenMonthlyCategories.add(insight.category);
    return true;
  });
  const homeNotes = notes.filter((note) => note.show_on_home && note.remark !== "__checklist__").slice(0, 3);
  const homeChecklist = notes.flatMap((note) => note.show_on_home && note.remark === "__checklist__" && Array.isArray(note.checklist) ? (note.checklist as Array<{ text: string; done?: boolean }>).map((item, index) => ({ noteId: note.id, index, text: item.text, done: Boolean(item.done) })) : []).filter((item) => !item.done).slice(0, 6);
  const currentTime = new Intl.DateTimeFormat("en-GB", { timeZone: profile.timezone, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
  const activePlannerTasks = planner.tasks.filter((task) => task.planned_date === date && task.start_time && task.end_time && task.start_time.slice(0, 5) <= currentTime && task.end_time.slice(0, 5) > currentTime);
  const monthExercise = exerciseLogs.filter((log) => log.exercise_date.startsWith(month));
  const monthPlannerTasks = planner.tasks.filter((task) => task.planned_date?.startsWith(month));
  const monthReadingLogs = readingLogs.filter((log) => log.reading_date.startsWith(month));
  const monthInvestmentTrades = investmentTrades.filter((trade) => trade.trade_date.startsWith(month));
  const readBookCount = new Set(readingLogs.map((log) => log.book_id)).size;
  const scheduledStarts = monthPlannerTasks.flatMap((task) => task.start_time ? [task.start_time.slice(0, 5)] : []);
  const averageStart = scheduledStarts.length ? (() => {
    const averageMinutes = Math.round(scheduledStarts.reduce((sum, value) => {
      const [hours, minutes] = value.split(":").map(Number);
      return sum + hours * 60 + minutes;
    }, 0) / scheduledStarts.length);
    return `${String(Math.floor(averageMinutes / 60)).padStart(2, "0")}:${String(averageMinutes % 60).padStart(2, "0")}`;
  })() : "-";

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

      {featureSettings.planner_enabled && activePlannerTasks.length > 0 ? <section className="home-pending-routines"><div className="home-section-heading"><h2>지금 할 일정</h2><Link href="/planner">일정 관리</Link></div><div className="feature-list">{activePlannerTasks.map((task)=><article key={task.id}><div><small>{task.start_time?.slice(0,5)}–{task.end_time?.slice(0,5)}</small><h3>{task.title}</h3>{task.note ? <p>연결 메모 · {task.note.title}</p>:null}{task.exercise ? <p>연결 운동 · {task.exercise.activity}</p>:null}</div></article>)}</div></section> : null}

      <section className="home-pending-routines" aria-labelledby="home-pending-routines-title">
        <div className="home-section-heading">
          <h2 id="home-pending-routines-title">아직 남은 루틴</h2>
          <span>{pendingRoutines.length}</span>
        </div>
        {pendingRoutines.length > 0 ? (
          <div className="home-pending-routine-list">
            {visiblePendingRoutines.map((item) => (
              <ScrollPreservingForm action={toggleRoutineCompletionAction} key={item.id}>
                <input name="routineId" type="hidden" value={item.id} />
                <input name="routineDate" type="hidden" value={date} />
                <button aria-label={`${item.name} 완료`} type="submit">
                  <span aria-hidden="true" />
                  <strong>{item.name}</strong>
                </button>
              </ScrollPreservingForm>
            ))}
            {pendingRoutines.length > 4 ? (
              <Link className="home-routine-more-link" href="/routines">남은 {pendingRoutines.length - 4}개 더 보기</Link>
            ) : null}
          </div>
        ) : (
          <p className="home-pending-empty">오늘 루틴을 모두 마쳤어요.</p>
        )}
      </section>

      {featureSettings.notes_enabled ? <section className="home-pending-routines home-checklist-home" aria-labelledby="home-checklist-title"><div className="home-section-heading"><h2 id="home-checklist-title">체크리스트</h2><Link href="/notes?checklist=1">추가</Link></div>{homeChecklist.length > 0 ? <div className="home-pending-routine-list home-checklist-list">{homeChecklist.map((item) => <form action={toggleNoteChecklistAction} key={`${item.noteId}-${item.index}`}><input name="id" type="hidden" value={item.noteId}/><input name="index" type="hidden" value={item.index}/><button aria-label={`${item.text} 완료`} type="submit"><span aria-hidden="true"/><strong>{item.text}</strong></button></form>)}</div> : <p className="home-pending-empty">체크리스트를 추가해 보세요.</p>}</section> : null}

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
                  <span>{insight.scope === "monthly" ? "월간" : insight.scope === "weekly" ? "주간" : "오늘"} · {({ journal: "일기", routine: "루틴", note: "메모", exercise: "운동", planner: "일정", reading: "독서", investment: "투자" } as Record<string, string>)[insight.category] ?? insight.category}</span>
                  <time dateTime={insight.source_date}>{formatShortKoreanDate(insight.source_date)}</time>
                </div>
                <AiInsight value={insight.content} />
                <div className="insight-card-actions">
                  <InsightSaveButton insightId={insight.id} saved={savedInsightIds.has(insight.id)} />
                  <form action={markAiInsightReadAction}>
                    <input name="insightId" type="hidden" value={insight.id} />
                    <button className="insight-read-button" type="submit">읽었어요</button>
                  </form>
                </div>
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
          <MonthlyInsightList insights={latestMonthlyInsights} savedInsightIds={savedInsightIds} />
        </section>
      ) : null}

      {featureSettings.notes_enabled ? <section className="home-pending-routines"><div className="home-section-heading"><h2>저장된 메모</h2><Link href="/notes?memo=1">추가</Link></div>{homeNotes.length > 0 ? <div className="feature-list">{homeNotes.map((note)=><details className="home-note-card" key={note.id}><summary><h3>{note.title}</h3><span>보기</span></summary><div className="note-content">{note.content}</div></details>)}</div> : <p className="home-pending-empty">메모를 추가해 보세요.</p>}</section> : null}

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
        {featureSettings.payroll_enabled ? <Link className="home-summary-card payroll" href={`/payroll?month=${month}`}>
          <div><span>이번 달 예상 급여</span><strong>{formatWon(payroll.totalPay)}원</strong></div>
          <p><span>{payroll.shifts.length}건</span><span>총 {formatHours(workedMinutes)}</span></p>
          <b aria-hidden="true">→</b>
        </Link> : null}
        {featureSettings.exercise_enabled ? <Link className="home-summary-card journal" href="/exercise"><div><span>이번 달 운동</span><strong>{monthExercise.length}회</strong></div><p><span>스트레칭 {monthExercise.filter((item)=>item.exercise_type === "stretching").length}</span><span>유산소 {monthExercise.filter((item)=>item.exercise_type === "cardio").length} · 근력 {monthExercise.filter((item)=>item.exercise_type === "strength").length}</span></p><b>→</b></Link> : null}
        {featureSettings.planner_enabled ? <Link className="home-summary-card routine" href="/planner"><div><span>일정 관리</span><strong>{averageStart}</strong></div><p><span>평균 시작 시간</span><span>브레인 덤프 {planner.tasks.filter((task)=>!task.planned_date && !task.completed_at).length}개</span></p><b>→</b></Link> : null}
        {featureSettings.reading_enabled ? <Link className="home-summary-card reading" href="/reading"><div><span>독서 기록</span><strong>{monthReadingLogs.length}회</strong></div><p><span>이번 달 독서 기록</span><span>읽은 책 {readBookCount}권</span></p><b>→</b></Link> : null}
        {featureSettings.investment_enabled ? <Link className="home-summary-card investment" href="/investment"><div><span>투자 기록</span><strong>{monthInvestmentTrades.length}건</strong></div>{(() => { const buys = monthInvestmentTrades.filter((trade) => trade.trade_type === "buy").reduce((sum, trade) => sum + trade.trade_amount, 0); const sells = monthInvestmentTrades.filter((trade) => trade.trade_type === "sell").reduce((sum, trade) => sum + trade.trade_amount, 0); const net = buys - sells; const rate = buys ? (net / buys) * 100 : 0; return <p><span>이번 달 매매일지</span><span>거래대금 {formatWon(net)}원</span><span>수익률 {rate >= 0 ? "+" : ""}{rate.toFixed(1)}%</span></p>; })()}<b>→</b></Link> : null}
      </section>

    </div>
  );
}
