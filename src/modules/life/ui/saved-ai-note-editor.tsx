"use client";

import { useMemo, useState } from "react";

import { updateSavedAiNoteAction } from "@/core/ai/self-understanding-actions";

type Highlight = { text: string; tone: "underline" | "highlight" };

function renderHighlighted(content: string, highlights: Highlight[]) {
  const first = highlights[0];
  if (!first?.text) return content;
  const [before, ...after] = content.split(first.text);
  if (!after.length) return content;
  return <>{before}<mark className={first.tone === "underline" ? "ai-note-underline" : "ai-note-highlight"}>{first.text}</mark>{after.join(first.text)}</>;
}

export function SavedAiNoteEditor({ id, content, sourceKind, sourceUrl, sourceTitle, personalMemo, highlights, title }: { id: string; content: string; sourceKind: string; sourceUrl: string | null; sourceTitle: string | null; personalMemo: string | null; highlights: unknown; title: string }) {
  const initialHighlights = Array.isArray(highlights)
    ? highlights.filter((item): item is Highlight => {
        if (!item || typeof item !== "object" || !("text" in item) || !("tone" in item)) return false;
        const candidate = item as Highlight;
        return typeof candidate.text === "string" && (candidate.tone === "underline" || candidate.tone === "highlight");
      })
    : [];
  const [items, setItems] = useState<Highlight[]>(initialHighlights);
  const serialized = useMemo(() => JSON.stringify(items), [items]);
  const addHighlight = (tone: Highlight["tone"]) => {
    const selected = window.getSelection()?.toString().trim();
    if (!selected) return;
    setItems((previous) => [...previous.filter((item) => item.text !== selected), { text: selected, tone }]);
    window.getSelection()?.removeAllRanges();
  };
  return <section className="saved-ai-note">
    <div className="saved-ai-note-meta"><span>출처: {sourceKind} · {sourceTitle || title}</span>{sourceUrl ? <a href={sourceUrl}>원본 보기</a> : null}</div>
    <form action={updateSavedAiNoteAction} className="feature-form saved-ai-note-form"><input name="id" type="hidden" value={id}/><input name="highlights" type="hidden" value={serialized}/><label>제목<input defaultValue={title} name="title" required /></label><label>인사이트 내용<textarea defaultValue={content} name="content" rows={5}/></label><p className="saved-ai-note-content">{renderHighlighted(content, items)}</p><div className="saved-ai-note-tools"><button onClick={() => addHighlight("underline")} type="button">빨간 밑줄</button><button onClick={() => addHighlight("highlight")} type="button">형광펜</button><button onClick={() => setItems([])} type="button">강조 지우기</button></div><label>나의 메모<textarea defaultValue={personalMemo ?? ""} name="personalMemo" placeholder="AI 인사이트를 읽으며 든 생각을 적어 보세요." rows={3}/></label><button className="secondary-button" type="submit">AI 메모 저장</button></form>
  </section>;
}
