import Image from "next/image";

export default function AppLoading() {
  return (
    <div aria-label="화면을 불러오는 중" aria-live="polite" className="route-loading brand-route-loading" role="status">
      <Image alt="" height={92} priority src="/app-icon.png" width={92} />
      <strong>이음새</strong>
      <p>흩어진 기록 사이, 나를 발견하다.</p>
      <span aria-hidden="true" className="brand-loading-dot" />
      <span className="sr-only">화면을 불러오고 있어요.</span>
    </div>
  );
}
