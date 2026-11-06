import Link from "next/link";

import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { saveGoogleCalendarEventAction } from "@/core/integrations/google-calendar/actions";
import { CalendarEventManager } from "@/core/integrations/google-calendar/calendar-event-manager";
import { getTodayGoogleCalendarEvents } from "@/core/integrations/google-calendar/repository";

type Props = {
  date: string;
  timeZone: string;
  userId: string;
};

export function HomeCalendarFallback() {
  return (
    <div className="home-calendar-today" aria-busy="true" aria-label="오늘 일정을 불러오는 중">
      <div className="home-calendar-heading">
        <h3>오늘 일정</h3>
      </div>
      <div className="home-calendar-loading" aria-hidden="true"><span /></div>
    </div>
  );
}

export function HomeCalendarCreateAction({ date }: { date: string }) {
  return <details className="home-calendar-editor home-calendar-create">
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
  </details>;
}

export async function HomeCalendarSection({ date, timeZone, userId }: Props) {
  const supabase = await createServerSupabaseClient();
  const calendar = await getTodayGoogleCalendarEvents(supabase, userId, date, timeZone);

  return (
    <div className="home-calendar-today">
      <div className="home-calendar-heading">
        <h3>오늘 일정</h3>
        {calendar.connected ? <HomeCalendarCreateAction date={date} /> : <Link href="/my-page">연결</Link>}
      </div>
      {!calendar.connected ? (
        <p className="home-calendar-empty">Google Calendar를 연결하면 오늘 일정이 보여요.</p>
      ) : calendar.needsSetup ? (
        <p className="home-calendar-empty">Calendar 관리자 설정을 완료해 주세요.</p>
      ) : calendar.needsReconnect ? (
        <p className="home-calendar-empty">Calendar 연결을 다시 확인해 주세요.</p>
      ) : (
        <CalendarEventManager date={date} events={calendar.events} timeZone={timeZone} hideCreate />
      )}
    </div>
  );
}
