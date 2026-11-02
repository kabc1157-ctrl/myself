import type { Json } from "@/core/db/database.types";

export type DailyInsight = {
  core_feedback: string;
  wins: string | string[];
  improvements: string | string[];
  self_understanding_tip?: string | string[];
  tomorrow_action?: string | string[];
};

export type MonthlyInsight = {
  monthly_summary: string;
  notable_changes: string;
  wins: string;
  improvement_point: string;
  next_month_goal_tip: string;
  encouragement: string;
};

function isInsightValue(value: unknown): value is string | string[] {
  return typeof value === "string" ||
    (Array.isArray(value) && value.every((item) => typeof item === "string"));
}

function hasText(value: unknown): boolean {
  return isInsightValue(value) && (Array.isArray(value) ? value.some(Boolean) : value.trim().length > 0);
}

export function parseDailyInsight(value: Json | null): DailyInsight | null {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (typeof candidate.core_feedback !== "string") {
    return null;
  }

  const optionalKeys = ["wins", "improvements", "self_understanding_tip", "tomorrow_action"] as const;
  if (!optionalKeys.some((key) => hasText(candidate[key]))) {
    return null;
  }

  return {
    core_feedback: candidate.core_feedback,
    wins: isInsightValue(candidate.wins) ? candidate.wins : "",
    improvements: isInsightValue(candidate.improvements) ? candidate.improvements : "",
    ...(isInsightValue(candidate.self_understanding_tip)
      ? { self_understanding_tip: candidate.self_understanding_tip }
      : {}),
    ...(isInsightValue(candidate.tomorrow_action)
      ? { tomorrow_action: candidate.tomorrow_action }
      : {}),
  };
}

export function parseMonthlyInsight(value: Json | null): MonthlyInsight | null {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  const keys = [
    "monthly_summary",
    "notable_changes",
    "wins",
    "improvement_point",
    "next_month_goal_tip",
    "encouragement",
  ] as const;

  if (keys.some((key) => typeof candidate[key] !== "string")) {
    return null;
  }

  return Object.fromEntries(
    keys.map((key) => [key, candidate[key]])
  ) as MonthlyInsight;
}
