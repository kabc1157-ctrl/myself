alter table public.workplaces
  add column pay_day smallint not null default 10,
  add column default_start_time time without time zone,
  add column default_end_time time without time zone,
  add column default_break_minutes integer not null default 0;

alter table public.workplaces
  add constraint workplaces_pay_day_valid check (pay_day between 1 and 31),
  add constraint workplaces_default_time_pair check (
    (default_start_time is null and default_end_time is null)
    or (default_start_time is not null and default_end_time is not null)
  ),
  add constraint workplaces_default_break_valid check (default_break_minutes between 0 and 1439);

update public.workplaces
set default_start_time = '09:00',
    default_end_time = '18:00',
    default_break_minutes = 60
where default_pay_type = 'hourly'
  and default_start_time is null;
