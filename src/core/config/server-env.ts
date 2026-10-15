import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  APP_OWNER_EMAIL: z.email().optional(),
});

export function getServerEnv() {
  return serverEnvSchema.parse({
    APP_OWNER_EMAIL: process.env.APP_OWNER_EMAIL || undefined,
  });
}
