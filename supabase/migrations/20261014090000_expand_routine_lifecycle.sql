alter table public.routines
  add column end_date date;

alter table public.routines
  add constraint routines_date_range_valid
  check (end_date is null or end_date >= start_date);

grant delete on table public.routines to authenticated;

create policy "routines_delete_own"
  on public.routines for delete
  to authenticated
  using ((select auth.uid()) = user_id);
