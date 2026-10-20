import Link from "next/link";

export default function PublicHomePage() {
  return (
    <main className="public-page public-home">
      <section className="public-hero">
        <p className="eyebrow">IEUMSAE</p>
        <h1>흩어진 기록 사이,<br />나를 발견하다.</h1>
        <p>이음새는 일기, 루틴, 일정과 근무 기록을 연결해 나의 생각과 감정, 행동의 패턴을 발견하도록 돕는 자기 이해·성장 서비스입니다.</p>
        <Link className="public-primary-link" href="/home">이음새 시작하기</Link>
      </section>

      <section aria-labelledby="features-title" className="public-section">
        <p className="eyebrow">WHAT YOU CAN DO</p>
        <h2 id="features-title">하루의 기록이<br />나를 이해하는 단서가 돼요.</h2>
        <div className="public-feature-grid">
          <article><strong>일기</strong><p>오늘의 기분과 경험을 기록하고 흐름을 돌아봅니다.</p></article>
          <article><strong>루틴</strong><p>나에게 맞는 루틴을 만들고 실천과 회고를 이어갑니다.</p></article>
          <article><strong>인사이트</strong><p>기록 사이의 변화와 반복되는 패턴을 AI 피드백으로 확인합니다.</p></article>
          <article><strong>생활 기록</strong><p>근무시간과 예상 급여 등 일상의 중요한 정보를 함께 관리합니다.</p></article>
        </div>
      </section>

      <section aria-labelledby="calendar-title" className="public-section public-calendar-info">
        <p className="eyebrow">GOOGLE CALENDAR</p>
        <h2 id="calendar-title">오늘 일정까지 한곳에서</h2>
        <p>사용자가 직접 연결을 선택하면 기본 캘린더와 일정 정보를 읽어 오늘의 일정을 보여줍니다. 앱에서 사용자가 요청한 경우에만 일정을 추가·수정·삭제하며, 연결은 언제든 해제할 수 있습니다. Google 사용자 데이터는 광고에 사용하거나 판매하지 않습니다.</p>
      </section>

      <footer className="public-footer">
        <div><strong>이음새</strong><span>흩어진 기록 사이, 나를 발견하다.</span></div>
        <nav aria-label="법적 고지">
          <Link href="/privacy">개인정보처리방침</Link>
          <Link href="/terms">서비스 이용약관</Link>
          <Link href="/login">로그인</Link>
        </nav>
      </footer>
    </main>
  );
}
