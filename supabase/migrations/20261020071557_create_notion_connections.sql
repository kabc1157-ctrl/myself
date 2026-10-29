create table public.notion_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_token_ciphertext text not null,
  refresh_token_ciphertext text,
  workspace_id text not null,
  workspace_name text,
  bot_id text not null,
  journal_data_source_id text,
  routine_data_source_id text,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notion_connections_workspace_id_not_blank check (btrim(workspace_id) <> ''),
  constraint notion_connections_bot_id_not_blank check (btrim(bot_id) <> '')
);

create table public.notion_archives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('journal', 'routine')),
  source_key text not null,
  notion_page_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, source_key)
);

alter table public.notion_connections enable row level security;
alter table public.notion_archives enable row level security;

revoke all on table public.notion_connections from anon, authenticated;
revoke all on table public.notion_archives from anon, authenticated;

grant select (user_id, workspace_id, workspace_name, bot_id, journal_data_source_id, routine_data_source_id, connected_at, updated_at)
on public.notion_connections to authenticated;
grant update (journal_data_source_id, routine_data_source_id, updated_at)
on public.notion_connections to authenticated;
grant select on public.notion_archives to authenticated;

create policy "notion_connections_select_own"
on public.notion_connections for select to authenticated
using ((select auth.uid()) = user_id);

create policy "notion_connections_update_own"
on public.notion_connections for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "notion_archives_select_own"
on public.notion_archives for select to authenticated
using ((select auth.uid()) = user_id);

create index notion_archives_user_created_idx
on public.notion_archives (user_id, created_at desc);
