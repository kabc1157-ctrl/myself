"use client";

import { useActionState, useRef, useState } from "react";
import { useCollapseDetailsOnSuccess } from "@/core/ui/use-collapse-details-on-success";

import {
  createWorkplaceAction,
  updateWorkplaceAction,
  type PayrollFormState,
} from "@/modules/payroll/application/actions";

const initialState: PayrollFormState = {};

type WorkplaceFormValue = {
  id: string;
  name: string;
  defaultPayType: string;
  defaultRate: number;
  payPeriodStartDay: number;
  payDay: number;
  defaultStartTime: string | null;
  defaultEndTime: string | null;
  defaultBreakMinutes: number;
  endDate: string | null;
};

export function WorkplaceForm({ initialValue }: { initialValue?: WorkplaceFormValue }) {
  const [payType, setPayType] = useState(initialValue?.defaultPayType ?? "hourly");
  const [state, formAction, isPending] = useActionState(
    initialValue ? updateWorkplaceAction : createWorkplaceAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  useCollapseDetailsOnSuccess(formRef, state);

  return (
    <form action={formAction} className="payroll-form" ref={formRef}>
      {initialValue ? <input name="workplaceId" type="hidden" value={initialValue.id} /> : null}
      <label>
        <span>근무지 이름</span>
        <input defaultValue={initialValue?.name} maxLength={80} name="name" placeholder="예: 동네 카페" required />
      </label>
      <div className="form-row">
        <label>
          <span>기본 급여 방식</span>
          <select name="defaultPayType" onChange={(event) => setPayType(event.target.value)} value={payType}>
            <option value="hourly">시급</option>
            <option value="daily">일급</option>
            <option value="per_task">건별</option>
            <option value="bonus">상여</option>
          </select>
        </label>
        <label>
          <span>기본 금액</span>
          <input defaultValue={initialValue?.defaultRate} min="0" name="defaultRate" placeholder="10000" required step="1" type="number" />
        </label>
      </div>
      <label>
        <span>근무 종료일 <small>선택</small></span>
        <input defaultValue={initialValue?.endDate ?? ""} name="endDate" type="date" />
        <small className="form-helper">종료일이 포함된 달까지 표시하고 다음 달부터 근무지 목록에서 숨깁니다.</small>
      </label>
      <div className="form-row">
        <label><span>급여 계산 시작일</span><input defaultValue={initialValue?.payPeriodStartDay ?? 1} max="28" min="1" name="payPeriodStartDay" required type="number" /></label>
        <label><span>급여일</span><input defaultValue={initialValue?.payDay ?? 10} max="31" min="1" name="payDay" required type="number" /></label>
      </div>
      {payType === "hourly" ? <div className="form-row three-columns">
        <label><span>기본 시작</span><input defaultValue={initialValue?.defaultStartTime?.slice(0, 5) ?? "09:00"} name="defaultStartTime" required type="time" /></label>
        <label><span>기본 종료</span><input defaultValue={initialValue?.defaultEndTime?.slice(0, 5) ?? "18:00"} name="defaultEndTime" required type="time" /></label>
        <label><span>기본 휴게(분)</span><input defaultValue={initialValue?.defaultBreakMinutes ?? 60} max="1439" min="0" name="defaultBreakMinutes" required type="number" /></label>
      </div> : <input name="defaultBreakMinutes" type="hidden" value="0" />}
      {state.error ? <p className="form-message error">{state.error}</p> : null}
      {state.message ? <p className="form-message success">{state.message}</p> : null}
      <button className="primary-button" disabled={isPending} type="submit">
        {isPending ? "저장 중…" : initialValue ? "근무지 수정" : "근무지 추가"}
      </button>
    </form>
  );
}
