import { z } from "zod";

export const profileSettingsSchema = z.object({
  displayName: z
    .string()
    .trim()
    .max(80, "이름은 80자 이하로 적어 주세요.")
    .optional()
    .transform((value) => value || undefined),
  weekStartsOn: z.enum(["1", "7"]).transform(Number),
});
