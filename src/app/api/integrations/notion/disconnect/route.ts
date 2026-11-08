import { NextResponse } from "next/server";
import { verifySession } from "@/core/auth/session";
import { createAdminSupabaseClient } from "@/core/db/supabase/server";
import { isNotionBetaUser } from "@/core/integrations/notion/access";

export async function POST() {
  const session = await verifySession();
  if (!isNotionBetaUser(session.userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { error } = await createAdminSupabaseClient().from("notion_connections").delete().eq("user_id", session.userId);
  return NextResponse.redirect(new URL(`/my-page?notion=${error ? "disconnect-error" : "disconnected"}`, process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"));
}
