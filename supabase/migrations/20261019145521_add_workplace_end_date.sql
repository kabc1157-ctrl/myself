alter table public.workplaces
  add column end_date date;

create index workplaces_user_end_date_idx
  on public.workplaces (user_id, end_date)
  where archived_at is null;

comment on column public.workplaces.end_date is
  'Last calendar date the workplace remains active. It is shown through its ending month.';
