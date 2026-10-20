import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { verifySession } from "@/core/auth/session";
import { getServerEnv } from "@/core/config/server-env";
import { createAdminSupabaseClient } from "@/core/db/supabase/server";
import { encryptGoogleToken } from "@/core/integrations/google-calendar/crypto";

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
};

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
  const session = await verifySession();
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("google_calendar_oauth_state")?.value;
  cookieStore.delete("google_calendar_oauth_state");
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (request.nextUrl.searchParams.get("error") || !code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/my-page?calendar=denied", baseUrl));
  }

  const env = getServerEnv();
  if (!env.GOOGLE_CALENDAR_CLIENT_ID || !env.GOOGLE_CALENDAR_CLIENT_SECRET || !env.GOOGLE_CALENDAR_REDIRECT_URI || !env.INTEGRATION_TOKEN_ENCRYPTION_KEY) {
    return NextResponse.redirect(new URL("/my-page?calendar=setup-required", baseUrl));
  }
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CALENDAR_CLIENT_ID,
      client_secret: env.GOOGLE_CALENDAR_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: env.GOOGLE_CALENDAR_REDIRECT_URI,
    }),
    cache: "no-store",
  });
  if (!response.ok) return NextResponse.redirect(new URL("/my-page?calendar=token-error", baseUrl));
  const token = await response.json() as GoogleTokenResponse;
  if (!token.access_token || !token.expires_in) return NextResponse.redirect(new URL("/my-page?calendar=token-error", baseUrl));

  const calendarResponse = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary", {
    headers: { Authorization: `Bearer ${token.access_token}` },
    cache: "no-store",
  });
  const calendar = calendarResponse.ok ? await calendarResponse.json() as { id?: string; summary?: string } : {};
  const admin = createAdminSupabaseClient();
  const { data: previous } = await admin.from("google_calendar_connections")
    .select("refresh_token_ciphertext")
    .eq("user_id", session.userId)
    .maybeSingle();
  const { error } = await admin.from("google_calendar_connections").upsert({
    user_id: session.userId,
    access_token_ciphertext: encryptGoogleToken(token.access_token),
    refresh_token_ciphertext: token.refresh_token ? encryptGoogleToken(token.refresh_token) : previous?.refresh_token_ciphertext ?? null,
    access_token_expires_at: new Date(Date.now() + token.expires_in * 1000).toISOString(),
    account_email: calendar.summary ?? null,
    calendar_id: "primary",
    connected_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  return NextResponse.redirect(new URL(error ? "/my-page?calendar=save-error" : "/my-page?calendar=connected", baseUrl));
}
