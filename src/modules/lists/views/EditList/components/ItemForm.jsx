import { useId, useState } from 'react'
import { LIMITS } from '@/config'
import {
  emptyItemValues,
  toItemFields,
  validateItem,
} from '../helpers/itemForm'
import { MAX_LINK_LENGTH } from '../helpers/validateLink'

const FIELD_ERRORS = {
  required: 'Escribe un nombre.',
  'invalid-link': 'Usa un enlace que empiece por http:// o https://',
  'invalid-price': 'Escribe un precio válido, por ejemplo 12,50.',
}

const inputClass =
  'mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus-visible:border-ink aria-[invalid=true]:border-red-600'

function Field({ name, label, error, ...inputProps }) {
  const id = `${useId()}-${name}`
  const errorId = `${id}-error`

  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-neutral-600">
        {label}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={inputClass}
        {...inputProps}
      />
      {error && (
        <p
          id={errorId}
          data-testid={`${name}-error`}
          className="mt-1 text-xs text-red-600"
        >
          {FIELD_ERRORS[error]}
        </p>
      )}
    </div>
  )
}

/** Add or edit an item. Calls onSubmit with the row to save once the values are valid. */
export default function ItemForm({
  initialValues = emptyItemValues,
  sections = [],
  onSubmit,
  onCancel,
  submitLabel,
  isSubmitting,
  errorCode,
}) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const sectionsId = useId()

  function handleChange(e) {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const nextErrors = validateItem(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onSubmit(toItemFields(values))
  }

  const field = (name) => ({
    name,
    value: values[name],
    onChange: handleChange,
    error: errors[name],
  })

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      data-testid="item-form"
      className="space-y-3"
    >
      <Field {...field('title')} label="Regalo" type="text" maxLength={200} />
      <Field
        {...field('subtitle')}
        label="Subtítulo"
        type="text"
        maxLength={200}
      />
      <Field
        {...field('buy_link')}
        label="Enlace de compra"
        type="url"
        inputMode="url"
        placeholder="https://"
        maxLength={MAX_LINK_LENGTH}
      />
      <Field
        {...field('image_link')}
        label="Enlace de la imagen"
        type="url"
        inputMode="url"
        placeholder="https://"
        maxLength={MAX_LINK_LENGTH}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          {...field('price')}
          label="Precio (€)"
          type="text"
          inputMode="decimal"
          placeholder="12,50"
        />
        <Field
          {...field('price_label')}
          label="Texto del precio (sustituye al precio)"
          type="text"
          placeholder="Desde 10€"
          maxLength={40}
        />
      </div>
      <Field
        {...field('section')}
        label="Sección"
        type="text"
        list={sectionsId}
        placeholder="Regalos"
        maxLength={100}
      />
      <datalist id={sectionsId}>
        {sections.map((section) => (
          <option key={section} value={section} />
        ))}
      </datalist>

      {errorCode && (
        <p
          role="alert"
          data-testid="item-form-error"
          className="text-sm text-red-600"
        >
          {errorCode === 'item_limit'
            ? `Has llegado al máximo de ${LIMITS.itemsPerList} regalos en esta lista.`
            : 'No se ha podido guardar el regalo. Inténtalo de nuevo.'}
        </p>
      )}

      <div className="flex gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            data-testid="item-cancel"
            className="flex-1 rounded-pill border border-neutral-300 px-4 py-2 text-sm font-medium"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          data-testid="item-submit"
          className="flex-1 rounded-pill bg-ink px-4 py-2 text-sm font-medium text-paper disabled:opacity-50"
        >
          {isSubmitting ? 'Guardando…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
