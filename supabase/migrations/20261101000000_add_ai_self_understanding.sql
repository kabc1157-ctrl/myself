-- Additive schema for n8n-written AI summaries and user-owned reflections.
-- This migration intentionally does not alter or remove existing records.

alter table public.profiles
  add column if not exists ai_tone text not null default 'empathetic'
  check (ai_tone in ('empathetic', 'problem_solving'));

alter table public.notes
  add column if not exists source_kind text not null default 'note',
  add column if not exists source_ref text,
  add column if not exists source_title text,
  add column if not exists source_url text,
  add column if not exists ai_highlights jsonb not null default '[]'::jsonb
    check (jsonb_typeof(ai_highlights) = 'array'),
  add column if not exists personal_memo text;

create unique index if not exists notes_user_source_ref_unique
  on public.notes (user_id, source_ref)
  where source_ref is not null;

create table if not exists public.daily_self_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  insight_date date not null,
  title text not null default '오늘의 나는',
  content jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object'),
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, insight_date)
);

create table if not exists public.daily_self_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  answer_date date not null,
  answer text not null check (char_length(btrim(answer)) between 1 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, answer_date)
);

create table if not exists public.ai_period_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_type text not null check (period_type in ('weekly', 'monthly')),
  period_start date not null,
  period_end date not null check (period_end >= period_start),
  title text not null,
  content jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object'),
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, period_type, period_start, period_end)
);

alter table public.daily_self_insights enable row level security;
alter table public.daily_self_answers enable row level security;
alter table public.ai_period_reports enable row level security;

revoke all on public.daily_self_insights, public.daily_self_answers, public.ai_period_reports from anon;
revoke all on public.daily_self_insights, public.daily_self_answers, public.ai_period_reports from authenticated;
grant select on public.daily_self_insights, public.ai_period_reports to authenticated;
grant select, insert, update, delete on public.daily_self_answers to authenticated;

create policy "Users read own daily self insights"
  on public.daily_self_insights for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users manage own daily answers"
  on public.daily_self_answers for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users read own AI period reports"
  on public.ai_period_reports for select to authenticated
  using ((select auth.uid()) = user_id);

create index if not exists daily_self_insights_user_date_idx
  on public.daily_self_insights (user_id, insight_date desc);
create index if not exists daily_self_answers_user_date_idx
  on public.daily_self_answers (user_id, answer_date desc);
create index if not exists ai_period_reports_user_generated_idx
  on public.ai_period_reports (user_id, updated_at desc);
