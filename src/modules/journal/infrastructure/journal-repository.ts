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

  const entriesResult = await supabase
    .from("journal_entries")
    .select("*")
    .order("entry_date", { ascending: false });

  if (entriesResult.error) {
    throw new Error(`Failed to read journal entries: ${entriesResult.error.message}`);
  }

  const monthEntries = entriesResult.data.filter(
    (entry) => entry.entry_date >= start && entry.entry_date < endExclusive,
  );
  const weekEntries = entriesResult.data.filter(
    (entry) => entry.entry_date >= week.start && entry.entry_date < week.endExclusive,
  );

  const monthlyMoods = monthEntries
    .map((entry) => entry.mood)
    .filter((mood): mood is number => mood !== null);
  const weeklyMoods = weekEntries
    .map((entry) => entry.mood)
    .filter((mood): mood is number => mood !== null);
  const average = (moods: number[]) => moods.length > 0
    ? Math.round((moods.reduce((sum, mood) => sum + mood, 0) / moods.length) * 10) / 10
    : null;

  return {
    current: entriesResult.data.find((entry) => entry.entry_date === date) ?? null,
    entries: entriesResult.data,
    monthlyEntryCount: monthEntries.length,
    monthlyAverageMood: average(monthlyMoods),
    weeklyAverageMood: average(weeklyMoods),
    calendarEntries: monthEntries,
  };
}
