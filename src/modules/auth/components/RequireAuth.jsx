import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/** Owner-only routes: anyone without a real account goes back to "/". */
export default function RequireAuth({ children }) {
  const { hasAccount, isLoading } = useAuth()

  if (isLoading) return null
  if (!hasAccount) return <Navigate to="/" replace />
  return children
}
