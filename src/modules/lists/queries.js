import { queryOptions } from '@tanstack/react-query'
import { fetchMyLists } from './api'

// Owner data. Reservations live under ['public-list', ...] and never here.
export const listKeys = {
  all: ['lists'],
  mine: () => [...listKeys.all, 'mine'],
  detail: (id) => [...listKeys.all, 'detail', id],
}

export const myListsQueryOptions = () =>
  queryOptions({
    queryKey: listKeys.mine(),
    queryFn: fetchMyLists,
  })
