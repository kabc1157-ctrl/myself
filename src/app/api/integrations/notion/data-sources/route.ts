import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/core/auth/session";
import { isNotionBetaUser } from "@/core/integrations/notion/access";
import { createAdminSupabaseClient } from "@/core/db/supabase/server";
import { decryptNotionToken } from "@/core/integrations/notion/crypto";
import { findChildDatabases, getNotionDatabase, searchNotion } from "@/core/integrations/notion/client";

export async function GET(request: NextRequest) {
  const session = await verifySession();
  if (!isNotionBetaUser(session.userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data, error } = await createAdminSupabaseClient().from("notion_connections").select("access_token_ciphertext").eq("user_id", session.userId).maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Notion is not connected" }, { status: 409 });
  try {
    const token = decryptNotionToken(data.access_token_ciphertext);
    const sourceId = request.nextUrl.searchParams.get("id");
    if (sourceId) return NextResponse.json({ dataSource: await getNotionDatabase(token, sourceId) });
    const result = await searchNotion(token, request.nextUrl.searchParams.get("q") ?? "");
    const databases = result.results.filter((item) => item.object === "database");
    const pages = result.results.filter((item) => item.object === "page").map((item) => item.id).slice(0, 8);
    const nested = await findChildDatabases(token, pages);
    const unique = new Map([...databases, ...nested].map((item) => [item.id, item]));
    return NextResponse.json({ results: [...unique.values()] });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Notion request failed" }, { status: 502 });
  }
}
