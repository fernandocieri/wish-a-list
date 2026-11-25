import { useQuery } from '@tanstack/react-query'
import { publicListQueryOptions } from '../queries'

export function usePublicList(slug) {
  return useQuery(publicListQueryOptions(slug))
}
