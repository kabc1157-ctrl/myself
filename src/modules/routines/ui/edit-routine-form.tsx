"use client";

import { useActionState, useRef } from "react";

import { updateRoutineAction, type RoutineFormState } from "@/modules/routines/application/actions";
import { useCollapseDetailsOnSuccess } from "@/core/ui/use-collapse-details-on-success";

const weekdays = [[1, "월"], [2, "화"], [3, "수"], [4, "목"], [5, "금"], [6, "토"], [7, "일"]] as const;

type EditRoutineFormProps = {
  routine: {
    id: string;
    name: string;
    startDate: string;
    endDate: string | null;
    weekdays: number[];
    preferredTime: string | null;
    timePeriod: string | null;
  };
};

export function EditRoutineForm({ routine }: EditRoutineFormProps) {
  const [state, formAction, isPending] = useActionState(updateRoutineAction, {} as RoutineFormState);
  const formRef = useRef<HTMLFormElement>(null);
  useCollapseDetailsOnSuccess(formRef, state);
  const initialSchedule = routine.preferredTime
    ? `time:${routine.preferredTime.slice(0, 5)}`
    : routine.timePeriod ? `period:${routine.timePeriod}` : "";

  return (
    <form action={formAction} className="routine-form" ref={formRef}>
      <input name="routineId" type="hidden" value={routine.id} />
      <div className="form-row routine-primary-row">
        <label><span>루틴 이름</span><input defaultValue={routine.name} maxLength={80} name="name" required /></label>
        <label>
          <span>시간 <small>선택</small></span>
          <select defaultValue={initialSchedule} name="scheduleTime" onChange={(event) => {
            const form = event.currentTarget.form;
            if (!form) return;
            const value = event.currentTarget.value;
            (form.elements.namedItem("preferredTime") as HTMLInputElement).value = value.startsWith("time:") ? value.slice(5) : "";
            (form.elements.namedItem("timePeriod") as HTMLInputElement).value = value.startsWith("period:") ? value.slice(7) : "";
          }}>
            <option value="">시간 지정 안 함</option>
            <option value="period:morning">오전</option><option value="period:afternoon">오후</option><option value="period:evening">저녁</option>
            {Array.from({ length: 24 }, (_, hour) => {
              const time = `${String(hour).padStart(2, "0")}:00`;
              return <option key={hour} value={`time:${time}`}>{time}</option>;
            })}
          </select>
          <input defaultValue={routine.preferredTime?.slice(0, 5) ?? ""} name="preferredTime" type="hidden" />
          <input defaultValue={routine.timePeriod ?? ""} name="timePeriod" type="hidden" />
        </label>
      </div>
      <div className="form-row">
        <label><span>시작일</span><input defaultValue={routine.startDate} name="startDate" required type="date" /></label>
        <label><span>종료일 <small>선택</small></span><input defaultValue={routine.endDate ?? ""} min={routine.startDate} name="endDate" type="date" /></label>
      </div>
      <fieldset>
        <legend>실행 요일</legend>
        <div className="weekday-picker">
          {weekdays.map(([value, label]) => <label key={value}><input defaultChecked={routine.weekdays.includes(value)} name="weekdays" type="checkbox" value={value} /><span>{label}</span></label>)}
        </div>
      </fieldset>
      {state.error ? <p className="form-message error">{state.error}</p> : null}
      {state.message ? <p className="form-message success">{state.message}</p> : null}
      <button className="primary-button" disabled={isPending} type="submit">{isPending ? "저장 중…" : "수정 저장"}</button>
    </form>
  );
}
