import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  APP_OWNER_EMAIL: z.email().optional(),
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  GOOGLE_CALENDAR_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CALENDAR_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_CALENDAR_REDIRECT_URI: z.url().optional(),
  INTEGRATION_TOKEN_ENCRYPTION_KEY: z.string().min(32).optional(),
  N8N_INTEGRATION_SECRET: z.string().min(24).optional(),
  NOTION_CLIENT_ID: z.string().min(1).optional(),
  NOTION_CLIENT_SECRET: z.string().min(1).optional(),
  NOTION_REDIRECT_URI: z.url().optional(),
  NOTION_BETA_USER_IDS: z.string().optional(),
});

export function getServerEnv() {
  return serverEnvSchema.parse({
    APP_OWNER_EMAIL: process.env.APP_OWNER_EMAIL || undefined,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY || undefined,
    GOOGLE_CALENDAR_CLIENT_ID: process.env.GOOGLE_CALENDAR_CLIENT_ID || undefined,
    GOOGLE_CALENDAR_CLIENT_SECRET: process.env.GOOGLE_CALENDAR_CLIENT_SECRET || undefined,
    GOOGLE_CALENDAR_REDIRECT_URI: process.env.GOOGLE_CALENDAR_REDIRECT_URI || undefined,
    INTEGRATION_TOKEN_ENCRYPTION_KEY: process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY || undefined,
    N8N_INTEGRATION_SECRET: process.env.N8N_INTEGRATION_SECRET || undefined,
    NOTION_CLIENT_ID: process.env.NOTION_CLIENT_ID || undefined,
    NOTION_CLIENT_SECRET: process.env.NOTION_CLIENT_SECRET || undefined,
    NOTION_REDIRECT_URI: process.env.NOTION_REDIRECT_URI || undefined,
    NOTION_BETA_USER_IDS: process.env.NOTION_BETA_USER_IDS || undefined,
  });
}
