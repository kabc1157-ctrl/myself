import { describe, expect, it } from "vitest";
import { getHomeNowSchedule, type HomeScheduleTask } from "./home-now-schedule";

const task = (id: string, start_time: string, end_time: string): HomeScheduleTask => ({
  id, title: id, planned_date: "2026-11-05", start_time, end_time,
});

describe("getHomeNowSchedule", () => {
  it("returns all overlapping current tasks and the nearest next tasks", () => {
    const result = getHomeNowSchedule([
      task("current-a", "09:00", "11:00"), task("current-b", "10:00", "12:00"),
      task("next-a", "13:00", "14:00"), task("next-b", "13:00", "15:00"), task("later", "15:00", "16:00"),
    ], "2026-11-05", 10 * 60 + 30);
    expect(result.current.map(({ id }) => id)).toEqual(["current-a", "current-b"]);
    expect(result.next.map(({ id }) => id)).toEqual(["next-a", "next-b"]);
  });

  it("does not treat ended tasks or another date as current or next", () => {
    const result = getHomeNowSchedule([task("ended", "08:00", "09:00"), task("other", "11:00", "12:00")], "2026-11-04", 10 * 60);
    expect(result).toEqual({ current: [], next: [] });
  });
});
