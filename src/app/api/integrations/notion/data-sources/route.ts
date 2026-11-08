import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/core/auth/session";
import { isNotionBetaUser } from "@/core/integrations/notion/access";
import { createAdminSupabaseClient } from "@/core/db/supabase/server";
import { decryptNotionToken } from "@/core/integrations/notion/crypto";
import { getNotionDataSource, searchNotion } from "@/core/integrations/notion/client";

export async function GET(request: NextRequest) {
  const session = await verifySession();
  if (!isNotionBetaUser(session.userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data, error } = await createAdminSupabaseClient().from("notion_connections").select("access_token_ciphertext").eq("user_id", session.userId).maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Notion is not connected" }, { status: 409 });
  try {
    const token = decryptNotionToken(data.access_token_ciphertext);
    const sourceId = request.nextUrl.searchParams.get("id");
    if (sourceId) return NextResponse.json({ dataSource: await getNotionDataSource(token, sourceId) });
    const result = await searchNotion(token, request.nextUrl.searchParams.get("q") ?? "");
    return NextResponse.json({ results: result.results.filter((item) => item.object === "data_source" || item.object === "database") });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Notion request failed" }, { status: 502 });
  }
}
