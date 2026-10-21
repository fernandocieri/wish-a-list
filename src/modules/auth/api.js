import { supabase } from '@/lib/supabase'
import { toApiError } from '@/lib/errors'

/** Subscribes to session changes (fires INITIAL_SESSION right away). Returns the unsubscribe function. */
export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange(callback)
  return () => data.subscription.unsubscribe()
}

/** Redirects to Google; the session arrives back on "/" through onAuthChange. */
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
  if (error) throw toApiError(error)
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw toApiError(error)
}
