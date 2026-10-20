"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function AppLaunchSplash() {
  const [phase, setPhase] = useState<"visible" | "leaving" | "hidden">("visible");

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => setPhase("leaving"), 850);
    const hideTimer = window.setTimeout(() => setPhase("hidden"), 1200);
    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      aria-label="이음새를 불러오는 중"
      aria-live="polite"
      className={`app-launch-splash ${phase === "leaving" ? "is-leaving" : ""}`}
      role="status"
    >
      <Image alt="" height={148} priority src="/app-icon.png" width={148} />
      <div>
        <strong>이음새</strong>
        <span>IEUMSAE</span>
      </div>
      <p>흩어진 기록 사이, 나를 발견하다.</p>
    </div>
  );
}
