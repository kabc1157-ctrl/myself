"use server";

import { revalidatePath } from "next/cache";

import { verifySession } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/core/db/supabase/server";

export async function markAiInsightReadAction(formData: FormData) {
  const insightId = formData.get("insightId");
  if (typeof insightId !== "string" || !/^[0-9a-f-]{36}$/i.test(insightId)) {
    throw new Error("Invalid AI insight ID");
  }

  const [session, supabase] = await Promise.all([
    verifySession(),
    createServerSupabaseClient(),
  ]);
  const { error } = await supabase
    .from("ai_insights")
    .update({ read_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", insightId)
    .eq("user_id", session.userId);

  if (error) throw new Error(`Failed to mark AI insight as read: ${error.message}`);
  revalidatePath("/home");
}
