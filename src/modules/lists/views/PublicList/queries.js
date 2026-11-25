import { queryOptions } from '@tanstack/react-query'
import { fetchPublicList } from './api'

// Separate root from ['lists', ...] so owner code can never touch reservation data.
export const publicListKeys = {
  all: ['public-list'],
  detail: (slug) => [...publicListKeys.all, slug],
}

export const publicListQueryOptions = (slug) =>
  queryOptions({
    queryKey: publicListKeys.detail(slug),
    queryFn: () => fetchPublicList(slug),
    // Always stale: refocusing the tab shows other friends' reservations.
    staleTime: 0,
  })
