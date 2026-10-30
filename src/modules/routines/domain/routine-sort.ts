import type { RoutineDayItem } from "@/modules/routines/domain/routine-day";

export type RoutineSort = "schedule" | "name" | "completion";

const periodOrder: Record<string, number> = { morning: 0, afternoon: 1, evening: 2 };
export const timePeriodLabels: Record<string, string> = { morning: "오전", afternoon: "오후", evening: "저녁" };

export type RoutinePeriodGroup = "morning" | "afternoon" | "evening" | "unscheduled";

export const routinePeriodGroupLabels: Record<RoutinePeriodGroup, string> = {
  morning: "오전 루틴",
  afternoon: "오후 루틴",
  evening: "저녁 루틴",
  unscheduled: "시간 미지정",
};

export function getRoutinePeriodGroup(item: Pick<RoutineDayItem, "preferredTime" | "timePeriod">): RoutinePeriodGroup {
  if (item.preferredTime) {
    const hour = Number(item.preferredTime.slice(0, 2));
    if (hour < 12) return "morning";
    if (hour < 18) return "afternoon";
    return "evening";
  }
  if (item.timePeriod === "morning" || item.timePeriod === "afternoon" || item.timePeriod === "evening") return item.timePeriod;
  return "unscheduled";
}

export function groupRoutineItemsByPeriod(items: readonly RoutineDayItem[]) {
  const order: RoutinePeriodGroup[] = ["morning", "afternoon", "evening", "unscheduled"];
  return order
    .map((id) => ({ id, label: routinePeriodGroupLabels[id], items: items.filter((item) => getRoutinePeriodGroup(item) === id) }))
    .filter((group) => group.items.length > 0);
}

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
