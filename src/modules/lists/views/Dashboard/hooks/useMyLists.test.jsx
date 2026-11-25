import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { ApiError } from '@/lib/errors'
import { makeList } from '@/test/factories'
import { createQueryWrapper } from '@/test/queryWrapper'
import { fetchMyLists } from '../../../api'
import { useMyLists } from './useMyLists'

vi.mock('../../../api', () => ({ fetchMyLists: vi.fn() }))

describe('useMyLists', () => {
  it("returns the owner's lists", async () => {
    const lists = [makeList(), makeList()]
    fetchMyLists.mockResolvedValue(lists)

    const { result } = renderHook(useMyLists, {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(lists)
  })

  it('exposes the ApiError when loading fails', async () => {
    fetchMyLists.mockRejectedValue(new ApiError('unknown'))

    const { result } = renderHook(useMyLists, {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error.code).toBe('unknown')
  })
})
