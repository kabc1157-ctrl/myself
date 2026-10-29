alter table public.routine_schedule_versions
  add column time_period text;

alter table public.routine_schedule_versions
  add constraint routine_schedule_versions_time_period_check
  check (time_period is null or time_period in ('morning', 'afternoon', 'evening'));
