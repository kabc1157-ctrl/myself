import { describe, expect, it } from "vitest";
import { countPlannerCalendarItems } from "./planner-calendar-count";

describe("countPlannerCalendarItems", () => {
  it("counts every planned brain-dump task and calendar event", () => {
    expect(countPlannerCalendarItems("2026-11-04", "Asia/Seoul", [
      { title: "첫 일정", planned_date: "2026-11-04", start_time: "09:00", end_time: "10:00" },
      { title: "둘째 일정", planned_date: "2026-11-04", start_time: "11:00", end_time: "12:00" },
      { title: "셋째 일정", planned_date: "2026-11-04", start_time: "13:00", end_time: "14:00" },
    ], [
      { title: "캘린더 일정", date: "2026-11-04", startTime: "2026-11-04T15:00:00+09:00", endTime: "2026-11-04T16:00:00+09:00" },
      { title: "캘린더 일정 2", date: "2026-11-04", startTime: null, endTime: null },
      { title: "캘린더 일정 3", date: "2026-11-04", startTime: null, endTime: null },
    ])).toBe(6);
  });

  it("does not count the same title and time twice", () => {
    const task = { title: "중복 일정", planned_date: "2026-11-04", start_time: "09:00", end_time: "10:00" };
    expect(countPlannerCalendarItems("2026-11-04", "Asia/Seoul", [task], [{ title: " 중복   일정 ", date: "2026-11-04", startTime: "2026-11-04T00:00:00.000Z", endTime: "2026-11-04T01:00:00.000Z" }])).toBe(1);
  });
});
