import { useState } from 'react'
import ConfirmDialog from '../../../components/ConfirmDialog'
import { formatPrice } from '../../../helpers/formatPrice'
import { toFormValues } from '../helpers/itemForm'
import { useItemMutations } from '../hooks/useItemMutations'
import ItemForm from './ItemForm'

export default function ItemRow({ item, listId, sections }) {
  const { update, remove } = useItemMutations(listId)
  const [isEditing, setIsEditing] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const price = formatPrice(item.price, item.price_label)

  function stopEditing() {
    setIsEditing(false)
    update.reset()
  }

  function stopDeleting() {
    setIsConfirmingDelete(false)
    remove.reset()
  }

  if (isEditing) {
    return (
      <li data-testid="item-row" className="py-4">
        <ItemForm
          initialValues={toFormValues(item)}
          sections={sections}
          onSubmit={(fields) =>
            update.mutate({ id: item.id, fields }, { onSuccess: stopEditing })
          }
          onCancel={stopEditing}
          submitLabel="Guardar"
          isSubmitting={update.isPending}
          errorCode={update.error?.code}
        />
      </li>
    )
  }

  return (
    <li data-testid="item-row" className="flex items-start gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug">{item.title}</p>
        {item.subtitle && (
          <p className="text-xs text-neutral-500">{item.subtitle}</p>
        )}
        <p className="mt-0.5 flex gap-3 text-xs">
          {price && <span data-testid="item-price">{price}</span>}
          <a
            href={item.buy_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-500 underline underline-offset-2"
          >
            Ver enlace
          </a>
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          data-testid="edit-item"
          className="rounded-pill border border-neutral-300 px-3 py-1 text-xs font-medium"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => setIsConfirmingDelete(true)}
          data-testid="delete-item"
          className="rounded-pill border border-neutral-300 px-3 py-1 text-xs font-medium text-red-600"
        >
          Borrar
        </button>
      </div>

      {isConfirmingDelete && (
        <ConfirmDialog
          title={`¿Borrar «${item.title}»?`}
          message="Se borrará también para quien lo haya reservado. No se puede deshacer."
          confirmLabel="Borrar regalo"
          onConfirm={() => remove.mutate(item.id, { onSuccess: stopDeleting })}
          onCancel={stopDeleting}
          isPending={remove.isPending}
          hasError={remove.isError}
        />
      )}
    </li>
  )
}
