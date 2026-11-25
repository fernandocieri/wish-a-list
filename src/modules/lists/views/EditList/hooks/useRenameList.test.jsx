import { describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { ApiError } from '@/lib/errors'
import { makeList } from '@/test/factories'
import { createQueryWrapper } from '@/test/queryWrapper'
import { renameList } from '../../../api'
import { listKeys } from '../../../queries'
import { useRenameList } from './useRenameList'

vi.mock('../../../api', () => ({ renameList: vi.fn() }))

function renderRename(list) {
  const wrapper = createQueryWrapper()
  wrapper.queryClient.setQueryData(listKeys.detail(list.id), list)
  wrapper.queryClient.setQueryData(listKeys.mine(), [list])
  const view = renderHook(() => useRenameList(list.id), { wrapper })
  return { ...view, queryClient: wrapper.queryClient }
}

describe('useRenameList', () => {
  it('renames the list and refreshes the editor and the dashboard', async () => {
    const list = makeList()
    const title = faker.lorem.words(2)
    renameList.mockResolvedValue({ id: list.id, title })
    const { result, queryClient } = renderRename(list)

    act(() => result.current.mutate(title))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(renameList).toHaveBeenCalledWith(list.id, title)
    expect(
      queryClient.getQueryState(listKeys.detail(list.id)).isInvalidated,
    ).toBe(true)
    expect(queryClient.getQueryState(listKeys.mine()).isInvalidated).toBe(true)
  })

  it('refreshes even when the rename fails', async () => {
    const list = makeList()
    renameList.mockRejectedValue(new ApiError('unknown'))
    const { result, queryClient } = renderRename(list)

    act(() => result.current.mutate(faker.lorem.word()))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(
      queryClient.getQueryState(listKeys.detail(list.id)).isInvalidated,
    ).toBe(true)
  })
})
