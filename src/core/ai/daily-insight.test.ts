import { describe, expect, it } from "vitest";

import { parseDailyInsight } from "@/core/ai/daily-insight";

describe("parseDailyInsight", () => {
  it("accepts the n8n structured result", () => {
    expect(parseDailyInsight({
      core_feedback: "오늘의 핵심",
      wins: ["기록을 남겼어요"],
      improvements: ["조금 더 구체적으로 적어보세요"],
      tomorrow_action: "내일 첫 행동을 한 줄로 적기",
    })).toEqual({
      core_feedback: "오늘의 핵심",
      wins: ["기록을 남겼어요"],
      improvements: ["조금 더 구체적으로 적어보세요"],
      tomorrow_action: "내일 첫 행동을 한 줄로 적기",
    });
  });

  it("rejects incomplete or legacy values", () => {
    expect(parseDailyInsight(null)).toBeNull();
    expect(parseDailyInsight("분석 결과")).toBeNull();
    expect(parseDailyInsight({ core_feedback: "핵심" })).toBeNull();
  });
});
