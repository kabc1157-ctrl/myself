import { verifySession } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { BottomNavigation } from "@/core/navigation/bottom-navigation";
import type { ServiceModuleId } from "@/core/navigation/modules";
import { getFeatureSettings } from "@/modules/life/infrastructure/repository";

export async function UserBottomNavigation() {
  const [session, supabase] = await Promise.all([verifySession(), createServerSupabaseClient()]);
  const settings = await getFeatureSettings(supabase, session.userId);
  const ids: ServiceModuleId[] = ["home", "journal", "routines"];
  if (settings.notes_enabled) ids.push("notes");
  if (settings.reading_enabled) ids.push("reading");
  if (settings.payroll_enabled) ids.push("payroll");
  if (settings.exercise_enabled) ids.push("exercise");
  if (settings.planner_enabled) ids.push("planner");
  if (settings.investment_enabled) ids.push("investment");
  return <BottomNavigation enabledIds={ids} />;
}
