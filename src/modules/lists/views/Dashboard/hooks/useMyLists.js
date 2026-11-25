import { useQuery } from '@tanstack/react-query'
import { myListsQueryOptions } from '../../../queries'

export function useMyLists() {
  return useQuery(myListsQueryOptions())
}
