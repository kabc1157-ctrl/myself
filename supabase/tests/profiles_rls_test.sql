begin;
select plan(8);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'other@example.com');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  'profiles has RLS enabled'
);

set local role anon;
select throws_ok(
  $$select * from public.profiles$$,
  '42501',
  null,
  'anonymous users cannot read profiles'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select results_eq(
  $$insert into public.profiles (id, display_name)
    values ('11111111-1111-1111-1111-111111111111', '소유자')
    returning display_name$$,
  array['소유자'],
  'the owner creates their profile'
);
select results_eq(
  $$select display_name from public.profiles$$,
  array['소유자'],
  'the owner reads their profile'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select is_empty(
  $$select * from public.profiles$$,
  'another user cannot read the owner profile'
);
select is_empty(
  $$update public.profiles set display_name = '탈취' returning display_name$$,
  'another user cannot update the owner profile'
);
select throws_ok(
  $$insert into public.profiles (id, display_name)
    values ('11111111-1111-1111-1111-111111111111', '탈취')$$,
  '42501',
  null,
  'another user cannot insert an owner profile'
);
select ok(
  not has_table_privilege('authenticated', 'public.profiles', 'delete'),
  'profiles cannot be deleted through the client role'
);

select * from finish();
rollback;
