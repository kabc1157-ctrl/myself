import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/core/db/database.types";

export async function getUnreadAiInsights(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit = 6,
) {
  const result = await supabase
    .from("ai_insights")
    .select("id, category, scope, source_date, title, content, created_at")
    .eq("user_id", userId)
    .is("read_at", null)
    .neq("scope", "monthly")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (result.error) {
    throw new Error(`Failed to read AI insight inbox: ${result.error.message}`);
  }

  return result.data;
}

export async function getMonthlyAiInsights(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit = 12,
) {
  const result = await supabase
    .from("ai_insights")
    .select("id, category, scope, source_date, title, content, created_at")
    .eq("user_id", userId)
    .eq("scope", "monthly")
    .order("source_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (result.error) {
    throw new Error(`Failed to read monthly AI insights: ${result.error.message}`);
  }

  return result.data;
}

export async function getRoutineAiInsights(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit = 12,
) {
  const result = await supabase
    .from("ai_insights")
    .select("id, category, scope, source_date, title, content, created_at")
    .eq("user_id", userId)
    .eq("category", "routine")
    .order("source_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (result.error) throw new Error(`Failed to read routine insights: ${result.error.message}`);
  return result.data;
}

export async function getLatestAiInsight(
  supabase: SupabaseClient<Database>,
  userId: string,
  category: "journal" | "routine" | "note" | "exercise" | "planner" | "payroll" | "reading",
) {
  const result = await supabase
    .from("ai_insights")
    .select("id, category, scope, source_date, title, content, created_at")
    .eq("user_id", userId)
    .eq("category", category)
    .order("source_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (result.error) throw new Error(`Failed to read latest AI insight: ${result.error.message}`);
  return result.data;
}

export async function getSavedInsightIds(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const result = await supabase
    .from("saved_ai_insights")
    .select("insight_id")
    .eq("user_id", userId);

  if (result.error) throw new Error(`Failed to read saved insight IDs: ${result.error.message}`);
  return new Set(result.data.map((item) => item.insight_id));
}

export async function getSavedAiInsights(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const result = await supabase
    .from("saved_ai_insights")
    .select("id, created_at, insight:ai_insights(id, category, scope, source_date, title, content, created_at)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (result.error) throw new Error(`Failed to read saved insights: ${result.error.message}`);
  return result.data;
}
