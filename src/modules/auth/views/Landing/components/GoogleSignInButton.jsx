import { useState } from 'react'
import { useAuth } from '../../../hooks/useAuth'

export default function GoogleSignInButton() {
  const { signInWithGoogle } = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [failed, setFailed] = useState(false)

  async function handleClick() {
    setFailed(false)
    setIsRedirecting(true)
    try {
      // On success the browser leaves for Google, so the pending state is never reset.
      await signInWithGoogle()
    } catch {
      setFailed(true)
      setIsRedirecting(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isRedirecting}
        data-testid="google-sign-in"
        className="w-full rounded-pill bg-ink px-4 py-3 text-sm font-medium text-paper disabled:opacity-50"
      >
        {isRedirecting ? 'Abriendo Google…' : 'Continuar con Google'}
      </button>
      {failed && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          No se ha podido iniciar sesión. Inténtalo de nuevo.
        </p>
      )}
    </div>
  )
}
