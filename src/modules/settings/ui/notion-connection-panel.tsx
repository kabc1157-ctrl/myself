import type { ReactNode } from "react";

type Props = { connection: { workspace_name: string | null } | null; notice?: string; children?: ReactNode };

const notices: Record<string, string> = { denied: "Notion 연결이 취소됐어요.", "setup-required": "Notion OAuth 설정이 아직 필요해요.", "token-error": "Notion 인증 토큰을 받을 수 없어요.", "save-error": "Notion 연결 정보를 저장하지 못했어요.", "disconnect-error": "Notion 연결 해제에 실패했어요." };

export function NotionConnectionPanel({ connection, notice, children }: Props) {
  return <details className="settings-card expandable-panel notion-connection-panel integration-card" open={Boolean(notice && notices[notice])}><summary><div className="card-heading"><span>외부 서비스</span><h2>Notion</h2></div><span aria-hidden="true" className="expand-icon">+</span></summary>{notice && notices[notice] ? <p className="form-message" role="status">{notices[notice]}</p> : null}<p>{connection ? `${connection.workspace_name ?? "연결된 워크스페이스"} 연결됨` : "Notion To-do를 연결해 보세요."}</p><div className="calendar-connection-actions">{connection ? <form className="integration-disconnect-form" action="/api/integrations/notion/disconnect" method="post"><button className="calendar-disconnect-button" type="submit">연결 해제</button></form> : <a className="secondary-button button-link" href="/api/integrations/notion/connect">Notion 연결</a>}</div>{children}</details>;
}
