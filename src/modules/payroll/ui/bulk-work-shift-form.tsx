"use client";

import { useActionState } from "react";

import { bulkAddWorkShiftsAction, type PayrollFormState } from "@/modules/payroll/application/actions";

const weekdays = [[1, "월"], [2, "화"], [3, "수"], [4, "목"], [5, "금"], [6, "토"], [7, "일"]] as const;
const initialState: PayrollFormState = {};

export function BulkWorkShiftForm({ month, workplaceId }: { month: string; workplaceId: string }) {
  const [state, formAction, isPending] = useActionState(bulkAddWorkShiftsAction, initialState);

  return (
    <form action={formAction} className="bulk-shift-form">
      <input name="month" type="hidden" value={month} />
      <input name="workplaceId" type="hidden" value={workplaceId} />
      <fieldset>
        <legend>반복할 근무 요일</legend>
        <div className="weekday-picker">
          {weekdays.map(([value, label]) => (
            <label key={value}>
              <input name="weekdays" type="checkbox" value={value} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className="form-helper">근무지에 저장된 기본 시간과 금액으로 등록하며, 이미 기록된 날짜는 유지합니다.</p>
      {state.error ? <p className="form-message error">{state.error}</p> : null}
      {state.message ? <p className="form-message success">{state.message}</p> : null}
      <button className="primary-button" disabled={isPending} type="submit">{isPending ? "등록 중…" : `${month.replace("-", "년 ")}월 일괄 등록`}</button>
    </form>
  );
}
