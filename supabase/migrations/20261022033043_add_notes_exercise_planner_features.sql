alter table public.ai_insights
  drop constraint if exists ai_insights_category_check,
  add constraint ai_insights_category_check
    check (category in ('journal', 'routine', 'exercise', 'planner'));

create table public.user_feature_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payroll_enabled boolean not null default true,
  exercise_enabled boolean not null default false,
  planner_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.note_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid references public.note_topics(id) on delete set null,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  remark text check (remark is null or char_length(remark) <= 500),
  content text not null check (char_length(btrim(content)) between 1 and 20000),
  show_on_home boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_date date not null,
  exercise_type text not null check (exercise_type in ('cardio', 'stretching', 'strength')),
  activity text not null check (char_length(btrim(activity)) between 1 and 500),
  focus_area text check (focus_area is null or char_length(focus_area) <= 300),
  memo text check (memo is null or char_length(memo) <= 2000),
  ai_feedback jsonb check (ai_feedback is null or jsonb_typeof(ai_feedback) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, exercise_date)
);

create table public.planner_daily_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  review_date date not null,
  reflection text not null check (char_length(btrim(reflection)) between 1 and 5000),
  ai_feedback jsonb check (ai_feedback is null or jsonb_typeof(ai_feedback) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, review_date)
);

create table public.planner_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  planned_date date,
  priority smallint check (priority is null or priority between 1 and 3),
  start_time time,
  end_time time,
  note_id uuid references public.notes(id) on delete set null,
  exercise_log_id uuid references public.exercise_logs(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint planner_tasks_time_pair check (
    (start_time is null and end_time is null)
    or (start_time is not null and end_time is not null)
  )
);

alter table public.user_feature_settings enable row level security;
alter table public.note_topics enable row level security;
alter table public.notes enable row level security;
alter table public.exercise_logs enable row level security;
alter table public.planner_daily_reviews enable row level security;
alter table public.planner_tasks enable row level security;

create policy "Users manage own feature settings" on public.user_feature_settings
for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own note topics" on public.note_topics
for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own notes" on public.notes
for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own exercise logs" on public.exercise_logs
for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own planner reviews" on public.planner_daily_reviews
for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own planner tasks" on public.planner_tasks
for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users create own generated insights" on public.ai_insights
for insert to authenticated with check ((select auth.uid()) = user_id and category in ('exercise', 'planner'));

grant select, insert, update, delete on public.user_feature_settings to authenticated;
grant select, insert, update, delete on public.note_topics to authenticated;
grant select, insert, update, delete on public.notes to authenticated;
grant select, insert, update, delete on public.exercise_logs to authenticated;
grant select, insert, update, delete on public.planner_daily_reviews to authenticated;
grant select, insert, update, delete on public.planner_tasks to authenticated;
grant insert on public.ai_insights to authenticated;

create index note_topics_user_created_idx on public.note_topics (user_id, created_at);
create index notes_user_updated_idx on public.notes (user_id, updated_at desc);
create index notes_topic_idx on public.notes (topic_id);
create index notes_home_idx on public.notes (user_id, updated_at desc) where show_on_home;
create index exercise_logs_user_date_idx on public.exercise_logs (user_id, exercise_date desc);
create index planner_daily_reviews_user_date_idx on public.planner_daily_reviews (user_id, review_date desc);
create index planner_tasks_user_date_idx on public.planner_tasks (user_id, planned_date, start_time);
create index planner_tasks_backlog_idx on public.planner_tasks (user_id, created_at desc) where planned_date is null and completed_at is null;
create index planner_tasks_note_idx on public.planner_tasks (note_id);
create index planner_tasks_exercise_idx on public.planner_tasks (exercise_log_id);
