import Link from "next/link";

export default function PublicHomePage() {
  return (
    <main className="public-page public-home">
      <header className="public-nav">
        <Link className="public-logo" href="/" aria-label="이음새 홈">
          <strong>이음새</strong>
          <span>IEUMSAE</span>
        </Link>
        <nav aria-label="시작 메뉴">
          <Link href="/login">로그인</Link>
          <Link className="public-nav-cta" href="/home">시작하기</Link>
        </nav>
      </header>

      <section className="public-hero">
        <div className="public-hero-copy">
          <p className="eyebrow">RECORD · CONNECT · DISCOVER</p>
          <h1>흩어진 기록 사이,<br />나를 발견하다.</h1>
          <p>일기, 루틴, 일정과 생활 기록을 한곳에 이어보세요. 매일의 작은 기록이 쌓여 생각과 감정, 행동의 패턴을 보여줍니다.</p>
          <div className="public-hero-actions">
            <Link className="public-primary-link" href="/home">이음새 시작하기</Link>
            <Link className="public-secondary-link" href="/login">이미 계정이 있어요</Link>
          </div>
        </div>
        <div aria-label="이음새 기록 흐름" className="public-hero-visual">
          <p>오늘의 기록이</p>
          <div className="public-record-chips">
            <span>일기</span><span>루틴</span><span>일정</span><span>생활</span>
          </div>
          <strong>나를 이해하는<br />하나의 흐름이 돼요.</strong>
          <div className="public-insight-line"><i />기록 속 반복과 변화를 발견해요</div>
        </div>
      </section>

      <section aria-labelledby="features-title" className="public-section">
        <div className="public-section-heading">
          <p className="eyebrow">WHAT YOU CAN DO</p>
          <h2 id="features-title">하루의 기록이<br />나를 이해하는 단서가 돼요.</h2>
          <p>기록은 따로 남겨도, 이음새 안에서는 하나의 이야기로 이어집니다.</p>
        </div>
        <div className="public-feature-grid">
          <article><span>01</span><strong>일기</strong><p>오늘의 기분과 경험을 기록하고 나의 흐름을 돌아봅니다.</p></article>
          <article><span>02</span><strong>루틴</strong><p>나에게 맞는 루틴을 만들고 실천과 회고를 이어갑니다.</p></article>
          <article><span>03</span><strong>생활 기록</strong><p>일정과 근무 등 일상의 중요한 정보를 한곳에서 관리합니다.</p></article>
          <article><span>04</span><strong>AI 인사이트</strong><p>기록 사이의 변화와 반복되는 패턴을 이해하기 쉽게 확인합니다.</p></article>
        </div>
      </section>

      <section aria-labelledby="calendar-title" className="public-section public-calendar-info">
        <div>
          <p className="eyebrow">CONNECTED DAY</p>
          <h2 id="calendar-title">기록과 오늘의 일정을<br />자연스럽게 연결해요.</h2>
        </div>
        <p>사용자가 직접 연결한 일정만 안전하게 불러옵니다. 필요한 경우에만 일정을 추가·수정하고, 연결은 언제든 해제할 수 있어요.</p>
      </section>

      <section className="public-closing">
        <div><p className="eyebrow">START YOUR STORY</p><h2>오늘의 나를 기록하는 일,<br />지금 가볍게 시작해보세요.</h2></div>
        <Link className="public-primary-link" href="/home">이음새 시작하기</Link>
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
