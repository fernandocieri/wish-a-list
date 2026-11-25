import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { groupBySection } from '../../helpers/groupBySection'
import GiftCard from './components/GiftCard'
import OwnerBanner from './components/OwnerBanner'
import ReserveModal from './components/ReserveModal'
import { usePublicList } from './hooks/usePublicList'
import { useReserve } from './hooks/useReserve'
import { useUndoReservation } from './hooks/useUndoReservation'

function Page({ children }) {
  return (
    <div className="mx-auto max-w-md px-4 pb-16 pt-8 sm:max-w-2xl">
      {children}
    </div>
  )
}

export default function PublicList() {
  const { slug } = useParams()
  const { data: list, isPending, error } = usePublicList(slug)
  const reserve = useReserve(slug)
  const undo = useUndoReservation(slug)
  const [activeItem, setActiveItem] = useState(null)

  const items = list?.items
  const sections = useMemo(() => groupBySection(items ?? []), [items])

  function closeModal() {
    setActiveItem(null)
    reserve.reset()
  }

  function handleConfirmReserve(name) {
    reserve.mutate({ itemId: activeItem.id, name }, { onSuccess: closeModal })
  }

  if (isPending) {
    return (
      <Page>
        <p className="text-sm text-neutral-400">Cargando…</p>
      </Page>
    )
  }

  if (error) {
    return (
      <Page>
        {error.code === 'not-found' ? (
          <>
            <h1
              data-testid="list-not-found"
              className="font-display text-2xl font-semibold leading-tight"
            >
              Esta lista no existe
            </h1>
            <p className="mt-2 text-sm text-neutral-500">
              Revisa que el enlace esté completo o pídeselo de nuevo a quien te
              lo envió.
            </p>
          </>
        ) : (
          <p role="alert" className="text-sm text-red-600">
            No se ha podido cargar la lista. Recarga la página.
          </p>
        )}
        <Link
          to="/"
          className="mt-4 inline-block text-sm font-medium underline underline-offset-2"
        >
          Volver al inicio
        </Link>
      </Page>
    )
  }

  const isOwner = list.is_owner

  return (
    <Page>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold leading-tight">
          {list.title}
        </h1>
        {!isOwner && (
          <p className="mt-1 text-sm text-neutral-500">
            Reserva lo que vayas a regalar para que nadie repita. Recuerda que
            estas son ideas, si quieres regalar otra cosa, ¡adelante!
          </p>
        )}
      </header>

      {isOwner && <OwnerBanner />}

      {undo.isError && (
        <p
          role="alert"
          data-testid="undo-error"
          className="mb-6 text-sm text-red-600"
        >
          No se ha podido deshacer la reserva. Inténtalo de nuevo.
        </p>
      )}

      {sections.length === 0 ? (
        <p data-testid="no-items" className="text-sm text-neutral-500">
          Todavía no hay regalos en esta lista.
        </p>
      ) : (
        sections.map(([section, sectionItems]) => (
          <section key={section} data-testid="public-section" className="mb-16">
            <h2 className="mb-6 font-display text-xl font-semibold leading-tight">
              {section}
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3">
              {sectionItems.map((item) => (
                <GiftCard
                  key={item.id}
                  item={item}
                  canReserve={!isOwner}
                  onReserveClick={setActiveItem}
                  onUndoClick={(target) => undo.mutate(target.id)}
                  isUndoing={undo.isPending && undo.variables === item.id}
                />
              ))}
            </div>
          </section>
        ))
      )}

      {activeItem && (
        <ReserveModal
          item={activeItem}
          onClose={closeModal}
          onConfirm={handleConfirmReserve}
          errorCode={reserve.error?.code}
          isSubmitting={reserve.isPending}
        />
      )}
    </Page>
  )
}
