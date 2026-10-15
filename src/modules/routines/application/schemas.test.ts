import { describe, expect, it } from "vitest";

import { createRoutineSchema, reviewSchema } from "./schemas";

describe("createRoutineSchema", () => {
  it("중복 요일을 제거하고 정렬한다", () => {
    const result = createRoutineSchema.parse({
      name: "  운동  ",
      weekdays: [5, 1, 5],
      preferredTime: "07:30",
      startDate: "2026-10-14",
    });

    expect(result.name).toBe("운동");
    expect(result.weekdays).toEqual([1, 5]);
  });

  it("요일이 없으면 거부한다", () => {
    expect(() => createRoutineSchema.parse({ name: "운동", weekdays: [], startDate: "2026-10-14" })).toThrow();
  });

  it("종료일이 시작일보다 빠르면 거부한다", () => {
    expect(() => createRoutineSchema.parse({
      name: "운동",
      weekdays: [1],
      startDate: "2026-10-14",
      endDate: "2026-10-13",
    })).toThrow();
  });
});

describe("reviewSchema", () => {
  it("공백만 있는 회고를 거부한다", () => {
    expect(() => reviewSchema.parse({ reflection: "   " })).toThrow();
  });
});
