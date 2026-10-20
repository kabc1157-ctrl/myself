import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { shiftDate } from "@/core/date/local-date";
import type { Database } from "@/core/db/database.types";
import { createAdminSupabaseClient } from "@/core/db/supabase/server";
import { getServerEnv } from "@/core/config/server-env";
import { decryptGoogleToken, encryptGoogleToken } from "@/core/integrations/google-calendar/crypto";

export type GoogleCalendarEvent = {
  id: string;
  title: string;
  startLabel: string;
  allDay: boolean;
  htmlLink: string | null;
};

type GoogleEvent = {
  id?: string;
  summary?: string;
  htmlLink?: string;
  status?: string;
  start?: { date?: string; dateTime?: string };
};

function localMidnightToIso(date: string, timeZone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const guess = Date.UTC(year, month - 1, day);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(formatter.formatToParts(new Date(guess)).map((part) => [part.type, part.value]));
  const representedAsUtc = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour), Number(parts.minute), Number(parts.second),
  );
  return new Date(guess - (representedAsUtc - guess)).toISOString();
}

async function refreshAccessToken(refreshToken: string) {
  const env = getServerEnv();
  if (!env.GOOGLE_CALENDAR_CLIENT_ID || !env.GOOGLE_CALENDAR_CLIENT_SECRET) return null;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CALENDAR_CLIENT_ID,
      client_secret: env.GOOGLE_CALENDAR_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    cache: "no-store",
  });
  if (!response.ok) return null;
  return response.json() as Promise<{ access_token: string; expires_in: number }>;
}

export async function getGoogleCalendarConnection(supabase: SupabaseClient<Database>, userId: string) {
  const { data } = await supabase
    .from("google_calendar_connections")
    .select("user_id, account_email, calendar_id, connected_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function getTodayGoogleCalendarEvents(
  supabase: SupabaseClient<Database>,
  userId: string,
  date: string,
  timeZone: string,
) {
  const visibleConnection = await getGoogleCalendarConnection(supabase, userId);
  if (!visibleConnection) return { connected: false, events: [] as GoogleCalendarEvent[] };

  let admin: ReturnType<typeof createAdminSupabaseClient>;
  try {
    admin = createAdminSupabaseClient();
  } catch {
    return { connected: true, events: [] as GoogleCalendarEvent[], needsSetup: true };
  }
  const { data: connection } = await admin
    .from("google_calendar_connections")
    .select("access_token_ciphertext, refresh_token_ciphertext, access_token_expires_at, calendar_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!connection) return { connected: true, events: [] as GoogleCalendarEvent[], needsReconnect: true };

  let accessToken = decryptGoogleToken(connection.access_token_ciphertext);
  if (new Date(connection.access_token_expires_at).getTime() <= Date.now() + 60_000) {
    if (!connection.refresh_token_ciphertext) return { connected: true, events: [] as GoogleCalendarEvent[], needsReconnect: true };
    const refreshed = await refreshAccessToken(decryptGoogleToken(connection.refresh_token_ciphertext));
    if (!refreshed) return { connected: true, events: [] as GoogleCalendarEvent[], needsReconnect: true };
    accessToken = refreshed.access_token;
    await admin.from("google_calendar_connections").update({
      access_token_ciphertext: encryptGoogleToken(accessToken),
      access_token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);
  }

  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(connection.calendar_id)}/events`);
  url.searchParams.set("timeMin", localMidnightToIso(date, timeZone));
  url.searchParams.set("timeMax", localMidnightToIso(shiftDate(date, 1), timeZone));
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "20");
  url.searchParams.set("timeZone", timeZone);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) return { connected: true, events: [] as GoogleCalendarEvent[], unavailable: true };
  const payload = await response.json() as { items?: GoogleEvent[] };
  const timeFormatter = new Intl.DateTimeFormat("ko-KR", { timeZone, hour: "numeric", minute: "2-digit" });
  const events = (payload.items ?? [])
    .filter((event) => event.status !== "cancelled")
    .map((event, index): GoogleCalendarEvent => ({
      id: event.id ?? `event-${index}`,
      title: event.summary?.trim() || "제목 없는 일정",
      allDay: Boolean(event.start?.date && !event.start?.dateTime),
      startLabel: event.start?.dateTime ? timeFormatter.format(new Date(event.start.dateTime)) : "종일",
      htmlLink: event.htmlLink ?? null,
    }));
  return { connected: true, events };
}
