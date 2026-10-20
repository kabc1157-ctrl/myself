export function getLocalDate(timeZone: string, instant = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getIsoWeekday(date: string): number {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

export function getCalendarWeekdays(weekStartsOn: number) {
  return weekStartsOn === 7
    ? ["일", "월", "화", "수", "목", "금", "토"]
    : ["월", "화", "수", "목", "금", "토", "일"];
}

export function getCalendarLeadingDays(date: string, weekStartsOn: number) {
  const isoWeekday = getIsoWeekday(date);
  return weekStartsOn === 7 ? isoWeekday % 7 : isoWeekday - 1;
}

export function formatKoreanDate(date: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function formatShortKoreanDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return `${String(year).slice(-2)}년 ${month}월 ${day}일`;
}

export function shiftDate(date: string, amount: number): string {
  const shifted = new Date(`${date}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + amount);
  return shifted.toISOString().slice(0, 10);
}

export function getWeekRange(date: string, weekStartsOn = 1): { start: string; endExclusive: string } {
  const isoWeekday = getIsoWeekday(date);
  const normalizedStart = weekStartsOn === 7 ? 7 : 1;
  const offset = (isoWeekday - normalizedStart + 7) % 7;
  const start = shiftDate(date, -offset);

  return { start, endExclusive: shiftDate(start, 7) };
}

export function getDateRange(start: string, endExclusive: string): string[] {
  const dates: string[] = [];
  for (let date = start; date < endExclusive; date = shiftDate(date, 1)) {
    dates.push(date);
  }
  return dates;
}

export function getMonthRange(month: string): { start: string; endExclusive: string } {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));

  return {
    start: start.toISOString().slice(0, 10),
    endExclusive: end.toISOString().slice(0, 10),
  };
}

export function shiftMonth(month: string, amount: number): string {
  const [yearText, monthText] = month.split("-");
  const shifted = new Date(Date.UTC(Number(yearText), Number(monthText) - 1 + amount, 1));
  return shifted.toISOString().slice(0, 7);
}

export function isMonth(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}
