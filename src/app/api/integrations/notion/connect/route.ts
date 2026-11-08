import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/core/auth/session";
import { getServerEnv } from "@/core/config/server-env";
import { isNotionBetaUser } from "@/core/integrations/notion/access";

export async function GET(request: NextRequest) {
  const session = await verifySession();
  const env = getServerEnv();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
  if (!isNotionBetaUser(session.userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!env.NOTION_CLIENT_ID || !env.NOTION_REDIRECT_URI) return NextResponse.redirect(new URL("/my-page?notion=setup-required", baseUrl));
  const state = randomBytes(24).toString("base64url");
  (await cookies()).set("notion_oauth_state", state, { httpOnly: true, maxAge: 600, path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  const url = new URL("https://api.notion.com/v1/oauth/authorize");
  url.searchParams.set("client_id", env.NOTION_CLIENT_ID);
  url.searchParams.set("redirect_uri", env.NOTION_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("owner", "user");
  url.searchParams.set("state", state);
  return NextResponse.redirect(url);
}
