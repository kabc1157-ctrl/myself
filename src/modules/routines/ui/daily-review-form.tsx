"use client";

import { useActionState } from "react";

import {
  saveDailyReviewAction,
  type RoutineFormState,
} from "@/modules/routines/application/actions";

const initialState: RoutineFormState = {};

export function DailyReviewForm({ initialReflection }: { initialReflection: string }) {
  const [state, formAction, isPending] = useActionState(saveDailyReviewAction, initialState);

  return (
    <form action={formAction} className="review-form">
      <label htmlFor="reflection">오늘의 루틴은 어땠나요?</label>
      <textarea
        defaultValue={initialReflection}
        id="reflection"
        maxLength={5000}
        name="reflection"
        placeholder="실행하며 느낀 점을 짧게 남겨보세요."
        required
        rows={5}
      />

      {state.error ? <p className="form-message error">{state.error}</p> : null}
      {state.message ? <p className="form-message success">{state.message}</p> : null}

      <button className="secondary-button" disabled={isPending} type="submit">
        {isPending ? "저장 중…" : "회고 저장"}
      </button>
    </form>
  );
}
