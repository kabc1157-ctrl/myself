"use client";

import {
  deleteGoogleCalendarEventAction,
  dismissGoogleCalendarEventAction,
  saveGoogleCalendarEventAction,
} from "@/core/integrations/google-calendar/actions";
import type { GoogleCalendarEvent } from "@/core/integrations/google-calendar/repository";

type Props = {
  date: string;
  events: GoogleCalendarEvent[];
  timeZone: string;
};

function inputTime(value: string | null, timeZone: string) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  return `${parts.find((part) => part.type === "hour")?.value ?? "00"}:${parts.find((part) => part.type === "minute")?.value ?? "00"}`;
}

export function CalendarEventManager({ date, events, timeZone }: Props) {
  return (
    <div className="home-calendar-manager">
      <details className="home-calendar-editor home-calendar-create">
        <summary>+ 일정 추가</summary>
        <form action={saveGoogleCalendarEventAction}>
          <input name="title" placeholder="일정 이름" required />
          <input defaultValue={date} name="date" required type="date" />
          <label className="calendar-all-day-option"><input name="allDay" type="checkbox" /> 종일</label>
          <div className="calendar-time-fields">
            <label>시작<input name="startTime" type="time" /></label>
            <label>종료<input name="endTime" type="time" /></label>
          </div>
          <button className="primary-button" type="submit">Google Calendar에 추가</button>
        </form>
      </details>

      <div className="home-calendar-list">
        {events.map((event) => (
          <div className="home-calendar-event" key={event.id}>
            {event.allDay ? (
              <form action={dismissGoogleCalendarEventAction}>
                <input name="eventId" type="hidden" value={event.id} />
                <input name="eventDate" type="hidden" value={event.date} />
                <button aria-label={`${event.title} 완료하여 숨기기`} className="calendar-complete-button" type="submit" />
              </form>
            ) : <span className="calendar-time-dot" aria-hidden="true" />}
            <time>{event.startLabel}</time>
            <details className="home-calendar-editor">
              <summary>{event.title}</summary>
              <form action={saveGoogleCalendarEventAction}>
                <input name="eventId" type="hidden" value={event.id} />
                <input defaultValue={event.title} name="title" required />
                <input defaultValue={event.date} name="date" required type="date" />
                {event.allDay ? <input name="allDay" type="hidden" value="on" /> : (
                  <div className="calendar-time-fields">
                    <label>시작<input defaultValue={inputTime(event.startTime, timeZone)} name="startTime" required type="time" /></label>
                    <label>종료<input defaultValue={inputTime(event.endTime, timeZone)} name="endTime" required type="time" /></label>
                  </div>
                )}
                <div className="calendar-editor-actions">
                  <button className="primary-button" type="submit">수정</button>
                  {event.htmlLink ? <a href={event.htmlLink} rel="noreferrer" target="_blank">Google에서 보기</a> : null}
                </div>
              </form>
              <form action={deleteGoogleCalendarEventAction} onSubmit={(eventObject) => {
                if (!window.confirm("Google Calendar에서도 이 일정을 삭제할까요?")) eventObject.preventDefault();
              }}>
                <input name="eventId" type="hidden" value={event.id} />
                <button className="text-button danger" type="submit">일정 삭제</button>
              </form>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
