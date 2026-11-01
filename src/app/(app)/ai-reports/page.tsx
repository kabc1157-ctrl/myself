import Link from "next/link";

import { AiMemoButton } from "@/core/ai/ai-memo-button";
import { clampDate, getPeriodReport, periodFor, type PeriodType } from "@/core/ai/self-understanding";
import { verifySession } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { formatShortKoreanDate } from "@/core/date/local-date";
import { getOrCreateProfile } from "@/core/user/profile-repository";
import { AiInsight } from "@/core/ui/ai-insight";

type Props = { searchParams: Promise<{ type?: string; date?: string }> };

function shiftPeriod(date: string, type: PeriodType, amount: number) {
  const current = new Date(`${date}T12:00:00Z`);
  current.setUTCDate(current.getUTCDate() + (type === "weekly" ? amount * 7 : 0));
  if (type === "monthly") current.setUTCMonth(current.getUTCMonth() + amount);
  return current.toISOString().slice(0, 10);
}

export default async function AiReportsPage({ searchParams }: Props) {
  const parameters = await searchParams;
  const type: PeriodType = parameters.type === "monthly" ? "monthly" : "weekly";
  const date = clampDate(parameters.date);
  const [session, supabase] = await Promise.all([verifySession(), createServerSupabaseClient()]);
  const profile = await getOrCreateProfile(supabase, session.userId);
  const period = periodFor(date, type, profile.week_starts_on);
  const report = await getPeriodReport(supabase, session.userId, type, period.start, period.end);
  const label = `${formatShortKoreanDate(period.start)} ~ ${formatShortKoreanDate(period.end)}`;
  return <div className="feature-page ai-reports-page">
    <section className="page-heading"><p className="eyebrow">AI REPORTS</p><h1>AI 주간/월간 분석</h1></section>
    <nav className="report-tabs"><Link className={type === "weekly" ? "active" : ""} href={`/ai-reports?type=weekly&date=${date}`} scroll={false}>주간</Link><Link className={type === "monthly" ? "active" : ""} href={`/ai-reports?type=monthly&date=${date}`} scroll={false}>월간</Link></nav>
    <nav className="date-stepper" aria-label="AI 리포트 기간 이동"><Link href={`/ai-reports?type=${type}&date=${shiftPeriod(date, type, -1)}`} scroll={false}>이전</Link><strong>{label}</strong><Link href={`/ai-reports?type=${type}&date=${shiftPeriod(date, type, 1)}`} scroll={false}>다음</Link></nav>
    <section className="feature-insight period-report-card"><div className="card-heading"><span>{type === "weekly" ? "WEEKLY REPORT" : "MONTHLY REPORT"}</span><h2>{report?.title ?? `${type === "weekly" ? "주간" : "월간"} AI 분석`}</h2></div><AiInsight value={report?.content ?? null} pendingMessage="이 기간의 AI 분석 리포트가 아직 없어요. n8n 분석이 완료되면 여기에 표시됩니다."/>{report ? <><p className="insight-generated-at">마지막 분석 {new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Seoul" }).format(new Date(report.generated_at))}</p><AiMemoButton source="period_report" sourceId={report.id} sourceUrl={`/ai-reports?type=${type}&date=${date}`}/></> : null}</section>
  </div>;
}
