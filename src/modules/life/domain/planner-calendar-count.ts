type PlannedTask = { title: string; planned_date: string | null; start_time: string | null; end_time: string | null };
type CalendarEvent = { title: string; date: string; startTime: string | null; endTime: string | null };

function normalizeTitle(title: string) { return title.trim().replace(/\s+/g, " ").toLocaleLowerCase(); }

export function countPlannerCalendarItems(date: string, tasks: PlannedTask[], events: CalendarEvent[]) {
  const keys = new Set<string>();
  for (const task of tasks) {
    if (task.planned_date !== date) continue;
    keys.add(`${normalizeTitle(task.title)}|${date}|${task.start_time ?? ""}|${task.end_time ?? ""}`);
  }
  for (const event of events) {
    if (event.date !== date) continue;
    keys.add(`${normalizeTitle(event.title)}|${date}|${event.startTime ?? ""}|${event.endTime ?? ""}`);
  }
  return keys.size;
}
