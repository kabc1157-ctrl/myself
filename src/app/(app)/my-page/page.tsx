import { logoutAction } from "@/core/auth/actions";
import { verifySession } from "@/core/auth/session";
import Link from "next/link";
import { getMonthlyAiInsights, getSavedAiInsights, getSavedInsightIds } from "@/core/ai/insight-inbox";
import { AiInsight } from "@/core/ui/ai-insight";
import { InsightSaveButton } from "@/core/ai/insight-save-button";
import { formatShortKoreanDate } from "@/core/date/local-date";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { InstallAppButton } from "@/core/pwa/install-app-button";
import { MonthlyInsightList } from "@/core/ui/monthly-insight-list";
import { getOrCreateProfile } from "@/core/user/profile-repository";
import { ProfileSettingsForm } from "@/modules/settings/ui/profile-settings-form";
import { getGoogleCalendarConnection } from "@/core/integrations/google-calendar/repository";
import { GoogleCalendarConnectionPanel } from "@/modules/settings/ui/google-calendar-connection-panel";
import { saveFeatureSettingsAction } from "@/modules/life/application/actions";
import { getFeatureSettings } from "@/modules/life/infrastructure/repository";

type MyPageProps = { searchParams: Promise<{ calendar?: string | string[]; savedCategory?: string | string[] }> };

export default async function MyPage({ searchParams }: MyPageProps) {
  const [session, supabase] = await Promise.all([
    verifySession(),
    createServerSupabaseClient(),
  ]);
  const [profile, monthlyInsights, savedInsightIds, savedInsights, featureSettings, calendarConnection, parameters] = await Promise.all([
    getOrCreateProfile(supabase, session.userId),
    getMonthlyAiInsights(supabase, session.userId),
    getSavedInsightIds(supabase, session.userId),
    getSavedAiInsights(supabase, session.userId),
    getFeatureSettings(supabase, session.userId),
    getGoogleCalendarConnection(supabase, session.userId),
    searchParams,
  ]);
  const selectedCategory = typeof parameters.savedCategory === "string" ? parameters.savedCategory : "all";
  const visibleSavedInsights = savedInsights.filter((saved) => {
    const insight = saved.insight;
    return insight && !Array.isArray(insight) && (selectedCategory === "all" || insight.category === selectedCategory);
  });

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
            ? <MonthlyInsightList insights={monthlyInsights} savedInsightIds={savedInsightIds} />
            : <p>월간 분석이 완료되면 이곳에서 다시 확인할 수 있어요.</p>}
        </section>

        <section className="settings-card monthly-insight-archive">
          <div className="card-heading"><span>나의 발견</span><h2>기억하는 인사이트</h2></div>
          <div className="topic-filter-list">
            {[{ value: "all", label: "전체" }, { value: "journal", label: "일기" }, { value: "routine", label: "루틴" }, { value: "exercise", label: "운동" }, { value: "planner", label: "일정" }].map((item) => <Link href={`/my-page?savedCategory=${item.value}`} key={item.value} scroll={false}>{item.label}</Link>)}
          </div>
          {visibleSavedInsights.length === 0 ? <p>이 주제로 기억한 인사이트가 없어요.</p> : <div className="discovery-list">{visibleSavedInsights.map((saved) => {
            const insight = saved.insight;
            if (!insight || Array.isArray(insight)) return null;
            return <article className="discovery-card" key={saved.id}><div className="home-insight-meta"><span>{insight.category}</span><time>{formatShortKoreanDate(insight.source_date)}</time></div><h3>{insight.title}</h3><AiInsight value={insight.content}/><InsightSaveButton insightId={insight.id} removeLabel="기억하기 완료" saved /></article>;
          })}</div>}
        </section>

        <section className="settings-card">
          <div className="card-heading"><span>홈과 메뉴</span><h2>기능 설정</h2></div>
          <form action={saveFeatureSettingsAction} className="feature-form">
            <label className="checkbox-line"><input defaultChecked={featureSettings.notes_enabled} name="notes" type="checkbox"/> 메모</label>
            <label className="checkbox-line"><input defaultChecked={featureSettings.exercise_enabled} name="exercise" type="checkbox"/> 운동 기록장</label>
            <label className="checkbox-line"><input defaultChecked={featureSettings.reading_enabled} name="reading" type="checkbox"/> 독서 기록</label>
            <label className="checkbox-line"><input defaultChecked={featureSettings.planner_enabled} name="planner" type="checkbox"/> 일정 관리</label>
            <label className="checkbox-line"><input defaultChecked={featureSettings.payroll_enabled} name="payroll" type="checkbox"/> 월급 관리</label>
            <button className="secondary-button">기능 설정 저장</button>
          </form>
        </section>

        <GoogleCalendarConnectionPanel connection={calendarConnection} notice={typeof parameters.calendar === "string" ? parameters.calendar : undefined} />

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
