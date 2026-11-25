import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { ApiError } from '@/lib/errors'
import { makeItem, makeList } from '@/test/factories'
import { createQueryWrapper } from '@/test/queryWrapper'
import { fetchEditableList } from '../api'
import { useEditableList } from './useEditableList'

vi.mock('../api', () => ({ fetchEditableList: vi.fn() }))

describe('useEditableList', () => {
  it('loads the list by id', async () => {
    const list = { ...makeList(), items: [makeItem()] }
    fetchEditableList.mockResolvedValue(list)

    const { result } = renderHook(() => useEditableList(list.id), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetchEditableList).toHaveBeenCalledWith(list.id)
    expect(result.current.data).toEqual(list)
  })

  it('exposes "not-found" for a list that is not the owner\'s', async () => {
    fetchEditableList.mockRejectedValue(new ApiError('not-found'))

    const { result } = renderHook(() => useEditableList('x'), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error.code).toBe('not-found')
  })
})
