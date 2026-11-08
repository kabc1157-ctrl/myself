// IEUMSAE 오늘의 루틴 Scriptable 위젯
// 최초 1회: 이음새에 로그인한 상태에서 /my-page의 위젯 토큰 발급 API를
// 호출해 받은 토큰을 아래 Keychain 키에 저장하세요. 토큰은 URL에 넣지 않습니다.
const API_URL = "https://ieumsae.yamaelab.com/api/widgets/routines";
const APP_URL = "https://ieumsae.yamaelab.com/routines";
const KEYCHAIN_KEY = "ieumsae-routine-widget-token";

const widget = new ListWidget();
widget.backgroundColor = new Color("#F7F0E6");
widget.setPadding(14, 16, 14, 16);
const title = widget.addText("오늘의 루틴");
title.font = Font.boldSystemFont(17);
title.textColor = new Color("#58698F");
widget.addSpacer(4);

let payload;
try {
  const token = Keychain.get(KEYCHAIN_KEY);
  const request = new Request(API_URL);
  request.headers = { Authorization: `Bearer ${token}` };
  payload = await request.loadJSON();
} catch (_) {
  payload = { error: "위젯을 새로고침할 수 없어요." };
}

if (payload.error) {
  const error = widget.addText(payload.error);
  error.font = Font.systemFont(12);
  error.textColor = new Color("#77736D");
  widget.url = APP_URL;
} else if (payload.totalCount === 0 || payload.routines.length === 0) {
  const done = widget.addText("오늘 예정된 루틴이 없어요.");
  done.font = Font.systemFont(13);
  done.textColor = new Color("#77736D");
  widget.url = APP_URL;
} else {
  const progress = widget.addText(`${payload.completedCount}/${payload.totalCount} 완료 · ${payload.completionRate}%`);
  progress.font = Font.semiboldSystemFont(12);
  progress.textColor = new Color("#77736D");
  widget.addSpacer(5);
  for (const routine of payload.routines.slice(0, 4)) {
    const row = widget.addText(`○  ${routine.name}`);
    row.font = Font.systemFont(13);
    row.textColor = new Color("#58698F");
    row.lineLimit = 1;
  }
  if (payload.routines.length > 4) {
    const more = widget.addText(`외 ${payload.routines.length - 4}개`);
    more.font = Font.systemFont(11);
    more.textColor = new Color("#77736D");
  }
  // Scriptable 위젯은 항목별 버튼을 지원하지 않으므로 첫 미완료 루틴을
  // 선택한 이음새 화면으로 열어 기존 완료 액션을 사용합니다.
  widget.url = `${APP_URL}?routine=${encodeURIComponent(payload.routines[0].id)}&date=${payload.date}`;
}

widget.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);
Script.setWidget(widget);
Script.complete();
