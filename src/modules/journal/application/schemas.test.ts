import { describe, expect, it } from "vitest";

import { journalEntrySchema } from "./schemas";

describe("journalEntrySchema", () => {
  it("일기 입력을 정리한다", () => {
    expect(
      journalEntrySchema.parse({
        entryDate: "2026-10-13",
        title: "  오늘  ",
        body: "  좋은 하루였다.  ",
        mood: "4",
      }),
    ).toEqual({
      entryDate: "2026-10-13",
      title: "오늘",
      body: "좋은 하루였다.",
      mood: 4,
    });
  });

  it("빈 본문과 잘못된 기분 값을 거부한다", () => {
    expect(journalEntrySchema.safeParse({ entryDate: "2026-10-13", body: "" }).success).toBe(false);
    expect(
      journalEntrySchema.safeParse({ entryDate: "2026-10-13", body: "기록", mood: "9" }).success,
    ).toBe(false);
  });
});
