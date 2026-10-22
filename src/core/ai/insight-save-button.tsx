import { removeSavedAiInsightAction, saveAiInsightAction } from "@/core/ai/actions";

export function InsightSaveButton({ insightId, saved, removeLabel = "기억에서 빼기" }: { insightId: string; saved: boolean; removeLabel?: string }) {
  return (
    <form action={saved ? removeSavedAiInsightAction : saveAiInsightAction}>
      <input name="insightId" type="hidden" value={insightId} />
      <button className={saved ? "insight-save-button saved" : "insight-save-button"} type="submit">
        {saved ? removeLabel : "기억하기"}
      </button>
    </form>
  );
}
