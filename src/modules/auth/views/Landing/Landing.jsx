import { APP_NAME } from '../../../../config'

// Stub until Batch 2 (pitch + "Continuar con Google").
export default function Landing() {
  return (
    <div className="mx-auto max-w-md px-4 pb-16 pt-8 sm:max-w-2xl">
      <h1 className="font-display text-2xl font-semibold leading-tight">{APP_NAME}</h1>
    </div>
  )
}
