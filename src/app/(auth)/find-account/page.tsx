import Link from "next/link";

import { maskEmail } from "@/core/auth/account-recovery";
import { getServerEnv } from "@/core/config/server-env";

export default function FindAccountPage() {
  const maskedEmail = maskEmail(getServerEnv().APP_OWNER_EMAIL);

  return (
    <main className="auth-page">
      <section className="auth-panel compact-auth-panel">
        <p className="eyebrow">FIND ACCOUNT</p>
        <h1>아이디 찾기</h1>
        <p className="panel-description">이음새의 아이디는 가입할 때 사용한 이메일 주소예요.</p>
        <div className="account-id-card">
          <span>등록된 아이디</span>
          <strong>{maskedEmail ?? "가입한 이메일 주소를 확인해 주세요."}</strong>
        </div>
        <div className="account-recovery-actions">
          <Link className="primary-button" href="/login">로그인하기</Link>
          <Link className="secondary-button" href="/forgot-password">비밀번호 찾기</Link>
        </div>
      </section>
    </main>
  );
}
