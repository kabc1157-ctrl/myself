create table public.saved_ai_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  insight_id uuid not null references public.ai_insights(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, insight_id)
);

alter table public.saved_ai_insights enable row level security;

create policy "Users can read their own saved insights"
on public.saved_ai_insights for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can save their own insights"
on public.saved_ai_insights for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.ai_insights
    where ai_insights.id = insight_id
      and ai_insights.user_id = (select auth.uid())
  )
);

create policy "Users can remove their own saved insights"
on public.saved_ai_insights for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, delete on public.saved_ai_insights to authenticated;

create index saved_ai_insights_user_created_idx
on public.saved_ai_insights (user_id, created_at desc);
