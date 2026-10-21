import { verifySession } from "@/core/auth/session";

export async function AccountFooter() {
  const session = await verifySession();

  return (
    <footer aria-label="계정 정보" className="platform-footer">
      <div>
        <p className="brand">이음새</p>
        <p className="user-label">{session.email ?? "내 계정"}</p>
      </div>
    </footer>
  );
}
