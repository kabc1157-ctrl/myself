import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getDateRange, getMonthRange, getWeekRange } from "@/core/date/local-date";
import type { Database } from "@/core/db/database.types";
import { buildRoutineDay } from "@/modules/routines/domain/routine-day";

function summarizeDays(days: ReturnType<typeof buildRoutineDay>[]) {
  const completedCount = days.reduce((sum, day) => sum + day.completedCount, 0);
  const totalCount = days.reduce((sum, day) => sum + day.totalCount, 0);
  return {
    completedCount,
    totalCount,
    completionRate: totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100),
  };
}

export async function getRoutineDashboard(
  supabase: SupabaseClient<Database>,
  date: string,
  weekStartsOn: number,
) {
  const month = getMonthRange(date.slice(0, 7));
  const week = getWeekRange(date, weekStartsOn);
  const rangeStart = month.start < week.start ? month.start : week.start;
  const rangeEnd = month.endExclusive > week.endExclusive ? month.endExclusive : week.endExclusive;
  const [routinesResult, schedulesResult, completionsResult] = await Promise.all([
    supabase.from("routines").select("*").order("sort_order").order("created_at"),
    supabase
      .from("routine_schedule_versions")
      .select("*")
      .lt("effective_from", rangeEnd)
      .order("effective_from", { ascending: false }),
    supabase
      .from("routine_completions")
      .select("*")
      .gte("routine_date", rangeStart)
      .lt("routine_date", rangeEnd),
  ]);

  if (routinesResult.error) throw new Error(`Failed to read routines: ${routinesResult.error.message}`);
  if (schedulesResult.error) throw new Error(`Failed to read schedules: ${schedulesResult.error.message}`);
  if (completionsResult.error) throw new Error(`Failed to read completions: ${completionsResult.error.message}`);

  const days = getDateRange(rangeStart, rangeEnd).map((dayDate) => buildRoutineDay(
    dayDate,
    routinesResult.data,
    schedulesResult.data,
    completionsResult.data.filter((completion) => completion.routine_date === dayDate),
  ));
  const currentDay = days.find((day) => day.date === date) ?? buildRoutineDay(date, [], [], []);
  const monthlyDays = days.filter((day) => day.date >= month.start && day.date < month.endExclusive);
  const weeklyDays = days.filter((day) => day.date >= week.start && day.date < week.endExclusive);
  const monthlyDaysToDate = monthlyDays.filter((day) => day.date <= date);
  const weeklyDaysToDate = weeklyDays.filter((day) => day.date <= date);

  return {
    day: currentDay,
    daily: summarizeDays([currentDay]),
    weekly: summarizeDays(weeklyDaysToDate),
    monthly: summarizeDays(monthlyDaysToDate),
    calendar: monthlyDays,
    archived: routinesResult.data.filter((routine) => routine.archived_at !== null),
  };
}

export async function getRoutineDay(
  supabase: SupabaseClient<Database>,
  date: string,
) {
  const routinesResult = await supabase
    .from("routines")
    .select("*")
    .is("archived_at", null)
    .lte("start_date", date)
    .order("sort_order")
    .order("created_at");

  if (routinesResult.error) {
    throw new Error(`Failed to read routines: ${routinesResult.error.message}`);
  }

  const routineIds = routinesResult.data.map((routine) => routine.id);

  if (routineIds.length === 0) {
    return buildRoutineDay(date, [], [], []);
  }

  const [schedulesResult, completionsResult] = await Promise.all([
    supabase
      .from("routine_schedule_versions")
      .select("*")
      .in("routine_id", routineIds)
      .lte("effective_from", date)
      .order("effective_from", { ascending: false }),
    supabase
      .from("routine_completions")
      .select("*")
      .in("routine_id", routineIds)
      .eq("routine_date", date),
  ]);

  if (schedulesResult.error) {
    throw new Error(`Failed to read routine schedules: ${schedulesResult.error.message}`);
  }

  if (completionsResult.error) {
    throw new Error(`Failed to read routine completions: ${completionsResult.error.message}`);
  }

  return buildRoutineDay(
    date,
    routinesResult.data,
    schedulesResult.data,
    completionsResult.data,
  );
}

export async function getRoutineDailyReview(
  supabase: SupabaseClient<Database>,
  date: string,
) {
  const result = await supabase
    .from("routine_daily_reviews")
    .select("*")
    .eq("review_date", date)
    .maybeSingle();

  if (result.error) {
    throw new Error(`Failed to read routine daily review: ${result.error.message}`);
  }

  return result.data;
}
