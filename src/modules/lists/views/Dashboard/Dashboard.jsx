import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ConfirmDialog from '../../components/ConfirmDialog'
import ListRow from './components/ListRow'
import NewListForm from './components/NewListForm'
import { LIST_LIMIT_MESSAGE } from './helpers/listLimitMessage'
import { useDeleteList } from './hooks/useDeleteList'
import { useDuplicateList } from './hooks/useDuplicateList'
import { useMyLists } from './hooks/useMyLists'

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: lists, isPending, isError } = useMyLists()
  const duplicateList = useDuplicateList()
  const deleteList = useDeleteList()
  const [listToDelete, setListToDelete] = useState(null)

  function duplicate(list) {
    duplicateList.mutate(list, {
      onSuccess: (copy) => navigate(`/lists/${copy.id}`),
    })
  }

  function closeDialog() {
    setListToDelete(null)
    deleteList.reset()
  }

  function confirmDelete() {
    deleteList.mutate(listToDelete.id, { onSuccess: closeDialog })
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-16 pt-8 sm:max-w-2xl">
      <h1 className="font-display text-2xl font-semibold leading-tight">
        Mis listas
      </h1>

      <NewListForm />

      <div className="mt-8">
        {duplicateList.error && (
          <p
            role="alert"
            data-testid="duplicate-error"
            className="mb-4 text-sm text-red-600"
          >
            {duplicateList.error.code === 'list_limit'
              ? LIST_LIMIT_MESSAGE
              : 'No se ha podido duplicar la lista. Inténtalo de nuevo.'}
          </p>
        )}
        {isPending ? (
          <p className="text-sm text-neutral-400">Cargando…</p>
        ) : isError ? (
          <p role="alert" className="text-sm text-red-600">
            No se han podido cargar tus listas. Recarga la página.
          </p>
        ) : lists.length === 0 ? (
          <p data-testid="empty-state" className="text-sm text-neutral-500">
            Aún no tienes ninguna lista
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {lists.map((list) => (
              <ListRow
                key={list.id}
                list={list}
                onDuplicate={duplicate}
                isDuplicating={duplicateList.isPending}
                onDelete={setListToDelete}
              />
            ))}
          </ul>
        )}
      </div>

      {listToDelete && (
        <ConfirmDialog
          title={`¿Borrar «${listToDelete.title}»?`}
          message="Se borrarán la lista y todos sus regalos, también para quien los haya reservado. No se puede deshacer."
          confirmLabel="Borrar lista"
          onConfirm={confirmDelete}
          onCancel={closeDialog}
          isPending={deleteList.isPending}
          hasError={deleteList.isError}
        />
      )}
    </div>
  )
}
