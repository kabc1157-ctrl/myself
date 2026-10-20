import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "개인정보처리방침", description: "이음새 개인정보처리방침" };

const sections = [
  { title: "1. 수집하는 개인정보", body: <><p>이음새는 서비스 제공을 위해 다음 정보를 처리할 수 있습니다.</p><ul><li>계정 정보: 이메일 주소, 사용자 식별값</li><li>프로필 설정: 표시 이름, 시간대, 언어 및 주 시작일</li><li>사용자가 입력한 기록: 일기, 기분, 루틴, 회고, 근무지·근무시간·급여 계산 정보</li><li>서비스 이용 정보: 기록 생성·수정 시각, 기능 이용 상태 및 오류 정보</li><li>Google Calendar 연결 정보: 연결 계정 이메일, 캘린더 식별값, 암호화된 OAuth 토큰 및 사용자가 선택한 일정 정보</li></ul></> },
  { title: "2. 개인정보 이용 목적", body: <ul><li>회원 인증, 계정 유지 및 사용자별 데이터 분리</li><li>일기·루틴·근무 기록의 저장, 조회, 수정 및 통계 제공</li><li>기록을 바탕으로 한 일간·월간 AI 인사이트 생성</li><li>Google Calendar 일정 표시와 사용자가 요청한 일정 추가·수정·삭제</li><li>오류 확인, 보안 유지 및 서비스 개선</li></ul> },
  { title: "3. Google 사용자 데이터의 처리", body: <><p>Google Calendar 연결은 선택 사항입니다. 이음새는 사용자가 동의한 경우 기본 캘린더 목록을 확인하고, 오늘의 일정을 표시하며, 사용자가 앱에서 명시적으로 요청한 경우에만 일정을 생성·수정·삭제합니다.</p><p>OAuth 접근 토큰과 갱신 토큰은 암호화하여 저장합니다. Google 사용자 데이터는 광고, 신용평가, 판매 또는 제3자의 독립적인 마케팅 목적으로 사용하지 않습니다. 이음새의 Google API 데이터 이용은 Google API Services User Data Policy와 Limited Use 요건을 준수합니다.</p></> },
  { title: "4. 처리 위탁 및 외부 서비스", body: <><p>서비스 운영 과정에서 다음 외부 서비스를 이용할 수 있습니다.</p><ul><li>Supabase: 회원 인증과 데이터베이스 저장</li><li>Vercel: 웹 애플리케이션 호스팅과 배포</li><li>Google: 사용자가 선택한 Calendar 연동</li><li>n8n 및 OpenAI: 일기·루틴 기록을 기반으로 한 AI 인사이트 생성</li></ul><p>AI 인사이트 생성 시 필요한 범위의 기록만 처리하며, 생성 결과 제공 이외의 목적으로 이용하지 않습니다.</p></> },
  { title: "5. 보유 기간과 파기", body: <p>개인정보는 계정 또는 각 기록이 유지되는 동안 보관하며, 사용자가 기록을 삭제하거나 계정 삭제를 요청하면 관련 법령상 보존 의무가 없는 한 지체 없이 삭제합니다. Google Calendar 연결을 해제하면 저장된 연결 토큰을 삭제합니다. 백업 데이터는 운영상 필요한 제한된 기간 후 순차적으로 삭제될 수 있습니다.</p> },
  { title: "6. 이용자의 권리", body: <p>이용자는 자신의 개인정보와 기록을 조회·수정·삭제할 수 있으며, Google Calendar 연결 동의를 언제든 철회할 수 있습니다. Google 계정의 권한 관리 화면에서도 이음새의 접근 권한을 철회할 수 있습니다. 계정 및 전체 데이터 삭제 요청은 Google OAuth 동의 화면에 표시된 개발자 연락처를 통해 접수할 수 있습니다.</p> },
  { title: "7. 안전성 확보 조치", body: <p>이음새는 전송 구간 암호화, 데이터베이스의 사용자별 접근 통제, OAuth 토큰 암호화, 서버 비밀정보의 분리 보관 등 개인정보 보호를 위한 합리적인 기술적·관리적 조치를 적용합니다.</p> },
  { title: "8. 방침 변경 및 문의", body: <p>본 방침이 변경되면 시행 전에 서비스 화면을 통해 알립니다. 개인정보 보호 관련 문의는 Google OAuth 동의 화면에 등록된 이음새 개발자 연락처로 접수할 수 있습니다.</p> },
];

export default function PrivacyPage() {
  return <main className="public-page legal-page">
    <header className="legal-header"><Link className="public-brand-link" href="/">이음새</Link><p className="eyebrow">PRIVACY POLICY</p><h1>개인정보처리방침</h1><p>시행일: 2026년 10월 21일</p></header>
    <section className="legal-intro">이음새는 이용자의 기록과 개인정보를 소중히 다루며, 필요한 범위 안에서 투명하게 처리합니다.</section>
    <div className="legal-content">{sections.map((section) => <section key={section.title}><h2>{section.title}</h2>{section.body}</section>)}</div>
    <footer className="public-footer"><Link href="/">홈으로</Link><Link href="/terms">서비스 이용약관</Link></footer>
  </main>;
}
