import { verifySession } from "@/core/auth/session";
import { formatShortKoreanDate, getLocalDate, isMonth } from "@/core/date/local-date";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { ActivityCalendar } from "@/core/ui/activity-calendar";
import { AiInsight } from "@/core/ui/ai-insight";
import { PersistentDetails } from "@/core/ui/persistent-details";
import { getOrCreateProfile } from "@/core/user/profile-repository";
import { getJournalOverview } from "@/modules/journal/infrastructure/journal-repository";
import { JournalEntryForm } from "@/modules/journal/ui/journal-entry-form";

const moodLabels: Record<number, string> = {
  1: "😣",
  2: "😕",
  3: "😌",
  4: "🙂",
  5: "😄",
};

type JournalPageProps = { searchParams: Promise<{ date?: string | string[]; month?: string | string[] }> };

export default async function JournalPage({ searchParams }: JournalPageProps) {
  const [session, supabase, parameters] = await Promise.all([
    verifySession(),
    createServerSupabaseClient(),
    searchParams,
  ]);
  const profile = await getOrCreateProfile(supabase, session.userId);
  const date = getLocalDate(profile.timezone);
  const overview = await getJournalOverview(supabase, date);
  const requestedDateValue = typeof parameters.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parameters.date) ? parameters.date : null;
  const requestedMonthValue = typeof parameters.month === "string" && isMonth(parameters.month) ? parameters.month : null;
  const calendarMonth = requestedMonthValue ?? requestedDateValue?.slice(0, 7) ?? date.slice(0, 7);
  const requestedDate = requestedDateValue?.startsWith(calendarMonth)
    ? requestedDateValue
    : calendarMonth === date.slice(0, 7) ? date : `${calendarMonth}-01`;
  const selectedEntry = overview.entries.find((entry) => entry.entry_date === requestedDate) ?? null;
  const calendarEntries = overview.entries.filter((entry) => entry.entry_date.startsWith(`${calendarMonth}-`));

  const greeting = "첫 문장은 짧아도 괜찮아요.\n지금 떠오르는 한 가지부터 적어보세요.";

  return (
    <div className="journal-dashboard">
      <section className="journal-main" aria-labelledby="journal-title">
        <div className="section-heading journal-heading">
          <div>
            <p className="eyebrow page-menu-label">일기</p>
            <h1 id="journal-title">일기 쓰기</h1>
          </div>
        </div>

        <div className="stat-strip" aria-label="일기 통계">
          <article><span>이달 기록</span><strong>{overview.monthlyEntryCount}일</strong></article>
          <article><span>주간 기분</span><strong>{overview.weeklyAverageMood ?? "-"}<small>/5</small></strong></article>
          <article><span>월간 기분</span><strong>{overview.monthlyAverageMood ?? "-"}<small>/5</small></strong></article>
        </div>

        <div className="journal-focus-card">
          <span>{overview.current ? "오늘의 일기 인사이트" : "오늘의 인사"}</span>
          {overview.current
            ? <AiInsight value={overview.current.ai_feedback} pendingMessage="오늘 23:30에 AI가 일기를 확인한 뒤 인사이트를 작성해요." />
            : <strong>{greeting}</strong>}
          {overview.current ? <small>일기를 수정해도 기존 AI 인사이트는 자동으로 바뀌지 않아요.</small> : null}
        </div>

        <PersistentDetails className="create-panel journal-editor" defaultOpen={!overview.current} storageKey="journal-today-editor">
          <summary>{overview.current ? "일기 수정" : "일기 쓰기"}</summary>
          <JournalEntryForm
            date={date}
            initialEntry={overview.current ? {
              title: overview.current.title,
              body: overview.current.body,
              mood: overview.current.mood,
            } : null}
          />
        </PersistentDetails>
      </section>

      <ActivityCalendar
        hrefForDate={(selectedDate) => `/journal?month=${calendarMonth}&date=${selectedDate}`}
        hrefForMonth={(selectedMonth) => `/journal?month=${selectedMonth}`}
        month={calendarMonth}
        selectedDate={requestedDate}
        title="월간 일기"
        weekStartsOn={profile.week_starts_on}
        values={calendarEntries.map((entry) => ({
          date: entry.entry_date,
          label: entry.mood ? moodLabels[entry.mood] : "기록 완료",
          level: entry.mood ?? 1,
        }))}
      />

      <section className="selected-day-card">
        <div><span>{formatShortKoreanDate(requestedDate)}</span><h2>{selectedEntry?.title || "이날의 기록이 없어요"}</h2>{selectedEntry?.mood ? <strong>{moodLabels[selectedEntry.mood]}</strong> : null}</div>
        {selectedEntry ? <>
          <PersistentDetails className="entry-reading" storageKey={`journal-reading-${selectedEntry.id}`}><summary>오늘의 기록과 기분 보기</summary><p>{selectedEntry.body}</p></PersistentDetails>
          <PersistentDetails className="create-panel" storageKey={`journal-edit-${selectedEntry.id}`}><summary>일기 수정</summary><JournalEntryForm date={selectedEntry.entry_date} initialEntry={selectedEntry} /><small className="immutable-insight-note">수정해도 기존 AI 인사이트는 변하지 않습니다.</small></PersistentDetails>
        </> : <p>달력에서 기록한 날짜를 선택하면 제목과 인사이트를 볼 수 있어요.</p>}
        <div className="mini-insight"><strong>AI 인사이트</strong><AiInsight value={selectedEntry?.ai_feedback ?? null} pendingMessage="아직 이 날짜의 AI 인사이트가 없어요." /></div>
      </section>
    </div>
  );
}
