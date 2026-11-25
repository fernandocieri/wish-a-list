import { describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { focusManager } from '@tanstack/react-query'
import { faker } from '@faker-js/faker'
import { createQueryWrapper } from '@/test/queryWrapper'
import { ApiError } from '@/lib/errors'
import { makePublicItem, makePublicList } from '@/test/factories'
import { fetchPublicList } from '../api'
import { usePublicList } from './usePublicList'

vi.mock('../api', () => ({ fetchPublicList: vi.fn() }))

const renderList = (slug) =>
  renderHook(() => usePublicList(slug), { wrapper: createQueryWrapper() })

describe('usePublicList', () => {
  it('starts pending and then returns the list for the slug', async () => {
    const slug = faker.string.alphanumeric(16)
    const list = makePublicList({ items: [makePublicItem()] })
    fetchPublicList.mockResolvedValue(list)

    const { result } = renderList(slug)

    expect(result.current.isPending).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetchPublicList).toHaveBeenCalledWith(slug)
    expect(result.current.data).toEqual(list)
  })

  it('exposes "not-found" for an unknown slug', async () => {
    fetchPublicList.mockRejectedValue(new ApiError('not-found'))

    const { result } = renderList('nope')

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error.code).toBe('not-found')
  })

  it('refetches when the tab regains focus', async () => {
    const item = makePublicItem()
    const reservation = {
      reserved_by: faker.person.firstName(),
      is_mine: false,
    }
    fetchPublicList
      .mockResolvedValueOnce(makePublicList({ items: [item] }))
      .mockResolvedValue(makePublicList({ items: [{ ...item, reservation }] }))
    const { result } = renderList('abc')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    act(() => {
      focusManager.setFocused(false)
      focusManager.setFocused(true)
    })

    await waitFor(() =>
      expect(result.current.data.items[0].reservation).toEqual(reservation),
    )
    focusManager.setFocused(undefined)
  })
})
