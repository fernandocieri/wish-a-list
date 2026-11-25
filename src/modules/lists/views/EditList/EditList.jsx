import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { groupBySection } from '../../helpers/groupBySection'
import ItemForm from './components/ItemForm'
import ItemRow from './components/ItemRow'
import ListTitleInput from './components/ListTitleInput'
import SectionGroup from './components/SectionGroup'
import ShareBox from './components/ShareBox'
import { emptyItemValues } from './helpers/itemForm'
import { suggestSections } from './helpers/suggestSections'
import { useEditableList } from './hooks/useEditableList'
import { useItemMutations } from './hooks/useItemMutations'
import { useRenameList } from './hooks/useRenameList'

function BackLink() {
  return (
    <Link
      to="/"
      className="text-sm font-medium underline underline-offset-2"
      data-testid="back-to-dashboard"
    >
      ← Mis listas
    </Link>
  )
}

export default function EditList() {
  const { id } = useParams()
  const { data: list, isPending, error } = useEditableList(id)
  const rename = useRenameList(id)
  const { create } = useItemMutations(id)
  // Remounting the add form clears it; the last section is kept to add several in a row.
  const [addForm, setAddForm] = useState({ key: 0, section: '' })

  const items = list?.items
  const sections = useMemo(() => suggestSections(items ?? []), [items])
  const groups = useMemo(() => groupBySection(items ?? []), [items])

  function handleCreate(fields) {
    create.mutate(fields, {
      onSuccess: () =>
        setAddForm((prev) => ({ key: prev.key + 1, section: fields.section })),
    })
  }

  if (isPending) {
    return (
      <div className="mx-auto max-w-md px-4 pb-16 pt-8 sm:max-w-2xl">
        <p className="text-sm text-neutral-400">Cargando…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 pb-16 pt-8 sm:max-w-2xl">
        {error.code === 'not-found' ? (
          <h1
            data-testid="list-not-found"
            className="font-display text-2xl font-semibold leading-tight"
          >
            Esta lista no existe
          </h1>
        ) : (
          <p role="alert" className="text-sm text-red-600">
            No se ha podido cargar la lista. Recarga la página.
          </p>
        )}
        <div className="mt-4">
          <BackLink />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-16 pt-8 sm:max-w-2xl">
      <BackLink />

      <div className="mt-4">
        <ListTitleInput
          key={list.title}
          title={list.title}
          onSave={(title) => rename.mutate(title)}
          hasError={rename.isError}
        />
      </div>

      <ShareBox slug={list.share_slug} />

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold leading-tight">
          Añadir regalo
        </h2>
        <div className="mt-3">
          <ItemForm
            key={addForm.key}
            initialValues={{ ...emptyItemValues, section: addForm.section }}
            sections={sections}
            onSubmit={handleCreate}
            submitLabel="Añadir"
            isSubmitting={create.isPending}
            errorCode={create.error?.code}
          />
        </div>
      </section>

      {groups.length === 0 ? (
        <p data-testid="no-items" className="mt-8 text-sm text-neutral-500">
          Todavía no hay regalos en esta lista.
        </p>
      ) : (
        groups.map(([section, sectionItems]) => (
          <SectionGroup key={section} section={section}>
            {sectionItems.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                listId={list.id}
                sections={sections}
              />
            ))}
          </SectionGroup>
        ))
      )}
    </div>
  )
}
