import { useMemo, useState } from 'react'
import items from './data/items.json'
import GiftCard from './components/GiftCard'
import ReserveModal from './components/ReserveModal'
import { usePublicList } from './hooks/usePublicList'
import { useReserve } from './hooks/useReserve'

export default function PublicList() {
  const { data: reservations = {}, isPending: loading } = usePublicList()
  const reserve = useReserve()
  const [activeItem, setActiveItem] = useState(null)

  const sections = useMemo(() => {
    const map = new Map()
    for (const item of items) {
      if (!map.has(item.section)) map.set(item.section, [])
      map.get(item.section).push(item)
    }
    return Array.from(map.entries())
  }, [])

  function handleConfirmReserve(name) {
    reserve.mutate({ itemId: activeItem.id, name }, { onSuccess: () => setActiveItem(null) })
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-16 pt-8 sm:max-w-2xl">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold leading-tight">
          Lista de regalos
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Reserva lo que vayas a regalar para que nadie repita. Recuerda que estas son ideas, si quieres regalar otra cosa, ¡adelante!
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-neutral-400">Cargando…</p>
      ) : (
        sections.map(([section, sectionItems]) => (
          <section key={section} className="mb-16">
            <h2 className="mb-6 font-display text-xl font-semibold leading-tight">
              {section}
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3">
              {sectionItems.map((item) => (
                <GiftCard
                  key={item.id}
                  item={item}
                  reservation={reservations[item.id]}
                  onReserveClick={setActiveItem}
                />
              ))}
            </div>
          </section>
        ))
      )}

      <ReserveModal
        item={activeItem}
        onClose={() => {
          setActiveItem(null)
          reserve.reset()
        }}
        onConfirm={handleConfirmReserve}
        error={reserve.error?.code}
        isSubmitting={reserve.isPending}
      />
    </div>
  )
}
