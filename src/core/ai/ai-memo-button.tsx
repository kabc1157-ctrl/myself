"use client";

import { copyAiInsightToNoteAction } from "@/core/ai/self-understanding-actions";

export function AiMemoButton({ source, sourceId, sourceUrl, className, label = "메모 추가" }: { source: "ai_insight" | "daily_self" | "period_report" | "journal_entry" | "routine_review" | "note" | "reading" | "exercise" | "planner_review" | "investment_trade"; sourceId: string; sourceUrl: string; className?: string; label?: string }) {
  return <form action={copyAiInsightToNoteAction} className="ai-memo-button"><input name="source" type="hidden" value={source}/><input name="sourceId" type="hidden" value={sourceId}/><input name="sourceUrl" type="hidden" value={sourceUrl}/><button className={className ? `secondary-button ${className}` : "secondary-button"} type="submit">{label}</button></form>;
}
