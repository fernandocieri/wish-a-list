import { describe, expect, it, vi } from 'vitest'
import { faker } from '@faker-js/faker'
import { supabase } from '@/lib/supabase'
import { ApiError } from '@/lib/errors'
import { ensureSession } from '@/modules/auth'
import { makePublicList } from '@/test/factories'
import { mockQueryBuilder } from '@/test/supabaseMock'
import { fetchPublicList, reserveItem, undoReservation } from './api'

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn(), rpc: vi.fn() },
}))
vi.mock('@/modules/auth', () => ({ ensureSession: vi.fn() }))

describe('fetchPublicList', () => {
  it('reads the list through get_list with the slug', async () => {
    const list = makePublicList()
    const slug = faker.string.alphanumeric(16)
    supabase.rpc.mockResolvedValue({ data: list, error: null })

    const result = await fetchPublicList(slug)

    expect(supabase.rpc).toHaveBeenCalledWith('get_list', { p_slug: slug })
    expect(result).toEqual(list)
  })

  it('throws "not-found" when get_list returns null', async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: null })

    await expect(fetchPublicList('x'.repeat(65))).rejects.toMatchObject({
      code: 'not-found',
    })
  })

  it('throws an ApiError when the call fails', async () => {
    supabase.rpc.mockResolvedValue({
      data: null,
      error: { code: '42501', message: 'permission denied' },
    })

    await expect(fetchPublicList('abc')).rejects.toBeInstanceOf(ApiError)
  })
})

describe('reserveItem', () => {
  it('ensures a session before inserting the trimmed name', async () => {
    const itemId = faker.string.uuid()
    const name = faker.person.firstName()
    const builder = mockQueryBuilder({ data: null, error: null })
    supabase.from.mockReturnValue(builder)

    await reserveItem(itemId, ` ${name} `)

    expect(ensureSession).toHaveBeenCalled()
    expect(supabase.from).toHaveBeenCalledWith('reservations')
    expect(builder.insert).toHaveBeenCalledWith({
      item_id: itemId,
      reserved_by: name,
    })
  })

  it('does not insert when no session can be created', async () => {
    ensureSession.mockRejectedValue(new ApiError('anonymous-disabled'))

    await expect(
      reserveItem(faker.string.uuid(), faker.person.firstName()),
    ).rejects.toMatchObject({ code: 'anonymous-disabled' })
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it.each([
    [{ code: '23505', message: 'duplicate key value' }, 'already-reserved'],
    [{ code: 'P0001', message: 'reservation_limit' }, 'reservation_limit'],
  ])('maps %o to %s', async (error, code) => {
    supabase.from.mockReturnValue(mockQueryBuilder({ data: null, error }))

    await expect(
      reserveItem(faker.string.uuid(), faker.person.firstName()),
    ).rejects.toMatchObject({ name: 'ApiError', code })
  })
})

describe('undoReservation', () => {
  it('deletes the reservation of the item', async () => {
    const itemId = faker.string.uuid()
    const builder = mockQueryBuilder({
      data: [{ id: faker.string.uuid() }],
      error: null,
    })
    supabase.from.mockReturnValue(builder)

    await undoReservation(itemId)

    expect(supabase.from).toHaveBeenCalledWith('reservations')
    expect(builder.delete).toHaveBeenCalled()
    expect(builder.eq).toHaveBeenCalledWith('item_id', itemId)
  })

  it('throws "not-found" when nothing was deleted (not mine, or already gone)', async () => {
    supabase.from.mockReturnValue(mockQueryBuilder({ data: [], error: null }))

    await expect(undoReservation(faker.string.uuid())).rejects.toMatchObject({
      code: 'not-found',
    })
  })

  it('throws an ApiError when the delete fails', async () => {
    supabase.from.mockReturnValue(
      mockQueryBuilder({ data: null, error: { code: '42501' } }),
    )

    await expect(undoReservation(faker.string.uuid())).rejects.toBeInstanceOf(
      ApiError,
    )
  })
})
