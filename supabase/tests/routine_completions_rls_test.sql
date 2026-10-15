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
  (select relrowsecurity from pg_class where oid = 'public.routine_completions'::regclass),
  'routine completions has RLS enabled'
);

set local role anon;
select throws_ok(
  $$select * from public.routine_completions$$,
  '42501',
  null,
  'anonymous users cannot read completions'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select results_eq(
  $$insert into public.routine_completions (
      id, routine_id, user_id, routine_date
    ) values (
      'cccccccc-cccc-cccc-cccc-cccccccccccc',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      '11111111-1111-1111-1111-111111111111',
      '2026-10-13'
    ) returning routine_date::text$$,
  array['2026-10-13'],
  'the owner creates a completion'
);
select results_eq(
  $$select routine_date::text from public.routine_completions$$,
  array['2026-10-13'],
  'the owner reads their completion'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select is_empty(
  $$select * from public.routine_completions$$,
  'another user cannot read the owner completion'
);
select throws_ok(
  $$insert into public.routine_completions (
      routine_id, user_id, routine_date
    ) values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      '11111111-1111-1111-1111-111111111111',
      '2026-10-14'
    )$$,
  '42501',
  null,
  'another user cannot create an owner completion'
);
select is_empty(
  $$update public.routine_completions set note = '탈취' returning id$$,
  'another user cannot update the owner completion'
);
select is_empty(
  $$delete from public.routine_completions returning id$$,
  'another user cannot delete the owner completion'
);

select * from finish();
rollback;
