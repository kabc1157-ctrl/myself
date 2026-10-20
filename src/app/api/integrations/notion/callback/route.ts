import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { verifySession } from "@/core/auth/session";
import { getServerEnv } from "@/core/config/server-env";
import { createAdminSupabaseClient } from "@/core/db/supabase/server";
import { encryptNotionToken } from "@/core/integrations/notion/crypto";

type NotionTokenResponse = {
  access_token: string;
  refresh_token?: string | null;
  bot_id: string;
  workspace_id: string;
  workspace_name?: string | null;
};

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
  const session = await verifySession();
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("notion_oauth_state")?.value;
  cookieStore.delete("notion_oauth_state");

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");
  if (oauthError || !code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/my-page?notion=denied", baseUrl));
  }

  const env = getServerEnv();
  if (!env.NOTION_CLIENT_ID || !env.NOTION_CLIENT_SECRET || !env.NOTION_REDIRECT_URI) {
    return NextResponse.redirect(new URL("/my-page?notion=setup-required", baseUrl));
  }

  const response = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${env.NOTION_CLIENT_ID}:${env.NOTION_CLIENT_SECRET}`).toString("base64")}`,
      "Content-Type": "application/json",
      "Notion-Version": "2026-03-11",
    },
    body: JSON.stringify({ grant_type: "authorization_code", code, redirect_uri: env.NOTION_REDIRECT_URI }),
    cache: "no-store",
  });
  if (!response.ok) return NextResponse.redirect(new URL("/my-page?notion=token-error", baseUrl));

  const token = await response.json() as NotionTokenResponse;
  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("notion_connections").upsert({
    user_id: session.userId,
    access_token_ciphertext: encryptNotionToken(token.access_token),
    refresh_token_ciphertext: token.refresh_token ? encryptNotionToken(token.refresh_token) : null,
    workspace_id: token.workspace_id,
    workspace_name: token.workspace_name ?? null,
    bot_id: token.bot_id,
    connected_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  return NextResponse.redirect(new URL(error ? "/my-page?notion=save-error" : "/my-page?notion=connected", baseUrl));
}
