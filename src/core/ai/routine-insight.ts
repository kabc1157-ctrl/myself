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

function parseLegacyLabels(value: Json | null): unknown {
  if (typeof value !== "string") return null;
  const labels = ["title", "evidence", "suggestion", "observation", "self_discovery", "insufficient_data"];
  const pattern = new RegExp(`(?:^|\\s)(${labels.join("|")})\\s*:\\s*`, "g");
  const matches = [...value.matchAll(pattern)];
  if (matches.length < 2) return null;
  const result: Record<string, unknown> = {};
  matches.forEach((match, index) => {
    const key = match[1];
    const start = (match.index ?? 0) + match[0].length;
    const end = index + 1 < matches.length ? (matches[index + 1].index ?? value.length) : value.length;
    const raw = value.slice(start, end).trim();
    if (key === "insufficient_data") result[key] = raw === "true";
    else result[key] = raw;
  });
  return result;
}

function unwrap(value: unknown): unknown {
  if (!value || Array.isArray(value) || typeof value !== "object") return value;
  const candidate = value as Record<string, unknown>;
  if (candidate.type === "object" || "properties" in candidate || "required" in candidate || "additionalProperties" in candidate) return null;
  const nested = candidate.output ?? candidate.result ?? candidate.data;
  return nested && typeof nested === "object" && !Array.isArray(nested) ? unwrap(nested) : value;
}

export function parseRoutineInsight(value: Json | null): RoutineInsight | null {
  const parsed = unwrap(parseJson(value) ?? parseLegacyLabels(value));
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") return null;
  const candidate = parsed as Record<string, unknown>;
  const evidence = Array.isArray(candidate.evidence)
    ? candidate.evidence.map((item) => typeof item === "string" ? item.trim() : text(item)).filter(Boolean)
    : text(candidate.evidence) ? [text(candidate.evidence)] : [];
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
