begin;
select plan(12);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'other@example.com');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.workplaces'::regclass),
  'workplaces have RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.work_shifts'::regclass),
  'work shifts have RLS enabled'
);

set local role anon;
select throws_ok(
  $$select * from public.workplaces$$,
  '42501',
  null,
  'anonymous users cannot read workplaces'
);
select throws_ok(
  $$select * from public.work_shifts$$,
  '42501',
  null,
  'anonymous users cannot read work shifts'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select lives_ok(
  $$insert into public.workplaces (id, user_id, name, default_pay_type, default_rate)
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      '11111111-1111-1111-1111-111111111111',
      '카페',
      'hourly',
      12000
    )$$,
  'the owner creates a workplace'
);
select lives_ok(
  $$insert into public.work_shifts (
      workplace_id, user_id, work_date, start_time, end_time,
      break_minutes, pay_type, pay_rate
    ) values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      '11111111-1111-1111-1111-111111111111',
      '2026-10-13', '09:00', '18:00', 60, 'hourly', 12000
    )$$,
  'the owner creates a work shift'
);
select results_eq(
  $$select count(*)::integer from public.workplaces$$,
  array[1],
  'the owner reads their workplace'
);
select results_eq(
  $$select count(*)::integer from public.work_shifts$$,
  array[1],
  'the owner reads their work shift'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select is_empty(
  $$select * from public.workplaces$$,
  'another user cannot read the owner workplace'
);
select is_empty(
  $$select * from public.work_shifts$$,
  'another user cannot read the owner work shift'
);
select throws_ok(
  $$insert into public.work_shifts (
      workplace_id, user_id, work_date, start_time, end_time,
      break_minutes, pay_type, pay_rate
    ) values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      '11111111-1111-1111-1111-111111111111',
      '2026-10-14', '09:00', '18:00', 60, 'hourly', 12000
    )$$,
  '42501',
  null,
  'another user cannot create a shift for the owner'
);
select ok(
  not has_table_privilege('authenticated', 'public.workplaces', 'delete'),
  'workplaces are archived instead of deleted by the client role'
);

select * from finish();
rollback;
