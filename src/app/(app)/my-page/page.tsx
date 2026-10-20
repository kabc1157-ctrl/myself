import { logoutAction } from "@/core/auth/actions";
import { verifySession } from "@/core/auth/session";
import { getMonthlyAiInsights } from "@/core/ai/insight-inbox";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { InstallAppButton } from "@/core/pwa/install-app-button";
import { MonthlyInsightList } from "@/core/ui/monthly-insight-list";
import { getOrCreateProfile } from "@/core/user/profile-repository";
import { ProfileSettingsForm } from "@/modules/settings/ui/profile-settings-form";

export default async function MyPage() {
  const [session, supabase] = await Promise.all([
    verifySession(),
    createServerSupabaseClient(),
  ]);
  const [profile, monthlyInsights] = await Promise.all([
    getOrCreateProfile(supabase, session.userId),
    getMonthlyAiInsights(supabase, session.userId),
  ]);

  return (
    <div className="my-page">
      <section className="my-page-heading">
        <p className="eyebrow page-menu-label">마이페이지</p>
        <h1>{profile.display_name ? `${profile.display_name}님의 공간` : "나의 설정"}</h1>
      </section>

      <div className="settings-grid">
        <details className="settings-card expandable-panel">
          <summary>
            <div className="card-heading">
              <span>기본 설정</span>
              <h2>{profile.display_name ? `${profile.display_name}님 안녕하세요:)` : "나에게 맞게 조정하기"}</h2>
            </div>
            <span aria-hidden="true" className="expand-icon">+</span>
          </summary>
          <ProfileSettingsForm displayName={profile.display_name} weekStartsOn={profile.week_starts_on} />
        </details>

        <section className="settings-card monthly-insight-archive">
          <div className="card-heading">
            <span>AI 분석</span>
            <h2>월간 인사이트</h2>
          </div>
          {monthlyInsights.length > 0
            ? <MonthlyInsightList insights={monthlyInsights} />
            : <p>월간 분석이 완료되면 이곳에서 다시 확인할 수 있어요.</p>}
        </section>

        <section className="settings-card">
          <div className="card-heading with-status">
            <div>
              <span>Notion</span>
              <h2>기록 아카이브</h2>
            </div>
            <span className="status-badge pending">연결 전</span>
          </div>
          <p>일기와 루틴 기록을 Notion으로 복제하는 연결 화면은 다음 연동 단계에서 활성화됩니다.</p>
          <button className="secondary-button" disabled type="button">Notion 연결 준비 중</button>
        </section>

        <section className="settings-card install-guide">
          <div className="card-heading">
            <span>홈 화면 설치</span>
            <h2>앱처럼 열기</h2>
          </div>
          <div>
            <strong>iPhone · iPad</strong>
            <p>Safari 공유 버튼 → 홈 화면에 추가 → 웹 앱으로 열기</p>
          </div>
          <div>
            <strong>Android</strong>
            <p>Chrome 메뉴 → 앱 설치 또는 홈 화면에 추가</p>
          </div>
          <InstallAppButton />
        </section>
      </div>

      <form action={logoutAction} className="logout-panel">
        <button className="text-button danger" type="submit">로그아웃</button>
      </form>
    </div>
  );
}
