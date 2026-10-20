import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "서비스 이용약관", description: "이음새 서비스 이용약관" };

export default function TermsPage() {
  return <main className="public-page legal-page">
    <header className="legal-header"><Link className="public-brand-link" href="/">이음새</Link><p className="eyebrow">TERMS OF SERVICE</p><h1>서비스 이용약관</h1><p>시행일: 2026년 10월 21일</p></header>
    <section className="legal-intro">본 약관은 이음새가 제공하는 기록·루틴·일정·AI 인사이트 서비스의 이용 조건을 정합니다.</section>
    <div className="legal-content">
      <section><h2>1. 서비스의 목적</h2><p>이음새는 이용자가 일상의 기록을 모으고 연결하여 자신의 패턴과 변화를 이해하도록 돕는 자기 관리 서비스입니다.</p></section>
      <section><h2>2. 계정과 이용 책임</h2><p>이용자는 정확한 정보로 자신의 계정을 관리하고 인증정보가 타인에게 노출되지 않도록 보호해야 합니다. 계정에서 발생한 비정상적인 활동을 발견하면 즉시 연결 권한을 해제하고 운영자에게 알려야 합니다.</p></section>
      <section><h2>3. 제공 기능</h2><ul><li>일기, 기분 및 루틴 기록</li><li>근무시간과 예상 급여 관리</li><li>기록을 기반으로 한 AI 인사이트</li><li>선택적 Google Calendar 일정 조회·생성·수정·삭제</li></ul><p>서비스 기능은 품질 개선이나 운영상 필요에 따라 변경될 수 있으며 중요한 변경은 가능한 범위에서 사전에 안내합니다.</p></section>
      <section><h2>4. Google Calendar 연동</h2><p>Google Calendar 연동은 이용자의 선택에 따라 제공됩니다. 이용자가 권한을 승인한 범위에서만 데이터를 처리하며, 일정의 생성·수정·삭제는 이용자가 해당 동작을 요청한 경우에만 수행합니다. 연동은 마이페이지 또는 Google 계정 권한 관리에서 언제든 해제할 수 있습니다.</p></section>
      <section><h2>5. AI 인사이트</h2><p>AI가 제공하는 인사이트는 자기 성찰을 돕는 참고 정보이며 의료·심리·법률·재무 등 전문적인 진단이나 조언을 대신하지 않습니다. 중요한 결정은 이용자의 판단과 필요한 경우 전문가의 조언을 바탕으로 내려야 합니다.</p></section>
      <section><h2>6. 금지 행위</h2><ul><li>타인의 계정이나 개인정보를 무단으로 이용하는 행위</li><li>서비스의 정상 운영을 방해하거나 보안을 침해하는 행위</li><li>관련 법령 또는 타인의 권리를 침해하는 내용을 저장하는 행위</li><li>서비스를 허가 없이 복제, 역설계 또는 상업적으로 재판매하는 행위</li></ul></section>
      <section><h2>7. 데이터와 이용자의 권리</h2><p>이용자가 입력한 기록의 권리는 이용자에게 있습니다. 이음새는 서비스 제공에 필요한 범위에서만 해당 데이터를 처리합니다. 개인정보의 처리와 삭제에 관한 자세한 내용은 개인정보처리방침에서 확인할 수 있습니다.</p></section>
      <section><h2>8. 서비스 중단 및 책임</h2><p>점검, 외부 서비스 장애, 천재지변 등 불가피한 사유로 서비스가 일시 중단될 수 있습니다. 이음새는 안정적인 운영을 위해 노력하지만 서비스가 항상 중단 없이 제공되거나 모든 기록과 AI 결과가 완전히 정확함을 보증하지 않습니다.</p></section>
      <section><h2>9. 약관 변경과 문의</h2><p>본 약관이 변경되면 시행 전에 서비스 화면을 통해 알립니다. 서비스 이용 및 계정 삭제 관련 문의는 Google OAuth 동의 화면에 등록된 이음새 개발자 연락처로 접수할 수 있습니다.</p></section>
    </div>
    <footer className="public-footer"><Link href="/">홈으로</Link><Link href="/privacy">개인정보처리방침</Link></footer>
  </main>;
}
