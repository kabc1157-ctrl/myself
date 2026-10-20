import { randomBytes } from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { verifySession } from "@/core/auth/session";
import { getServerEnv } from "@/core/config/server-env";

export async function GET() {
  await verifySession();
  const env = getServerEnv();
  if (!env.NOTION_CLIENT_ID || !env.NOTION_CLIENT_SECRET || !env.NOTION_REDIRECT_URI || !env.NOTION_TOKEN_ENCRYPTION_KEY) {
    return NextResponse.redirect(new URL("/my-page?notion=setup-required", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"));
  }

  const state = randomBytes(24).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set("notion_oauth_state", state, {
    httpOnly: true,
    maxAge: 600,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  const authorizationUrl = new URL("https://api.notion.com/v1/oauth/authorize");
  authorizationUrl.searchParams.set("owner", "user");
  authorizationUrl.searchParams.set("client_id", env.NOTION_CLIENT_ID);
  authorizationUrl.searchParams.set("redirect_uri", env.NOTION_REDIRECT_URI);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("state", state);
  return NextResponse.redirect(authorizationUrl);
}
