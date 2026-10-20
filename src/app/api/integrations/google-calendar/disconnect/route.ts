import { NextRequest, NextResponse } from "next/server";

import { verifySession } from "@/core/auth/session";
import { createAdminSupabaseClient } from "@/core/db/supabase/server";
import { decryptGoogleToken } from "@/core/integrations/google-calendar/crypto";

export async function POST(request: NextRequest) {
  const session = await verifySession();
  const admin = createAdminSupabaseClient();
  const { data } = await admin.from("google_calendar_connections")
    .select("access_token_ciphertext")
    .eq("user_id", session.userId)
    .maybeSingle();
  if (data?.access_token_ciphertext) {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(decryptGoogleToken(data.access_token_ciphertext))}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      cache: "no-store",
    }).catch(() => undefined);
  }
  await admin.from("google_calendar_connections").delete().eq("user_id", session.userId);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
  return NextResponse.redirect(new URL("/my-page?calendar=disconnected", baseUrl), 303);
}
