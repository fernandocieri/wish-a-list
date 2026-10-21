import { useQuery } from '@tanstack/react-query'
import { reservationsQueryOptions } from '../queries'

export function usePublicList() {
  return useQuery(reservationsQueryOptions())
}
