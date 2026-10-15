import type { RoutineDayItem } from "@/modules/routines/domain/routine-day";

export type RoutineSort = "schedule" | "name" | "completion";

const periodOrder: Record<string, number> = { morning: 0, afternoon: 1, evening: 2 };
export const timePeriodLabels: Record<string, string> = { morning: "오전", afternoon: "오후", evening: "저녁" };

function scheduleKey(item: RoutineDayItem) {
  if (item.preferredTime) return [0, item.preferredTime] as const;
  if (item.timePeriod) return [1 + (periodOrder[item.timePeriod] ?? 3), ""] as const;
  return [5, ""] as const;
}

export function sortRoutineItems(items: readonly RoutineDayItem[], sort: RoutineSort) {
  return [...items].sort((left, right) => {
    if (sort === "completion" && left.completed !== right.completed) return Number(left.completed) - Number(right.completed);
    if (sort === "schedule") {
      const leftKey = scheduleKey(left);
      const rightKey = scheduleKey(right);
      if (leftKey[0] !== rightKey[0]) return leftKey[0] - rightKey[0];
      if (leftKey[1] !== rightKey[1]) return leftKey[1].localeCompare(rightKey[1]);
    }
    return left.name.localeCompare(right.name, "ko");
  });
}

export function getRoutineScheduleLabel(item: Pick<RoutineDayItem, "preferredTime" | "timePeriod">) {
  if (item.preferredTime) return item.preferredTime.slice(0, 5);
  if (item.timePeriod) return timePeriodLabels[item.timePeriod] ?? null;
  return null;
}
