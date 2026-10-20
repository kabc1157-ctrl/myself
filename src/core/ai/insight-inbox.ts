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
