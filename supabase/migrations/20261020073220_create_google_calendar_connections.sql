create table public.google_calendar_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_token_ciphertext text not null,
  refresh_token_ciphertext text,
  access_token_expires_at timestamptz not null,
  account_email text,
  calendar_id text not null default 'primary',
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint google_calendar_connections_calendar_id_not_blank
    check (btrim(calendar_id) <> '')
);

alter table public.google_calendar_connections enable row level security;

revoke all on table public.google_calendar_connections from anon, authenticated;

grant select (user_id, account_email, calendar_id, connected_at, updated_at)
on public.google_calendar_connections to authenticated;

create policy "google_calendar_connections_select_own"
on public.google_calendar_connections for select to authenticated
using ((select auth.uid()) = user_id);
