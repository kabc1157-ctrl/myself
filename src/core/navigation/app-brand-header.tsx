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
  const isMyPage = pathname === "/my-page" || pathname.startsWith("/my-page/");

  return (
    <header className="app-brand-header">
      <Link aria-label="이음새 홈" className="app-brand-lockup" href="/home">
        <Image alt="" height={44} priority src="/app-icon.png" width={44} />
        <span><strong>이음새</strong><small>IEUMSAE</small></span>
      </Link>
      <div className="app-page-heading">
        <span aria-current="page" className="app-page-title">{title}</span>
        <Link aria-current={isMyPage ? "page" : undefined} aria-label="마이페이지" className="header-profile-link" href="/my-page">
          <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="3.25" />
            <path d="M5.75 19a6.25 6.25 0 0 1 12.5 0" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
