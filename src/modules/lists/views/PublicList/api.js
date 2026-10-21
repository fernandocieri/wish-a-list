import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

const LOCAL_KEY = 'wishlist-reservations-demo'

/**
 * Every function below returns { data, error } and throws nothing, so the
 * UI can handle both cases the same way regardless of backend.
 */

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeLocal(map) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(map))
}

export async function fetchReservations() {
  if (!isSupabaseConfigured) {
    // Local demo mode: { itemId: { reservedBy, reservedAt } }
    return { data: readLocal(), error: null }
  }

  const { data, error } = await supabase
    .from('reservations')
    .select('item_id, reserved_by, reserved_at')

  if (error) return { data: null, error }

  const map = {}
  for (const row of data) {
    map[row.item_id] = { reservedBy: row.reserved_by, reservedAt: row.reserved_at }
  }
  return { data: map, error: null }
}

export async function reserveItem(itemId, reservedBy) {
  if (!isSupabaseConfigured) {
    const map = readLocal()
    if (map[itemId]) {
      return { data: null, error: { message: 'already-reserved' } }
    }
    map[itemId] = { reservedBy, reservedAt: new Date().toISOString() }
    writeLocal(map)
    return { data: map[itemId], error: null }
  }

  const { data, error } = await supabase
    .from('reservations')
    .insert({ item_id: itemId, reserved_by: reservedBy })
    .select()
    .single()

  if (error) {
    // Postgres unique_violation on item_id means someone beat us to it
    if (error.code === '23505') {
      return { data: null, error: { message: 'already-reserved' } }
    }
    return { data: null, error }
  }

  return { data: { reservedBy: data.reserved_by, reservedAt: data.reserved_at }, error: null }
}
