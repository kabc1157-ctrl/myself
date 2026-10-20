import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  APP_OWNER_EMAIL: z.email().optional(),
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  NOTION_CLIENT_ID: z.string().min(1).optional(),
  NOTION_CLIENT_SECRET: z.string().min(1).optional(),
  NOTION_REDIRECT_URI: z.url().optional(),
  NOTION_TOKEN_ENCRYPTION_KEY: z.string().min(32).optional(),
  N8N_INTEGRATION_SECRET: z.string().min(24).optional(),
});

export function getServerEnv() {
  return serverEnvSchema.parse({
    APP_OWNER_EMAIL: process.env.APP_OWNER_EMAIL || undefined,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY || undefined,
    NOTION_CLIENT_ID: process.env.NOTION_CLIENT_ID || undefined,
    NOTION_CLIENT_SECRET: process.env.NOTION_CLIENT_SECRET || undefined,
    NOTION_REDIRECT_URI: process.env.NOTION_REDIRECT_URI || undefined,
    NOTION_TOKEN_ENCRYPTION_KEY: process.env.NOTION_TOKEN_ENCRYPTION_KEY || undefined,
    N8N_INTEGRATION_SECRET: process.env.N8N_INTEGRATION_SECRET || undefined,
  });
}
