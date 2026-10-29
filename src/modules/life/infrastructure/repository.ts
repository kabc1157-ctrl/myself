import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/core/db/database.types";

export async function getFeatureSettings(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.from("user_feature_settings").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(`Failed to load feature settings: ${error.message}`);
  return data ?? {
    user_id: userId,
    notes_enabled: true,
    reading_enabled: true,
    payroll_enabled: true,
    exercise_enabled: false,
    planner_enabled: false,
    planner_day_start: "05:00:00",
    planner_day_end: "23:30:00",
    updated_at: new Date().toISOString(),
  };
}

export async function getNotes(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.from("notes").select("*, topic:note_topics(id,name)").eq("user_id", userId).order("updated_at", { ascending: false });
  if (error) throw new Error(`Failed to load notes: ${error.message}`);
  return data;
}

export async function getNoteTopics(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.from("note_topics").select("id,name").eq("user_id", userId).order("name");
  if (error) throw new Error(`Failed to load note topics: ${error.message}`);
  return data;
}

export async function getExerciseLogs(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.from("exercise_logs").select("*").eq("user_id", userId).order("exercise_date", { ascending: false });
  if (error) throw new Error(`Failed to load exercise logs: ${error.message}`);
  return data;
}

export async function getReadingLogs(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from("reading_logs")
    .select("*, book:reading_books(id,title,author)")
    .eq("user_id", userId)
    .order("reading_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load reading logs: ${error.message}`);
  return data;
}

export async function getReadingBooks(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from("reading_books")
    .select("id,title,author,created_at,updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`Failed to load reading books: ${error.message}`);
  return data;
}

export async function getPlannerData(supabase: SupabaseClient<Database>, userId: string) {
  const [tasks, reviews] = await Promise.all([
    supabase.from("planner_tasks").select("*, note:notes(id,title), exercise:exercise_logs(id,activity,focus_area)").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("planner_daily_reviews").select("*").eq("user_id", userId).order("review_date", { ascending: false }),
  ]);
  if (tasks.error) throw new Error(`Failed to load planner tasks: ${tasks.error.message}`);
  if (reviews.error) throw new Error(`Failed to load planner reviews: ${reviews.error.message}`);
  return { tasks: tasks.data, reviews: reviews.data };
}
