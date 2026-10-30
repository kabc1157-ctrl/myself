"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { savePlannerEventPriorityAction } from "@/modules/life/application/actions";

export function PlannerEventPriorityButtons({ title, date }: { title: string; date: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <div className="planner-event-priority-buttons"><span>우선순위</span>{[1,2,3].map((priority) => <button disabled={pending} key={priority} onClick={() => startTransition(async () => { const data = new FormData(); data.set("title", title); data.set("date", date); data.set("priority", String(priority)); await savePlannerEventPriorityAction(data); router.refresh(); })} type="button">{priority}</button>)}</div>;
}
