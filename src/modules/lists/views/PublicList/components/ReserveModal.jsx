import { useId, useState } from 'react'
import { LIMITS, RESERVED_BY_MAX } from '@/config'
import Modal from '../../../components/Modal'
import { loadFriendName } from '../helpers/friendName'

const ERROR_MESSAGES = {
  'already-reserved':
    'Justo lo ha reservado otra persona. La lista ya está actualizada.',
  reservation_limit: `Ya has reservado ${LIMITS.reservationsPerList} regalos de esta lista, que es el máximo.`,
  'anonymous-disabled':
    'Ahora mismo no se pueden hacer reservas. Inténtalo más tarde.',
}
const FALLBACK_MESSAGE =
  'No se ha podido guardar la reserva. Inténtalo de nuevo.'

/** Mounted only while an item is being reserved; the name starts with the one used last time. */
export default function ReserveModal({
  item,
  onClose,
  onConfirm,
  errorCode,
  isSubmitting,
}) {
  const titleId = useId()
  const [name, setName] = useState(loadFriendName)

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onConfirm(trimmed)
  }

  return (
    <Modal onClose={onClose} labelledBy={titleId}>
      <form onSubmit={handleSubmit}>
        <p id={titleId} className="font-display text-base font-semibold">
          Reservar «{item.title}»
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          Escribe tu nombre para que el resto sepa que ya está pillado. Podrás
          deshacerlo desde este mismo navegador.
        </p>

        <input
          autoFocus
          type="text"
          name="name"
          value={name}
          maxLength={RESERVED_BY_MAX}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          aria-label="Tu nombre"
          className="mt-4 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus-visible:border-ink"
        />

        {errorCode && (
          <p
            role="alert"
            data-testid="reserve-error"
            className="mt-2 text-sm text-red-600"
          >
            {ERROR_MESSAGES[errorCode] ?? FALLBACK_MESSAGE}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            data-testid="reserve-cancel"
            className="flex-1 rounded-pill border border-neutral-300 px-4 py-2 text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            data-testid="reserve-confirm"
            className="flex-1 rounded-pill bg-ink px-4 py-2 text-sm font-medium text-paper disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando…' : 'Confirmar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
