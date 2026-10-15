begin;
select plan(8);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'other@example.com');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.journal_entries'::regclass),
  'journal entries have RLS enabled'
);

set local role anon;
select throws_ok(
  $$select * from public.journal_entries$$,
  '42501',
  null,
  'anonymous users cannot read journal entries'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select lives_ok(
  $$insert into public.journal_entries (user_id, entry_date, body, mood)
    values ('11111111-1111-1111-1111-111111111111', '2026-10-13', '오늘의 기록', 4)$$,
  'the owner creates a journal entry'
);
select results_eq(
  $$select body from public.journal_entries$$,
  array['오늘의 기록'],
  'the owner reads their journal entry'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select is_empty(
  $$select * from public.journal_entries$$,
  'another user cannot read the owner journal entry'
);
select is_empty(
  $$update public.journal_entries set body = '탈취' returning body$$,
  'another user cannot update the owner journal entry'
);
select throws_ok(
  $$insert into public.journal_entries (user_id, entry_date, body)
    values ('11111111-1111-1111-1111-111111111111', '2026-10-14', '탈취')$$,
  '42501',
  null,
  'another user cannot create an entry for the owner'
);
select ok(
  not has_table_privilege('authenticated', 'public.journal_entries', 'delete'),
  'journal entries are not deleted by the client role'
);

select * from finish();
rollback;
