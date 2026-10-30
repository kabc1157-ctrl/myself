import { describe, expect, it } from "vitest";

import { maskEmail } from "@/core/auth/account-recovery";

describe("maskEmail", () => {
  it("keeps the domain while masking the local part", () => {
    expect(maskEmail("lucia@example.com")).toBe("lu***@example.com");
  });

  it("returns null for missing or invalid email", () => {
    expect(maskEmail()).toBeNull();
    expect(maskEmail("invalid")).toBeNull();
  });
});
