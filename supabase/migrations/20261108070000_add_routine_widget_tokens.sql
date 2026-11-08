create table if not exists public.routine_widget_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  label text not null default 'Scriptable',
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists routine_widget_tokens_user_idx on public.routine_widget_tokens(user_id, revoked_at, expires_at);
alter table public.routine_widget_tokens enable row level security;
drop policy if exists routine_widget_tokens_select_own on public.routine_widget_tokens;
create policy routine_widget_tokens_select_own on public.routine_widget_tokens for select to authenticated using (user_id = auth.uid());
drop policy if exists routine_widget_tokens_insert_own on public.routine_widget_tokens;
create policy routine_widget_tokens_insert_own on public.routine_widget_tokens for insert to authenticated with check (user_id = auth.uid());
drop policy if exists routine_widget_tokens_delete_own on public.routine_widget_tokens;
create policy routine_widget_tokens_delete_own on public.routine_widget_tokens for delete to authenticated using (user_id = auth.uid());
revoke all on public.routine_widget_tokens from anon, authenticated;
grant select, insert, delete on public.routine_widget_tokens to authenticated;
