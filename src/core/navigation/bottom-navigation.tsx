"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { enabledServiceModules } from "@/core/navigation/modules";

type NavigationIconId = (typeof enabledServiceModules)[number]["id"];

function NavigationIcon({ id }: { id: NavigationIconId }) {
  const commonProps = {
    "aria-hidden": true,
    className: "bottom-navigation-icon",
    fill: "none",
    viewBox: "0 0 24 24",
  } as const;

  switch (id) {
    case "home":
      return (
        <svg {...commonProps}>
          <path d="m4.5 10.5 7.5-6 7.5 6v8.25a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75z" />
          <path d="M9.25 19.5v-5.75h5.5v5.75" />
        </svg>
      );
    case "journal":
      return (
        <svg {...commonProps}>
          <path d="M6 4.75h9.5A2.5 2.5 0 0 1 18 7.25v12H8.5A2.5 2.5 0 0 1 6 16.75z" />
          <path d="M6 16.75a2.5 2.5 0 0 1 2.5-2.5H18M9.5 8h5" />
        </svg>
      );
    case "routines":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8.25" />
          <path d="m8.5 12 2.25 2.25 4.75-5" />
        </svg>
      );
    case "payroll":
      return (
        <svg {...commonProps}>
          <path d="M4.75 7.25h13.5A1.75 1.75 0 0 1 20 9v8.25A1.75 1.75 0 0 1 18.25 19H5.75A1.75 1.75 0 0 1 4 17.25V6.75A1.75 1.75 0 0 1 5.75 5h10" />
          <path d="M15.5 12h4.5M16.75 12h.01" />
        </svg>
      );
    case "my-page":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="8" r="3.25" />
          <path d="M5.75 19a6.25 6.25 0 0 1 12.5 0" />
        </svg>
      );
  }
}

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="주요 서비스" className="bottom-navigation">
      {enabledServiceModules.map((module) => {
        const active = pathname === module.href || pathname.startsWith(`${module.href}/`);

        return (
          <Link
            aria-label={module.label}
            aria-current={active ? "page" : undefined}
            className={active ? "bottom-navigation-link active" : "bottom-navigation-link"}
            href={module.href}
            key={module.id}
          >
            <NavigationIcon id={module.id} />
          </Link>
        );
      })}
    </nav>
  );
}
