"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  type AuthFormState,
  loginAction,
  signupAction,
} from "@/core/auth/actions";

const initialState: AuthFormState = {};

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? loginAction : signupAction;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const isLogin = mode === "login";

  return (
    <form action={formAction} className="auth-form">
      <label>
        <span>이메일</span>
        <input autoComplete="email" name="email" required type="email" />
      </label>
      <label>
        <span>비밀번호</span>
        <input
          autoComplete={isLogin ? "current-password" : "new-password"}
          minLength={8}
          name="password"
          required
          type="password"
        />
      </label>

      {isLogin ? (
        <label className="remember-login">
          <input defaultChecked name="rememberLogin" type="checkbox" />
          <span>로그인 상태 유지</span>
        </label>
      ) : null}

      {state.error ? <p className="form-message error">{state.error}</p> : null}
      {state.message ? <p className="form-message success">{state.message}</p> : null}

      <button className="primary-button" disabled={isPending} type="submit">
        {isPending ? "처리 중…" : isLogin ? "로그인" : "계정 만들기"}
      </button>

      <p className="auth-switch">
        {isLogin ? "처음이신가요?" : "이미 계정이 있나요?"}{" "}
        <Link href={isLogin ? "/signup" : "/login"}>
          {isLogin ? "회원가입" : "로그인"}
        </Link>
      </p>
    </form>
  );
}
