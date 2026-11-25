import { describe, expect, it, vi } from 'vitest'
import { faker } from '@faker-js/faker'
import { supabase } from '@/lib/supabase'
import { ApiError } from '@/lib/errors'
import { makeItem, makeItemFields, makeList } from '@/test/factories'
import { mockQueryBuilder } from '@/test/supabaseMock'
import { createItem, deleteItem, fetchEditableList, updateItem } from './api'

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }))

const dbError = { code: '42501', message: 'permission denied' }

function mockQuery(result) {
  const builder = mockQueryBuilder(result)
  supabase.from.mockReturnValue(builder)
  return builder
}

const itemFields = makeItemFields()

describe('fetchEditableList', () => {
  it('returns the list with its items in creation order', async () => {
    const list = { ...makeList(), items: [makeItem(), makeItem()] }
    const builder = mockQuery({ data: list, error: null })

    const result = await fetchEditableList(list.id)

    expect(supabase.from).toHaveBeenCalledWith('lists')
    expect(builder.eq).toHaveBeenCalledWith('id', list.id)
    expect(builder.order).toHaveBeenCalledWith('position', {
      referencedTable: 'items',
    })
    expect(builder.order).toHaveBeenCalledWith('created_at', {
      referencedTable: 'items',
    })
    expect(result).toEqual(list)
  })

  it('never asks for reservation data', async () => {
    const builder = mockQuery({ data: makeList(), error: null })

    await fetchEditableList(faker.string.uuid())

    expect(builder.select.mock.calls[0][0]).not.toMatch(/reserv/)
  })

  it('throws "not-found" when the list is missing or not the owner\'s', async () => {
    mockQuery({ data: null, error: null })

    await expect(fetchEditableList(faker.string.uuid())).rejects.toMatchObject({
      code: 'not-found',
    })
  })

  it('throws "not-found" for a malformed id', async () => {
    mockQuery({ data: null, error: { code: '22P02', message: 'invalid' } })

    await expect(fetchEditableList('abc')).rejects.toMatchObject({
      code: 'not-found',
    })
  })
})

describe('createItem', () => {
  it('inserts the item into that list', async () => {
    const listId = faker.string.uuid()
    const created = makeItem()
    const builder = mockQuery({ data: created, error: null })

    const result = await createItem(listId, itemFields)

    expect(supabase.from).toHaveBeenCalledWith('items')
    expect(builder.insert).toHaveBeenCalledWith({
      ...itemFields,
      list_id: listId,
    })
    expect(result).toEqual(created)
  })

  it('throws "item_limit" when the list already has 200 items', async () => {
    mockQuery({ data: null, error: { code: 'P0001', message: 'item_limit' } })

    await expect(
      createItem(faker.string.uuid(), itemFields),
    ).rejects.toMatchObject({ code: 'item_limit' })
  })
})

describe('updateItem', () => {
  it('updates that item', async () => {
    const id = faker.string.uuid()
    const builder = mockQuery({ data: makeItem({ id }), error: null })

    await updateItem(id, itemFields)

    expect(builder.update).toHaveBeenCalledWith(itemFields)
    expect(builder.eq).toHaveBeenCalledWith('id', id)
  })

  it('throws an ApiError when a check constraint rejects it', async () => {
    mockQuery({ data: null, error: { code: '23514', message: 'check' } })

    await expect(
      updateItem(faker.string.uuid(), itemFields),
    ).rejects.toBeInstanceOf(ApiError)
  })
})

describe('deleteItem', () => {
  it('deletes that item', async () => {
    const id = faker.string.uuid()
    const builder = mockQuery({ error: null })

    await deleteItem(id)

    expect(builder.delete).toHaveBeenCalled()
    expect(builder.eq).toHaveBeenCalledWith('id', id)
  })

  it('throws an ApiError when the delete fails', async () => {
    mockQuery({ error: dbError })

    await expect(deleteItem(faker.string.uuid())).rejects.toBeInstanceOf(
      ApiError,
    )
  })
})
