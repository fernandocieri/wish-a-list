import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './errors'

const MAX_RETRIES = 3

// Known codes are definite answers (a conflict, a limit); retrying cannot change them.
export function shouldRetry(failureCount, error) {
  if (error instanceof ApiError && error.isKnown) return false
  return failureCount < MAX_RETRIES
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        retry: shouldRetry,
      },
      mutations: {
        retry: false,
      },
    },
  })
}
