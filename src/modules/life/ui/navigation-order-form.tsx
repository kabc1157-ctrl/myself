"use client";

import { FormEvent, useState, useTransition } from "react";

type NavigationOption = { id: string; label: string };

export function NavigationOrderForm({ options, initialOrder, action }: { options: NavigationOption[]; initialOrder: string[]; action: (formData: FormData) => Promise<void> }) {
  const [slots, setSlots] = useState(() => options.map((option, index) => initialOrder.includes(option.id) ? option.id : options[index].id));
  const [message, setMessage] = useState(""); const [saving, startTransition] = useTransition();
  const swap = (index: number, nextValue: string) => setSlots((current) => { const otherIndex = current.indexOf(nextValue); if (otherIndex < 0 || otherIndex === index) return current; const next = [...current]; [next[index], next[otherIndex]] = [next[otherIndex], next[index]]; return next; });
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; setMessage(""); const data = new FormData(form); startTransition(async () => { try { await action(data); setMessage("메뉴 순서를 저장했습니다."); const details = form.closest("details"); if (details) details.open = false; } catch { setMessage("메뉴 순서를 저장하지 못했어요."); } }); };
  return <form className="feature-form navigation-order-form" onSubmit={submit}><input name="order" type="hidden" value={JSON.stringify(slots)} readOnly /><p className="form-hint">메뉴를 선택하면 기존 메뉴와 위치가 바뀝니다.</p><div className="navigation-order-grid">{slots.map((value, index) => <label key={index}><span>{index + 1}번</span><select name={`slot-${index}`} onChange={(event) => swap(index, event.target.value)} value={value}>{options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>)}</div>{message ? <p className="form-success" role="status">{message}</p> : null}<button className="secondary-button" disabled={saving} type="submit">{saving ? "저장 중…" : "메뉴 순서 저장"}</button></form>;
}
