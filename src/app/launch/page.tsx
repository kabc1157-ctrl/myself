"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LaunchPage() {
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/home");

    const launchSeenKey = "ieumsae-launch-seen";
    let seen = false;
    try {
      seen = window.localStorage.getItem(launchSeenKey) === "1";
      window.localStorage.setItem(launchSeenKey, "1");
    } catch {
      // Storage can be unavailable in private browsing; navigation still works.
    }

    let cancelled = false;
    const navigateWhenReady = async () => {
      if (!seen) {
        await new Promise((resolve) => window.setTimeout(resolve, 620));
      }

      // Keep the launch screen visible while the authenticated home response
      // is rendered, instead of replacing it before the slow server work ends.
      try {
        await fetch("/home", { cache: "no-store", credentials: "include" });
      } catch {
        // Navigation below remains the fallback if the warm-up request fails.
      }

      if (!cancelled) router.replace("/home");
    };

    void navigateWhenReady();
    return () => { cancelled = true; };
  }, [router]);

  return (
    <main aria-label="이음새를 불러오는 중" aria-live="polite" className="app-launch-splash" role="status">
      <Image alt="" height={148} priority src="/app-icon.png" width={148} />
      <div>
        <strong>이음새</strong>
        <span>IEUMSAE</span>
      </div>
      <p>흩어진 기록 사이, 나를 발견하다.</p>
    </main>
  );
}
