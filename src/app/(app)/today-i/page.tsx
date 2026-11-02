import Link from "next/link";

import { AiMemoButton } from "@/core/ai/ai-memo-button";
import { deleteDailySelfAnswerAction, saveDailySelfAnswerAction } from "@/core/ai/self-understanding-actions";
import { clampDate, getDailySelfData, getDailySelfMonth, monthOf } from "@/core/ai/self-understanding";
import { verifySession } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { formatShortKoreanDate } from "@/core/date/local-date";
import { ActivityCalendar } from "@/core/ui/activity-calendar";
import { AiInsight } from "@/core/ui/ai-insight";

type Props = { searchParams: Promise<{ date?: string }> };

function shiftDay(date: string, delta: number) {
  const current = new Date(`${date}T12:00:00Z`);
  current.setUTCDate(current.getUTCDate() + delta);
  return current.toISOString().slice(0, 10);
}

export default async function TodayIPage({ searchParams }: Props) {
  const parameters = await searchParams;
  const date = clampDate(parameters.date);
  const [session, supabase] = await Promise.all([verifySession(), createServerSupabaseClient()]);
  const [{ insight, answer }, monthInsights] = await Promise.all([
    getDailySelfData(supabase, session.userId, date),
    getDailySelfMonth(supabase, session.userId, monthOf(date)),
  ]);
  const todayHref = `/today-i?date=${date}`;

  return <div id="today-i-top" className="feature-page today-i-page">
    <section className="page-heading"><p className="eyebrow">SELF UNDERSTANDING</p><h1>오늘의 나는</h1></section>
    <nav className="date-stepper" aria-label="오늘의 나는 날짜 이동"><Link href={`/today-i?date=${shiftDay(date, -1)}`} scroll={false}>이전</Link><strong>{formatShortKoreanDate(date)}</strong><Link href={`/today-i?date=${shiftDay(date, 1)}`} scroll={false}>다음</Link></nav>
    <section className="feature-insight today-i-insight"><div className="card-heading"><span>AI INSIGHT</span><h2>{insight?.title ?? "오늘의 AI 인사이트"}</h2></div><AiInsight value={insight?.content ?? null} pendingMessage="이 날짜의 통합 AI 인사이트가 아직 없어요."/>{insight ? <><p className="insight-generated-at">마지막 분석 {new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Seoul" }).format(new Date(insight.generated_at))}</p><AiMemoButton source="daily_self" sourceId={insight.id} sourceUrl={todayHref}/></> : null}</section>
    <section className="settings-card daily-answer-panel"><div className="card-heading"><span>나의 답변</span><h2>오늘의 질문에 답하기</h2></div><form action={saveDailySelfAnswerAction} className="feature-form"><input name="date" type="hidden" value={date}/><label>나의 답변<textarea defaultValue={answer?.answer ?? ""} name="answer" placeholder="오늘의 나를 천천히 돌아보며 답해 보세요." rows={6}/></label><button className="primary-button">{answer ? "답변 수정 저장" : "답변 저장"}</button></form>{answer ? <form action={deleteDailySelfAnswerAction}><input name="date" type="hidden" value={date}/><button className="text-button danger">답변 삭제</button></form> : <p className="form-message">아직 작성한 답변이 없어요.</p>}</section>
    <ActivityCalendar month={monthOf(date)} title="AI 기록" selectedDate={date} values={monthInsights.map((item) => ({ date: item.insight_date, label: "AI", level: 1 }))} hrefForDate={(selected) => `/today-i?date=${selected}`} hrefForMonth={(month) => `/today-i?date=${month}-01`}/>
  </div>;
}
