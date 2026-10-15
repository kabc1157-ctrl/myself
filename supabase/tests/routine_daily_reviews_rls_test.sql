begin;
select plan(8);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'other@example.com');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.routine_daily_reviews'::regclass),
  'routine daily reviews has RLS enabled'
);

set local role anon;
select throws_ok(
  $$select * from public.routine_daily_reviews$$,
  '42501',
  null,
  'anonymous users cannot read reviews'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select results_eq(
  $$insert into public.routine_daily_reviews (
      user_id, review_date, reflection, completion_count, total_count
    ) values (
      '11111111-1111-1111-1111-111111111111',
      '2026-10-13',
      '오늘의 회고',
      2,
      3
    ) returning reflection$$,
  array['오늘의 회고'],
  'the owner creates a daily review'
);
select results_eq(
  $$select reflection from public.routine_daily_reviews$$,
  array['오늘의 회고'],
  'the owner reads their daily review'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select is_empty(
  $$select * from public.routine_daily_reviews$$,
  'another user cannot read the owner review'
);
select throws_ok(
  $$insert into public.routine_daily_reviews (
      user_id, review_date, reflection, completion_count, total_count
    ) values (
      '11111111-1111-1111-1111-111111111111',
      '2026-10-14',
      '탈취',
      0,
      0
    )$$,
  '42501',
  null,
  'another user cannot create an owner review'
);
select is_empty(
  $$update public.routine_daily_reviews set reflection = '탈취' returning id$$,
  'another user cannot update the owner review'
);
select ok(
  not has_table_privilege('authenticated', 'public.routine_daily_reviews', 'delete'),
  'daily reviews cannot be deleted through the client role'
);

select * from finish();
rollback;
