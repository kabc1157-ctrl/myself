import { describe, expect, it } from "vitest";

import type { RoutineDayItem } from "./routine-day";
import { getRoutineScheduleLabel, sortRoutineItems } from "./routine-sort";

const item = (name: string, preferredTime: string | null, timePeriod: string | null, completed = false): RoutineDayItem => ({
  id: name, name, description: null, color: null, preferredTime, timePeriod, completed, completedAt: null,
});

describe("routine sorting", () => {
  it("정확한 시간, 시간대, 이름 순으로 정렬한다", () => {
    const result = sortRoutineItems([
      item("가나다", null, null), item("저녁", null, "evening"), item("오전", null, "morning"),
      item("늦은 시간", "18:00:00", null), item("이른 시간", "07:00:00", null), item("오후", null, "afternoon"),
    ], "schedule");
    expect(result.map((routine) => routine.name)).toEqual(["이른 시간", "늦은 시간", "오전", "오후", "저녁", "가나다"]);
  });

  it("표시할 시간대 이름을 반환한다", () => {
    expect(getRoutineScheduleLabel(item("아침", null, "morning"))).toBe("오전");
    expect(getRoutineScheduleLabel(item("시간", "09:00:00", null))).toBe("09:00");
  });
});
