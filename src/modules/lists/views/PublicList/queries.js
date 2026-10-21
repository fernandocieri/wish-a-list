import { queryOptions } from '@tanstack/react-query'
import { fetchReservations } from './api'

// Separate root from ['lists', ...] so owner code can never touch reservation data.
export const publicListKeys = {
  all: ['public-list'],
  reservations: () => [...publicListKeys.all, 'reservations'],
}

export const reservationsQueryOptions = () =>
  queryOptions({
    queryKey: publicListKeys.reservations(),
    queryFn: fetchReservations,
  })
