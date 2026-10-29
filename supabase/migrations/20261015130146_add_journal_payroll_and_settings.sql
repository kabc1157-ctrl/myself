create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  title text,
  body text not null,
  mood smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint journal_entries_user_date_key unique (user_id, entry_date),
  constraint journal_entries_title_length check (
    title is null or char_length(title) <= 120
  ),
  constraint journal_entries_body_length check (
    char_length(btrim(body)) between 1 and 20000
  ),
  constraint journal_entries_mood_valid check (
    mood is null or mood between 1 and 5
  )
);

create table public.workplaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text,
  default_pay_type text not null,
  default_rate numeric(14, 2) not null,
  pay_period_start_day smallint not null default 1,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workplaces_owner_key unique (id, user_id),
  constraint workplaces_name_length check (
    char_length(btrim(name)) between 1 and 80
  ),
  constraint workplaces_color_length check (
    color is null or char_length(color) <= 40
  ),
  constraint workplaces_pay_type_valid check (
    default_pay_type in ('hourly', 'daily', 'per_task', 'bonus')
  ),
  constraint workplaces_rate_non_negative check (default_rate >= 0),
  constraint workplaces_period_start_day_valid check (
    pay_period_start_day between 1 and 28
  ),
  constraint workplaces_archive_after_creation check (
    archived_at is null or archived_at >= created_at
  )
);

create table public.work_shifts (
  id uuid primary key default gen_random_uuid(),
  workplace_id uuid not null,
  user_id uuid not null,
  work_date date not null,
  start_time time without time zone,
  end_time time without time zone,
  break_minutes integer not null default 0,
  pay_type text not null,
  pay_rate numeric(14, 2) not null,
  quantity numeric(10, 2) not null default 1,
  additional_pay numeric(14, 2) not null default 0,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_shifts_workplace_owner_fkey
    foreign key (workplace_id, user_id)
    references public.workplaces (id, user_id)
    on delete cascade,
  constraint work_shifts_pay_type_valid check (
    pay_type in ('hourly', 'daily', 'per_task', 'bonus')
  ),
  constraint work_shifts_time_pair check (
    (start_time is null and end_time is null)
    or (start_time is not null and end_time is not null)
  ),
  constraint work_shifts_hourly_time_required check (
    pay_type <> 'hourly'
    or (start_time is not null and end_time is not null)
  ),
  constraint work_shifts_break_minutes_valid check (
    break_minutes between 0 and 1439
  ),
  constraint work_shifts_rate_non_negative check (pay_rate >= 0),
  constraint work_shifts_quantity_positive check (quantity > 0),
  constraint work_shifts_additional_pay_non_negative check (additional_pay >= 0),
  constraint work_shifts_memo_length check (
    memo is null or char_length(memo) <= 1000
  )
);

create index journal_entries_user_date_idx
  on public.journal_entries (user_id, entry_date desc);

create index workplaces_user_active_idx
  on public.workplaces (user_id, created_at)
  where archived_at is null;

create index work_shifts_user_date_idx
  on public.work_shifts (user_id, work_date desc);

create index work_shifts_workplace_date_idx
  on public.work_shifts (workplace_id, work_date desc);

alter table public.journal_entries enable row level security;
alter table public.workplaces enable row level security;
alter table public.work_shifts enable row level security;

revoke all on table public.journal_entries from anon, authenticated;
revoke all on table public.workplaces from anon, authenticated;
revoke all on table public.work_shifts from anon, authenticated;

grant select, insert, update on table public.journal_entries to authenticated;
grant select, insert, update on table public.workplaces to authenticated;
grant select, insert, update, delete on table public.work_shifts to authenticated;

create policy "journal_entries_select_own"
  on public.journal_entries for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "journal_entries_insert_own"
  on public.journal_entries for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "journal_entries_update_own"
  on public.journal_entries for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "workplaces_select_own"
  on public.workplaces for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "workplaces_insert_own"
  on public.workplaces for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "workplaces_update_own"
  on public.workplaces for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "work_shifts_select_own"
  on public.work_shifts for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "work_shifts_insert_own"
  on public.work_shifts for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "work_shifts_update_own"
  on public.work_shifts for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "work_shifts_delete_own"
  on public.work_shifts for delete
  to authenticated
  using ((select auth.uid()) = user_id);
