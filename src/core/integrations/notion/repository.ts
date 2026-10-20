import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/core/db/database.types";

export async function getNotionConnection(supabase: SupabaseClient<Database>, userId: string) {
  const { data } = await supabase
    .from("notion_connections")
    .select("user_id, workspace_id, workspace_name, bot_id, journal_data_source_id, routine_data_source_id, connected_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

