import { useId } from 'react'
import Modal from './Modal'

export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  isPending,
  hasError,
}) {
  const titleId = useId()

  return (
    <Modal onClose={onCancel} labelledBy={titleId}>
      <p id={titleId} className="font-display text-base font-semibold">
        {title}
      </p>
      <p className="mt-1 text-sm text-neutral-500">{message}</p>

      {hasError && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          No se ha podido completar. Inténtalo de nuevo.
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          data-testid="confirm-cancel"
          className="flex-1 rounded-pill border border-neutral-300 px-4 py-2 text-sm font-medium"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          data-testid="confirm-accept"
          className="flex-1 rounded-pill bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? 'Borrando…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
