-- =====================================================================
-- Multi-user wishlist: lists, items, reservations
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Preserve the old single-list reservations table (if it exists)
--    so friends' existing reservations can be carried over by the seed.
--    The old table is locked down: RLS on, no policies => no API access.
-- ---------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'reservations'
      and column_name = 'item_id'
      and data_type = 'text'
  ) then
    alter table public.reservations rename to reservations_legacy;
    alter table public.reservations_legacy enable row level security;
    drop policy if exists "Public can read reservations" on public.reservations_legacy;
    drop policy if exists "Public can insert reservations" on public.reservations_legacy;
    revoke all on public.reservations_legacy from anon, authenticated;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------
create table if not exists public.lists (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title      text not null check (char_length(btrim(title)) between 1 and 100),
  -- Capability token used in the share link (/l/<slug>): a readable prefix from the
  -- title plus 16 random Base58 chars. Always set by set_share_slug(), never by the client.
  share_slug text not null unique check (
    char_length(share_slug) <= 47
    and share_slug ~ '^([a-z0-9]+(-[a-z0-9]+)*-)?[1-9A-HJ-NP-Za-km-z]{16}$'
  ),
  created_at timestamptz not null default now()
);
create index if not exists lists_owner_idx on public.lists (owner_id);

-- ---------------------------------------------------------------------
-- 1b. Share slug, e.g. "cumpleanos-de-ana-7KpQmZ9vR4tL8wNc"
--     Only the suffix carries security (~94 bits); the prefix is decoration.
--     The slug never changes after creation, so shared links keep working.
-- ---------------------------------------------------------------------
create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_share_slug()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  c_base58 constant text := '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  v_prefix text;
  v_suffix text := '';
  v_byte   int;
begin
  -- Prefix: accents stripped, lowercased, anything else turned into "-", capped at
  -- 30 chars on a word boundary (a single longer word is cut). Empty if nothing is left.
  v_prefix := lower(translate(new.title,
    'ÁÀÂÄÃÅÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑÇÝáàâäãåéèêëíìîïóòôöõúùûüñçý',
    'AAAAAAEEEEIIIIOOOOOUUUUNCYaaaaaaeeeeiiiiooooouuuuncy'));
  v_prefix := trim(both '-' from regexp_replace(v_prefix, '[^a-z0-9]+', '-', 'g'));
  if char_length(v_prefix) > 30 then
    v_prefix := case
      when substr(v_prefix, 31, 1) = '-' then left(v_prefix, 30)
      when strpos(left(v_prefix, 30), '-') > 0 then regexp_replace(left(v_prefix, 30), '-[^-]*$', '')
      else left(v_prefix, 30)
    end;
  end if;

  -- Suffix: 16 Base58 chars from a CSPRNG. Bytes >= 232 (4 * 58) are skipped so
  -- every character is equally likely. A collision is ~impossible and would hit
  -- the unique constraint (23505) rather than share a link.
  while char_length(v_suffix) < 16 loop
    v_byte := get_byte(extensions.gen_random_bytes(1), 0);
    if v_byte < 232 then
      v_suffix := v_suffix || substr(c_base58, v_byte % 58 + 1, 1);
    end if;
  end loop;

  new.share_slug := case when v_prefix = '' then '' else v_prefix || '-' end || v_suffix;
  return new;
end $$;

drop trigger if exists lists_share_slug on public.lists;
create trigger lists_share_slug before insert on public.lists
  for each row execute function public.set_share_slug();

create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  list_id     uuid not null references public.lists (id) on delete cascade,
  title       text not null check (char_length(btrim(title)) between 1 and 200),
  author      text check (author is null or char_length(author) <= 200),
  section     text not null default 'Regalos' check (char_length(btrim(section)) between 1 and 100),
  price       numeric(10, 2) check (price is null or price >= 0),
  price_label text check (price_label is null or char_length(price_label) <= 40),
  -- Only http(s) links: blocks javascript:, data:, etc.
  buy_link    text not null check (buy_link ~* '^https?://' and char_length(buy_link) <= 2000),
  image_link  text check (image_link is null or (image_link ~* '^https?://' and char_length(image_link) <= 2000)),
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists items_list_idx on public.items (list_id);

create table if not exists public.reservations (
  id          uuid not null default gen_random_uuid(),
  item_id     uuid not null references public.items (id) on delete cascade,
  reserved_by text not null check (char_length(btrim(reserved_by)) between 1 and 40),
  -- Who can undo it. Null for reservations migrated from the old app.
  -- "on delete set null": cleaning up anonymous users never drops a reservation.
  reserver_id uuid default auth.uid() references auth.users (id) on delete set null,
  reserved_at timestamptz not null default now(),
  constraint reservations_v2_pkey primary key (id),
  constraint reservations_item_unique unique (item_id)
);

-- ---------------------------------------------------------------------
-- 2. Row Level Security
-- ---------------------------------------------------------------------
alter table public.lists        enable row level security;
alter table public.items        enable row level security;
alter table public.reservations enable row level security;

-- Logged-out visitors (role "anon") never touch tables directly.
-- Friends read lists through get_list(), which is a controlled gateway.
-- Projects created before 2026-10-30 still auto-grant everything (including
-- UPDATE and TRUNCATE) to anon and authenticated, so start from zero.
revoke all on public.lists, public.items, public.reservations from anon, authenticated;

-- Since 2026-10-30 Supabase no longer grants Data API access to new tables
-- automatically, so every table needs explicit grants. RLS below still decides
-- which rows each user can touch. No grants to anon or service_role: friends go
-- through get_list(), and reservations have no UPDATE (never edited).
-- Owners can rename a list and nothing else: share_slug, owner_id and id are fixed.
grant select, insert, delete on public.lists to authenticated;
grant update (title) on public.lists to authenticated;
grant select, insert, update, delete on public.items to authenticated;
grant select, insert, delete on public.reservations to authenticated;

-- NOTE: anonymous sign-in users have the "authenticated" role too.
-- Every policy below is therefore tied to ownership (auth.uid()), never
-- to the role alone, and list creation explicitly rejects anonymous users.

-- ---- lists: owners manage their own, and only real (non-anonymous) accounts can create
drop policy if exists lists_select_own on public.lists;
create policy lists_select_own on public.lists
  for select to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists lists_insert_own on public.lists;
create policy lists_insert_own on public.lists
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
  );

drop policy if exists lists_update_own on public.lists;
create policy lists_update_own on public.lists
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists lists_delete_own on public.lists;
create policy lists_delete_own on public.lists
  for delete to authenticated
  using (owner_id = (select auth.uid()));

-- ---- items: full control only through ownership of the parent list
drop policy if exists items_owner_all on public.items;
create policy items_owner_all on public.items
  for all to authenticated
  using (exists (
    select 1 from public.lists l
    where l.id = items.list_id and l.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.lists l
    where l.id = items.list_id and l.owner_id = (select auth.uid())
  ));

-- ---- reservations
-- Each user can only SEE their own reservations here (this is what powers
-- "undo"). Everyone else's are exposed only through get_list(), and never
-- to the list's owner. List owners can't reserve from their own list.
drop policy if exists reservations_select_own on public.reservations;
create policy reservations_select_own on public.reservations
  for select to authenticated
  using (reserver_id = (select auth.uid()));

drop policy if exists reservations_insert on public.reservations;
create policy reservations_insert on public.reservations
  for insert to authenticated
  with check (
    reserver_id = (select auth.uid())
    and not exists (
      select 1
      from public.items i
      join public.lists l on l.id = i.list_id
      where i.id = reservations.item_id
        and l.owner_id = (select auth.uid())
    )
  );

drop policy if exists reservations_delete_own on public.reservations;
create policy reservations_delete_own on public.reservations
  for delete to authenticated
  using (reserver_id = (select auth.uid()));

-- No UPDATE policy on reservations: they can be created or undone, never edited.

-- ---------------------------------------------------------------------
-- 3. Abuse limits (open signup + anonymous users => cap what one account can do)
--    20 lists per owner, 200 items per list, 10 reservations per person per list.
-- ---------------------------------------------------------------------
create or replace function public.enforce_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'lists' then
    if (select count(*) from public.lists where owner_id = new.owner_id) >= 20 then
      raise exception 'list_limit';
    end if;

  elsif tg_table_name = 'items' then
    if (select count(*) from public.items where list_id = new.list_id) >= 200 then
      raise exception 'item_limit';
    end if;

  elsif tg_table_name = 'reservations' then
    if new.reserver_id is not null and (
      select count(*)
      from public.reservations r
      join public.items i on i.id = r.item_id
      where r.reserver_id = new.reserver_id
        and i.list_id = (select list_id from public.items where id = new.item_id)
    ) >= 10 then
      raise exception 'reservation_limit';
    end if;
  end if;

  return new;
end $$;

drop trigger if exists lists_limits on public.lists;
create trigger lists_limits before insert on public.lists
  for each row execute function public.enforce_limits();

drop trigger if exists items_limits on public.items;
create trigger items_limits before insert on public.items
  for each row execute function public.enforce_limits();

-- Moving an item into another list must respect that list's limit too.
drop trigger if exists items_limits_move on public.items;
create trigger items_limits_move before update of list_id on public.items
  for each row when (old.list_id is distinct from new.list_id)
  execute function public.enforce_limits();

drop trigger if exists reservations_limits on public.reservations;
create trigger reservations_limits before insert on public.reservations
  for each row execute function public.enforce_limits();

-- ---------------------------------------------------------------------
-- 4. get_list(slug): the only way a friend reads a list
--    - Returns one list + its items for a valid slug (no enumeration).
--    - If the caller is the list's owner, reservation info is omitted:
--      owners never see what is (or isn't) reserved.
--    - "is_mine" lets a friend see which reservations they can undo.
-- ---------------------------------------------------------------------
create or replace function public.get_list(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_list     public.lists%rowtype;
  v_is_owner boolean;
begin
  if p_slug is null or char_length(p_slug) > 64 then
    return null;
  end if;

  select * into v_list from public.lists where share_slug = p_slug;
  if not found then
    return null;
  end if;

  -- coalesce: auth.uid() is null for logged-out visitors
  v_is_owner := coalesce(v_list.owner_id = auth.uid(), false);

  return jsonb_build_object(
    'id', v_list.id,
    'title', v_list.title,
    'is_owner', v_is_owner,
    'items', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', i.id,
          'title', i.title,
          'author', i.author,
          'section', i.section,
          'price', i.price,
          'price_label', i.price_label,
          'buy_link', i.buy_link,
          'image_link', i.image_link,
          'reservation', case
            when v_is_owner or r.id is null then null
            else jsonb_build_object(
              'reserved_by', r.reserved_by,
              -- coalesce: null when either side is null (migrated rows, logged-out visitors)
              'is_mine', coalesce(r.reserver_id = auth.uid(), false)
            )
          end
        )
        order by i.position, i.created_at
      )
      from public.items i
      left join public.reservations r on r.item_id = i.id
      where i.list_id = v_list.id
    ), '[]'::jsonb)
  );
end $$;

revoke all on function public.get_list(text) from public;
grant execute on function public.get_list(text) to anon, authenticated;
