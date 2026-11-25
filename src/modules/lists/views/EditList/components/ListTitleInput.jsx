import { useId, useState } from 'react'
import { LIST_TITLE_MAX } from '@/config'

/** Saves on blur (or Enter). A blank or unchanged title is reverted instead of saved. */
export default function ListTitleInput({ title, onSave, hasError }) {
  const [value, setValue] = useState(title)
  const inputId = useId()

  function commit() {
    const trimmed = value.trim()
    if (!trimmed || trimmed === title) {
      setValue(title)
      return
    }
    onSave(trimmed)
  }

  return (
    <div>
      <label htmlFor={inputId} className="sr-only">
        Nombre de la lista
      </label>
      <input
        id={inputId}
        name="title"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        maxLength={LIST_TITLE_MAX}
        className="w-full border-b border-transparent bg-transparent font-display text-2xl font-semibold leading-tight outline-none hover:border-neutral-300 focus-visible:border-ink"
      />
      {hasError && (
        <p role="alert" className="mt-1 text-sm text-red-600">
          No se ha podido guardar el nombre. Inténtalo de nuevo.
        </p>
      )}
    </div>
  )
}
