import { timingSafeEqual } from "node:crypto";

import { NextRequest } from "next/server";
import { z } from "zod";

import { getServerEnv } from "@/core/config/server-env";
import { createAdminSupabaseClient } from "@/core/db/supabase/server";
import { decryptNotionToken } from "@/core/integrations/notion/crypto";

const archiveSchema = z.object({
  user_id: z.uuid(),
  category: z.enum(["journal", "routine"]),
  source_key: z.string().min(1).max(200),
  title: z.string().min(1).max(200),
  date: z.iso.date(),
  content: z.union([z.string(), z.record(z.string(), z.unknown())]),
});

function isAuthorized(request: NextRequest, expected?: string) {
  const actual = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expected || actual.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

export async function POST(request: NextRequest) {
  const env = getServerEnv();
  if (!isAuthorized(request, env.N8N_INTEGRATION_SECRET)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const parsed = archiveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_payload", issues: parsed.error.issues }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const input = parsed.data;
  const { data: existing } = await admin.from("notion_archives").select("notion_page_id").eq("user_id", input.user_id).eq("source_key", input.source_key).maybeSingle();
  if (existing) return Response.json({ archived: true, duplicate: true, notion_page_id: existing.notion_page_id });

  const { data: connection, error: connectionError } = await admin.from("notion_connections").select("access_token_ciphertext, journal_data_source_id, routine_data_source_id").eq("user_id", input.user_id).maybeSingle();
  if (connectionError || !connection) return Response.json({ error: "notion_not_connected" }, { status: 404 });
  const dataSourceId = input.category === "journal" ? connection.journal_data_source_id : connection.routine_data_source_id;
  if (!dataSourceId) return Response.json({ error: "notion_destination_missing" }, { status: 409 });

  const token = decryptNotionToken(connection.access_token_ciphertext);
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Notion-Version": "2026-03-11" };
  const schemaResponse = await fetch(`https://api.notion.com/v1/data_sources/${dataSourceId}`, { headers, cache: "no-store" });
  if (!schemaResponse.ok) return Response.json({ error: "notion_destination_unavailable" }, { status: 502 });
  const dataSource = await schemaResponse.json() as { properties?: Record<string, { type?: string }> };
  const titleProperty = Object.entries(dataSource.properties ?? {}).find(([, value]) => value.type === "title")?.[0];
  if (!titleProperty) return Response.json({ error: "notion_title_property_missing" }, { status: 422 });

  const contentText = typeof input.content === "string" ? input.content : JSON.stringify(input.content, null, 2);
  const chunks = contentText.match(/[\s\S]{1,1900}/g) ?? [];
  const notionResponse = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers,
    body: JSON.stringify({
      parent: { data_source_id: dataSourceId },
      properties: { [titleProperty]: { title: [{ text: { content: `${input.date} · ${input.title}` } }] } },
      children: chunks.map((content) => ({ object: "block", type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content } }] } })),
    }),
  });
  if (!notionResponse.ok) return Response.json({ error: "notion_create_failed", detail: await notionResponse.text() }, { status: 502 });
  const notionPage = await notionResponse.json() as { id: string; url?: string };
  await admin.from("notion_archives").insert({ user_id: input.user_id, category: input.category, source_key: input.source_key, notion_page_id: notionPage.id });
  return Response.json({ archived: true, notion_page_id: notionPage.id, url: notionPage.url ?? null });
}
