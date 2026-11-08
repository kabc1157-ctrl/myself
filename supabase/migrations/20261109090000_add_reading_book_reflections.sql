create table if not exists public.reading_book_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.reading_books(id) on delete cascade,
  reflection_text text,
  source_record_count integer not null default 0 check (source_record_count >= 0),
  generation_status text not null default 'generating' check (generation_status in ('generating', 'complete', 'failed')),
  error_message text,
  generated_at timestamptz,
  requested_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, book_id)
);

create index if not exists reading_book_reflections_user_book_idx
  on public.reading_book_reflections (user_id, book_id);

alter table public.reading_book_reflections enable row level security;

drop policy if exists "Users read their own reading book reflections" on public.reading_book_reflections;
create policy "Users read their own reading book reflections"
  on public.reading_book_reflections for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users update their own reading book reflections" on public.reading_book_reflections;
create policy "Users update their own reading book reflections"
  on public.reading_book_reflections for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, update on public.reading_book_reflections to authenticated;
