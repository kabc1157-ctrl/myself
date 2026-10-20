import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/core/db/database.types";

export async function getUnreadAiInsights(
  supabase: SupabaseClient<Database>,
  limit = 6,
) {
  const result = await supabase
    .from("ai_insights")
    .select("id, category, scope, source_date, title, content, created_at")
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (result.error) {
    throw new Error(`Failed to read AI insight inbox: ${result.error.message}`);
  }

  return result.data;
}
