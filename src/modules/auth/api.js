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

/**
 * The stored session is trusted without a server round-trip, so a user deleted after signing in
 * keeps a valid-looking token. Asks the server and drops the session locally if the user is gone.
 * Other failures (e.g. offline) keep the session.
 */
export async function dropSessionIfUserGone() {
  const { error } = await supabase.auth.getUser()
  if (error?.code !== 'user_not_found') return
  await supabase.auth.signOut({ scope: 'local' })
}

/**
 * Makes sure there is a session before a friend reserves, creating an anonymous one if needed.
 * Called lazily on the first reserve, never just for viewing a list.
 * Throws ApiError('anonymous-disabled') when the project has anonymous sign-ins switched off.
 */
export async function ensureSession() {
  const { data } = await supabase.auth.getSession()
  if (data.session) return
  const { error } = await supabase.auth.signInAnonymously()
  if (error) throw toApiError(error)
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw toApiError(error)
}
