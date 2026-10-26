import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import {
  getAuthCookieOptions,
  SESSION_ONLY_COOKIE_NAME,
} from "@/core/auth/session-persistence";
import { getPublicEnv } from "@/core/config/env";
import type { Database } from "@/core/db/database.types";

const protectedPrefixes = [
  "/home",
  "/journal",
  "/routines",
  "/notes",
  "/reading",
  "/exercise",
  "/planner",
  "/payroll",
  "/discoveries",
  "/my-page",
];

export async function updateSupabaseSession(request: NextRequest) {
  const env = getPublicEnv();
  const sessionOnly = request.cookies.get(SESSION_ONLY_COOKIE_NAME)?.value === "1";
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(
              name,
              value,
              getAuthCookieOptions(options, sessionOnly),
            );
          });
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims?.sub);
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!isSignedIn && isProtected) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}
