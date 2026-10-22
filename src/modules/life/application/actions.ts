"use server";

import { revalidatePath } from "next/cache";
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
    payroll_enabled: formData.get("payroll") === "on",
    exercise_enabled: formData.get("exercise") === "on",
    planner_enabled: formData.get("planner") === "on",
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
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
  const payload = { user_id: userId, topic_id: topicId || null, title, remark: textValue(formData, "remark") || null, content, show_on_home: formData.get("showOnHome") === "on", updated_at: new Date().toISOString() };
  const result = id ? await supabase.from("notes").update(payload).eq("id", id).eq("user_id", userId) : await supabase.from("notes").insert(payload);
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
  const insight = { core_feedback: `${activity}${focusArea ? `, ${focusArea}에 집중한` : ""} 운동을 기록했어요.`, wins: ["운동 내용을 구체적으로 남긴 점이 다음 변화를 확인하는 데 도움이 돼요."], improvements: [memo || "다음 기록에는 운동 강도와 몸의 느낌도 함께 남겨보세요."], tomorrow_action: "무리하지 않는 범위에서 다음 운동 한 가지를 미리 정해보세요." };
  const { data, error } = await supabase.from("exercise_logs").upsert({ user_id: userId, exercise_date: exerciseDate, exercise_type: exerciseType, activity, focus_area: focusArea || null, memo: memo || null, ai_feedback: insight, updated_at: new Date().toISOString() }, { onConflict: "user_id,exercise_date" }).select("id").single();
  if (error) throw new Error(error.message);
  const sourceKey = `exercise_logs:${data.id}`;
  const insightResult = await supabase.from("ai_insights").upsert({ user_id: userId, category: "exercise", scope: "daily", source_key: sourceKey, source_date: exerciseDate, title: "운동 인사이트", content: insight }, { onConflict: "user_id,category,scope,source_key" });
  if (insightResult.error) throw new Error(insightResult.error.message);
  revalidatePath("/exercise"); revalidatePath("/home");
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
  const insight = { core_feedback: "오늘의 시간 사용을 직접 돌아본 점이 다음 계획의 정확도를 높여줘요.", wins: [reflection], improvements: ["브레인 덤프에서 가장 중요한 세 가지를 먼저 고르면 일정이 더 선명해져요."], tomorrow_action: "내일의 Big 3와 첫 시작 시간을 미리 정해보세요." };
  const { data, error } = await supabase.from("planner_daily_reviews").upsert({ user_id: userId, review_date: reviewDate, reflection, ai_feedback: insight, updated_at: new Date().toISOString() }, { onConflict: "user_id,review_date" }).select("id").single();
  if (error) throw new Error(error.message);
  const insightResult = await supabase.from("ai_insights").upsert({ user_id: userId, category: "planner", scope: "daily", source_key: `planner_daily_reviews:${data.id}`, source_date: reviewDate, title: "일정 회고 인사이트", content: insight }, { onConflict: "user_id,category,scope,source_key" });
  if (insightResult.error) throw new Error(insightResult.error.message);
  revalidatePath("/planner"); revalidatePath("/home");
}
