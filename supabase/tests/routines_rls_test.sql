begin;
select plan(9);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'other@example.com');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.routines'::regclass),
  'routines has RLS enabled'
);

set local role anon;
select throws_ok(
  $$select * from public.routines$$,
  '42501',
  null,
  'anonymous users cannot read routines'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select isnt(
  public.create_routine_with_schedule(
    '물 마시기',
    '2026-10-13',
    array[1, 2, 3, 4, 5, 6, 7]::smallint[],
    null,
    null,
    null
  ),
  null,
  'the owner creates a routine atomically'
);
select results_eq(
  $$select name from public.routines$$,
  array['물 마시기'],
  'the owner reads their routine'
);
select results_eq(
  $$select count(*)::integer from public.routine_schedule_versions$$,
  array[1],
  'routine creation also creates one schedule version'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select is_empty(
  $$select * from public.routines$$,
  'another user cannot read the owner routine'
);
select is_empty(
  $$update public.routines set name = '탈취' returning name$$,
  'another user cannot update the owner routine'
);
select throws_ok(
  $$insert into public.routines (user_id, name, start_date)
    values ('11111111-1111-1111-1111-111111111111', '탈취', '2026-10-13')$$,
  '42501',
  null,
  'another user cannot create a routine for the owner'
);
select ok(
  not has_table_privilege('authenticated', 'public.routines', 'delete'),
  'routines are archived instead of deleted by the client role'
);

select * from finish();
rollback;
