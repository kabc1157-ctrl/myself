"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { verifySession } from "@/core/auth/session";
import { shiftDate } from "@/core/date/local-date";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { getGoogleCalendarAccessToken } from "@/core/integrations/google-calendar/repository";
import { getOrCreateProfile } from "@/core/user/profile-repository";

const eventSchema = z.object({
  eventId: z.string().min(1).optional(),
  title: z.string().trim().min(1).max(200),
  date: z.iso.date(),
  allDay: z.enum(["on"]).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
});

function googleEventBody(input: z.infer<typeof eventSchema>, timeZone: string) {
  if (input.allDay === "on") {
    return {
      summary: input.title,
      start: { date: input.date },
      end: { date: shiftDate(input.date, 1) },
    };
  }
  if (!input.startTime || !input.endTime) throw new Error("시작 시간과 종료 시간이 필요합니다.");
  return {
    summary: input.title,
    start: { dateTime: `${input.date}T${input.startTime}:00`, timeZone },
    end: { dateTime: `${input.date}T${input.endTime}:00`, timeZone },
  };
}

async function getCalendarContext() {
  const session = await verifySession();
  const supabase = await createServerSupabaseClient();
  const [profile, credentials] = await Promise.all([
    getOrCreateProfile(supabase, session.userId),
    getGoogleCalendarAccessToken(session.userId),
  ]);
  if (!credentials) throw new Error("Google Calendar를 다시 연결해 주세요.");
  return { session, supabase, profile, credentials };
}

export async function dismissGoogleCalendarEventAction(formData: FormData) {
  const eventId = z.string().min(1).parse(formData.get("eventId"));
  const eventDate = z.iso.date().parse(formData.get("eventDate"));
  const session = await verifySession();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("google_calendar_event_dismissals").upsert({
    user_id: session.userId,
    event_id: eventId,
    event_date: eventDate,
  }, { onConflict: "user_id,event_id,event_date" });
  if (error) throw new Error("일정 완료 상태를 저장하지 못했습니다.");
  revalidatePath("/home");
}

export async function saveGoogleCalendarEventAction(formData: FormData) {
  const input = eventSchema.parse(Object.fromEntries(formData));
  const { profile, credentials } = await getCalendarContext();
  const eventUrl = input.eventId
    ? `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(credentials.calendarId)}/events/${encodeURIComponent(input.eventId)}`
    : `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(credentials.calendarId)}/events`;
  const response = await fetch(eventUrl, {
    method: input.eventId ? "PATCH" : "POST",
    headers: {
      Authorization: `Bearer ${credentials.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(googleEventBody(input, profile.timezone)),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Google Calendar 일정을 저장하지 못했습니다. Calendar를 다시 연결해 주세요.");
  revalidatePath("/home");
  revalidatePath("/planner");
}

export async function deleteGoogleCalendarEventAction(formData: FormData) {
  const eventId = z.string().min(1).parse(formData.get("eventId"));
  const { credentials } = await getCalendarContext();
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(credentials.calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${credentials.accessToken}` },
      cache: "no-store",
    },
  );
  if (!response.ok && response.status !== 410) throw new Error("Google Calendar 일정을 삭제하지 못했습니다.");
  revalidatePath("/home");
  revalidatePath("/planner");
}
