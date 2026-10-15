"use client";

import { useActionState } from "react";

import {
  saveJournalEntryAction,
  type JournalFormState,
} from "@/modules/journal/application/actions";

const initialState: JournalFormState = {};

type JournalEntryFormProps = {
  date: string;
  initialEntry?: {
    title: string | null;
    body: string;
    mood: number | null;
  } | null;
};

const moods = [
  [1, "힘듦"],
  [2, "아쉬움"],
  [3, "보통"],
  [4, "좋음"],
  [5, "아주 좋음"],
] as const;

export function JournalEntryForm({ date, initialEntry }: JournalEntryFormProps) {
  const [state, formAction, isPending] = useActionState(saveJournalEntryAction, initialState);

  return (
    <form action={formAction} className="journal-form">
      <label>
        <span>기록 날짜</span>
        <input defaultValue={date} name="entryDate" required type="date" />
      </label>

      <label>
        <span>제목 <small>선택</small></span>
        <input
          defaultValue={initialEntry?.title ?? ""}
          maxLength={120}
          name="title"
          placeholder="오늘을 한마디로 표현한다면"
        />
      </label>

      <fieldset>
        <legend>오늘의 기분 <small>선택</small></legend>
        <div className="mood-picker">
          {moods.map(([value, label]) => (
            <label key={value}>
              <input
                defaultChecked={initialEntry?.mood === value}
                name="mood"
                type="radio"
                value={value}
              />
              <span>{value}<small>{label}</small></span>
            </label>
          ))}
        </div>
      </fieldset>

      <label>
        <span>오늘의 기록</span>
        <textarea
          defaultValue={initialEntry?.body ?? ""}
          maxLength={20000}
          name="body"
          placeholder="오늘 있었던 일과 마음을 편하게 적어보세요."
          required
          rows={9}
        />
      </label>

      {state.error ? <p className="form-message error">{state.error}</p> : null}
      {state.message ? <p className="form-message success">{state.message}</p> : null}

      <button className="primary-button" disabled={isPending} type="submit">
        {isPending ? "저장 중…" : "일기 쓰기"}
      </button>
    </form>
  );
}
