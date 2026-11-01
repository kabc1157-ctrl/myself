import { AiMemoButton } from "@/core/ai/ai-memo-button";

export function InsightSaveButton({ insightId, saved, removeLabel = "기억에서 빼기" }: { insightId: string; saved: boolean; removeLabel?: string }) {
  void saved;
  void removeLabel;
  return <AiMemoButton source="ai_insight" sourceId={insightId} sourceUrl="/home" />;
}
