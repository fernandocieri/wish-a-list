import { describe, expect, it } from 'vitest'
import { isValidLink, MAX_LINK_LENGTH } from './validateLink'

describe('isValidLink', () => {
  it.each([
    'https://www.amazon.es/dp/B0000',
    'http://example.com',
    'HTTPS://EXAMPLE.COM/path?q=1',
  ])('accepts %s', (link) => {
    expect(isValidLink(link)).toBe(true)
  })

  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'ftp://example.com',
    'www.example.com',
    'https://',
    '',
    null,
  ])('rejects %o', (link) => {
    expect(isValidLink(link)).toBe(false)
  })

  it('rejects links longer than the database allows', () => {
    const base = 'https://example.com/'
    const atLimit = base + 'a'.repeat(MAX_LINK_LENGTH - base.length)

    expect(isValidLink(atLimit)).toBe(true)
    expect(isValidLink(atLimit + 'a')).toBe(false)
  })
})
