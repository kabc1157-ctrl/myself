import { describe, expect, it } from "vitest";

import { bulkWorkShiftSchema, workplaceSchema, workShiftSchema } from "./schemas";

describe("payroll schemas", () => {
  it("근무지 입력을 숫자 값으로 변환한다", () => {
    expect(
      workplaceSchema.parse({
        name: " 카페 ",
        defaultPayType: "hourly",
        defaultRate: "12000",
        payPeriodStartDay: "5",
        payDay: "10",
        defaultStartTime: "09:00",
        defaultEndTime: "18:00",
        defaultBreakMinutes: "60",
      }),
    ).toMatchObject({ name: "카페", defaultRate: 12000, payPeriodStartDay: 5 });
  });

  it("시급 근무에는 시작·종료 시간을 요구한다", () => {
    const result = workShiftSchema.safeParse({
      workplaceId: "11111111-1111-4111-8111-111111111111",
      workDate: "2026-10-13",
      breakMinutes: "0",
      payType: "hourly",
      payRate: "10000",
      quantity: "1",
      additionalPay: "0",
    });

    expect(result.success).toBe(false);
  });

  it("요일별 월간 일괄 등록 입력을 검증한다", () => {
    expect(bulkWorkShiftSchema.parse({
      workplaceId: "11111111-1111-4111-8111-111111111111",
      month: "2026-10",
      weekdays: ["1", "3", "5"],
    })).toEqual({
      workplaceId: "11111111-1111-4111-8111-111111111111",
      month: "2026-10",
      weekdays: [1, 3, 5],
    });

    expect(bulkWorkShiftSchema.safeParse({
      workplaceId: "11111111-1111-1111-1111-111111111111",
      month: "2026-10",
      weekdays: [],
    }).success).toBe(false);
  });
});
