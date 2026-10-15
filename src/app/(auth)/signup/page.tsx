import { AuthForm } from "@/core/auth/auth-form";

export default function SignupPage() {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <p className="eyebrow">START SMALL</p>
        <h1>루틴 하나로 시작해요.</h1>
        <p className="panel-description">계정별 데이터는 서로 분리되어 저장됩니다.</p>
        <AuthForm mode="signup" />
      </section>
    </main>
  );
}
