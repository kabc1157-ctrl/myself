import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/core/auth/session";
import { isNotionBetaUser } from "@/core/integrations/notion/access";
import { createAdminSupabaseClient } from "@/core/db/supabase/server";

export async function GET() {
  const session = await verifySession();
  if (!isNotionBetaUser(session.userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = createAdminSupabaseClient() as any;
  const { data, error } = await db.from("notion_todo_configs").select("*").eq("user_id", session.userId).maybeSingle();
  if (error) return NextResponse.json({ error: "Notion 설정을 읽지 못했습니다." }, { status: 500 });
  return NextResponse.json({ config: data });
}

export async function PUT(request: NextRequest) {
  const session = await verifySession();
  if (!isNotionBetaUser(session.userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json() as Record<string, unknown>;
  const required = ["databaseId", "titlePropertyId"];
  if (required.some((key) => typeof body[key] !== "string" || !(body[key] as string).trim())) return NextResponse.json({ error: "데이터베이스와 제목 속성을 선택해 주세요." }, { status: 400 });
  const db = createAdminSupabaseClient() as any;
  const { data, error } = await db.from("notion_todo_configs").upsert({
    user_id: session.userId,
    database_id: body.databaseId,
    data_source_id: body.dataSourceId || body.databaseId,
    title_property_id: body.titlePropertyId,
    date_property_id: body.datePropertyId || null,
    completed_property_id: body.completedPropertyId || null,
    memo_property_id: body.memoPropertyId || null,
    start_time_property_id: body.startTimePropertyId || null,
    end_time_property_id: body.endTimePropertyId || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" }).select("*").single();
  if (error) return NextResponse.json({ error: "Notion 설정을 저장하지 못했습니다." }, { status: 500 });
  return NextResponse.json({ config: data });
}
