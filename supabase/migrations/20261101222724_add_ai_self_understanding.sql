-- Additive schema for AI self-understanding features.
-- This migration does not delete or modify existing user records.

alter table public.profiles
  add column if not exists ai_tone text not null default 'empathetic'
  check (ai_tone in ('empathetic', 'direct', 'balanced'));

alter table public.notes
  add column if not exists source_kind text not null default 'note',
  add column if not exists source_ref text,
  add column if not exists source_title text,
  add column if not exists source_url text,
  add column if not exists ai_highlights jsonb not null default '[]'::jsonb
    check (jsonb_typeof(ai_highlights) = 'array'),
  add column if not exists personal_memo text;

create unique index if not exists notes_user_source_ref_unique
  on public.notes (user_id, source_kind, source_ref)
  where source_ref is not null;

create table if not exists public.daily_self_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  insight_date date not null,
  summary text,
  emotional_flow text,
  growth_signals jsonb not null default '[]'::jsonb check (jsonb_typeof(growth_signals) = 'array'),
  behavioral_patterns jsonb not null default '[]'::jsonb check (jsonb_typeof(behavioral_patterns) = 'array'),
  tomorrow_experiment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, insight_date)
);

create table if not exists public.daily_self_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  answer_date date not null,
  response jsonb not null default '{}'::jsonb check (jsonb_typeof(response) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, answer_date)
);

create table if not exists public.ai_period_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_type text not null check (period_type in ('weekly', 'monthly')),
  period_start date not null,
  period_end date not null,
  report jsonb not null default '{}'::jsonb check (jsonb_typeof(report) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, period_type, period_start, period_end)
);

create index if not exists daily_self_insights_user_date_idx
  on public.daily_self_insights (user_id, insight_date desc);
create index if not exists daily_self_answers_user_date_idx
  on public.daily_self_answers (user_id, answer_date desc);
create index if not exists ai_period_reports_user_period_idx
  on public.ai_period_reports (user_id, period_type, period_start desc);

alter table public.daily_self_insights enable row level security;
alter table public.daily_self_answers enable row level security;
alter table public.ai_period_reports enable row level security;

revoke all on table public.daily_self_insights from anon, authenticated;
revoke all on table public.daily_self_answers from anon, authenticated;
revoke all on table public.ai_period_reports from anon, authenticated;

grant select on table public.daily_self_insights to authenticated;
grant select, insert, update, delete on table public.daily_self_answers to authenticated;
grant select on table public.ai_period_reports to authenticated;

create policy "daily_self_insights_select_own"
  on public.daily_self_insights
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "daily_self_answers_select_own"
  on public.daily_self_answers
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "daily_self_answers_insert_own"
  on public.daily_self_answers
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "daily_self_answers_update_own"
  on public.daily_self_answers
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "daily_self_answers_delete_own"
  on public.daily_self_answers
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "ai_period_reports_select_own"
  on public.ai_period_reports
  for select to authenticated
  using ((select auth.uid()) = user_id);;
