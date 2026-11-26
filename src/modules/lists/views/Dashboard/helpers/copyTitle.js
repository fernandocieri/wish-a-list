import { LIST_TITLE_MAX } from '@/config'

const SUFFIX = ' (copia)'

/** The default title for a duplicated list. The source title is cut so the result fits LIST_TITLE_MAX. */
export function copyTitle(title) {
  const base = title
    .trim()
    .slice(0, LIST_TITLE_MAX - SUFFIX.length)
    .trimEnd()
  return `${base}${SUFFIX}`
}
