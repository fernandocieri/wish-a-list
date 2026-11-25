import { supabase } from '@/lib/supabase'
import { ApiError, toApiError } from '@/lib/errors'
import { ensureSession } from '@/modules/auth'

/**
 * The list behind a share slug, through get_list() (the only read path for reservations).
 * { id, title, is_owner, items: [{ ..., reservation: { reserved_by, is_mine } | null }] }.
 * The database leaves reservation out when the caller owns the list.
 * Throws ApiError('not-found') for an unknown slug.
 */
export async function fetchPublicList(slug) {
  const { data, error } = await supabase.rpc('get_list', { p_slug: slug })

  if (error) throw toApiError(error)
  if (!data) throw new ApiError('not-found')
  return data
}

/**
 * Creates an anonymous session on the first reserve, so the friend can undo it later.
 * reserver_id defaults to auth.uid() in the database.
 * Throws ApiError 'already-reserved', 'reservation_limit' or 'anonymous-disabled'.
 */
export async function reserveItem(itemId, reservedBy) {
  await ensureSession()

  const { error } = await supabase
    .from('reservations')
    .insert({ item_id: itemId, reserved_by: reservedBy.trim() })

  if (error) throw toApiError(error)
}

/** RLS only lets the reserver delete it. Throws ApiError('not-found') when nothing was deleted. */
export async function undoReservation(itemId) {
  const { data, error } = await supabase
    .from('reservations')
    .delete()
    .eq('item_id', itemId)
    .select('id')

  if (error) throw toApiError(error)
  if (data.length === 0) throw new ApiError('not-found')
}
