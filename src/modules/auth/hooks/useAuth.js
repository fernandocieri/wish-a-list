import { useContext } from 'react'
import { AuthContext } from '../AuthProvider'

/** { user, hasAccount, isLoading, signInWithGoogle, signOut }. hasAccount is false for anonymous friends. */
export function useAuth() {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth must be used inside <AuthProvider>')
  return auth
}
