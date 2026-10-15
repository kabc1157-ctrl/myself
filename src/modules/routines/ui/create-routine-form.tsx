"use client";

import { useActionState } from "react";

import {
  createRoutineAction,
  type RoutineFormState,
} from "@/modules/routines/application/actions";

const weekdays = [
  [1, "월"],
  [2, "화"],
  [3, "수"],
  [4, "목"],
  [5, "금"],
  [6, "토"],
  [7, "일"],
] as const;

const initialState: RoutineFormState = {};

export function CreateRoutineForm({ date }: { date: string }) {
  const [state, formAction, isPending] = useActionState(createRoutineAction, initialState);

  return (
    <form action={formAction} className="routine-form">
      <div className="form-row routine-primary-row">
        <label>
          <span>루틴 이름</span>
          <input maxLength={80} name="name" placeholder="예: 물 한 잔 마시기" required />
        </label>
        <label>
          <span>시간 <small>선택</small></span>
          <select defaultValue="" name="scheduleTime" onChange={(event) => {
            const form = event.currentTarget.form;
            if (!form) return;
            const value = event.currentTarget.value;
            (form.elements.namedItem("preferredTime") as HTMLInputElement).value = value.startsWith("time:") ? value.slice(5) : "";
            (form.elements.namedItem("timePeriod") as HTMLInputElement).value = value.startsWith("period:") ? value.slice(7) : "";
          }}>
            <option value="">시간 지정 안 함</option>
            <option value="period:morning">오전</option>
            <option value="period:afternoon">오후</option>
            <option value="period:evening">저녁</option>
            {Array.from({ length: 24 }, (_, hour) => {
              const time = `${String(hour).padStart(2, "0")}:00`;
              return <option key={hour} value={`time:${time}`}>{time}</option>;
            })}
          </select>
          <input name="preferredTime" type="hidden" />
          <input name="timePeriod" type="hidden" />
        </label>
      </div>

      <div className="form-row">
        <label>
          <span>시작일</span>
          <input defaultValue={date} name="startDate" required type="date" />
        </label>
        <label>
          <span>종료일 <small>선택</small></span>
          <input min={date} name="endDate" type="date" />
        </label>
      </div>

      <fieldset>
        <legend>실행 요일</legend>
        <div className="weekday-picker">
          {weekdays.map(([value, label]) => (
            <label key={value}>
              <input defaultChecked name="weekdays" type="checkbox" value={value} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {state.error ? <p className="form-message error">{state.error}</p> : null}
      {state.message ? <p className="form-message success">{state.message}</p> : null}

      <button className="primary-button" disabled={isPending} type="submit">
        {isPending ? "저장 중…" : "루틴 추가"}
      </button>
    </form>
  );
}
