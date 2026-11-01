alter table public.notes add column if not exists checklist jsonb not null default '[]'::jsonb;

alter table public.notes drop constraint if exists notes_checklist_array_check;
alter table public.notes add constraint notes_checklist_array_check
  check (jsonb_typeof(checklist) = 'array');
