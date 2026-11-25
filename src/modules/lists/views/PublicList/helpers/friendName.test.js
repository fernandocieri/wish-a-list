import { describe, expect, it, vi } from 'vitest'
import { faker } from '@faker-js/faker'
import { loadFriendName, saveFriendName } from './friendName'

describe('friendName', () => {
  it('is empty before anything is saved', () => {
    expect(loadFriendName()).toBe('')
  })

  it('returns the saved name, trimmed', () => {
    const name = faker.person.firstName()

    saveFriendName(`  ${name} `)

    expect(loadFriendName()).toBe(name)
  })

  it('does not throw when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    expect(() => saveFriendName('Ana')).not.toThrow()
    expect(loadFriendName()).toBe('')
  })
})
