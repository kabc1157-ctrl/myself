-- Restore planner runtime tables if they are missing on a linked database.
-- Additive and idempotent: no existing rows are deleted or updated.
create table if not exists public.planner_weekly_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  block_key text not null check (char_length(btrim(block_key)) between 1 and 40),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  start_time time,
  end_time time,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint planner_weekly_templates_time_valid check (
    (start_time is null and end_time is null) or
    (start_time is not null and end_time is not null and start_time < end_time)
  ),
  unique (user_id, weekday, block_key)
);

create table if not exists public.planner_timer_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  planner_task_id uuid not null references public.planner_tasks(id) on delete cascade,
  started_at timestamptz not null,
  paused_at timestamptz,
  resumed_at timestamptz,
  ended_at timestamptz,
  elapsed_seconds integer not null default 0 check (elapsed_seconds >= 0),
  manual_seconds integer check (manual_seconds is null or manual_seconds >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint planner_timer_sessions_state_valid check (ended_at is null or ended_at >= started_at)
);

alter table public.planner_weekly_templates enable row level security;
alter table public.planner_timer_sessions enable row level security;
drop policy if exists "Users manage own weekly planner templates" on public.planner_weekly_templates;
create policy "Users manage own weekly planner templates" on public.planner_weekly_templates
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users manage own planner timer sessions" on public.planner_timer_sessions;
create policy "Users manage own planner timer sessions" on public.planner_timer_sessions
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.planner_weekly_templates to authenticated;
grant select, insert, update, delete on public.planner_timer_sessions to authenticated;
create index if not exists planner_weekly_templates_user_weekday_idx on public.planner_weekly_templates (user_id, weekday, start_time);
create index if not exists planner_timer_sessions_user_task_idx on public.planner_timer_sessions (user_id, planner_task_id, started_at desc);
create unique index if not exists planner_timer_sessions_one_active_user_idx on public.planner_timer_sessions (user_id) where ended_at is null;
