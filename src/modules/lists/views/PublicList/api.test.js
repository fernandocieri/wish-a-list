import { describe, expect, it, vi } from 'vitest'
import { faker } from '@faker-js/faker'
import { supabase } from '@/lib/supabase'
import { ApiError } from '@/lib/errors'
import { fetchReservations, reserveItem } from './api'

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }))

const makeRow = () => ({
  item_id: faker.string.alphanumeric(8),
  reserved_by: faker.person.firstName(),
  reserved_at: faker.date.recent().toISOString(),
})

function mockSelect(result) {
  const select = vi.fn().mockResolvedValue(result)
  supabase.from.mockReturnValue({ select })
  return select
}

function mockInsert(result) {
  const single = vi.fn().mockResolvedValue(result)
  const insert = vi.fn(() => ({ select: () => ({ single }) }))
  supabase.from.mockReturnValue({ insert })
  return insert
}

describe('fetchReservations', () => {
  it('returns reservations keyed by item id', async () => {
    const row = makeRow()
    mockSelect({ data: [row], error: null })

    const result = await fetchReservations()

    expect(supabase.from).toHaveBeenCalledWith('reservations')
    expect(result).toEqual({ [row.item_id]: { reservedBy: row.reserved_by, reservedAt: row.reserved_at } })
  })

  it('throws an ApiError when the query fails', async () => {
    mockSelect({ data: null, error: { code: '42501', message: 'permission denied' } })

    await expect(fetchReservations()).rejects.toMatchObject({ name: 'ApiError', code: 'unknown' })
  })
})

describe('reserveItem', () => {
  it('inserts the reservation and returns it', async () => {
    const row = makeRow()
    const insert = mockInsert({ data: row, error: null })

    const result = await reserveItem(row.item_id, row.reserved_by)

    expect(insert).toHaveBeenCalledWith({ item_id: row.item_id, reserved_by: row.reserved_by })
    expect(result).toEqual({ reservedBy: row.reserved_by, reservedAt: row.reserved_at })
  })

  it('throws "already-reserved" when the insert hits a unique violation', async () => {
    mockInsert({ data: null, error: { code: '23505', message: 'duplicate key value' } })

    const promise = reserveItem(faker.string.alphanumeric(8), faker.person.firstName())

    await expect(promise).rejects.toBeInstanceOf(ApiError)
    await expect(promise).rejects.toMatchObject({ code: 'already-reserved' })
  })
})
