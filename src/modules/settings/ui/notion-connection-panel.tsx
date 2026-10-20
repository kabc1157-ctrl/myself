"use client";

import { useActionState } from "react";

import { saveNotionDestinationsAction } from "@/modules/settings/application/actions";

type Props = {
  connection: {
    workspace_name: string | null;
    journal_data_source_id: string | null;
    routine_data_source_id: string | null;
  } | null;
  notice?: string;
};

const notices: Record<string, string> = {
  connected: "Notion 계정이 연결됐어요. 아래에 보관 위치를 저장해 주세요.",
  denied: "Notion 연결이 취소됐어요. 공유할 페이지를 선택한 뒤 다시 시도해 주세요.",
  "setup-required": "관리자용 Notion OAuth 환경 설정이 아직 필요해요.",
  "token-error": "Notion 인증 코드를 확인하지 못했어요. 다시 연결해 주세요.",
  "save-error": "연결 정보를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.",
};

export function NotionConnectionPanel({ connection, notice }: Props) {
  const [state, action, pending] = useActionState(saveNotionDestinationsAction, {});
  return (
    <details className="settings-card expandable-panel notion-connection-panel">
      <summary>
        <div className="card-heading with-status">
          <div><span>Notion</span><h2>기록 아카이브</h2></div>
          <span className={`status-badge ${connection ? "connected" : "pending"}`}>{connection ? "연결됨" : "연결 전"}</span>
        </div>
        <span aria-hidden="true" className="expand-icon">+</span>
      </summary>
      {notice && notices[notice] ? <p className="form-message">{notices[notice]}</p> : null}
      <ol className="connection-guide">
        <li>Notion 연결을 누르고 보관을 허용할 페이지를 선택하세요.</li>
        <li>Notion 데이터베이스의 메뉴에서 데이터 소스 ID를 복사하세요.</li>
        <li>일기와 루틴 보관 위치를 각각 저장하세요.</li>
        <li>이후 n8n이 사용자별 연결을 사용해 기록을 자동 생성합니다.</li>
      </ol>
      <a className="secondary-button button-link" href="/api/integrations/notion/connect">{connection ? "Notion 다시 연결" : "Notion 연결"}</a>
      {connection ? (
        <form action={action} className="notion-destination-form">
          <p className="integration-note">연결된 워크스페이스: {connection.workspace_name || "이름 없음"}</p>
          <label><span>일기 데이터 소스 ID</span><input defaultValue={connection.journal_data_source_id ?? ""} name="journalDataSource" placeholder="Manage data sources에서 복사한 ID" required /></label>
          <label><span>루틴 데이터 소스 ID</span><input defaultValue={connection.routine_data_source_id ?? ""} name="routineDataSource" placeholder="Manage data sources에서 복사한 ID" required /></label>
          {state.error ? <p className="form-message error">{state.error}</p> : null}
          {state.message ? <p className="form-message success">{state.message}</p> : null}
          <button className="primary-button" disabled={pending} type="submit">{pending ? "저장 중…" : "보관 위치 저장"}</button>
        </form>
      ) : null}
    </details>
  );
}
