import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import {
  getAuthCookieOptions,
  SESSION_ONLY_COOKIE_NAME,
} from "@/core/auth/session-persistence";
import { getPublicEnv } from "@/core/config/env";
import type { Database } from "@/core/db/database.types";

export async function createServerSupabaseClient({
  sessionOnly = false,
}: { sessionOnly?: boolean } = {}) {
  const cookieStore = await cookies();
  const env = getPublicEnv();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(
                name,
                value,
                getAuthCookieOptions(options, sessionOnly),
              );
            });
          } catch {
            // Server Components cannot write cookies. The root proxy refreshes them.
          }
        },
      },
    },
  );
}

export async function setLoginPersistenceCookie(rememberLogin: boolean) {
  const cookieStore = await cookies();

  if (rememberLogin) {
    cookieStore.delete(SESSION_ONLY_COOKIE_NAME);
    return;
  }

  cookieStore.set(SESSION_ONLY_COOKIE_NAME, "1", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
