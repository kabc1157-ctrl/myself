import { verifySession } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { BottomNavigation } from "@/core/navigation/bottom-navigation";
import type { ServiceModuleId } from "@/core/navigation/modules";
import { getFeatureSettings } from "@/modules/life/infrastructure/repository";

const defaultOverflowOrder: ServiceModuleId[] = ["reading", "payroll", "exercise", "planner", "investment", "ai-reports"];

export async function UserBottomNavigation() {
  const [session, supabase] = await Promise.all([verifySession(), createServerSupabaseClient()]);
  const settings = await getFeatureSettings(supabase, session.userId);
  const ids: ServiceModuleId[] = ["home", "journal", "routines", "notes", "today-i"];
  if (settings.reading_enabled) ids.push("reading");
  if (settings.payroll_enabled) ids.push("payroll");
  if (settings.exercise_enabled) ids.push("exercise");
  if (settings.planner_enabled) ids.push("planner");
  if (settings.investment_enabled) ids.push("investment");
  ids.push("ai-reports");
  const savedOrder = Array.isArray(settings.navigation_order) ? settings.navigation_order.filter((id): id is ServiceModuleId => typeof id === "string" && defaultOverflowOrder.includes(id as ServiceModuleId)) : [];
  const primary = ids.filter((id) => !defaultOverflowOrder.includes(id));
  const orderedOverflow = [...new Set([...savedOrder, ...defaultOverflowOrder])].filter((id) => ids.includes(id));
  ids.splice(0, ids.length, ...primary, ...orderedOverflow);
  return <BottomNavigation enabledIds={ids} />;
}
