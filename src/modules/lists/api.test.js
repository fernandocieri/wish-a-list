import { describe, expect, it, vi } from 'vitest'
import { faker } from '@faker-js/faker'
import { supabase } from '@/lib/supabase'
import { ApiError } from '@/lib/errors'
import { makeList } from '@/test/factories'
import { mockQueryBuilder } from '@/test/supabaseMock'
import {
  createList,
  deleteList,
  duplicateList,
  fetchMyLists,
  renameList,
} from './api'

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn(), rpc: vi.fn() },
}))

const dbError = { code: '42501', message: 'permission denied' }

function mockQuery(result) {
  const builder = mockQueryBuilder(result)
  supabase.from.mockReturnValue(builder)
  return builder
}

describe('fetchMyLists', () => {
  it('returns the lists with a flat item count', async () => {
    const list = makeList()
    mockQuery({ data: [{ ...list, items: [{ count: 3 }] }], error: null })

    const result = await fetchMyLists()

    expect(supabase.from).toHaveBeenCalledWith('lists')
    expect(result).toEqual([{ ...list, item_count: 3 }])
  })

  it('never asks for reservation data', async () => {
    const builder = mockQuery({ data: [], error: null })

    await fetchMyLists()

    expect(builder.select.mock.calls[0][0]).not.toMatch(/reserv/)
  })

  it('throws an ApiError when the query fails', async () => {
    mockQuery({ data: null, error: dbError })

    await expect(fetchMyLists()).rejects.toBeInstanceOf(ApiError)
  })
})

describe('createList', () => {
  it('inserts only the trimmed title and returns the new list', async () => {
    const list = makeList()
    const builder = mockQuery({ data: list, error: null })

    const result = await createList(`  ${list.title}  `)

    expect(builder.insert).toHaveBeenCalledWith({ title: list.title })
    expect(result).toEqual(list)
  })

  it('throws "list_limit" when the owner already has 20 lists', async () => {
    mockQuery({ data: null, error: { code: 'P0001', message: 'list_limit' } })

    await expect(createList(faker.lorem.words(2))).rejects.toMatchObject({
      code: 'list_limit',
    })
  })
})

describe('renameList', () => {
  it('updates only the title of that list', async () => {
    const list = makeList()
    const builder = mockQuery({ data: list, error: null })

    await renameList(list.id, list.title)

    expect(builder.update).toHaveBeenCalledWith({ title: list.title })
    expect(builder.eq).toHaveBeenCalledWith('id', list.id)
  })

  it('throws an ApiError when the update fails', async () => {
    mockQuery({ data: null, error: dbError })

    await expect(
      renameList(faker.string.uuid(), faker.lorem.word()),
    ).rejects.toBeInstanceOf(ApiError)
  })
})

describe('duplicateList', () => {
  it('calls duplicate_list with the source id and the trimmed title', async () => {
    const source = makeList()
    const newId = faker.string.uuid()
    supabase.rpc.mockResolvedValue({ data: newId, error: null })

    const result = await duplicateList(source.id, `  ${source.title}  `)

    expect(supabase.rpc).toHaveBeenCalledWith('duplicate_list', {
      p_list_id: source.id,
      p_title: source.title,
    })
    expect(result).toEqual({ id: newId })
  })

  it('throws "not-found" when the source is not one of the owner\'s lists', async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: null })

    await expect(
      duplicateList(faker.string.uuid(), faker.lorem.word()),
    ).rejects.toMatchObject({ code: 'not-found' })
  })

  it('throws "list_limit" when the owner already has 20 lists', async () => {
    supabase.rpc.mockResolvedValue({
      data: null,
      error: { code: 'P0001', message: 'list_limit' },
    })

    await expect(
      duplicateList(faker.string.uuid(), faker.lorem.word()),
    ).rejects.toMatchObject({ code: 'list_limit' })
  })
})

describe('deleteList', () => {
  it('deletes that list', async () => {
    const id = faker.string.uuid()
    const builder = mockQuery({ error: null })

    await deleteList(id)

    expect(builder.delete).toHaveBeenCalled()
    expect(builder.eq).toHaveBeenCalledWith('id', id)
  })

  it('throws an ApiError when the delete fails', async () => {
    mockQuery({ error: dbError })

    await expect(deleteList(faker.string.uuid())).rejects.toBeInstanceOf(
      ApiError,
    )
  })
})
