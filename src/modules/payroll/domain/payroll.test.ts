import { describe, expect, it } from "vitest";

import { calculateShiftPay, getWorkedMinutes } from "./payroll";

describe("payroll calculations", () => {
  it("휴게 시간을 제외해 시급을 계산한다", () => {
    const shift = {
      workDate: "2026-10-13",
      startTime: "09:00",
      endTime: "18:00",
      breakMinutes: 60,
      payType: "hourly" as const,
      payRate: 10000,
      quantity: 1,
      additionalPay: 5000,
    };

    expect(getWorkedMinutes(shift)).toBe(480);
    expect(calculateShiftPay(shift)).toBe(85000);
  });

  it("자정을 넘긴 근무와 건별 급여를 계산한다", () => {
    expect(
      getWorkedMinutes({
        workDate: "2026-10-13",
        startTime: "22:00",
        endTime: "02:00",
        breakMinutes: 30,
        payType: "hourly",
        payRate: 10000,
        quantity: 1,
        additionalPay: 0,
      }),
    ).toBe(210);
    expect(
      calculateShiftPay({
        workDate: "2026-10-13",
        startTime: null,
        endTime: null,
        breakMinutes: 0,
        payType: "per_task",
        payRate: 15000,
        quantity: 3,
        additionalPay: 2000,
      }),
    ).toBe(47000);
  });
});
