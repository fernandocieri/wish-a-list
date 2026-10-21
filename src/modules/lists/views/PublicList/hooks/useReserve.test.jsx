import { describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { createQueryWrapper } from '@/test/queryWrapper'
import { ApiError } from '@/lib/errors'
import { fetchReservations, reserveItem } from '../api'
import { usePublicList } from './usePublicList'
import { useReserve } from './useReserve'

vi.mock('../api', () => ({ fetchReservations: vi.fn(), reserveItem: vi.fn() }))

function renderBoth() {
  return renderHook(() => ({ list: usePublicList(), reserve: useReserve() }), {
    wrapper: createQueryWrapper(),
  })
}

describe('useReserve', () => {
  it('shows the new reservation and refetches the list', async () => {
    const itemId = faker.string.alphanumeric(8)
    const name = faker.person.firstName()
    const reservation = {
      reservedBy: name,
      reservedAt: faker.date.recent().toISOString(),
    }
    fetchReservations
      .mockResolvedValueOnce({})
      .mockResolvedValue({ [itemId]: reservation })
    reserveItem.mockResolvedValue(reservation)
    const { result } = renderBoth()
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))

    await act(() => result.current.reserve.mutateAsync({ itemId, name }))

    expect(reserveItem).toHaveBeenCalledWith(itemId, name)
    await waitFor(() =>
      expect(result.current.list.data[itemId]).toEqual(reservation),
    )
    await waitFor(() => expect(fetchReservations).toHaveBeenCalledTimes(2))
  })

  it('refetches the list when someone else reserved the item first', async () => {
    const itemId = faker.string.alphanumeric(8)
    const other = {
      reservedBy: faker.person.firstName(),
      reservedAt: faker.date.recent().toISOString(),
    }
    fetchReservations
      .mockResolvedValueOnce({})
      .mockResolvedValue({ [itemId]: other })
    reserveItem.mockRejectedValue(new ApiError('already-reserved'))
    const { result } = renderBoth()
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))

    act(() =>
      result.current.reserve.mutate({ itemId, name: faker.person.firstName() }),
    )

    await waitFor(() =>
      expect(result.current.reserve.error?.code).toBe('already-reserved'),
    )
    await waitFor(() => expect(result.current.list.data[itemId]).toEqual(other))
  })
})
