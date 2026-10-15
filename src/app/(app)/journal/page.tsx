import { verifySession } from "@/core/auth/session";
import { formatShortKoreanDate, getLocalDate } from "@/core/date/local-date";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { ActivityCalendar } from "@/core/ui/activity-calendar";
import { getOrCreateProfile } from "@/core/user/profile-repository";
import { getJournalOverview } from "@/modules/journal/infrastructure/journal-repository";
import { JournalEntryForm } from "@/modules/journal/ui/journal-entry-form";

const moodLabels: Record<number, string> = {
  1: "힘든 날",
  2: "아쉬운 날",
  3: "평온한 날",
  4: "좋은 날",
  5: "아주 좋은 날",
};

type JournalPageProps = { searchParams: Promise<{ date?: string | string[] }> };

export default async function JournalPage({ searchParams }: JournalPageProps) {
  const session = await verifySession();
  const supabase = await createServerSupabaseClient();
  const profile = await getOrCreateProfile(supabase, session.userId);
  const date = getLocalDate(profile.timezone);
  const overview = await getJournalOverview(supabase, date);
  const parameters = await searchParams;
  const requestedDate = typeof parameters.date === "string" ? parameters.date : date;
  const selectedEntry = overview.entries.find((entry) => entry.entry_date === requestedDate) ?? null;

  const greeting = overview.entries.length > 0
    ? "최근의 기록이 이어지고 있어요. 오늘의 마음도 천천히 남겨보세요."
    : "첫 문장은 짧아도 괜찮아요. 오늘 마음에 남은 한 가지부터 적어보세요.";

  return (
    <div className="journal-dashboard">
      <section className="journal-main" aria-labelledby="journal-title">
        <div className="section-heading journal-heading">
          <div>
            <p className="eyebrow page-menu-label">일기</p>
            <h1 id="journal-title">{formatShortKoreanDate(date)}</h1>
          </div>
        </div>

        <div className="journal-focus-card">
          <span>{overview.current ? "오늘의 일기 인사이트" : "오늘의 인사"}</span>
          <strong>{overview.current
            ? "분석 연결 전입니다. n8n 연결 후 저장된 인사이트가 이 자리에서 바로 바뀝니다."
            : greeting}</strong>
          {overview.current ? <small>일기를 수정해도 기존 AI 인사이트는 자동으로 바뀌지 않아요.</small> : null}
        </div>

        <div className="stat-strip" aria-label="일기 통계">
          <article><span>이달 기록</span><strong>{overview.monthlyEntryCount}일</strong></article>
          <article><span>주간 기분</span><strong>{overview.weeklyAverageMood ?? "-"}<small>/5</small></strong></article>
          <article><span>월간 기분</span><strong>{overview.monthlyAverageMood ?? "-"}<small>/5</small></strong></article>
        </div>

        <details className="create-panel journal-editor" open={!overview.current}>
          <summary>{overview.current ? "오늘 일기 보기·수정" : "일기 쓰기"}</summary>
          <JournalEntryForm
            date={date}
            initialEntry={overview.current ? {
              title: overview.current.title,
              body: overview.current.body,
              mood: overview.current.mood,
            } : null}
          />
        </details>
      </section>

      <ActivityCalendar
        hrefForDate={(selectedDate) => `/journal?date=${selectedDate}`}
        month={date.slice(0, 7)}
        selectedDate={requestedDate}
        title="월간 일기"
        values={overview.calendarEntries.map((entry) => ({
          date: entry.entry_date,
          label: entry.mood ? moodLabels[entry.mood] : "기록 완료",
          level: entry.mood ?? 1,
        }))}
      />

      <section className="selected-day-card">
        <div><span>{formatShortKoreanDate(requestedDate)}</span><h2>{selectedEntry?.title || "이날의 기록이 없어요"}</h2>{selectedEntry?.mood ? <strong>{moodLabels[selectedEntry.mood]}</strong> : null}</div>
        {selectedEntry ? <>
          <details className="entry-reading"><summary>오늘의 기록과 기분 보기</summary><p>{selectedEntry.body}</p></details>
          <div className="mini-insight"><strong>일기 인사이트</strong><p>AI 연결 후 이 날짜의 저장된 분석을 보여줍니다.</p></div>
          <details className="create-panel"><summary>일기 수정</summary><JournalEntryForm date={selectedEntry.entry_date} initialEntry={selectedEntry} /><small className="immutable-insight-note">수정해도 기존 AI 인사이트는 변하지 않습니다.</small></details>
        </> : <p>달력에서 기록한 날짜를 선택하면 제목과 인사이트를 볼 수 있어요.</p>}
      </section>
    </div>
  );
}
