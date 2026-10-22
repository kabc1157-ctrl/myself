"use client";

import { useActionState, useRef } from "react";
import { useCollapseDetailsOnSuccess } from "@/core/ui/use-collapse-details-on-success";

import {
  saveDailyReviewAction,
  type RoutineFormState,
} from "@/modules/routines/application/actions";

const initialState: RoutineFormState = {};

export function DailyReviewForm({
  initialReflection,
  reviewDate,
  label,
}: {
  initialReflection: string;
  reviewDate: string;
  label: string;
}) {
  const [state, formAction, isPending] = useActionState(saveDailyReviewAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useCollapseDetailsOnSuccess(formRef, state);

  return (
    <form action={formAction} className="review-form" ref={formRef}>
      <input name="reviewDate" type="hidden" value={reviewDate} />
      <label htmlFor={`reflection-${reviewDate}`}>{label}</label>
      <textarea
        defaultValue={initialReflection}
        id={`reflection-${reviewDate}`}
        maxLength={5000}
        name="reflection"
        placeholder="실행하며 느낀 점을 짧게 남겨보세요."
        required
        rows={5}
      />

      {state.error ? <p className="form-message error">{state.error}</p> : null}
      {state.message ? <p className="form-message success">{state.message}</p> : null}

      <button className="secondary-button" disabled={isPending} type="submit">
        {isPending ? "저장 중…" : initialReflection ? "회고 수정" : "회고 저장"}
      </button>
    </form>
  );
}
