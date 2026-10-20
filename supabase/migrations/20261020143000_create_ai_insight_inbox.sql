create table public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('journal', 'routine')),
  scope text not null check (scope in ('daily', 'weekly', 'monthly')),
  source_key text not null,
  source_date date not null,
  title text not null,
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source_key)
);

alter table public.ai_insights enable row level security;

create policy "Users can read their own AI insights"
on public.ai_insights for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can mark their own AI insights as read"
on public.ai_insights for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, update on public.ai_insights to authenticated;

create index ai_insights_unread_user_created_idx
on public.ai_insights (user_id, created_at desc)
where read_at is null;

create or replace function public.sync_daily_ai_insight()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  insight_category text;
  insight_date date;
  insight_title text;
  insight_source_key text;
begin
  if new.ai_feedback is null then
    return new;
  end if;

  if tg_table_name = 'journal_entries' then
    insight_category := 'journal';
    insight_date := new.entry_date;
    insight_title := '일기 인사이트';
  elsif tg_table_name = 'routine_daily_reviews' then
    insight_category := 'routine';
    insight_date := new.review_date;
    insight_title := '루틴 인사이트';
  else
    return new;
  end if;

  insight_source_key := tg_table_name || ':' || new.id::text;

  insert into public.ai_insights (
    user_id,
    category,
    scope,
    source_key,
    source_date,
    title,
    content,
    updated_at
  ) values (
    new.user_id,
    insight_category,
    'daily',
    insight_source_key,
    insight_date,
    insight_title,
    new.ai_feedback,
    now()
  )
  on conflict (user_id, source_key) do update
  set content = excluded.content,
      source_date = excluded.source_date,
      title = excluded.title,
      updated_at = now();

  return new;
end;
$$;

create trigger journal_entries_sync_ai_insight
after insert or update of ai_feedback on public.journal_entries
for each row execute function public.sync_daily_ai_insight();

create trigger routine_daily_reviews_sync_ai_insight
after insert or update of ai_feedback on public.routine_daily_reviews
for each row execute function public.sync_daily_ai_insight();

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
