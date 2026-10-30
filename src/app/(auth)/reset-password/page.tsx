import { Suspense } from "react";
import { redirect } from "next/navigation";

import { PasswordResetForm } from "@/core/auth/password-reset-form";
import { createServerSupabaseClient } from "@/core/db/supabase/server";

type ResetPasswordPageProps = { searchParams: Promise<{ code?: string | string[] }> };

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const parameters = await searchParams;
  const code = typeof parameters.code === "string" ? parameters.code : null;
  if (code) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);
    redirect("/reset-password");
  }

  return (
    <main className="auth-page">
      <section className="auth-panel compact-auth-panel">
        <p className="eyebrow">NEW PASSWORD</p>
        <h1>새 비밀번호 설정</h1>
        <p className="panel-description">앞으로 사용할 새 비밀번호를 입력해 주세요.</p>
        <Suspense fallback={<p className="form-message">재설정 링크를 확인하고 있어요…</p>}><PasswordResetForm /></Suspense>
      </section>
    </main>
  );
}
