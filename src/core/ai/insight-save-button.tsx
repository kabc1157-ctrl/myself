import { removeSavedAiInsightAction, saveAiInsightAction } from "@/core/ai/actions";

export function InsightSaveButton({ insightId, saved }: { insightId: string; saved: boolean }) {
  return (
    <form action={saved ? removeSavedAiInsightAction : saveAiInsightAction}>
      <input name="insightId" type="hidden" value={insightId} />
      <button className={saved ? "insight-save-button saved" : "insight-save-button"} type="submit">
        {saved ? "기억에서 빼기" : "기억하기"}
      </button>
    </form>
  );
}
