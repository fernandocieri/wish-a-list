import { describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { createQueryWrapper } from '@/test/queryWrapper'
import { ApiError } from '@/lib/errors'
import { makePublicItem, makePublicList } from '@/test/factories'
import { fetchPublicList, undoReservation } from '../api'
import { usePublicList } from './usePublicList'
import { useUndoReservation } from './useUndoReservation'

vi.mock('../api', () => ({
  fetchPublicList: vi.fn(),
  undoReservation: vi.fn(),
}))

const slug = 'abc'

function renderBoth() {
  return renderHook(
    () => ({ list: usePublicList(slug), undo: useUndoReservation(slug) }),
    { wrapper: createQueryWrapper() },
  )
}

const makeMineItem = () =>
  makePublicItem({
    reservation: { reserved_by: faker.person.firstName(), is_mine: true },
  })

describe('useUndoReservation', () => {
  it('frees the item and refetches the list', async () => {
    const item = makeMineItem()
    fetchPublicList
      .mockResolvedValueOnce(makePublicList({ items: [item] }))
      .mockResolvedValue(
        makePublicList({ items: [{ ...item, reservation: null }] }),
      )
    undoReservation.mockResolvedValue()
    const { result } = renderBoth()
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))

    await act(() => result.current.undo.mutateAsync(item.id))

    expect(undoReservation).toHaveBeenCalledWith(item.id)
    await waitFor(() =>
      expect(result.current.list.data.items[0].reservation).toBeNull(),
    )
    await waitFor(() => expect(fetchPublicList).toHaveBeenCalledTimes(2))
  })

  it('keeps the reservation and refetches when the undo fails', async () => {
    const item = makeMineItem()
    fetchPublicList.mockResolvedValue(makePublicList({ items: [item] }))
    undoReservation.mockRejectedValue(new ApiError('not-found'))
    const { result } = renderBoth()
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))

    act(() => result.current.undo.mutate(item.id))

    await waitFor(() => expect(result.current.undo.isError).toBe(true))
    expect(result.current.list.data.items[0].reservation).toEqual(
      item.reservation,
    )
    await waitFor(() => expect(fetchPublicList).toHaveBeenCalledTimes(2))
  })
})
