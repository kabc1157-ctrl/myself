"use client";

import Link from "next/link";
import { useActionState } from "react";

import { requestPasswordResetAction, type AuthFormState } from "@/core/auth/actions";

const initialState: AuthFormState = {};

export function PasswordResetRequestForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordResetAction, initialState);

  return (
    <form action={formAction} className="auth-form">
      <label>
        <span>가입 이메일</span>
        <input autoComplete="email" name="email" required type="email" />
      </label>
      {state.error ? <p className="form-message error" role="alert">{state.error}</p> : null}
      {state.message ? <p className="form-message success" role="status">{state.message}</p> : null}
      <button className="primary-button" disabled={isPending} type="submit">{isPending ? "보내는 중…" : "재설정 링크 받기"}</button>
      <p className="auth-switch"><Link href="/login">로그인으로 돌아가기</Link></p>
    </form>
  );
}
