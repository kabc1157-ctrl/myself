import type { ReactNode } from "react";
import { Suspense } from "react";

import { AccountFooter } from "@/core/auth/account-footer";
import { BottomNavigation } from "@/core/navigation/bottom-navigation";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="platform-shell">
      <main className="platform-content">{children}</main>
      <Suspense fallback={<AccountFooterFallback />}>
        <AccountFooter />
      </Suspense>
      <BottomNavigation />
    </div>
  );
}

function AccountFooterFallback() {
  return (
    <footer aria-label="계정 정보" className="platform-footer">
      <div><p className="brand">이음새</p></div>
    </footer>
  );
}
