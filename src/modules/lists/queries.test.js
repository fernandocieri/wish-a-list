import { describe, expect, it, vi } from 'vitest'
import { faker } from '@faker-js/faker'
import { listKeys } from './queries'

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }))

describe('listKeys', () => {
  it('keeps every owner key under the "lists" root', () => {
    expect(listKeys.mine()[0]).toBe('lists')
    expect(listKeys.detail(faker.string.uuid())[0]).toBe('lists')
  })
})
