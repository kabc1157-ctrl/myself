export type HomeScheduleTask = {
  id: string;
  title: string;
  planned_date: string | null;
  start_time: string | null;
  end_time: string | null;
};

export function getHomeNowSchedule(tasks: HomeScheduleTask[], date: string, nowMinutes: number) {
  const today = tasks.filter(
    (task) => task.planned_date === date && task.start_time && task.end_time,
  );
  const toMinutes = (value: string) => {
    const [hour, minute] = value.slice(0, 5).split(":").map(Number);
    return hour * 60 + minute;
  };
  const current = today.filter(
    (task) => toMinutes(task.start_time!) <= nowMinutes && toMinutes(task.end_time!) > nowMinutes,
  );
  const nextStart = today
    .filter((task) => toMinutes(task.start_time!) > nowMinutes)
    .reduce<number | null>(
      (nearest, task) => Math.min(nearest ?? Infinity, toMinutes(task.start_time!)),
      null,
    );
  const next = nextStart === null ? [] : today.filter((task) => toMinutes(task.start_time!) === nextStart);

  return { current, next };
}
