create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  timezone text not null default 'Asia/Seoul',
  locale text not null default 'ko-KR',
  week_starts_on smallint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (
    display_name is null or char_length(display_name) between 1 and 80
  ),
  constraint profiles_timezone_not_blank check (btrim(timezone) <> ''),
  constraint profiles_locale_not_blank check (btrim(locale) <> ''),
  constraint profiles_week_starts_on_valid check (week_starts_on between 1 and 7)
);

create table public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  color text,
  sort_order integer not null default 0,
  start_date date not null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint routines_owner_key unique (id, user_id),
  constraint routines_name_length check (char_length(btrim(name)) between 1 and 80),
  constraint routines_description_length check (
    description is null or char_length(description) <= 500
  ),
  constraint routines_color_length check (color is null or char_length(color) <= 40),
  constraint routines_sort_order_non_negative check (sort_order >= 0),
  constraint routines_archive_after_creation check (
    archived_at is null or archived_at >= created_at
  )
);

create table public.routine_schedule_versions (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null,
  user_id uuid not null,
  effective_from date not null,
  weekdays smallint[] not null,
  preferred_time time without time zone,
  created_at timestamptz not null default now(),
  constraint routine_schedule_versions_routine_owner_fkey
    foreign key (routine_id, user_id)
    references public.routines (id, user_id)
    on delete cascade,
  constraint routine_schedule_versions_effective_key unique (routine_id, effective_from),
  constraint routine_schedule_versions_weekdays_count check (
    cardinality(weekdays) between 1 and 7
  ),
  constraint routine_schedule_versions_weekdays_valid check (
    weekdays <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]
  )
);

create table public.routine_completions (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null,
  user_id uuid not null,
  routine_date date not null,
  completed_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint routine_completions_routine_owner_fkey
    foreign key (routine_id, user_id)
    references public.routines (id, user_id)
    on delete cascade,
  constraint routine_completions_date_key unique (routine_id, routine_date),
  constraint routine_completions_note_length check (
    note is null or char_length(note) <= 500
  )
);

create table public.routine_daily_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  review_date date not null,
  reflection text not null,
  completion_count integer not null,
  total_count integer not null,
  ai_feedback jsonb,
  analyzed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint routine_daily_reviews_user_date_key unique (user_id, review_date),
  constraint routine_daily_reviews_reflection_length check (
    char_length(btrim(reflection)) between 1 and 5000
  ),
  constraint routine_daily_reviews_counts_valid check (
    completion_count >= 0
    and total_count >= 0
    and completion_count <= total_count
  ),
  constraint routine_daily_reviews_ai_feedback_object check (
    ai_feedback is null or jsonb_typeof(ai_feedback) = 'object'
  ),
  constraint routine_daily_reviews_analysis_state check (
    (ai_feedback is null and analyzed_at is null)
    or (ai_feedback is not null and analyzed_at is not null)
  )
);

create index routines_user_active_order_idx
  on public.routines (user_id, sort_order, created_at)
  where archived_at is null;

create index routine_schedule_versions_lookup_idx
  on public.routine_schedule_versions (routine_id, effective_from desc);

create index routine_schedule_versions_user_idx
  on public.routine_schedule_versions (user_id);

create index routine_completions_user_date_idx
  on public.routine_completions (user_id, routine_date);

create index routine_daily_reviews_user_date_idx
  on public.routine_daily_reviews (user_id, review_date desc);

create or replace function public.create_routine_with_schedule(
  p_name text,
  p_start_date date,
  p_weekdays smallint[],
  p_description text default null,
  p_color text default null,
  p_preferred_time time without time zone default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_routine_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  insert into public.routines (
    user_id,
    name,
    description,
    color,
    start_date
  ) values (
    v_user_id,
    p_name,
    p_description,
    p_color,
    p_start_date
  )
  returning id into v_routine_id;

  insert into public.routine_schedule_versions (
    routine_id,
    user_id,
    effective_from,
    weekdays,
    preferred_time
  ) values (
    v_routine_id,
    v_user_id,
    p_start_date,
    p_weekdays,
    p_preferred_time
  );

  return v_routine_id;
end;
$$;

revoke all on function public.create_routine_with_schedule(
  text,
  date,
  smallint[],
  text,
  text,
  time without time zone
) from public, anon;

grant execute on function public.create_routine_with_schedule(
  text,
  date,
  smallint[],
  text,
  text,
  time without time zone
) to authenticated;

alter table public.profiles enable row level security;
alter table public.routines enable row level security;
alter table public.routine_schedule_versions enable row level security;
alter table public.routine_completions enable row level security;
alter table public.routine_daily_reviews enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.routines from anon, authenticated;
revoke all on table public.routine_schedule_versions from anon, authenticated;
revoke all on table public.routine_completions from anon, authenticated;
revoke all on table public.routine_daily_reviews from anon, authenticated;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update on table public.routines to authenticated;
grant select, insert, update, delete on table public.routine_schedule_versions to authenticated;
grant select, insert, update, delete on table public.routine_completions to authenticated;
grant select, insert, update on table public.routine_daily_reviews to authenticated;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "routines_select_own"
  on public.routines for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "routines_insert_own"
  on public.routines for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "routines_update_own"
  on public.routines for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "routine_schedule_versions_select_own"
  on public.routine_schedule_versions for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "routine_schedule_versions_insert_own"
  on public.routine_schedule_versions for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "routine_schedule_versions_update_own"
  on public.routine_schedule_versions for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "routine_schedule_versions_delete_own"
  on public.routine_schedule_versions for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "routine_completions_select_own"
  on public.routine_completions for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "routine_completions_insert_own"
  on public.routine_completions for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "routine_completions_update_own"
  on public.routine_completions for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "routine_completions_delete_own"
  on public.routine_completions for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "routine_daily_reviews_select_own"
  on public.routine_daily_reviews for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "routine_daily_reviews_insert_own"
  on public.routine_daily_reviews for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "routine_daily_reviews_update_own"
  on public.routine_daily_reviews for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
