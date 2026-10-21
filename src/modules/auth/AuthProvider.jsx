import { createContext, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { onAuthChange, signInWithGoogle, signOut } from './api'

export const AuthContext = createContext(null)

export default function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const userIdRef = useRef(null)

  useEffect(
    () =>
      onAuthChange((event, nextSession) => {
        const prevId = userIdRef.current
        const nextId = nextSession?.user.id ?? null
        // A new anonymous session (prevId null) keeps the cache; a different account must not see the old one's.
        if (event === 'SIGNED_OUT' || (prevId && nextId !== prevId)) {
          queryClient.clear()
        }
        userIdRef.current = nextId
        setSession(nextSession)
        setIsLoading(false)
      }),
    [queryClient],
  )

  const value = useMemo(() => {
    const user = session?.user ?? null
    return {
      user,
      hasAccount: Boolean(user && !user.is_anonymous),
      isLoading,
      signInWithGoogle,
      signOut,
    }
  }, [session, isLoading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
