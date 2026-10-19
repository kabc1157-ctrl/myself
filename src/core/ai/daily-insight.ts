import type { Json } from "@/core/db/database.types";

export type DailyInsight = {
  core_feedback: string;
  wins: string[];
  improvements: string[];
  tomorrow_action: string;
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function parseDailyInsight(value: Json | null): DailyInsight | null {
  if (!value || Array.isArray(value) || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.core_feedback !== "string"
    || !isStringArray(candidate.wins)
    || !isStringArray(candidate.improvements)
    || typeof candidate.tomorrow_action !== "string"
  ) return null;

  return {
    core_feedback: candidate.core_feedback,
    wins: candidate.wins,
    improvements: candidate.improvements,
    tomorrow_action: candidate.tomorrow_action,
  };
}
