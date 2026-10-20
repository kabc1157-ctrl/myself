create table public.google_calendar_event_dismissals (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id text not null,
  event_date date not null,
  dismissed_at timestamptz not null default now(),
  primary key (user_id, event_id, event_date)
);

alter table public.google_calendar_event_dismissals enable row level security;

grant select, insert, delete on table public.google_calendar_event_dismissals to authenticated;

create policy "google_calendar_event_dismissals_select_own"
on public.google_calendar_event_dismissals for select to authenticated
using ((select auth.uid()) = user_id);

create policy "google_calendar_event_dismissals_insert_own"
on public.google_calendar_event_dismissals for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "google_calendar_event_dismissals_delete_own"
on public.google_calendar_event_dismissals for delete to authenticated
using ((select auth.uid()) = user_id);
