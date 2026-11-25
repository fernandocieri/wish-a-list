import { supabase } from '@/lib/supabase'
import { toApiError } from '@/lib/errors'

// Owner data only: nothing here reads or writes reservations (docs/structure.md rule 5).

/** The signed-in owner's lists (RLS returns only theirs), newest first, with an item count. */
export async function fetchMyLists() {
  const { data, error } = await supabase
    .from('lists')
    .select('id, title, share_slug, created_at, items(count)')
    .order('created_at', { ascending: false })

  if (error) throw toApiError(error)

  return data.map(({ items, ...list }) => ({
    ...list,
    item_count: items[0]?.count ?? 0,
  }))
}

/** Throws ApiError('list_limit') past 20 lists. The share slug is set by the database. */
export async function createList(title) {
  const { data, error } = await supabase
    .from('lists')
    .insert({ title: title.trim() })
    .select('id, title, share_slug')
    .single()

  if (error) throw toApiError(error)
  return data
}

export async function renameList(id, title) {
  const { data, error } = await supabase
    .from('lists')
    .update({ title: title.trim() })
    .eq('id', id)
    .select('id, title')
    .single()

  if (error) throw toApiError(error)
  return data
}

/** Its items and their reservations go with it (on delete cascade). */
export async function deleteList(id) {
  const { error } = await supabase.from('lists').delete().eq('id', id)
  if (error) throw toApiError(error)
}
