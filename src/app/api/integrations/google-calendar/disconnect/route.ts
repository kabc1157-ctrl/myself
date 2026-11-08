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
    try {
      const token = decryptGoogleToken(data.access_token_ciphertext);
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        cache: "no-store",
      });
    } catch {
      // Google 토큰이 이미 만료되었거나 복호화할 수 없어도
      // 이음새 내부 연결 해제는 계속 진행한다.
    }
  }
  const { error } = await admin.from("google_calendar_connections").delete().eq("user_id", session.userId);
  const result = error ? "disconnect-error" : "disconnected";

  // 외부 환경변수의 오타·구도메인 때문에 흰 화면으로 빠지지 않도록
  // 현재 요청이 들어온 동일한 origin으로만 복귀한다.
  return NextResponse.redirect(new URL(`/my-page?calendar=${result}`, request.nextUrl.origin), 303);
}
