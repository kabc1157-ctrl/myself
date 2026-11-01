"use client";

import { useActionState, useRef } from "react";
import { useCollapseDetailsOnSuccess } from "@/core/ui/use-collapse-details-on-success";

import {
  updateProfileSettingsAction,
  type SettingsFormState,
} from "@/modules/settings/application/actions";

const initialState: SettingsFormState = {};

export function ProfileSettingsForm({
  displayName,
  weekStartsOn,
  aiTone,
}: {
  displayName: string | null;
  weekStartsOn: number;
  aiTone: string;
}) {
  const [state, formAction, isPending] = useActionState(updateProfileSettingsAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useCollapseDetailsOnSuccess(formRef, state);

  return (
    <form action={formAction} className="settings-form" ref={formRef}>
      <label>
        <span>표시 이름 <small>선택</small></span>
        <input defaultValue={displayName ?? ""} maxLength={80} name="displayName" placeholder="나를 부를 이름" />
      </label>
      <fieldset>
        <legend>한 주의 시작</legend>
        <div className="segmented-control">
          <label>
            <input defaultChecked={weekStartsOn !== 7} name="weekStartsOn" type="radio" value="1" />
            <span>월요일</span>
          </label>
          <label>
            <input defaultChecked={weekStartsOn === 7} name="weekStartsOn" type="radio" value="7" />
            <span>일요일</span>
          </label>
        </div>
      </fieldset>
      <fieldset>
        <legend>AI 성향</legend>
        <div className="segmented-control">
          <label><input defaultChecked={aiTone !== "problem_solving"} name="aiTone" type="radio" value="empathetic" /><span>공감형 AI</span></label>
            <label><input defaultChecked={aiTone === "problem_solving" || aiTone === "direct"} name="aiTone" type="radio" value="problem_solving" /><span>문제해결형 AI</span></label>
        </div>
      </fieldset>
      {state.error ? <p className="form-message error">{state.error}</p> : null}
      {state.message ? <p className="form-message success">{state.message}</p> : null}
      <button className="primary-button" disabled={isPending} type="submit">
        {isPending ? "저장 중…" : "설정 저장"}
      </button>
    </form>
  );
}
