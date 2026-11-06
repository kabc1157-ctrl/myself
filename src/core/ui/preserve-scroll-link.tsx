"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

export function PreserveScrollLink({ href, children, className, ariaLabel, role, title }: { href: string; children: ReactNode; className?: string; ariaLabel?: string; role?: string; title?: string }) {
  const router = useRouter();
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const scrollY = window.scrollY;
    router.push(href, { scroll: false });
    window.requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: "auto" }));
    window.setTimeout(() => window.scrollTo({ top: scrollY, behavior: "auto" }), 80);
  };

  return <Link aria-label={ariaLabel} className={className} href={href} onClick={handleClick} role={role} scroll={false} title={title}>{children}</Link>;
}
