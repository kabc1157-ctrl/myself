import Link from "next/link";

import { createServerSupabaseClient } from "@/core/db/supabase/server";
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

export async function HomeCalendarSection({ date, timeZone, userId }: Props) {
  const supabase = await createServerSupabaseClient();
  const calendar = await getTodayGoogleCalendarEvents(supabase, userId, date, timeZone);

  return (
    <div className="home-calendar-today">
      <div className="home-calendar-heading">
        <h3>오늘 일정</h3>
        <Link href="/my-page">{calendar.connected ? "설정" : "연결"}</Link>
      </div>
      {!calendar.connected ? (
        <p className="home-calendar-empty">Google Calendar를 연결하면 오늘 일정이 보여요.</p>
      ) : calendar.needsSetup ? (
        <p className="home-calendar-empty">Calendar 관리자 설정을 완료해 주세요.</p>
      ) : calendar.needsReconnect ? (
        <p className="home-calendar-empty">Calendar 연결을 다시 확인해 주세요.</p>
      ) : (
        <CalendarEventManager date={date} events={calendar.events} timeZone={timeZone} />
      )}
    </div>
  );
}
