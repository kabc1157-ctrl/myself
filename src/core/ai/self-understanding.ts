import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/core/db/database.types";

export type PeriodType = "weekly" | "monthly";

export function jsonToReadableText(value: Json | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((item) => jsonToReadableText(item)).filter(Boolean).join("\n");
  const labels: Record<string, string> = { core_feedback: "오늘의 핵심 피드백", wins: "잘한 점", improvements: "개선할 점", self_understanding_tip: "나를 이해하는 단서", tomorrow_action: "내일 실천할 행동", journal: "일기", routine: "루틴" };
  return Object.entries(value).map(([key, item]) => `${labels[key] ?? key}: ${jsonToReadableText(item)}`).join("\n\n");
}

export function toLocalDate(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function clampDate(value: string | undefined) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) return toLocalDate();
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ? toLocalDate() : value!;
}

export function monthOf(date: string) { return date.slice(0, 7); }

function dailyInsightView(row: Database["public"]["Tables"]["daily_self_insights"]["Row"]) {
  return { ...row, title: "오늘의 AI 인사이트", content: { summary: row.summary, emotional_flow: row.emotional_flow, growth_signals: row.growth_signals, behavioral_patterns: row.behavioral_patterns, tomorrow_experiment: row.tomorrow_experiment } satisfies Json, generated_at: row.updated_at };
}

function periodReportView(row: Database["public"]["Tables"]["ai_period_reports"]["Row"]) {
  return { ...row, title: `${row.period_type === "monthly" ? "월간" : "주간"} AI 분석`, content: row.report, generated_at: row.updated_at };
}

export function periodFor(date: string, type: PeriodType, weekStartsOn: number) {
  const current = new Date(`${date}T12:00:00Z`);
  if (type === "monthly") {
    const start = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), 1));
    const end = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 0));
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
  }
  const currentDay = current.getUTCDay() || 7;
  const offset = weekStartsOn === 7 ? current.getUTCDay() : currentDay - 1;
  const start = new Date(current);
  start.setUTCDate(current.getUTCDate() - offset);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export async function getDailySelfData(supabase: SupabaseClient<Database>, userId: string, date: string) {
  const [insight, answer] = await Promise.all([
    supabase.from("daily_self_insights").select("*").eq("user_id", userId).eq("insight_date", date).maybeSingle(),
    supabase.from("daily_self_answers").select("*").eq("user_id", userId).eq("answer_date", date).maybeSingle(),
  ]);
  if (insight.error) throw new Error(`오늘의 나는 인사이트를 불러오지 못했습니다: ${insight.error.message}`);
  if (answer.error) throw new Error(`오늘의 나는 답변을 불러오지 못했습니다: ${answer.error.message}`);
  return { insight: insight.data ? dailyInsightView(insight.data) : null, answer: answer.data };
}

export async function getDailySelfMonth(supabase: SupabaseClient<Database>, userId: string, month: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) throw new Error("AI 기록 달력의 월 형식을 확인해 주세요.");
  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  if (monthNumber < 1 || monthNumber > 12) throw new Error("AI 기록 달력의 월 형식을 확인해 주세요.");
  const nextMonth = monthNumber === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(monthNumber + 1).padStart(2, "0")}-01`;
  const result = await supabase.from("daily_self_insights").select("insight_date, summary").eq("user_id", userId).gte("insight_date", `${month}-01`).lt("insight_date", nextMonth);
  if (result.error) throw new Error(`AI 기록 달력을 불러오지 못했습니다: ${result.error.message}`);
  return result.data;
}

export async function getPeriodReport(supabase: SupabaseClient<Database>, userId: string, type: PeriodType, start: string, end: string) {
  const result = await supabase.from("ai_period_reports").select("*").eq("user_id", userId).eq("period_type", type).eq("period_start", start).eq("period_end", end).maybeSingle();
  if (result.error) throw new Error(`AI 리포트를 불러오지 못했습니다: ${result.error.message}`);
  return result.data ? periodReportView(result.data) : null;
}

export async function getRecentPeriodReports(supabase: SupabaseClient<Database>, userId: string, limit = 4) {
  const result = await supabase.from("ai_period_reports").select("*").eq("user_id", userId).order("updated_at", { ascending: false }).limit(limit);
  if (result.error) throw new Error(`최근 AI 리포트를 불러오지 못했습니다: ${result.error.message}`);
  return result.data.map(periodReportView);
}
