import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { APP_NAME } from '@/config'
import { useAuth } from '@/modules/auth'

export default function Layout() {
  const { hasAccount, signOut } = useAuth()
  const [signOutFailed, setSignOutFailed] = useState(false)

  async function handleSignOut() {
    setSignOutFailed(false)
    try {
      await signOut()
    } catch {
      setSignOutFailed(true)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-4 pt-4 sm:max-w-2xl">
        <Link to="/" className="font-display text-sm font-semibold">
          {APP_NAME}
        </Link>
        {hasAccount && (
          <button
            type="button"
            onClick={handleSignOut}
            data-testid="sign-out"
            className="rounded-pill border border-neutral-300 px-3 py-1 text-xs font-medium"
          >
            Cerrar sesión
          </button>
        )}
      </header>
      {signOutFailed && (
        <p
          role="alert"
          className="mx-auto w-full max-w-md px-4 pt-2 text-sm text-red-600 sm:max-w-2xl"
        >
          No se ha podido cerrar la sesión. Inténtalo de nuevo.
        </p>
      )}

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mx-auto w-full max-w-md px-4 pb-6 text-xs text-neutral-500 sm:max-w-2xl">
        <Link to="/privacy" className="underline underline-offset-2">
          Política de privacidad
        </Link>
      </footer>
    </div>
  )
}
