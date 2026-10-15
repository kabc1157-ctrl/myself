import { getIsoWeekday } from "@/core/date/local-date";
import type { Tables } from "@/core/db/database.types";

type Routine = Tables<"routines">;
type ScheduleVersion = Tables<"routine_schedule_versions">;
type Completion = Tables<"routine_completions">;

export type RoutineDayItem = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  preferredTime: string | null;
  timePeriod: string | null;
  completed: boolean;
  completedAt: string | null;
};

export type RoutineDay = {
  date: string;
  items: RoutineDayItem[];
  completedCount: number;
  totalCount: number;
  completionRate: number;
};

function latestScheduleForDate(
  schedules: readonly ScheduleVersion[],
  routineId: string,
  date: string,
) {
  return schedules
    .filter((schedule) => schedule.routine_id === routineId && schedule.effective_from <= date)
    .sort((left, right) => right.effective_from.localeCompare(left.effective_from))[0];
}

export function buildRoutineDay(
  date: string,
  routines: readonly Routine[],
  schedules: readonly ScheduleVersion[],
  completions: readonly Completion[],
): RoutineDay {
  const isoWeekday = getIsoWeekday(date);
  const completionsByRoutine = new Map(
    completions.map((completion) => [completion.routine_id, completion]),
  );

  const items = routines.flatMap((routine) => {
    if (routine.start_date > date || (routine.end_date && routine.end_date < date)) {
      return [];
    }

    if (routine.archived_at && routine.archived_at.slice(0, 10) <= date) {
      return [];
    }

    const schedule = latestScheduleForDate(schedules, routine.id, date);

    if (!schedule || !schedule.weekdays.includes(isoWeekday)) {
      return [];
    }

    const completion = completionsByRoutine.get(routine.id);

    return [
      {
        id: routine.id,
        name: routine.name,
        description: routine.description,
        color: routine.color,
        preferredTime: schedule.preferred_time,
        timePeriod: schedule.time_period,
        completed: Boolean(completion),
        completedAt: completion?.completed_at ?? null,
      },
    ];
  });

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;

  return {
    date,
    items,
    completedCount,
    totalCount,
    completionRate: totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100),
  };
}
