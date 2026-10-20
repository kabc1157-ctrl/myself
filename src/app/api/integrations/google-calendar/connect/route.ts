import { randomBytes } from "node:crypto";

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { verifySession } from "@/core/auth/session";
import { getServerEnv } from "@/core/config/server-env";

export async function GET(request: NextRequest) {
  await verifySession();
  const env = getServerEnv();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
  if (!env.GOOGLE_CALENDAR_CLIENT_ID || !env.GOOGLE_CALENDAR_CLIENT_SECRET || !env.GOOGLE_CALENDAR_REDIRECT_URI || !env.INTEGRATION_TOKEN_ENCRYPTION_KEY) {
    return NextResponse.redirect(new URL("/my-page?calendar=setup-required", baseUrl));
  }

  const state = randomBytes(24).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set("google_calendar_oauth_state", state, {
    httpOnly: true,
    maxAge: 600,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizationUrl.searchParams.set("client_id", env.GOOGLE_CALENDAR_CLIENT_ID);
  authorizationUrl.searchParams.set("redirect_uri", env.GOOGLE_CALENDAR_REDIRECT_URI);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("access_type", "offline");
  authorizationUrl.searchParams.set("prompt", "consent");
  authorizationUrl.searchParams.set("include_granted_scopes", "true");
  authorizationUrl.searchParams.set("scope", [
    "https://www.googleapis.com/auth/calendar.events.readonly",
    "https://www.googleapis.com/auth/calendar.calendars.readonly",
  ].join(" "));
  authorizationUrl.searchParams.set("state", state);
  return NextResponse.redirect(authorizationUrl);
}
