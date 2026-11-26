-- =====================================================================
-- duplicate_list(list_id, title): copy one of the caller's lists with its items
-- Run once in the Supabase SQL Editor, after 001_multi_user.sql. Safe to re-run.
-- =====================================================================
-- - security invoker: runs with the caller's rights, so every existing rule applies
--   unchanged: RLS hides other owners' lists, lists_insert_own rejects anonymous
--   sessions, enforce_limits() raises list_limit, set_share_slug() gives the copy
--   its own share link.
-- - Atomic: the list and its items are inserted in one transaction, so a failure
--   never leaves a half-copied list.
-- - Reservations are never copied: the copy starts with every item free.
-- - Returns the new list's id, or null when the source is not one of the caller's lists.
create or replace function public.duplicate_list(p_list_id uuid, p_title text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_new_id uuid;
begin
  insert into public.lists (title)
    select p_title from public.lists where id = p_list_id
    returning id into v_new_id;

  if v_new_id is null then
    return null;
  end if;

  -- created_at is copied so the copy keeps the source's order (position, created_at).
  insert into public.items
    (list_id, title, subtitle, section, price, price_label, buy_link, image_link, position, created_at)
  select v_new_id, title, subtitle, section, price, price_label, buy_link, image_link, position, created_at
  from public.items
  where list_id = p_list_id;

  return v_new_id;
end $$;

revoke all on function public.duplicate_list(uuid, text) from public, anon;
grant execute on function public.duplicate_list(uuid, text) to authenticated;
