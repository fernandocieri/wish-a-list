import { describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { ApiError } from '@/lib/errors'
import { makeList } from '@/test/factories'
import { createQueryWrapper } from '@/test/queryWrapper'
import { createList } from '../../../api'
import { listKeys } from '../../../queries'
import { useCreateList } from './useCreateList'

vi.mock('../../../api', () => ({ createList: vi.fn() }))

function renderCreate() {
  const wrapper = createQueryWrapper()
  wrapper.queryClient.setQueryData(listKeys.mine(), [])
  const view = renderHook(useCreateList, { wrapper })
  return { ...view, queryClient: wrapper.queryClient }
}

describe('useCreateList', () => {
  it('creates the list and refreshes "my lists"', async () => {
    const list = makeList()
    createList.mockResolvedValue(list)
    const { result, queryClient } = renderCreate()

    act(() => result.current.mutate(list.title))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(createList.mock.calls[0][0]).toBe(list.title)
    expect(result.current.data).toEqual(list)
    expect(queryClient.getQueryState(listKeys.mine()).isInvalidated).toBe(true)
  })

  it('exposes "list_limit" when the owner is at the limit', async () => {
    createList.mockRejectedValue(new ApiError('list_limit'))
    const { result } = renderCreate()

    act(() => result.current.mutate('x'))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error.code).toBe('list_limit')
  })
})
