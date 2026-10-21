import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 pb-16 pt-8 sm:max-w-2xl">
      <h1 className="font-display text-2xl font-semibold leading-tight">
        Página no encontrada
      </h1>
      <Link
        to="/"
        className="mt-4 inline-block text-sm font-medium underline underline-offset-2"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
