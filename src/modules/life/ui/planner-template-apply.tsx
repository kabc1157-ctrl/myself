import { applyPlannerTemplatesAction } from "@/modules/life/application/actions";

export function PlannerTemplateApply({ date }: { date: string }) {
  return <form action={applyPlannerTemplatesAction} className="planner-template-apply"><input name="date" type="hidden" value={date}/><button className="secondary-button" type="submit">주간 템플릿 적용</button></form>;
}
