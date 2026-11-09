import { deletePlannerTemplateAction, savePlannerTemplateAction } from "@/modules/life/application/actions";

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
type Template = { id: string; weekday: number; block_key: string; title: string; start_time: string | null; end_time: string | null };

export function PlannerTemplateSettings({ templates }: { templates: Template[] }) {
  return <section className="settings-card planner-template-settings">
    <div className="card-heading"><span>일정 관리</span><h2>주간 일정 템플릿</h2></div>
    <p>반복해서 쓰는 일정을 저장해 두고, 일정 페이지에서 오늘 날짜에 적용할 수 있어요.</p>
    <form action={savePlannerTemplateAction} className="feature-form planner-template-form">
      <label>요일<select name="weekday" defaultValue="1">{weekdays.map((day, index) => <option key={day} value={index}>{day}요일</option>)}</select></label>
      <label>이름<input name="title" placeholder="예: 운동" required /></label>
      <label>구분값<input name="blockKey" placeholder="예: exercise" required /></label>
      <label>시작<input name="startTime" type="time" /></label>
      <label>종료<input name="endTime" type="time" /></label>
      <button className="secondary-button" type="submit">템플릿 저장</button>
    </form>
    {templates.length ? <div className="planner-template-list">{templates.map((template) => <div className="planner-template-row" key={template.id}><span>{weekdays[template.weekday]} · {template.title} {template.start_time ? `(${template.start_time.slice(0, 5)}~${template.end_time?.slice(0, 5) ?? ""})` : ""}</span><form action={deletePlannerTemplateAction}><input name="id" type="hidden" value={template.id}/><button className="text-button danger" type="submit">삭제</button></form></div>)}</div> : <p className="form-hint">저장된 주간 템플릿이 없어요.</p>}
  </section>;
}
