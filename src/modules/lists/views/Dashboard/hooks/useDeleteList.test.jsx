import { describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { ApiError } from '@/lib/errors'
import { makeList } from '@/test/factories'
import { createQueryWrapper } from '@/test/queryWrapper'
import { deleteList } from '../../../api'
import { listKeys } from '../../../queries'
import { useDeleteList } from './useDeleteList'

vi.mock('../../../api', () => ({ deleteList: vi.fn() }))

function renderDelete(list) {
  const wrapper = createQueryWrapper()
  wrapper.queryClient.setQueryData(listKeys.mine(), [list])
  wrapper.queryClient.setQueryData(listKeys.detail(list.id), list)
  const view = renderHook(useDeleteList, { wrapper })
  return { ...view, queryClient: wrapper.queryClient }
}

describe('useDeleteList', () => {
  it('deletes the list, drops its cached detail and refreshes "my lists"', async () => {
    const list = makeList()
    deleteList.mockResolvedValue()
    const { result, queryClient } = renderDelete(list)

    act(() => result.current.mutate(list.id))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(deleteList.mock.calls[0][0]).toBe(list.id)
    expect(queryClient.getQueryData(listKeys.detail(list.id))).toBeUndefined()
    expect(queryClient.getQueryState(listKeys.mine()).isInvalidated).toBe(true)
  })

  it('refreshes "my lists" even when the delete fails', async () => {
    const list = makeList()
    deleteList.mockRejectedValue(new ApiError('unknown'))
    const { result, queryClient } = renderDelete(list)

    act(() => result.current.mutate(list.id))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(queryClient.getQueryData(listKeys.detail(list.id))).toEqual(list)
    expect(queryClient.getQueryState(listKeys.mine()).isInvalidated).toBe(true)
  })
})
