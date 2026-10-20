# n8n에서 Myself Notion 아카이브 연결하기

## 1. n8n 자격 증명

Header Auth 자격 증명을 만들고 다음 값을 저장합니다.

- 이름: `Myself Notion Archive API`
- Header Name: `Authorization`
- Header Value: `Bearer <Vercel의 N8N_INTEGRATION_SECRET과 같은 값>`

## 2. 인사이트 저장 노드 다음에 HTTP Request 추가

- Method: `POST`
- URL: `https://myself1015.vercel.app/api/integrations/notion/archive`
- Authentication: 위 Header Auth 자격 증명
- Send Body: JSON

일기 본문:

```json
{
  "user_id": "={{ $('최근 7일 미분석 기록만').item.json.user_id }}",
  "category": "journal",
  "source_key": "={{ 'journal:' + $('최근 7일 미분석 기록만').item.json.id }}",
  "title": "={{ $('최근 7일 미분석 기록만').item.json.title || '일기' }}",
  "date": "={{ $('최근 7일 미분석 기록만').item.json.entry_date }}",
  "content": "={{ JSON.stringify($json.output) }}"
}
```

루틴 본문:

```json
{
  "user_id": "={{ $('모든 미분석 루틴 회고 선별').item.json.user_id }}",
  "category": "routine",
  "source_key": "={{ 'routine:' + $('모든 미분석 루틴 회고 선별').item.json.id }}",
  "title": "루틴 회고",
  "date": "={{ $('모든 미분석 루틴 회고 선별').item.json.review_date }}",
  "content": "={{ JSON.stringify($json.output) }}"
}
```

API는 같은 `user_id + source_key`가 이미 저장된 경우 Notion 페이지를 다시 만들지 않습니다.

## 3. 기존 JSON 점검 결과

1. `daily-journal-insight.json`: 최근 7일만 처리하므로 8일 이상 지난 미분석 일기는 누락됩니다.
2. `daily-journal-insight.json`: 230~250자 검증 노드가 없습니다.
3. `daily-routine-insight.json`: 이전 v1 프롬프트이며 230~250자 검증 노드가 없습니다.
4. `Myself-매일-루틴-회고-AI-인사이트-final.json`: 분량 검증 실패 시 자동 재생성 분기가 없어 실행이 실패한 채 끝납니다.
5. 모든 기존 JSON: Supabase 저장 필터가 `id`만 확인합니다. `user_id` 조건도 함께 넣는 편이 안전합니다.
6. 모든 기존 JSON: 오류 내용을 `analysis_error`에 기록하는 오류 분기가 없습니다.
7. 월간 일기·루틴 인사이트와 미작성 알림 워크플로는 이 폴더에 아직 없습니다.
8. OpenAI·Supabase 자격 증명 ID는 가져온 뒤 n8n에서 실제 자격 증명으로 선택해야 합니다.
