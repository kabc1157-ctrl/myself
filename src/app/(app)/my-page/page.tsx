import { logoutAction } from "@/core/auth/actions";
import { verifySession } from "@/core/auth/session";
import Link from "next/link";
import { getRecentPeriodReports } from "@/core/ai/self-understanding";
import { formatShortKoreanDate } from "@/core/date/local-date";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { InstallAppButton } from "@/core/pwa/install-app-button";
import { getOrCreateProfile } from "@/core/user/profile-repository";
import { ProfileSettingsForm } from "@/modules/settings/ui/profile-settings-form";
import { getGoogleCalendarConnection } from "@/core/integrations/google-calendar/repository";
import { GoogleCalendarConnectionPanel } from "@/modules/settings/ui/google-calendar-connection-panel";
import { saveFeatureSettingsAction, savePlannerHoursAction } from "@/modules/life/application/actions";
import { getFeatureSettings } from "@/modules/life/infrastructure/repository";

type MyPageProps = { searchParams: Promise<{ calendar?: string | string[] }> };

export default async function MyPage({ searchParams }: MyPageProps) {
  const [session, supabase] = await Promise.all([
    verifySession(),
    createServerSupabaseClient(),
  ]);
  const [profile, recentReports, featureSettings, calendarConnection, parameters] = await Promise.all([
    getOrCreateProfile(supabase, session.userId),
    getRecentPeriodReports(supabase, session.userId),
    getFeatureSettings(supabase, session.userId),
    getGoogleCalendarConnection(supabase, session.userId),
    searchParams,
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
          <ProfileSettingsForm aiTone={profile.ai_tone} displayName={profile.display_name} weekStartsOn={profile.week_starts_on} />
        </details>

        <section className="settings-card monthly-insight-archive">
          <div className="card-heading">
            <span>AI 분석</span>
            <h2><Link href="/ai-reports">AI 주간/월간 분석</Link></h2>
          </div>
          {recentReports.length === 0 ? <p>AI 분석이 완료되면 최근 리포트가 이곳에 표시돼요.</p> : <div className="discovery-list">{recentReports.map((report) => <Link className="discovery-card" href={`/ai-reports?type=${report.period_type === "monthly" ? "monthly" : "weekly"}&date=${report.period_start}`} key={report.id}><div className="home-insight-meta"><span>{report.period_type === "monthly" ? "월간" : "주간"}</span><time>{formatShortKoreanDate(report.period_start)} ~ {formatShortKoreanDate(report.period_end)}</time></div><h3>{report.title}</h3></Link>)}</div>}
        </section>

        <section className="settings-card">
          <div className="card-heading"><span>홈과 메뉴</span><h2>기능 설정</h2></div>
          <form action={saveFeatureSettingsAction} className="feature-form">
            <label className="checkbox-line"><input defaultChecked={featureSettings.notes_enabled} name="notes" type="checkbox"/> 메모</label>
            <label className="checkbox-line"><input defaultChecked={featureSettings.exercise_enabled} name="exercise" type="checkbox"/> 운동 기록장</label>
            <label className="checkbox-line"><input defaultChecked={featureSettings.reading_enabled} name="reading" type="checkbox"/> 독서 기록</label>
            <label className="checkbox-line"><input defaultChecked={featureSettings.planner_enabled} name="planner" type="checkbox"/> 일정 관리</label>
            <label className="checkbox-line"><input defaultChecked={featureSettings.payroll_enabled} name="payroll" type="checkbox"/> 월급 관리</label>
            <label className="checkbox-line"><input defaultChecked={featureSettings.investment_enabled} name="investment" type="checkbox"/> 투자(매매 일지)</label>
            <button className="secondary-button">기능 설정 저장</button>
          </form>
        </section>

        <section className="settings-card">
          <div className="card-heading"><span>일정 관리</span><h2>하루 시간표 설정</h2></div>
          <form action={savePlannerHoursAction} className="feature-form planner-hours-form">
            <label>하루 시작 시간<input defaultValue={featureSettings.planner_day_start.slice(0, 5)} name="startTime" step="1800" type="time" /></label>
            <label>하루 끝 시간<input defaultValue={featureSettings.planner_day_end.slice(0, 5)} name="endTime" step="1800" type="time" /></label>
            <button className="secondary-button">시간 저장</button>
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
