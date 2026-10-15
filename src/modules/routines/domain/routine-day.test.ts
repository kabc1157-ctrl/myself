import { describe, expect, it } from "vitest";

import type { Tables } from "@/core/db/database.types";

import { buildRoutineDay } from "./routine-day";

const routine = {
  id: "routine-1",
  user_id: "user-1",
  name: "물 마시기",
  description: null,
  color: null,
  sort_order: 0,
  start_date: "2026-10-01",
  end_date: null,
  archived_at: null,
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
} satisfies Tables<"routines">;

const baseSchedule = {
  id: "schedule-1",
  routine_id: routine.id,
  user_id: routine.user_id,
  effective_from: "2026-10-01",
  weekdays: [1, 3, 5],
  preferred_time: null,
  time_period: null,
  created_at: "2026-10-01T00:00:00Z",
} satisfies Tables<"routine_schedule_versions">;

describe("buildRoutineDay", () => {
  it("해당 요일의 루틴과 달성률을 계산한다", () => {
    const day = buildRoutineDay("2026-10-12", [routine], [baseSchedule], [
      {
        id: "completion-1",
        routine_id: routine.id,
        user_id: routine.user_id,
        routine_date: "2026-10-12",
        completed_at: "2026-10-12T01:00:00Z",
        note: null,
        created_at: "2026-10-12T01:00:00Z",
        updated_at: "2026-10-12T01:00:00Z",
      },
    ]);

    expect(day.totalCount).toBe(1);
    expect(day.completedCount).toBe(1);
    expect(day.completionRate).toBe(100);
    expect(day.items[0]?.completed).toBe(true);
  });

  it("일정 변경 전 날짜는 과거 버전을 사용한다", () => {
    const changedSchedule = {
      ...baseSchedule,
      id: "schedule-2",
      effective_from: "2026-10-13",
      weekdays: [2],
    };

    expect(buildRoutineDay("2026-10-12", [routine], [baseSchedule, changedSchedule], []).totalCount).toBe(1);
    expect(buildRoutineDay("2026-10-13", [routine], [baseSchedule, changedSchedule], []).totalCount).toBe(1);
    expect(buildRoutineDay("2026-10-14", [routine], [baseSchedule, changedSchedule], []).totalCount).toBe(0);
  });

  it("예정된 루틴이 없으면 달성률을 0으로 계산한다", () => {
    expect(buildRoutineDay("2026-10-13", [], [], []).completionRate).toBe(0);
  });

  it("루틴의 시작일과 종료일 밖에서는 일정에 포함하지 않는다", () => {
    const datedRoutine = { ...routine, start_date: "2026-10-12", end_date: "2026-10-12" };

    expect(buildRoutineDay("2026-10-09", [datedRoutine], [baseSchedule], []).totalCount).toBe(0);
    expect(buildRoutineDay("2026-10-12", [datedRoutine], [baseSchedule], []).totalCount).toBe(1);
    expect(buildRoutineDay("2026-10-19", [datedRoutine], [baseSchedule], []).totalCount).toBe(0);
  });
});
