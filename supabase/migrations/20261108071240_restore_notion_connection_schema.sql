-- Recovery migration for a database whose migration history contains the
-- original Notion migration but whose tables are missing. This migration is
-- additive only: it does not delete, truncate, update, or alter existing rows.

create table if not exists public.notion_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_token_ciphertext text not null,
  refresh_token_ciphertext text,
  workspace_id text not null,
  workspace_name text,
  bot_id text not null,
  journal_data_source_id text,
  routine_data_source_id text,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notion_archives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('journal', 'routine')),
  source_key text not null,
  notion_page_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, source_key)
);

alter table public.notion_connections add column if not exists access_token_ciphertext text;
alter table public.notion_connections add column if not exists refresh_token_ciphertext text;
alter table public.notion_connections add column if not exists workspace_id text;
alter table public.notion_connections add column if not exists workspace_name text;
alter table public.notion_connections add column if not exists bot_id text;
alter table public.notion_connections add column if not exists journal_data_source_id text;
alter table public.notion_connections add column if not exists routine_data_source_id text;
alter table public.notion_connections add column if not exists connected_at timestamptz default now();
alter table public.notion_connections add column if not exists updated_at timestamptz default now();

alter table public.notion_archives add column if not exists category text;
alter table public.notion_archives add column if not exists source_key text;
alter table public.notion_archives add column if not exists notion_page_id text;
alter table public.notion_archives add column if not exists created_at timestamptz default now();

create unique index if not exists notion_connections_user_pk_idx on public.notion_connections (user_id);
create unique index if not exists notion_archives_user_source_key_idx on public.notion_archives (user_id, source_key);
create index if not exists notion_connections_workspace_idx on public.notion_connections (workspace_id);

alter table public.notion_connections enable row level security;
alter table public.notion_archives enable row level security;

revoke all on table public.notion_connections from anon, authenticated;
revoke all on table public.notion_archives from anon, authenticated;
grant select (user_id, workspace_id, workspace_name, bot_id, journal_data_source_id, routine_data_source_id, connected_at, updated_at) on public.notion_connections to authenticated;
grant update (journal_data_source_id, routine_data_source_id, updated_at) on public.notion_connections to authenticated;
grant select on public.notion_archives to authenticated;

create index if not exists notion_archives_user_created_idx on public.notion_archives (user_id, created_at desc);

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'notion_connections' and policyname = 'notion_connections_select_own') then
    create policy "notion_connections_select_own" on public.notion_connections for select to authenticated using ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'notion_connections' and policyname = 'notion_connections_update_own') then
    create policy "notion_connections_update_own" on public.notion_connections for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'notion_archives' and policyname = 'notion_archives_select_own') then
    create policy "notion_archives_select_own" on public.notion_archives for select to authenticated using ((select auth.uid()) = user_id);
  end if;
end $$;

create table if not exists public.notion_todo_configs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  database_id text not null,
  data_source_id text,
  title_property_id text not null,
  date_property_id text,
  completed_property_id text,
  start_time_property_id text,
  end_time_property_id text,
  updated_at timestamptz not null default now(),
  constraint notion_todo_configs_database_id_not_blank check (btrim(database_id) <> ''),
  constraint notion_todo_configs_title_property_id_not_blank check (btrim(title_property_id) <> '')
);

create table if not exists public.notion_todo_links (
  user_id uuid not null references auth.users(id) on delete cascade,
  notion_page_id text not null,
  planner_task_id uuid references public.planner_tasks(id) on delete set null,
  title text not null,
  planned_date date,
  start_time time,
  end_time time,
  is_completed boolean not null default false,
  last_notion_edited_at timestamptz,
  last_synced_at timestamptz,
  sync_status text not null default 'synced' constraint notion_todo_links_sync_status_check check (sync_status in ('pending', 'synced', 'error')),
  sync_error text,
  updated_at timestamptz not null default now(),
  primary key (user_id, notion_page_id)
);

create table if not exists public.notion_sync_events (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id text not null,
  notion_page_id text,
  status text not null default 'processed' constraint notion_sync_events_status_check check (status in ('processed', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'notion_todo_configs_database_id_not_blank') then
    alter table public.notion_todo_configs add constraint notion_todo_configs_database_id_not_blank check (btrim(database_id) <> '');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'notion_todo_configs_title_property_id_not_blank') then
    alter table public.notion_todo_configs add constraint notion_todo_configs_title_property_id_not_blank check (btrim(title_property_id) <> '');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'notion_todo_links_sync_status_check') then
    alter table public.notion_todo_links add constraint notion_todo_links_sync_status_check check (sync_status in ('pending', 'synced', 'error'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'notion_sync_events_status_check') then
    alter table public.notion_sync_events add constraint notion_sync_events_status_check check (status in ('processed', 'failed'));
  end if;
end $$;

alter table public.notion_todo_configs enable row level security;
alter table public.notion_todo_links enable row level security;
alter table public.notion_sync_events enable row level security;
revoke all on table public.notion_todo_configs from anon, authenticated;
revoke all on table public.notion_todo_links from anon, authenticated;
revoke all on table public.notion_sync_events from anon, authenticated;
grant select, insert, update, delete on public.notion_todo_configs to authenticated;
grant select on public.notion_todo_links to authenticated;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'notion_todo_configs' and policyname = 'notion_todo_configs_own') then
    create policy "notion_todo_configs_own" on public.notion_todo_configs for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'notion_todo_links' and policyname = 'notion_todo_links_select_own') then
    create policy "notion_todo_links_select_own" on public.notion_todo_links for select to authenticated using ((select auth.uid()) = user_id);
  end if;
end $$;

create index if not exists notion_todo_links_user_date_idx on public.notion_todo_links (user_id, planned_date, updated_at desc);
create index if not exists notion_sync_events_created_idx on public.notion_sync_events (user_id, created_at desc);
