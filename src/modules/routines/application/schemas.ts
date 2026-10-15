import { z } from "zod";

export const createRoutineSchema = z.object({
  name: z.string().trim().min(1, "루틴 이름을 입력해 주세요.").max(80),
  description: z.string().trim().max(500).optional(),
  weekdays: z
    .array(z.coerce.number().int().min(1).max(7))
    .min(1, "실행할 요일을 하나 이상 선택해 주세요.")
    .transform((days) => [...new Set(days)].sort()),
  preferredTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "시간 형식을 확인해 주세요.")
    .optional()
    .or(z.literal("")),
  timePeriod: z.enum(["morning", "afternoon", "evening"]).optional().or(z.literal("")),
  startDate: z.string().date("시작일을 확인해 주세요."),
  endDate: z.string().date("종료일을 확인해 주세요.").optional().or(z.literal("")),
}).refine((value) => !value.endDate || value.endDate >= value.startDate, {
  message: "종료일은 시작일보다 빠를 수 없어요.",
  path: ["endDate"],
});

export const reviewSchema = z.object({
  reflection: z.string().trim().min(1, "회고를 입력해 주세요.").max(5000),
});

export const routineIdSchema = z.uuid();
export const routineDateSchema = z.string().date();
