# 생활관리 정적 웹사이트

`myself` 폴더는 생활관리 서비스의 독립형 HTML·CSS·JavaScript 버전입니다. 별도의 빌드 없이 `index.html`을 브라우저에서 열어 화면과 기본 상호작용을 확인할 수 있습니다.

## 파일

- `index.html`: 일기, 루틴, 월급, 마이페이지 화면 구조와 메타 태그
- `style.css`: 반응형 레이아웃, 색상, 카드와 하단 메뉴 디자인
- `app.js`: 메뉴 전환, 루틴 정렬, 알림과 달력 예시 동작
- `assets/opengraph-image.png`: 링크 공유용 메타 이미지
- `assets/favicon-32.png`: 브라우저 파비콘
- `assets/apple-touch-icon.png`: iOS 홈 화면 아이콘
- `assets/app-icon.png`: 앱 아이콘 원본

## 실행

가장 간단한 방법은 `index.html`을 더블클릭해 여는 것입니다. 로컬 서버를 사용하려면 `myself` 폴더에서 다음 명령을 실행합니다.

```bash
python3 -m http.server 8080
```

그다음 `http://localhost:8080`을 엽니다.

## 범위

이 폴더는 전달과 미리보기를 위한 정적 버전입니다. 화면 전환과 예시 정렬은 브라우저에서 동작하지만 로그인, Supabase 저장, 사용자별 데이터 보안, 실제 급여 계산과 n8n AI 분석은 상위 Next.js 프로젝트에서 제공됩니다.
