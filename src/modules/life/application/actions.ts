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
  const { error } = await supabase.from("exercise_logs").upsert({ user_id: userId, exercise_date: exerciseDate, exercise_type: exerciseType, activity, focus_area: focusArea || null, memo: memo || null, updated_at: new Date().toISOString() }, { onConflict: "user_id,exercise_date" });
  if (error) throw new Error(error.message);
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
  const { error } = await supabase.from("planner_daily_reviews").upsert({ user_id: userId, review_date: reviewDate, reflection, updated_at: new Date().toISOString() }, { onConflict: "user_id,review_date" });
  if (error) throw new Error(error.message);
  revalidatePath("/planner"); revalidatePath("/home");
}

export async function schedulePlannerTaskAction(formData: FormData) {
  const { userId, supabase } = await context();
  const id = textValue(formData, "id", true);
  const date = textValue(formData, "date", true);
  const startTime = textValue(formData, "startTime", true);
  const [hour, minute] = startTime.split(":").map(Number);
  const endMinutes = hour * 60 + minute + 30;
  const endTime = endMinutes >= 24 * 60 ? "23:59" : `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
  const { error } = await supabase.from("planner_tasks").update({ planned_date: date, start_time: startTime, end_time: endTime, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId);
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
