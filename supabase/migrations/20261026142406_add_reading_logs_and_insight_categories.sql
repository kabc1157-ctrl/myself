create table public.reading_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reading_date date not null,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  author text check (author is null or char_length(author) <= 120),
  pages_read integer check (pages_read is null or pages_read >= 0),
  memorable_quote text check (memorable_quote is null or char_length(memorable_quote) <= 3000),
  reflection text check (reflection is null or char_length(reflection) <= 10000),
  ai_feedback jsonb check (ai_feedback is null or jsonb_typeof(ai_feedback) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reading_logs_user_date_idx
  on public.reading_logs (user_id, reading_date desc);

alter table public.reading_logs enable row level security;

create policy "Users manage their own reading logs"
  on public.reading_logs
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.reading_logs to authenticated;

alter table public.ai_insights
  drop constraint if exists ai_insights_category_check;

alter table public.ai_insights
  add constraint ai_insights_category_check
  check (category in ('journal', 'routine', 'note', 'exercise', 'planner', 'payroll', 'reading'));
