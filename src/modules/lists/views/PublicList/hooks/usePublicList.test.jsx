import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { createQueryWrapper } from '@/test/queryWrapper'
import { ApiError } from '@/lib/errors'
import { fetchReservations } from '../api'
import { usePublicList } from './usePublicList'

vi.mock('../api', () => ({ fetchReservations: vi.fn() }))

describe('usePublicList', () => {
  it('starts pending and then returns the reservations', async () => {
    const reservations = { [faker.string.alphanumeric(8)]: { reservedBy: faker.person.firstName() } }
    fetchReservations.mockResolvedValue(reservations)

    const { result } = renderHook(() => usePublicList(), { wrapper: createQueryWrapper() })

    expect(result.current.isPending).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(reservations)
  })

  it('exposes the ApiError when the fetch fails', async () => {
    fetchReservations.mockRejectedValue(new ApiError('unknown'))

    const { result } = renderHook(() => usePublicList(), { wrapper: createQueryWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error.code).toBe('unknown')
  })
})
