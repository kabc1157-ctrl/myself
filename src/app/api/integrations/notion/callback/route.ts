import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/core/auth/session";
import { getServerEnv } from "@/core/config/server-env";
import { createAdminSupabaseClient } from "@/core/db/supabase/server";
import { isNotionBetaUser } from "@/core/integrations/notion/access";
import { encryptNotionToken } from "@/core/integrations/notion/crypto";

type TokenResponse = { access_token?: string; bot_id?: string; workspace_id?: string; workspace_name?: string };

export async function GET(request: NextRequest) {
  const session = await verifySession();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
  if (!isNotionBetaUser(session.userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const env = getServerEnv();
  const cookieStore = await cookies();
  const expected = cookieStore.get("notion_oauth_state")?.value;
  cookieStore.delete("notion_oauth_state");
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (!code || !state || !expected || state !== expected) return NextResponse.redirect(new URL("/my-page?notion=denied", baseUrl));
  if (!env.NOTION_CLIENT_ID || !env.NOTION_CLIENT_SECRET || !env.NOTION_REDIRECT_URI) return NextResponse.redirect(new URL("/my-page?notion=setup-required", baseUrl));
  const auth = Buffer.from(`${env.NOTION_CLIENT_ID}:${env.NOTION_CLIENT_SECRET}`).toString("base64");
  const response = await fetch("https://api.notion.com/v1/oauth/token", { method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" }, body: JSON.stringify({ grant_type: "authorization_code", code, redirect_uri: env.NOTION_REDIRECT_URI }), cache: "no-store" });
  if (!response.ok) return NextResponse.redirect(new URL("/my-page?notion=token-error", baseUrl));
  const token = await response.json() as TokenResponse;
  if (!token.access_token || !token.bot_id || !token.workspace_id) return NextResponse.redirect(new URL("/my-page?notion=token-error", baseUrl));
  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("notion_connections").upsert({ user_id: session.userId, access_token_ciphertext: encryptNotionToken(token.access_token), refresh_token_ciphertext: null, workspace_id: token.workspace_id, workspace_name: token.workspace_name ?? null, bot_id: token.bot_id, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  return NextResponse.redirect(new URL(error ? "/my-page?notion=save-error" : "/my-page?notion=connected", baseUrl));
}
