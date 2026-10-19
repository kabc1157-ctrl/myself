export default function AppLoading() {
  return (
    <div aria-label="화면을 불러오는 중" aria-live="polite" className="route-loading">
      <div className="loading-line" />
      <div className="loading-card" />
      <div className="loading-card short" />
      <span className="sr-only">화면을 불러오고 있어요.</span>
    </div>
  );
}
