"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import { PersistentDetails } from "@/core/ui/persistent-details";
import { savePlannerReviewAction } from "@/modules/life/application/actions";

type Props = {
  date: string;
  displayDate?: string;
  reflection?: string | null;
  storageKey: string;
  edit?: boolean;
};

export function PlannerReviewForm({ date, displayDate = date, reflection, storageKey, edit = false }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fullKey = `myself:details:${storageKey}`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError(null);
    startTransition(async () => {
      try {
        const result = await savePlannerReviewAction(formData);
        if (!result?.ok) return;
        if (!edit) event.currentTarget.reset();
        const details = form.closest("details");
        if (details) details.open = false;
        window.sessionStorage.setItem(fullKey, "closed");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
      }
    });
  }

  return (
    <PersistentDetails className={edit ? "create-panel" : "settings-card expandable-panel planner-review-panel record-hero-editor"} storageKey={storageKey}>
      <summary>
        {edit ? <span>일정 회고 수정</span> : <div className="card-heading"><h1>일정 회고 쓰기</h1></div>}
        {!edit ? <span className="expand-icon">+</span> : null}
      </summary>
      <form className="feature-form" onSubmit={handleSubmit}>
        {edit ? <input name="date" type="hidden" value={date} /> : <label>날짜<input className="record-date-input" defaultValue={date} name="date" type="date" /></label>}
        <label>{edit ? "일정 회고" : "오늘의 시간 사용은 어땠나요?"}<textarea defaultValue={reflection ?? ""} name="reflection" required rows={5} /></label>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className={edit ? "secondary-button" : "primary-button"} disabled={pending} type="submit">{pending ? "저장 중…" : edit ? "수정 저장" : "회고 저장"}</button>
      </form>
    </PersistentDetails>
  );
}
