"use client";

import { FormEvent, useState, useTransition } from "react";
import { deleteExerciseAction, saveExerciseAction } from "@/modules/life/application/actions";

type Log = { id: string; exercise_date: string; exercise_type: string; activity: string; focus_area: string | null; memo: string | null };

export function ExerciseLogEditor({ log }: { log: Log }) {
  const [open, setOpen] = useState(false); const [pending, startTransition] = useTransition(); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; setError(""); setMessage(""); startTransition(async () => { try { await saveExerciseAction(new FormData(form)); setMessage("운동 기록을 수정했습니다."); setOpen(false); } catch (caught) { setError(caught instanceof Error ? caught.message : "저장하지 못했어요."); } }); };
  const remove = () => { if (!window.confirm("이 운동 기록을 삭제할까요?")) return; setError(""); setMessage(""); const data = new FormData(); data.set("id", log.id); startTransition(async () => { try { await deleteExerciseAction(data); setMessage("운동 기록을 삭제했습니다."); setOpen(false); } catch (caught) { setError(caught instanceof Error ? caught.message : "삭제하지 못했어요."); } }); };
  return <div className="exercise-log-editor"><button className="archive-button" onClick={() => { setOpen((value) => !value); setError(""); setMessage(""); }} type="button">{open ? "수정 닫기" : "수정"}</button>{open ? <form className="feature-form" onSubmit={submit}><input name="date" type="hidden" value={log.exercise_date}/><label>운동 종류<select defaultValue={log.exercise_type} name="type"><option value="cardio">유산소</option><option value="stretching">스트레칭</option><option value="strength">근력</option></select></label><label>오늘 한 운동<textarea defaultValue={log.activity} name="activity" required rows={3}/></label><label>집중 부위<input defaultValue={log.focus_area ?? ""} name="focusArea"/></label><label>메모<textarea defaultValue={log.memo ?? ""} name="memo" rows={3}/></label>{error ? <p className="form-error" role="alert">{error}</p> : null}<div className="exercise-log-edit-actions"><button className="secondary-button" disabled={pending} type="submit">{pending ? "저장 중…" : "수정 저장"}</button><button className="text-button danger" disabled={pending} onClick={remove} type="button">삭제</button></div></form> : null}{message ? <p className="form-success" role="status">{message}</p> : null}</div>;
}
