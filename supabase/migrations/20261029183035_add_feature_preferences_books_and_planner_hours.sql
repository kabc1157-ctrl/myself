alter table public.user_feature_settings
  add column notes_enabled boolean not null default true,
  add column reading_enabled boolean not null default true,
  add column planner_day_start time without time zone not null default '05:00',
  add column planner_day_end time without time zone not null default '23:30';

alter table public.user_feature_settings
  add constraint user_feature_settings_planner_hours_valid
  check (planner_day_start < planner_day_end);

create table public.reading_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  author text check (author is null or char_length(author) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index reading_books_user_title_author_key
  on public.reading_books (user_id, lower(btrim(title)), lower(btrim(coalesce(author, ''))));

create index reading_books_user_updated_idx
  on public.reading_books (user_id, updated_at desc);

alter table public.reading_books enable row level security;

create policy "Users manage their own reading books"
  on public.reading_books
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.reading_books to authenticated;

alter table public.reading_logs
  add column book_id uuid references public.reading_books(id) on delete restrict;

insert into public.reading_books (user_id, title, author)
select distinct on (
  logs.user_id,
  lower(btrim(logs.title)),
  lower(btrim(coalesce(logs.author, '')))
) logs.user_id, btrim(logs.title), nullif(btrim(logs.author), '')
from public.reading_logs as logs
where not exists (
  select 1
  from public.reading_books as books
  where books.user_id = logs.user_id
    and lower(btrim(books.title)) = lower(btrim(logs.title))
    and lower(btrim(coalesce(books.author, ''))) = lower(btrim(coalesce(logs.author, '')))
)
order by logs.user_id, lower(btrim(logs.title)), lower(btrim(coalesce(logs.author, ''))), logs.created_at;

update public.reading_logs as logs
set book_id = books.id
from public.reading_books as books
where logs.book_id is null
  and books.user_id = logs.user_id
  and lower(btrim(books.title)) = lower(btrim(logs.title))
  and lower(btrim(coalesce(books.author, ''))) = lower(btrim(coalesce(logs.author, '')));

alter table public.reading_logs
  alter column book_id set not null;

create index reading_logs_book_id_idx on public.reading_logs (book_id);
