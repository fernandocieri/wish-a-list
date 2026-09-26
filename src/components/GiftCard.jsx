import { useState } from 'react'

function coverFallbackUrl(buyLink) {
  // Live OG-image pull for items with no imageLink, no scraping script needed.
  return `https://api.microlink.io/?url=${encodeURIComponent(buyLink)}&screenshot=false&meta=false&embed=image.url`
}

export default function GiftCard({ item, reservation, onReserveClick }) {
  const [imgFailed, setImgFailed] = useState(false)
  const isReserved = Boolean(reservation)

  const imgSrc = item.imageLink || coverFallbackUrl(item.buyLink)

  return (
    <div className="flex flex-col">
      <div className="relative aspect-[3/4.3] overflow-hidden rounded-md bg-neutral-100">
        {!imgFailed ? (
          <img
            src={imgSrc}
            alt={item.title}
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-4 text-center font-display text-sm uppercase text-neutral-400">
            {item.title}
          </div>
        )}

        {isReserved && (
          <div className="absolute inset-0 flex flex-col items-center justify-end bg-ink/55 p-3 text-center">
            <span className="rounded-pill bg-paper px-3 py-1 text-xs font-semibold text-ink">
              Reservado por {reservation.reservedBy}
            </span>
          </div>
        )}

        <div className="absolute bottom-2 left-2">
          {isReserved ? null : (
            <a
              href={item.buyLink}
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-pill bg-ink px-3 py-1.5 text-xs font-medium text-paper"
              onClick={(e) => e.stopPropagation()}
            >
              Compra aquí
            </a>
          )}
        </div>
      </div>

      <div className="mt-2 space-y-0.5">
        <p className="text-xs font-semibold leading-snug uppercase">{item.title}</p>
        {item.subtitle && (
          <p className="text-[11px] uppercase tracking-wide text-neutral-500">{item.subtitle}</p>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between">
        {isReserved ? (
          <span className="text-[11px] font-medium text-reserved">Reservado</span>
        ) : (
          <button
            onClick={() => onReserveClick(item)}
            className="text-[11px] font-medium text-ink underline underline-offset-2"
          >
            Lo compro yo
          </button>
        )}
        <span className="text-sm font-semibold">
          {item.priceLabel ?? `${item.price.toFixed(2).replace('.', ',')}€`}
        </span>
      </div>
    </div>
  )
}
