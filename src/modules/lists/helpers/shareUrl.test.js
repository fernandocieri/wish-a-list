import { describe, expect, it } from 'vitest'
import { shareUrl } from './shareUrl'

describe('shareUrl', () => {
  it('builds the friend link from the slug', () => {
    expect(shareUrl('ana-7KpQmZ9vR4tL8wNc', 'https://example.com')).toBe(
      'https://example.com/l/ana-7KpQmZ9vR4tL8wNc',
    )
  })

  it('defaults to the current origin', () => {
    expect(shareUrl('abc')).toBe(`${window.location.origin}/l/abc`)
  })
})
