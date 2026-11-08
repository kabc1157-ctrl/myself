"use client";

import { useActionState } from "react";
import { deleteAccountAction, type AuthFormState } from "@/core/auth/actions";

const initialState: AuthFormState = {};

export function AccountDeletionPanel() {
  const [state, formAction, pending] = useActionState(deleteAccountAction, initialState);

  return (
    <section className="account-deletion-panel" aria-labelledby="account-deletion-title">
      <div>
        <p className="eyebrow">ACCOUNT</p>
        <h2 id="account-deletion-title">계정 탈퇴</h2>
        <p>탈퇴하면 이음새에 저장된 기록과 연결 정보가 계정과 함께 삭제됩니다. Google 원본 데이터는 삭제하지 않습니다.</p>
      </div>
      {state.error ? <p className="form-message error" role="alert">{state.error}</p> : null}
      <form action={formAction} onSubmit={(event) => { if (!window.confirm("계정을 탈퇴하면 이음새의 모든 기록이 삭제됩니다. 정말 탈퇴할까요?")) event.preventDefault(); }}>
        <input name="confirmation" type="hidden" value="DELETE_ACCOUNT" />
        <button className="text-button danger account-delete-button" disabled={pending} type="submit">{pending ? "탈퇴 처리 중…" : "계정 탈퇴"}</button>
      </form>
    </section>
  );
}
