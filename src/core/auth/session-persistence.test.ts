import { describe, expect, it } from "vitest";

import { getAuthCookieOptions } from "@/core/auth/session-persistence";

describe("getAuthCookieOptions", () => {
  const persistentOptions = {
    path: "/",
    sameSite: "lax" as const,
    maxAge: 3600,
    expires: new Date("2026-10-20T00:00:00.000Z"),
  };

  it("keeps the Supabase lifetime when login persistence is enabled", () => {
    expect(getAuthCookieOptions(persistentOptions, false)).toEqual(persistentOptions);
  });

  it("removes the lifetime for a browser-session-only login", () => {
    expect(getAuthCookieOptions(persistentOptions, true)).toEqual({
      path: "/",
      sameSite: "lax",
    });
  });
});
