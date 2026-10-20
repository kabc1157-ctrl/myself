# 이음새 | IEUMSAE

> 흩어진 기록 사이, 나를 발견하다.

이음새는 일기, 루틴, 일정과 근무 기록을 연결해 나의 생각·감정·행동 패턴과 변화를 발견하도록 돕는 자기 이해·성장 웹 앱입니다. 따뜻하고 간결한 모바일 UI를 중심으로 설계했으며, 현재 메뉴는 `홈 / 일기 / 루틴 / 월급 / 마이페이지`입니다.

## 주요 기능

### 일기

- 오늘의 일기 작성과 기존 기록 수정
- 주간·월간 평균 기분과 월간 작성 통계
- 월간 달력에서 날짜별 기록, 기분, 저장된 인사이트 확인
- 회고 저장 후 n8n AI 분석을 연결할 수 있는 서비스 경계

### 루틴

- 시작일·종료일, 실행 요일, 정확한 시간 또는 오전·오후·저녁 시간대 설정
- 오늘의 루틴 체크와 일·주·월 달성률
- 시간·시간대순, 이름순, 미완료순 정렬
- 전체 또는 개별 루틴의 월간 달성 달력
- 날짜별 완료 상태 수정, 루틴 보관·복구·삭제
- 하루 회고와 AI 인사이트 표시 영역

### 월급

- 근무지별 시급·일급·건별·상여 설정
- 기본 근무시간, 휴게시간, 급여일 저장
- 달력 날짜 선택을 통한 빠른 근무 등록과 수정
- 선택한 요일을 한 달 전체에 일괄 등록
- 월간 근무시간과 근무지별·전체 예상 급여 계산

### 계정과 설정

- 이메일·비밀번호 회원가입과 로그인
- 사용자별 데이터 분리 및 PostgreSQL RLS
- 표시 이름, 주 시작일과 개인 설정
- iOS·Android 홈 화면 설치 안내와 PWA 매니페스트

## 화면 기술

브라우저 화면은 시맨틱 HTML, 프로젝트 CSS, JavaScript로 동작합니다. 소스는 Next.js App Router와 React/TypeScript로 구성되며 빌드 시 브라우저용 HTML·CSS·JavaScript로 제공됩니다. 인증과 데이터 변경은 서버 액션으로 처리해 비밀 키가 클라이언트에 노출되지 않도록 설계했습니다.

## 기술 구성

- Next.js 16, React 19, TypeScript
- HTML5, CSS3, JavaScript
- Supabase Auth, PostgreSQL, Row Level Security
- Vitest, Testing Library, ESLint
- PWA 매니페스트와 반응형 모바일 UI

## 로컬 실행

Node.js 24 이상과 Docker Desktop이 필요합니다.

```bash
npm install
npm run db:start
```

`npm run db:start` 출력의 `API_URL`과 `PUBLISHABLE_KEY`를 `.env.local`에 설정합니다.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local-publishable-key>
# 배포 시 Open Graph 이미지의 절대 URL 생성에 사용
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# 선택: 이 이메일만 회원가입·로그인할 수 있도록 제한
APP_OWNER_EMAIL=me@example.com
```

앱을 시작합니다.

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

## 검증

```bash
npm run lint
npm run typecheck
npm test
npm run test:db
npm run db:advisors
npm run build
```

DB 테스트는 프로필, 루틴, 일정 버전, 완료 기록, 하루 회고, 일기, 근무지와 근무 기록의 RLS 허용·차단 규칙을 검증합니다.

## 구조

- `src/core`: 인증, DB, 사용자 설정, 날짜, 공통 메뉴
- `src/modules/routines`: 루틴 도메인, 유스케이스, DB 접근, UI
- `src/modules/journal`: 일기 입력, 통계, 최근 기록
- `src/modules/payroll`: 급여 계산, 근무지와 근무 기록
- `src/modules/settings`: 개인 설정
- `supabase/migrations`: 재현 가능한 DB 스키마와 RLS
- `supabase/tests`: pgTAP 기반 RLS 테스트

## 브랜드 이미지

- `public/opengraph-image.png`: 링크 공유용 1200×630 메타 이미지
- `public/favicon-32.png`: 브라우저 탭 파비콘
- `public/apple-touch-icon.png`: iOS 홈 화면 아이콘
- `public/icon-192.png`, `public/app-icon.png`: PWA 앱 아이콘

메타 이미지와 아이콘은 `src/app/layout.tsx` 및 `src/app/manifest.ts`에서 연결됩니다.

## 현재 연동 상태

Notion 아카이브와 n8n AI 분석은 아직 활성화하지 않았습니다. 다음 연동 단계에서 자격 증명과 대상 데이터베이스를 연결한 뒤 `src/integrations`의 어댑터로 추가하며, 일기·루틴 도메인에서는 외부 서비스를 직접 호출하지 않습니다.
