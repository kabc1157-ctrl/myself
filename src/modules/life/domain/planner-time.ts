export function resolvePlannerEndTime(startTime: string, requestedEnd?: string) {
  const [hour, minute] = startTime.split(":").map(Number);
  const startMinutes = hour * 60 + minute;
  const fallbackMinutes = Math.min(startMinutes + 30, 23 * 60 + 59);
  const endTime = requestedEnd || `${String(Math.floor(fallbackMinutes / 60)).padStart(2, "0")}:${String(fallbackMinutes % 60).padStart(2, "0")}`;
  const [endHour, endMinute] = endTime.split(":").map(Number);
  if (!Number.isFinite(startMinutes) || !Number.isFinite(endHour) || !Number.isFinite(endMinute) || endHour * 60 + endMinute <= startMinutes) throw new Error("종료 시간은 시작 시간보다 늦어야 해요.");
  return endTime;
}
