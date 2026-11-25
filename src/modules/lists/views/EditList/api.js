import { supabase } from '@/lib/supabase'
import { ApiError, toApiError } from '@/lib/errors'

// Owner-only item data. Never select reservations here (docs/structure.md rule 5).
const ITEM_COLUMNS =
  'id, title, subtitle, section, price, price_label, buy_link, image_link'

/** The list and its items in creation order. Throws ApiError('not-found') for a missing or foreign list. */
export async function fetchEditableList(id) {
  const { data, error } = await supabase
    .from('lists')
    .select(`id, title, share_slug, items(${ITEM_COLUMNS})`)
    .eq('id', id)
    .order('position', { referencedTable: 'items' })
    .order('created_at', { referencedTable: 'items' })
    .maybeSingle()

  if (error) throw toApiError(error)
  // RLS hides other owners' lists, so "not yours" and "does not exist" look the same.
  if (!data) throw new ApiError('not-found')
  return data
}

/** Throws ApiError('item_limit') past 200 items. */
export async function createItem(listId, fields) {
  const { data, error } = await supabase
    .from('items')
    .insert({ ...fields, list_id: listId })
    .select(ITEM_COLUMNS)
    .single()

  if (error) throw toApiError(error)
  return data
}

export async function updateItem(id, fields) {
  const { data, error } = await supabase
    .from('items')
    .update(fields)
    .eq('id', id)
    .select(ITEM_COLUMNS)
    .single()

  if (error) throw toApiError(error)
  return data
}

/** Its reservation goes with it (on delete cascade). */
export async function deleteItem(id) {
  const { error } = await supabase.from('items').delete().eq('id', id)
  if (error) throw toApiError(error)
}
