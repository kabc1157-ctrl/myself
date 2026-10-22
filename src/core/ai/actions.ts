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

function parseInsightId(formData: FormData) {
  const insightId = formData.get("insightId");
  if (typeof insightId !== "string" || !/^[0-9a-f-]{36}$/i.test(insightId)) {
    throw new Error("Invalid AI insight ID");
  }
  return insightId;
}

export async function saveAiInsightAction(formData: FormData) {
  const insightId = parseInsightId(formData);
  const [session, supabase] = await Promise.all([verifySession(), createServerSupabaseClient()]);
  const { data: insight, error: insightError } = await supabase
    .from("ai_insights")
    .select("id")
    .eq("id", insightId)
    .eq("user_id", session.userId)
    .maybeSingle();
  if (insightError || !insight) throw new Error("저장할 인사이트를 찾지 못했습니다.");

  const { error } = await supabase.from("saved_ai_insights").upsert(
    { user_id: session.userId, insight_id: insightId },
    { onConflict: "user_id,insight_id" },
  );
  if (error) throw new Error(`Failed to save AI insight: ${error.message}`);
  revalidatePath("/home");
  revalidatePath("/routines");
  revalidatePath("/discoveries");
  revalidatePath("/my-page");
}

export async function removeSavedAiInsightAction(formData: FormData) {
  const insightId = parseInsightId(formData);
  const [session, supabase] = await Promise.all([verifySession(), createServerSupabaseClient()]);
  const { error } = await supabase
    .from("saved_ai_insights")
    .delete()
    .eq("insight_id", insightId)
    .eq("user_id", session.userId);
  if (error) throw new Error(`Failed to remove saved AI insight: ${error.message}`);
  revalidatePath("/home");
  revalidatePath("/routines");
  revalidatePath("/discoveries");
  revalidatePath("/my-page");
}
