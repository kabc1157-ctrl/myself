import type { Json } from "@/core/db/database.types";

export type RoutineInsight = {
  title?: string;
  observation?: string;
  self_discovery?: string;
  suggestion?: string;
  evidence: string[];
  insufficient_data: boolean;
};

function text(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function parseJson(value: Json | null) {
  if (typeof value === "string") {
    try { return JSON.parse(value) as unknown; } catch { return null; }
  }
  return value;
}

export function parseRoutineInsight(value: Json | null): RoutineInsight | null {
  const parsed = parseJson(value);
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") return null;
  const candidate = parsed as Record<string, unknown>;
  const evidence = Array.isArray(candidate.evidence)
    ? candidate.evidence.map((item) => typeof item === "string" ? item.trim() : text(item)).filter(Boolean)
    : [];
  const result: RoutineInsight = {
    title: text(candidate.title) || undefined,
    observation: text(candidate.observation) || undefined,
    self_discovery: text(candidate.self_discovery) || undefined,
    suggestion: text(candidate.suggestion) || undefined,
    evidence,
    insufficient_data: candidate.insufficient_data === true,
  };
  return result.title || result.observation || result.self_discovery || result.suggestion || result.evidence.length || result.insufficient_data
    ? result
    : null;
}
