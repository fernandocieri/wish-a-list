import { supabase } from '@/lib/supabase'
import { toApiError } from '@/lib/errors'

// Legacy schema (single shared list). Rewritten for get_list() in Batch 4.

/** Returns { [itemId]: { reservedBy, reservedAt } }. */
export async function fetchReservations() {
  const { data, error } = await supabase
    .from('reservations')
    .select('item_id, reserved_by, reserved_at')

  if (error) throw toApiError(error)

  const map = {}
  for (const row of data) {
    map[row.item_id] = {
      reservedBy: row.reserved_by,
      reservedAt: row.reserved_at,
    }
  }
  return map
}

/** Throws ApiError('already-reserved') when someone beat us to it. */
export async function reserveItem(itemId, reservedBy) {
  const { data, error } = await supabase
    .from('reservations')
    .insert({ item_id: itemId, reserved_by: reservedBy })
    .select()
    .single()

  if (error) throw toApiError(error)

  return { reservedBy: data.reserved_by, reservedAt: data.reserved_at }
}
