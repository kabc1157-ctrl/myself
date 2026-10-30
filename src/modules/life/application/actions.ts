"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifySession } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/core/db/supabase/server";

function textValue(formData: FormData, name: string, required = false) {
  const value = String(formData.get(name) ?? "").trim();
  if (required && !value) throw new Error(`${name} 값을 입력해 주세요.`);
  return value;
}

async function context() {
  const [session, supabase] = await Promise.all([verifySession(), createServerSupabaseClient()]);
  return { userId: session.userId, supabase };
}

export async function saveFeatureSettingsAction(formData: FormData) {
  const { userId, supabase } = await context();
  const { error } = await supabase.from("user_feature_settings").upsert({
    user_id: userId,
    notes_enabled: formData.get("notes") === "on",
    reading_enabled: formData.get("reading") === "on",
    payroll_enabled: formData.get("payroll") === "on",
    exercise_enabled: formData.get("exercise") === "on",
    planner_enabled: formData.get("planner") === "on",
    investment_enabled: formData.get("investment") === "on",
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function saveInvestmentSymbolAction(formData: FormData) {
  const { userId, supabase } = await context();
  const name = textValue(formData, "name", true);
  const tickerInput = textValue(formData, "ticker").toUpperCase();
  const ticker = tickerInput || `NAME-${name.toUpperCase().replace(/\s+/g, "-")}`;
  const existing = await supabase.from("investment_symbols").select("id").eq("user_id", userId).eq("ticker", ticker).maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  const result = existing.data
    ? await supabase.from("investment_symbols").update({ name, updated_at: new Date().toISOString() }).eq("id", existing.data.id).eq("user_id", userId)
    : await supabase.from("investment_symbols").insert({ user_id: userId, ticker, name, updated_at: new Date().toISOString() });
  const { error } = result;
  if (error) throw new Error(error.message);
  revalidatePath("/investment");
  revalidatePath("/my-page");
}

export async function saveInvestmentTradeAction(formData: FormData) {
  const { userId, supabase } = await context();
  const symbolId = textValue(formData, "symbolId", true);
  const tradeDate = textValue(formData, "tradeDate", true);
  const tradeType = textValue(formData, "tradeType", true);
  const quantity = Number(formData.get("quantity"));
  const unitPrice = Number(formData.get("unitPrice"));
  const tradeAmountRaw = textValue(formData, "tradeAmount");
  const tradeAmountInput = tradeAmountRaw ? Number(tradeAmountRaw) : Number.NaN;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tradeDate) || !["buy", "sell"].includes(tradeType) || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
    throw new Error("매매일지 입력값을 확인해 주세요.");
  }
  const { data: symbol } = await supabase.from("investment_symbols").select("id").eq("id", symbolId).eq("user_id", userId).maybeSingle();
  if (!symbol) throw new Error("종목을 확인해 주세요.");
  const tradeAmount = Number.isFinite(tradeAmountInput) && tradeAmountInput >= 0 ? tradeAmountInput : quantity * unitPrice;
  const id = textValue(formData, "id");
  const payload = {
    user_id: userId, symbol_id: symbolId, trade_date: tradeDate, trade_type: tradeType,
    quantity, unit_price: unitPrice, trade_amount: tradeAmount,
    expected_exit_amount: Number(formData.get("expectedExitAmount")) || null,
    reason: textValue(formData, "reason") || null, memo: textValue(formData, "memo") || null,
  };
  const { error } = id
    ? await supabase.from("investment_trades").update(payload).eq("id", id).eq("user_id", userId)
    : await supabase.from("investment_trades").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath("/investment");
  revalidatePath("/home");
}

export async function deleteInvestmentTradeAction(formData: FormData) {
  const { userId, supabase } = await context();
  const { error } = await supabase.from("investment_trades").delete().eq("id", textValue(formData, "id", true)).eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/investment");
  revalidatePath("/home");
}

export async function savePlannerHoursAction(formData: FormData) {
  const { userId, supabase } = await context();
  const start = textValue(formData, "startTime", true);
  const end = textValue(formData, "endTime", true);
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end) || start >= end) {
    throw new Error("하루의 시작과 끝 시간을 확인해 주세요.");
  }
  const { error } = await supabase.from("user_feature_settings").upsert({
    user_id: userId,
    planner_day_start: start,
    planner_day_end: end,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/planner");
}

export async function saveNoteAction(formData: FormData) {
  const { userId, supabase } = await context();
  const title = textValue(formData, "title", true);
  const content = textValue(formData, "content", true);
  let topicId = textValue(formData, "topicId");
  const newTopic = textValue(formData, "newTopic");
  if (newTopic) {
    const { data, error } = await supabase.from("note_topics").upsert({ user_id: userId, name: newTopic }, { onConflict: "user_id,name" }).select("id").single();
    if (error) throw new Error(error.message);
    topicId = data.id;
  }
  const id = textValue(formData, "id");
  const checklist = textValue(formData, "checklistText").split("\\n").map((text) => text.trim()).filter(Boolean).slice(0, 30).map((text, index) => ({ id: `${index + 1}`, text, done: false }));
  const payload = { user_id: userId, topic_id: topicId || null, title, remark: textValue(formData, "remark") || null, content, checklist, show_on_home: formData.get("showOnHome") === "on", updated_at: new Date().toISOString() };
  const result = id ? await supabase.from("notes").update(payload).eq("id", id).eq("user_id", userId) : await supabase.from("notes").insert(payload);
  if (result.error) throw new Error(result.error.message);
  revalidatePath("/notes"); revalidatePath("/home");
}

export async function createStandaloneChecklistAction(formData: FormData) {
  const { userId, supabase } = await context();
  const lines = textValue(formData, "checklistText", true).split("\n").map((value) => value.trim()).filter(Boolean).slice(0, 30);
  const checklist = lines.map((text, index) => ({ id: `${Date.now()}-${index}`, text, done: false }));
  const { error } = await supabase.from("notes").insert({ user_id: userId, title: lines[0] ?? "체크리스트", content: "체크리스트", remark: "__checklist__", checklist, show_on_home: formData.get("showOnHome") === "on", updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  revalidatePath("/notes"); revalidatePath("/home");
}

export async function toggleNoteChecklistAction(formData: FormData) {
  const { userId, supabase } = await context();
  const id = textValue(formData, "id", true);
  const index = Number(textValue(formData, "index", true));
  const { data, error } = await supabase.from("notes").select("checklist").eq("id", id).eq("user_id", userId).single();
  if (error) throw new Error(error.message);
  const checklist = Array.isArray(data.checklist) ? (data.checklist as Array<{ done?: boolean; text?: string; id?: string }>).map((item, itemIndex) => itemIndex === index ? { ...item, done: !item.done } : item) : [];
  const result = await supabase.from("notes").update({ checklist: checklist as any, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId);
  if (result.error) throw new Error(result.error.message);
  revalidatePath("/notes"); revalidatePath("/home");
}

export async function updateNoteChecklistItemAction(formData: FormData) {
  const { userId, supabase } = await context();
  const id = textValue(formData, "id", true);
  const index = Number(textValue(formData, "index", true));
  const text = textValue(formData, "text", true);
  const { data, error } = await supabase.from("notes").select("checklist").eq("id", id).eq("user_id", userId).single();
  if (error) throw new Error(error.message);
  const checklist = Array.isArray(data.checklist) ? (data.checklist as Array<{ text?: string; [key: string]: unknown }>).map((item, itemIndex) => itemIndex === index ? { ...item, text } : item) : [];
  const result = await supabase.from("notes").update({ checklist: checklist as any, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId);
  if (result.error) throw new Error(result.error.message);
  revalidatePath("/notes"); revalidatePath("/home");
}

export async function deleteNoteChecklistItemAction(formData: FormData) {
  const { userId, supabase } = await context();
  const id = textValue(formData, "id", true);
  const index = Number(textValue(formData, "index", true));
  const { data, error } = await supabase.from("notes").select("checklist").eq("id", id).eq("user_id", userId).single();
  if (error) throw new Error(error.message);
  const checklist = Array.isArray(data.checklist) ? data.checklist.filter((_: unknown, itemIndex: number) => itemIndex !== index) : [];
  const result = await supabase.from("notes").update({ checklist, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId);
  if (result.error) throw new Error(result.error.message);
  revalidatePath("/notes"); revalidatePath("/home");
}

export async function deleteNoteAction(formData: FormData) {
  const { userId, supabase } = await context();
  const { error } = await supabase.from("notes").delete().eq("id", textValue(formData, "id", true)).eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/notes"); revalidatePath("/home");
}

export async function saveExerciseAction(formData: FormData) {
  const { userId, supabase } = await context();
  const exerciseDate = textValue(formData, "date", true);
  const exerciseType = textValue(formData, "type", true) as "cardio" | "stretching" | "strength";
  const activity = textValue(formData, "activity", true);
  const focusArea = textValue(formData, "focusArea");
  const memo = textValue(formData, "memo");
  const { error } = await supabase.from("exercise_logs").upsert({ user_id: userId, exercise_date: exerciseDate, exercise_type: exerciseType, activity, focus_area: focusArea || null, memo: memo || null, updated_at: new Date().toISOString() }, { onConflict: "user_id,exercise_date" });
  if (error) throw new Error(error.message);
  revalidatePath("/exercise"); revalidatePath("/home");
  redirect(`/exercise?date=${exerciseDate}`);
}

export async function deleteExerciseAction(formData: FormData) {
  const { userId, supabase } = await context();
  const { error } = await supabase
    .from("exercise_logs")
    .delete()
    .eq("id", textValue(formData, "id", true))
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/exercise");
  revalidatePath("/home");
  revalidatePath("/planner");
}

export async function saveReadingLogAction(formData: FormData) {
  const { userId, supabase } = await context();
  const id = textValue(formData, "id");
  const bookId = textValue(formData, "bookId", true);
  const { data: book, error: bookError } = await supabase
    .from("reading_books")
    .select("id,title,author")
    .eq("id", bookId)
    .eq("user_id", userId)
    .single();
  if (bookError || !book) throw new Error("책 목록에서 책을 선택해 주세요.");
  const pagesText = textValue(formData, "pagesRead");
  const pagesRead = pagesText ? Number(pagesText) : null;
  if (pagesRead !== null && (!Number.isInteger(pagesRead) || pagesRead < 0)) {
    throw new Error("읽은 쪽 수를 확인해 주세요.");
  }
  const payload = {
    user_id: userId,
    book_id: book.id,
    reading_date: textValue(formData, "date", true),
    title: book.title,
    author: book.author,
    pages_read: pagesRead,
    memorable_quote: textValue(formData, "memorableQuote") || null,
    reflection: textValue(formData, "reflection") || null,
    updated_at: new Date().toISOString(),
  };
  const result = id
    ? await supabase.from("reading_logs").update(payload).eq("id", id).eq("user_id", userId)
    : await supabase.from("reading_logs").insert(payload);
  if (result.error) throw new Error(result.error.message);
  revalidatePath("/reading"); revalidatePath("/home");
}

export async function saveReadingBookAction(formData: FormData) {
  const { userId, supabase } = await context();
  const id = textValue(formData, "id");
  const payload = {
    user_id: userId,
    title: textValue(formData, "title", true),
    author: textValue(formData, "author") || null,
    updated_at: new Date().toISOString(),
  };
  const result = id
    ? await supabase.from("reading_books").update(payload).eq("id", id).eq("user_id", userId)
    : await supabase.from("reading_books").insert(payload);
  if (result.error) throw new Error(result.error.message);
  revalidatePath("/reading");
}

export async function deleteReadingBookAction(formData: FormData) {
  const { userId, supabase } = await context();
  const { error } = await supabase
    .from("reading_books")
    .delete()
    .eq("id", textValue(formData, "id", true))
    .eq("user_id", userId);
  if (error?.code === "23503") throw new Error("독서 기록이 연결된 책은 삭제할 수 없어요.");
  if (error) throw new Error(error.message);
  revalidatePath("/reading"); revalidatePath("/home");
}

export async function deleteReadingLogAction(formData: FormData) {
  const { userId, supabase } = await context();
  const { error } = await supabase
    .from("reading_logs")
    .delete()
    .eq("id", textValue(formData, "id", true))
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/reading"); revalidatePath("/home");
}

export async function savePlannerTaskAction(formData: FormData) {
  const { userId, supabase } = await context();
  const id = textValue(formData, "id");
  const payload = { user_id: userId, title: textValue(formData, "title", true), planned_date: textValue(formData, "plannedDate") || null, priority: textValue(formData, "priority") ? Number(textValue(formData, "priority")) : null, start_time: textValue(formData, "startTime") || null, end_time: textValue(formData, "endTime") || null, note_id: textValue(formData, "noteId") || null, exercise_log_id: textValue(formData, "exerciseId") || null, updated_at: new Date().toISOString() };
  const result = id ? await supabase.from("planner_tasks").update(payload).eq("id", id).eq("user_id", userId) : await supabase.from("planner_tasks").insert(payload);
  if (result.error) throw new Error(result.error.message);
  revalidatePath("/planner"); revalidatePath("/home");
}

export async function movePlannerTaskAction(formData: FormData) {
  const { userId, supabase } = await context();
  const { error } = await supabase.from("planner_tasks").update({ planned_date: textValue(formData, "date", true), updated_at: new Date().toISOString() }).eq("id", textValue(formData, "id", true)).eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/planner");
}

export async function togglePlannerTaskAction(formData: FormData) {
  const { userId, supabase } = await context();
  const id = textValue(formData, "id", true);
  const completed = textValue(formData, "completed") === "true";
  const { error } = await supabase.from("planner_tasks").update({ completed_at: completed ? null : new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/planner"); revalidatePath("/home");
}

export async function deletePlannerTaskAction(formData: FormData) {
  const { userId, supabase } = await context();
  const { error } = await supabase.from("planner_tasks").delete().eq("id", textValue(formData, "id", true)).eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/planner"); revalidatePath("/home");
}

export async function savePlannerReviewAction(formData: FormData) {
  const { userId, supabase } = await context();
  const reviewDate = textValue(formData, "date", true);
  const reflection = textValue(formData, "reflection", true);
  const { error } = await supabase.from("planner_daily_reviews").upsert({ user_id: userId, review_date: reviewDate, reflection, updated_at: new Date().toISOString() }, { onConflict: "user_id,review_date" });
  if (error) throw new Error(error.message);
  revalidatePath("/planner"); revalidatePath("/home");
}

export async function schedulePlannerTaskAction(formData: FormData) {
  const { userId, supabase } = await context();
  const id = textValue(formData, "id", true);
  const date = textValue(formData, "date", true);
  const startTime = textValue(formData, "startTime", true);
  const requestedEnd = textValue(formData, "endTime");
  const [hour, minute] = startTime.split(":").map(Number);
  const endMinutes = hour * 60 + minute + 30;
  const endTime = requestedEnd || (endMinutes >= 24 * 60 ? "23:59" : `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`);
  if (endTime <= startTime) throw new Error("종료 시간은 시작 시간보다 늦어야 해요.");
  const { error } = await supabase.from("planner_tasks").update({ planned_date: date, start_time: startTime, end_time: endTime, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/planner"); revalidatePath("/home");
}

export async function movePlannerTaskToBacklogAction(formData: FormData) {
  const { userId, supabase } = await context();
  const { error } = await supabase.from("planner_tasks").update({
    planned_date: null,
    priority: null,
    start_time: null,
    end_time: null,
    updated_at: new Date().toISOString(),
  }).eq("id", textValue(formData, "id", true)).eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/planner"); revalidatePath("/home");
}

export async function setPlannerPriorityAction(formData: FormData) {
  const { userId, supabase } = await context();
  const id = textValue(formData, "id", true);
  const date = textValue(formData, "date", true);
  const priority = Number(textValue(formData, "priority", true));
  if (![1, 2, 3].includes(priority)) throw new Error("우선순위를 확인해 주세요.");
  const { error: clearError } = await supabase.from("planner_tasks").update({ priority: null, updated_at: new Date().toISOString() }).eq("user_id", userId).eq("planned_date", date).eq("priority", priority);
  if (clearError) throw new Error(clearError.message);
  const { error } = await supabase.from("planner_tasks").update({ planned_date: date, priority, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/planner"); revalidatePath("/home");
}

export async function updatePlannerTaskAction(formData: FormData) {
  const { userId, supabase } = await context();
  const { error } = await supabase.from("planner_tasks").update({ title: textValue(formData, "title", true), updated_at: new Date().toISOString() }).eq("id", textValue(formData, "id", true)).eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/planner"); revalidatePath("/home");
}

export async function savePlannerEventPriorityAction(formData: FormData) {
  const { userId, supabase } = await context();
  const title = textValue(formData, "title", true);
  const date = textValue(formData, "date", true);
  const priority = Number(textValue(formData, "priority", true));
  if (![1, 2, 3].includes(priority)) throw new Error("우선순위를 확인해 주세요.");
  const { error: clearError } = await supabase.from("planner_tasks").update({ priority: null, updated_at: new Date().toISOString() }).eq("user_id", userId).eq("planned_date", date).eq("priority", priority);
  if (clearError) throw new Error(clearError.message);
  const { error } = await supabase.from("planner_tasks").insert({ user_id: userId, title, planned_date: date, priority });
  if (error) throw new Error(error.message);
  revalidatePath("/planner"); revalidatePath("/home");
}
