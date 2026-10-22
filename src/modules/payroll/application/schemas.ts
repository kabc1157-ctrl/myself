import { z } from "zod";

const payTypeSchema = z.enum(["hourly", "daily", "per_task", "bonus"]);
const moneySchema = z.coerce.number().min(0, "금액은 0원 이상이어야 합니다.").max(1_000_000_000);

export const workplaceSchema = z.object({
  name: z.string().trim().min(1, "근무지 이름을 적어 주세요.").max(80),
  defaultPayType: payTypeSchema,
  defaultRate: moneySchema,
  payPeriodStartDay: z.coerce.number().int().min(1).max(28),
  payDay: z.coerce.number().int().min(1).max(31),
  endDate: z.string().date("근무 종료일을 확인해 주세요.").optional(),
  defaultStartTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  defaultEndTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  defaultBreakMinutes: z.coerce.number().int().min(0).max(1439),
}).superRefine((value, context) => {
  if (value.defaultPayType === "hourly" && (!value.defaultStartTime || !value.defaultEndTime)) {
    context.addIssue({ code: "custom", message: "시급 근무는 기본 시작·종료 시간을 입력해 주세요.", path: ["defaultStartTime"] });
  }
});

export const workShiftSchema = z
  .object({
    workplaceId: z.string().uuid("근무지를 선택해 주세요."),
    workDate: z.string().date("근무 날짜를 확인해 주세요."),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    breakMinutes: z.coerce.number().int().min(0).max(1439),
    payType: payTypeSchema,
    payRate: moneySchema,
    quantity: z.coerce.number().positive("수량은 0보다 커야 합니다.").max(100000),
    additionalPay: moneySchema,
    memo: z.string().trim().max(1000).optional().transform((value) => value || undefined),
  })
  .superRefine((value, context) => {
    if (value.payType === "hourly" && (!value.startTime || !value.endTime)) {
      context.addIssue({
        code: "custom",
        message: "시급 근무는 시작과 종료 시간을 모두 입력해 주세요.",
        path: ["startTime"],
      });
    }
    if ((value.startTime && !value.endTime) || (!value.startTime && value.endTime)) {
      context.addIssue({
        code: "custom",
        message: "시간을 기록하려면 시작과 종료 시간을 모두 입력해 주세요.",
        path: ["startTime"],
      });
    }
  });

export const shiftIdSchema = z.string().uuid();
export const workplaceIdSchema = z.string().uuid();

export const bulkWorkShiftSchema = z.object({
  workplaceId: workplaceIdSchema,
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "등록할 월을 확인해 주세요."),
  weekdays: z.array(z.coerce.number().int().min(1).max(7)).min(1, "근무 요일을 하나 이상 선택해 주세요."),
});
