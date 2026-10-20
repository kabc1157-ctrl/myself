import { describe, expect, it } from "vitest";

import { normalizeNotionId } from "@/core/integrations/notion/notion-id";

describe("normalizeNotionId", () => {
  it("accepts a UUID", () => {
    expect(normalizeNotionId("12345678-1234-1234-1234-1234567890ab")).toBe("12345678-1234-1234-1234-1234567890ab");
  });

  it("extracts an id from a Notion URL", () => {
    expect(normalizeNotionId("https://www.notion.so/example-123456781234123412341234567890ab?v=abc")).toBe("12345678-1234-1234-1234-1234567890ab");
  });

  it("rejects invalid values", () => {
    expect(normalizeNotionId("not-a-notion-id")).toBeNull();
  });
});
