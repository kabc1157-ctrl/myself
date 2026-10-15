"use server";

import { revalidatePath } from "next/cache";

import { verifySession } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { journalEntrySchema } from "@/modules/journal/application/schemas";

export type JournalFormState = {
  error?: string;
  message?: string;
};

export async function saveJournalEntryAction(
  _previousState: JournalFormState,
  formData: FormData,
): Promise<JournalFormState> {
  const result = journalEntrySchema.safeParse({
    entryDate: formData.get("entryDate"),
    title: formData.get("title") || undefined,
    body: formData.get("body"),
    mood: formData.get("mood") || undefined,
  });

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const session = await verifySession();
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("journal_entries").upsert(
    {
      user_id: session.userId,
      entry_date: result.data.entryDate,
      title: result.data.title ?? null,
      body: result.data.body,
      mood: result.data.mood ?? null,
      updated_at: now,
    },
    { onConflict: "user_id,entry_date" },
  );

  if (error) {
    return { error: "일기를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }

  revalidatePath("/journal");
  return { message: "오늘의 기록을 저장했습니다." };
}
