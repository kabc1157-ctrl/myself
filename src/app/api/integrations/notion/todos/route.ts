import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/core/auth/session";
import { isNotionBetaUser } from "@/core/integrations/notion/access";
import { createAdminSupabaseClient } from "@/core/db/supabase/server";
import { decryptNotionToken } from "@/core/integrations/notion/crypto";
import { queryNotionDatabase, updateNotionPage } from "@/core/integrations/notion/client";

const adminDb = () => createAdminSupabaseClient() as any;

export async function GET(request: NextRequest) {
  const session = await verifySession();
  if (!isNotionBetaUser(session.userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = adminDb();
  const [{ data: connection }, { data: config }] = await Promise.all([
    db.from("notion_connections").select("access_token_ciphertext").eq("user_id", session.userId).maybeSingle(),
    db.from("notion_todo_configs").select("*").eq("user_id", session.userId).maybeSingle(),
  ]);
  if (!connection || !config?.data_source_id) return NextResponse.json({ todos: [], configured: false });
  try {
    const date = request.nextUrl.searchParams.get("date") ?? undefined;
    const result = await queryNotionDatabase(decryptNotionToken(connection.access_token_ciphertext), config.data_source_id, config.date_property_id ?? undefined, date);
    return NextResponse.json({ todos: result.results, configured: true });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Notion sync failed" }, { status: 502 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await verifySession();
  if (!isNotionBetaUser(session.userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json() as { pageId?: string; properties?: Record<string, unknown> };
  if (!body.pageId || !body.properties) return NextResponse.json({ error: "pageId and properties are required" }, { status: 400 });
  const db = adminDb();
  const { data: connection } = await db.from("notion_connections").select("access_token_ciphertext").eq("user_id", session.userId).maybeSingle();
  if (!connection) return NextResponse.json({ error: "Notion is not connected" }, { status: 409 });
  try {
    const page = await updateNotionPage(decryptNotionToken(connection.access_token_ciphertext), body.pageId, body.properties);
    return NextResponse.json({ page });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Notion update failed" }, { status: 502 });
  }
}
