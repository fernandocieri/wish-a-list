import { describe, expect, it, vi } from 'vitest'
import { publicListKeys, publicListQueryOptions } from './queries'

vi.mock('./api', () => ({ fetchPublicList: vi.fn() }))

describe('publicListKeys', () => {
  it('never shares the owner data root', () => {
    expect(publicListKeys.all[0]).not.toBe('lists')
    expect(publicListKeys.detail('abc')[0]).toBe(publicListKeys.all[0])
  })
})

describe('publicListQueryOptions', () => {
  it('is always stale so a refocus refetches it', () => {
    expect(publicListQueryOptions('abc').staleTime).toBe(0)
  })
})
