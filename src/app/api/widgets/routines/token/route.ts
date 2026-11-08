import { NextResponse } from "next/server";
import { verifySession } from "@/core/auth/session";
import { createAdminSupabaseClient } from "@/core/db/supabase/server";
import { createRoutineWidgetToken } from "@/core/widgets/routine-widget-token";

export async function POST() {
  const session = await verifySession();
  const { token, hash } = createRoutineWidgetToken();
  const supabase = createAdminSupabaseClient() as any;
  const { data, error } = await supabase.from("routine_widget_tokens").insert({ user_id: session.userId, token_hash: hash, expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString() }).select("id, expires_at, label").single();
  if (error) return NextResponse.json({ error: "위젯 토큰을 발급하지 못했습니다." }, { status: 500 });
  return NextResponse.json({ token, ...data }, { status: 201, headers: { "Cache-Control": "no-store" } });
}

export async function DELETE() {
  const session = await verifySession();
  const supabase = createAdminSupabaseClient() as any;
  const { error } = await supabase.from("routine_widget_tokens").update({ revoked_at: new Date().toISOString() }).eq("user_id", session.userId).is("revoked_at", null);
  if (error) return NextResponse.json({ error: "위젯 토큰을 폐기하지 못했습니다." }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
