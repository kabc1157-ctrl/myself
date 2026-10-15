"use client";

import { useActionState, useMemo, useState } from "react";

import {
  createWorkShiftAction,
  updateWorkShiftAction,
  type PayrollFormState,
} from "@/modules/payroll/application/actions";
import type { PayType } from "@/modules/payroll/domain/payroll";

const initialState: PayrollFormState = {};

type WorkplaceOption = {
  id: string;
  name: string;
  defaultPayType: string;
  defaultRate: number;
};

type ShiftValue = {
  id: string; workplaceId: string; workDate: string; startTime: string | null; endTime: string | null;
  breakMinutes: number; payType: string; payRate: number; quantity: number; additionalPay: number; memo: string | null;
};

export function WorkShiftForm({ date, workplaces, initialShift }: { date: string; workplaces: WorkplaceOption[]; initialShift?: ShiftValue }) {
  const firstWorkplace = workplaces.find((workplace) => workplace.id === initialShift?.workplaceId) ?? workplaces[0];
  const [workplaceId, setWorkplaceId] = useState(initialShift?.workplaceId ?? firstWorkplace?.id ?? "");
  const selected = useMemo(
    () => workplaces.find((workplace) => workplace.id === workplaceId) ?? firstWorkplace,
    [firstWorkplace, workplaceId, workplaces],
  );
  const [payType, setPayType] = useState<PayType>((initialShift?.payType as PayType) ?? (selected?.defaultPayType as PayType) ?? "hourly");
  const [formKey, setFormKey] = useState(0);
  const [state, formAction, isPending] = useActionState(initialShift ? updateWorkShiftAction : createWorkShiftAction, initialState);

  function changeWorkplace(nextId: string) {
    const next = workplaces.find((workplace) => workplace.id === nextId);
    setWorkplaceId(nextId);
    setPayType((next?.defaultPayType as PayType) ?? "hourly");
    setFormKey((value) => value + 1);
  }

  return (
    <form action={formAction} className="payroll-form" key={formKey}>
      {initialShift ? <input name="shiftId" type="hidden" value={initialShift.id} /> : null}
      <label>
        <span>근무지</span>
        <select
          name="workplaceId"
          onChange={(event) => changeWorkplace(event.target.value)}
          required
          value={workplaceId}
        >
          {workplaces.map((workplace) => (
            <option key={workplace.id} value={workplace.id}>{workplace.name}</option>
          ))}
        </select>
      </label>
      <div className="form-row">
        <label>
          <span>근무 날짜</span>
          <input defaultValue={initialShift?.workDate ?? date} name="workDate" required type="date" />
        </label>
        <label>
          <span>급여 방식</span>
          <select
            name="payType"
            onChange={(event) => setPayType(event.target.value as PayType)}
            value={payType}
          >
            <option value="hourly">시급</option>
            <option value="daily">일급</option>
            <option value="per_task">건별</option>
            <option value="bonus">상여</option>
          </select>
        </label>
      </div>
      {payType === "hourly" ? (
        <div className="form-row three-columns">
          <label>
            <span>시작 시간</span>
            <input defaultValue={initialShift?.startTime?.slice(0, 5)} name="startTime" required type="time" />
          </label>
          <label>
            <span>종료 시간</span>
            <input defaultValue={initialShift?.endTime?.slice(0, 5)} name="endTime" required type="time" />
          </label>
          <label>
            <span>휴게 시간(분)</span>
            <input defaultValue={initialShift?.breakMinutes ?? 0} max="1439" min="0" name="breakMinutes" required type="number" />
          </label>
        </div>
      ) : (
        <input name="breakMinutes" type="hidden" value="0" />
      )}
      <div className="form-row three-columns">
        <label>
          <span>금액</span>
          <input defaultValue={initialShift?.payRate ?? selected?.defaultRate ?? 0} min="0" name="payRate" required step="1" type="number" />
        </label>
        <label>
          <span>{payType === "hourly" ? "배수" : "수량·일수"}</span>
          <input defaultValue={initialShift?.quantity ?? 1} min="0.01" name="quantity" required step="0.01" type="number" />
        </label>
        <label>
          <span>추가 수당</span>
          <input defaultValue={initialShift?.additionalPay ?? 0} min="0" name="additionalPay" required step="1" type="number" />
        </label>
      </div>
      <label>
        <span>메모 <small>선택</small></span>
        <input defaultValue={initialShift?.memo ?? ""} maxLength={1000} name="memo" placeholder="담당 업무나 특이사항" />
      </label>
      {state.error ? <p className="form-message error">{state.error}</p> : null}
      {state.message ? <p className="form-message success">{state.message}</p> : null}
      <button className="primary-button" disabled={isPending} type="submit">
        {isPending ? "저장 중…" : initialShift ? "근무 기록 수정" : "근무 기록 추가"}
      </button>
    </form>
  );
}
