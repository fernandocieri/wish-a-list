import { describe, expect, it } from 'vitest'
import { publicListKeys } from './queries'

describe('publicListKeys', () => {
  it('never shares the owner data root', () => {
    expect(publicListKeys.all[0]).not.toBe('lists')
    expect(publicListKeys.reservations()[0]).toBe(publicListKeys.all[0])
  })
})
