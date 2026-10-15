import { AuthForm } from "@/core/auth/auth-form";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <p className="eyebrow">WELCOME BACK</p>
        <h1>다시 하루를 이어가요.</h1>
        <p className="panel-description">내 루틴과 하루 기록은 나에게만 보입니다.</p>
        <AuthForm mode="login" />
      </section>
    </main>
  );
}
