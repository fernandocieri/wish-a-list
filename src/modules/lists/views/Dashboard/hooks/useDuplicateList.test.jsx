import { describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { ApiError } from '@/lib/errors'
import { makeList } from '@/test/factories'
import { createQueryWrapper } from '@/test/queryWrapper'
import { duplicateList } from '../../../api'
import { listKeys } from '../../../queries'
import { copyTitle } from '../helpers/copyTitle'
import { useDuplicateList } from './useDuplicateList'

vi.mock('../../../api', () => ({ duplicateList: vi.fn() }))

function renderDuplicate() {
  const wrapper = createQueryWrapper()
  wrapper.queryClient.setQueryData(listKeys.mine(), [])
  const view = renderHook(useDuplicateList, { wrapper })
  return { ...view, queryClient: wrapper.queryClient }
}

describe('useDuplicateList', () => {
  it('copies the list under the copy title and refreshes "my lists"', async () => {
    const list = makeList()
    const copy = { id: faker.string.uuid() }
    duplicateList.mockResolvedValue(copy)
    const { result, queryClient } = renderDuplicate()

    act(() => result.current.mutate(list))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(duplicateList.mock.calls[0]).toEqual([
      list.id,
      copyTitle(list.title),
    ])
    expect(result.current.data).toEqual(copy)
    expect(queryClient.getQueryState(listKeys.mine()).isInvalidated).toBe(true)
  })

  it('exposes "list_limit" and leaves "my lists" alone when the owner is at the limit', async () => {
    duplicateList.mockRejectedValue(new ApiError('list_limit'))
    const { result, queryClient } = renderDuplicate()

    act(() => result.current.mutate(makeList()))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error.code).toBe('list_limit')
    expect(queryClient.getQueryState(listKeys.mine()).isInvalidated).toBe(false)
  })
})
