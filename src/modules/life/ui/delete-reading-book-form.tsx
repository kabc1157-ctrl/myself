"use client";

import { deleteReadingBookAction } from "@/modules/life/application/actions";

export function DeleteReadingBookForm({ bookId, hasLogs = false }: { bookId: string; hasLogs?: boolean }) {
  return <form action={deleteReadingBookAction} className="reading-archive-delete-form" onSubmit={(event) => {
    const message = hasLogs ? "이 책과 연결된 독서 기록도 함께 삭제됩니다. 정말 삭제하시겠습니까?" : "정말 삭제하시겠습니까?";
    if (!window.confirm(message)) event.preventDefault();
  }}><input name="id" type="hidden" value={bookId} /><button className="text-button danger" type="submit">책 삭제</button></form>;
}
