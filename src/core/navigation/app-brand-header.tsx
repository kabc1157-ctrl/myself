import Image from "next/image";
import Link from "next/link";

export function AppBrandHeader() {
  return (
    <header className="app-brand-header">
      <Link aria-label="이음새 홈" className="app-brand-lockup" href="/home">
        <Image alt="" height={44} priority src="/app-icon.png" width={44} />
        <span><strong>이음새</strong><small>IEUMSAE</small></span>
      </Link>
      <Link className="discoveries-link" href="/discoveries">나의 발견</Link>
    </header>
  );
}
