import { describe, expect, it } from 'vitest'
import { ApiError } from './errors'
import { createQueryClient, shouldRetry } from './queryClient'

describe('shouldRetry', () => {
  it('does not retry an ApiError with a known code', () => {
    expect(shouldRetry(0, new ApiError('already-reserved'))).toBe(false)
  })

  it('retries unknown errors up to three times', () => {
    const error = new ApiError('unknown')

    expect(shouldRetry(2, error)).toBe(true)
    expect(shouldRetry(3, error)).toBe(false)
  })

  it('retries errors that are not an ApiError', () => {
    expect(shouldRetry(0, new Error('Failed to fetch'))).toBe(true)
  })
})

describe('createQueryClient', () => {
  it('never retries mutations', () => {
    expect(createQueryClient().getDefaultOptions().mutations.retry).toBe(false)
  })
})
