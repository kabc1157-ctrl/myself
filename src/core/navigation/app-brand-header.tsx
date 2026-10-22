"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const pageTitles: Array<[string, string]> = [
  ["/home", "홈"],
  ["/journal", "일기"],
  ["/routines", "루틴"],
  ["/notes", "메모"],
  ["/exercise", "운동 기록장"],
  ["/planner", "일정 관리"],
  ["/payroll", "월급"],
  ["/discoveries", "나의 발견"],
  ["/my-page", "마이페이지"],
];

export function AppBrandHeader() {
  const pathname = usePathname();
  const title = pageTitles.find(([path]) => pathname === path || pathname.startsWith(`${path}/`))?.[1] ?? "이음새";

  return (
    <header className="app-brand-header">
      <Link aria-label="이음새 홈" className="app-brand-lockup" href="/home">
        <Image alt="" height={44} priority src="/app-icon.png" width={44} />
        <span><strong>이음새</strong><small>IEUMSAE</small></span>
      </Link>
      <span className="discoveries-link" aria-current="page">{title}</span>
    </header>
  );
}
