import { describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { ApiError } from '@/lib/errors'
import { makeItem, makeItemFields, makeList } from '@/test/factories'
import { createQueryWrapper } from '@/test/queryWrapper'
import { listKeys } from '../../../queries'
import { createItem, deleteItem, updateItem } from '../api'
import { useItemMutations } from './useItemMutations'

vi.mock('../api', () => ({
  createItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
}))

function renderMutations() {
  const list = makeList()
  const wrapper = createQueryWrapper()
  wrapper.queryClient.setQueryData(listKeys.detail(list.id), list)
  wrapper.queryClient.setQueryData(listKeys.mine(), [list])
  const view = renderHook(() => useItemMutations(list.id), { wrapper })
  const isInvalidated = (key) =>
    wrapper.queryClient.getQueryState(key).isInvalidated
  return { ...view, list, isInvalidated }
}

const fields = makeItemFields()

describe('useItemMutations', () => {
  it('creates an item in the list and refreshes the editor and the dashboard', async () => {
    createItem.mockResolvedValue(makeItem())
    const { result, list, isInvalidated } = renderMutations()

    act(() => result.current.create.mutate(fields))

    await waitFor(() => expect(result.current.create.isSuccess).toBe(true))
    expect(createItem).toHaveBeenCalledWith(list.id, fields)
    expect(isInvalidated(listKeys.detail(list.id))).toBe(true)
    expect(isInvalidated(listKeys.mine())).toBe(true)
  })

  it('exposes "item_limit" and still refreshes when creating fails', async () => {
    createItem.mockRejectedValue(new ApiError('item_limit'))
    const { result, list, isInvalidated } = renderMutations()

    act(() => result.current.create.mutate(fields))

    await waitFor(() => expect(result.current.create.isError).toBe(true))
    expect(result.current.create.error.code).toBe('item_limit')
    expect(isInvalidated(listKeys.detail(list.id))).toBe(true)
  })

  it('updates an item', async () => {
    const id = faker.string.uuid()
    updateItem.mockResolvedValue(makeItem({ id }))
    const { result, list, isInvalidated } = renderMutations()

    act(() => result.current.update.mutate({ id, fields }))

    await waitFor(() => expect(result.current.update.isSuccess).toBe(true))
    expect(updateItem).toHaveBeenCalledWith(id, fields)
    expect(isInvalidated(listKeys.detail(list.id))).toBe(true)
  })

  it('deletes an item', async () => {
    const id = faker.string.uuid()
    deleteItem.mockResolvedValue()
    const { result, list, isInvalidated } = renderMutations()

    act(() => result.current.remove.mutate(id))

    await waitFor(() => expect(result.current.remove.isSuccess).toBe(true))
    expect(deleteItem).toHaveBeenCalledWith(id)
    expect(isInvalidated(listKeys.mine())).toBe(true)
    expect(isInvalidated(listKeys.detail(list.id))).toBe(true)
  })
})
