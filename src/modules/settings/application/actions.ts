"use server";

import { revalidatePath } from "next/cache";

import { verifySession } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { profileSettingsSchema } from "@/modules/settings/application/schemas";
import { normalizeNotionId } from "@/core/integrations/notion/notion-id";

export type SettingsFormState = {
  error?: string;
  message?: string;
};

export async function updateProfileSettingsAction(
  _previousState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const result = profileSettingsSchema.safeParse({
    displayName: formData.get("displayName") || undefined,
    weekStartsOn: formData.get("weekStartsOn"),
  });

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const session = await verifySession();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: result.data.displayName ?? null,
      week_starts_on: result.data.weekStartsOn,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.userId);

  if (error) {
    return { error: "설정을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }

  revalidatePath("/my-page");
  return { message: "설정을 저장했습니다." };
}

export async function saveNotionDestinationsAction(
  _previousState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const journalId = normalizeNotionId(String(formData.get("journalDataSource") ?? ""));
  const routineId = normalizeNotionId(String(formData.get("routineDataSource") ?? ""));
  if (!journalId || !routineId) return { error: "일기와 루틴 데이터 소스 ID를 모두 확인해 주세요." };

  const session = await verifySession();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("notion_connections").update({
    journal_data_source_id: journalId,
    routine_data_source_id: routineId,
    updated_at: new Date().toISOString(),
  }).eq("user_id", session.userId);
  if (error) return { error: "Notion 보관 위치를 저장하지 못했습니다." };
  revalidatePath("/my-page");
  return { message: "Notion 보관 위치를 저장했습니다." };
}
