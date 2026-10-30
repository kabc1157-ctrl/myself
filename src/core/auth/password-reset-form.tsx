"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { createBrowserSupabaseClient } from "@/core/db/supabase/client";

export function PasswordResetForm() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [isReady, setIsReady] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function prepareRecoverySession() {
      const result = await supabase.auth.getSession();

      if (!active) return;
      if (result.error || !result.data.session) {
        setLinkError("재설정 링크가 만료되었거나 올바르지 않습니다. 새 링크를 요청해 주세요.");
      }
      setIsReady(true);
    }

    void prepareRecoverySession();
    return () => { active = false; };
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("passwordConfirmation") ?? "");
    if (password.length < 8) return setError("비밀번호는 8자 이상이어야 합니다.");
    if (password !== confirmation) return setError("새 비밀번호가 서로 일치하지 않습니다.");

    setIsPending(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError("비밀번호를 변경하지 못했습니다. 새 재설정 링크를 요청해 주세요.");
      setIsPending(false);
      return;
    }

    await supabase.auth.signOut();
    setMessage("비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.");
    setIsPending(false);
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>
        <span>새 비밀번호</span>
        <input autoComplete="new-password" disabled={!isReady || Boolean(linkError)} minLength={8} name="password" required type="password" />
      </label>
      <label>
        <span>새 비밀번호 확인</span>
        <input autoComplete="new-password" disabled={!isReady || Boolean(linkError)} minLength={8} name="passwordConfirmation" required type="password" />
      </label>
      {!isReady ? <p className="form-message">재설정 링크를 확인하고 있어요…</p> : null}
      {linkError ? <p className="form-message error" role="alert">{linkError}</p> : null}
      {error ? <p className="form-message error" role="alert">{error}</p> : null}
      {message ? <p className="form-message success" role="status">{message}</p> : null}
      <button className="primary-button" disabled={!isReady || Boolean(linkError) || isPending || Boolean(message)} type="submit">
        {isPending ? "변경 중…" : "비밀번호 변경"}
      </button>
      <p className="auth-switch"><Link href={message ? "/login" : "/forgot-password"}>{message ? "로그인하기" : "재설정 링크 다시 받기"}</Link></p>
    </form>
  );
}
