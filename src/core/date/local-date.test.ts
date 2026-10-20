import { describe, expect, it } from "vitest";

import {
  formatKoreanDate,
  getIsoWeekday,
  getCalendarLeadingDays,
  getCalendarWeekdays,
  getLocalDate,
  getMonthRange,
  isMonth,
  shiftDate,
  shiftMonth,
} from "./local-date";

describe("getLocalDate", () => {
  it("사용자 시간대를 기준으로 날짜를 계산한다", () => {
    const instant = new Date("2026-10-12T15:30:00.000Z");

    expect(getLocalDate("Asia/Seoul", instant)).toBe("2026-10-13");
    expect(getLocalDate("America/Los_Angeles", instant)).toBe("2026-10-12");
  });
});

describe("getIsoWeekday", () => {
  it("월요일을 1, 일요일을 7로 반환한다", () => {
    expect(getIsoWeekday("2026-10-12")).toBe(1);
    expect(getIsoWeekday("2026-10-18")).toBe(7);
  });
});

describe("calendar week start", () => {
  it("orders weekdays from the saved start day", () => {
    expect(getCalendarWeekdays(1)).toEqual(["월", "화", "수", "목", "금", "토", "일"]);
    expect(getCalendarWeekdays(7)).toEqual(["일", "월", "화", "수", "목", "금", "토"]);
  });

  it("calculates leading cells for Monday and Sunday calendars", () => {
    expect(getCalendarLeadingDays("2026-10-01", 1)).toBe(3);
    expect(getCalendarLeadingDays("2026-10-01", 7)).toBe(4);
    expect(getCalendarLeadingDays("2026-11-01", 7)).toBe(0);
  });
});

describe("date helpers", () => {
  it("날짜와 월을 시간대 흔들림 없이 이동한다", () => {
    expect(shiftDate("2026-03-01", -1)).toBe("2026-02-28");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(getMonthRange("2026-12")).toEqual({
      start: "2026-12-01",
      endExclusive: "2027-01-01",
    });
  });

  it("월 쿼리와 한국어 날짜를 처리한다", () => {
    expect(isMonth("2026-10")).toBe(true);
    expect(isMonth("2026-13")).toBe(false);
    expect(formatKoreanDate("2026-10-13")).toBe("2026년 10월 13일");
  });
});
