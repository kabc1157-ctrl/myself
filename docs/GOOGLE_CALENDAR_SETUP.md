# Google Calendar 연결 설정

웹앱은 사용자의 기본 Google Calendar에서 오늘 일정을 **읽기 전용**으로 가져옵니다.

## 1. Google Cloud 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트를 생성하거나 선택합니다.
2. **API 및 서비스 → 라이브러리**에서 `Google Calendar API`를 사용 설정합니다.
3. **Google Auth Platform → 브랜딩**에서 앱 이름과 연락처를 입력합니다.
4. **대상**에서 테스트 중에는 `External`을 선택하고 사용할 Google 계정을 테스트 사용자로 추가합니다.
5. **데이터 액세스**에 아래 범위를 추가합니다.
   - `https://www.googleapis.com/auth/calendar.events.readonly`
   - `https://www.googleapis.com/auth/calendar.calendars.readonly`
6. **클라이언트 → 클라이언트 만들기 → 웹 애플리케이션**을 선택합니다.
7. 승인된 리디렉션 URI에 다음 주소를 등록합니다.
   - 운영: `https://myself1015.vercel.app/api/integrations/google-calendar/callback`
   - 로컬: `http://localhost:3000/api/integrations/google-calendar/callback`

## 2. Vercel 환경 변수

Vercel 프로젝트의 **Settings → Environment Variables**에 아래 값을 추가합니다.

```text
GOOGLE_CALENDAR_CLIENT_ID=Google에서 발급한 클라이언트 ID
GOOGLE_CALENDAR_CLIENT_SECRET=Google에서 발급한 클라이언트 보안 비밀번호
GOOGLE_CALENDAR_REDIRECT_URI=https://myself1015.vercel.app/api/integrations/google-calendar/callback
INTEGRATION_TOKEN_ENCRYPTION_KEY=32자 이상의 임의 문자열
SUPABASE_SECRET_KEY=Supabase의 secret 키
```

환경 변수를 저장한 뒤 Production을 다시 배포합니다.

## 3. 앱에서 확인

1. 마이페이지의 **Google Calendar → 오늘 일정 연결**을 엽니다.
2. **Google Calendar 연결**을 누릅니다.
3. Google 권한 화면에서 캘린더 읽기를 허용합니다.
4. 연결 후 버튼이 **다른 계정으로 다시 연결**과 **연결 해제**로 바뀌는지 확인합니다.
5. 홈의 **오늘의 생활** 아래에서 오늘 일정을 확인합니다.

연결 토큰은 서버에서 암호화해 저장하며 브라우저로 전달하지 않습니다.
