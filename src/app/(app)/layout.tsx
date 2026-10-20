import type { ReactNode } from "react";

import { verifySession } from "@/core/auth/session";
import { BottomNavigation } from "@/core/navigation/bottom-navigation";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  const session = await verifySession();

  return (
    <div className="platform-shell">
      <main className="platform-content">{children}</main>
      <footer aria-label="계정 정보" className="platform-footer">
        <div>
          <p className="brand">이음새</p>
          <p className="user-label">{session.email ?? "내 계정"}</p>
        </div>
      </footer>
      <BottomNavigation />
    </div>
  );
}
