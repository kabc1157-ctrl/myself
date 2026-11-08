"use client";

import { useState } from "react";

export function ReadingCompletionControl({ bookId, completed }: { bookId: string; completed: boolean }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function changeStatus() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/reading/books/${bookId}/reflection`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ complete: !completed }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "상태를 저장하지 못했어요.");
      setMessage(!completed ? "완독 처리했어요. 회고를 만들고 있어요." : "읽는 중으로 변경했어요.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "상태를 저장하지 못했어요."); }
    finally { setBusy(false); }
  }
  return <div className="reading-completion-control"><button className="text-button reading-book-status-action" disabled={busy} onClick={changeStatus} type="button">{busy ? "저장 중…" : completed ? "읽는 중으로 변경" : "완독 처리"}</button>{message ? <small role="status">{message}</small> : null}</div>;
}
