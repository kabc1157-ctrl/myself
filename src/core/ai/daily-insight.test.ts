import { describe, expect, it } from "vitest";

import { parseDailyInsight, parseMonthlyInsight } from "@/core/ai/daily-insight";

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

describe("parseMonthlyInsight", () => {
  it("parses the monthly insight format", () => {
    expect(parseMonthlyInsight({
      monthly_summary: "한 달 요약",
      notable_changes: "변화",
      wins: "잘한 점",
      improvement_point: "개선점",
      next_month_goal_tip: "목표 팁",
      encouragement: "응원",
    })).not.toBeNull();
  });
});
