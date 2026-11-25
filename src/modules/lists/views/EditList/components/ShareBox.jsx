import CopyButton from '../../../components/CopyButton'
import { shareUrl } from '../../../helpers/shareUrl'

export default function ShareBox({ slug }) {
  const url = shareUrl(slug)

  return (
    <section
      data-testid="share-box"
      className="mt-6 rounded-2xl border-2 border-ink p-4"
    >
      <h2 className="font-display text-base font-semibold">
        Comparte tu lista
      </h2>
      <p
        data-testid="share-url"
        className="mt-2 break-all rounded-lg bg-neutral-100 px-3 py-2 text-sm"
      >
        {url}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <CopyButton text={url} variant="primary" />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="view-as-friend"
          className="rounded-pill border border-neutral-300 px-4 py-2 text-sm font-medium"
        >
          Ver como amigo
        </a>
      </div>
      <p className="mt-3 text-xs text-neutral-500">
        Tú no verás qué regalos están reservados.
      </p>
    </section>
  )
}
