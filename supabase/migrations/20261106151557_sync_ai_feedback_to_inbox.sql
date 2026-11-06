-- Keep ai_insights as a derived inbox. Source records remain the system of record.
create or replace function public.sync_source_ai_insight()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  source_category text;
  source_date date;
  source_title text;
  source_key text;
  feedback jsonb;
  row_json jsonb := to_jsonb(new);
begin
  feedback := row_json -> 'ai_feedback';
  if feedback is null or jsonb_typeof(feedback) <> 'object' then
    return new;
  end if;

  case tg_table_name
    when 'journal_entries' then
      source_category := 'journal';
      source_date := (row_json ->> 'entry_date')::date;
      source_title := '일기 인사이트';
    when 'routine_daily_reviews' then
      source_category := 'routine';
      source_date := (row_json ->> 'review_date')::date;
      source_title := '루틴 인사이트';
    when 'notes' then
      source_category := 'note';
      source_date := (row_json ->> 'updated_at')::timestamptz::date;
      source_title := '메모 인사이트';
    when 'exercise_logs' then
      source_category := 'exercise';
      source_date := (row_json ->> 'exercise_date')::date;
      source_title := '운동 인사이트';
    when 'planner_daily_reviews' then
      source_category := 'planner';
      source_date := (row_json ->> 'review_date')::date;
      source_title := '일정 인사이트';
    when 'reading_logs' then
      source_category := 'reading';
      source_date := (row_json ->> 'reading_date')::date;
      source_title := '독서 인사이트';
    when 'investment_trades' then
      source_category := 'investment';
      source_date := (row_json ->> 'trade_date')::date;
      source_title := '투자 인사이트';
    else
      return new;
  end case;

  source_key := tg_table_name || ':' || (row_json ->> 'id');

  insert into public.ai_insights (
    user_id, category, scope, source_key, source_date, title, content, updated_at
  ) values (
    (row_json ->> 'user_id')::uuid,
    source_category,
    'daily',
    source_key,
    source_date,
    source_title,
    feedback,
    now()
  )
  on conflict (user_id, source_key) do update
    set category = excluded.category,
        source_date = excluded.source_date,
        title = excluded.title,
        content = excluded.content,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists journal_entries_sync_ai_insight on public.journal_entries;
drop trigger if exists routine_daily_reviews_sync_ai_insight on public.routine_daily_reviews;

create trigger journal_entries_sync_ai_insight
after insert or update of ai_feedback on public.journal_entries
for each row execute function public.sync_source_ai_insight();

create trigger routine_daily_reviews_sync_ai_insight
after insert or update of ai_feedback on public.routine_daily_reviews
for each row execute function public.sync_source_ai_insight();

create trigger notes_sync_ai_insight
after insert or update of ai_feedback on public.notes
for each row execute function public.sync_source_ai_insight();

create trigger exercise_logs_sync_ai_insight
after insert or update of ai_feedback on public.exercise_logs
for each row execute function public.sync_source_ai_insight();

create trigger planner_daily_reviews_sync_ai_insight
after insert or update of ai_feedback on public.planner_daily_reviews
for each row execute function public.sync_source_ai_insight();

create trigger reading_logs_sync_ai_insight
after insert or update of ai_feedback on public.reading_logs
for each row execute function public.sync_source_ai_insight();

create trigger investment_trades_sync_ai_insight
after insert or update of ai_feedback on public.investment_trades
for each row execute function public.sync_source_ai_insight();

insert into public.ai_insights (user_id, category, scope, source_key, source_date, title, content)
select user_id, 'journal', 'daily', 'journal_entries:' || id::text, entry_date, '일기 인사이트', ai_feedback
from public.journal_entries
where ai_feedback is not null
on conflict (user_id, source_key) do nothing;

insert into public.ai_insights (user_id, category, scope, source_key, source_date, title, content)
select user_id, 'routine', 'daily', 'routine_daily_reviews:' || id::text, review_date, '루틴 인사이트', ai_feedback
from public.routine_daily_reviews
where ai_feedback is not null
on conflict (user_id, source_key) do nothing;

insert into public.ai_insights (user_id, category, scope, source_key, source_date, title, content)
select user_id, 'note', 'daily', 'notes:' || id::text, updated_at::date, '메모 인사이트', ai_feedback
from public.notes
where ai_feedback is not null
on conflict (user_id, source_key) do nothing;

insert into public.ai_insights (user_id, category, scope, source_key, source_date, title, content)
select user_id, 'exercise', 'daily', 'exercise_logs:' || id::text, exercise_date, '운동 인사이트', ai_feedback
from public.exercise_logs
where ai_feedback is not null
on conflict (user_id, source_key) do nothing;

insert into public.ai_insights (user_id, category, scope, source_key, source_date, title, content)
select user_id, 'planner', 'daily', 'planner_daily_reviews:' || id::text, review_date, '일정 인사이트', ai_feedback
from public.planner_daily_reviews
where ai_feedback is not null
on conflict (user_id, source_key) do nothing;

insert into public.ai_insights (user_id, category, scope, source_key, source_date, title, content)
select user_id, 'reading', 'daily', 'reading_logs:' || id::text, reading_date, '독서 인사이트', ai_feedback
from public.reading_logs
where ai_feedback is not null
on conflict (user_id, source_key) do nothing;

insert into public.ai_insights (user_id, category, scope, source_key, source_date, title, content)
select user_id, 'investment', 'daily', 'investment_trades:' || id::text, trade_date, '투자 인사이트', ai_feedback
from public.investment_trades
where ai_feedback is not null
on conflict (user_id, source_key) do nothing;
