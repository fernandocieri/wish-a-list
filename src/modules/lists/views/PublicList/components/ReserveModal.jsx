import { useState } from 'react'

export default function ReserveModal({ item, onClose, onConfirm, error, isSubmitting }) {
  const [name, setName] = useState('')

  if (!item) return null

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onConfirm(trimmed)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-t-2xl bg-paper p-5 sm:rounded-2xl"
      >
        <p className="font-display text-base font-semibold">Reservar «{item.title}»</p>
        <p className="mt-1 text-sm text-neutral-500">
          Escribe tu nombre para que el resto sepa que ya está pillado. Esta acción no se puede deshacer.
        </p>

        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          className="mt-4 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus-visible:border-ink"
        />

        {error && (
          <p className="mt-2 text-sm text-red-600">
            {error === 'already-reserved'
              ? 'Justo lo ha reservado otra persona. Actualiza la página para ver el estado.'
              : 'No se ha podido guardar la reserva. Inténtalo de nuevo.'}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-pill border border-neutral-300 px-4 py-2 text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="flex-1 rounded-pill bg-ink px-4 py-2 text-sm font-medium text-paper disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando…' : 'Confirmar'}
          </button>
        </div>
      </form>
    </div>
  )
}
