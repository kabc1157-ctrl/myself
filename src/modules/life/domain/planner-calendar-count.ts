type PlannedTask = { title: string; planned_date: string | null; start_time: string | null; end_time: string | null };
type CalendarEvent = { title: string; date: string; startTime: string | null; endTime: string | null };

function normalizeTitle(title: string) { return title.trim().replace(/\s+/g, " ").toLocaleLowerCase(); }
function normalizeTime(value: string | null, timeZone: string) {
  if (!value) return "";
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value));
  return `${parts.find((part) => part.type === "hour")?.value ?? ""}:${parts.find((part) => part.type === "minute")?.value ?? ""}`;
}

export function countPlannerCalendarItems(date: string, timeZone: string, tasks: PlannedTask[], events: CalendarEvent[]) {
  const keys = new Set<string>();
  for (const task of tasks) {
    if (task.planned_date !== date) continue;
    keys.add(`${normalizeTitle(task.title)}|${date}|${normalizeTime(task.start_time, timeZone)}|${normalizeTime(task.end_time, timeZone)}`);
  }
  for (const event of events) {
    if (event.date !== date) continue;
    keys.add(`${normalizeTitle(event.title)}|${date}|${normalizeTime(event.startTime, timeZone)}|${normalizeTime(event.endTime, timeZone)}`);
  }
  return keys.size;
}
