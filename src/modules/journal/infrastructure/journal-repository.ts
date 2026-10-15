import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getMonthRange, getWeekRange } from "@/core/date/local-date";
import type { Database } from "@/core/db/database.types";

export async function getJournalOverview(
  supabase: SupabaseClient<Database>,
  date: string,
) {
  const month = date.slice(0, 7);
  const { start, endExclusive } = getMonthRange(month);
  const week = getWeekRange(date);

  const [currentResult, entriesResult, monthResult, weekResult] = await Promise.all([
    supabase.from("journal_entries").select("*").eq("entry_date", date).maybeSingle(),
    supabase
      .from("journal_entries")
      .select("*")
      .order("entry_date", { ascending: false }),
    supabase
      .from("journal_entries")
      .select("entry_date,mood")
      .gte("entry_date", start)
      .lt("entry_date", endExclusive),
    supabase
      .from("journal_entries")
      .select("mood")
      .gte("entry_date", week.start)
      .lt("entry_date", week.endExclusive),
  ]);

  if (currentResult.error) {
    throw new Error(`Failed to read today's journal entry: ${currentResult.error.message}`);
  }
  if (entriesResult.error) {
    throw new Error(`Failed to read journal entries: ${entriesResult.error.message}`);
  }
  if (monthResult.error) {
    throw new Error(`Failed to read journal statistics: ${monthResult.error.message}`);
  }
  if (weekResult.error) {
    throw new Error(`Failed to read weekly journal statistics: ${weekResult.error.message}`);
  }

  const monthlyMoods = monthResult.data
    .map((entry) => entry.mood)
    .filter((mood): mood is number => mood !== null);
  const weeklyMoods = weekResult.data
    .map((entry) => entry.mood)
    .filter((mood): mood is number => mood !== null);
  const average = (moods: number[]) => moods.length > 0
    ? Math.round((moods.reduce((sum, mood) => sum + mood, 0) / moods.length) * 10) / 10
    : null;

  return {
    current: currentResult.data,
    entries: entriesResult.data,
    monthlyEntryCount: monthResult.data.length,
    monthlyAverageMood: average(monthlyMoods),
    weeklyAverageMood: average(weeklyMoods),
    calendarEntries: monthResult.data,
  };
}
