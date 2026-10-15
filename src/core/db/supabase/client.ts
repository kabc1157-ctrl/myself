import { createBrowserClient } from "@supabase/ssr";

import { getPublicEnv } from "@/core/config/env";
import type { Database } from "@/core/db/database.types";

export function createBrowserSupabaseClient() {
  const env = getPublicEnv();

  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
