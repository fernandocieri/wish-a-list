import { useEffect, useState } from 'react'

const RESET_AFTER_MS = 2000

const VARIANTS = {
  primary: 'bg-ink px-4 py-2 text-sm text-paper',
  outline: 'border border-neutral-300 px-3 py-1 text-xs',
}

export default function CopyButton({ text, variant = 'outline' }) {
  const [status, setStatus] = useState('idle') // idle | copied | failed

  useEffect(() => {
    if (status === 'idle') return
    const timer = setTimeout(() => setStatus('idle'), RESET_AFTER_MS)
    return () => clearTimeout(timer)
  }, [status])

  async function handleClick() {
    try {
      // navigator.clipboard is missing outside secure contexts; that throws here too.
      await navigator.clipboard.writeText(text)
      setStatus('copied')
    } catch {
      setStatus('failed')
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      data-testid="copy-button"
      data-status={status}
      className={`rounded-pill font-medium ${VARIANTS[variant]}`}
    >
      {status === 'copied'
        ? 'Copiado'
        : status === 'failed'
          ? 'No se pudo copiar'
          : 'Copiar enlace'}
    </button>
  )
}
