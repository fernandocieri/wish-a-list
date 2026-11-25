import { useState } from 'react'
import { formatPrice } from '../../../helpers/formatPrice'

function coverFallbackUrl(buyLink) {
  // Live OG-image pull for items with no image_link, no scraping script needed.
  return `https://api.microlink.io/?url=${encodeURIComponent(buyLink)}&screenshot=false&meta=false&embed=image.url`
}

/**
 * Three states: free, reserved by someone else (dimmed, no actions) and reserved by me (undo).
 * canReserve is false for the list's owner, who gets no reservation data anyway.
 */
export default function GiftCard({
  item,
  canReserve = true,
  onReserveClick,
  onUndoClick,
  isUndoing = false,
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const { reservation } = item
  const isMine = Boolean(reservation?.is_mine)
  const isTaken = Boolean(reservation) && !isMine
  const price = formatPrice(item.price, item.price_label)

  const imgSrc = item.image_link || coverFallbackUrl(item.buy_link)

  return (
    <div
      data-testid="gift-card"
      className={`flex flex-col ${isTaken ? 'opacity-60' : ''}`}
    >
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

        {reservation && (
          <div className="absolute inset-0 flex flex-col items-center justify-end bg-ink/55 p-3 text-center">
            <span className="rounded-pill bg-paper px-3 py-1 text-xs font-semibold text-ink">
              {isMine ? (
                <span data-testid="reserved-by-me">Reservado por ti</span>
              ) : (
                <>
                  Reservado por{' '}
                  <span data-testid="reserved-by">
                    {reservation.reserved_by}
                  </span>
                </>
              )}
            </span>
          </div>
        )}

        {/* Whoever is buying it still needs the link. */}
        {!isTaken && (
          <div className="absolute left-2 top-2">
            <a
              href={item.buy_link}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="buy-link"
              className="inline-block rounded-pill bg-ink px-3 py-1.5 text-xs font-medium text-paper"
            >
              Compra aquí
            </a>
          </div>
        )}
      </div>

      <div className="mt-2 space-y-0.5">
        <p className="text-xs font-semibold uppercase leading-snug">
          {item.title}
        </p>
        {item.subtitle && (
          <p className="text-[11px] uppercase tracking-wide text-neutral-500">
            {item.subtitle}
          </p>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between gap-2">
        {isMine ? (
          <button
            type="button"
            onClick={() => onUndoClick(item)}
            disabled={isUndoing}
            data-testid="undo-button"
            className="text-[11px] font-medium text-ink underline underline-offset-2 disabled:opacity-50"
          >
            {isUndoing ? 'Deshaciendo…' : 'Deshacer'}
          </button>
        ) : isTaken ? (
          <span className="text-[11px] font-medium text-reserved">
            Reservado
          </span>
        ) : canReserve ? (
          <button
            type="button"
            onClick={() => onReserveClick(item)}
            data-testid="reserve-button"
            className="text-[11px] font-medium text-ink underline underline-offset-2"
          >
            Lo compro yo
          </button>
        ) : (
          <span />
        )}
        {price && (
          <span data-testid="item-price" className="text-sm font-semibold">
            {price}
          </span>
        )}
      </div>
    </div>
  )
}
