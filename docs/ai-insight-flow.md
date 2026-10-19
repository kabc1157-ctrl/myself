# n8n 일기·루틴 AI 인사이트 연결

## 동작 방식

- `Asia/Seoul` 기준 매일 23:30에 일기를 확인한다.
- 매일 23:40에 루틴 회고를 확인한다.
- 내용이 있고 `ai_feedback`이 비어 있는 최근 7일 기록만 분석한다.
- AI 결과는 핵심 피드백, 잘한 점, 개선할 점, 내일 행동 한 가지로 구조화해 Supabase에 저장한다.
- 앱은 Supabase에 저장된 결과만 표시한다. 앱 브라우저에서 AI API를 직접 호출하지 않는다.
- 일기나 회고가 없으면 아무 작업도 하지 않는다. 실패해 결과가 저장되지 않은 기록은 다음 실행 때 다시 대상이 된다.

## 준비할 자격 증명

n8n의 **Credentials**에서만 아래 두 개를 만든다. 키를 GitHub, Vercel 또는 브라우저 코드에 넣지 않는다.

1. `Myself OpenAI`: n8n의 OpenAI credential
2. `Myself Supabase service role`: 프로젝트 URL과 `service_role` 키를 사용하는 Supabase credential

`service_role`은 RLS를 우회할 수 있으므로 본인만 접근 가능한 n8n에만 저장한다. Supabase 노드 보안 패치가 포함된 **n8n 2.40.1 이상**을 사용한다.

## 가져오기

1. n8n에서 **Workflows → Import from File**을 연다.
2. `n8n/workflows/daily-journal-insight.json`을 가져온다.
3. `분석 전 일기 조회`, `일기 인사이트 저장` 노드에서 `Myself Supabase service role`을 선택한다.
4. `OpenAI 채팅 모델`에서 `Myself OpenAI`를 선택한다.
5. `Execute workflow`로 테스트한 뒤 Supabase의 `journal_entries.ai_feedback`에 객체가 저장됐는지 확인한다.
6. 같은 방식으로 `n8n/workflows/daily-routine-insight.json`을 가져와 연결하고 테스트한다.
7. 두 워크플로의 timezone이 `Asia/Seoul`인지 확인한 뒤 각각 **Publish/Active**로 전환한다.

## AI 결과 형식

```json
{
  "core_feedback": "오늘의 핵심 피드백",
  "wins": ["잘한 점"],
  "improvements": ["개선할 점"],
  "tomorrow_action": "내일 실천할 행동 한 가지"
}
```

프롬프트는 기록에 없는 사실을 추측하지 않고, 하루 기록만으로 장기 패턴을 단정하지 않도록 제한한다. 버전은 일기 `daily-journal-v1`, 루틴 `daily-routine-v1`로 저장된다.

## 점검 순서

1. 오늘 날짜의 일기 또는 루틴 회고를 작성한다.
2. 해당 워크플로에서 수동 실행한다.
3. Supabase Table Editor에서 `ai_feedback`, `analyzed_at`, `ai_prompt_version`이 채워졌는지 확인한다.
4. 앱을 새로 열어 네 항목이 카드에 표시되는지 확인한다.
5. n8n의 Executions에서 실패가 없는지 확인한 뒤 예약 실행을 활성화한다.
