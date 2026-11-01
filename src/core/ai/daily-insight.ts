import type { Json } from "@/core/db/database.types";

export type DailyInsight = {
  core_feedback: string;
  wins: string;
  improvements: string;
  self_understanding_tip: string;
};

export type MonthlyInsight = {
  monthly_summary: string;
  notable_changes: string;
  wins: string;
  improvement_point: string;
  next_month_goal_tip: string;
  encouragement: string;
};

function toText(value: unknown): string {
  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .join("\n");
  }

  return "";
}

export function parseDailyInsight(value: Json | null): DailyInsight | null {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (typeof candidate.core_feedback !== "string") {
    return null;
  }

  const insight: DailyInsight = {
    core_feedback: candidate.core_feedback,
    wins: toText(candidate.wins),
    improvements: toText(candidate.improvements),
    self_understanding_tip: toText(
      candidate.self_understanding_tip ?? candidate.tomorrow_action
    ),
  };

  if (!Object.values(insight).some((text) => text.trim().length > 0)) {
    return null;
  }

  return insight;
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
