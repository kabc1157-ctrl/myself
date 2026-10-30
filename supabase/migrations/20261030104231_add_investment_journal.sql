alter table public.user_feature_settings
  add column investment_enabled boolean not null default false;

alter table public.ai_insights
  drop constraint if exists ai_insights_category_check;
alter table public.ai_insights
  add constraint ai_insights_category_check
  check (category = any (array['journal','routine','note','exercise','planner','payroll','reading','investment']));

create table public.investment_symbols (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null check (char_length(btrim(ticker)) between 1 and 30),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint investment_symbols_id_user_key unique (id, user_id)
);

create unique index investment_symbols_user_ticker_key on public.investment_symbols (user_id, lower(btrim(ticker)));
create index investment_symbols_user_updated_idx on public.investment_symbols (user_id, updated_at desc);

create table public.investment_trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol_id uuid not null references public.investment_symbols(id) on delete cascade,
  trade_date date not null,
  trade_type text not null check (trade_type in ('buy','sell')),
  quantity numeric not null check (quantity > 0),
  unit_price numeric not null check (unit_price >= 0),
  trade_amount numeric not null check (trade_amount >= 0),
  expected_exit_amount numeric check (expected_exit_amount is null or expected_exit_amount >= 0),
  reason text check (reason is null or char_length(reason) <= 5000),
  memo text check (memo is null or char_length(memo) <= 5000),
  ai_feedback jsonb check (ai_feedback is null or jsonb_typeof(ai_feedback) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint investment_trades_symbol_owner foreign key (symbol_id, user_id)
    references public.investment_symbols (id, user_id) on delete cascade
);

create index investment_trades_user_date_idx on public.investment_trades (user_id, trade_date desc);
create index investment_trades_symbol_date_idx on public.investment_trades (symbol_id, trade_date desc);

alter table public.investment_symbols enable row level security;
alter table public.investment_trades enable row level security;

create policy "Users manage their own investment symbols" on public.investment_symbols
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage their own investment trades" on public.investment_trades
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.investment_symbols to authenticated;
grant select, insert, update, delete on public.investment_trades to authenticated;
