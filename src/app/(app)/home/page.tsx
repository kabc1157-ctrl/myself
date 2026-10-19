import Link from "next/link";

import { verifySession } from "@/core/auth/session";
import { formatShortKoreanDate, getLocalDate } from "@/core/date/local-date";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { getOrCreateProfile } from "@/core/user/profile-repository";
import { getJournalOverview } from "@/modules/journal/infrastructure/journal-repository";
import { getPayrollOverview } from "@/modules/payroll/infrastructure/payroll-repository";
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
  const [journal, routines, payroll] = await Promise.all([
    getJournalOverview(supabase, date),
    getRoutineDashboard(supabase, date, profile.week_starts_on),
    getPayrollOverview(supabase, month),
  ]);
  const workedMinutes = payroll.shifts.reduce((sum, shift) => sum + (shift.workedMinutes ?? 0), 0);
  const displayName = profile.display_name?.trim();

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
          <span>오늘의 생활</span>
          <h2 id="home-today-title">하루를 한눈에 확인해요.</h2>
        </div>
        <div className="home-today-grid">
          <Link href="/journal">
            <span>일기</span>
            <strong>{journal.current ? "기록 완료" : "아직 기록 전"}</strong>
            <small>{journal.current?.ai_feedback ? "AI 인사이트 완료" : journal.current ? "23:30 분석 예정" : "오늘 마음 남기기"}</small>
          </Link>
          <Link href="/routines">
            <span>루틴</span>
            <strong>{routines.day.completionRate}%</strong>
            <small>{routines.day.completedCount}/{routines.day.totalCount} 완료</small>
          </Link>
        </div>
      </section>

      <section className="home-summary-grid" aria-label="생활 요약">
        <Link className="home-summary-card journal" href="/journal">
          <div><span>이번 달 일기</span><strong>{journal.monthlyEntryCount}일</strong></div>
          <p>주간 기분 {journal.weeklyAverageMood ?? "-"} · 월간 기분 {journal.monthlyAverageMood ?? "-"}</p>
          <b aria-hidden="true">→</b>
        </Link>
        <Link className="home-summary-card routine" href="/routines">
          <div><span>루틴 진행률</span><strong>{routines.weekly.completionRate}%</strong></div>
          <p>이번 주 {routines.weekly.completionRate}% · 이번 달 {routines.monthly.completionRate}%</p>
          <b aria-hidden="true">→</b>
        </Link>
        <Link className="home-summary-card payroll" href={`/payroll?month=${month}`}>
          <div><span>이번 달 예상 급여</span><strong>{formatWon(payroll.totalPay)}원</strong></div>
          <p>{payroll.shifts.length}건 · 총 {formatHours(workedMinutes)}</p>
          <b aria-hidden="true">→</b>
        </Link>
      </section>

      <section className="home-quick-actions" aria-labelledby="quick-actions-title">
        <div><span>QUICK ACTION</span><h2 id="quick-actions-title">바로 기록하기</h2></div>
        <nav aria-label="빠른 기록">
          <Link href="/journal">일기 쓰기 <span aria-hidden="true">＋</span></Link>
          <Link href="/routines">루틴 확인 <span aria-hidden="true">✓</span></Link>
          <Link href={`/payroll?month=${month}`}>근무 기록 <span aria-hidden="true">₩</span></Link>
        </nav>
      </section>
    </div>
  );
}
