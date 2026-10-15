begin;
select plan(8);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'other@example.com');

insert into public.routines (id, user_id, name, start_date)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  '물 마시기',
  '2026-10-13'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.routine_schedule_versions'::regclass),
  'routine schedule versions has RLS enabled'
);

set local role anon;
select throws_ok(
  $$select * from public.routine_schedule_versions$$,
  '42501',
  null,
  'anonymous users cannot read schedules'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select results_eq(
  $$insert into public.routine_schedule_versions (
      id, routine_id, user_id, effective_from, weekdays
    ) values (
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      '11111111-1111-1111-1111-111111111111',
      '2026-10-13',
      array[1, 3, 5]::smallint[]
    ) returning effective_from::text$$,
  array['2026-10-13'],
  'the owner creates a schedule version'
);
select results_eq(
  $$select effective_from::text from public.routine_schedule_versions$$,
  array['2026-10-13'],
  'the owner reads their schedule'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select is_empty(
  $$select * from public.routine_schedule_versions$$,
  'another user cannot read the owner schedule'
);
select throws_ok(
  $$insert into public.routine_schedule_versions (
      routine_id, user_id, effective_from, weekdays
    ) values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      '11111111-1111-1111-1111-111111111111',
      '2026-10-14',
      array[2]::smallint[]
    )$$,
  '42501',
  null,
  'another user cannot create an owner schedule'
);
select is_empty(
  $$update public.routine_schedule_versions
    set weekdays = array[7]::smallint[] returning id$$,
  'another user cannot update the owner schedule'
);
select is_empty(
  $$delete from public.routine_schedule_versions returning id$$,
  'another user cannot delete the owner schedule'
);

select * from finish();
rollback;
