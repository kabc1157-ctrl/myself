"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { verifySession } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { jsonToReadableText } from "@/core/ai/self-understanding";

function dateField(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("날짜를 확인해 주세요.");
  return value;
}

export async function saveDailySelfAnswerAction(formData: FormData) {
  const date = dateField(formData.get("date"));
  const answer = String(formData.get("answer") ?? "");
  if (!answer.trim()) throw new Error("답변을 작성해 주세요.");
  const [session, supabase] = await Promise.all([verifySession(), createServerSupabaseClient()]);
  const { error } = await supabase.from("daily_self_answers").upsert({ user_id: session.userId, answer_date: date, answer }, { onConflict: "user_id,answer_date" });
  if (error) throw new Error(`답변을 저장하지 못했습니다: ${error.message}`);
  revalidatePath("/today-i");
  redirect(`/today-i?date=${date}#today-i-top`);
}

export async function deleteDailySelfAnswerAction(formData: FormData) {
  const date = dateField(formData.get("date"));
  const [session, supabase] = await Promise.all([verifySession(), createServerSupabaseClient()]);
  const { error } = await supabase.from("daily_self_answers").delete().eq("user_id", session.userId).eq("answer_date", date);
  if (error) throw new Error(`답변을 삭제하지 못했습니다: ${error.message}`);
  revalidatePath("/today-i");
}

type Source = "ai_insight" | "daily_self" | "period_report" | "journal_entry" | "routine_review" | "note" | "reading" | "exercise" | "planner_review" | "investment_trade";

const feedbackSources = new Set<Source>(["journal_entry", "routine_review", "note", "reading", "exercise", "planner_review", "investment_trade"]);

export async function copyAiInsightToNoteAction(formData: FormData) {
  const source = formData.get("source");
  const sourceId = formData.get("sourceId");
  const sourceUrl = String(formData.get("sourceUrl") ?? "");
  if (typeof source !== "string" || (!(["ai_insight", "daily_self", "period_report"] as string[]).includes(source) && !feedbackSources.has(source as Source)) || typeof sourceId !== "string" || !/^[0-9a-f-]{36}$/i.test(sourceId)) throw new Error("인사이트 정보를 확인해 주세요.");
  const [session, supabase] = await Promise.all([verifySession(), createServerSupabaseClient()]);
  let title = "AI 인사이트";
  let content = "";
  let sourceKind = "ai_insight";
  let sourceRef = sourceId;
  if (source === "ai_insight") {
    const result = await supabase.from("ai_insights").select("title, content, category, source_date").eq("id", sourceId).eq("user_id", session.userId).maybeSingle();
    if (result.error || !result.data) throw new Error("원본 AI 인사이트를 찾지 못했습니다.");
    title = result.data.title;
    content = jsonToReadableText(result.data.content);
    sourceKind = result.data.category;
  } else if (source === "daily_self") {
    const result = await supabase.from("daily_self_insights").select("summary, emotional_flow, growth_signals, behavioral_patterns, tomorrow_experiment, insight_date").eq("id", sourceId).eq("user_id", session.userId).maybeSingle();
    if (result.error || !result.data) throw new Error("오늘의 나는 인사이트를 찾지 못했습니다.");
    title = "오늘의 AI 인사이트";
    content = jsonToReadableText(result.data);
    sourceKind = "daily_self";
  } else if (source === "period_report") {
    const result = await supabase.from("ai_period_reports").select("report, period_type, period_start, period_end").eq("id", sourceId).eq("user_id", session.userId).maybeSingle();
    if (result.error || !result.data) throw new Error("AI 리포트를 찾지 못했습니다.");
    title = `${result.data.period_type === "monthly" ? "월간" : "주간"} AI 분석`;
    content = jsonToReadableText(result.data.report);
    sourceKind = result.data.period_type === "weekly" ? "weekly_report" : "monthly_report";
  } else {
    sourceRef = `${source}:${sourceId}`;
    const feedbackSource = source as Source;
    if (feedbackSource === "journal_entry") {
      const result = await supabase.from("journal_entries").select("title, ai_feedback").eq("id", sourceId).eq("user_id", session.userId).maybeSingle();
      if (result.error || !result.data?.ai_feedback) throw new Error("원본 AI 인사이트를 찾지 못했습니다.");
      title = result.data.title || "일기 인사이트";
      content = jsonToReadableText(result.data.ai_feedback);
      sourceKind = "journal";
    } else if (feedbackSource === "routine_review") {
      const result = await supabase.from("routine_daily_reviews").select("ai_feedback").eq("id", sourceId).eq("user_id", session.userId).maybeSingle();
      if (result.error || !result.data?.ai_feedback) throw new Error("원본 AI 인사이트를 찾지 못했습니다.");
      title = "루틴 인사이트";
      content = jsonToReadableText(result.data.ai_feedback);
      sourceKind = "routine";
    } else if (feedbackSource === "note") {
      const result = await supabase.from("notes").select("title, ai_feedback").eq("id", sourceId).eq("user_id", session.userId).maybeSingle();
      if (result.error || !result.data?.ai_feedback) throw new Error("원본 AI 인사이트를 찾지 못했습니다.");
      title = result.data.title;
      content = jsonToReadableText(result.data.ai_feedback);
      sourceKind = "ai_note";
    } else if (feedbackSource === "reading") {
      const result = await supabase.from("reading_logs").select("title, ai_feedback").eq("id", sourceId).eq("user_id", session.userId).maybeSingle();
      if (result.error || !result.data?.ai_feedback) throw new Error("원본 AI 인사이트를 찾지 못했습니다.");
      title = result.data.title;
      content = jsonToReadableText(result.data.ai_feedback);
      sourceKind = "reading";
    } else if (feedbackSource === "exercise") {
      const result = await supabase.from("exercise_logs").select("activity, ai_feedback").eq("id", sourceId).eq("user_id", session.userId).maybeSingle();
      if (result.error || !result.data?.ai_feedback) throw new Error("원본 AI 인사이트를 찾지 못했습니다.");
      title = result.data.activity;
      content = jsonToReadableText(result.data.ai_feedback);
      sourceKind = "exercise";
    } else if (feedbackSource === "planner_review") {
      const result = await supabase.from("planner_daily_reviews").select("ai_feedback").eq("id", sourceId).eq("user_id", session.userId).maybeSingle();
      if (result.error || !result.data?.ai_feedback) throw new Error("원본 AI 인사이트를 찾지 못했습니다.");
      title = "일정 인사이트";
      content = jsonToReadableText(result.data.ai_feedback);
      sourceKind = "planner";
    } else {
      const result = await supabase.from("investment_trades").select("ai_feedback, symbol:investment_symbols(name)").eq("id", sourceId).eq("user_id", session.userId).maybeSingle();
      if (result.error || !result.data?.ai_feedback) throw new Error("원본 AI 인사이트를 찾지 못했습니다.");
      title = result.data.symbol?.name ?? "투자 인사이트";
      content = jsonToReadableText(result.data.ai_feedback);
      sourceKind = "investment";
    }
  }
  const existing = await supabase.from("notes").select("id").eq("user_id", session.userId).eq("source_ref", sourceRef).maybeSingle();
  if (existing.error) throw new Error(`중복 여부를 확인하지 못했습니다: ${existing.error.message}`);
  if (!existing.data) {
    const topic = await supabase.from("note_topics").upsert({ user_id: session.userId, name: "AI 분석" }, { onConflict: "user_id,name" }).select("id").single();
    if (topic.error || !topic.data) throw new Error(`AI 분석 주제를 준비하지 못했습니다: ${topic.error?.message ?? "알 수 없는 오류"}`);
    const { error } = await supabase.from("notes").insert({ user_id: session.userId, topic_id: topic.data.id, title, content, source_kind: sourceKind, source_ref: sourceRef, source_title: title, source_url: sourceUrl || null });
    if (error) throw new Error(`메모에 추가하지 못했습니다: ${error.message}`);
  }
  revalidatePath("/notes");
  revalidatePath("/today-i");
  revalidatePath("/ai-reports");
}

export async function updateSavedAiNoteAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) throw new Error("메모 정보를 확인해 주세요.");
  const personalMemo = String(formData.get("personalMemo") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const highlights = String(formData.get("highlights") ?? "[]");
  let parsed: unknown;
  try { parsed = JSON.parse(highlights); } catch { throw new Error("강조 정보가 올바르지 않습니다."); }
  if (!Array.isArray(parsed)) throw new Error("강조 정보가 올바르지 않습니다.");
  const [session, supabase] = await Promise.all([verifySession(), createServerSupabaseClient()]);
  const { error } = await supabase.from("notes").update({ title: title || "AI 인사이트", content, personal_memo: personalMemo || null, ai_highlights: parsed }).eq("id", id).eq("user_id", session.userId).neq("source_kind", "note");
  if (error) throw new Error(`AI 메모를 저장하지 못했습니다: ${error.message}`);
  revalidatePath("/notes");
}
