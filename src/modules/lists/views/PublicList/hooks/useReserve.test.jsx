import { describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { createQueryWrapper } from '@/test/queryWrapper'
import { ApiError } from '@/lib/errors'
import { makePublicItem, makePublicList } from '@/test/factories'
import { fetchPublicList, reserveItem } from '../api'
import { loadFriendName } from '../helpers/friendName'
import { usePublicList } from './usePublicList'
import { useReserve } from './useReserve'

vi.mock('../api', () => ({ fetchPublicList: vi.fn(), reserveItem: vi.fn() }))

const slug = 'abc'

function renderBoth() {
  return renderHook(
    () => ({ list: usePublicList(slug), reserve: useReserve(slug) }),
    { wrapper: createQueryWrapper() },
  )
}

describe('useReserve', () => {
  it('marks the item as mine and refetches the list', async () => {
    const item = makePublicItem()
    const name = faker.person.firstName()
    const mine = { reserved_by: name, is_mine: true }
    fetchPublicList
      .mockResolvedValueOnce(makePublicList({ items: [item] }))
      .mockResolvedValue(
        makePublicList({ items: [{ ...item, reservation: mine }] }),
      )
    reserveItem.mockResolvedValue()
    const { result } = renderBoth()
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))

    await act(() =>
      result.current.reserve.mutateAsync({ itemId: item.id, name }),
    )

    expect(reserveItem).toHaveBeenCalledWith(item.id, name)
    await waitFor(() =>
      expect(result.current.list.data.items[0].reservation).toEqual(mine),
    )
    await waitFor(() => expect(fetchPublicList).toHaveBeenCalledTimes(2))
  })

  it('remembers the name after a successful reserve', async () => {
    const name = faker.person.firstName()
    fetchPublicList.mockResolvedValue(makePublicList())
    reserveItem.mockResolvedValue()
    const { result } = renderBoth()

    await act(() =>
      result.current.reserve.mutateAsync({ itemId: faker.string.uuid(), name }),
    )

    expect(loadFriendName()).toBe(name)
  })

  it('refetches the list when someone else reserved the item first', async () => {
    const item = makePublicItem()
    const other = { reserved_by: faker.person.firstName(), is_mine: false }
    fetchPublicList
      .mockResolvedValueOnce(makePublicList({ items: [item] }))
      .mockResolvedValue(
        makePublicList({ items: [{ ...item, reservation: other }] }),
      )
    reserveItem.mockRejectedValue(new ApiError('already-reserved'))
    const { result } = renderBoth()
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))

    act(() =>
      result.current.reserve.mutate({
        itemId: item.id,
        name: faker.person.firstName(),
      }),
    )

    await waitFor(() =>
      expect(result.current.reserve.error?.code).toBe('already-reserved'),
    )
    await waitFor(() =>
      expect(result.current.list.data.items[0].reservation).toEqual(other),
    )
    expect(loadFriendName()).toBe('')
  })
})
