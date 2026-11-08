import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/core/auth/session";
import { isNotionBetaUser } from "@/core/integrations/notion/access";
import { createAdminSupabaseClient } from "@/core/db/supabase/server";

export async function POST(request: NextRequest) {
  const session = await verifySession();
  if (!isNotionBetaUser(session.userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json() as { pageId?: string; title?: string; plannedDate?: string; priority?: number };
  if (!body.pageId || !body.title?.trim()) return NextResponse.json({ error: "pageId와 title이 필요합니다." }, { status: 400 });
  const db = createAdminSupabaseClient() as any;
  const { data: existing } = await db.from("notion_todo_links").select("planner_task_id").eq("user_id", session.userId).eq("notion_page_id", body.pageId).maybeSingle();
  if (existing?.planner_task_id) return NextResponse.json({ plannerTaskId: existing.planner_task_id, alreadyAdded: true });
  const { data: task, error: taskError } = await db.from("planner_tasks").insert({ user_id: session.userId, title: body.title.trim(), planned_date: body.plannedDate || null, priority: body.priority ?? null }).select("id").single();
  if (taskError) return NextResponse.json({ error: "하루 시간표에 추가하지 못했습니다." }, { status: 500 });
  const { error: linkError } = await db.from("notion_todo_links").upsert({ user_id: session.userId, notion_page_id: body.pageId, planner_task_id: task.id, title: body.title.trim(), planned_date: body.plannedDate || null, is_completed: false, last_synced_at: new Date().toISOString(), sync_status: "synced", updated_at: new Date().toISOString() }, { onConflict: "user_id,notion_page_id" });
  if (linkError) return NextResponse.json({ error: "Notion 연결 정보를 저장하지 못했습니다." }, { status: 500 });
  return NextResponse.json({ plannerTaskId: task.id });
}
