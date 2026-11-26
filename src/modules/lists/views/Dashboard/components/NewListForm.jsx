import { useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LIST_TITLE_MAX } from '@/config'
import { LIST_LIMIT_MESSAGE } from '../helpers/listLimitMessage'
import { useCreateList } from '../hooks/useCreateList'

export default function NewListForm() {
  const navigate = useNavigate()
  const createList = useCreateList()
  const [title, setTitle] = useState('')
  const inputId = useId()
  const trimmed = title.trim()

  function handleSubmit(e) {
    e.preventDefault()
    if (!trimmed) return
    createList.mutate(trimmed, {
      onSuccess: (list) => navigate(`/lists/${list.id}`),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <label htmlFor={inputId} className="text-sm font-medium">
        Nueva lista
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id={inputId}
          name="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={LIST_TITLE_MAX}
          placeholder="Cumpleaños de..."
          className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus-visible:border-ink"
        />
        <button
          type="submit"
          disabled={!trimmed || createList.isPending}
          data-testid="create-list"
          className="rounded-pill bg-ink px-4 py-2 text-sm font-medium text-paper disabled:opacity-50"
        >
          {createList.isPending ? 'Creando…' : 'Crear'}
        </button>
      </div>
      {createList.error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {createList.error.code === 'list_limit'
            ? LIST_LIMIT_MESSAGE
            : 'No se ha podido crear la lista. Inténtalo de nuevo.'}
        </p>
      )}
    </form>
  )
}
