import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/core/db/database.types";

export async function getOrCreateProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const existing = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

  if (existing.error) {
    throw new Error(`Failed to read profile: ${existing.error.message}`);
  }

  if (existing.data) {
    return existing.data;
  }

  const created = await supabase
    .from("profiles")
    .insert({ id: userId })
    .select("*")
    .single();

  if (created.error) {
    throw new Error(`Failed to create profile: ${created.error.message}`);
  }

  return created.data;
}
