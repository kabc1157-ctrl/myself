import { PasswordResetRequestForm } from "@/core/auth/password-reset-request-form";

export default function ForgotPasswordPage() {
  return (
    <main className="auth-page">
      <section className="auth-panel compact-auth-panel">
        <p className="eyebrow">PASSWORD RESET</p>
        <h1>비밀번호 찾기</h1>
        <p className="panel-description">가입한 이메일로 안전한 비밀번호 재설정 링크를 보내드려요.</p>
        <PasswordResetRequestForm />
      </section>
    </main>
  );
}
