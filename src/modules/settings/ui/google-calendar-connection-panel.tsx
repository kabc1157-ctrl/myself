type Props = {
  connection: { account_email: string | null } | null;
  notice?: string;
};

const notices: Record<string, string> = {
  connected: "Google Calendar가 연결됐어요.",
  disconnected: "Google Calendar 연결을 해제했어요.",
  denied: "Google Calendar 연결이 취소됐어요.",
  "setup-required": "Google Calendar 관리자 설정이 아직 필요해요.",
  "token-error": "Google 인증을 완료하지 못했어요. 다시 연결해 주세요.",
  "save-error": "연결 정보를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.",
};

export function GoogleCalendarConnectionPanel({ connection, notice }: Props) {
  return (
    <details className="settings-card expandable-panel calendar-connection-panel">
      <summary>
        <div className="card-heading with-status">
          <div><span>Google Calendar</span><h2>오늘 일정 연결</h2></div>
          <span className={`status-badge ${connection ? "connected" : "pending"}`}>{connection ? "연결됨" : "연결 전"}</span>
        </div>
        <span aria-hidden="true" className="expand-icon">+</span>
      </summary>
      {notice && notices[notice] ? <p className="form-message">{notices[notice]}</p> : null}
      <p className="integration-note">기본 캘린더를 읽기 전용으로 연결하면 홈에서 오늘 일정을 확인할 수 있어요.</p>
      {connection ? <p className="calendar-account">{connection.account_email || "연결된 Google 계정"}</p> : null}
      <div className="calendar-connection-actions">
        <a className="secondary-button button-link" href="/api/integrations/google-calendar/connect">
          {connection ? "다른 계정으로 다시 연결" : "Google Calendar 연결"}
        </a>
        {connection ? (
          <form action="/api/integrations/google-calendar/disconnect" method="post">
            <button className="text-button danger" type="submit">연결 해제</button>
          </form>
        ) : null}
      </div>
    </details>
  );
}
