import { z } from "zod";

export const journalEntrySchema = z.object({
  entryDate: z.string().date("날짜를 확인해 주세요."),
  title: z
    .string()
    .trim()
    .max(120, "제목은 120자 이하로 적어 주세요.")
    .optional()
    .transform((value) => value || undefined),
  body: z
    .string()
    .trim()
    .min(1, "오늘의 기록을 적어 주세요.")
    .max(20000, "일기는 20,000자 이하로 적어 주세요."),
  mood: z
    .enum(["1", "2", "3", "4", "5"])
    .optional()
    .transform((value) => (value ? Number(value) : undefined)),
});
