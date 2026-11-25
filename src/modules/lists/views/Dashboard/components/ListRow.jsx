import { Link } from 'react-router-dom'
import CopyButton from '../../../components/CopyButton'
import { shareUrl } from '../../../helpers/shareUrl'

export default function ListRow({ list, onDelete }) {
  const editPath = `/lists/${list.id}`

  return (
    <li
      data-testid="list-row"
      className="flex flex-wrap items-center justify-between gap-3 py-4"
    >
      <div className="min-w-0">
        <Link to={editPath} className="block truncate font-medium">
          {list.title}
        </Link>
        <p data-testid="item-count" className="text-xs text-neutral-500">
          {list.item_count} {list.item_count === 1 ? 'regalo' : 'regalos'}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          to={editPath}
          data-testid="edit-list"
          className="rounded-pill border border-neutral-300 px-3 py-1 text-xs font-medium"
        >
          Editar
        </Link>
        <CopyButton text={shareUrl(list.share_slug)} />
        <button
          type="button"
          onClick={() => onDelete(list)}
          data-testid="delete-list"
          className="rounded-pill border border-neutral-300 px-3 py-1 text-xs font-medium text-red-600"
        >
          Borrar
        </button>
      </div>
    </li>
  )
}
