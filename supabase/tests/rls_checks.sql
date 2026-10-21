-- =====================================================================
-- RLS, grants and get_list() checks for 001_multi_user.sql
-- Paste into the Supabase SQL Editor of the DEV project and run.
-- Everything runs in one transaction that is rolled back: nothing is kept.
-- Pass: the last result reads "all RLS checks passed".
-- Fail: an error "FAIL <n>: ..." naming the check. (psql also prints a NOTICE per pass.)
--
-- Fixtures (fixed ids so every statement can name them):
--   owner A  00000000-0000-0000-0000-0000000000a1  list LA ...0001-...a1  items IA1 ...0002-...a1, IA2 ...0002-...a2
--   owner B  00000000-0000-0000-0000-0000000000b1  list LB ...0001-...b1  item  IB1 ...0002-...b1
--   friend F1 00000000-0000-0000-0000-0000000000f1 (anonymous session)
--   friend F2 00000000-0000-0000-0000-0000000000f2 (anonymous session)
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- Helpers (rolled back with everything else)
-- ---------------------------------------------------------------------
create function public._rls_check(p_label text, p_ok boolean)
returns void language plpgsql as $$
begin
  if p_ok is not true then
    raise exception 'FAIL %', p_label;
  end if;
  raise notice 'PASS %', p_label;
end $$;

-- Runs p_sql and requires it to fail with p_sqlstate (and p_message, if given).
create function public._rls_expect_error(p_label text, p_sql text, p_sqlstate text, p_message text default null)
returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    if sqlstate <> p_sqlstate or sqlerrm <> coalesce(p_message, sqlerrm) then
      raise exception 'FAIL %: expected % %, got % %', p_label, p_sqlstate, coalesce(p_message, ''), sqlstate, sqlerrm;
    end if;
    raise notice 'PASS %', p_label;
    return;
  end;
  raise exception 'FAIL %: statement succeeded, expected %', p_label, p_sqlstate;
end $$;

-- The "reservation" value get_list() returns for one item, as the current user.
create function public._rls_reservation(p_slug text, p_item uuid)
returns jsonb language sql as $$
  select e -> 'reservation'
  from jsonb_array_elements(public.get_list(p_slug) -> 'items') e
  where (e ->> 'id')::uuid = p_item
$$;

-- True when p_slug is p_prefix followed by exactly 16 Base58 chars.
create function public._rls_slug_is(p_slug text, p_prefix text)
returns boolean language sql as $$
  select p_slug ~ ('^' || p_prefix || '[1-9A-HJ-NP-Za-km-z]{16}$')
$$;

grant execute on function
  public._rls_check(text, boolean),
  public._rls_expect_error(text, text, text, text),
  public._rls_reservation(text, uuid),
  public._rls_slug_is(text, text)
to anon, authenticated;

-- ---------------------------------------------------------------------
-- 12. Table grants are explicit (checked first, as postgres)
-- ---------------------------------------------------------------------
select public._rls_check('12a: authenticated has exactly the expected table privileges', (
  select string_agg(table_name || ':' || privilege_type, ',' order by table_name, privilege_type)
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name in ('lists', 'items', 'reservations')
    and grantee = 'authenticated'
) = 'items:DELETE,items:INSERT,items:SELECT,items:UPDATE,'
    'lists:DELETE,lists:INSERT,lists:SELECT,'
    'reservations:DELETE,reservations:INSERT,reservations:SELECT');

select public._rls_check('12c: on lists, authenticated can update only the title', (
  select string_agg(column_name, ',')
  from information_schema.role_column_grants
  where table_schema = 'public'
    and table_name = 'lists'
    and grantee = 'authenticated'
    and privilege_type = 'UPDATE'
) = 'title');

select public._rls_check('12b: anon and PUBLIC have no privileges on lists, items, reservations', not exists (
  select 1
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name in ('lists', 'items', 'reservations')
    and grantee in ('anon', 'PUBLIC')
));

-- ---------------------------------------------------------------------
-- Fixtures
-- ---------------------------------------------------------------------
insert into auth.users (instance_id, id, aud, role, email) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated', 'rls-owner-a@example.test'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000b1', 'authenticated', 'authenticated', 'rls-owner-b@example.test'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000f1', 'authenticated', 'authenticated', null),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000f2', 'authenticated', 'authenticated', null);

-- Owner A creates a list with two items (also proves a real account can).
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","is_anonymous":false}';
insert into public.lists (id, title)
  values ('00000000-0000-0000-0001-0000000000a1', 'Lista de A');
insert into public.items (id, list_id, title, buy_link) values
  ('00000000-0000-0000-0002-0000000000a1', '00000000-0000-0000-0001-0000000000a1', 'Libro', 'https://example.com/1'),
  ('00000000-0000-0000-0002-0000000000a2', '00000000-0000-0000-0001-0000000000a1', 'Taza', 'https://example.com/2');
-- The slug is random, so keep it in a setting every role can read.
select set_config('rls.slug_a', share_slug, true)
from public.lists where id = '00000000-0000-0000-0001-0000000000a1';

-- Owner B creates a list with one item.
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated","is_anonymous":false}';
insert into public.lists (id, title)
  values ('00000000-0000-0000-0001-0000000000b1', 'Lista de B');
insert into public.items (id, list_id, title, buy_link)
  values ('00000000-0000-0000-0002-0000000000b1', '00000000-0000-0000-0001-0000000000b1', 'Bufanda', 'https://example.com/3');

-- ---------------------------------------------------------------------
-- 1. The anon role cannot select from the tables
-- ---------------------------------------------------------------------
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select public._rls_expect_error('1a: anon cannot select lists', 'select * from public.lists', '42501');
select public._rls_expect_error('1b: anon cannot select items', 'select * from public.items', '42501');
select public._rls_expect_error('1c: anon cannot select reservations', 'select * from public.reservations', '42501');

-- ---------------------------------------------------------------------
-- 2. An anonymous-session user cannot insert a list
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000f1","role":"authenticated","is_anonymous":true}';
select public._rls_expect_error('2: an anonymous session cannot insert a list',
  $$insert into public.lists (title) values ('Lista anónima')$$, '42501');

-- ---------------------------------------------------------------------
-- 3. Owner A cannot read, update or delete owner B's list or items
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","is_anonymous":false}';
select public._rls_check('3a: A cannot read B''s list',
  (select count(*) from public.lists where id = '00000000-0000-0000-0001-0000000000b1') = 0);
select public._rls_check('3b: A cannot read B''s items',
  (select count(*) from public.items where list_id = '00000000-0000-0000-0001-0000000000b1') = 0);
with u as (update public.lists set title = 'hacked' where id = '00000000-0000-0000-0001-0000000000b1' returning 1)
select public._rls_check('3c: A cannot update B''s list', (select count(*) from u) = 0);
with d as (delete from public.lists where id = '00000000-0000-0000-0001-0000000000b1' returning 1)
select public._rls_check('3d: A cannot delete B''s list', (select count(*) from d) = 0);
with u as (update public.items set title = 'hacked' where list_id = '00000000-0000-0000-0001-0000000000b1' returning 1)
select public._rls_check('3e: A cannot update B''s items', (select count(*) from u) = 0);
with d as (delete from public.items where list_id = '00000000-0000-0000-0001-0000000000b1' returning 1)
select public._rls_check('3f: A cannot delete B''s items', (select count(*) from d) = 0);
select public._rls_expect_error('3g: A cannot add an item to B''s list',
  $$insert into public.items (list_id, title, buy_link)
    values ('00000000-0000-0000-0001-0000000000b1', 'Intruso', 'https://example.com/x')$$, '42501');
select public._rls_expect_error('3h: A cannot move an item into B''s list',
  $$update public.items set list_id = '00000000-0000-0000-0001-0000000000b1'
    where id = '00000000-0000-0000-0002-0000000000a2'$$, '42501');

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated","is_anonymous":false}';
select public._rls_check('3i: B''s list and items are intact',
  (select title from public.lists where id = '00000000-0000-0000-0001-0000000000b1') = 'Lista de B'
  and (select count(*) from public.items where list_id = '00000000-0000-0000-0001-0000000000b1') = 1);

-- Friend F1 reserves IA1 (also proves a friend can reserve).
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000f1","role":"authenticated","is_anonymous":true}';
insert into public.reservations (item_id, reserved_by) values ('00000000-0000-0000-0002-0000000000a1', 'Ana');

-- ---------------------------------------------------------------------
-- 4. get_list() as the owner returns items with no reservation data
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","is_anonymous":false}';
select public._rls_check('4a: get_list marks the caller as owner',
  (public.get_list(current_setting('rls.slug_a')) ->> 'is_owner')::boolean);
select public._rls_check('4b: owner gets both items, none with a reservation',
  jsonb_array_length(public.get_list(current_setting('rls.slug_a')) -> 'items') = 2
  and not exists (
    select 1 from jsonb_array_elements(public.get_list(current_setting('rls.slug_a')) -> 'items') e
    where jsonb_typeof(e -> 'reservation') <> 'null'
  ));
select public._rls_check('4c: the reserver''s name appears nowhere in the owner''s response',
  public.get_list(current_setting('rls.slug_a'))::text not like '%Ana%');
select public._rls_check('4d: owner cannot read reservations from the table',
  (select count(*) from public.reservations) = 0);

-- ---------------------------------------------------------------------
-- 5. get_list() returns reservations, is_mine = true only for the reserver
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000f1","role":"authenticated","is_anonymous":true}';
select public._rls_check('5a: the reserver sees is_mine = true',
  public._rls_reservation(current_setting('rls.slug_a'), '00000000-0000-0000-0002-0000000000a1')
    = '{"reserved_by":"Ana","is_mine":true}'::jsonb);
select public._rls_check('5b: a free item has no reservation',
  public._rls_reservation(current_setting('rls.slug_a'), '00000000-0000-0000-0002-0000000000a2') = 'null'::jsonb);

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000f2","role":"authenticated","is_anonymous":true}';
select public._rls_check('5c: another friend sees the reservation with is_mine = false',
  public._rls_reservation(current_setting('rls.slug_a'), '00000000-0000-0000-0002-0000000000a1')
    = '{"reserved_by":"Ana","is_mine":false}'::jsonb);

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated","is_anonymous":false}';
select public._rls_check('5d: another real account sees is_mine = false',
  public._rls_reservation(current_setting('rls.slug_a'), '00000000-0000-0000-0002-0000000000a1')
    = '{"reserved_by":"Ana","is_mine":false}'::jsonb);

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select public._rls_check('5e: a logged-out visitor sees is_mine = false and is_owner = false',
  public._rls_reservation(current_setting('rls.slug_a'), '00000000-0000-0000-0002-0000000000a1')
    = '{"reserved_by":"Ana","is_mine":false}'::jsonb
  and (public.get_list(current_setting('rls.slug_a')) ->> 'is_owner')::boolean = false);

-- ---------------------------------------------------------------------
-- 6. A second reservation on the same item fails with 23505
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000f2","role":"authenticated","is_anonymous":true}';
select public._rls_expect_error('6: a second reservation on the same item is a unique violation',
  $$insert into public.reservations (item_id, reserved_by)
    values ('00000000-0000-0000-0002-0000000000a1', 'Beto')$$, '23505');

-- ---------------------------------------------------------------------
-- 7. An owner cannot reserve an item from their own list
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","is_anonymous":false}';
select public._rls_expect_error('7: the owner cannot reserve from their own list',
  $$insert into public.reservations (item_id, reserved_by)
    values ('00000000-0000-0000-0002-0000000000a2', 'Yo')$$, '42501');

-- ---------------------------------------------------------------------
-- 8. Only the reserver can delete a reservation; nobody can update one
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000f2","role":"authenticated","is_anonymous":true}';
with d as (delete from public.reservations where item_id = '00000000-0000-0000-0002-0000000000a1' returning 1)
select public._rls_check('8a: another friend cannot delete the reservation', (select count(*) from d) = 0);
select public._rls_expect_error('8b: another friend cannot update the reservation',
  $$update public.reservations set reserved_by = 'Beto'$$, '42501');

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000f1","role":"authenticated","is_anonymous":true}';
select public._rls_expect_error('8c: the reserver cannot update their own reservation',
  $$update public.reservations set reserved_by = 'Ana María'$$, '42501');
with d as (delete from public.reservations where item_id = '00000000-0000-0000-0002-0000000000a1' returning 1)
select public._rls_check('8d: the reserver can delete their own reservation', (select count(*) from d) = 1);
select public._rls_check('8e: after undo the item is free again',
  public._rls_reservation(current_setting('rls.slug_a'), '00000000-0000-0000-0002-0000000000a1') = 'null'::jsonb);

-- ---------------------------------------------------------------------
-- 9. Non-http(s) links are rejected by the check constraints
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","is_anonymous":false}';
select public._rls_expect_error('9a: buy_link javascript:alert(1) is rejected',
  $$insert into public.items (list_id, title, buy_link)
    values ('00000000-0000-0000-0001-0000000000a1', 'XSS', 'javascript:alert(1)')$$, '23514');
select public._rls_expect_error('9b: image_link javascript:alert(1) is rejected',
  $$insert into public.items (list_id, title, buy_link, image_link)
    values ('00000000-0000-0000-0001-0000000000a1', 'XSS', 'https://example.com', 'javascript:alert(1)')$$, '23514');

-- ---------------------------------------------------------------------
-- 13. Share slug: readable prefix + 16 Base58 chars, set only by the database
-- ---------------------------------------------------------------------
-- Still owner A.
select public._rls_check('13a: the prefix comes from the title',
  public._rls_slug_is(current_setting('rls.slug_a'), 'lista-de-a-'));
with i as (insert into public.lists (title) values ('Navidad 2026 🎄 – Familia Pérez') returning share_slug)
select public._rls_check('13b: accents, emoji and symbols are normalized',
  public._rls_slug_is((select share_slug from i), 'navidad-2026-familia-perez-'));
with i as (insert into public.lists (title) values ('Lista de regalos para el baby shower de Lucía') returning share_slug)
select public._rls_check('13c: a long title is cut at a word boundary within 30 chars',
  public._rls_slug_is((select share_slug from i), 'lista-de-regalos-para-el-baby-'));
with i as (insert into public.lists (title) values ('Supercalifragilisticoespialidoso') returning share_slug)
select public._rls_check('13d: a single word longer than 30 chars is cut at 30',
  public._rls_slug_is((select share_slug from i), 'supercalifragilisticoespialido-'));
with i as (insert into public.lists (title) values ('🎁🎁🎁') returning share_slug)
select public._rls_check('13e: a title with nothing usable gets only the suffix',
  public._rls_slug_is((select share_slug from i), ''));
with i as (insert into public.lists (title, share_slug) values ('Elegida', 'mi-slug-elegido') returning share_slug)
select public._rls_check('13f: a slug sent by the client is ignored',
  public._rls_slug_is((select share_slug from i), 'elegida-'));
with i as (insert into public.lists (title) values ('Cumpleaños'), ('Cumpleaños') returning share_slug)
select public._rls_check('13g: two lists with the same title get different slugs',
  (select count(distinct share_slug) from i) = 2
  and (select bool_and(public._rls_slug_is(share_slug, 'cumpleanos-')) from i));
select public._rls_expect_error('13h: the owner cannot change the slug',
  $$update public.lists set share_slug = 'cumpleanos-1111111111111111'
    where id = '00000000-0000-0000-0001-0000000000a1'$$, '42501');
with u as (
  update public.lists set title = 'Lista de A renombrada'
  where id = '00000000-0000-0000-0001-0000000000a1'
  returning share_slug
)
select public._rls_check('13i: renaming works and keeps the slug',
  (select share_slug from u) = current_setting('rls.slug_a'));

-- ---------------------------------------------------------------------
-- 10. Limits: 21st list, 201st item, 11th reservation by one user in one list
-- ---------------------------------------------------------------------
-- Still owner A.
do $$
begin
  for i in 1..(20 - (select count(*) from public.lists))::int loop
    insert into public.lists (title) values ('Lista extra ' || i);
  end loop;
end $$;
select public._rls_expect_error('10a: the 21st list hits list_limit',
  $$insert into public.lists (title) values ('Lista 21')$$, 'P0001', 'list_limit');

do $$
begin
  for i in 1..(200 - (select count(*) from public.items where list_id = '00000000-0000-0000-0001-0000000000a1'))::int loop
    insert into public.items (list_id, title, buy_link)
      values ('00000000-0000-0000-0001-0000000000a1', 'Item ' || i, 'https://example.com/' || i);
  end loop;
end $$;
select public._rls_expect_error('10b: the 201st item hits item_limit',
  $$insert into public.items (list_id, title, buy_link)
    values ('00000000-0000-0000-0001-0000000000a1', 'Item 201', 'https://example.com/201')$$, 'P0001', 'item_limit');

insert into public.items (list_id, title, buy_link)
  select id, 'Para mover', 'https://example.com/move'
  from public.lists where id <> '00000000-0000-0000-0001-0000000000a1' limit 1;
select public._rls_expect_error('10c: moving an item into a full list hits item_limit',
  $$update public.items set list_id = '00000000-0000-0000-0001-0000000000a1'
    where title = 'Para mover'$$, 'P0001', 'item_limit');

-- Friend F2 reserves 10 items of list A (all free again after 8d), then an 11th.
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000f2","role":"authenticated","is_anonymous":true}';
do $$
declare
  v_item uuid;
begin
  for v_item in
    select (e ->> 'id')::uuid
    from jsonb_array_elements(public.get_list(current_setting('rls.slug_a')) -> 'items') e
    limit 10
  loop
    insert into public.reservations (item_id, reserved_by) values (v_item, 'Beto');
  end loop;
end $$;
select public._rls_expect_error('10d: the 11th reservation in one list hits reservation_limit',
  $$insert into public.reservations (item_id, reserved_by)
    select (e ->> 'id')::uuid, 'Beto'
    from jsonb_array_elements(public.get_list(current_setting('rls.slug_a')) -> 'items') e
    offset 10 limit 1$$, 'P0001', 'reservation_limit');

-- ---------------------------------------------------------------------
-- 11. get_list() with an unknown or over-long slug returns null
-- ---------------------------------------------------------------------
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select public._rls_check('11a: unknown slug returns null', public.get_list('no_such_slug') is null);
select public._rls_check('11b: 65-character slug returns null', public.get_list(repeat('a', 65)) is null);
select public._rls_check('11c: null slug returns null', public.get_list(null) is null);

rollback;

-- Only reached when every check above passed.
select 'all RLS checks passed' as result;
