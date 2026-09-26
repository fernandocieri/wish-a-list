import { useEffect, useMemo, useState } from 'react'
import items from './data/items.json'
import GiftCard from './components/GiftCard'
import ReserveModal from './components/ReserveModal'
import { fetchReservations, reserveItem, isSupabaseConfigured } from './lib/reservations'

export default function App() {
  const [reservations, setReservations] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeItem, setActiveItem] = useState(null)
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchReservations().then(({ data }) => {
      setReservations(data || {})
      setLoading(false)
    })
  }, [])

  const sections = useMemo(() => {
    const map = new Map()
    for (const item of items) {
      if (!map.has(item.section)) map.set(item.section, [])
      map.get(item.section).push(item)
    }
    return Array.from(map.entries())
  }, [])

  async function handleConfirmReserve(name) {
    setIsSubmitting(true)
    setError(null)
    const { data, error } = await reserveItem(activeItem.id, name)
    setIsSubmitting(false)

    if (error) {
      setError(error.message)
      // Someone else grabbed it first: refresh state so the UI reflects reality
      if (error.message === 'already-reserved') {
        const { data: fresh } = await fetchReservations()
        setReservations(fresh || {})
      }
      return
    }

    setReservations((prev) => ({ ...prev, [activeItem.id]: data }))
    setActiveItem(null)
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
        {!isSupabaseConfigured && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Modo de prueba local: las reservas solo se guardan en este navegador. Configura
            Supabase (ver README) para compartirlas de verdad.
          </p>
        )}
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
          setError(null)
        }}
        onConfirm={handleConfirmReserve}
        error={error}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
