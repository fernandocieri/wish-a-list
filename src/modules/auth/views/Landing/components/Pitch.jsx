import { APP_NAME } from '@/config'

const STEPS = [
  'Crea tu lista y añade los regalos que te harían ilusión.',
  'Comparte el enlace con tu familia y amigos. No necesitan cuenta.',
  'Cada uno reserva lo que va a regalar, así nadie repite.',
]

export default function Pitch() {
  return (
    <section>
      <h1 className="font-display text-3xl font-semibold leading-tight">
        {APP_NAME}
      </h1>
      <p className="mt-2 text-neutral-600">
        Tu lista de regalos, sin regalos repetidos y sin spoilers.
      </p>

      <ol className="mt-6 space-y-3">
        {STEPS.map((step, i) => (
          <li key={step} className="flex gap-3 text-sm">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-ink font-display text-xs font-semibold text-paper">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>

      <p
        data-testid="promise"
        className="mt-6 rounded-xl bg-reservedBg px-4 py-3 text-sm text-reserved"
      >
        Tus amigos reservan los regalos y <strong>tú no verás cuáles</strong>.
        La sorpresa queda a salvo.
      </p>
    </section>
  )
}
