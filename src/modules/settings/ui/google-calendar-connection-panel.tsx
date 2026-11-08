type Props = {
  connection: { account_email: string | null } | null;
  notice?: string;
};

const notices: Record<string, string> = {
  connected: "Google Calendar가 연결됐어요.",
  denied: "Google Calendar 연결이 취소됐어요.",
  "setup-required": "Google Cloud와 Vercel의 Calendar 연결 설정이 아직 필요해요.",
  "token-error": "Google 인증을 완료하지 못했어요. 다시 연결해 주세요.",
  "save-error": "연결 정보를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.",
  "disconnect-error": "Google Calendar 연결 해제에 실패했어요. 잠시 후 다시 시도해 주세요.",
};

export function GoogleCalendarConnectionPanel({ connection, notice }: Props) {
  return (
    <details className="settings-card expandable-panel calendar-connection-panel integration-card my-page-calendar-panel" open={Boolean(notice && notice !== "connected" && notice !== "disconnected")}>
      <summary>
        <div className="card-heading calendar-card-heading">
          <span>Google Calendar</span>
          <div className="calendar-title-row">
            <h2>오늘 일정 연결</h2>
          </div>
        </div>
        <span aria-hidden="true" className="expand-icon">+</span>
      </summary>
      {connection ? <p className="calendar-account">{connection.account_email ?? "연결된 계정"} 캘린더 연결됨</p> : null}
      <div className="calendar-connection-actions">
        {!connection ? <a className="secondary-button button-link" href="/api/integrations/google-calendar/connect">Google Calendar 연결</a> : (
          <form action="/api/integrations/google-calendar/disconnect" method="post">
            <button className="calendar-disconnect-button" type="submit">연결해제</button>
          </form>
        )}
      </div>
    </details>
  );
}
