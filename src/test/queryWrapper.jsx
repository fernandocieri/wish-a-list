import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/**
 * A wrapper with a fresh QueryClient per call, so hook tests share no cache and errors fail fast.
 * The client is exposed as `wrapper.queryClient` for tests that need to seed or inspect the cache.
 */
export function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  function QueryWrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

  QueryWrapper.queryClient = queryClient
  return QueryWrapper
}
