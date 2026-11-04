import { describe, expect, it } from "vitest";
import { resolvePlannerEndTime } from "./planner-time";

describe("resolvePlannerEndTime", () => {
  it("keeps an explicitly selected end time", () => expect(resolvePlannerEndTime("09:00", "10:30")).toBe("10:30"));
  it("adds a half hour when omitted", () => expect(resolvePlannerEndTime("09:30")).toBe("10:00"));
  it("rejects an end time that is not after the start", () => expect(() => resolvePlannerEndTime("09:00", "08:30")).toThrow());
});
