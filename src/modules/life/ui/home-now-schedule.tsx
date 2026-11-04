"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getHomeNowSchedule, type HomeScheduleTask } from "@/modules/life/domain/home-now-schedule";

type Task = HomeScheduleTask;
type Props = { tasks: Task[]; date: string; timeZone: string };

function localNow(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

function ScheduleItem({ task }: { task: Task }) { return <article><small>{task.start_time!.slice(0, 5)} ~ {task.end_time!.slice(0, 5)}</small><h3>{task.title}</h3></article>; }

export function HomeNowSchedule({ tasks, date, timeZone }: Props) {
  const router = useRouter();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const refresh = () => {
      setTick((value) => value + 1);
      if (document.visibilityState === "visible") router.refresh();
    };
    const timer = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", refresh); };
  }, [router]);
  const schedule = useMemo(() => {
    void tick;
    const now = localNow(timeZone);
    return getHomeNowSchedule(tasks, now.date || date, now.minutes);
  }, [date, tasks, timeZone, tick]);
  return <section className="home-pending-routines home-now-schedule" aria-labelledby="home-now-title"><div className="home-section-heading"><h2 id="home-now-title">NOW</h2><Link href="/planner">일정 추가</Link></div><div className="home-now-columns"><div><strong>진행 중</strong>{schedule.current.length ? schedule.current.map((task) => <ScheduleItem key={task.id} task={task}/>) : <p>-</p>}</div><div><strong>다음 예정</strong>{schedule.next.length ? schedule.next.map((task) => <ScheduleItem key={task.id} task={task}/>) : <p>-</p>}</div></div></section>;
}
