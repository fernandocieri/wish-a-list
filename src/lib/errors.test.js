import { describe, expect, it } from 'vitest'
import { ApiError, toApiError } from './errors'

describe('toApiError', () => {
  it.each([
    [{ code: '23505', message: 'duplicate key value' }, 'already-reserved'],
    [{ code: 'P0001', message: 'list_limit' }, 'list_limit'],
    [{ code: 'P0001', message: 'item_limit' }, 'item_limit'],
    [{ code: 'P0001', message: 'reservation_limit' }, 'reservation_limit'],
    [{ code: 'P0001', message: 'something else' }, 'unknown'],
    [{ code: '42501', message: 'permission denied' }, 'unknown'],
    [new Error('Failed to fetch'), 'unknown'],
    [undefined, 'unknown'],
  ])('maps %o to %s', (input, code) => {
    expect(toApiError(input).code).toBe(code)
  })

  it('keeps the original error as the cause', () => {
    const original = { code: '23505', message: 'duplicate key value' }

    expect(toApiError(original).cause).toBe(original)
  })

  it('returns an ApiError unchanged', () => {
    const error = new ApiError('list_limit')

    expect(toApiError(error)).toBe(error)
  })
})

describe('ApiError', () => {
  it('is known only for codes the UI can explain', () => {
    expect(new ApiError('already-reserved').isKnown).toBe(true)
    expect(new ApiError('unknown').isKnown).toBe(false)
  })
})
