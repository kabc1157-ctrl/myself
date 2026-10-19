import type { CookieOptions } from "@supabase/ssr";

export const SESSION_ONLY_COOKIE_NAME = "life-session-only";

export function getAuthCookieOptions(
  options: CookieOptions,
  sessionOnly: boolean,
): CookieOptions {
  if (!sessionOnly) {
    return options;
  }

  const sessionOptions = { ...options };
  delete sessionOptions.expires;
  delete sessionOptions.maxAge;
  return sessionOptions;
}
